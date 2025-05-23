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
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PaymentViewType } from '../../../modules/enum'
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

const modalReceiptDetailSettingScreen = ref<InstanceType<typeof ModalReceiptDetailSettingScreen>>()
const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()
const modalReceiptPayment = ref<InstanceType<typeof ModalReceiptPayment>>()

const route = useRoute()
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const saveLoading = ref(false)

const loadingProcess = ref(false)

const startFetchData = async (receiptId: number) => {
  try {
    receipt.value = await ReceiptApi.detail(receiptId, {
      relation: {
        distributor: true,
        receiptItemList: { product: true, batch: true },
        distributorPaymentList: true,
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

const startRefundPrepayment = async () => {
  try {
    loadingProcess.value = true
    const { receiptBasic, distributorPaymentList } = await ReceiptApi.refundPrepayment({
      receiptId: receipt.value.id,
      money: receipt.value.paid,
      paymentMethodId: 0,
    })
    Object.assign(receipt.value, receiptBasic)
    receipt.value.distributorPaymentList = distributorPaymentList
    AlertStore.add({ type: 'success', message: 'Trả tiền tạm ứng thành công', time: 1000 })
  } catch (error) {
    console.log('🚀 ~ file: ReceiptDetail.vue:117 ~ startRefundPrepayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const startCancel = async () => {
  try {
    loadingProcess.value = true
    const result = await ReceiptApi.cancel(receipt.value.id!)
    Object.assign(receipt.value, result.receipt)
    receipt.value.distributorPaymentList = result.distributorPaymentList
    AlertStore.add({ type: 'success', message: 'Hủy phiếu thành công', time: 1000 })
  } catch (error) {
    console.log('🚀 ~ file: ReceiptDetail.vue:114 ~ startCancel ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const sendProductAndDebit = async () => {
  try {
    loadingProcess.value = true
    const result = await ReceiptApi.sendProductAndPayment({
      receiptId: receipt.value.id!,
      money: 0,
      paymentMethodId: 0,
    })
    Object.assign(receipt.value, result.receipt)
    receipt.value.distributorPaymentList = result.distributorPaymentList
  } catch (error) {
    console.log('🚀 ~ startShipAndPayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const clickCancel = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn hủy phiếu nhập này ?',
    content: [
      '- Kho hàng sẽ xuất ra tất cả hàng hóa trong phiếu',
      ...(receipt.value.debt > 0 ? [`- Trừ nợ NCC: ${formatMoney(receipt.value.debt)}`] : []),
      ...(receipt.value.paid > 0
        ? [`- NCC trả lại số tiền đã thanh toán là: ${formatMoney(receipt.value.paid)}`]
        : []),
    ],
    okText: 'Xác nhận HỦY PHIẾU',
    async onOk() {
      await startCancel()
    },
  })
}

const clickRefundPrepayment = () => {
  ModalStore.confirm({
    title: 'Hoàn trả (nhận lại) tiền đã tạm ứng phiếu nhập này',
    content: [
      `- NCC trả lại số tiền đã thanh toán là: ${formatMoney(receipt.value.paid)}`,
      '- Phiếu nhập hàng sẽ chuyển về trạng thái NHÁP',
    ],
    async onOk() {
      await startRefundPrepayment()
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
        await ReceiptApi.destroy(receipt.value.id!)
        AlertStore.add({ type: 'success', message: 'Xóa đơn thành công', time: 1000 })
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
</script>

<template>
  <ModalReceiptDetailSettingScreen
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalReceiptDetailSettingScreen"
  />
  <ModalDistributorDetail ref="modalDistributorDetail" />
  <ModalReceiptPayment ref="modalReceiptPayment" @success="startFetchData(receipt.id)" />

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
          v-if="permissionIdMap[PermissionId.RECEIPT_DRAFT_UPSERT]"
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
            v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
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
            <ReceiptStatusTag :receipt="receipt" />
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
    <div class="px-4 pt-2 flex justify-end items-center gap-2">
      <VueButton
        v-if="permissionIdMap[PermissionId.RECEIPT_DRAFT_UPSERT]"
        style="margin-left: auto"
        @click="startCopy"
      >
        <IconCopy />
        Copy phiếu
      </VueButton>
      <VueButton
        v-if="
          permissionIdMap[PermissionId.RECEIPT_DRAFT_UPSERT] &&
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
          permissionIdMap[PermissionId.RECEIPT_DEPOSITED_UPDATE] &&
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
            v-if="
              permissionIdMap[PermissionId.RECEIPT_REFUND_PAYMENT] &&
              [ReceiptStatus.Deposited].includes(receipt.status)
            "
            @click="clickRefundPrepayment()"
          >
            <IconDollar width="16" height="16" />
            Hoàn trả tiền tạm ứng
          </a>
          <a
            style="color: red"
            v-if="
              permissionIdMap[PermissionId.RECEIPT_CANCEL] &&
              [ReceiptStatus.Debt, ReceiptStatus.Success].includes(receipt.status)
            "
            @click="clickCancel()"
          >
            <IconCloseCircle width="16" height="16" />
            Hủy phiếu
          </a>
          <a
            style="color: red"
            v-if="
              (permissionIdMap[PermissionId.RECEIPT_DRAFT_UPSERT] &&
                [ReceiptStatus.Draft].includes(receipt.status)) ||
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

    <div class="mt-2">
      <ReceiptDetailTable @showReceiptPayment="(view) => modalReceiptPayment?.openModal(view)" />
    </div>

    <div class="flex justify-center gap-4 my-4">
      <template
        v-if="
          permissionIdMap[PermissionId.RECEIPT_SEND_PRODUCT] &&
          [ReceiptStatus.Draft, ReceiptStatus.Deposited].includes(receipt.status)
        "
      >
        <VueButton
          v-if="receipt.paid == receipt.totalMoney"
          color="blue"
          :loading="loadingProcess"
          @click="sendProductAndDebit"
        >
          <template #icon>
            <IconFileDone />
          </template>
          Nhập hàng
        </VueButton>

        <VueButton
          v-if="
            permissionIdMap[PermissionId.RECEIPT_SEND_PRODUCT] &&
            permissionIdMap[PermissionId.RECEIPT_PAYMENT] &&
            receipt.paid != receipt.totalMoney &&
            settingStore.SCREEN_RECEIPT_DETAIL.process.sendProductAndPayment
          "
          color="blue"
          :loading="loadingProcess"
          @click="modalReceiptPayment?.openModal(PaymentViewType.SendProductAndPaymentAndClose)"
        >
          <template #icon>
            <IconFileDone />
          </template>
          Nhập hàng và Thanh toán
        </VueButton>

        <VueButton
          v-if="
            permissionIdMap[PermissionId.RECEIPT_SEND_PRODUCT] &&
            permissionIdMap[PermissionId.RECEIPT_PAYMENT] &&
            receipt.paid != receipt.totalMoney &&
            settingStore.SCREEN_RECEIPT_DETAIL.process.sendProductAndDebit
          "
          color="blue"
          :loading="loadingProcess"
          @click="sendProductAndDebit"
        >
          <template #icon>
            <IconFileDone />
          </template>
          Nhập hàng và Ghi nợ
        </VueButton>
      </template>

      <template
        v-if="
          permissionIdMap[PermissionId.RECEIPT_PAY_DEBT] && receipt.status === ReceiptStatus.Debt
        "
      >
        <VueButton
          color="blue"
          :loading="loadingProcess"
          @click="modalReceiptPayment?.openModal(PaymentViewType.PayDebt)"
        >
          <template #icon>
            <IconDollar />
          </template>
          Trả nợ
        </VueButton>
      </template>
    </div>
  </div>
</template>
