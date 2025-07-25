<script setup lang="ts">
import { Discount, DiscountInteractType } from '@/modules/discount'
import { computed, nextTick, onBeforeMount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '@/common/VueButton.vue'
import VueTinyMCE from '@/common/VueTinyMCE.vue'
import { IconDelete, IconPrint, IconRight } from '@/common/icon-antd'
import MonacoEditor from '@/common/monaco-editor/MonacoEditor.vue'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputFilter, InputMoney, InputNumber, InputText, VueSelect } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { VueTabMenu, VueTabPanel, VueTabs } from '@/common/vue-tabs'
import { MeService } from '@/modules/_me/me.service'
import { Customer } from '@/modules/customer'
import { Image, ImageHostType } from '@/modules/image/image.model'
import { CommissionCalculatorType, Position, PositionInteractType } from '@/modules/position'
import {
  PrintHtml,
  PrintHtmlAction,
  PrintHtmlCompile,
  PrintHtmlService,
  PrintHtmlType,
} from '@/modules/print-html'
import { Radiology, RadiologyApi, RadiologyService } from '@/modules/radiology'
import { RadiologyGroup, RadiologyGroupService } from '@/modules/radiology-group'
import { Role, RoleService } from '@/modules/role'
import { Ticket } from '@/modules/ticket'
import { TicketRadiology } from '@/modules/ticket-radiology'
import { ESDom } from '@/utils'
import Breadcrumb from '../../../component/Breadcrumb.vue'
import ModalSelectRadiologyExample from './ModalSelectRadiologyExample.vue'
import DiscountTableAction from '../../discount/common/DiscountTableAction.vue'
import { PermissionId } from '@/modules/permission/permission.enum'
import PositionTableAction from '@/views/user/position/common/PositionTableAction.vue'

const TABS_KEY = {
  BASIC: 'BASIC',
  DATA_AND_PRINT: 'DATA_AND_PRINT',
  DISCOUNT: 'DISCOUNT',
  ROLE_AND_POSITION: 'ROLE_AND_POSITION',
}

const modalSelectRadiologyExample = ref<InstanceType<typeof ModalSelectRadiologyExample>>()
const iframe = ref<HTMLIFrameElement>()

const route = useRoute()
const router = useRouter()

const { userPermission, organization, user } = MeService
const radiologyOrigin = ref(Radiology.blank())
const radiology = ref(Radiology.blank())

const radiologyGroupAll = ref<RadiologyGroup[]>([])
const printHtmlOptions = ref<{ text: string; value: number }[]>([])
const roleOptions = ref<{ value: number; text: string; data: Role }[]>([])

const ticketDemo = Ticket.blank()
ticketDemo.note = 'Viêm mũi dị ứng'
ticketDemo.startedAt = Date.now()
ticketDemo.customer = Customer.example()

let systemVarLog = {}

const activeTab = ref(TABS_KEY.BASIC)
const saveLoading = ref(false)

const printHtmlHeader = ref(PrintHtml.blank())
const printHtmlFooter = ref(PrintHtml.blank())

onBeforeMount(async () => {
  const promiseInit = await Promise.all([
    RadiologyGroupService.list({}),
    PrintHtmlService.list({ sort: { priority: 'ASC' } }),
    RoleService.list({}),
  ])
  radiologyGroupAll.value = promiseInit[0]
  const printHtmlAll = promiseInit[1]
  const roleAll = promiseInit[2]
  printHtmlOptions.value = [
    { text: 'Mặc định', value: 0 },
    ...printHtmlAll.map((i) => {
      return { value: i.id, text: i.name }
    }),
  ]
  roleOptions.value = roleAll.map((i) => ({ value: i.id, text: i.name, data: i }))

  printHtmlHeader.value = await PrintHtmlAction.getPrintHtmlByType({
    oid: organization.value.id,
    type: PrintHtmlType._HEADER,
  })
  printHtmlFooter.value = await PrintHtmlAction.getPrintHtmlByType({
    oid: organization.value.id,
    type: PrintHtmlType._FOOTER,
  })
})

onMounted(async () => {
  const radiologyId = Number(route.params.id)
  if (radiologyId) {
    const radiologyResponse = await RadiologyApi.detail(radiologyId, {
      relation: { printHtml: true, positionList: true, discountList: true },
    })
    radiologyOrigin.value = radiologyResponse
    radiologyOrigin.value.radiologyGroup = await RadiologyGroupService.detail(
      radiologyOrigin.value.radiologyGroupId,
    )
    radiology.value = Radiology.from(radiologyResponse)
  } else {
    radiology.value = Radiology.blank()
  }
  if (!radiology.value.positionList?.length) {
    handleAddPosition()
  }
  await handleSelectPrintHtml()
})

const hasChangeDiscountList = computed(() => {
  return !Discount.equalList(
    radiology.value.discountList || [],
    radiologyOrigin.value.discountList || [],
  )
})

const hasChangePositionList = computed(() => {
  return !Position.equalList(
    (radiology.value.positionList || []).filter((i) => !!i.roleId),
    radiologyOrigin.value.positionList || [],
  )
})

const hasChangeData = computed(() => {
  if (!Radiology.equal(radiology.value, radiologyOrigin.value)) {
    return true
  }
  if (hasChangePositionList.value) {
    return true
  }
  if (hasChangeDiscountList.value) {
    return true
  }
  return false
})

const handleSave = async () => {
  for (let i = 0; i < (radiology.value.positionList?.length || 0); i++) {
    const element = radiology.value.positionList![i]
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
      const radiologyResponse = await RadiologyService.updateOne(radiology.value.id, {
        radiology: radiology.value,
        positionList: hasChangePositionList.value ? radiology.value.positionList : undefined,
        discountList: hasChangeDiscountList.value ? radiology.value.discountList : undefined,
      })
      Object.assign(radiology.value, Radiology.from(radiologyResponse))
      Object.assign(radiologyOrigin.value, Radiology.from(radiologyResponse))
      AlertStore.addSuccess('Cập nhật thành công', 1000)
    } else {
      const res = await RadiologyService.createOne({
        radiology: radiology.value,
        positionList: hasChangePositionList.value ? radiology.value.positionList : undefined,
        discountList: hasChangeDiscountList.value ? radiology.value.discountList : undefined,
      })
      router.push({ name: 'RadiologyList' })
      AlertStore.addSuccess('Tạo mới thành công', 500)

      radiology.value = Radiology.from(res)
      radiologyOrigin.value = Radiology.from(res)
    }
  } catch (error) {
    console.log('🚀 ~ file: RadiologyUpsert.vue:91 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleSelectPrintHtml = async () => {
  radiology.value.printHtml = await PrintHtmlAction.getPrintHtmlByType({
    oid: organization.value.id,
    id: radiology.value.printHtmlId,
    type: PrintHtmlType.RadiologyResult,
  })
  updatePreview()
}

const hostGoogleDriverIdExampleList = [
  '1d6VOuyrjyG9_HDG6TyB8-b3dslmJPo29',
  '1f4H08hSUzRSfS4oM5AX4tPbxG_bTqm7L',
  '1LsOS-RAWtL-_hR-dviAb59e6KKCenkPb',
  '1N9UKIJHbfbq8dGo93T3hWiHK7_e2vPPQ',
]

const updatePreview = async () => {
  if (!iframe.value) return
  const doc = iframe.value?.contentDocument || iframe.value?.contentWindow?.document
  if (!doc) return

  const printHtml = radiology.value.printHtml
  if (!printHtml?.html) {
    return
  }
  const ticketRadiologyData = TicketRadiology.blank()
  ticketRadiologyData.radiology = Radiology.from(radiology.value)
  ticketRadiologyData.result = radiology.value.resultDefault
  ticketRadiologyData.description = radiology.value.descriptionDefault
  ticketRadiologyData.customStyles = radiology.value.customStyles
  ticketRadiologyData.customVariables = radiology.value.customVariables
  ticketRadiologyData.imageList = Array.from({ length: 4 }, (_, i) => {
    const image = Image.blank()
    image.hostType = ImageHostType.GoogleDriver
    image.externalId = hostGoogleDriverIdExampleList[i]
    return image
  })

  const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
    data: {
      organization: organization.value,
      me: user.value!,
      ticket: ticketDemo,
      customer: ticketDemo.customer!,
      ticketRadiology: ticketRadiologyData,
    },
    template: {
      _header: printHtmlHeader.value.html,
      _footer: printHtmlFooter.value.html,
      _wrapper: printHtml.html,
      _content: radiology.value.descriptionDefault || '',
    },
    variablesString: [
      printHtmlHeader.value.initVariable,
      printHtmlFooter.value.initVariable,
      printHtml.initVariable,
      radiology.value.customVariables,
    ],
  })
  systemVarLog = printHtmlCompiled?._SYSTEM_VARIABLE || {}

  if (!printHtmlCompiled || !printHtmlCompiled.htmlString) {
    return
  }

  ESDom.writeWindow(doc, {
    html: printHtmlCompiled?.htmlString || '',
    cssList: [
      printHtmlHeader.value.css,
      printHtmlFooter.value.css,
      printHtml.css,
      radiology.value.customStyles,
    ],
  })
}

const handleUpdateTabShow = () => {
  nextTick(() => updatePreview())
}

const handleModalSelectRadiologyExampleSuccess = (radiologyProp: Radiology) => {
  radiology.value.printHtmlId = radiologyProp.printHtmlId
  radiology.value.descriptionDefault = radiologyProp.descriptionDefault
  radiology.value.resultDefault = radiologyProp.resultDefault
  radiology.value.customStyles = radiologyProp.customStyles
  radiology.value.customVariables = radiologyProp.customVariables
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
    const printHtml = radiology.value.printHtml
    if (!printHtml?.html) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const ticketRadiologyData = TicketRadiology.blank()
    ticketRadiologyData.radiology = Radiology.from(radiology.value)
    ticketRadiologyData.description = radiology.value.descriptionDefault
    ticketRadiologyData.result = radiology.value.resultDefault
    ticketRadiologyData.imageList = Array.from({ length: 4 }, (_, i) => {
      const image = Image.blank()
      image.hostType = ImageHostType.GoogleDriver
      image.externalId = hostGoogleDriverIdExampleList[i]
      return image
    })

    const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
      data: {
        organization: organization.value,
        me: user.value!,
        ticket: ticketDemo,
        customer: ticketDemo.customer!,
        ticketRadiology: ticketRadiologyData,
      },
      template: {
        _header: printHtmlHeader.value.html,
        _footer: printHtmlFooter.value.html,
        _content: radiology.value.descriptionDefault || '',
        _wrapper: printHtml.html,
      },
      variablesString: [
        printHtmlHeader.value.initVariable,
        printHtmlFooter.value.initVariable,
        printHtml.initVariable,
        radiology.value.customVariables,
      ],
    })
    systemVarLog = printHtmlCompiled?._SYSTEM_VARIABLE || {}

    if (!printHtmlCompiled || !printHtmlCompiled.htmlString) {
      return
    }

    await ESDom.startPrint('iframe-print', {
      html: printHtmlCompiled?.htmlString || '',
      cssList: [
        printHtmlHeader.value.css,
        printHtmlFooter.value.css,
        printHtml.css,
        radiology.value.customStyles,
      ],
    })
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
  }
}

const handleAddPosition = () => {
  const positionBlank = Position.blank()
  positionBlank.positionType = PositionInteractType.Radiology
  positionBlank.positionInteractId = radiology.value.id

  if (!radiology.value.positionList) {
    radiology.value.positionList = []
  }
  radiology.value.positionList!.push(positionBlank)
}

const showDataSystemPrint = () => {
  console.log(systemVarLog)
}

const startCleanHtml = () => {
  radiology.value.descriptionDefault = ESDom.cleanHtml(radiology.value.descriptionDefault).replace(
    /Ø/gi,
    ' - ',
  )
}
</script>

<template>
  <ModalSelectRadiologyExample
    ref="modalSelectRadiologyExample"
    @select="handleModalSelectRadiologyExampleSuccess"
  />

  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:flex items-center gap-2 text-lg font-medium">
      <Breadcrumb />
      <IconRight style="font-size: 0.7em; opacity: 0.5" />
      {{ radiology.name }}
    </div>
  </div>

  <form class="md:mx-4 mt-4 my-8 p-4 bg-white" @submit.prevent="handleSave">
    <VueTabs v-model:tabShow="activeTab" @update:tab-show="handleUpdateTabShow">
      <template #menu>
        <VueTabMenu :tabKey="TABS_KEY.BASIC">Cơ bản</VueTabMenu>
        <VueTabMenu :tabKey="TABS_KEY.DATA_AND_PRINT">
          <IconPrint />
          Dữ liệu và In
        </VueTabMenu>
        <VueTabMenu :tabKey="TABS_KEY.DISCOUNT">Khuyến mại</VueTabMenu>
        <VueTabMenu :tabKey="TABS_KEY.ROLE_AND_POSITION">Vai trò và hoa hồng</VueTabMenu>
      </template>
      <template #panel>
        <VueTabPanel :tabKey="TABS_KEY.BASIC">
          <div class="mt-4 flex flex-wrap gap-4" style="max-width: 900px">
            <div style="flex-basis: 500px; flex-grow: 1">
              <div class="flex gap-4 justify-start">
                <span>Tên phiếu</span>
              </div>
              <div>
                <InputText v-model:value="radiology.name" required />
              </div>
            </div>

            <div style="flex-grow: 1; flex-basis: 150px">
              <div class="">Mã phiếu</div>
              <div class="">
                <InputText v-model:value="radiology.radiologyCode" placeholder="Tạo tự động" />
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
        <VueTabPanel :tabKey="TABS_KEY.DATA_AND_PRINT">
          <div class="mt-4 flex flex-wrap gap-4">
            <div style="flex-basis: 500px; flex-grow: 1; min-height: 800px" class="flex flex-col">
              <div>
                <div class="">Chọn mẫu in</div>
                <div>
                  <VueSelect
                    v-model:value="radiology.printHtmlId"
                    :options="printHtmlOptions"
                    @select-item="handleSelectPrintHtml"
                  />
                </div>
              </div>
              <div class="mt-4">
                <span>Nội dung mô tả mặc định</span>
                <span class="ml-4">
                  <a @click="modalSelectRadiologyExample?.openModal()">( Lấy từ dữ liệu mẫu )</a>
                </span>
              </div>
              <div style="flex-grow: 1; min-height: 400px">
                <VueTinyMCE
                  v-model:modelValue="radiology.descriptionDefault"
                  @update:modelValue="updatePreview"
                  menu-bar
                  status-bar
                />
              </div>
              <div class="flex justify-end">
                <a @click="startCleanHtml">CleanHTML</a>
              </div>
              <div class="mt-4">
                <div>Kết luận mặc định</div>
                <div>
                  <InputText
                    v-model:value="radiology.resultDefault"
                    @update:value="updatePreview"
                  />
                </div>
              </div>

              <div class="mt-10">
                <details>
                  <summary><a>Cài đặt nâng cao</a></summary>
                  <div class="mt-4">
                    <div class="flex justify-between">
                      <span>Biến từ template</span>
                      <a @click="showDataSystemPrint">Xem biến hệ thống (console.log)</a>
                    </div>
                    <div style="height: 150px; border: 1px solid #cdcdcd">
                      <MonacoEditor
                        :value="
                          (printHtmlHeader?.initVariable || '') +
                          (printHtmlFooter?.initVariable || '') +
                          (radiology.printHtml?.initVariable || '')
                        "
                        language="javascript"
                        readOnly
                      />
                    </div>
                  </div>
                  <div class="mt-4">
                    <div class="">Tùy chỉnh biến</div>
                    <div class="" style="height: 150px; border: 1px solid #cdcdcd">
                      <MonacoEditor
                        v-model:value="radiology!.customVariables"
                        @update:value="updatePreview"
                        language="javascript"
                      />
                    </div>
                  </div>
                  <div class="mt-4">
                    <div class="">Tùy chỉnh style</div>
                    <div class="" style="height: 150px; border: 1px solid #cdcdcd">
                      <MonacoEditor
                        v-model:value="radiology!.customStyles"
                        @update:value="updatePreview"
                        language="css"
                      />
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <div style="flex-basis: 500px; flex-grow: 1; min-height: 800px" class="flex flex-col">
              <div class="flex justify-end">
                <a @click="startTestPrint">In thử</a>
              </div>
              <div style="flex-grow: 1; box-shadow: 4px 4px 8px 4px rgba(0, 0, 0, 0.2)">
                <iframe
                  ref="iframe"
                  class="preview-iframe"
                  style="width: 100%; height: 100%; text-align: center"
                ></iframe>
              </div>
            </div>
          </div>
        </VueTabPanel>
        <VueTabPanel :tabKey="TABS_KEY.DISCOUNT">
          <div class="mt-4">
            <DiscountTableAction
              v-model:discountList="radiology.discountList!"
              :discountInteractId="radiology.id"
              :discountInteractType="DiscountInteractType.Radiology"
              :discountListExtra="radiology.discountListExtra || []"
              :editable="userPermission[PermissionId.MASTER_DATA_DISCOUNT]"
            />
          </div>
        </VueTabPanel>
        <VueTabPanel :tabKey="TABS_KEY.ROLE_AND_POSITION">
          <div class="mt-4">
            <PositionTableAction
              v-model:positionList="radiology.positionList!"
              :positionType="PositionInteractType.Radiology"
              :positionInteractId="radiology.id"
              :editable="userPermission[PermissionId.POSITION]"
            />
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
