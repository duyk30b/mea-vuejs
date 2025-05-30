<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MonacoEditor from '../../../../common/monaco-editor/MonacoEditor.vue'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputText } from '../../../../common/vue-form'
import VueButton from '../../../../common/VueButton.vue'
import { useMeStore } from '../../../../modules/_me/me.store'
import { PrintHtml, PrintHtmlApi, PrintHtmlService } from '../../../../modules/print-html'
import { compiledTemplatePrintHtml } from '../../../../modules/print-html/print-html.compiled'
import { Ticket, TicketService } from '../../../../modules/ticket'
import { ESDom } from '../../../../utils'
import Breadcrumb from '../../../component/Breadcrumb.vue'
import ModalSelectPrintHtmlExample from './ModalSelectPrintHtmlExample.vue'
import ModalSelectTicketExample from './ModalSelectTicketExample.vue'

const modalSelectTicketExample = ref<InstanceType<typeof ModalSelectTicketExample>>()
const modalSelectPrintHtmlExample = ref<InstanceType<typeof ModalSelectPrintHtmlExample>>()

const emit = defineEmits<{
  (e: 'success', value: PrintHtml, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()
const iframe = ref<HTMLIFrameElement>()

const route = useRoute()
const router = useRouter()
const meStore = useMeStore()
const organization = meStore.organization

const printHtml = ref(PrintHtml.blank())
const ticketDemo = ref(Ticket.blank())
const saveLoading = ref(false)

const ticketMap: Record<string, Ticket> = {}
const dataStringExample = ref<string>('')

let systemVarLog = {}

onBeforeMount(async () => {
  const printHtmlId = Number(route.params.id)
  if (printHtmlId) {
    printHtml.value = await PrintHtmlApi.detail(printHtmlId)
  } else {
    printHtml.value = PrintHtml.blank()
  }
})

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!printHtml.value.id) {
      const response = await PrintHtmlService.createOne(printHtml.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await PrintHtmlService.updateOne(printHtml.value.id, printHtml.value)
      emit('success', response, 'UPDATE')
    }
    router.push({ name: 'PrintHtmlList' })
  } catch (error) {
    console.log('🚀 ~ file: PrintHtmlUpsert.vue:46 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const updatePreview = () => {
  if (!ticketDemo.value.id) return
  if (!iframe.value) return
  let data = {}
  const ticket = ticketDemo.value
  try {
    eval(printHtml.value.dataExample)
    if (!data || typeof data !== 'object') {
      data = {}
    }
    dataStringExample.value = JSON.stringify(data, null, 2)
  } catch (error) {
    data = {}
    console.log('🚀 ~ PrintHtmlUpsert.vue:93 ~ updatePreview ~ error:', error)
  }

  const doc = iframe.value?.contentDocument || iframe.value?.contentWindow?.document
  if (!doc) return

  const compiledResult = compiledTemplatePrintHtml({
    organization,
    ticket,
    data,
    printHtml: printHtml.value,
  })
  systemVarLog = compiledResult.systemVar || {}

  if (!compiledResult.html) {
    return
  }

  ESDom.writeWindow(doc, { html: compiledResult.html })
}

const handleModalSelectTicketDemoSuccess = async (ticketDemoId: number) => {
  if (ticketMap[ticketDemoId]) {
    ticketDemo.value = ticketMap[ticketDemoId]
  } else {
    try {
      const ticketResponse = await TicketService.detail(ticketDemoId, {
        relation: {
          customer: true,
          customerPaymentList: false, // query khi bật modal thanh toán

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
  printHtml.value.content = printHtmlProp.content
  printHtml.value.dataExample = printHtmlProp.dataExample
  printHtml.value.initVariable = printHtmlProp.initVariable
  updatePreview()
}

const startTestPrint = async () => {
  try {
    let data = {}
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

    const compiledResult = compiledTemplatePrintHtml({
      organization,
      ticket,
      data,
      printHtml: printHtml.value,
    })
    systemVarLog = compiledResult.systemVar || {}

    if (!compiledResult.html) {
      return AlertStore.addError('Cài đặt in thất bại')
    }
    await ESDom.startPrint('iframe-print', {
      html: compiledResult.html,
    })
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
  }
}

const showDataSystemPrint = () => {
  console.log(systemVarLog)
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
    <div>
      <div class="flex gap-4 justify-start">
        <span>Tên mẫu in</span>
      </div>
      <div>
        <InputText v-model:value="printHtml.name" required />
      </div>
    </div>

    <div
      class="mt-4"
      style="
        display: grid;
        grid-template-areas: 'content viewer' 'getDataExample dataText' 'initVariable  dataText';
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: 600px 100px 200px;
        gap: 16px;
      "
    >
      <div style="grid-area: content" class="flex flex-col">
        <div>
          <span>Tùy chỉnh hiển thị</span>
          <span>
            <a @click="modalSelectPrintHtmlExample?.openModal()">
              ( Click vào để lấy từ danh sách mẫu in )
            </a>
          </span>
        </div>
        <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
          <MonacoEditor v-model:value="printHtml!.content" @update:value="updatePreview" />
        </div>
      </div>

      <div style="grid-area: viewer" class="flex flex-col">
        <div class="flex justify-between">
          <a @click="modalSelectTicketExample?.openModal()">Xem thử</a>
          <a @click="startTestPrint">In thử</a>
        </div>
        <div style="flex-grow: 3">
          <iframe ref="iframe" class="preview-iframe" style="width: 100%; height: 100%"></iframe>
        </div>
      </div>

      <div style="grid-area: getDataExample" class="flex flex-col">
        <div>Giả định cách lấy "data" mẫu từ "ticket"</div>
        <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
          <MonacoEditor
            v-model:value="printHtml!.dataExample"
            language="javascript"
            @update:value="updatePreview"
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
            v-model:value="printHtml!.initVariable"
            language="javascript"
            @update:value="updatePreview"
          />
        </div>
      </div>

      <div style="grid-area: dataText; overflow: scroll" class="flex flex-col">
        <div>Kết quả "data" mẫu</div>
        <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
          <MonacoEditor read-only :value="dataStringExample" language="json" />
        </div>
      </div>
    </div>

    <div class="mt-4 flex justify-between">
      <div></div>
      <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">Lưu lại</VueButton>
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
