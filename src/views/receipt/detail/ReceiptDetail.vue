<script setup lang="ts">
import { onBeforeMount, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
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
} from '../../../common/icon-antd'
import { IconDelete } from '../../../common/icon-google'
import VueDropdown from '../../../common/popover/VueDropdown.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DeliveryStatus, DeliveryStatusText, PaymentViewType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Receipt, ReceiptApi, ReceiptStatus } from '../../../modules/receipt'
import { timeToText } from '../../../utils'
import ModalDistributorDetail from '../../distributor/detail/ModalDistributorDetail.vue'
import ReceiptStatusTag from '../ReceiptStatusTag.vue'
import { EReceiptUpsertMode } from '../upsert/receipt-upsert.store'
import ModalReceiptDetailSettingScreen from './ModalReceiptDetailSettingScreen.vue'
import ModalReceiptPayment from './ModalReceiptPayment.vue'
import ReceiptDetailTable from './ReceiptDetailTable.vue'
import { receipt } from './receipt-detail.ref'
import { MeService } from '../../../modules/_me/me.service'

const modalReceiptDetailSettingScreen = ref<InstanceType<typeof ModalReceiptDetailSettingScreen>>()
const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()
const modalReceiptPayment = ref<InstanceType<typeof ModalReceiptPayment>>()

const route = useRoute()
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission } = MeService

const saveLoading = ref(false)

const loadingProcess = ref(false)

const startFetchData = async (receiptId: number) => {
  try {
    receipt.value = await ReceiptApi.detail(receiptId, {
      relation: {
        distributor: true,
        receiptItemList: { product: true, batch: true },
        paymentItemList: true,
      },
    })
  } catch (error) {
    console.log('🚀 ~ file: ReceiptDetail.vue:58 ~ startFetchData ~ error:', error)
  }
}

onBeforeMount(async () => {
  const receiptId = Number(route.params.id)
  if (receiptId) {
    await startFetchData(receiptId)
  }
})

onUnmounted(() => {
  receipt.value = Receipt.blank()
})

const startEdit = () => {
  router.push({
    name: 'ReceiptUpsert',
    params: { id: receipt.value.id },
    query: { mode: EReceiptUpsertMode.UPDATE },
  })
}

const startCopy = () => {
  router.push({
    name: 'ReceiptUpsert',
    params: { id: receipt.value.id },
    query: { mode: EReceiptUpsertMode.COPY },
  })
}

const sendProduct = async () => {
  try {
    loadingProcess.value = true
    const result = await ReceiptApi.sendProduct({
      receiptId: receipt.value.id!,
    })
    Object.assign(receipt.value, result.receiptModified)
  } catch (error) {
    console.log('🚀 ~ startShipAndPayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const close = async () => {
  try {
    loadingProcess.value = true
    const result = await ReceiptApi.close({ receiptId: receipt.value.id! })
    Object.assign(receipt.value, result.receiptModified)
    receipt.value.paymentItemList?.push(...result.paymentItemCreatedList)
  } catch (error) {
    console.log('🚀 ~ ReceiptDetail.vue:124 ~ close ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const clickTerminate = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn hủy phiếu nhập này ?',
    content: [
      ...(receipt.value.deliveryStatus === DeliveryStatus.Delivered
        ? ['- Kho hàng sẽ xuất ra tất cả hàng hóa trong phiếu']
        : []),
      ...(receipt.value.debt > 0 && [ReceiptStatus.Debt].includes(receipt.value.status)
        ? [`- Trừ nợ NCC: ${formatMoney(receipt.value.debt)}`]
        : []),
      ...(receipt.value.paid > 0
        ? [`- NCC trả lại số tiền đã thanh toán là: ${formatMoney(receipt.value.paid)}`]
        : []),
    ],
    okText: 'Xác nhận HỦY PHIẾU',
    async onOk() {
      try {
        loadingProcess.value = true
        const result = await ReceiptApi.terminate(receipt.value.id!)
        Object.assign(receipt.value, result.receiptModified)
        receipt.value.paymentItemList?.push(...result.paymentItemCreatedList)
        AlertStore.add({ type: 'success', message: 'Hủy phiếu thành công', time: 1000 })
      } catch (error) {
        console.log('🚀 ~ file: ReceiptDetail.vue:114 ~ startTerminate ~ error:', error)
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
        if (receipt.value.status === ReceiptStatus.Draft) {
          await ReceiptApi.draftDestroy(receipt.value.id!)
        }
        if (receipt.value.status === ReceiptStatus.Deposited) {
          await ReceiptApi.draftDestroy(receipt.value.id!)
        }
        if (receipt.value.status === ReceiptStatus.Cancelled) {
          await ReceiptApi.draftDestroy(receipt.value.id!)
        }
        AlertStore.add({ type: 'success', message: 'Xóa phiếu thành công', time: 1000 })
        router.push({ name: 'ReceiptList' })
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

const handleModalReceiptPaymentSuccess = () => {}
</script>

<template>
  <ModalReceiptDetailSettingScreen
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalReceiptDetailSettingScreen"
  />
  <ModalDistributorDetail ref="modalDistributorDetail" />
  <ModalReceiptPayment ref="modalReceiptPayment" @success="handleModalReceiptPaymentSuccess" />

  <div class="page-header">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2 font-medium text-xl">
        <IconGroup />
        Thông tin phiếu nhập hàng
        <span v-if="receipt.status === ReceiptStatus.Cancelled" style="color: var(--text-red)">
          (Đơn đã bị hủy)
        </span>
      </div>
      <div>
        <VueButton
          v-if="userPermission[PermissionId.RECEIPT_DRAFT_CRUD]"
          color="blue"
          icon="plus"
          @click="
            $router.push({ name: 'ReceiptUpsert', query: { mode: EReceiptUpsertMode.CREATE } })
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
            @click="modalReceiptDetailSettingScreen?.openModal()"
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
            {{ receipt.distributor?.fullName }}
            <a class="ml-1" @click="openModalDistributorDetail(receipt.distributorId)">
              <IconFileSearch />
            </a>
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap">Mã phiếu</td>
          <td class="px-2 py-1">NH{{ receipt.id }}</td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap">T.Gian tạo</td>
          <td class="px-2 py-1">
            {{ timeToText(receipt.startedAt, 'hh:mm DD/MM/YY') }}
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap align-top">Trạng thái</td>
          <td class="px-2 py-1">
            <div class="flex items-center gap-4">
              <ReceiptStatusTag :receipt="receipt" />
              <span
                v-if="
                  ![ReceiptStatus.Debt, ReceiptStatus.Completed, ReceiptStatus.Cancelled].includes(
                    receipt.status,
                  )
                "
                style="color: #555; font-style: italic"
              >
                ({{ DeliveryStatusText[receipt.deliveryStatus] }})
              </span>
            </div>
          </td>
        </tr>
        <tr>
          <td class="px-2 py-1 whitespace-nowrap">Ghi chú</td>
          <td class="px-2 py-1">
            {{ receipt.note }}
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
            userPermission[PermissionId.PAYMENT_DISTRIBUTOR_PAYMENT] &&
            [ReceiptStatus.Draft, ReceiptStatus.Deposited, ReceiptStatus.Executing].includes(
              receipt.status,
            )
          "
          color="green"
          icon="dollar"
          @click="modalReceiptPayment?.openModal(PaymentViewType.Prepayment)"
        >
          Tạm ứng
        </VueButton>
      </div>
      <div class="flex items-center gap-2">
        <VueButton v-if="userPermission[PermissionId.RECEIPT_DRAFT_CRUD]" @click="startCopy">
          <IconCopy />
          Copy phiếu
        </VueButton>
        <VueButton
          v-if="
            userPermission[PermissionId.RECEIPT_DRAFT_CRUD] &&
            [ReceiptStatus.Draft].includes(receipt.status)
          "
          color="blue"
          @click="startEdit"
        >
          <IconEdit />
          Sửa phiếu
        </VueButton>
        <VueButton
          v-if="
            userPermission[PermissionId.RECEIPT_DEPOSITED_UPDATE] &&
            [ReceiptStatus.Deposited].includes(receipt.status)
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
                userPermission[PermissionId.RECEIPT_TERMINATE] &&
                [
                  ReceiptStatus.Deposited,
                  ReceiptStatus.Executing,
                  ReceiptStatus.Debt,
                  ReceiptStatus.Completed,
                ].includes(receipt.status)
              "
              @click="clickTerminate()"
            >
              <IconCloseCircle width="16" height="16" />
              Hủy phiếu
            </a>
            <a
              style="color: red"
              v-if="
                userPermission[PermissionId.RECEIPT_DRAFT_CRUD] &&
                receipt.status === ReceiptStatus.Draft
              "
              @click="clickDestroy()"
            >
              <IconDelete width="16" height="16" />
              Xóa phiếu
            </a>
            <a
              style="color: red"
              v-if="
                userPermission[PermissionId.RECEIPT_DEPOSITED_DESTROY] &&
                receipt.status === ReceiptStatus.Deposited &&
                receipt.paid === 0
              "
              @click="clickDestroy()"
            >
              <IconDelete width="16" height="16" />
              Xóa phiếu
            </a>

            <a
              style="color: red"
              v-if="
                userPermission[PermissionId.RECEIPT_CANCELLED_DESTROY] &&
                receipt.status === ReceiptStatus.Cancelled
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
      <ReceiptDetailTable @showReceiptPayment="(view) => modalReceiptPayment?.openModal(view)" />
    </div>

    <div class="flex justify-center gap-4 my-4">
      <template v-if="receipt.status === ReceiptStatus.Draft">
        <VueButton
          v-if="
            userPermission[PermissionId.RECEIPT_SEND_PRODUCT] &&
            userPermission[PermissionId.PAYMENT_DISTRIBUTOR_PAYMENT]
          "
          color="blue"
          icon="send"
          @click="modalReceiptPayment?.openModal(PaymentViewType.SendProductAndPaymentAndClose)"
        >
          Nhập hàng và Thanh toán
        </VueButton>
      </template>

      <template v-if="[ReceiptStatus.Deposited, ReceiptStatus.Executing].includes(receipt.status)">
        <VueButton
          v-if="
            receipt.deliveryStatus === DeliveryStatus.Pending &&
            userPermission[PermissionId.RECEIPT_SEND_PRODUCT]
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
            receipt.paid > receipt.totalMoney &&
            userPermission[PermissionId.PAYMENT_DISTRIBUTOR_REFUND]
          "
          color="green"
          icon="dollar"
          @click="modalReceiptPayment?.openModal(PaymentViewType.RefundOverpaid)"
        >
          Hoàn trả tiền
        </VueButton>

        <VueButton
          v-if="
            receipt.deliveryStatus === DeliveryStatus.Delivered &&
            receipt.paid <= receipt.totalMoney &&
            userPermission[PermissionId.RECEIPT_CLOSE]
          "
          color="blue"
          :loading="loadingProcess"
          @click="close()"
        >
          <IconFileDone />
          <span v-if="receipt.debt > 0">Đóng phiếu và Ghi nợ</span>
          <span v-else>Kết thúc</span>
        </VueButton>
      </template>

      <template v-if="receipt.status === ReceiptStatus.Debt">
        <VueButton
          v-if="userPermission[PermissionId.PAYMENT_DISTRIBUTOR_PAYMENT]"
          color="blue"
          :loading="loadingProcess"
          @click="modalReceiptPayment?.openModal(PaymentViewType.PayDebt)"
        >
          <IconDollar />
          Trả nợ
        </VueButton>
      </template>
    </div>
  </div>
</template>
