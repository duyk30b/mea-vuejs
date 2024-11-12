<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MonacoEditor from '../../../common/MonacoEditor.vue'
import VueButton from '../../../common/VueButton.vue'
import { IconPrint } from '../../../common/icon'
import { InputText, VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import {
  PrintHtml,
  PrintHtmlApi,
  PrintHtmlService,
  PrintHtmlType,
} from '../../../modules/print-html'
import {
  ticketClinicPrintInvoiceCompiledTemplate,
  ticketClinicPrintInvoiceDefault,
} from '../../../modules/print-html/print-content/ticket-clinic-print-invoice'
import {
  ticketClinicPrintPrescriptionCompiledTemplate,
  ticketClinicPrintPrescriptionDefault,
} from '../../../modules/print-html/print-content/ticket-clinic-print-prescription'
import { Ticket } from '../../../modules/ticket'
import { useTicketClinicStore } from '../../../modules/ticket-clinic'
import ModalSelectTicketExample from './ModalSelectTicketExample.vue'

const modalSelectTicketExample = ref<InstanceType<typeof ModalSelectTicketExample>>()

const emit = defineEmits<{
  (e: 'success', value: PrintHtml, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const route = useRoute()
const router = useRouter()

const iframe = ref<HTMLIFrameElement>()

const printHtml = ref(PrintHtml.blank())
const ticketDemo = ref(Ticket.blank())
const saveLoading = ref(false)

const ticketMap: Record<string, Ticket> = {}

onBeforeMount(async () => {
  const printHtmlId = Number(route.params.id)
  if (printHtmlId) {
    printHtml.value = await PrintHtmlApi.detail(printHtmlId, { relation: { paraclinical: true } })
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
      const response = await PrintHtmlService.updateOne(printHtml.value.id, printHtml.value.content)
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

  const doc = iframe.value?.contentDocument || iframe.value?.contentWindow?.document
  if (doc) {
    let textDom = ''
    if (printHtml.value.type === 'PRESCRIPTION') {
      textDom = ticketClinicPrintPrescriptionCompiledTemplate({
        organization: useMeStore().organization,
        ticket: ticketDemo.value,
        customer: ticketDemo.value.customer!,
        ticketProductPrescriptionList: ticketDemo.value.ticketProductPrescriptionList || [],
        doctorName: '',
        htmlString: printHtml.value.content,
      })
    } else if (printHtml.value.type === 'INVOICE') {
      textDom = ticketClinicPrintInvoiceCompiledTemplate({
        organization: useMeStore().organization,
        ticket: ticketDemo.value,
        customer: ticketDemo.value.customer!,
        htmlString: printHtml.value.content,
      })
    } else {
      return
    }

    doc.open()
    doc.write(textDom)
    doc.close()
  }
}

const handleModalSelectTicketDemoSuccess = async (ticketDemoId: number) => {
  if (ticketMap[ticketDemoId]) {
    ticketDemo.value = ticketMap[ticketDemoId]
  } else {
    const ticketResponse = await useTicketClinicStore().detail(ticketDemoId, {
      relation: {
        customer: true,
        customerPaymentList: false, // query khi bật modal thanh toán

        ticketDiagnosis: true,
        // ticketProductList: true,
        ticketProductConsumableList: { product: true, batch: true },
        ticketProductPrescriptionList: { product: true, batch: true },
        ticketProcedureList: { procedure: true },
        ticketParaclinicalList: { paraclinical: true },

        ticketUserList: { user: true },
        toAppointment: true,
      },
    })
    ticketMap[ticketDemoId] = ticketResponse
    ticketDemo.value = ticketResponse
  }
  updatePreview()
}

const handleUpdateType = async (type: keyof typeof PrintHtmlType) => {
  if (type === 'PRESCRIPTION') {
    printHtml.value.content = await ticketClinicPrintPrescriptionDefault()
  } else if (type === 'INVOICE') {
    printHtml.value.content = await ticketClinicPrintInvoiceDefault()
  } else {
    printHtml.value.content = ''
  }
}
</script>

<template>
  <ModalSelectTicketExample
    ref="modalSelectTicketExample"
    @select="handleModalSelectTicketDemoSuccess" />
  <div class="page-header">
    <div class="page-header-content">
      <IconPrint />
      Thông tin mẫu in
    </div>
  </div>

  <form class="md:mx-4 mt-4 p-4 bg-white flex flex-wrap gap-4" @submit.prevent="handleSave">
    <div class="" style="flex-basis: 90%; flex-grow: 1">
      <div>Loại</div>
      <div v-if="printHtml.type !== 'PARACLINICAL'">
        <VueSelect
          v-model:value="printHtml.type"
          :disabled="!!printHtml.id"
          :options="[
            { text: PrintHtmlType.DIAGNOSIS, value: 'DIAGNOSIS' },
            { text: PrintHtmlType.PRESCRIPTION, value: 'PRESCRIPTION' },
            { text: PrintHtmlType.INVOICE, value: 'INVOICE' },
          ]"
          @update:value="handleUpdateType"></VueSelect>
      </div>
      <div v-if="printHtml.type == 'PARACLINICAL'">
        <InputText :value="printHtml.paraclinical?.name" disabled></InputText>
      </div>
    </div>

    <div style="flex-basis: 600px; flex-grow: 1; height: 600px" class="flex flex-col">
      <div>Data</div>
      <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
        <MonacoEditor v-model:value="printHtml!.content" @update:value="updatePreview" />
      </div>
    </div>

    <div style="flex-basis: 600px; flex-grow: 1; height: 600px" class="flex flex-col">
      <div>
        <a @click="modalSelectTicketExample?.openModal()">Chọn Phiếu khám demo</a>
      </div>
      <div style="flex-grow: 3">
        <iframe ref="iframe" class="preview-iframe" style="width: 100%; height: 100%"></iframe>
      </div>
    </div>

    <div style="flex-basis: 90%; flex-grow: 1" class="mt-4 flex justify-between">
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
