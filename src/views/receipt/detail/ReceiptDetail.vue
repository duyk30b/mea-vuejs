<script setup lang="ts">
import {
  AuditOutlined,
  CopyOutlined,
  ExceptionOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  FileSyncOutlined,
  MoreOutlined,
  PlusOutlined,
  SettingOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode, h, onBeforeMount, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import type { Distributor } from '../../../modules/distributor'
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
import { PaymentViewType } from '../../../modules/enum'
import VueButton from '../../../common/VueButton.vue'

const modalReceiptDetailSettingScreen = ref<InstanceType<typeof ModalReceiptDetailSettingScreen>>()
const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()
const modalReceiptPayment = ref<InstanceType<typeof ModalReceiptPayment>>()

const route = useRoute()
const router = useRouter()

const screenStore = useScreenStore()
const { formatMoney } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const saveLoading = ref(false)

const loadingProcess = ref(false)

const startFetchData = async (receiptId: number) => {
  try {
    receipt.value = await ReceiptApi.detail(receiptId, {
      relation: {
        distributor: true,
        receiptItems: true,
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

const destroyDraft = async () => {
  try {
    loadingProcess.value = true
    await ReceiptApi.destroyDraft(receipt.value.id!)
    AlertStore.add({ type: 'success', message: 'Xóa đơn thành công', time: 1000 })
    router.push({ name: 'ReceiptList' })
  } catch (error) {
    console.log('🚀 ~ destroyDraft ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
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

const startReturnProduct = async () => {
  try {
    loadingProcess.value = true
    const { receiptBasic, distributorPayments } = await ReceiptApi.returnProduct(
      receipt.value.id!,
      receipt.value.paid
    )
    Object.assign(receipt.value, receiptBasic)
    receipt.value.distributorPayments = distributorPayments
    AlertStore.add({ type: 'success', message: 'Trả hàng thành công', time: 1000 })
  } catch (error) {
    console.log('🚀 ~ startReturnProduct ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const softDeleteRefund = async () => {
  try {
    loadingProcess.value = true
    await ReceiptApi.softDeleteRefund(receipt.value.id!)
    AlertStore.add({ type: 'success', message: 'Xóa đơn thành công', time: 1000 })
    router.push({ name: 'ReceiptList' })
  } catch (error) {
    console.log('🚀 ~ softDeleteRefund ~ error:', error)
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

const clickReturnProduct = () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn hoàn trả phiếu nhập này ?',
    icon: createVNode(ExclamationCircleOutlined),
    content: h('div', {}, [
      h('div', '- Kho hàng sẽ xuất ra tất cả hàng hóa trong phiếu'),
      ...(receipt.value.debt > 0
        ? [h('div', `- Trừ nợ nhà cung cấp: ${formatMoney(receipt.value.debt)}`)]
        : []),
      ...(receipt.value.paid > 0
        ? [
            h(
              'div',
              `- Nhà cung cấp trả lại số tiền đã thanh toán là: ${formatMoney(receipt.value.paid)}`
            ),
          ]
        : []),
    ]),
    async onOk() {
      await startReturnProduct()
    },
    onCancel() {},
  })
}

const clickRefundPrepayment = () => {
  Modal.confirm({
    title: 'Hoàn trả (nhận lại) tiền đã tạm ứng phiếu nhập này',
    icon: createVNode(ExclamationCircleOutlined),
    content: h('div', {}, [
      h('div', `- NCC trả lại số tiền đã thanh toán là: ${formatMoney(receipt.value.paid)}`),
      h('div', '- Phiếu nhập hàng sẽ chuyển về trạng thái NHÁP'),
    ]),
    async onOk() {
      await startRefundPrepayment()
    },
    onCancel() {},
  })
}

const clickDestroyDraft = () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn muốn xóa phiếu nhập này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Phiếu nhập đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      await destroyDraft()
    },
    onCancel() {},
  })
}

const clickSoftDeleteRefund = () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn muốn xóa phiếu nhập này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Phiếu nhập đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      await softDeleteRefund()
    },
    onCancel() {},
  })
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalReceiptDetailSettingScreen.value?.openModal()
  }
}

const handleMenuActionClick = (menu: { key: string }) => {
  if (menu.key === 'EDIT_RECEIPT') startEdit()
  if (menu.key === 'REFUND_PREPAYMENT') clickRefundPrepayment()
  if (menu.key === 'RETURN_PRODUCT') clickReturnProduct()
  if (menu.key === 'DELETE') {
    if (receipt.value.status === ReceiptStatus.Draft) {
      clickDestroyDraft()
    } else if (receipt.value.status === ReceiptStatus.Refund) {
      clickSoftDeleteRefund()
    }
  }
}

const openModalDistributorDetail = (data?: Distributor) => {
  if (data) modalDistributorDetail.value?.openModal(data.id)
}
</script>

<template>
  <ModalReceiptDetailSettingScreen
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]"
    ref="modalReceiptDetailSettingScreen"
  />
  <ModalDistributorDetail ref="modalDistributorDetail" />
  <ModalReceiptPayment ref="modalReceiptPayment" @success="startFetchData(receipt.id)" />

  <div class="page-header">
    <div class="page-header-content">
      <AuditOutlined /> Thông tin phiếu nhập hàng
      <span v-if="receipt.deletedAt" style="color: var(--text-red)">(Đơn đã bị xóa)</span>
      <a-button
        v-if="permissionIdMap[PermissionId.RECEIPT_CREATE_DRAFT]"
        type="primary"
        @click="$router.push({ name: 'ReceiptUpsert', query: { mode: EReceiptUpsertMode.CREATE } })"
      >
        <template #icon>
          <PlusOutlined />
        </template>
        Tạo phiếu nhập mới
      </a-button>
    </div>
    <div class="page-header-setting">
      <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]" trigger="click">
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
        <td class="px-2 py-1 whitespace-nowrap" style="width: 120px">Nhà cung cấp</td>
        <td class="font-medium px-2 py-1">
          {{ receipt.distributor?.fullName }}
          <a class="ml-1" @click="openModalDistributorDetail(receipt.distributor)">
            <FileSearchOutlined />
          </a>
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Mã phiếu</td>
        <td class="px-2 py-1">RC{{ receipt.id }}</td>
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
          <ReceiptStatusTag :status="receipt.status" />
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
        @click="startCopy"
      >
        <CopyOutlined /> Copy phiếu
      </VueButton>
      <VueButton
        v-if="
          permissionIdMap[PermissionId.RECEIPT_UPDATE_RECEIPT_DRAFT_AND_RECEIPT_PREPAYMENT] &&
          [ReceiptStatus.Draft, ReceiptStatus.Prepayment].includes(receipt.status)
        "
        color="blue"
        @click="startEdit"
      >
        <ExceptionOutlined />
        Sửa phiếu
      </VueButton>

      <a-dropdown>
        <template #overlay>
          <a-menu @click="handleMenuActionClick">
            <a-menu-item
              v-if="
                screenStore.SCREEN_RECEIPT_DETAIL.process.forceEdit &&
                [ReceiptStatus.Debt, ReceiptStatus.Success].includes(receipt.status)
              "
              key="EDIT_RECEIPT"
            >
              <span class="text-red-500"> <FileSyncOutlined class="mr-2" /> Sửa phiếu </span>
            </a-menu-item>
            <a-menu-item
              v-if="
                permissionIdMap[PermissionId.RECEIPT_REFUND_PREPAYMENT] &&
                [ReceiptStatus.Prepayment].includes(receipt.status)
              "
              key="REFUND_PREPAYMENT"
            >
              <span class="text-red-500">
                <FileSyncOutlined class="mr-2" /> Hoàn trả tiền tạm ứng
              </span>
            </a-menu-item>
            <a-menu-item
              v-if="
                permissionIdMap[PermissionId.RECEIPT_RETURN_PRODUCT] &&
                [ReceiptStatus.Debt, ReceiptStatus.Success].includes(receipt.status)
              "
              key="RETURN_PRODUCT"
            >
              <span class="text-red-500"> <FileSyncOutlined class="mr-2" /> Hoàn trả </span>
            </a-menu-item>
            <a-menu-item
              v-if="
                permissionIdMap[PermissionId.RECEIPT_DELETE] &&
                [ReceiptStatus.Draft, ReceiptStatus.Refund].includes(receipt.status)
              "
              key="DELETE"
            >
              <span class="text-red-500"> <DeleteOutlined class="mr-2" /> Xóa phiếu </span>
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
        "
      >
        <VueButton
          v-if="receipt.paid == receipt.totalMoney"
          color="blue"
          :loading="loadingProcess"
          @click="sendProductAndDebit"
        >
          <template #icon>
            <FileDoneOutlined />
          </template>
          Nhập hàng
        </VueButton>

        <VueButton
          v-if="
            receipt.paid != receipt.totalMoney &&
            screenStore.SCREEN_RECEIPT_DETAIL.process.sendProductAndPayment
          "
          color="blue"
          :loading="loadingProcess"
          @click="modalReceiptPayment?.openModal(PaymentViewType.SendProductAndPayment)"
        >
          <template #icon>
            <FileDoneOutlined />
          </template>
          Nhập hàng và Thanh toán
        </VueButton>

        <VueButton
          v-if="
            receipt.paid != receipt.totalMoney &&
            screenStore.SCREEN_RECEIPT_DETAIL.process.sendProductAndDebit
          "
          color="blue"
          :loading="loadingProcess"
          @click="sendProductAndDebit"
        >
          <template #icon>
            <FileDoneOutlined />
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
            <FileDoneOutlined />
          </template>
          Trả nợ
        </VueButton>
      </template>
    </div>
  </div>
</template>
