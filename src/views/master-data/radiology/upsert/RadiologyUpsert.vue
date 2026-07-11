<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import VueTinyMCE from '@/common/VueTinyMCE.vue'
import { IconPrint, IconRight } from '@/common/icon-antd'
import MonacoEditor from '@/common/monaco-editor/MonacoEditor.vue'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney, InputText, VueSelect } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { VueTabMenu, VueTabPanel, VueTabs } from '@/common/vue-tabs'
import { MeService } from '@/modules/_me/me.service'
import { Customer } from '@/modules/customer'
import { Discount, DiscountInteractType, DiscountService } from '@/modules/discount'
import { Image, ImageHostType } from '@/modules/image/image.model'
import { PermissionId } from '@/modules/permission/permission.enum'
import {
  Position,
  PositionService,
  PositionType
} from '@/modules/position'
import { TemplateHtml, TemplateHtmlAction, TemplateHtmlCompile, TemplateHtmlType } from '@/modules/template-html'
import { Radiology, RadiologyApi, RadiologyService } from '@/modules/radiology'
import { RadiologyGroup, RadiologyGroupService } from '@/modules/radiology-group'
import { Ticket } from '@/modules/ticket'
import { TicketRadiology } from '@/modules/ticket-radiology'
import { ESDom } from '@/utils'
import VueSelectTemplateHtml from '@/views/component/VueSelectTemplateHtml.vue'
import PositionTableAction from '@/views/master-data/position/common/PositionTableAction.vue'
import { computed, nextTick, onBeforeMount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '../../../component/Breadcrumb.vue'
import DiscountTableAction from '../../discount/common/DiscountTableAction.vue'
import ModalSelectRadiologyExample from './ModalSelectRadiologyExample.vue'

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
let radiologyOrigin = Radiology.blank()
const radiology = ref(Radiology.blank())

const radiologyGroupAll = ref<RadiologyGroup[]>([])

const ticketDemo = Ticket.blank()
ticketDemo.note = 'Viêm mũi dị ứng'
ticketDemo.createdAt = Date.now()
ticketDemo.customer = Customer.example()

let systemVarLog = {}

const activeTab = ref(TABS_KEY.BASIC)
const saveLoading = ref(false)

const templateHtmlHeader = ref(TemplateHtml.blank())
const templateHtmlFooter = ref(TemplateHtml.blank())

onBeforeMount(async () => {
  const promiseInit = await Promise.all([RadiologyGroupService.list({})])
  radiologyGroupAll.value = promiseInit[0]

  templateHtmlHeader.value = await TemplateHtmlAction.getTemplateHtmlByType({
    oid: organization.value.id,
    templateHtmlType: TemplateHtmlType._HEADER,
  })
  templateHtmlFooter.value = await TemplateHtmlAction.getTemplateHtmlByType({
    oid: organization.value.id,
    templateHtmlType: TemplateHtmlType._FOOTER,
  })
})

onMounted(async () => {
  const radiologyId = Number(route.params.id)
  if (radiologyId) {
    radiologyOrigin = await RadiologyApi.detail(radiologyId, {
      relation: { templateHtml: true, positionList: true, discountList: true },
    })
    radiologyOrigin.radiologyGroup = await RadiologyGroupService.detail(
      radiologyOrigin.radiologyGroupId,
    )
    radiology.value = Radiology.from(radiologyOrigin)
  } else {
    radiology.value = Radiology.blank()
    radiology.value.discountListExtra = await DiscountService.list({
      filter: { discountInteractId: 0, discountInteractType: DiscountInteractType.Radiology },
    })
    radiology.value.positionRequestListCommon = await PositionService.list({
      filter: { positionType: PositionType.RadiologyRequest, positionInteractId: 0 },
    })
    radiology.value.positionResultListCommon = await PositionService.list({
      filter: { positionType: PositionType.RadiologyResult, positionInteractId: 0 },
    })
  }
})

const hasChangePositionRequestList = computed(() => {
  return !Position.equalList(
    (radiology.value.positionRequestList || []).filter((i) => !!i.roleId),
    radiologyOrigin.positionRequestList || [],
  )
})

const hasChangePositionResultList = computed(() => {
  return !Position.equalList(
    (radiology.value.positionResultList || []).filter((i) => !!i.roleId),
    radiologyOrigin.positionResultList || [],
  )
})

const hasChangeDiscountList = computed(() => {
  return !Discount.equalList(radiology.value.discountList || [], radiologyOrigin.discountList || [])
})

const hasChangeData = computed(() => {
  if (!Radiology.equal(radiology.value, radiologyOrigin)) {
    return true
  }
  if (hasChangePositionRequestList.value) {
    return true
  }
  if (hasChangePositionResultList.value) {
    return true
  }
  if (hasChangeDiscountList.value) {
    return true
  }
  return false
})

const handleSave = async () => {
  try {
    saveLoading.value = true
    if (!radiology.value.id) {
      const res = await RadiologyService.createOne({
        radiology: radiology.value,
        positionRequestList: hasChangePositionRequestList.value
          ? radiology.value.positionRequestList
          : undefined,
        positionResultList: hasChangePositionResultList.value
          ? radiology.value.positionResultList
          : undefined,
        discountList: hasChangeDiscountList.value ? radiology.value.discountList : undefined,
      })
      router.push({ name: 'RadiologyList' })
      AlertStore.addSuccess('Tạo mới thành công', 500)
    } else {
      const radiologyResponse = await RadiologyService.updateOne(radiology.value.id, {
        radiology: radiology.value,
        positionRequestList: hasChangePositionRequestList.value
          ? radiology.value.positionRequestList
          : undefined,
        positionResultList: hasChangePositionResultList.value
          ? radiology.value.positionResultList
          : undefined,
        discountList: hasChangeDiscountList.value ? radiology.value.discountList : undefined,
      })
      Object.assign(radiology.value, Radiology.from(radiologyResponse))
      Object.assign(radiologyOrigin, Radiology.from(radiologyResponse))
      AlertStore.addSuccess('Cập nhật thành công', 1000)
    }
  } catch (error) {
    console.log('🚀 ~ RadiologyUpsert.vue:157 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const selectTemplateHtml = async (templateHtmlProp?: TemplateHtml) => {
  let templateHtmlData: TemplateHtml
  if (templateHtmlProp?.id) {
    templateHtmlData = TemplateHtml.from(templateHtmlProp)
  } else {
    templateHtmlData = await TemplateHtmlAction.getTemplateHtmlByType({
      oid: organization.value.id,
      templateHtmlType: TemplateHtmlType.TicketClinicRadiologyResult,
    })
  }

  radiology.value.templateHtml = templateHtmlData
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

  const templateHtml = radiology.value.templateHtml
  if (!templateHtml?.htmlPrint) {
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

  const templateHtmlCompiled = TemplateHtmlCompile.compilePageHtml({
    data: {
      organization: organization.value,
      me: user.value!,
      ticket: ticketDemo,
      customer: ticketDemo.customer!,
      ticketRadiology: ticketRadiologyData,
    },
    template: {
      _header: templateHtmlHeader.value.htmlPrint,
      _footer: templateHtmlFooter.value.htmlPrint,
      _wrapper: templateHtml.htmlPrint,
      _content: radiology.value.descriptionDefault || '',
    },
    variablesString: [
      templateHtmlHeader.value.initVariable,
      templateHtmlFooter.value.initVariable,
      templateHtml.initVariable,
      radiology.value.customVariables,
    ],
  })
  systemVarLog = templateHtmlCompiled?._SYSTEM_VARIABLE || {}

  if (!templateHtmlCompiled || !templateHtmlCompiled.htmlString) {
    return
  }

  ESDom.writeWindow(doc, {
    html: templateHtmlCompiled?.htmlString || '',
    cssList: [
      templateHtmlHeader.value.cssPrint,
      templateHtmlFooter.value.cssPrint,
      templateHtml.cssPrint,
      radiology.value.customStyles,
    ],
  })
}

const handleUpdateTabShow = () => {
  nextTick(() => updatePreview())
}

const handleModalSelectRadiologyExampleSuccess = (radiologyProp: Radiology) => {
  radiology.value.templateHtmlId = radiologyProp.templateHtmlId
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
              `Phiếu khám liên quan: ${response.ticketRadiologyList
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
    const templateHtml = radiology.value.templateHtml
    if (!templateHtml?.htmlPrint) {
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

    const templateHtmlCompiled = TemplateHtmlCompile.compilePageHtml({
      data: {
        organization: organization.value,
        me: user.value!,
        ticket: ticketDemo,
        customer: ticketDemo.customer!,
        ticketRadiology: ticketRadiologyData,
      },
      template: {
        _header: templateHtmlHeader.value.htmlPrint,
        _footer: templateHtmlFooter.value.htmlPrint,
        _content: radiology.value.descriptionDefault || '',
        _wrapper: templateHtml.htmlPrint,
      },
      variablesString: [
        templateHtmlHeader.value.initVariable,
        templateHtmlFooter.value.initVariable,
        templateHtml.initVariable,
        radiology.value.customVariables,
      ],
    })
    systemVarLog = templateHtmlCompiled?._SYSTEM_VARIABLE || {}

    if (!templateHtmlCompiled || !templateHtmlCompiled.htmlString) {
      return
    }

    await ESDom.startPrint('iframe-print', {
      html: templateHtmlCompiled?.htmlString || '',
      cssList: [
        templateHtmlHeader.value.cssPrint,
        templateHtmlFooter.value.cssPrint,
        templateHtml.cssPrint,
        radiology.value.customStyles,
      ],
    })
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
  }
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
                <VueSelectTemplateHtml
                  v-model:templateHtmlId="radiology.templateHtmlId"
                  :templateHtmlType="TemplateHtmlType.TicketClinicRadiologyResult"
                  @selectTemplateHtml="(v) => selectTemplateHtml(v)"
                />
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
                          (templateHtmlHeader?.initVariable || '') +
                          (templateHtmlFooter?.initVariable || '') +
                          (radiology.templateHtml?.initVariable || '')
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
            <div style="font-weight: bold">1. Vai trò chỉ định CĐHA</div>
            <PositionTableAction
              v-model:positionList="radiology.positionRequestList!"
              :positionListCommon="radiology.positionRequestListCommon || []"
              :positionType="PositionType.RadiologyRequest"
              :positionInteractId="radiology.id"
              :editable="userPermission[PermissionId.MASTER_DATA_POSITION]"
            />
          </div>
          <div class="mt-10">
            <div style="font-weight: bold">2. Vai trò thực hiện, trả kết quả CĐHA</div>
            <PositionTableAction
              v-model:positionList="radiology.positionResultList!"
              :positionListCommon="radiology.positionResultListCommon || []"
              :positionType="PositionType.RadiologyResult"
              :positionInteractId="radiology.id"
              :editable="userPermission[PermissionId.MASTER_DATA_POSITION]"
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
