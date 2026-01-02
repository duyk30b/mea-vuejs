<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import {
  IconBug,
  IconCloseCircle,
  IconCopy,
  IconDollar,
  IconEdit,
  IconEye,
  IconFileDone,
  IconFileSearch,
  IconFileSync,
  IconMore,
  IconSetting,
} from '@/common/icon-antd'
import { IconDelete } from '@/common/icon-google'
import { VueTooltip } from '@/common/popover'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DeliveryStatus, DeliveryStatusText, PaymentViewType } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PrintHtmlAction, PrintHtmlType } from '@/modules/print-html'
import { Ticket, TicketActionApi, TicketService, TicketStatus } from '@/modules/ticket'
import { TicketProcedureService } from '@/modules/ticket-procedure'
import { TicketProduct, TicketProductService } from '@/modules/ticket-product'
import { TicketOrderApi } from '@/modules/ticket/api/ticket-order.api'
import { timeToText } from '@/utils'
import { Breadcrumb } from '@/views/component'
import ModalCustomerDetail from '@/views/customer/detail/ModalCustomerDetail.vue'
import ModalTicketReturnProduct from '@/views/room/room-ticket-base/ModalTicketReturnProduct.vue'
import TicketStatusTag from '@/views/room/room-ticket-base/TicketStatusTag.vue'
import { onBeforeMount, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ETicketOrderUpsertMode } from '../upsert/ticket-order-upsert.ref'
import ModalTicketOrderDetailSetting from './ModalTicketOrderDetailSetting.vue'
import ModalTicketOrderPayment from './ModalTicketOrderPayment.vue'
import ModalTicketOrderTerminal from './ModalTicketOrderTerminal.vue'
import TicketOrderDetailTable from './TicketOrderDetailTable.vue'
import { ticketOrderDetailRef } from './ticket-order-detail.ref'

const modalTicketOrderDetailSetting = ref<InstanceType<typeof ModalTicketOrderDetailSetting>>()
const modalTicketReturnProduct = ref<InstanceType<typeof ModalTicketReturnProduct>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalTicketOrderPayment = ref<InstanceType<typeof ModalTicketOrderPayment>>()
const modalTicketOrderTerminal = ref<InstanceType<typeof ModalTicketOrderTerminal>>()

const route = useRoute()
const router = useRouter()

const settingStore = useSettingStore()
const { userPermission } = MeService
const { formatMoney, isMobile } = settingStore

const loadingProcess = ref(false)
const loadingRefund = ref(false)

const startFetchData = async (ticketId: string) => {
  try {
    ticketOrderDetailRef.value = await TicketService.detail(ticketId, {
      relation: {
        customer: true,
        paymentList: true,
        // ticketAttributeList: true,
        ticketProductList: { batch: true, product: true },
        ticketProcedureList: true,
        ticketSurchargeList: true,
        ticketExpenseList: true,
      },
    })
    await Promise.all([
      TicketProductService.refreshRelation(ticketOrderDetailRef.value.ticketProductList),
      TicketProcedureService.refreshRelation(ticketOrderDetailRef.value.ticketProcedureList),
    ])
  } catch (error) {
    console.log('🚀 ~ TicketOrderDetailContainer.vue:81 ~ startFetchData ~ error:', error)
  }
}

onBeforeMount(async () => {
  const ticketId = route.params.ticketId as string
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
    params: { ticketId: ticketOrderDetailRef.value.id, roomId: ticketOrderDetailRef.value.roomId },
    query: { mode: ETicketOrderUpsertMode.UPDATE },
  })
}

const startCopy = () => {
  router.push({
    name: 'TicketOrderUpsert',
    params: { ticketId: ticketOrderDetailRef.value.id, roomId: ticketOrderDetailRef.value.roomId },
    query: { mode: ETicketOrderUpsertMode.COPY },
  })
}

const sendProduct = async () => {
  try {
    loadingProcess.value = true
    const response = await TicketActionApi.sendProduct({
      ticketId: ticketOrderDetailRef.value.id!,
      ticketProductIdList: (ticketOrderDetailRef.value.ticketProductList || []).map((i) => i.id),
    })
    Object.assign(ticketOrderDetailRef.value, response.ticketModified)
    ticketOrderDetailRef.value.ticketProductList = TicketProduct.updateListByPartialList(
      ticketOrderDetailRef.value.ticketProductList || [],
      response.ticketProductModifiedAll,
    )
  } catch (error) {
    console.log('🚀 ~ TicketOrderDetailContainer.vue:125 ~ sendProduct ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const close = async () => {
  try {
    loadingProcess.value = true
    const response = await TicketActionApi.close({
      ticketId: ticketOrderDetailRef.value.id!,
    })
    Object.assign(ticketOrderDetailRef.value, response.ticketModified)
    if (response.paymentCreated) {
      ticketOrderDetailRef.value.paymentList ||= []
      ticketOrderDetailRef.value.paymentList.push(response.paymentCreated)
    }
  } catch (error) {
    console.log('🚀 ~ TicketOrderDetailContainer.vue:143 ~ close ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const clickReturnProduct = () => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketOrderDetailRef.value.status)) {
    return ModalStore.alert({
      title: 'Trạng thái đơn hàng không hợp lệ ?',
      content: 'Cần mở lại đơn hàng trước khi hoàn trả sản phẩm',
    })
  } else {
    modalTicketReturnProduct.value?.openModal(ticketOrderDetailRef.value)
  }
}

const clickReopen = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn mở lại đơn hàng này ?',
    content: [
      '- Đơn hàng này sẽ quay lại trạng thái: "Đang thực hiện"',
      '- Đơn hàng đang thực hiện có thể tiếp tục các hành động: Thanh toán, Gửi hàng, Hoàn trả ...',
    ],
    async onOk() {
      const response = await TicketActionApi.reopen({ ticketId: ticketOrderDetailRef.value.id })
      Object.assign(ticketOrderDetailRef.value, response.ticketModified)
    },
  })
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
        console.log('🚀 ~ TicketOrderDetailContainer.vue:185 ~ clickDestroy ~ error:', error)
      } finally {
        loadingProcess.value = false
      }
    },
  })
}

const startPrint = async () => {
  await PrintHtmlAction.startPrintTicketOrderDetail({
    ticket: ticketOrderDetailRef.value,
    customer: ticketOrderDetailRef.value.customer!,
  })
}

const openModalTicketOrderPreview = async () => {
  const htmlText = await PrintHtmlAction.startWriteTicketOrderPreview({
    data: { ticket: ticketOrderDetailRef.value, customer: ticketOrderDetailRef.value.customer! },
    printHtmlType: PrintHtmlType.TicketOrderDetail,
  })
  if (!htmlText) return

  ModalStore.htmlContent({
    style: '',
    modalMaskStyle: 'background-color: rgb(89 92 135)',
    title: 'PHIẾU BÁN HÀNG',
    htmlText: htmlText || '',
  })
}
</script>

<template>
  <ModalTicketOrderTerminal ref="modalTicketOrderTerminal" />
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalTicketReturnProduct
    ref="modalTicketReturnProduct"
    @success="() => startFetchData(ticketOrderDetailRef.id)"
  />
  <ModalTicketOrderPayment ref="modalTicketOrderPayment" />
  <ModalTicketOrderDetailSetting ref="modalTicketOrderDetailSetting" />

  <div class="mx-4 mt-4 gap-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex gap-2 text-lg font-medium items-center">
        <Breadcrumb />
        <span
          v-if="ticketOrderDetailRef.status === TicketStatus.Cancelled"
          style="color: var(--text-red)"
        >
          (Đơn đã bị hủy)
        </span>
      </div>
      <div class="">
        <VueButton
          color="blue"
          icon="plus"
          @click="
            $router.push({
              name: 'TicketOrderUpsert',
              params: { roomId: ticketOrderDetailRef.roomId },
              query: { mode: ETicketOrderUpsertMode.CREATE },
            })
          "
        >
          Tạo hóa đơn mới
        </VueButton>
      </div>
    </div>
    <div class="mr-2 flex items-center gap-4 flex-wrap">
      <div v-if="CONFIG.MODE === 'development'">
        <VueTooltip style="color: violet">
          <template #trigger>
            <IconBug width="1.4em" height="1.4em" />
          </template>
          <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
            <pre>{{ JSON.stringify(ticketOrderDetailRef, null, 4) }}</pre>
          </div>
        </VueTooltip>
      </div>
      <VueDropdown>
        <template #trigger>
          <span style="font-size: 1.2rem; cursor: pointer">
            <IconSetting />
          </span>
        </template>
        <div class="vue-menu">
          <a
            v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
            @click="modalTicketOrderDetailSetting?.openModal()"
          >
            Cài đặt hiển thị
          </a>
        </div>
      </VueDropdown>
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
            {{ timeToText(ticketOrderDetailRef.createdAt, 'hh:mm DD/MM/YY') }}
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap" style="vertical-align: top">Trạng thái</td>
          <td class="px-2 py-1">
            <div class="flex items-center gap-4">
              <TicketStatusTag :ticket="ticketOrderDetailRef" />
              <span
                v-if="
                  ![TicketStatus.Debt, TicketStatus.Completed, TicketStatus.Cancelled].includes(
                    ticketOrderDetailRef.status,
                  )
                "
                style="color: #555; font-style: italic"
              >
                ({{ DeliveryStatusText[ticketOrderDetailRef.deliveryStatus] }})
              </span>
            </div>
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
    <div class="px-4 pt-4 flex items-center justify-between flex-wrap gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <VueButton @click="openModalTicketOrderPreview">
          <IconEye />
          Xem
        </VueButton>
        <VueButton icon="print" @click="startPrint">In</VueButton>
        <VueButton
          v-if="
            ticketOrderDetailRef.deliveryStatus === DeliveryStatus.Pending &&
            userPermission[PermissionId.TICKET_CHANGE_PRODUCT_SEND_PRODUCT]
          "
          icon="send"
          @click="sendProduct"
        >
          Gửi hàng
        </VueButton>
        <VueButton
          v-if="
            userPermission[PermissionId.TICKET_PAYMENT_MONEY] &&
            [
              TicketStatus.Draft,
              TicketStatus.Schedule,
              TicketStatus.Deposited,
              TicketStatus.Executing,
            ].includes(ticketOrderDetailRef.status)
          "
          color="green"
          icon="dollar"
          @click="modalTicketOrderPayment?.openModal(PaymentViewType.Prepayment)"
        >
          Tạm ứng
        </VueButton>
      </div>
      <div class="flex items-center gap-2">
        <VueButton style="margin-left: auto" @click="startCopy">
          <IconCopy />
          Copy đơn
        </VueButton>
        <VueButton
          v-if="
            [TicketStatus.Schedule, TicketStatus.Draft, TicketStatus.Deposited].includes(
              ticketOrderDetailRef.status,
            ) ||
            (settingStore.SCREEN_INVOICE_DETAIL.process.forceEdit &&
              ticketOrderDetailRef.status !== TicketStatus.Cancelled)
          "
          color="blue"
          @click="startEdit"
        >
          <IconEdit />
          Sửa đơn
        </VueButton>
        <VueDropdown>
          <template #trigger>
            <div class="vue-circle">
              <IconMore style="font-size: 1.5rem; font-weight: bold" />
            </div>
          </template>
          <div class="vue-menu">
            <a
              v-if="
                userPermission[PermissionId.TICKET_CHANGE_PRODUCT_RETURN_PRODUCT] &&
                [TicketStatus.Debt, TicketStatus.Completed, TicketStatus.Executing].includes(
                  ticketOrderDetailRef.status,
                )
              "
              @click="clickReturnProduct()"
            >
              <span class="text-red-500">
                <IconFileSync />
                Trả Hàng
              </span>
            </a>
            <a
              v-if="
                [TicketStatus.Debt, TicketStatus.Completed].includes(ticketOrderDetailRef.status)
              "
              @click="clickReopen()"
            >
              <span class="text-red-500">
                <IconFileSync />
                Mở lại phiếu
              </span>
            </a>
            <a
              v-if="
                ![TicketStatus.Debt, TicketStatus.Completed].includes(
                  ticketOrderDetailRef.status,
                ) && ticketOrderDetailRef.paidTotal
              "
              @click="modalTicketOrderPayment?.openModal(PaymentViewType.RefundOverpaid)"
            >
              <span class="text-red-500">
                <IconFileSync />
                Hoàn trả tiền
              </span>
            </a>
            <a
              v-if="
                userPermission[PermissionId.TICKET_TERMINATE] &&
                [
                  TicketStatus.Deposited,
                  TicketStatus.Executing,
                  TicketStatus.Debt,
                  TicketStatus.Completed,
                ].includes(ticketOrderDetailRef.status)
              "
              @click="modalTicketOrderTerminal?.openModal()"
            >
              <span class="text-red-500">
                <IconCloseCircle />
                Hủy Đơn
              </span>
            </a>
            <a
              v-if="
                userPermission[PermissionId.TICKET_DRAFT_CRUD] &&
                ticketOrderDetailRef.paidTotal === 0 &&
                (ticketOrderDetailRef.status === TicketStatus.Draft ||
                  ticketOrderDetailRef.status === TicketStatus.Cancelled ||
                  ticketOrderDetailRef.status === TicketStatus.Deposited)
              "
              @click="clickDestroy()"
            >
              <span class="text-red-500">
                <IconDelete />
                Xóa Đơn
              </span>
            </a>
          </div>
        </VueDropdown>
      </div>
    </div>

    <div class="mt-2">
      <TicketOrderDetailTable
        @showInvoicePayment="(view) => modalTicketOrderPayment?.openModal(view)"
      />
    </div>

    <div class="flex justify-center gap-4 my-4">
      <template v-if="ticketOrderDetailRef.status === TicketStatus.Draft">
        <VueButton
          v-if="
            userPermission[PermissionId.TICKET_PAYMENT_MONEY] &&
            userPermission[PermissionId.TICKET_CHANGE_PRODUCT_SEND_PRODUCT] &&
            userPermission[PermissionId.TICKET_CLOSE]
          "
          color="blue"
          icon="send"
          @click="modalTicketOrderPayment?.openModal(PaymentViewType.SendProductAndPaymentAndClose)"
        >
          Gửi hàng và Thanh toán
        </VueButton>
      </template>

      <template
        v-if="
          [TicketStatus.Deposited, TicketStatus.Executing].includes(ticketOrderDetailRef.status)
        "
      >
        <VueButton
          v-if="
            ticketOrderDetailRef.deliveryStatus === DeliveryStatus.Pending &&
            userPermission[PermissionId.TICKET_CHANGE_PRODUCT_SEND_PRODUCT]
          "
          color="blue"
          :loading="loadingProcess"
          icon="send"
          @click="sendProduct"
        >
          Gửi hàng
        </VueButton>

        <VueButton
          v-if="
            ticketOrderDetailRef.paidTotal > ticketOrderDetailRef.totalMoney &&
            userPermission[PermissionId.TICKET_REFUND_MONEY]
          "
          color="cyan"
          :loading="loadingProcess"
          icon="dollar"
          @click="modalTicketOrderPayment?.openModal(PaymentViewType.RefundOverpaid)"
        >
          Hoàn trả tiền
        </VueButton>

        <VueButton
          v-if="
            userPermission[PermissionId.TICKET_CLOSE] &&
            ticketOrderDetailRef.deliveryStatus === DeliveryStatus.Delivered &&
            ticketOrderDetailRef.paidTotal <= ticketOrderDetailRef.totalMoney
          "
          color="blue"
          :loading="loadingProcess"
          @click="close()"
        >
          <IconFileDone />
          <span v-if="ticketOrderDetailRef.debtTotal > 0">Đóng phiếu và Ghi nợ</span>
          <span v-else>Kết thúc</span>
        </VueButton>
      </template>

      <template v-if="ticketOrderDetailRef.status === TicketStatus.Debt">
        <VueButton
          v-if="userPermission[PermissionId.TICKET_PAYMENT_MONEY]"
          color="blue"
          :loading="loadingProcess"
          @click="modalTicketOrderPayment?.openModal(PaymentViewType.PayDebt)"
        >
          <IconDollar />
          Trả nợ
        </VueButton>
      </template>
    </div>
  </div>
</template>
