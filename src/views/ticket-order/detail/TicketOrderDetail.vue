<script setup lang="ts">
import {
  CloseCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  ExceptionOutlined,
  EyeOutlined,
  FileSearchOutlined,
  FileSyncOutlined,
  MoreOutlined,
  ScheduleOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DeliveryStatus } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Ticket, TicketStatus } from '../../../modules/ticket'
import { useTicketOrderStore } from '../../../modules/ticket-order/ticket-order.store'
import { timeToText } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import { useMeStore } from '.././../../modules/_me/me.store'
import TicketOrderStatusTag from '../TicketOrderStatusTag.vue'
import { ETicketOrderUpsertMode } from '../upsert/ticket-order-upsert.ref'
import ModalTicketOrderDetailSetting from './ModalTicketOrderDetailSetting.vue'
import ModalTicketOrderPayment from './ModalTicketOrderPayment.vue'
import ModalTicketOrderReturnProduct from './ModalTicketOrderReturnProduct.vue'
import TicketOrderDetailTable from './TicketOrderDetailTable.vue'
import ModalTicketOrderPreview from './preview/ModalTicketOrderPreview.vue'
import { ticketOrderHtmlContent } from './preview/ticket-order-html-content'
import { PaymentViewType, ticket } from './ticket-order-detail.ref'
import { TicketOrderApi } from '../../../modules/ticket-order'

const modalTicketOrderDetailSetting = ref<InstanceType<typeof ModalTicketOrderDetailSetting>>()
const modalTicketOrderReturnProduct = ref<InstanceType<typeof ModalTicketOrderReturnProduct>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalTicketOrderPreview = ref<InstanceType<typeof ModalTicketOrderPreview>>()
const modalTicketOrderPayment = ref<InstanceType<typeof ModalTicketOrderPayment>>()

const route = useRoute()
const router = useRouter()

const settingStore = useSettingStore()
const meStore = useMeStore()
const { permissionIdMap } = meStore
const { formatMoney, isMobile } = settingStore

const ticketOrderStore = useTicketOrderStore()

const loadingProcess = ref(false)
const loadingRefund = ref(false)

const startFetchData = async (ticketId: number) => {
  try {
    ticket.value = await ticketOrderStore.detail(ticketId, {
      relation: {
        customer: true,
        customerPaymentList: true,
        ticketProductList: { product: true, batch: true },
        ticketProcedureList: { procedure: true },
        ticketSurchargeList: true,
        ticketExpenseList: true,
      },
    })
  } catch (error) {
    console.log('🚀 ~ file: InvoiceDetails.vue:51 ~ error:', error)
  }
}

onBeforeMount(async () => {
  const ticketId = Number(route.params.id)
  if (ticketId) {
    await startFetchData(ticketId)
  }
})

onUnmounted(() => {
  ticket.value = Ticket.blank()
})

const startEdit = () => {
  router.push({
    name: 'TicketOrderUpsert',
    params: { id: ticket.value.id },
    query: { mode: ETicketOrderUpsertMode.UPDATE },
  })
}

const startCopy = () => {
  router.push({
    name: 'TicketOrderUpsert',
    params: { id: ticket.value.id },
    query: { mode: ETicketOrderUpsertMode.COPY },
  })
}

const destroyDraft = async () => {
  try {
    loadingProcess.value = true
    await TicketOrderApi.destroyDraft(ticket.value.id!)
    AlertStore.add({ type: 'success', message: 'Xóa đơn thành công', time: 1000 })
    router.push({ name: 'TicketOrderList' })
  } catch (error) {
    console.log('🚀 ~ destroyDraft ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const startCancel = async () => {
  try {
    loadingProcess.value = true
    const { ticketBasic, customerPayment } = await TicketOrderApi.cancel({
      ticketId: ticket.value.id!,
    })
    Object.assign(ticket.value, ticketBasic)
    ticket.value.customerPaymentList = ticket.value.customerPaymentList || []
    if (customerPayment) {
      ticket.value.customerPaymentList.push(customerPayment!)
    }
  } catch (error) {
    console.log('🚀 ~ startCancel ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const sendProductAndClose = async () => {
  try {
    loadingProcess.value = true
    const { ticketBasic, customerPayment } =
      await TicketOrderApi.sendProductAndPaymentAndClose({
        ticketId: ticket.value.id!,
        money: 0,
      })
    Object.assign(ticket.value, ticketBasic)
    ticket.value.customerPaymentList = ticket.value.customerPaymentList || []
    if (customerPayment) {
      ticket.value.customerPaymentList.push(customerPayment!)
    }
  } catch (error) {
    console.log('🚀 ~ startShipAndPayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const close = async () => {
  try {
    loadingProcess.value = true
    const { ticketBasic, customerPayment } = await TicketOrderApi.paymentAndClose({
      ticketId: ticket.value.id!,
      money: 0,
    })
    Object.assign(ticket.value, ticketBasic)
    ticket.value.customerPaymentList = ticket.value.customerPaymentList || []
    ticket.value.customerPaymentList.push(customerPayment!)
  } catch (error) {
    console.log('🚀 ~ startShipAndPayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const sendProduct = async () => {
  try {
    loadingProcess.value = true
    const { ticketBasic } = await TicketOrderApi.sendProduct({
      ticketId: ticket.value.id!,
    })
    Object.assign(ticket.value, ticketBasic)
  } catch (error) {
    console.log('🚀 ~ startShipAndPayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const clickCancel = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn "HỦY" hóa đơn này',
    content: [
      '- Kho hàng sẽ nhập lại tất cả hàng hóa trong đơn',
      ...(ticket.value.debt > 0 ? [`- Trừ nợ khách hàng: ${formatMoney(ticket.value.debt)}`] : []),
      ...(ticket.value.paid > 0
        ? [`- Khách hàng nhận lại số tiền đã thanh toán là: ${formatMoney(ticket.value.paid)}`]
        : []),
    ],
    okText: 'Xác nhận HỦY ĐƠN',
    async onOk() {
      await startCancel()
    },
  })
}

const clickReturnProduct = () => {
  modalTicketOrderReturnProduct.value?.openModal()
}

const clickDestroyDraft = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa hóa đơn này ?',
    content: 'Đơn hàng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      await destroyDraft()
    },
  })
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalTicketOrderDetailSetting.value?.openModal()
  }
}

const handleMenuActionClick = (menu: { key: string }) => {
  if (menu.key === 'EDIT_INVOICE') startEdit()
  if (menu.key === 'RETURN_PRODUCT') clickReturnProduct()
  if (menu.key === 'DESTROY_DRAFT') clickDestroyDraft()
  if (menu.key === 'CANCEL') clickCancel()
}

const startPrint = () => {
  const iframePrint = document.getElementById('iframe-print') as HTMLIFrameElement
  const pri = iframePrint.contentWindow as Window
  pri.document.open()
  const content = ticketOrderHtmlContent(ticket.value)
  pri.document.write(content)
  pri.document.close()
  pri.focus()
  pri.print()
}

const openModalTicketOrderPreview = () => {
  modalTicketOrderPreview.value?.openModal(ticket.value)
}
</script>

<template>
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalTicketOrderReturnProduct
    ref="modalTicketOrderReturnProduct"
    @success="() => startFetchData(ticket.id)" />
  <ModalTicketOrderPreview ref="modalTicketOrderPreview" />
  <ModalTicketOrderPayment ref="modalTicketOrderPayment" />
  <ModalTicketOrderDetailSetting ref="modalTicketOrderDetailSetting" />

  <div class="page-header">
    <div class="page-header-content">
      <ScheduleOutlined />
      Thông tin hóa đơn
      <span v-if="ticket.ticketStatus === TicketStatus.Cancelled" style="color: var(--text-red)">
        (Đơn đã bị hủy)
      </span>
      <div>
        <VueButton
          color="blue"
          icon="plus"
          @click="
            $router.push({
              name: 'TicketOrderUpsert',
              query: { mode: ETicketOrderUpsertMode.CREATE },
            })
          ">
          Tạo hóa đơn mới
        </VueButton>
      </div>
    </div>
    <div class="page-header-setting">
      <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]" trigger="click">
        <span>
          <SettingOutlined />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting">Cài đặt hiển thị</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>

  <div class="md:mx-4 mt-4 p-4 bg-white">
    <table>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Khách hàng</td>
        <td class="font-medium px-2 py-1">
          {{ ticket.customer?.fullName }}
          <a class="ml-1" @click="modalCustomerDetail?.openModal(ticket.customer!)">
            <FileSearchOutlined />
          </a>
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Mã đơn</td>
        <td class="px-2 py-1">IV{{ ticket.id }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Thời gian tạo</td>
        <td class="px-2 py-1">
          {{ timeToText(ticket.registeredAt, 'hh:mm DD/MM/YY') }}
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap" style="vertical-align: top">Trạng thái</td>
        <td class="px-2 py-1">
          <TicketOrderStatusTag :ticketStatus="ticket.ticketStatus" />
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap align-top">Ghi chú</td>
        <td class="px-2 py-1">
          {{ ticket.note }}
        </td>
      </tr>
    </table>
  </div>

  <div class="page-main">
    <div class="px-4 pt-4 flex flex-wrap gap-2">
      <VueButton @click="openModalTicketOrderPreview">
        <EyeOutlined />
        Xem
      </VueButton>
      <VueButton icon="print" @click="startPrint">In</VueButton>
      <VueButton class="ml-auto" @click="startCopy">
        <CopyOutlined />
        Copy đơn
      </VueButton>
      <VueButton
        v-if="
          [TicketStatus.Draft].includes(ticket.ticketStatus) ||
          (settingStore.SCREEN_INVOICE_DETAIL.process.forceEdit &&
            ticket.ticketStatus !== TicketStatus.Cancelled)
        "
        color="blue"
        @click="startEdit">
        <ExceptionOutlined />
        Sửa đơn
      </VueButton>

      <a-dropdown>
        <template #overlay>
          <a-menu @click="handleMenuActionClick">
            <a-menu-item
              v-if="
                permissionIdMap[PermissionId.TICKET_ORDER_RETURN_PRODUCT] &&
                [TicketStatus.Debt, TicketStatus.Completed].includes(ticket.ticketStatus)
              "
              key="RETURN_PRODUCT">
              <span class="text-red-500">
                <FileSyncOutlined class="mr-2" />
                Trả Hàng
              </span>
            </a-menu-item>
            <a-menu-item
              v-if="
                permissionIdMap[PermissionId.TICKET_ORDER_DESTROY_DRAFT] &&
                [TicketStatus.Draft].includes(ticket.ticketStatus)
              "
              key="DESTROY_DRAFT">
              <span class="text-red-500">
                <DeleteOutlined class="mr-2" />
                Xóa Đơn
              </span>
            </a-menu-item>
            <a-menu-item
              v-if="
                permissionIdMap[PermissionId.TICKET_ORDER_CANCEL] &&
                [
                  TicketStatus.Approved,
                  TicketStatus.Executing,
                  TicketStatus.Debt,
                  TicketStatus.Completed,
                ].includes(ticket.ticketStatus)
              "
              key="CANCEL">
              <span class="text-red-500">
                <CloseCircleOutlined class="mr-2" />
                Hủy Đơn
              </span>
            </a-menu-item>
          </a-menu>
        </template>
        <a-button shape="circle">
          <template #icon>
            <MoreOutlined style="font-size: 1.2rem; font-weight: bold" />
          </template>
        </a-button>
      </a-dropdown>
    </div>

    <div class="mt-2">
      <TicketOrderDetailTable
        @showInvoicePayment="(view) => modalTicketOrderPayment?.openModal(view)" />
    </div>

    <div class="flex justify-center gap-4 my-4">
      <!-- Gửi hàng và Thanh toán và Đóng (thiếu tiền) -> Show MODAL -> [Complete] | [Debt]-->
      <template
        v-if="
          permissionIdMap[PermissionId.TICKET_ORDER_SEND_PRODUCT] &&
          permissionIdMap[PermissionId.TICKET_ORDER_PAYMENT_AND_CLOSE] &&
          [TicketStatus.Draft, TicketStatus.Approved].includes(ticket.ticketStatus) &&
          ticket.deliveryStatus === DeliveryStatus.Pending &&
          ticket.paid < ticket.totalMoney
        ">
        <VueButton
          color="blue"
          icon="send"
          :loading="loadingProcess"
          @click="
            modalTicketOrderPayment?.openModal(PaymentViewType.SendProductAndPaymentAndClose)
          ">
          Gửi hàng và Thanh toán
        </VueButton>
      </template>

      <!-- Gửi hàng và Đóng (đủ tiền)-> [Complete] -->
      <template
        v-if="
          permissionIdMap[PermissionId.TICKET_ORDER_SEND_PRODUCT] &&
          permissionIdMap[PermissionId.TICKET_ORDER_PAYMENT_AND_CLOSE] &&
          ticket.deliveryStatus === DeliveryStatus.Pending &&
          ticket.paid === ticket.totalMoney
        ">
        <VueButton color="blue" icon="send" :loading="loadingProcess" @click="sendProductAndClose">
          Gửi hàng
        </VueButton>
      </template>

      <!-- Gửi hàng (thừa tiền) -> [Executed] -->
      <template
        v-if="
          permissionIdMap[PermissionId.TICKET_ORDER_SEND_PRODUCT] &&
          ticket.deliveryStatus === DeliveryStatus.Pending &&
          ticket.paid > ticket.totalMoney
        ">
        <VueButton color="blue" icon="send" :loading="loadingProcess" @click="sendProduct">
          Gửi hàng
        </VueButton>
      </template>

      <!-- NoStock: Thanh toán và Đóng (thiếu tiền) -> Show MODAL -> [Complete] || [Debt]-->
      <template
        v-if="
          permissionIdMap[PermissionId.TICKET_ORDER_PAYMENT_AND_CLOSE] &&
          ticket.deliveryStatus === DeliveryStatus.NoStock &&
          ticket.paid < ticket.totalMoney
        ">
        <VueButton
          color="blue"
          icon="send"
          :loading="loadingProcess"
          @click="modalTicketOrderPayment?.openModal(PaymentViewType.PaymentAndClose)">
          Thanh toán
        </VueButton>
      </template>

      <!-- NoStock (hoặc đơn dịch vụ 0 đồng): Đóng (đủ tiền)-> [Complete] -->
      <template
        v-if="
          permissionIdMap[PermissionId.TICKET_ORDER_PAYMENT_AND_CLOSE] &&
          [TicketStatus.Draft, TicketStatus.Approved, TicketStatus.Executing].includes(
            ticket.ticketStatus
          ) &&
          ticket.deliveryStatus === DeliveryStatus.NoStock &&
          ticket.paid === ticket.totalMoney
        ">
        <VueButton color="blue" icon="send" :loading="loadingProcess" @click="close">
          Hoàn thành
        </VueButton>
      </template>

      <!-- Hoàn tiền: NoStock hoặc Delivered -> Show MODAL -> [Complete] | [Executed | Approved]-->
      <template
        v-if="
          permissionIdMap[PermissionId.TICKET_ORDER_REFUND_OVERPAID] &&
          [DeliveryStatus.NoStock, DeliveryStatus.Delivered].includes(ticket.deliveryStatus) &&
          ticket.paid > ticket.totalMoney
        ">
        <VueButton
          color="blue"
          icon="send"
          :loading="loadingProcess"
          @click="modalTicketOrderPayment?.openModal(PaymentViewType.RefundOverpaid)">
          Hoàn tiền
        </VueButton>
      </template>

      <!-- Trả nợ -> Show MODAL -> [Complete] || [Debt]-->
      <template
        v-if="
          permissionIdMap[PermissionId.TICKET_ORDER_PAY_DEBT] &&
          ticket.ticketStatus === TicketStatus.Debt
        ">
        <VueButton
          color="blue"
          icon="dollar"
          :loading="loadingProcess"
          @click="modalTicketOrderPayment?.openModal(PaymentViewType.PayDebt)">
          Trả nợ
        </VueButton>
      </template>
    </div>
  </div>
</template>
