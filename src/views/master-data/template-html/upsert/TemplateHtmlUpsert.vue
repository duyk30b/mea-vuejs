<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconBug } from '@/common/icon-antd'
import MonacoEditor from '@/common/monaco-editor/MonacoEditor.vue'
import { VueTooltip } from '@/common/popover'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputNumber, InputSelect, InputText } from '@/common/vue-form'
import { VueTabMenu, VueTabPanel, VueTabs } from '@/common/vue-tabs'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { Customer } from '@/modules/customer'
import { Payment } from '@/modules/payment'
import {
  TemplateHtml,
  TemplateHtmlAction,
  TemplateHtmlCompile,
  TemplateHtmlService,
  TemplateHtmlType,
  TemplateHtmlTypeText,
} from '@/modules/template-html'
import { Ticket, TicketService } from '@/modules/ticket'
import type { TicketRadiology } from '@/modules/ticket-radiology'
import { ESDom, ESTypescript } from '@/utils'
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import { computed, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalSelectPaymentExample from './ModalSelectPaymentExample.vue'
import ModalSelectTemplateHtmlExample from './ModalSelectTemplateHtmlExample.vue'
import ModalSelectTicketExample from './ModalSelectTicketExample.vue'

const TABS_KEY = {
  PRINT: 'PRINT',
  INPUT: 'INPUT',
}

const modalSelectTicketExample = ref<InstanceType<typeof ModalSelectTicketExample>>()
const modalSelectPaymentExample = ref<InstanceType<typeof ModalSelectPaymentExample>>()
const modalSelectTemplateHtmlExample = ref<InstanceType<typeof ModalSelectTemplateHtmlExample>>()

const emit = defineEmits<{
  (e: 'success', value: TemplateHtml, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()
const iframe_input = ref<HTMLIFrameElement>()
const iframe_print = ref<HTMLIFrameElement>()

const route = useRoute()
const router = useRouter()
const { organization, user } = MeService

const templateHtmlOrigin = ref(TemplateHtml.blank())
const templateHtml = ref(TemplateHtml.blank())
const templateHtmlHeader = ref(TemplateHtml.blank())
const templateHtmlFooter = ref(TemplateHtml.blank())
const ticketDemo = ref(Ticket.blank())

const saveLoading = ref(false)

const ticketMap: Record<string, Ticket> = {}
const paymentDemo = ref(Payment.blank())
const customerDemo = ref(Customer.blank())

const activeTab = ref(TABS_KEY.INPUT)

let systemVarLog = {}

const templateHtmlTypeOptions = ESTypescript.valuesEnum(TemplateHtmlType).map((value) => ({
  value,
  label: TemplateHtmlTypeText[value],
}))

onBeforeMount(async () => {
  const templateHtmlId = Number(route.params.id)
  if (templateHtmlId) {
    const templateHtmlResponse = await TemplateHtmlService.detail(templateHtmlId)
    templateHtmlOrigin.value = templateHtmlResponse || TemplateHtml.blank()
    templateHtml.value = TemplateHtml.from(templateHtmlOrigin.value)
  } else {
    templateHtml.value = TemplateHtml.blank()
  }

  if (templateHtml.value.templateHtmlType !== TemplateHtmlType._HEADER) {
    templateHtmlHeader.value = await TemplateHtmlAction.getTemplateHtmlByType({
      oid: organization.value.id,
      templateHtmlType: TemplateHtmlType._HEADER,
    })
  } else {
    templateHtmlHeader.value = TemplateHtml.blank()
  }
  if (templateHtml.value.templateHtmlType !== TemplateHtmlType._FOOTER) {
    templateHtmlFooter.value = await TemplateHtmlAction.getTemplateHtmlByType({
      oid: organization.value.id,
      templateHtmlType: TemplateHtmlType._FOOTER,
    })
  } else {
    templateHtmlFooter.value = TemplateHtml.blank()
  }
})

const hasChangeData = computed(() => {
  return !TemplateHtml.equal(templateHtmlOrigin.value, templateHtml.value)
})

const startCompilePrint = () => {
  if (!iframe_print.value) return
  let data: Record<string, any> = {}
  try {
    const ticket = ticketDemo.value
    eval(templateHtml.value.dataExample)
    if (!data || typeof data !== 'object') {
      data = {}
    }
  } catch (error) {
    data = {}
    console.log('🚀 ~ TemplateHtmlUpsert.vue:72 ~ updatePreviewPrint ~ error:', error)
  }

  let ticketRadiology: TicketRadiology = data.ticketRadiology || {}

  let templateHtmlCompiled: { htmlString?: string; _SYSTEM_VARIABLE?: any } | undefined = {}

  const dataCompile = {
    organization: organization.value,
    me: user.value!,
    ticket: ticketDemo.value,
    customer: customerDemo.value!,
    payment: paymentDemo.value,
    ...data,
  }

  if (templateHtml.value.templateHtmlType === TemplateHtmlType._HEADER) {
    templateHtmlCompiled = TemplateHtmlCompile.compilePageHtml({
      data: dataCompile,
      template: {
        _header: templateHtml.value.htmlPrint,
        _footer: '',
        _content: '',
        _wrapper: '${_LAYOUT._HEADER}',
      },
      variablesString: [templateHtml.value.initVariable],
    })
  } else if (templateHtml.value.templateHtmlType === TemplateHtmlType._FOOTER) {
    templateHtmlCompiled = TemplateHtmlCompile.compilePageHtml({
      data: dataCompile,
      template: {
        _header: '',
        _footer: templateHtml.value.htmlPrint,
        _content: '',
        _wrapper: '${_LAYOUT._FOOTER}',
      },
      variablesString: [templateHtmlHeader.value.initVariable, templateHtml.value.initVariable],
    })
  } else if (templateHtml.value.templateHtmlType === TemplateHtmlType.TicketClinicCustomerPayment) {
    templateHtmlCompiled = TemplateHtmlCompile.compilePageHtml({
      data: dataCompile,
      template: {
        _header: templateHtmlHeader.value.htmlPrint,
        _footer: templateHtmlFooter.value.htmlPrint,
        _content: '',
        _wrapper: templateHtml.value.htmlPrint,
      },
      variablesString: [
        templateHtmlHeader.value.initVariable,
        templateHtmlFooter.value.initVariable,
        templateHtml.value.initVariable,
      ],
    })
  } else {
    templateHtmlCompiled = TemplateHtmlCompile.compilePageHtml({
      data: dataCompile,
      template: {
        _header: templateHtmlHeader.value.htmlPrint,
        _footer: templateHtmlFooter.value.htmlPrint,
        _content: ticketRadiology.description || '',
        _wrapper: templateHtml.value.htmlPrint,
      },
      variablesString: [
        templateHtmlHeader.value.initVariable,
        templateHtmlFooter.value.initVariable,
        templateHtml.value.initVariable,
        // ticketRadiology.customVariables, // không cho ghi đè để tránh nhầm lẫn
      ],
    })
  }

  systemVarLog = templateHtmlCompiled?._SYSTEM_VARIABLE || {}
  return templateHtmlCompiled
}

const updatePreviewInput = async () => {
  const doc = iframe_input.value?.contentDocument || iframe_input.value?.contentWindow?.document
  if (!doc) return

  ESDom.writeWindow(doc, {
    html: templateHtml.value.htmlInput || '',
    cssList: [],
  })
  console.log('Compile HTML success !!!')
}

const updatePreviewPrint = async () => {
  const doc = iframe_print.value?.contentDocument || iframe_print.value?.contentWindow?.document
  if (!doc) return
  const templateHtmlCompiled = startCompilePrint()

  ESDom.writeWindow(doc, {
    html: templateHtmlCompiled?.htmlString || '',
    cssList: [
      templateHtmlHeader.value.cssPrint,
      templateHtmlFooter.value.cssPrint,
      templateHtml.value.cssPrint,
      // ticketRadiology.customStyles || '' // không cho ghi đè để tránh nhầm lẫn
    ],
  })
  console.log('Compile HTML success !!!')
}

const handleModalSelectTicketDemoSuccess = async (ticketDemoId: string) => {
  if (ticketMap[ticketDemoId]) {
    ticketDemo.value = ticketMap[ticketDemoId]
  } else {
    try {
      const ticketResponse = await TicketService.detail(ticketDemoId, {
        relation: {
          customer: true,
          paymentList: false,

          ticketAttributeList: true,
          ticketRegimenList: true,
          ticketRegimenItemList: true,
          ticketProcedureList: true,
          ticketProductList: { batch: true, product: true },
          ticketLaboratoryList: true,
          ticketLaboratoryGroupList: true,
          ticketLaboratoryResultList: true,
          ticketRadiologyList: true,
          ticketUserList: true,
          toAppointment: true,
        },
      })

      await ticketResponse.refreshAllData()
      ticketMap[ticketDemoId] = ticketResponse
      ticketDemo.value = ticketResponse
      customerDemo.value = ticketResponse.customer!
    } catch (error) {
      console.log('🚀 ~ TemplateHtmlUpsert.vue:145  ~ error:', error)
    }
  }
  updatePreviewPrint()
}

const handleModalSelectPaymentDemoSuccess = async (paymentData: Payment) => {
  paymentDemo.value = Payment.from(paymentData)
  customerDemo.value = paymentDemo.value.customer!
  await Payment.refreshData(paymentDemo.value)
  updatePreviewPrint()
}

const handleModalSelectTemplateHtmlExampleSuccess = (templateHtmlProp: TemplateHtml) => {
  templateHtml.value.htmlPrint = templateHtmlProp.htmlPrint
  templateHtml.value.cssPrint = templateHtmlProp.cssPrint
  templateHtml.value.dataExample = templateHtmlProp.dataExample
  templateHtml.value.initVariable = templateHtmlProp.initVariable
  updatePreviewPrint()
}

const startTestPrint = async () => {
  try {
    let data: Record<string, any> = {}
    const ticket = ticketDemo.value
    try {
      eval(templateHtml.value.dataExample)
      if (!data || typeof data !== 'object') {
        data = {}
      }
    } catch (error) {
      data = {}
      console.log('🚀 ~ TemplateHtmlUpsert.vue:163 ~ startTestPrint ~ error:', error)
    }

    let ticketRadiology: TicketRadiology = data.ticketRadiology || {}

    const doc = iframe_print.value?.contentDocument || iframe_print.value?.contentWindow?.document
    if (!doc) return

    const templateHtmlCompiled = startCompilePrint()

    ESDom.writeWindow(doc, {
      html: templateHtmlCompiled?.htmlString || '',
      cssList: [
        templateHtmlHeader.value.cssPrint,
        templateHtmlFooter.value.cssPrint,
        templateHtml.value.cssPrint,
        ticketRadiology.customStyles || '',
      ],
    })
    await ESDom.startPrint('iframe-print', {
      html: templateHtmlCompiled?.htmlString || '',
      cssList: [
        templateHtmlHeader.value.cssPrint,
        templateHtmlFooter.value.cssPrint,
        templateHtml.value.cssPrint,
        ticketRadiology.customStyles || '',
      ],
    })
  } catch (error) {
    console.log('🚀 ~ TemplateHtmlUpsert.vue:182 ~ startTestPrint ~ error:', error)
  }
}

const showDataSystemPrint = () => {
  console.log(systemVarLog)
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!templateHtml.value.id) {
      const response = await TemplateHtmlService.createOne(templateHtml.value)
      templateHtmlOrigin.value = response
      templateHtml.value = TemplateHtml.from(response)
      emit('success', response, 'CREATE')
    } else {
      const response = await TemplateHtmlService.updateOne(
        templateHtml.value.id,
        templateHtml.value,
      )
      templateHtmlOrigin.value = response
      templateHtml.value = TemplateHtml.from(response)
      emit('success', response, 'UPDATE')
    }
    // router.push({ name: 'TemplateHtml' })
    AlertStore.addSuccess('Cập nhật thành công', 500)
  } catch (error) {
    console.log('🚀 ~ file: TemplateHtmlUpsert.vue:46 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}
</script>

<template>
  <ModalSelectTicketExample
    ref="modalSelectTicketExample"
    @select="handleModalSelectTicketDemoSuccess"
  />
  <ModalSelectPaymentExample
    ref="modalSelectPaymentExample"
    @select="handleModalSelectPaymentDemoSuccess"
  />
  <ModalSelectTemplateHtmlExample
    ref="modalSelectTemplateHtmlExample"
    @select="handleModalSelectTemplateHtmlExampleSuccess"
  />

  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
  </div>

  <form class="md:mx-4 mt-4 p-4 bg-white" @submit.prevent="handleSave">
    <div class="flex flex-wrap gap-4">
      <div style="flex-basis: 45%; flex: 3; min-width: 300px">
        <div class="flex gap-4 justify-start">
          <span>Tên mẫu in</span>
        </div>
        <div>
          <InputText v-model:value="templateHtml.name" required />
        </div>
      </div>
      <div style="flex-basis: 100px; flex: 1">
        <div class="flex gap-4 justify-start">
          <span>STT</span>
        </div>
        <div>
          <InputNumber v-model:value="templateHtml.priority" required />
        </div>
      </div>
      <div style="flex-basis: 300px; flex-grow: 1">
        <div class="flex gap-1 justify-start">
          <span>Loại mẫu in</span>
          <span v-if="CONFIG.MODE === 'development'" style="color: violet">
            ({{ templateHtml.templateHtmlType }})
          </span>
        </div>
        <div>
          <InputSelect
            v-model:value="templateHtml.templateHtmlType"
            :options="templateHtmlTypeOptions"
          ></InputSelect>
        </div>
      </div>
    </div>

    <div class="mt-1 flex justify-end">
      <a @click="modalSelectTemplateHtmlExample?.openModal()">
        Click vào để copy từ danh sách mẫu có sẵn
      </a>
    </div>

    <VueTabs v-model:tabShow="activeTab" class="">
      <template #menu>
        <VueTabMenu :tabKey="TABS_KEY.INPUT" style="padding: 6px 6px">Input</VueTabMenu>
        <VueTabMenu style="padding: 6px 6px" :tabKey="TABS_KEY.PRINT">Print</VueTabMenu>
      </template>
      <template #panel>
        <VueTabPanel :tabKey="TABS_KEY.INPUT">
          <div
            class="mt-4 flex flex-wrap gap-4"
            style="
              display: grid;
              grid-template-areas: 'html viewer' 'js viewer';
              grid-template-columns: repeat(2, 1fr);
              grid-template-rows: 500px 300px;
              gap: 16px;
              min-height: 600px;
            "
          >
            <div style="grid-area: html" class="flex flex-col">
              <div>HTML Input</div>
              <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
                <MonacoEditor
                  v-model:value="templateHtml!.htmlInput"
                  @update:value="updatePreviewInput"
                />
              </div>
            </div>
            <div style="grid-area: js" class="flex flex-col">
              <div>JS Input</div>
              <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
                <MonacoEditor
                  v-model:value="templateHtml.jsInput"
                  language="javascript"
                  @update:value="updatePreviewInput"
                />
              </div>
            </div>

            <div style="grid-area: viewer" class="flex flex-col">
              <div class="flex justify-between">View Demo</div>
              <div style="flex-grow: 3; box-shadow: 4px 4px 8px 4px rgba(0, 0, 0, 0.2)">
                <iframe ref="iframe_input" style="width: 100%; height: 100%"></iframe>
              </div>
            </div>
          </div>
        </VueTabPanel>
        <VueTabPanel :tabKey="TABS_KEY.PRINT">
          <div
            class="mt-4"
            style="
              display: grid;
              grid-template-areas: 'html viewer' 'css viewer' 'initVariableHeader viewer' 'initVariable getDataExample';
              grid-template-columns: repeat(2, 1fr);
              grid-template-rows: 500px 300px 200px 200px;
              gap: 16px;
            "
          >
            <div style="grid-area: html" class="flex flex-col">
              <div>HTML Print</div>
              <div style="flex-grow: 1; border: 1px solid #cdcdcd">
                <MonacoEditor
                  v-model:value="templateHtml!.htmlPrint"
                  @update:value="updatePreviewPrint"
                />
              </div>
            </div>

            <div style="grid-area: css" class="flex flex-col">
              <div>CSS Print</div>
              <div style="flex-grow: 1; border: 1px solid #cdcdcd">
                <MonacoEditor
                  v-model:value="templateHtml!.cssPrint"
                  @update:value="updatePreviewPrint"
                  language="css"
                />
              </div>
            </div>

            <div style="grid-area: viewer" class="flex flex-col">
              <div class="flex justify-between">
                <div
                  v-if="
                    [
                      TemplateHtmlType.TicketClinicCustomerPayment,
                      TemplateHtmlType.TicketClinicCustomerRefund,
                    ].includes(templateHtml.templateHtmlType)
                  "
                  class="flex gap-2 items-baseline"
                >
                  <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                    <template #trigger>
                      <IconBug
                        style="color: violet; cursor: pointer"
                        width="1.2em"
                        height="1.2em"
                      />
                    </template>
                    <pre>{{ JSON.stringify(paymentDemo, null, 4) }}</pre>
                  </VueTooltip>
                  <a @click="modalSelectPaymentExample?.openModal()">Chọn mẫu thanh toán thử</a>
                </div>
                <div v-else class="flex gap-2 items-baseline">
                  <a @click="modalSelectTicketExample?.openModal()">Chọn mẫu thử</a>
                  <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                    <template #trigger>
                      <IconBug
                        style="color: violet; cursor: pointer"
                        width="1.2em"
                        height="1.2em"
                      />
                    </template>
                    <pre>{{ JSON.stringify(ticketDemo, null, 4) }}</pre>
                  </VueTooltip>
                </div>
                <a @click="startTestPrint">In thử</a>
              </div>
              <div style="flex-grow: 3; box-shadow: 4px 4px 8px 4px rgba(0, 0, 0, 0.2)">
                <iframe ref="iframe_print" style="width: 100%; height: 100%"></iframe>
              </div>
            </div>

            <div style="grid-area: getDataExample" class="flex flex-col">
              <div>Giả định cách lấy "data" mẫu từ "ticket"</div>
              <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
                <MonacoEditor
                  v-model:value="templateHtml.dataExample"
                  language="javascript"
                  @update:value="updatePreviewPrint"
                />
              </div>
            </div>

            <div style="grid-area: initVariableHeader" class="flex flex-col">
              <div class="flex justify-between">
                <span>Biến từ Header và Footer</span>
                <span></span>
              </div>
              <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
                <MonacoEditor
                  :value="
                    (templateHtmlHeader?.initVariable || '') +
                    (templateHtmlFooter?.initVariable || '')
                  "
                  language="javascript"
                  @update:value="updatePreviewPrint"
                  readOnly
                />
              </div>
            </div>

            <div style="grid-area: initVariable" class="flex flex-col">
              <div class="flex justify-between">
                <span>Khởi tạo biến mặc định</span>
                <a @click="showDataSystemPrint">Xem biến hệ thống (console.log)</a>
              </div>
              <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
                <MonacoEditor
                  v-model:value="templateHtml.initVariable"
                  language="javascript"
                  @update:value="updatePreviewPrint"
                />
              </div>
            </div>

            <!-- <div style="grid-area: dataText; overflow: scroll" class="flex flex-col">
        <div>Kết quả "data" mẫu</div>
        <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
          <MonacoEditor read-only :value="dataStringExample" language="json" />
        </div>
      </div> -->
          </div>
        </VueTabPanel>
      </template>
    </VueTabs>

    <div class="mt-4 flex justify-between">
      <div></div>
      <VueButton
        v-if="templateHtml.oid != 1 || user?.id == 1"
        color="blue"
        type="submit"
        :loading="saveLoading"
        icon="save"
        :disabled="!hasChangeData"
      >
        Lưu lại
      </VueButton>
    </div>
  </form>
</template>

<style lang="scss" scoped>
textarea {
  width: 100%;
  min-height: 400px;
  padding: 6px;
  outline: none;
  border: 1px solid #d9d9d9;

  &:focus {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px #1890ff33;
  }
}
</style>
