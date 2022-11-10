<script setup lang="ts">
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { Arrival, ArrivalInvoiceService } from '@/modules/arrival'
import { InvoiceItemType, PaymentStatus, PaymentStatusText } from '@/modules/enum'
import { Invoice } from '@/modules/invoice'
import type { Procedure } from '@/modules/procedure'
import type { Product } from '@/modules/product'
import { useOrganizationStore } from '@/store/organization.store'
import { formatNumber, timeToText } from '@/utils'
import ModalProcedureDetails from '@/views/procedure/details/ModalProcedureDetails.vue'
import ModalProductDetails from '@/views/product/details/ModalProductDetails.vue'
import {
  CheckCircleOutlined, CopyOutlined, ExceptionOutlined, ExclamationCircleOutlined, EyeOutlined,
  FileDoneOutlined, FileSearchOutlined, FileSyncOutlined, MoreOutlined, PrinterOutlined, ScheduleOutlined, SettingOutlined, StopOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalCustomerDetails from '../../customer/details/ModalCustomerDetails.vue'
import { invoiceHtmlContent } from './invoice-html-content'
import ModalArrivalInvoiceDetailsSettingScreen from './ModalArrivalInvoiceDetailsSettingScreen.vue'
import ModalInvoicePreview from './ModalInvoicePreview.vue'

const modalArrivalInvoiceDetailsSettingScreen = ref<InstanceType<typeof ModalArrivalInvoiceDetailsSettingScreen>>()
const modalCustomerDetails = ref<InstanceType<typeof ModalCustomerDetails>>()
const modalInvoicePreview = ref<InstanceType<typeof ModalInvoicePreview>>()
const modalProductDetails = ref<InstanceType<typeof ModalProductDetails>>()
const modalProcedureDetails = ref<InstanceType<typeof ModalProcedureDetails>>()

const organizationStore = useOrganizationStore()

const route = useRoute()
const router = useRouter()

const arrival = ref<Arrival>(Arrival.blank())
const invoice = ref<Invoice>(Invoice.blank())

const currentInvoiceId = ref<number>()
const newestInvoiceId = ref<number>()

const loadingExport = ref(false)

const startFetchData = async (arrivalId: number) => {
  try {
    const arrivalResponse = await ArrivalInvoiceService.detail(arrivalId, {
      customer: true,
      invoices: true,
    })
    arrivalResponse.invoices.forEach((i) => i.customer = arrivalResponse.customer)
    arrivalResponse.invoices.reverse()

    arrival.value = arrivalResponse
    newestInvoiceId.value = arrivalResponse.invoices[0].id
  } catch (error) {
    console.log('🚀 ~ file: ArrivalInvoiceDetails.vue:51 ~ error:', error)
  }
}

const refreshData = async (arrivalId: number) => {
  await startFetchData(arrivalId)

  currentInvoiceId.value = arrival.value.invoices[0].id
  invoice.value = arrival.value.invoices[0]
}

onBeforeMount(async () => {
  const arrivalId = Number(route.params.id)
  const invoiceId = Number(route.query.invoice_id)
  await startFetchData(arrivalId)

  if (invoiceId) {
    currentInvoiceId.value = invoiceId
    invoice.value = arrival.value.invoices.find((i) => i.id === invoiceId) || Invoice.blank()
  } else {
    currentInvoiceId.value = arrival.value.invoices[0].id
    invoice.value = arrival.value.invoices[0]
  }
})

const handleChangeSelectInvoice = (value: number) => {
  currentInvoiceId.value = value
  invoice.value = arrival.value.invoices.find((i) => i.id === value)!
}

const startPaymentInvoice = async () => {
  try {
    loadingExport.value = true
    const response = await ArrivalInvoiceService.paymentInvoiceDraft(invoice.value.id!)
    if (response.success) {
      await refreshData(response.data.arrivalId)
    }
    else AlertStore.add({ type: 'error', message: response.message })
  } catch (error) {
    console.log('🚀 ~ file: InvoiceDetail.vue:34 ~ startImportStock ~ error:', error)
  } finally {
    loadingExport.value = false
  }
}

const startEdit = () => {
  router.push({ name: 'ArrivalInvoiceUpsert', params: { id: invoice.value.id } })
}

const startCopy = () => {
  router.push({ name: 'ArrivalInvoiceUpsert', query: { copy_id: invoice.value.id } })
}

const startRefund = async () => {
  try {
    loadingExport.value = true
    const response = await ArrivalInvoiceService.refundInvoice(invoice.value.id!)
    if (response.success) {
      await refreshData(response.data.arrivalId)
    }
    else AlertStore.add({ type: 'error', message: response.message })
  } catch (error) {
    console.log('🚀 ~ file: InvoiceDetail.vue:34 ~ startImportStock ~ error:', error)
  } finally {
    loadingExport.value = false
  }
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalArrivalInvoiceDetailsSettingScreen.value?.openModal()
  }
}

const handleMenuActionClick = (menu: { key: string }) => {
  if (menu.key === 'REFUND') startRefund()
}

const startPrint = () => {
  const iframePrint = document.getElementById('iframe-print') as HTMLIFrameElement
  const pri = iframePrint.contentWindow as Window
  pri.document.open()
  const content = invoiceHtmlContent(invoice.value)
  pri.document.write(content)
  pri.document.close()
  pri.focus()
  pri.print()
}

const startOpenImageDemo = () => {
  modalInvoicePreview.value?.openModal(invoice.value)
}

const openModalProductDetail = (data?: Product) => {
  if (data) modalProductDetails.value?.openModal(data)
}

const openModalProcedureDetail = (data?: Procedure) => {
  if (data) modalProcedureDetails.value?.openModal(data)
}

</script>

<template>
  <ModalArrivalInvoiceDetailsSettingScreen ref="modalArrivalInvoiceDetailsSettingScreen" />
  <ModalCustomerDetails ref="modalCustomerDetails" />
  <ModalInvoicePreview ref="modalInvoicePreview" />
  <ModalProductDetails ref="modalProductDetails" />
  <ModalProcedureDetails ref="modalProcedureDetails" />
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.3rem;">
        <ScheduleOutlined style="margin-right: 10px" /> Thông tin tiếp đón
      </div>
      <div>
        <a-dropdown trigger="click">
          <span style="font-size: 1.1rem; cursor: pointer;">
            <SettingOutlined />
          </span>
          <template #overlay>
            <a-menu @click="handleMenuSettingClick">
              <a-menu-item key="screen-setting"> Cài đặt hiển thị </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>
  </div>

  <div class="mx-4 mt-4 p-4 bg-white">
    <div class="flex flex-col md:flex-row">
      <div class="md:w-full w-1/2">
        <p>
          <span class="inline-block w-40">Khách hàng</span>
          <b>{{ arrival.customer?.fullNameVi }}</b>
          <a-tooltip>
            <template #title>Xem chi tiết</template>
            <a class="text-large ml-2" @click="modalCustomerDetails?.openModal(invoice.customer!)">
              <FileSearchOutlined />
            </a>
          </a-tooltip>
        </p>
        <p class="mt-2">
          <span class="inline-block w-40">Mã đơn hàng</span>ĐH{{ invoice.id }}
        </p>
        <div class="mt-2 flex">
          <div class="w-40">Trạng thái</div>
          <div>
            <a-tag v-if="invoice.paymentStatus === PaymentStatus.Unpaid" color="warning">
              <template #icon>
                <ExclamationCircleOutlined />
              </template>
              {{ PaymentStatusText[PaymentStatus.Unpaid] }}
            </a-tag>
            <div v-if="invoice.paymentStatus !== PaymentStatus.Unpaid">
              <a-tag color="success">
                <template #icon>
                  <CheckCircleOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Full] }}
              </a-tag>
              {{ timeToText(invoice.paymentTime, "hh:mm DD/MM/YY") }}
            </div>

            <p v-if="invoice.paymentStatus === PaymentStatus.Refund" class="mt-2">
              <a-tag color="error">
                <template #icon>
                  <StopOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Refund] }}
              </a-tag>
              {{ timeToText(invoice.refundTime, "hh:mm DD/MM/YY") }}
            </p>
          </div>
        </div>
        <p class="mt-4">
          <span class="inline-block w-40">Chi phí</span>{{ formatNumber(invoice.expenses) }}
        </p>
        <p class="mt-2">
          <span class="inline-block w-40">Ghi chú</span>{{ invoice.note }}
        </p>
      </div>
      <div class="md:w-full w-1/2">
        <div>Lịch sử</div>
        <a-select :value="currentInvoiceId" :options="arrival.invoices.map((i: Invoice) => ({
          value: i.id,
          label: `${timeToText(i.refundTime || i.paymentTime || arrival.createTime, 'hh:mm DD/MM/YYYY')} - ${PaymentStatusText[i.paymentStatus]}`
        }))" @change="handleChangeSelectInvoice" :disabled="arrival.invoices.length <= 1" class="w-full"
          placeholder="">
        </a-select>
      </div>
    </div>

  </div>

  <div class="mx-4 mt-4 p-4 bg-white">
    <div class="flex justify-between">
      <div class="flex gap-2">
        <a-button type="default" @click="startOpenImageDemo">
          <template #icon>
            <EyeOutlined />
          </template>
          Xem ảnh
        </a-button>

        <a-button type="default" @click="startPrint">
          <template #icon>
            <PrinterOutlined />
          </template>
          In
        </a-button>
      </div>
      <div class="flex gap-2">
        <a-button type="default" @click="startCopy">
          <template #icon>
            <CopyOutlined />
          </template>
          Copy đơn
        </a-button>
        <a-button
          v-if="invoice.id === newestInvoiceId && (invoice.paymentStatus === PaymentStatus.Unpaid || invoice.paymentStatus === PaymentStatus.Refund)"
          type="primary" @click="startEdit">
          <template #icon>
            <ExceptionOutlined />
          </template>
          Sửa
        </a-button>

        <a-dropdown v-if="invoice.paymentStatus === PaymentStatus.Full">
          <template #overlay>
            <a-menu @click="handleMenuActionClick">
              <a-menu-item v-if="invoice.paymentStatus === PaymentStatus.Full" key="REFUND">
                <span class="text-red-500">
                  <FileSyncOutlined class="mr-2" /> Hoàn trả
                </span>
              </a-menu-item>
            </a-menu>
          </template>
          <a-button shape="circle">
            <template #icon>
              <MoreOutlined style="font-size: 1.2rem; font-weight: bold;" />
            </template>
          </a-button>
        </a-dropdown>
      </div>
    </div>
    <div class="mt-2 table-wrapper w-full">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Tên</th>
            <th v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.invoiceItems.expiryDate">HSD</th>
            <th>S.Lượng</th>
            <th v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.invoiceItems.unit">Đ.Vị</th>
            <th v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.invoiceItems.discount">C.Khấu</th>
            <th>Đ.Giá</th>
            <th>T.Tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(invoiceItem, index) in invoice.invoiceItems" :key="index">
            <td class="text-center">{{ index + 1 }}</td>
            <td>
              <div v-if="invoiceItem.type === InvoiceItemType.ProductBatch" class="flex justify-between">
                <div>
                  <div style="font-weight: 500;">{{ invoiceItem.productBatch?.product?.brandName }}</div>
                  <div v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.invoiceItems.substance">
                    {{ invoiceItem.productBatch?.product?.substance }}
                  </div>
                </div>
                <a v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.invoiceItems.detail" class="text-xl ml-2"
                  @click="openModalProductDetail(invoiceItem.productBatch?.product)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div v-if="invoiceItem.type === InvoiceItemType.Procedure" class="flex justify-between">
                <div style="font-weight: 500;">{{ invoiceItem.procedure?.nameVi }}</div>
                <a v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.invoiceItems.detail" class="text-xl ml-2"
                  @click="openModalProcedureDetail(invoiceItem.procedure)">
                  <FileSearchOutlined />
                </a>
              </div>
            </td>
            <td v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.invoiceItems.expiryDate">
              {{ timeToText(invoiceItem.productBatch?.expiryDate, 'DD/MM/YYYY') }}
            </td>
            <td class="text-center">{{ invoiceItem.quantity / invoiceItem.unit.rate }}</td>
            <td v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.invoiceItems.unit" class="text-center">
              {{ invoiceItem.unit?.name || invoiceItem.productBatch?.product?.unit?.[0]?.name || 'Lần' }}
            </td>
            <td v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.invoiceItems.discount" class="text-center">
              <a-tag v-if="invoiceItem.discountType === 'VNĐ'" color="success" style="cursor: pointer;">
                {{ formatNumber(invoiceItem.discountMoney * invoiceItem.unit.rate) }}
              </a-tag>
              <a-tag v-if="invoiceItem.discountType === '%'" color="success" style="cursor: pointer;">
                {{ invoiceItem.discountPercent || 0 }}%
              </a-tag>
            </td>
            <td class="text-right">
              <div
                v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.invoiceItems.expectedPrice && invoiceItem.discountMoney"
                class="text-xs italic" style="color: #ff4d4f">
                <del> {{ formatNumber(invoiceItem.expectedPrice * invoiceItem.unit.rate) }}</del>
              </div>
              <div>{{ formatNumber(invoiceItem.actualPrice * invoiceItem.unit.rate) }}</div>
            </td>
            <td class="text-right">{{ formatNumber(invoiceItem.actualPrice * invoiceItem.quantity) }}</td>
          </tr>

          <tr v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.paymentInfo.totalItemMoney">
            <td colspan="100">
              <div class="flex justify-end text-right font-bold ">
                <div>Tiền hàng</div>
                <div class="w-[200px]">{{ formatNumber(invoice.totalItemMoney) }}</div>
              </div>
            </td>
          </tr>
          <tr v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.paymentInfo.discount">
            <td colspan="100">
              <div class="flex justify-end text-right">
                <div>Chiết khấu</div>
                <div class="w-[200px]">
                  <a-tag v-if="invoice.discountType === '%'" color="success">
                    {{ invoice.discountPercent || 0 }}%
                  </a-tag>
                  {{ formatNumber(invoice.discountMoney) }}
                </div>
              </div>
            </td>
          </tr>
          <tr v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.paymentInfo.surcharge">
            <td colspan="100">
              <div class="flex justify-end text-right">
                <div>Phụ phí</div>
                <div class="w-[200px]">{{ formatNumber(invoice.surcharge) }}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td colspan="100">
              <div class="flex justify-end text-right font-bold">
                <div>Thành tiền</div>
                <div class="w-[200px]">{{ formatNumber(invoice.totalMoney) }}</div>
              </div>
            </td>
          </tr>
          <tr v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.paymentInfo.payment">
            <td colspan="100">
              <div class="flex justify-end text-right">
                <div>Thanh toán</div>
                <div class="w-[200px]">{{ formatNumber(invoice.totalMoney - invoice.debt) }}</div>
              </div>
            </td>
          </tr>
          <tr v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_DETAIL.paymentInfo.debt">
            <td colspan="100">
              <div class="flex justify-end text-right">
                <div>Ghi nợ</div>
                <div class="w-[200px]">{{ formatNumber(invoice.debt) }}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mx-2 flex justify-center mt-6 mb-2">
      <a-button v-if="invoice.paymentStatus === PaymentStatus.Unpaid" type="primary" @click="startPaymentInvoice"
        :loading="loadingExport" class="btn-green">
        <template #icon>
          <FileDoneOutlined />
        </template>
        Thanh toán
      </a-button>
    </div>
  </div>
</template>
