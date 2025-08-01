<script setup lang="ts">
import { computed, onBeforeMount, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import {
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
} from '../../../common/icon-antd'
import { IconDelete } from '../../../common/icon-google'
import VueDropdown from '../../../common/popover/VueDropdown.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DeliveryStatus, DeliveryStatusText, PaymentViewType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Ticket, TicketActionApi, TicketService, TicketStatus } from '../../../modules/ticket'
import { TicketOrderApi } from '../../../modules/ticket-order'
import { timeToText } from '../../../utils'
import { Breadcrumb } from '../../component'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import ModalTicketReturnProduct from '../../ticket-base/ModalTicketReturnProduct.vue'
import TicketStatusTag from '../../ticket-base/TicketStatusTag.vue'
import { ETicketOrderUpsertMode } from '../upsert/ticket-order-upsert.ref'
import ModalTicketOrderDetailSetting from './ModalTicketOrderDetailSetting.vue'
import ModalTicketOrderPayment from './ModalTicketOrderPayment.vue'
import TicketOrderDetailTable from './TicketOrderDetailTable.vue'
import ModalTicketOrderPreview from './preview/ModalTicketOrderPreview.vue'
import { ticketOrderHtmlContent } from './preview/ticket-order-html-content'
import { ticketOrderDetailRef } from './ticket-order-detail.ref'
import { TicketProduct } from '@/modules/ticket-product'

const modalTicketOrderDetailSetting = ref<InstanceType<typeof ModalTicketOrderDetailSetting>>()
const modalTicketReturnProduct = ref<InstanceType<typeof ModalTicketReturnProduct>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalTicketOrderPreview = ref<InstanceType<typeof ModalTicketOrderPreview>>()
const modalTicketOrderPayment = ref<InstanceType<typeof ModalTicketOrderPayment>>()

const route = useRoute()
const router = useRouter()

const settingStore = useSettingStore()
const { userPermission } = MeService
const { formatMoney, isMobile } = settingStore

const loadingProcess = ref(false)
const loadingRefund = ref(false)

const startFetchData = async (ticketId: number) => {
  try {
    ticketOrderDetailRef.value = await TicketService.detail(ticketId, {
      relation: {
        customer: true,
        paymentList: true,
        // ticketAttributeList: true,
        ticketProductList: { relation: { product: true } },
        ticketProcedureList: { relation: { procedure: true } },
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
    console.log('🚀 ~ startShipAndPayment ~ error:', error)
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
    ticketOrderDetailRef.value.paymentList ||= []
    ticketOrderDetailRef.value.paymentList.push(...response.paymentCreatedList)
  } catch (error) {
    console.log('🚀 ~ startShipAndPayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const clickTerminate = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn "HỦY" hóa đơn này',
    content: [
      ...(ticketOrderDetailRef.value.deliveryStatus === DeliveryStatus.Delivered
        ? ['- Kho hàng sẽ nhập lại tất cả hàng hóa trong đơn']
        : []),
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
        const response = await TicketActionApi.terminate({
          ticketId: ticketOrderDetailRef.value.id!,
        })
        Object.assign(ticketOrderDetailRef.value, response.ticketModified)
        ticketOrderDetailRef.value.paymentList ||= []
        ticketOrderDetailRef.value.paymentList.push(...response.paymentCreatedList)
        ticketOrderDetailRef.value.ticketProductList = TicketProduct.updateListByPartialList(
          ticketOrderDetailRef.value.ticketProductList || [],
          response.ticketProductModifiedAll,
        )
      } catch (error) {
        console.log('🚀 ~ file: TicketOrderDetail.vue:203 ~ clickTerminate ~ error:', error)
      } finally {
        loadingProcess.value = false
      }
    },
  })
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
      ...(ticketOrderDetailRef.value.debt > 0
        ? [
            `- Khi mở lại đơn hàng, trạng thái đơn hàng sẽ chuyển từ "NỢ" => "Đang thực hiện"`,
            `- Đơn hàng không còn trạng thái NỢ, vì vậy khách hàng cũng không còn nợ tiền đơn hàng này`,
            `- Trừ nợ khách hàng: ${formatMoney(ticketOrderDetailRef.value.debt)}`,
          ]
        : ['- Đơn hàng này sẽ quay lại trạng thái: "Đang thực hiện"']),
    ],
    async onOk() {
      const response = await TicketActionApi.reopen({ ticketId: ticketOrderDetailRef.value.id })
      Object.assign(ticketOrderDetailRef.value, response.ticketModified)
      ticketOrderDetailRef.value.paymentList ||= []
      ticketOrderDetailRef.value.paymentList.push(...response.paymentCreatedList)
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
        if (ticketOrderDetailRef.value.status === TicketStatus.Draft) {
          await TicketOrderApi.draftDestroy(ticketOrderDetailRef.value.id!)
        }
        if (ticketOrderDetailRef.value.status === TicketStatus.Deposited) {
          await TicketOrderApi.draftDestroy(ticketOrderDetailRef.value.id!)
        }
        if (ticketOrderDetailRef.value.status === TicketStatus.Cancelled) {
          await TicketOrderApi.draftDestroy(ticketOrderDetailRef.value.id!)
        }
        await TicketOrderApi.draftDestroy(ticketOrderDetailRef.value.id!)
        AlertStore.add({ type: 'success', message: 'Xóa đơn thành công', time: 1000 })
        router.push({ name: 'TicketOrderList' })
      } catch (error) {
        console.log('🚀 ~ TicketOrderDetail.vue:239 ~ onOk ~ error:', error)
      } finally {
        loadingProcess.value = false
      }
    },
  })
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
              query: { mode: ETicketOrderUpsertMode.CREATE },
            })
          "
        >
          Tạo hóa đơn mới
        </VueButton>
      </div>
    </div>
    <div class="mr-2 flex items-center gap-4 flex-wrap">
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
            {{ timeToText(ticketOrderDetailRef.registeredAt, 'hh:mm DD/MM/YY') }}
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
      <div class="flex items-center gap-2">
        <VueButton @click="openModalTicketOrderPreview">
          <IconEye />
          Xem
        </VueButton>
        <VueButton icon="print" @click="startPrint">In</VueButton>
        <VueButton
          v-if="
            userPermission[PermissionId.PAYMENT_CUSTOMER_PAYMENT] &&
            [TicketStatus.Draft, TicketStatus.Deposited, TicketStatus.Executing].includes(
              ticketOrderDetailRef.status,
            )
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
            [TicketStatus.Draft, TicketStatus.Deposited].includes(ticketOrderDetailRef.status) ||
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
                userPermission[PermissionId.PRODUCT_RETURN_PRODUCT] &&
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
                [TicketStatus.Debt, TicketStatus.Completed, TicketStatus.Executing].includes(
                  ticketOrderDetailRef.status,
                )
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
                userPermission[PermissionId.TICKET_ORDER_TERMINATE] &&
                [
                  TicketStatus.Deposited,
                  TicketStatus.Executing,
                  TicketStatus.Debt,
                  TicketStatus.Completed,
                ].includes(ticketOrderDetailRef.status)
              "
              @click="clickTerminate()"
            >
              <span class="text-red-500">
                <IconCloseCircle />
                Hủy Đơn
              </span>
            </a>
            <a
              v-if="
                userPermission[PermissionId.TICKET_ORDER_DRAFT_CRUD] &&
                ticketOrderDetailRef.status === TicketStatus.Draft
              "
              @click="clickDestroy()"
            >
              <span class="text-red-500">
                <IconDelete />
                Xóa Đơn
              </span>
            </a>
            <a
              v-if="
                userPermission[PermissionId.TICKET_ORDER_DEPOSITED_DESTROY] &&
                ticketOrderDetailRef.status === TicketStatus.Deposited &&
                ticketOrderDetailRef.paid === 0
              "
              @click="clickDestroy()"
            >
              <span class="text-red-500">
                <IconDelete />
                Xóa Đơn
              </span>
            </a>
            <a
              v-if="
                userPermission[PermissionId.TICKET_ORDER_CANCELLED_DESTROY] &&
                ticketOrderDetailRef.status === TicketStatus.Cancelled
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
            userPermission[PermissionId.PAYMENT_CUSTOMER_PAYMENT] &&
            userPermission[PermissionId.PRODUCT_SEND_PRODUCT] &&
            userPermission[PermissionId.TICKET_ORDER_CLOSE]
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
            userPermission[PermissionId.PRODUCT_SEND_PRODUCT]
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
            ticketOrderDetailRef.paid > ticketOrderDetailRef.totalMoney &&
            userPermission[PermissionId.PAYMENT_CUSTOMER_REFUND]
          "
          color="green"
          icon="dollar"
          @click="modalTicketOrderPayment?.openModal(PaymentViewType.RefundOverpaid)"
        >
          Hoàn trả tiền
        </VueButton>

        <VueButton
          v-if="
            userPermission[PermissionId.TICKET_ORDER_CLOSE] &&
            ticketOrderDetailRef.deliveryStatus === DeliveryStatus.Delivered &&
            ticketOrderDetailRef.paid <= ticketOrderDetailRef.totalMoney
          "
          color="blue"
          :loading="loadingProcess"
          @click="close()"
        >
          <IconFileDone />
          <span v-if="ticketOrderDetailRef.debt > 0">Đóng phiếu và Ghi nợ</span>
          <span v-else>Kết thúc</span>
        </VueButton>
      </template>

      <template v-if="ticketOrderDetailRef.status === TicketStatus.Debt">
        <VueButton
          v-if="userPermission[PermissionId.PAYMENT_CUSTOMER_PAYMENT]"
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
