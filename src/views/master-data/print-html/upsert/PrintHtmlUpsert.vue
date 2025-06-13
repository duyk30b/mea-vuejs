<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import MonacoEditor from '@/common/monaco-editor/MonacoEditor.vue'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputNumber, InputText } from '@/common/vue-form'
import { MeService } from '@/modules/_me/me.service'
import { PrintHtml, PrintHtmlCompile, PrintHtmlService } from '@/modules/print-html'
import { Ticket, TicketService } from '@/modules/ticket'
import type { TicketRadiology } from '@/modules/ticket-radiology'
import { ESDom } from '@/utils'
import { computed, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '../../../component/Breadcrumb.vue'
import ModalSelectPrintHtmlExample from './ModalSelectPrintHtmlExample.vue'
import ModalSelectTicketExample from './ModalSelectTicketExample.vue'
import { PrintHtmlAction } from '@/modules/print-html/print-html.action'

const modalSelectTicketExample = ref<InstanceType<typeof ModalSelectTicketExample>>()
const modalSelectPrintHtmlExample = ref<InstanceType<typeof ModalSelectPrintHtmlExample>>()

const emit = defineEmits<{
  (e: 'success', value: PrintHtml, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()
const iframe = ref<HTMLIFrameElement>()

const route = useRoute()
const router = useRouter()
const { organization, user } = MeService

const printHtmlOrigin = ref(PrintHtml.blank())
const printHtml = ref(PrintHtml.blank())
const printHtmlHeader = ref(PrintHtml.blank())
const ticketDemo = ref(Ticket.blank())

const saveLoading = ref(false)

const ticketMap: Record<string, Ticket> = {}

let systemVarLog = {}

onBeforeMount(async () => {
  const printHtmlId = Number(route.params.id)
  if (printHtmlId) {
    const printHtmlResponse = await PrintHtmlService.detail(printHtmlId)
    printHtmlOrigin.value = printHtmlResponse || PrintHtml.blank()
    printHtml.value = PrintHtml.from(printHtmlOrigin.value)
  } else {
    printHtml.value = PrintHtml.blank()
  }

  const printHtmlHeaderCurrent = await PrintHtmlAction.getPrintHtmlHeader()
  if (printHtmlHeaderCurrent.id !== printHtmlId) {
    printHtmlHeader.value = await PrintHtmlAction.getPrintHtmlHeader()
  }
})

const hasChangeData = computed(() => {
  return !PrintHtml.equal(printHtmlOrigin.value, printHtml.value)
})

const updatePreview = () => {
  if (!ticketDemo.value.id) return
  if (!iframe.value) return
  let data: Record<string, any> = {}
  const ticket = ticketDemo.value
  try {
    eval(printHtml.value.dataExample)
    if (!data || typeof data !== 'object') {
      data = {}
    }
  } catch (error) {
    data = {}
    console.log('🚀 ~ PrintHtmlUpsert.vue:72 ~ updatePreview ~ error:', error)
  }

  let ticketRadiology: TicketRadiology = data.ticketRadiology || {}

  const doc = iframe.value?.contentDocument || iframe.value?.contentWindow?.document
  if (!doc) return

  const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
    data: {
      organization: organization.value,
      ticket,
      customer: ticket.customer!,
      ...data,
    },
    template: {
      _header: printHtmlHeader.value.html,
      _content: ticketRadiology.description || '',
      _html: printHtml.value.html,
    },
    variablesString: [
      printHtmlHeader.value.initVariable,
      printHtml.value.initVariable,
      // ticketRadiology.customVariables, // không cho ghi đè để tránh nhầm lẫn
    ],
  })
  systemVarLog = printHtmlCompiled?._SYSTEM_VARIABLE || {}

  ESDom.writeWindow(doc, {
    html: printHtmlCompiled?.htmlString || '',
    cssList: [
      printHtmlHeader.value.css,
      printHtml.value.css,
      // ticketRadiology.customStyles || '' // không cho ghi đè để tránh nhầm lẫn
    ],
  })
  console.log('Compile HTML success !!!')
}

const handleModalSelectTicketDemoSuccess = async (ticketDemoId: number) => {
  if (ticketMap[ticketDemoId]) {
    ticketDemo.value = ticketMap[ticketDemoId]
  } else {
    try {
      const ticketResponse = await TicketService.detail(ticketDemoId, {
        relation: {
          customer: true,
          paymentList: false, // query khi bật modal thanh toán

          ticketAttributeList: true,
          // ticketProductList: true,
          ticketProductConsumableList: { product: true },
          ticketProductPrescriptionList: { product: true },
          ticketProcedureList: {},
          ticketLaboratoryList: {},
          ticketLaboratoryGroupList: {},
          ticketLaboratoryResultList: true,
          ticketRadiologyList: {},
          ticketUserList: {},
          toAppointment: true,
        },
      })

      await ticketResponse.refreshAllData()
      ticketMap[ticketDemoId] = ticketResponse
      ticketDemo.value = ticketResponse
    } catch (error) {
      console.log('🚀 ~ PrintHtmlUpsert.vue:145  ~ error:', error)
    }
  }
  updatePreview()
}

const handleModalSelectPrintHtmlExampleSuccess = (printHtmlProp: PrintHtml) => {
  printHtml.value.html = printHtmlProp.html
  printHtml.value.css = printHtmlProp.css
  printHtml.value.dataExample = printHtmlProp.dataExample
  printHtml.value.initVariable = printHtmlProp.initVariable
  updatePreview()
}

const startTestPrint = async () => {
  try {
    let data: Record<string, any> = {}
    const ticket = ticketDemo.value
    try {
      eval(printHtml.value.dataExample)
      if (!data || typeof data !== 'object') {
        data = {}
      }
    } catch (error) {
      data = {}
      console.log('🚀 ~ PrintHtmlUpsert.vue:163 ~ startTestPrint ~ error:', error)
    }

    let ticketRadiology: TicketRadiology = data.ticketRadiology || {}

    const doc = iframe.value?.contentDocument || iframe.value?.contentWindow?.document
    if (!doc) return

    const printHtmlCompiled = PrintHtmlCompile.compilePageHtml({
      data: {
        organization: organization.value,
        ticket,
        customer: ticket.customer!,
        ...data,
      },
      template: {
        _header: printHtmlHeader.value.html,
        _content: ticketRadiology.description || '',
        _html: printHtml.value.html,
      },
      variablesString: [
        printHtmlHeader.value.initVariable,
        printHtml.value.initVariable,
        ticketRadiology.customVariables,
      ],
    })
    systemVarLog = printHtmlCompiled?._SYSTEM_VARIABLE || {}
    ESDom.writeWindow(doc, {
      html: printHtmlCompiled?.htmlString || '',
      cssList: [printHtmlHeader.value.css, printHtml.value.css, ticketRadiology.customStyles || ''],
    })
    await ESDom.startPrint('iframe-print', {
      html: printHtmlCompiled?.htmlString || '',
      cssList: [printHtmlHeader.value.css, printHtml.value.css, ticketRadiology.customStyles || ''],
    })
  } catch (error) {
    console.log('🚀 ~ PrintHtmlUpsert.vue:182 ~ startTestPrint ~ error:', error)
  }
}

const showDataSystemPrint = () => {
  console.log(systemVarLog)
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!printHtml.value.id) {
      const response = await PrintHtmlService.createOne(printHtml.value)
      printHtmlOrigin.value = response
      printHtml.value = PrintHtml.from(response)
      emit('success', response, 'CREATE')
    } else {
      const response = await PrintHtmlService.updateOne(printHtml.value.id, printHtml.value)
      printHtmlOrigin.value = response
      printHtml.value = PrintHtml.from(response)
      emit('success', response, 'UPDATE')
    }
    // router.push({ name: 'PrintHtml' })
    AlertStore.addSuccess('Cập nhật thành công', 500)
  } catch (error) {
    console.log('🚀 ~ file: PrintHtmlUpsert.vue:46 ~ handleSave ~ error:', error)
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
  <ModalSelectPrintHtmlExample
    ref="modalSelectPrintHtmlExample"
    @select="handleModalSelectPrintHtmlExampleSuccess"
  />

  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
  </div>

  <form class="md:mx-4 mt-4 p-4 bg-white" @submit.prevent="handleSave">
    <div class="flex flex-wrap gap-4">
      <div style="width: 100px">
        <div class="flex gap-4 justify-start">
          <span>STT</span>
        </div>
        <div>
          <InputNumber v-model:value="printHtml.priority" required />
        </div>
      </div>
      <div style="flex: 1">
        <div class="flex gap-4 justify-start">
          <span>Tên mẫu in</span>
        </div>
        <div>
          <InputText v-model:value="printHtml.name" required />
        </div>
      </div>
    </div>

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
        <div>
          <span>Tùy chỉnh hiển thị</span>
          <span>
            <a @click="modalSelectPrintHtmlExample?.openModal()">
              ( Click vào để lấy từ danh sách mẫu in )
            </a>
          </span>
        </div>
        <div style="flex-grow: 1; border: 1px solid #cdcdcd">
          <MonacoEditor v-model:value="printHtml!.html" @update:value="updatePreview" />
        </div>
      </div>

      <div style="grid-area: css" class="flex flex-col">
        <div>CSS</div>
        <div style="flex-grow: 1; border: 1px solid #cdcdcd">
          <MonacoEditor
            v-model:value="printHtml!.css"
            @update:value="updatePreview"
            language="css"
          />
        </div>
      </div>

      <div style="grid-area: viewer" class="flex flex-col">
        <div class="flex justify-between">
          <a @click="modalSelectTicketExample?.openModal()">Xem thử</a>
          <a @click="startTestPrint">In thử</a>
        </div>
        <div style="flex-grow: 3; box-shadow: 4px 4px 8px 4px rgba(0, 0, 0, 0.2)">
          <iframe ref="iframe" class="preview-iframe" style="width: 100%; height: 100%"></iframe>
        </div>
      </div>

      <div style="grid-area: getDataExample" class="flex flex-col">
        <div>Giả định cách lấy "data" mẫu từ "ticket"</div>
        <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
          <MonacoEditor
            v-model:value="printHtml.dataExample"
            language="javascript"
            @update:value="updatePreview"
          />
        </div>
      </div>

      <div style="grid-area: initVariableHeader" class="flex flex-col">
        <div class="flex justify-between">
          <span>Khởi tạo biến header</span>
          <span></span>
        </div>
        <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
          <MonacoEditor
            v-model:value="printHtmlHeader.initVariable"
            language="javascript"
            @update:value="updatePreview"
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
            v-model:value="printHtml.initVariable"
            language="javascript"
            @update:value="updatePreview"
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

    <div class="mt-4 flex justify-between">
      <div></div>
      <VueButton
        v-if="printHtml.oid != 1 || user?.id == 1"
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
