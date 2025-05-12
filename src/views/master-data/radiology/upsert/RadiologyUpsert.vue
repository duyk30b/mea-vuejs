<script setup lang="ts">
import { computed, nextTick, onBeforeMount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../../common/VueButton.vue'
import { IconPrint, IconTrash } from '../../../../common/icon'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import {
  InputFilter,
  InputMoney,
  InputNumber,
  InputText,
  VueSelect,
} from '../../../../common/vue-form'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../../common/vue-tabs'
import CKEditor5Vue from '../../../../common/ckeditor5-vue/CKEditor5Vue.vue'
import { useMeStore } from '../../../../modules/_me/me.store'
import { Commission, CommissionCalculatorType, InteractType } from '../../../../modules/commission'
import { Customer } from '../../../../modules/customer'
import {
  PrintHtml,
  printHtmlCompiledTemplate,
  PrintHtmlService,
} from '../../../../modules/print-html'
import { Radiology, RadiologyApi, RadiologyService } from '../../../../modules/radiology'
import { RadiologyGroup, RadiologyGroupService } from '../../../../modules/radiology-group'
import { Role, RoleService } from '../../../../modules/role'
import { Ticket } from '../../../../modules/ticket'
import { ESDom } from '../../../../utils'
import ModalSelectRadiologyExample from './ModalSelectRadiologyExample.vue'

const TABS_KEY = {
  BASIC: 'BASIC',
  PRINT_SETTING: 'PRINT_SETTING',
  ROLE_AND_COMMISSION: 'ROLE_AND_COMMISSION',
}

const modalSelectRadiologyExample = ref<InstanceType<typeof ModalSelectRadiologyExample>>()
const iframe = ref<HTMLIFrameElement>()

const route = useRoute()
const router = useRouter()

const meStore = useMeStore()
const { organization } = meStore

const radiologyRoot = ref(Radiology.blank())
const radiology = ref(Radiology.blank())

const radiologyGroupAll = ref<RadiologyGroup[]>([])
const printHtmlOptions = ref<{ text: string; value: number }[]>([])
const roleOptions = ref<{ value: number; text: string; data: Role }[]>([])

const activeTab = ref(TABS_KEY.BASIC)
const saveLoading = ref(false)

const ticketDemo = Ticket.blank()
ticketDemo.note = 'Viêm mũi dị ứng'
ticketDemo.startedAt = Date.now()
ticketDemo.customer = Customer.example()

onBeforeMount(async () => {
  const promiseInit = await Promise.all([
    RadiologyGroupService.list({}),
    PrintHtmlService.list({}),
    PrintHtmlService.getSystemList(),
    RoleService.list({}),
  ])
  radiologyGroupAll.value = promiseInit[0]
  printHtmlOptions.value = [
    { text: 'Mặc định', value: 0 },
    ...promiseInit[1].map((i) => {
      return { value: i.id, text: i.name }
    }),
    ...promiseInit[2].map((i) => {
      return { value: i.id, text: i.name }
    }),
  ]
  roleOptions.value = promiseInit[3].map((i) => ({ value: i.id, text: i.name, data: i }))
})

onMounted(async () => {
  const radiologyId = Number(route.params.id)
  if (radiologyId) {
    const radiologyResponse = await RadiologyApi.detail(radiologyId, {
      relation: { printHtml: true, commissionList: true },
    })
    radiologyRoot.value = radiologyResponse
    radiology.value = Radiology.from(radiologyResponse)
  } else {
    radiology.value = Radiology.blank()
    const radiologyAll = await RadiologyService.list({})
    radiology.value.priority = radiologyAll.length + 1
  }
  if (!radiology.value.commissionList?.length) {
    handleAddCommission()
  }
  updatePreview()
})

const hasChangeData = computed(() => {
  if (!Radiology.equal(radiology.value, radiologyRoot.value)) {
    return true
  }
  if (
    !Commission.equalList(
      (radiology.value.commissionList || []).filter((i) => !!i.roleId),
      radiologyRoot.value.commissionList || [],
    )
  ) {
    return true
  }
  return false
})

const handleSave = async () => {
  for (let i = 0; i < (radiology.value.commissionList?.length || 0); i++) {
    const element = radiology.value.commissionList![i]
    if (
      element.commissionCalculatorType === CommissionCalculatorType.PercentActual ||
      element.commissionCalculatorType === CommissionCalculatorType.PercentExpected
    ) {
      if (element.commissionValue >= 1000) {
        return AlertStore.addError('Công thức tính hoa hồng theo % : không thể gán giá trị >= 1000')
      }
    }
  }

  try {
    saveLoading.value = true
    if (radiology.value.id) {
      const radiologyResponse = await RadiologyService.updateOne(
        radiology.value.id,
        radiology.value,
      )
      Object.assign(radiology.value, Radiology.from(radiologyResponse))
      Object.assign(radiologyRoot.value, Radiology.from(radiologyResponse))
      AlertStore.addSuccess('Cập nhật thành công', 1000)
    } else {
      const res = await RadiologyService.createOne(radiology.value)
      router.push({ name: 'RadiologyList' })
      AlertStore.addSuccess('Tạo mới thành công', 500)

      radiology.value = Radiology.from(res)
      radiologyRoot.value = Radiology.from(res)
    }
  } catch (error) {
    console.log('🚀 ~ file: RadiologyUpsert.vue:91 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const updatePreview = async () => {
  if (!iframe.value) return
  const doc = iframe.value?.contentDocument || iframe.value?.contentWindow?.document
  if (!doc) return

  let printHtmlId = radiology.value.printHtmlId
  let printHtml: PrintHtml | undefined
  if (printHtmlId !== 0) {
    printHtml = await PrintHtmlService.detail(printHtmlId)
    if (!printHtml || !printHtml.content) {
      printHtmlId = 0
    }
  }
  if (printHtmlId === 0) {
    printHtmlId = meStore.rootSetting.printDefault.radiology
    printHtml = await PrintHtmlService.detail(printHtmlId)
  }

  if (!printHtml || !printHtml.content) {
    return
  }

  const data = JSON.parse(printHtml.dataExample || '{}')
  data.radiology = Radiology.from(radiology.value)
  data.result = radiology.value.resultDefault
  data.description = radiology.value.descriptionDefault

  const textDom = printHtmlCompiledTemplate({
    organization,
    ticket: ticketDemo,
    data,
    masterData: {},
    printHtml,
  })

  doc.open()
  doc.write(textDom)
  doc.close()
}

const handleUpdateTabShow = () => {
  nextTick(() => updatePreview())
}

const handleModalSelectRadiologyExampleSuccess = (radiologyProp: Radiology) => {
  radiology.value.descriptionDefault = radiologyProp.descriptionDefault
  radiology.value.resultDefault = radiologyProp.resultDefault
  radiology.value.printHtmlId = radiologyProp.printHtmlId
}

const handleClickDelete = async () => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa phiếu: ' + radiology.value.name,
    content: 'Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    onOk: async () => {
      try {
        const response = await RadiologyService.destroyOne(radiology.value.id)
        if (response.success) {
          router.push({ name: 'RadiologyList' })
        } else {
          ModalStore.alert({
            title: 'Không thể xóa phiếu CĐHA khi đã được chỉ định',
            content: [
              'Nếu bắt buộc phải xóa, bạn cần phải xóa tất cả phiếu khám liên quan trước',
              `Phiếu khám liên quan: ${response.data.ticketRadiologyList
                .map((i) => i.ticketId)
                .join(', ')}`,
            ],
          })
        }
      } catch (error) {
        console.log('🚀 ~ file: RadiologyUpsert.vue:165 ~ onOk: ~ error:', error)
      }
    },
  })
}

const startTestPrint = async () => {
  try {
    let printHtmlId = radiology.value.printHtmlId
    let printHtml: PrintHtml | undefined

    if (printHtmlId !== 0) {
      printHtml = await PrintHtmlService.detail(printHtmlId)
      if (!printHtml || !printHtml.content) {
        printHtmlId = 0
      }
    }
    if (printHtmlId === 0) {
      printHtmlId = meStore.rootSetting.printDefault.radiology
      printHtml = await PrintHtmlService.detail(printHtmlId)
    }
    if (!printHtml || !printHtml.content) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const data = JSON.parse(printHtml.dataExample || '{}')
    data.radiology = Radiology.from(radiology.value)
    data.result = radiology.value.resultDefault
    data.description = radiology.value.descriptionDefault

    const textDom = printHtmlCompiledTemplate({
      organization,
      ticket: ticketDemo,
      data,
      masterData: {},
      printHtml,
    })

    await ESDom.startPrint('iframe-print', textDom)
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
  }
}

const handleAddCommission = () => {
  const commissionBlank = Commission.blank()
  commissionBlank.interactType = InteractType.Radiology
  commissionBlank.interactId = radiology.value.id

  if (!radiology.value.commissionList) {
    radiology.value.commissionList = []
  }
  radiology.value.commissionList!.push(commissionBlank)
}
</script>

<template>
  <ModalSelectRadiologyExample
    ref="modalSelectRadiologyExample"
    @select="handleModalSelectRadiologyExampleSuccess"
  />
  <div class="page-header">
    <div class="page-header-content">
      <IconPrint />
      Thông tin phiếu {{ radiology.name }}
    </div>
  </div>

  <form class="md:mx-4 mt-4 my-8 p-4 bg-white" @submit.prevent="handleSave">
    <VueTabs v-model:tabShow="activeTab" @update:tab-show="handleUpdateTabShow">
      <template #menu>
        <VueTabMenu :tabKey="TABS_KEY.BASIC">Cơ bản</VueTabMenu>
        <VueTabMenu :tabKey="TABS_KEY.PRINT_SETTING">
          <IconPrint />
          Dữ liệu và In
        </VueTabMenu>
        <VueTabMenu :tabKey="TABS_KEY.ROLE_AND_COMMISSION">Vai trò và hoa hồng</VueTabMenu>
      </template>
      <template #panel>
        <VueTabPanel :tabKey="TABS_KEY.BASIC">
          <div class="mt-4 flex flex-wrap gap-4" style="max-width: 900px">
            <div style="flex-basis: 90%; flex-grow: 1">
              <div class="flex gap-4 justify-start">
                <span>Tên phiếu</span>
              </div>
              <div>
                <InputText v-model:value="radiology.name" required />
              </div>
            </div>

            <div style="flex-basis: 90%; flex-grow: 1">
              <div class="">Nhóm</div>
              <div>
                <VueSelect
                  v-model:value="radiology.radiologyGroupId"
                  :options="
                    radiologyGroupAll.map((group) => ({ value: group.id, text: group.name }))
                  "
                />
              </div>
            </div>

            <div style="flex-basis: 90%; flex-grow: 1">
              <div>Số thứ tự trong danh sách</div>
              <div style="flex: 1">
                <InputNumber v-model:value="radiology.priority" :validate="{ GTE: 0 }" />
              </div>
            </div>

            <div style="flex-basis: 90%; flex-grow: 1">
              <div>Giá vốn</div>
              <div style="flex: 1">
                <InputMoney
                  v-model:value="radiology.costPrice"
                  :validate="{ GTE: 0 }"
                  style="width: 100%"
                />
              </div>
            </div>
            <div style="flex-basis: 90%; flex-grow: 1">
              <div>Giá bán</div>
              <div style="flex: 1">
                <InputMoney
                  v-model:value="radiology.price"
                  :validate="{ GTE: 0 }"
                  style="width: 100%"
                />
              </div>
            </div>
          </div>
        </VueTabPanel>
        <VueTabPanel :tabKey="TABS_KEY.PRINT_SETTING">
          <div class="mt-4 flex flex-wrap gap-4">
            <div style="flex-basis: 90%; flex-grow: 1">
              <div class="">Chọn mẫu in</div>
              <div>
                <VueSelect
                  v-model:value="radiology.printHtmlId"
                  :options="printHtmlOptions"
                  @select-item="updatePreview"
                />
              </div>
            </div>

            <div style="flex-basis: 600px; flex-grow: 1; min-height: 800px" class="flex flex-col">
              <div>
                <div>Nội dung yêu cầu thêm mặc định</div>
                <div>
                  <InputText v-model:value="radiology.requestNoteDefault" />
                </div>
              </div>
              <div class="mt-4">
                <span>Nội dung mô tả mặc định</span>
                <span class="ml-4">
                  <a @click="modalSelectRadiologyExample?.openModal()">( Lấy từ dữ liệu mẫu )</a>
                </span>
              </div>
              <div style="flex-grow: 1">
                <CKEditor5Vue
                  v-model:value="radiology.descriptionDefault"
                  @update:value="updatePreview"
                />
              </div>
              <div class="mt-4">
                <div>Kết luận mặc định</div>
                <div>
                  <InputText v-model:value="radiology.resultDefault" />
                </div>
              </div>
            </div>

            <div style="flex-basis: 600px; flex-grow: 1; min-height: 800px" class="flex flex-col">
              <div class="flex justify-end">
                <a @click="startTestPrint">In thử</a>
              </div>
              <div style="flex-grow: 1">
                <iframe
                  ref="iframe"
                  class="preview-iframe"
                  style="width: 100%; height: 100%; text-align: center"
                ></iframe>
              </div>
            </div>
          </div>
        </VueTabPanel>
        <VueTabPanel :tabKey="TABS_KEY.ROLE_AND_COMMISSION">
          <div class="mt-4">
            <div
              v-for="(commission, index) in radiology.commissionList"
              :key="index"
              class="mt-4 flex flex-wrap gap-2"
            >
              <div style="flex-grow: 1; flex-basis: 250px">
                <div>Vai trò</div>
                <div>
                  <InputFilter
                    v-model:value="radiology.commissionList![index].roleId"
                    :options="roleOptions"
                    :maxHeight="120"
                  >
                    <template #option="{ item: { data } }">{{ data.name }}</template>
                  </InputFilter>
                </div>
              </div>
              <div style="flex-grow: 1; flex-basis: 100px">
                <div>Hoa hồng</div>
                <div>
                  <InputNumber
                    :value="commission.commissionValue"
                    @update:value="
                      (v: number) => (radiology.commissionList![index].commissionValue = v)
                    "
                  />
                </div>
              </div>
              <div style="flex-grow: 1; flex-basis: 150px">
                <div>Công thức</div>
                <div>
                  <VueSelect
                    :value="commission.commissionCalculatorType"
                    :options="[
                      { value: CommissionCalculatorType.VND, text: 'VNĐ' },
                      {
                        value: CommissionCalculatorType.PercentExpected,
                        text: '% Giá niêm yết',
                      },
                      {
                        value: CommissionCalculatorType.PercentActual,
                        text: '% Giá sau chiết khấu',
                      },
                    ]"
                    @update:value="
                      (v: number) => (radiology.commissionList![index].commissionCalculatorType = v)
                    "
                  />
                </div>
              </div>
              <div style="width: 30px">
                <div>&nbsp;</div>
                <div class="pt-2 flex justify-center">
                  <a
                    style="color: var(--text-red)"
                    @click="radiology.commissionList!.splice(index, 1)"
                  >
                    <IconTrash width="18" height="18" />
                  </a>
                </div>
              </div>
            </div>

            <div class="mt-2">
              <a @click="handleAddCommission">✚ Thêm vai trò</a>
            </div>
          </div>
        </VueTabPanel>
      </template>
    </VueTabs>

    <div class="mt-8 flex justify-between">
      <VueButton color="red" type="button" icon="trash" @click="handleClickDelete">Xóa</VueButton>
      <VueButton
        color="blue"
        type="submit"
        :loading="saveLoading"
        icon="save"
        :disabled="!hasChangeData"
      >
        {{ radiology.id ? 'Cập nhật thông tin' : 'Tạo mới' }}
      </VueButton>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
