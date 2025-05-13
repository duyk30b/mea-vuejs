<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconPrint } from '../../../../common/icon-antd'
import MonacoEditor from '../../../../common/monaco-editor/MonacoEditor.vue'
import { InputText } from '../../../../common/vue-form'
import VueButton from '../../../../common/VueButton.vue'
import { useMeStore } from '../../../../modules/_me/me.store'
import { Laboratory, LaboratoryService } from '../../../../modules/laboratory'
import { LaboratoryGroup, LaboratoryGroupService } from '../../../../modules/laboratory-group'
import { PrintHtml, PrintHtmlApi, PrintHtmlService } from '../../../../modules/print-html'
import { printHtmlCompiledTemplate } from '../../../../modules/print-html/print-html.compiled'
import { Procedure, ProcedureService } from '../../../../modules/procedure'
import { Radiology, RadiologyService } from '../../../../modules/radiology'
import { Ticket } from '../../../../modules/ticket'
import { useTicketClinicStore } from '../../../../modules/ticket-clinic'
import { ESDom } from '../../../../utils'
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

let procedureMap: Record<string, Procedure> = {}
let laboratoryMap: Record<string, Laboratory> = {}
let laboratoryGroupMap: Record<string, LaboratoryGroup> = {}
let radiologyMap: Record<string, Radiology> = {}

const printHtml = ref(PrintHtml.blank())
const ticketDemo = ref(Ticket.blank())
const saveLoading = ref(false)

const ticketMap: Record<string, Ticket> = {}
const dataStringExample = ref<string>('')

onBeforeMount(async () => {
  const printHtmlId = Number(route.params.id)
  if (printHtmlId) {
    printHtml.value = await PrintHtmlApi.detail(printHtmlId)
  } else {
    printHtml.value = PrintHtml.blank()
  }

  const fetchData = await Promise.all([
    ProcedureService.getMap(),
    LaboratoryService.getMap(),
    LaboratoryGroupService.getMap(),
    RadiologyService.getMap(),
  ])
  procedureMap = fetchData[0]
  laboratoryMap = fetchData[1]
  laboratoryGroupMap = fetchData[2]
  radiologyMap = fetchData[3]
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
  const data = {}
  const ticket = ticketDemo.value
  try {
    eval(printHtml.value.dataExample)
    dataStringExample.value = JSON.stringify(data, null, 2)
  } catch (error) {
    console.log('🚀 ~ PrintHtmlUpsert.vue:93 ~ updatePreview ~ error:', error)
  }

  const doc = iframe.value?.contentDocument || iframe.value?.contentWindow?.document
  if (!doc) return

  const textDom = printHtmlCompiledTemplate({
    organization,
    ticket,
    data,
    printHtml: printHtml.value,
  })

  doc.open()
  doc.write(textDom)
  doc.close()
}

const handleModalSelectTicketDemoSuccess = async (ticketDemoId: number) => {
  if (ticketMap[ticketDemoId]) {
    ticketDemo.value = ticketMap[ticketDemoId]
  } else {
    try {
      const ticketResponse = await useTicketClinicStore().detail(ticketDemoId, {
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

      Ticket.refreshTreeData(ticketResponse, {
        procedureMap,
        laboratoryMap,
        laboratoryGroupMap,
        radiologyMap,
      })

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
    const data = {}
    const ticket = ticketDemo.value
    try {
      eval(printHtml.value.dataExample)
    } catch (error) {
      console.log('🚀 ~ PrintHtmlUpsert.vue:163 ~ startTestPrint ~ error:', error)
    }

    const textDom = printHtmlCompiledTemplate({
      organization,
      ticket,
      data,
      printHtml: printHtml.value,
    })

    await ESDom.startPrint('iframe-print', textDom)
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
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
  <div class="page-header">
    <div class="page-header-content">
      <IconPrint />
      Thông tin mẫu in
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
        grid-template-areas: 'content viewer' 'variable dataText' 'getData dataText';
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: 600px 200px 200px;
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

      <div style="grid-area: variable" class="flex flex-col">
        <div>Tùy chỉnh biến</div>
        <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
          <MonacoEditor
            v-model:value="printHtml!.initVariable"
            language="typescript"
            @update:value="updatePreview"
          />
        </div>
      </div>

      <div style="grid-area: getData" class="flex flex-col">
        <div>Cách lấy "data"</div>
        <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
          <MonacoEditor
            v-model:value="printHtml!.dataExample"
            language="json"
            @update:value="updatePreview"
          />
        </div>
      </div>

      <div style="grid-area: dataText; overflow: scroll" class="flex flex-col">
        <div>"data"</div>
        <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
          <MonacoEditor :value="dataStringExample" language="json" />
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
