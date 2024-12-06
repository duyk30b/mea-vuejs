<script setup lang="ts">
import {
  AuditOutlined,
  CopyOutlined,
  ExceptionOutlined,
  FileDoneOutlined,
  FileSyncOutlined,
  MoreOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { IconFileSearch, IconSetting } from '../../../common/icon'
import { IconDelete } from '../../../common/icon-google'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import type { Distributor } from '../../../modules/distributor'
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
        receiptItems: { product: true, batch: true },
        distributorPayments: true,
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
    const { receiptBasic, distributorPayments } = await ReceiptApi.refundPrepayment(
      receipt.value.id,
      receipt.value.paid
    )
    Object.assign(receipt.value, receiptBasic)
    receipt.value.distributorPayments = distributorPayments
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
    const { receiptBasic, distributorPaymentList } = await ReceiptApi.cancel(
      receipt.value.id!,
      receipt.value.paid
    )
    console.log('🚀 ~ file: ReceiptDetail.vue:126 ~ startCancel ~ receiptBasic:', receiptBasic)
    Object.assign(receipt.value, receiptBasic)
    receipt.value.distributorPayments = distributorPaymentList
    AlertStore.add({ type: 'success', message: 'Hủy phiếu thành công', time: 1000 })
  } catch (error) {
    console.log('🚀 ~ startCancel ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const sendProductAndDebit = async () => {
  try {
    loadingProcess.value = true
    const { receiptBasic, distributorPayments } = await ReceiptApi.sendProductAndPayment(
      receipt.value.id!,
      0
    )
    Object.assign(receipt.value, receiptBasic)
    receipt.value.distributorPayments = distributorPayments
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

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalReceiptDetailSettingScreen.value?.openModal()
  }
}

const handleMenuActionClick = (menu: { key: string }) => {
  if (menu.key === 'REFUND_PREPAYMENT') clickRefundPrepayment()
  if (menu.key === 'CANCEL_RECEIPT') clickCancel()
  if (menu.key === 'DESTROY_RECEIPT') clickDestroy()
}

const openModalDistributorDetail = (distributorId: number) => {
  modalDistributorDetail.value?.openModal(distributorId)
}
</script>

<template>
  <ModalReceiptDetailSettingScreen
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalReceiptDetailSettingScreen" />
  <ModalDistributorDetail ref="modalDistributorDetail" />
  <ModalReceiptPayment ref="modalReceiptPayment" @success="startFetchData(receipt.id)" />

  <div class="page-header">
    <div class="page-header-content">
      <AuditOutlined />
      Thông tin phiếu nhập hàng
      <span v-if="receipt.status === ReceiptStatus.Cancelled" style="color: var(--text-red)">
        (Đơn đã bị hủy)
      </span>
      <VueButton
        v-if="permissionIdMap[PermissionId.RECEIPT_CREATE_DRAFT]"
        type="button"
        color="blue"
        icon="plus"
        @click="
          $router.push({ name: 'ReceiptUpsert', query: { mode: EReceiptUpsertMode.CREATE } })
        ">
        Tạo phiếu nhập mới
      </VueButton>
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
    </table>
  </div>

  <div class="page-main">
    <div class="px-4 pt-2 flex justify-end gap-2">
      <VueButton
        v-if="permissionIdMap[PermissionId.RECEIPT_CREATE_DRAFT]"
        class="ml-auto"
        @click="startCopy">
        <CopyOutlined />
        Copy phiếu
      </VueButton>
      <VueButton
        v-if="
          permissionIdMap[PermissionId.RECEIPT_UPDATE_DRAFT_PREPAYMENT] &&
          [ReceiptStatus.Draft, ReceiptStatus.Prepayment].includes(receipt.status)
        "
        color="blue"
        @click="startEdit">
        <ExceptionOutlined />
        Sửa phiếu
      </VueButton>
      <a-dropdown>
        <template #overlay>
          <a-menu @click="handleMenuActionClick">
            <a-menu-item
              v-if="
                permissionIdMap[PermissionId.RECEIPT_REFUND_PAYMENT] &&
                [ReceiptStatus.Prepayment].includes(receipt.status)
              "
              key="REFUND_PREPAYMENT">
              <span class="text-red-500">
                <FileSyncOutlined class="mr-2" />
                Hoàn trả tiền tạm ứng
              </span>
            </a-menu-item>
            <a-menu-item
              v-if="
                permissionIdMap[PermissionId.RECEIPT_CANCEL] &&
                [ReceiptStatus.Debt, ReceiptStatus.Success].includes(receipt.status)
              "
              key="CANCEL_RECEIPT">
              <span class="text-red-500">
                <FileSyncOutlined class="mr-2" />
                Hủy phiếu
              </span>
            </a-menu-item>
            <a-menu-item
              v-if="
                (permissionIdMap[PermissionId.RECEIPT_DESTROY_DRAFT] &&
                  [ReceiptStatus.Draft].includes(receipt.status)) ||
                receipt.status === ReceiptStatus.Cancelled
              "
              key="DESTROY_RECEIPT">
              <span class="text-red-500">
                <IconDelete class="mr-2" />
                Xóa phiếu
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
      <ReceiptDetailTable @showReceiptPayment="(view) => modalReceiptPayment?.openModal(view)" />
    </div>

    <div class="flex justify-center gap-4 my-4">
      <template
        v-if="
          permissionIdMap[PermissionId.RECEIPT_SEND_PRODUCT] &&
          [ReceiptStatus.Draft, ReceiptStatus.Prepayment].includes(receipt.status)
        ">
        <VueButton
          v-if="receipt.paid == receipt.totalMoney"
          color="blue"
          :loading="loadingProcess"
          @click="sendProductAndDebit">
          <template #icon>
            <FileDoneOutlined />
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
          @click="modalReceiptPayment?.openModal(PaymentViewType.SendProductAndPaymentAndClose)">
          <template #icon>
            <FileDoneOutlined />
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
          @click="sendProductAndDebit">
          <template #icon>
            <FileDoneOutlined />
          </template>
          Nhập hàng và Ghi nợ
        </VueButton>
      </template>

      <template
        v-if="
          permissionIdMap[PermissionId.RECEIPT_PAY_DEBT] && receipt.status === ReceiptStatus.Debt
        ">
        <VueButton
          color="blue"
          :loading="loadingProcess"
          @click="modalReceiptPayment?.openModal(PaymentViewType.PayDebt)">
          <template #icon>
            <FileDoneOutlined />
          </template>
          Trả nợ
        </VueButton>
      </template>
    </div>
  </div>
</template>
