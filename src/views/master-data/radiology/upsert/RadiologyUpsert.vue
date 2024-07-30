<script setup lang="ts">
import { computed, nextTick, onBeforeMount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../../common/VueButton.vue'
import { IconPrint } from '../../../../common/icon'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputMoney, InputNumber, InputText, VueSelect } from '../../../../common/vue-form'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../../common/vue-tabs'
import WysiwygEditor from '../../../../common/wysiwyg-editor/WysiwygEditor.vue'
import { useMeStore } from '../../../../modules/_me/me.store'
import { Customer } from '../../../../modules/customer'
import {
  PrintHtml,
  printHtmlCompiledTemplate,
  PrintHtmlService,
} from '../../../../modules/print-html'
import { Radiology, RadiologyApi, RadiologyService } from '../../../../modules/radiology'
import { RadiologyGroup, RadiologyGroupService } from '../../../../modules/radiology-group'
import { Ticket } from '../../../../modules/ticket'
import { DDom } from '../../../../utils'
import ModalSelectRadiologyExample from './ModalSelectRadiologyExample.vue'

const TABS_KEY = {
  BASIC: 'BASIC',
  PRINT_SETTING: 'PRINT_SETTING',
}

const modalSelectRadiologyExample = ref<InstanceType<typeof ModalSelectRadiologyExample>>()
const iframe = ref<HTMLIFrameElement>()

const route = useRoute()
const router = useRouter()

const meStore = useMeStore()
const { organization } = meStore

const radiologyRoot = ref(Radiology.blank())
const radiology = ref(Radiology.blank())
const saveLoading = ref(false)
const radiologyGroupAll = ref<RadiologyGroup[]>([])
const printHtmlOptions = ref<{ text: string; value: number }[]>([])

const activeTab = ref(TABS_KEY.BASIC)

const ticketDemo = Ticket.blank()
ticketDemo.ticketAttributeMap = { diagnosis: 'Viêm mũi dị ứng' }
ticketDemo.startedAt = Date.now()
ticketDemo.customer = Customer.example()

onBeforeMount(async () => {
  const promiseInit = await Promise.all([
    RadiologyGroupService.list({}),
    PrintHtmlService.getAll(),
    PrintHtmlService.getSystemList(),
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
})

onMounted(async () => {
  const radiologyId = Number(route.params.id)
  if (radiologyId) {
    const radiologyResponse = await RadiologyApi.detail(radiologyId, {
      relation: { printHtml: true },
    })
    radiologyRoot.value = radiologyResponse
    radiology.value = Radiology.from(radiologyResponse)
  } else {
    radiology.value = Radiology.blank()
    const radiologyAll = await RadiologyService.list({})
    radiology.value.priority = radiologyAll.length + 1
  }
  updatePreview()
})

const disabledButtonSave = computed(() => {
  return Radiology.equal(radiology.value, radiologyRoot.value)
})

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (radiology.value.id) {
      const radiologyResponse = await RadiologyService.updateOne(
        radiology.value.id,
        radiology.value
      )
      Object.assign(radiology.value, Radiology.from(radiologyResponse))
      Object.assign(radiologyRoot.value, Radiology.from(radiologyResponse))
      AlertStore.addSuccess('Cập nhật thành công', 1000)
    } else {
      await RadiologyService.createOne(radiology.value)
      router.push({ name: 'RadiologyList' })
      AlertStore.addSuccess('Tạo mới thành công', 1000)
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
              'Nếu bắt buộc phải xóa, bạn cần phải xóa tất cả phiếu khám trước',
              `Hiện tại đang có ${response.data.countTicketRadiology} phiếu khám sử dụng phiếu CĐHA này`,
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

    await DDom.startPrint('iframe-print', textDom)
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
  }
}
</script>

<template>
  <ModalSelectRadiologyExample
    ref="modalSelectRadiologyExample"
    @select="handleModalSelectRadiologyExampleSuccess" />
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
                  " />
              </div>
            </div>

            <div style="flex-basis: 90%; flex-grow: 1">
              <div>Số thứ tự trong danh sách</div>
              <div style="flex: 1">
                <InputNumber v-model:value="radiology.priority" :validate="{ GTE: 0 }" />
              </div>
            </div>

            <div style="flex-basis: 90%; flex-grow: 1">
              <div>Giá tiền</div>
              <div style="flex: 1">
                <InputMoney
                  v-model:value="radiology.price"
                  :validate="{ GTE: 0 }"
                  style="width: 100%" />
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
                  @select-item="updatePreview" />
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
                <WysiwygEditor
                  v-model:value="radiology.descriptionDefault"
                  @update:value="updatePreview" />
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
                  style="width: 100%; height: 100%; text-align: center"></iframe>
              </div>
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
        :disabled="disabledButtonSave">
        {{ radiology.id ? 'Cập nhật thông tin' : 'Tạo mới' }}
      </VueButton>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
