<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import {
  IconCloseCircle,
  IconCopy,
  IconDollar,
  IconEdit,
  IconFileDone,
  IconFileSearch,
  IconGroup,
  IconMore,
  IconSetting,
} from '@/common/icon-antd'
import { IconDelete } from '@/common/icon-google'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DeliveryStatus, DeliveryStatusText, PaymentViewType } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PrintHtmlAction } from '@/modules/print-html'
import {
  PurchaseOrder,
  PurchaseOrderActionApi,
  PurchaseOrderQueryApi,
  PurchaseOrderStatus,
} from '@/modules/purchase-order'
import { timeToText } from '@/utils'
import { onBeforeMount, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalDistributorDetail from '../../distributor/detail/ModalDistributorDetail.vue'
import PurchaseOrderStatusTag from '../PurchaseOrderStatusTag.vue'
import { EPurchaseOrderUpsertMode } from '../upsert/purchase-order-upsert.store'
import ModalPurchaseOrderDetailSettingScreen from './ModalPurchaseOrderDetailSettingScreen.vue'
import ModalPurchaseOrderPayment from './ModalPurchaseOrderPayment.vue'
import PurchaseOrderDetailTable from './PurchaseOrderDetailTable.vue'
import { purchaseOrder } from './purchase-order-detail.ref'

const modalPurchaseOrderDetailSettingScreen =
  ref<InstanceType<typeof ModalPurchaseOrderDetailSettingScreen>>()
const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()
const modalPurchaseOrderPayment = ref<InstanceType<typeof ModalPurchaseOrderPayment>>()

const route = useRoute()
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission } = MeService

const saveLoading = ref(false)

const loadingProcess = ref(false)

const startFetchData = async (purchaseOrderId: number) => {
  try {
    purchaseOrder.value = await PurchaseOrderQueryApi.detail(purchaseOrderId, {
      relation: {
        distributor: true,
        purchaseOrderItemList: { product: true, batch: true },
        paymentList: true,
      },
    })
  } catch (error) {
    console.log('🚀 ~ file: PurchaseOrderDetail.vue:58 ~ startFetchData ~ error:', error)
  }
}

onBeforeMount(async () => {
  const purchaseOrderId = Number(route.params.id)
  if (purchaseOrderId) {
    await startFetchData(purchaseOrderId)
  }
})

onUnmounted(() => {
  purchaseOrder.value = PurchaseOrder.blank()
})

const startEdit = () => {
  router.push({
    name: 'PurchaseOrderUpsertContainer',
    params: { id: purchaseOrder.value.id },
    query: { mode: EPurchaseOrderUpsertMode.UPDATE },
  })
}

const startCopy = () => {
  router.push({
    name: 'PurchaseOrderUpsertContainer',
    params: { id: purchaseOrder.value.id },
    query: { mode: EPurchaseOrderUpsertMode.COPY },
  })
}

const sendProduct = async () => {
  try {
    loadingProcess.value = true
    const result = await PurchaseOrderActionApi.sendProduct({
      purchaseOrderId: purchaseOrder.value.id!,
    })
    Object.assign(purchaseOrder.value, result.purchaseOrderModified)
  } catch (error) {
    console.log('🚀 ~ startShipAndPayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const close = async () => {
  try {
    loadingProcess.value = true
    const result = await PurchaseOrderActionApi.close({ purchaseOrderId: purchaseOrder.value.id! })
    Object.assign(purchaseOrder.value, result.purchaseOrderModified)
    purchaseOrder.value.paymentList?.push(...result.paymentCreatedList)
  } catch (error) {
    console.log('🚀 ~ PurchaseOrderDetail.vue:124 ~ close ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const clickTerminate = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn hủy phiếu nhập này ?',
    content: [
      ...(purchaseOrder.value.deliveryStatus === DeliveryStatus.Delivered
        ? ['- Kho hàng sẽ xuất ra tất cả hàng hóa trong phiếu']
        : []),
      ...(purchaseOrder.value.debt > 0 &&
      [PurchaseOrderStatus.Debt].includes(purchaseOrder.value.status)
        ? [`- Trừ nợ NCC: ${formatMoney(purchaseOrder.value.debt)}`]
        : []),
      ...(purchaseOrder.value.paid > 0
        ? [`- NCC trả lại số tiền đã thanh toán là: ${formatMoney(purchaseOrder.value.paid)}`]
        : []),
    ],
    okText: 'Xác nhận HỦY PHIẾU',
    async onOk() {
      try {
        loadingProcess.value = true
        const result = await PurchaseOrderActionApi.terminate(purchaseOrder.value.id!)
        Object.assign(purchaseOrder.value, result.purchaseOrderModified)
        purchaseOrder.value.paymentList?.push(...result.paymentCreatedList)
        AlertStore.add({ type: 'success', message: 'Hủy phiếu thành công', time: 1000 })
      } catch (error) {
        console.log('🚀 ~ file: PurchaseOrderDetail.vue:114 ~ startTerminate ~ error:', error)
      } finally {
        loadingProcess.value = false
      }
    },
  })
}

const clickDestroy = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa phiếu nhập này ?',
    content: 'Phiếu nhập đã xóa vĩnh viễn khỏi hệ thống. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        loadingProcess.value = true
        if (purchaseOrder.value.status === PurchaseOrderStatus.Draft) {
          await PurchaseOrderActionApi.draftDestroy(purchaseOrder.value.id!)
        }
        if (purchaseOrder.value.status === PurchaseOrderStatus.Deposited) {
          await PurchaseOrderActionApi.draftDestroy(purchaseOrder.value.id!)
        }
        if (purchaseOrder.value.status === PurchaseOrderStatus.Cancelled) {
          await PurchaseOrderActionApi.draftDestroy(purchaseOrder.value.id!)
        }
        AlertStore.add({ type: 'success', message: 'Xóa phiếu thành công', time: 1000 })
        router.push({ name: 'PurchaseOrderList' })
      } catch (error) {
        console.log('🚀 ~ destroyDraft ~ error:', error)
      } finally {
        loadingProcess.value = false
      }
    },
  })
}

const openModalDistributorDetail = (distributorId: number) => {
  modalDistributorDetail.value?.openModal(distributorId)
}

const handleModalPurchaseOrderPaymentSuccess = () => {}

const startPrintPurchaseOrderDetail = async (purchaseOrderData: PurchaseOrder) => {
  await PrintHtmlAction.startPrintPurchaseOrderDetail({ purchaseOrder: purchaseOrderData })
}
</script>

<template>
  <ModalPurchaseOrderDetailSettingScreen
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalPurchaseOrderDetailSettingScreen"
  />
  <ModalDistributorDetail ref="modalDistributorDetail" />
  <ModalPurchaseOrderPayment
    ref="modalPurchaseOrderPayment"
    @success="handleModalPurchaseOrderPaymentSuccess"
  />

  <div class="page-header">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2 font-medium text-xl">
        <IconGroup />
        Thông tin phiếu nhập hàng
        <span
          v-if="purchaseOrder.status === PurchaseOrderStatus.Cancelled"
          style="color: var(--text-red)"
        >
          (Đơn đã bị hủy)
        </span>
      </div>
      <div>
        <VueButton
          v-if="userPermission[PermissionId.PURCHASE_ORDER_DRAFT_CRUD]"
          color="blue"
          icon="plus"
          @click="
            $router.push({
              name: 'PurchaseOrderUpsertContainer',
              query: { mode: EPurchaseOrderUpsertMode.CREATE },
            })
          "
        >
          Tạo phiếu nhập hàng mới
        </VueButton>
      </div>
    </div>

    <div class="mr-2 flex items-center gap-8">
      <VueDropdown>
        <template #trigger>
          <span style="font-size: 1.2rem; cursor: pointer">
            <IconSetting />
          </span>
        </template>
        <div class="vue-menu">
          <a
            v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
            @click="modalPurchaseOrderDetailSettingScreen?.openModal()"
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
          <td class="px-2 py-1 whitespace-nowrap" style="width: 120px">Nhà cung cấp</td>
          <td class="font-medium px-2 py-1">
            {{ purchaseOrder.distributor?.fullName }}
            <a class="ml-1" @click="openModalDistributorDetail(purchaseOrder.distributorId)">
              <IconFileSearch />
            </a>
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap">Mã phiếu</td>
          <td class="px-2 py-1">NH{{ purchaseOrder.id }}</td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap">T.Gian tạo</td>
          <td class="px-2 py-1">
            {{ timeToText(purchaseOrder.startedAt, 'hh:mm DD/MM/YY') }}
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap align-top">Trạng thái</td>
          <td class="px-2 py-1">
            <div class="flex items-center gap-4">
              <PurchaseOrderStatusTag :purchaseOrder="purchaseOrder" />
              <span
                v-if="
                  ![
                    PurchaseOrderStatus.Debt,
                    PurchaseOrderStatus.Completed,
                    PurchaseOrderStatus.Cancelled,
                  ].includes(purchaseOrder.status)
                "
                style="color: #555; font-style: italic"
              >
                ({{ DeliveryStatusText[purchaseOrder.deliveryStatus] }})
              </span>
            </div>
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap">Ghi chú</td>
          <td class="px-2 py-1">
            {{ purchaseOrder.note }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-main">
    <div class="px-4 pt-2 flex justify-between items-center gap-4">
      <div class="flex items-center gap-2">
        <VueButton
          v-if="
            userPermission[PermissionId.PURCHASE_ORDER_PAYMENT_MONEY] &&
            [
              PurchaseOrderStatus.Draft,
              PurchaseOrderStatus.Deposited,
              PurchaseOrderStatus.Executing,
            ].includes(purchaseOrder.status)
          "
          color="green"
          icon="dollar"
          @click="modalPurchaseOrderPayment?.openModal(PaymentViewType.Prepayment)"
        >
          Tạm ứng
        </VueButton>
        <VueButton icon="print" @click="startPrintPurchaseOrderDetail(purchaseOrder)">In</VueButton>
      </div>
      <div class="flex items-center gap-2">
        <VueButton v-if="userPermission[PermissionId.PURCHASE_ORDER_DRAFT_CRUD]" @click="startCopy">
          <IconCopy />
          Copy phiếu
        </VueButton>
        <VueButton
          v-if="
            userPermission[PermissionId.PURCHASE_ORDER_DRAFT_CRUD] &&
            [PurchaseOrderStatus.Draft].includes(purchaseOrder.status)
          "
          color="blue"
          @click="startEdit"
        >
          <IconEdit />
          Sửa phiếu
        </VueButton>
        <VueButton
          v-if="
            userPermission[PermissionId.PURCHASE_ORDER_DRAFT_CRUD] &&
            [PurchaseOrderStatus.Deposited].includes(purchaseOrder.status)
          "
          color="blue"
          @click="startEdit"
        >
          <IconEdit />
          Sửa phiếu
        </VueButton>
        <VueDropdown>
          <template #trigger>
            <div class="vue-circle">
              <IconMore style="font-size: 1.5rem; font-weight: bold" />
            </div>
          </template>
          <div class="vue-menu">
            <a
              style="color: red"
              v-if="
                userPermission[PermissionId.PURCHASE_ORDER_TERMINATE] &&
                [
                  PurchaseOrderStatus.Deposited,
                  PurchaseOrderStatus.Executing,
                  PurchaseOrderStatus.Debt,
                  PurchaseOrderStatus.Completed,
                ].includes(purchaseOrder.status)
              "
              @click="clickTerminate()"
            >
              <IconCloseCircle width="16" height="16" />
              Hủy phiếu
            </a>
            <a
              style="color: red"
              v-if="
                userPermission[PermissionId.PURCHASE_ORDER_DRAFT_CRUD] &&
                purchaseOrder.status === PurchaseOrderStatus.Draft
              "
              @click="clickDestroy()"
            >
              <IconDelete width="16" height="16" />
              Xóa phiếu
            </a>
            <a
              style="color: red"
              v-if="
                userPermission[PermissionId.PURCHASE_ORDER_DRAFT_CRUD] &&
                purchaseOrder.status === PurchaseOrderStatus.Deposited &&
                purchaseOrder.paid === 0
              "
              @click="clickDestroy()"
            >
              <IconDelete width="16" height="16" />
              Xóa phiếu
            </a>

            <a
              style="color: red"
              v-if="
                userPermission[PermissionId.PURCHASE_ORDER_CANCELLED_DESTROY] &&
                purchaseOrder.status === PurchaseOrderStatus.Cancelled
              "
              @click="clickDestroy()"
            >
              <IconDelete width="16" height="16" />
              Xóa phiếu
            </a>
          </div>
        </VueDropdown>
      </div>
    </div>

    <div class="mt-2">
      <PurchaseOrderDetailTable
        @showPurchaseOrderPayment="(view: any) => modalPurchaseOrderPayment?.openModal(view)"
      />
    </div>

    <div class="flex justify-center gap-4 my-4">
      <template v-if="purchaseOrder.status === PurchaseOrderStatus.Draft">
        <VueButton
          v-if="
            userPermission[PermissionId.PURCHASE_ORDER_SEND_PRODUCT] &&
            userPermission[PermissionId.PURCHASE_ORDER_PAYMENT_MONEY]
          "
          color="blue"
          icon="send"
          @click="
            modalPurchaseOrderPayment?.openModal(PaymentViewType.SendProductAndPaymentAndClose)
          "
        >
          Nhập hàng và Thanh toán
        </VueButton>
      </template>

      <template
        v-if="
          [PurchaseOrderStatus.Deposited, PurchaseOrderStatus.Executing].includes(
            purchaseOrder.status,
          )
        "
      >
        <VueButton
          v-if="
            purchaseOrder.deliveryStatus === DeliveryStatus.Pending &&
            userPermission[PermissionId.PURCHASE_ORDER_SEND_PRODUCT]
          "
          color="blue"
          :loading="loadingProcess"
          icon="send"
          @click="sendProduct"
        >
          Nhập hàng
        </VueButton>

        <VueButton
          v-if="
            purchaseOrder.paid > purchaseOrder.totalMoney &&
            userPermission[PermissionId.PURCHASE_ORDER_REFUND_MONEY]
          "
          color="green"
          icon="dollar"
          @click="modalPurchaseOrderPayment?.openModal(PaymentViewType.RefundOverpaid)"
        >
          Hoàn trả tiền
        </VueButton>

        <VueButton
          v-if="
            purchaseOrder.deliveryStatus === DeliveryStatus.Delivered &&
            purchaseOrder.paid <= purchaseOrder.totalMoney &&
            userPermission[PermissionId.PURCHASE_ORDER_CLOSE]
          "
          color="blue"
          :loading="loadingProcess"
          @click="close()"
        >
          <IconFileDone />
          <span v-if="purchaseOrder.debt > 0">Đóng phiếu và Ghi nợ</span>
          <span v-else>Kết thúc</span>
        </VueButton>
      </template>

      <template v-if="purchaseOrder.status === PurchaseOrderStatus.Debt">
        <VueButton
          v-if="userPermission[PermissionId.PURCHASE_ORDER_PAYMENT_MONEY]"
          color="blue"
          :loading="loadingProcess"
          @click="modalPurchaseOrderPayment?.openModal(PaymentViewType.PayDebt)"
        >
          <IconDollar />
          Trả nợ
        </VueButton>
      </template>
    </div>
  </div>
</template>
