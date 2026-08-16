<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import {
  IconBug,
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
import {
  PurchaseOrder,
  PurchaseOrderActionApi,
  PurchaseOrderQueryApi,
} from '@/modules/purchase-order'
import { TemplateHtmlAction } from '@/modules/template-html'
import { purchaseOrderDetailRef } from '@/store/purchase-order.store'
import { timeToText } from '@/utils'
import { onBeforeMount, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalDistributorDetail from '../../distributor/detail/ModalDistributorDetail.vue'
import PurchaseOrderStatusTag from '../PurchaseOrderStatusTag.vue'
import ModalPurchaseOrderDetailSettingScreen from './ModalPurchaseOrderDetailSettingScreen.vue'
import ModalPurchaseOrderPayment from './ModalPurchaseOrderPayment.vue'
import ModalPurchaseOrderTerminal from './ModalPurchaseOrderTerminal.vue'
import PurchaseOrderDetailTable from './PurchaseOrderDetailTable.vue'
import { CONFIG } from '@/config'
import { VueTooltip } from '@/common/popover'
import { PurchaseOrderStatus } from '@/modules/purchase-order/purchase-order.type'
import { EPurchaseOrderUpsertMode } from '../upsert/purchase_order_upsert.ref'

const modalPurchaseOrderDetailSettingScreen =
  ref<InstanceType<typeof ModalPurchaseOrderDetailSettingScreen>>()
const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()
const modalPurchaseOrderPayment = ref<InstanceType<typeof ModalPurchaseOrderPayment>>()
const modalPurchaseOrderTerminal = ref<InstanceType<typeof ModalPurchaseOrderTerminal>>()

const route = useRoute()
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission } = MeService

const saveLoading = ref(false)
const loadingProcess = ref(false)

const startFetchData = async (purchaseOrderId: string) => {
  try {
    purchaseOrderDetailRef.value = await PurchaseOrderQueryApi.detail(purchaseOrderId, {
      relation: {
        distributor: true,
        purchaseOrderItemList: { product: true, batch: true },
        paymentPurchaseOrderList: { payment: true },
      },
    })
  } catch (error) {
    console.log('🚀 ~ file: PurchaseOrderDetail.vue:58 ~ startFetchData ~ error:', error)
  }
}

onBeforeMount(async () => {
  const purchaseOrderId = route.params.id as string
  if (purchaseOrderId) {
    await startFetchData(purchaseOrderId)
  }
})

onUnmounted(() => {
  purchaseOrderDetailRef.value = PurchaseOrder.blank()
})

const startEdit = () => {
  router.push({
    name: 'PurchaseOrderUpsertContainer',
    params: { id: purchaseOrderDetailRef.value.id },
    query: { mode: EPurchaseOrderUpsertMode.UPDATE },
  })
}

const startCopy = () => {
  router.push({
    name: 'PurchaseOrderUpsertContainer',
    params: { id: purchaseOrderDetailRef.value.id },
    query: { mode: EPurchaseOrderUpsertMode.COPY },
  })
}

const receiveProductAll = async () => {
  try {
    loadingProcess.value = true
    const result = await PurchaseOrderActionApi.receiveProductAll({
      purchaseOrderId: purchaseOrderDetailRef.value.id!,
    })
    Object.assign(purchaseOrderDetailRef.value, result.purchaseOrderModified)
  } catch (error) {
    console.log('🚀 ~ receiveProductAll ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const close = async () => {
  try {
    loadingProcess.value = true
    const result = await PurchaseOrderActionApi.close({
      purchaseOrderId: purchaseOrderDetailRef.value.id!,
    })
    Object.assign(purchaseOrderDetailRef.value, result.purchaseOrderModified)
  } catch (error) {
    console.log('🚀 ~ PurchaseOrderDetail.vue:124 ~ close ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const clickDestroy = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa phiếu nhập này ?',
    content: 'Phiếu nhập đã xóa vĩnh viễn khỏi hệ thống. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        loadingProcess.value = true
        await PurchaseOrderActionApi.destroy(purchaseOrderDetailRef.value.id!)
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
  await TemplateHtmlAction.startPrintPurchaseOrderDetail({ purchaseOrder: purchaseOrderData })
}
</script>

<template>
  <ModalPurchaseOrderTerminal ref="modalPurchaseOrderTerminal" />
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
          v-if="purchaseOrderDetailRef.status === PurchaseOrderStatus.Cancelled"
          style="color: var(--text-red)"
        >
          (Đơn đã bị hủy)
        </span>
      </div>
      <div v-if="CONFIG.MODE === 'development'">
        <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
          <template #trigger>
            <IconBug style="color: violet; cursor: pointer" width="1.4em" height="1.4em" />
          </template>
          <pre>{{ JSON.stringify(purchaseOrderDetailRef, null, 4) }}</pre>
        </VueTooltip>
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

    <div class="mr-2 flex flex-wrap items-center gap-4">
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
            <div class="flex flex-wrap gap-1">
              <div>
                <span>
                  {{ purchaseOrderDetailRef.distributor?.fullName }}
                </span>
                <a class="ml-1" @click="openModalDistributorDetail(purchaseOrderDetailRef.distributorId)">
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="purchaseOrderDetailRef.distributor?.debt" style="color: var(--text-red)">
                (nợ:
                <b>{{ formatMoney(purchaseOrderDetailRef.distributor?.debt) }}</b>
                )
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap">Mã phiếu</td>
          <td class="px-2 py-1">NH{{ purchaseOrderDetailRef.id }}</td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap">T.Gian tạo</td>
          <td class="px-2 py-1">
            {{ timeToText(purchaseOrderDetailRef.startedAt, 'hh:mm DD/MM/YY') }}
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap align-top">Trạng thái</td>
          <td class="px-2 py-1">
            <div class="flex items-center gap-4">
              <PurchaseOrderStatusTag :purchaseOrder="purchaseOrderDetailRef" />
              <span
                v-if="
                  ![
                    PurchaseOrderStatus.Debt,
                    PurchaseOrderStatus.Completed,
                    PurchaseOrderStatus.Cancelled,
                  ].includes(purchaseOrderDetailRef.status)
                "
                style="color: #555; font-style: italic"
              >
                ({{ DeliveryStatusText[purchaseOrderDetailRef.deliveryStatus] }})
              </span>
            </div>
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap">Ghi chú</td>
          <td class="px-2 py-1">
            {{ purchaseOrderDetailRef.note }}
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
              PurchaseOrderStatus.Schedule,
              PurchaseOrderStatus.Executing,
            ].includes(purchaseOrderDetailRef.status)
          "
          color="green"
          icon="dollar"
          @click="modalPurchaseOrderPayment?.openModal(PaymentViewType.Prepayment)"
        >
          Tạm ứng
        </VueButton>
        <VueButton icon="print" @click="startPrintPurchaseOrderDetail(purchaseOrderDetailRef)">In</VueButton>
      </div>
      <div class="flex items-center gap-2">
        <VueButton v-if="userPermission[PermissionId.PURCHASE_ORDER_DRAFT_CRUD]" @click="startCopy">
          <IconCopy />
          Copy phiếu
        </VueButton>
        <VueButton
          v-if="
            userPermission[PermissionId.PURCHASE_ORDER_DRAFT_CRUD] &&
            [PurchaseOrderStatus.Draft].includes(purchaseOrderDetailRef.status)
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
            [PurchaseOrderStatus.Schedule].includes(purchaseOrderDetailRef.status)
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
                  PurchaseOrderStatus.Schedule,
                  PurchaseOrderStatus.Executing,
                  PurchaseOrderStatus.Debt,
                  PurchaseOrderStatus.Completed,
                ].includes(purchaseOrderDetailRef.status)
              "
              @click="modalPurchaseOrderTerminal?.openModal()"
            >
              <IconCloseCircle width="16" height="16" />
              Hủy phiếu
            </a>
            <a
              style="color: red"
              v-if="
                userPermission[PermissionId.PURCHASE_ORDER_DRAFT_CRUD] &&
                purchaseOrderDetailRef.status === PurchaseOrderStatus.Draft
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
                purchaseOrderDetailRef.status === PurchaseOrderStatus.Schedule &&
                purchaseOrderDetailRef.paid === 0
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
                purchaseOrderDetailRef.status === PurchaseOrderStatus.Cancelled
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
      <template v-if="purchaseOrderDetailRef.status === PurchaseOrderStatus.Draft">
        <VueButton
          v-if="
            userPermission[PermissionId.PURCHASE_ORDER_RECEIVE_PRODUCT] &&
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
          [PurchaseOrderStatus.Schedule, PurchaseOrderStatus.Executing].includes(
            purchaseOrderDetailRef.status,
          )
        "
      >
        <VueButton
          v-if="
            purchaseOrderDetailRef.deliveryStatus === DeliveryStatus.Pending &&
            userPermission[PermissionId.PURCHASE_ORDER_RECEIVE_PRODUCT]
          "
          color="blue"
          :loading="loadingProcess"
          icon="send"
          @click="receiveProductAll"
        >
          Nhập hàng
        </VueButton>

        <VueButton
          v-if="
            purchaseOrderDetailRef.paid > purchaseOrderDetailRef.totalMoney &&
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
            purchaseOrderDetailRef.deliveryStatus === DeliveryStatus.Delivered &&
            purchaseOrderDetailRef.paid <= purchaseOrderDetailRef.totalMoney &&
            userPermission[PermissionId.PURCHASE_ORDER_CLOSE]
          "
          color="blue"
          :loading="loadingProcess"
          @click="close()"
        >
          <IconFileDone />
          <span v-if="purchaseOrderDetailRef.paid === purchaseOrderDetailRef.totalMoney && purchaseOrderDetailRef.debt === 0">
            Kết thúc
          </span>
          <span v-else-if="purchaseOrderDetailRef.paid + purchaseOrderDetailRef.debt < purchaseOrderDetailRef.totalMoney">
            Đóng phiếu và Ghi nợ
          </span>
          <span v-else>Đóng phiếu</span>
        </VueButton>
      </template>

      <template v-if="purchaseOrderDetailRef.status === PurchaseOrderStatus.Debt">
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
