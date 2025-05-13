<script setup lang="ts">
import { computed, onBeforeMount, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import {
  IconAudit,
  IconClose,
  IconCopy,
  IconEdit,
  IconEye,
  IconFileSearch,
  IconFileSync,
  IconMore,
  IconSetting
} from '../../../common/icon-antd'
import { IconDelete } from '../../../common/icon-google'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DeliveryStatus } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Ticket, TicketStatus } from '../../../modules/ticket'
import { TicketOrderApi } from '../../../modules/ticket-order'
import { useTicketOrderStore } from '../../../modules/ticket-order/ticket-order.store'
import { timeToText } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import ModalTicketReturnProduct from '../../ticket-base/ModalTicketReturnProduct.vue'
import TicketStatusTag from '../../ticket-base/TicketStatusTag.vue'
import { useMeStore } from '.././../../modules/_me/me.store'
import { ETicketOrderUpsertMode } from '../upsert/ticket-order-upsert.ref'
import ModalTicketOrderDetailSetting from './ModalTicketOrderDetailSetting.vue'
import ModalTicketOrderPayment from './ModalTicketOrderPayment.vue'
import TicketOrderDetailTable from './TicketOrderDetailTable.vue'
import ModalTicketOrderPreview from './preview/ModalTicketOrderPreview.vue'
import { ticketOrderHtmlContent } from './preview/ticket-order-html-content'
import { PaymentViewType, ticketOrderDetailRef } from './ticket-order-detail.ref'

const modalTicketOrderDetailSetting = ref<InstanceType<typeof ModalTicketOrderDetailSetting>>()
const modalTicketReturnProduct = ref<InstanceType<typeof ModalTicketReturnProduct>>()
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

const ticketOrderDeliveryStatus = computed(() => {
  if (!ticketOrderDetailRef.value.ticketProductList?.length) {
    return DeliveryStatus.NoStock
  }
  if (
    ticketOrderDetailRef.value.ticketProductList!.find((i) => {
      return i.deliveryStatus === DeliveryStatus.Pending
    })
  ) {
    return DeliveryStatus.Pending
  }
  if (
    ticketOrderDetailRef.value.ticketProductList!.find((i) => {
      return i.deliveryStatus === DeliveryStatus.Delivered
    })
  ) {
    return DeliveryStatus.Delivered
  }

  return DeliveryStatus.NoStock
})

const startFetchData = async (ticketId: number) => {
  try {
    ticketOrderDetailRef.value = await ticketOrderStore.detail(ticketId, {
      relation: {
        customer: true,
        customerPaymentList: true,
        // ticketAttributeList: true,
        ticketProductList: { product: true },
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
  ticketOrderDetailRef.value = Ticket.blank()
})

const startEdit = () => {
  router.push({
    name: 'TicketOrderUpsert',
    params: { id: ticketOrderDetailRef.value.id },
    query: { mode: ETicketOrderUpsertMode.UPDATE },
  })
}

const startCopy = () => {
  router.push({
    name: 'TicketOrderUpsert',
    params: { id: ticketOrderDetailRef.value.id },
    query: { mode: ETicketOrderUpsertMode.COPY },
  })
}

const sendProductAndClose = async () => {
  try {
    loadingProcess.value = true
    const response = await TicketOrderApi.sendProductAndPaymentAndClose({
      ticketId: ticketOrderDetailRef.value.id!,
      money: 0,
    })
    Object.assign(ticketOrderDetailRef.value, response.ticket)
    ticketOrderDetailRef.value.ticketProductList = response.ticketProductList
    ticketOrderDetailRef.value.customerPaymentList =
      ticketOrderDetailRef.value.customerPaymentList || []
    if (response.customerPayment) {
      ticketOrderDetailRef.value.customerPaymentList.push(response.customerPayment!)
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
    const response = await TicketOrderApi.paymentAndClose({
      ticketId: ticketOrderDetailRef.value.id!,
      money: 0,
    })
    Object.assign(ticketOrderDetailRef.value, response.ticket)
    ticketOrderDetailRef.value.customerPaymentList ||= []
    if (response.customerPayment) {
      ticketOrderDetailRef.value.customerPaymentList.push(response.customerPayment)
    }
  } catch (error) {
    console.log('🚀 ~ startShipAndPayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const sendProduct = async () => {
  try {
    loadingProcess.value = true
    const response = await TicketOrderApi.sendProduct({
      ticketId: ticketOrderDetailRef.value.id!,
    })
    Object.assign(ticketOrderDetailRef.value, response.ticket)
    ticketOrderDetailRef.value.ticketProductList = response.ticketProductList
  } catch (error) {
    console.log('🚀 ~ startShipAndPayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const clickCancel = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn "HỦY" hóa đơn này',
    content: [
      '- Kho hàng sẽ nhập lại tất cả hàng hóa trong đơn',
      ...(ticketOrderDetailRef.value.debt > 0
        ? [`- Trừ nợ khách hàng: ${formatMoney(ticketOrderDetailRef.value.debt)}`]
        : []),
      ...(ticketOrderDetailRef.value.paid > 0
        ? [
            `- Khách hàng nhận lại số tiền đã thanh toán là: ${formatMoney(ticketOrderDetailRef.value.paid)}`,
          ]
        : []),
      '- Đơn bị hủy sẽ không thể phục hồi lại được',
    ],
    okText: 'Xác nhận HỦY ĐƠN',
    async onOk() {
      try {
        loadingProcess.value = true
        const response = await TicketOrderApi.cancel({
          ticketId: ticketOrderDetailRef.value.id!,
        })
        Object.assign(ticketOrderDetailRef.value, response.ticket)
        ticketOrderDetailRef.value.customerPaymentList = response.customerPaymentList
      } catch (error) {
        console.log('🚀 ~ file: TicketOrderDetail.vue:203 ~ clickCancel ~ error:', error)
      } finally {
        loadingProcess.value = false
      }
    },
  })
}

const clickReturnProduct = () => {
  modalTicketReturnProduct.value?.openModal(ticketOrderDetailRef.value)
}

const clickDestroy = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa hóa đơn này ?',
    content: 'Đơn hàng sẽ bị xóa vĩnh viễn khỏi hệ thống. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        loadingProcess.value = true
        await TicketOrderApi.destroy(ticketOrderDetailRef.value.id!)
        AlertStore.add({ type: 'success', message: 'Xóa đơn thành công', time: 1000 })
        router.push({ name: 'TicketOrderList' })
      } catch (error) {
        console.log('🚀 ~ file: TicketOrderDetail.vue:226 ~ clickDestroy ~ error:', error)
      } finally {
        loadingProcess.value = false
      }
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
  if (menu.key === 'CANCEL_TICKET') clickCancel()
  if (menu.key === 'DESTROY_TICKET') clickDestroy()
}

const startPrint = () => {
  const iframePrint = document.getElementById('iframe-print') as HTMLIFrameElement
  const pri = iframePrint.contentWindow as Window
  pri.document.open()
  const content = ticketOrderHtmlContent(ticketOrderDetailRef.value)
  pri.document.write(content)
  pri.document.close()
  pri.focus()
  pri.print()
}

const openModalTicketOrderPreview = () => {
  modalTicketOrderPreview.value?.openModal(ticketOrderDetailRef.value)
}
</script>

<template>
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalTicketReturnProduct
    ref="modalTicketReturnProduct"
    @success="() => startFetchData(ticketOrderDetailRef.id)"
  />
  <ModalTicketOrderPreview ref="modalTicketOrderPreview" />
  <ModalTicketOrderPayment ref="modalTicketOrderPayment" />
  <ModalTicketOrderDetailSetting ref="modalTicketOrderDetailSetting" />

  <div class="page-header">
    <div class="page-header-content">
      <IconAudit />
      Thông tin hóa đơn
      <span
        v-if="ticketOrderDetailRef.ticketStatus === TicketStatus.Cancelled"
        style="color: var(--text-red)"
      >
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
          "
        >
          Tạo hóa đơn mới
        </VueButton>
      </div>
    </div>
    <div class="page-header-setting">
      <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]" trigger="click">
        <span>
          <IconSetting />
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
      <tbody>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap">Khách hàng</td>
          <td class="font-medium px-2 py-1">
            {{ ticketOrderDetailRef.customer?.fullName }}
            <a
              class="ml-1"
              @click="modalCustomerDetail?.openModal(ticketOrderDetailRef.customerId)"
            >
              <IconFileSearch />
            </a>
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap">Mã đơn</td>
          <td class="px-2 py-1">IV{{ ticketOrderDetailRef.id }}</td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap">Thời gian tạo</td>
          <td class="px-2 py-1">
            {{ timeToText(ticketOrderDetailRef.registeredAt, 'hh:mm DD/MM/YY') }}
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap" style="vertical-align: top">Trạng thái</td>
          <td class="px-2 py-1">
            <TicketStatusTag :ticket="ticketOrderDetailRef" />
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap align-top">Ghi chú</td>
          <td class="px-2 py-1">
            {{ ticketOrderDetailRef.note }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-main">
    <div class="px-4 pt-4 flex flex-wrap gap-2">
      <VueButton @click="openModalTicketOrderPreview">
        <IconEye />
        Xem
      </VueButton>
      <VueButton icon="print" @click="startPrint">In</VueButton>
      <VueButton style="margin-left: auto" @click="startCopy">
        <IconCopy />
        Copy đơn
      </VueButton>
      <VueButton
        v-if="
          [TicketStatus.Draft, TicketStatus.Prepayment].includes(
            ticketOrderDetailRef.ticketStatus,
          ) ||
          (settingStore.SCREEN_INVOICE_DETAIL.process.forceEdit &&
            ticketOrderDetailRef.ticketStatus !== TicketStatus.Cancelled)
        "
        color="blue"
        @click="startEdit"
      >
        <IconEdit />
        Sửa đơn
      </VueButton>

      <a-dropdown>
        <template #overlay>
          <a-menu @click="handleMenuActionClick">
            <a-menu-item
              v-if="
                permissionIdMap[PermissionId.TICKET_ORDER_RETURN_PRODUCT] &&
                [TicketStatus.Debt, TicketStatus.Completed, TicketStatus.Executing].includes(
                  ticketOrderDetailRef.ticketStatus,
                )
              "
              key="RETURN_PRODUCT"
            >
              <span class="text-red-500">
                <IconFileSync class="mr-2" />
                Trả Hàng
              </span>
            </a-menu-item>
            <a-menu-item
              v-if="
                permissionIdMap[PermissionId.TICKET_ORDER_CANCEL] &&
                [
                  TicketStatus.Prepayment,
                  TicketStatus.Executing,
                  TicketStatus.Debt,
                  TicketStatus.Completed,
                ].includes(ticketOrderDetailRef.ticketStatus)
              "
              key="CANCEL_TICKET"
            >
              <span class="text-red-500">
                <IconClose class="mr-2" />
                Hủy Đơn
              </span>
            </a-menu-item>
            <a-menu-item
              v-if="
                (permissionIdMap[PermissionId.TICKET_ORDER_DESTROY_DRAFT] &&
                  [TicketStatus.Draft].includes(ticketOrderDetailRef.ticketStatus)) ||
                ticketOrderDetailRef.ticketStatus === TicketStatus.Cancelled
              "
              key="DESTROY_TICKET"
            >
              <span class="text-red-500">
                <IconDelete class="mr-2" />
                Xóa Đơn
              </span>
            </a-menu-item>
          </a-menu>
        </template>
        <a-button shape="circle">
          <template #icon>
            <IconMore style="font-size: 1.2rem; font-weight: bold" />
          </template>
        </a-button>
      </a-dropdown>
    </div>

    <div class="mt-2">
      <TicketOrderDetailTable
        @showInvoicePayment="(view) => modalTicketOrderPayment?.openModal(view)"
      />
    </div>

    <div class="flex justify-center gap-4 my-4">
      <!-- Nháp, Đặt hàng và Đang xử lý thì cần xử lý -->
      <template
        v-if="
          [TicketStatus.Draft, TicketStatus.Prepayment, TicketStatus.Executing].includes(
            ticketOrderDetailRef.ticketStatus,
          )
        "
      >
        <template v-if="[DeliveryStatus.Pending].includes(ticketOrderDeliveryStatus)">
          <template
            v-if="
              permissionIdMap[PermissionId.TICKET_ORDER_SEND_PRODUCT] &&
              permissionIdMap[PermissionId.TICKET_ORDER_PAYMENT_AND_CLOSE] &&
              ticketOrderDetailRef.paid < ticketOrderDetailRef.totalMoney
            "
          >
            <VueButton
              color="blue"
              icon="send"
              :loading="loadingProcess"
              @click="
                modalTicketOrderPayment?.openModal(PaymentViewType.SendProductAndPaymentAndClose)
              "
            >
              Gửi hàng và Thanh toán
            </VueButton>
          </template>
          <template
            v-if="
              permissionIdMap[PermissionId.TICKET_ORDER_SEND_PRODUCT] &&
              permissionIdMap[PermissionId.TICKET_ORDER_PAYMENT_AND_CLOSE] &&
              ticketOrderDetailRef.paid === ticketOrderDetailRef.totalMoney
            "
          >
            <VueButton
              color="blue"
              icon="send"
              :loading="loadingProcess"
              @click="sendProductAndClose"
            >
              Gửi hàng và Hoàn thành
            </VueButton>
          </template>
          <template
            v-if="
              permissionIdMap[PermissionId.TICKET_ORDER_SEND_PRODUCT] &&
              ticketOrderDetailRef.paid > ticketOrderDetailRef.totalMoney
            "
          >
            <VueButton color="blue" icon="send" :loading="loadingProcess" @click="sendProduct">
              Gửi hàng
            </VueButton>
          </template>
        </template>
        <template
          v-if="
            [DeliveryStatus.Delivered, DeliveryStatus.NoStock].includes(ticketOrderDeliveryStatus)
          "
        >
          <template
            v-if="
              permissionIdMap[PermissionId.TICKET_ORDER_PAYMENT_AND_CLOSE] &&
              ticketOrderDetailRef.paid < ticketOrderDetailRef.totalMoney
            "
          >
            <VueButton
              color="blue"
              icon="send"
              :loading="loadingProcess"
              @click="modalTicketOrderPayment?.openModal(PaymentViewType.PaymentAndClose)"
            >
              Thanh toán
            </VueButton>
          </template>
          <template
            v-if="
              permissionIdMap[PermissionId.TICKET_ORDER_PAYMENT_AND_CLOSE] &&
              ticketOrderDetailRef.paid === ticketOrderDetailRef.totalMoney
            "
          >
            <VueButton color="blue" icon="send" :loading="loadingProcess" @click="close">
              Hoàn thành
            </VueButton>
          </template>
          <template
            v-if="
              permissionIdMap[PermissionId.TICKET_ORDER_REFUND_OVERPAID] &&
              ticketOrderDetailRef.paid > ticketOrderDetailRef.totalMoney
            "
          >
            <VueButton
              color="blue"
              icon="send"
              :loading="loadingProcess"
              @click="modalTicketOrderPayment?.openModal(PaymentViewType.RefundOverpaid)"
            >
              Hoàn tiền
            </VueButton>
          </template>
        </template>
      </template>
      <!-- Nợ thì chỉ cần trả nơ -->
      <template v-if="ticketOrderDetailRef.ticketStatus === TicketStatus.Debt">
        <template v-if="permissionIdMap[PermissionId.TICKET_ORDER_PAY_DEBT]">
          <VueButton
            color="blue"
            icon="dollar"
            :loading="loadingProcess"
            @click="modalTicketOrderPayment?.openModal(PaymentViewType.PayDebt)"
          >
            Trả nợ
          </VueButton>
        </template>
      </template>
      <!-- Kết thúc rồi thì thôi -->
      <template v-if="ticketOrderDetailRef.ticketStatus === TicketStatus.Completed"></template>
    </div>
  </div>
</template>
