<script setup lang="ts">
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney } from '@/common/vue-form'
import { Invoice, InvoiceItemType, InvoiceService, InvoiceStatus } from '@/modules/invoice'
import type { Procedure } from '@/modules/procedure'
import type { Product } from '@/modules/product'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import ModalProcedureDetail from '@/views/procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import {
  CheckCircleOutlined, CopyOutlined,
  DeleteOutlined,
  ExceptionOutlined,
  ExclamationCircleOutlined, EyeOutlined,
  FileDoneOutlined, FileSearchOutlined, FileSyncOutlined,
  MoreOutlined, PrinterOutlined, ScheduleOutlined, SettingOutlined, StopOutlined,
} from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import ModalInvoiceDetailSettingScreen from './ModalInvoiceDetailSettingScreen.vue'
import ModalInvoicePreview from './ModalInvoicePreview.vue'
import { invoiceHtmlContent } from './invoice-html-content'

const modalInvoiceDetailSettingScreen = ref<InstanceType<typeof ModalInvoiceDetailSettingScreen>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalInvoicePreview = ref<InstanceType<typeof ModalInvoicePreview>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const route = useRoute()
const router = useRouter()

// const isMobile = ref(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
const isMobile = window.innerWidth < 768

const invoice = ref<Invoice>(Invoice.blank())

const loadingProcess = ref(false)
const loadingRefund = ref(false)

const startFetchData = async (invoiceId: number) => {
  try {
    invoice.value = await InvoiceService.detail(invoiceId, {
      customer: true,
      invoiceItems: true,
    })
  } catch (error) {
    console.log('🚀 ~ file: InvoiceDetails.vue:51 ~ error:', error)
  }
}

onBeforeMount(async () => {
  const invoiceId = Number(route.params.id)
  if (invoiceId) {
    await startFetchData(invoiceId)
  }
})

const startEdit = () => {
  router.push({ name: 'InvoiceUpsert', params: { id: invoice.value.id }, query: { mode: 'UPDATE' } })
}

const startCopy = () => {
  router.push({ name: 'InvoiceUpsert', params: { id: invoice.value.id }, query: { mode: 'COPY' } })
}

const startDelete = async () => {
  try {
    loadingProcess.value = true
    await InvoiceService.deleteDraft(invoice.value.id!)
    AlertStore.add({ type: 'success', message: 'Xóa đơn thành công', time: 1000 })
    router.push({ name: 'InvoiceList' })
  } catch (error) {
    console.log('🚀 ~ startDelete ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const startRefund = async () => {
  try {
    loadingProcess.value = true
    await InvoiceService.startRefund(invoice.value.id!)
    await startFetchData(invoice.value.id!)
    AlertStore.add({ type: 'success', message: 'Trả hàng thành công', time: 1000 })
  } catch (error) {
    console.log('🚀 ~ startRefund ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const startPayment = async () => {
  try {
    loadingProcess.value = true
    await InvoiceService.startPayment(invoice.value.id!, invoice.value.debt)
    await startFetchData(invoice.value.id!)
    AlertStore.add({ type: 'success', message: 'Thanh toán thành công', time: 1000 })
  } catch (error) {
    console.log('🚀 ~ startPayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const startShip = async () => {
  try {
    loadingProcess.value = true
    await InvoiceService.startShip(invoice.value.id!)
    await startFetchData(invoice.value.id!)
    AlertStore.add({ type: 'success', message: 'Gửi hàng thành công', time: 1000 })
  } catch (error) {
    console.log('🚀 ~ startShip ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const startShipAndPayment = async () => {
  try {
    loadingProcess.value = true
    await InvoiceService.startShipAndPayment(invoice.value.id!, invoice.value.debt)
    await startFetchData(invoice.value.id!)
    AlertStore.add({ type: 'success', message: 'Thành công', time: 2000 })
  } catch (error) {
    console.log('🚀 ~ startShipAndPayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const clickRefund = () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn hoàn trả phiếu nhập này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Sau khi hoàn trả, kho hàng sẽ phải nhập lại số lượng tất cả hàng hóa trong đơn, hoàn trả ghi nợ của đơn hàng này nếu có',
    async onOk() {
      await startRefund()
    },
    onCancel() { },
  })
}

const clickDelete = () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn muốn xóa phiếu nhập này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Đơn hàng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      await startDelete()
    },
    onCancel() { },
  })
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalInvoiceDetailSettingScreen.value?.openModal()
  }
}

const handleMenuActionClick = (menu: { key: string }) => {
  if (menu.key === 'REFUND') clickRefund()
  if (menu.key === 'DELETE') clickDelete()
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
  const data = Invoice.fromInstance(invoice.value)
  modalInvoicePreview.value?.openModal(data)
}

const openModalProductDetail = (data?: Product) => {
  if (data) modalProductDetail.value?.openModal(data)
}

const openModalProcedureDetail = (data?: Procedure) => {
  if (data) modalProcedureDetail.value?.openModal(data)
}

</script>

<template>
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalInvoicePreview ref="modalInvoicePreview" />
  <ModalInvoiceDetailSettingScreen ref="modalInvoiceDetailSettingScreen" />

  <div class="page-header">
    <div class="page-header-content">
      <ScheduleOutlined /> Thông tin hóa đơn
    </div>
    <div>
      <a-dropdown trigger="click">
        <span>
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

  <div class="md:mx-4 mt-4 p-4 bg-white">
    <table>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Khách hàng</td>
        <td class="font-medium px-2 py-1">{{ invoice.customer?.fullName }}
          <a class="ml-1" @click="modalCustomerDetail?.openModal(invoice.customer!)">
            <FileSearchOutlined />
          </a>
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Mã đơn</td>
        <td class="px-2 py-1">IV{{ invoice.id }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Thời gian tạo</td>
        <td class="px-2 py-1">{{ timeToText(invoice.createTime, "hh:mm DD/MM/YY") }}</td>
      </tr>
      <tr v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceProcessType === 2">
        <td class="px-2 py-1 whitespace-nowrap">T.Gian gửi hàng</td>
        <td class="px-2 py-1"> {{ timeToText(invoice.shipTime, "hh:mm DD/MM/YY") }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">T.Gian thanh toán</td>
        <td class="px-2 py-1"> {{ timeToText(invoice.paymentTime, "hh:mm DD/MM/YY") }}</td>
      </tr>
      <tr v-if="invoice.status === InvoiceStatus.Refund">
        <td class="px-2 py-1 whitespace-nowrap">T.Gian hoàn trả</td>
        <td class="px-2 py-1"> {{ timeToText(invoice.refundTime, "hh:mm DD/MM/YY") }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap" style="vertical-align:top">Trạng thái</td>
        <td class="px-2 py-1">
          <a-tag v-if="invoice.status === InvoiceStatus.Draft" color="warning">
            <template #icon>
              <ExclamationCircleOutlined />
            </template>
            Nháp
          </a-tag>
          <a-tag v-if="invoice.status === InvoiceStatus.Process" color="processing">
            <template #icon>
              <ExclamationCircleOutlined />
            </template>
            Đang thực hiện
          </a-tag>

          <a-tag v-if="invoice.status === InvoiceStatus.Finish" color="success">
            <template #icon>
              <CheckCircleOutlined />
            </template>
            Hoàn thành
          </a-tag>

          <a-tag v-if="invoice.status === InvoiceStatus.Refund" color="error">
            <template #icon>
              <StopOutlined />
            </template>
            Hoàn trả
          </a-tag>
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Chi phí</td>
        <td class="px-2 py-1"> {{ formatMoney(invoice.expenses) }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap align-top">Ghi chú</td>
        <td class="px-2 py-1"> {{ invoice.note }}</td>
      </tr>
    </table>
  </div>

  <div class="page-main">
    <div class="px-4 pt-2 flex flex-wrap gap-2">
      <a-button v-if="isMobile" type="default" @click="startOpenImageDemo">
        <template #icon>
          <EyeOutlined />
        </template>
        Xem ảnh
      </a-button>
      <a-button v-if="!isMobile" type="default" @click="startPrint">
        <template #icon>
          <PrinterOutlined />
        </template>
        In
      </a-button>
      <a-button class="ml-auto" type="default" @click="startCopy">
        <template #icon>
          <CopyOutlined />
        </template>
        Copy đơn
      </a-button>
      <a-button v-if="invoice.status === InvoiceStatus.Draft" type="primary" @click="startEdit">
        <template #icon>
          <ExceptionOutlined />
        </template>
        Sửa
      </a-button>
      <a-dropdown>
        <template #overlay>
          <a-menu @click="handleMenuActionClick">
            <a-menu-item v-if="invoice.status === InvoiceStatus.Finish || invoice.status === InvoiceStatus.Process"
              key="REFUND">
              <span class="text-red-500">
                <FileSyncOutlined class="mr-2" /> Hoàn trả
              </span>
            </a-menu-item>
            <a-menu-item v-if="invoice.status === InvoiceStatus.Draft" key="DELETE">
              <span class="text-red-500">
                <DeleteOutlined class="mr-2" /> Xóa đơn
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

    <div v-if="isMobile" class="mt-2">
      <table class="table-mobile">
        <thead>
          <tr>
            <th>#</th>
            <th>Sản phẩm</th>
            <th>SL</th>
            <th>TT</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(invoiceItem, index) in (invoice.invoiceItems || [])" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem;">{{ index + 1 }}</td>
            <td>
              <div v-if="invoiceItem.type === InvoiceItemType.ProductBatch">
                <div class="font-medium text-justify">
                  {{ invoiceItem.productBatch?.product?.brandName }}
                  <a v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail" class="ml-1"
                    @click="openModalProductDetail(invoiceItem.productBatch?.product)">
                    <FileSearchOutlined />
                  </a>
                </div>
                <div v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.substance" style="font-size: 0.8rem;"
                  class="text-justify">
                  {{ invoiceItem.productBatch?.product?.substance }}
                </div>
                <div class="flex gap-2 flex-wrap" style="font-size: 0.8rem;">
                  <div v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.batch">
                    Lô: {{ invoiceItem.productBatch.batch }}
                  </div>
                  <div v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expiryDate">
                    HSD: {{ timeToText(invoiceItem.productBatch.expiryDate, 'DD/MM/YY') }}
                  </div>
                </div>
              </div>
              <div v-if="invoiceItem.type === InvoiceItemType.Procedure">
                <div class="font-medium text-justify">
                  {{ invoiceItem.procedure?.name }}
                  <a v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail" class="ml-1"
                    @click="modalProcedureDetail?.openModal(invoiceItem.procedure!)">
                    <FileSearchOutlined />
                  </a>
                </div>
              </div>
              <div class="flex gap-2" style="font-size: 0.8rem;">
                <div v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice">NY:
                  <span class="font-medium">
                    {{ formatMoney(invoiceItem.expectedPrice * invoiceItem.unit.rate) }}
                  </span>
                  <span v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit">
                    /{{ invoiceItem.unit.name }}
                  </span>
                </div>
                <div
                  v-if="invoiceItem.discountMoney && organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount">
                  - CK:
                  <span v-if="invoiceItem.discountType === 'VNĐ'" class="font-medium">
                    {{ formatMoney(invoiceItem.discountMoney * invoiceItem.unit.rate) }}
                  </span>
                  <span v-if="invoiceItem.discountType === '%'" class="font-medium">
                    {{ invoiceItem.discountPercent || 0 }}%
                  </span>
                </div>
                <div>- ĐG:
                  <span class="font-medium">
                    {{ formatMoney(invoiceItem.actualPrice * invoiceItem.unit.rate) }}
                  </span>
                  <span v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit">
                    /{{ invoiceItem.unit.name }}
                  </span>
                </div>
              </div>
            </td>
            <td class="text-center whitespace-nowrap">
              {{ invoiceItem.quantity / invoiceItem.unit.rate }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(invoiceItem.actualPrice * invoiceItem.quantity) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="px-4 mt-2 table-wrapper w-full">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Tên</th>
            <th v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expiryDate">HSD</th>
            <th>S.Lượng</th>
            <th v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit">Đ.Vị</th>
            <th v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount">C.Khấu</th>
            <th>Đ.Giá</th>
            <th>T.Tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(invoiceItem, index) in invoice.invoiceItems" :key="index">
            <td class="text-center">{{ index + 1 }}</td>
            <td>
              <div v-if="invoiceItem.type === InvoiceItemType.ProductBatch">
                <div class="text-justify font-medium">{{ invoiceItem.productBatch?.product?.brandName }}
                  <a v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail" class="text-xl ml-2"
                    @click="openModalProductDetail(invoiceItem.productBatch?.product)">
                    <FileSearchOutlined />
                  </a>
                </div>
                <div v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.substance">
                  {{ invoiceItem.productBatch?.product?.substance }}
                </div>
              </div>
              <div v-if="invoiceItem.type === InvoiceItemType.Procedure"
                class="text-justify font-medium whitespace-nowrap" style="word-break: break-all;">
                {{ invoiceItem.procedure?.name }}
                <a v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail" class="text-xl ml-2"
                  @click="openModalProcedureDetail(invoiceItem.procedure)">
                  <FileSearchOutlined />
                </a>
              </div>
            </td>
            <td v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expiryDate" class="text-center">
              {{ timeToText(invoiceItem.productBatch?.expiryDate, 'DD/MM/YYYY') }}
            </td>
            <td class="text-center">{{ invoiceItem.quantity / invoiceItem.unit.rate }}</td>
            <td v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit" class="text-center">
              {{ invoiceItem.unit?.name || invoiceItem.productBatch?.product?.unit?.[0]?.name || 'Lần' }}
            </td>
            <td v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount" class="text-center">
              <a-tag v-if="invoiceItem.discountType === 'VNĐ'" color="success" style="cursor: pointer;">
                {{ formatMoney(invoiceItem.discountMoney * invoiceItem.unit.rate) }}
              </a-tag>
              <a-tag v-if="invoiceItem.discountType === '%'" color="success" style="cursor: pointer;">
                {{ invoiceItem.discountPercent || 0 }}%
              </a-tag>
            </td>
            <td class="text-right">
              <div
                v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice && invoiceItem.discountMoney"
                class="text-xs italic" style="color: #ff4d4f">
                <del> {{ formatMoney(invoiceItem.expectedPrice * invoiceItem.unit.rate) }}</del>
              </div>
              <div>{{ formatMoney(invoiceItem.actualPrice * invoiceItem.unit.rate) }}</div>
            </td>
            <td class="text-right">{{ formatMoney(invoiceItem.actualPrice * invoiceItem.quantity) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:px-4">
      <table class="table-mobile">
        <tbody>
          <tr v-if="organizationStore.SCREEN_INVOICE_DETAIL.paymentInfo.totalItemMoney">
            <td class="text-right font-medium" style="width: 60%;">Tiền hàng</td>
            <td class="text-right font-medium"> {{ formatMoney(invoice.totalItemMoney) }} </td>
          </tr>
          <tr v-if="organizationStore.SCREEN_INVOICE_DETAIL.paymentInfo.discount">
            <td class="text-right">Giảm giá</td>
            <td class="text-right">
              <a-tag v-if="invoice.discountType === '%'" color="success">
                {{ invoice.discountPercent || 0 }}%
              </a-tag>
              {{ formatMoney(invoice.discountMoney) }}
            </td>
          </tr>
          <tr v-if="organizationStore.SCREEN_INVOICE_DETAIL.paymentInfo.surcharge">
            <td class="text-right">Phụ phí</td>
            <td class="text-right">{{ formatMoney(invoice.surcharge) }}</td>
          </tr>
          <tr>
            <td class="text-right font-medium">Tổng tiền</td>
            <td class="text-right font-medium">{{ formatMoney(invoice.totalMoney) }}</td>
          </tr>
          <tr v-if="organizationStore.SCREEN_INVOICE_DETAIL.paymentInfo.payment">
            <td class="text-right">Thanh toán</td>
            <td class="text-right">
              <InputMoney v-if="!invoice.paymentTime" class="input-payment" :value="invoice.totalMoney - invoice.debt"
                @update:value="(data: number) => invoice.debt = invoice.totalMoney - data" />
              <span v-else>
                {{ formatMoney(invoice.totalMoney - invoice.debt) }}
              </span>
            </td>
          </tr>
          <tr v-if="organizationStore.SCREEN_INVOICE_DETAIL.paymentInfo.debt">
            <td class="text-right">Ghi nợ</td>
            <td class="text-right">
              <InputMoney v-if="!invoice.paymentTime" class="input-payment" v-model:value="invoice.debt" />
              <span v-else>
                {{ formatMoney(invoice.debt) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="invoice.status !== InvoiceStatus.Refund" class="flex justify-center gap-4 mt-6 mb-2">
      <template v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceProcessType === 1">
        <a-button v-if="invoice.status === InvoiceStatus.Draft" type="primary" @click="startShipAndPayment"
          :loading="loadingProcess" class="btn-green">
          <template #icon>
            <FileDoneOutlined />
          </template>
          Gửi hàng và thanh toán
        </a-button>
      </template>
      <template v-if="organizationStore.SCREEN_INVOICE_DETAIL.invoiceProcessType === 2">
        <a-button v-if="!invoice.shipTime" type="primary" @click="startShip" :loading="loadingProcess" class="btn-green">
          <template #icon>
            <FileDoneOutlined />
          </template>
          Gửi hàng
        </a-button>
        <a-button v-if="!invoice.paymentTime" type="primary" @click="startPayment" :loading="loadingProcess"
          class="btn-green">
          <template #icon>
            <FileDoneOutlined />
          </template>
          Thanh toán
        </a-button>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.input-payment) {
  width: 100%;
  max-width: 200px;
  padding-right: 1rem;

  & input {
    text-align: right !important;
  }
}
</style>
