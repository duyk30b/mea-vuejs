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
} from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode, h, onBeforeMount, ref } from 'vue'
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
const receipt = ref<Receipt>(Receipt.blank())

const loadingProcess = ref(false)

const startFetchData = async (receiptId: number) => {
  receipt.value = await ReceiptApi.detail(receiptId, {
    relation: {
      distributor: true,
      receiptItems: true,
      distributorPayments: true,
    },
  })
}

onBeforeMount(async () => {
  const receiptId = Number(route.params.id)
  if (receiptId) {
    await startFetchData(receiptId)
  }
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

const startRefund = async () => {
  try {
    loadingProcess.value = true
    const { receiptId } = await ReceiptApi.startRefund(receipt.value.id!)
    await startFetchData(receiptId)
    AlertStore.add({ type: 'success', message: 'Thành công', time: 1000 })
  } catch (error: any) {
    console.log('🚀 ~ startRefund ~ error:', error)
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

const startShipAndPayment = async (money: number) => {
  try {
    loadingProcess.value = true
    await ReceiptApi.startShipAndPayment(receipt.value.id!, money)
    await startFetchData(receipt.value.id)
    AlertStore.add({ type: 'success', message: 'Thành công', time: 1000 })
  } catch (error: any) {
    console.log('🚀 ~ file: ReceiptDetail.vue:51 ~ startShipAndPayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const clickRefund = () => {
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
              `- Nhà cung cấp nhận lại số tiền đã thanh toán là: ${formatMoney(receipt.value.paid)}`
            ),
          ]
        : []),
    ]),
    async onOk() {
      await startRefund()
    },
    onCancel() {},
  })
}

const clickDestroyDraft = () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn muốn xóa phiếu nhập này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Đơn hàng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
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
    content: 'Đơn hàng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
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
  if (menu.key === 'REFUND') clickRefund()
  if (menu.key === 'DELETE') {
    if (receipt.value.status === ReceiptStatus.Draft) {
      clickDestroyDraft()
    } else if (receipt.value.status === ReceiptStatus.Refund) {
      clickSoftDeleteRefund()
    }
  }
}

const openModalDistributorDetail = (data?: Distributor) => {
  if (data) modalDistributorDetail.value?.openModal(data)
}
</script>

<template>
  <ModalReceiptDetailSettingScreen
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]"
    ref="modalReceiptDetailSettingScreen"
  />
  <ModalDistributorDetail ref="modalDistributorDetail" />
  <ModalReceiptPayment
    ref="modalReceiptPayment"
    :receipt="receipt"
    @success="startFetchData(receipt.id)"
  />

  <div class="page-header">
    <div class="page-header-content">
      <AuditOutlined /> Thông tin phiếu nhập hàng
      <span v-if="receipt.deletedAt" style="color: #ff4d4f">(Đơn đã bị xóa)</span>
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
      <a-button
        v-if="permissionIdMap[PermissionId.RECEIPT_CREATE_DRAFT]"
        class="ml-auto"
        type="default"
        @click="startCopy"
      >
        <template #icon>
          <CopyOutlined />
        </template>
        Copy phiếu
      </a-button>

      <template
        v-if="
          permissionIdMap[PermissionId.RECEIPT_UPDATE_DRAFT] &&
          receipt.status !== ReceiptStatus.Refund
        "
      >
        <a-button
          v-if="
            receipt.status === ReceiptStatus.Draft ||
            (screenStore.SCREEN_RECEIPT_DETAIL.function.forceEdit &&
              [ReceiptStatus.Debt, ReceiptStatus.Success].includes(receipt.status))
          "
          type="primary"
          @click="startEdit"
        >
          <template #icon>
            <ExceptionOutlined />
          </template>
          Sửa phiếu
        </a-button>
      </template>

      <a-dropdown>
        <template #overlay>
          <a-menu @click="handleMenuActionClick">
            <a-menu-item
              v-if="
                permissionIdMap[PermissionId.RECEIPT_REFUND] &&
                [
                  ReceiptStatus.Success,
                  ReceiptStatus.Debt,
                  ReceiptStatus.AwaitingShipment,
                ].includes(receipt.status)
              "
              key="REFUND"
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
              <span class="text-red-500"> <FileSyncOutlined class="mr-2" /> Xóa phiếu </span>
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
      <ReceiptDetailTable
        :receipt="receipt"
        @show-receipt-payment="modalReceiptPayment?.openModal()"
      />
    </div>

    <div class="flex justify-center gap-4 my-4">
      <template
        v-if="permissionIdMap[PermissionId.RECEIPT] && receipt.status === ReceiptStatus.Draft"
      >
        <a-button
          v-if="screenStore.SCREEN_RECEIPT_DETAIL.receiptProcessType === 1"
          type="primary"
          :loading="loadingProcess"
          @click="startShipAndPayment(receipt.revenue)"
        >
          <template #icon>
            <FileDoneOutlined />
          </template>
          Nhập hàng và thanh toán
        </a-button>

        <a-button
          v-if="
            permissionIdMap[PermissionId.RECEIPT_PREPAYMENT] &&
            screenStore.SCREEN_RECEIPT_DETAIL.receiptProcessType === 2
          "
          type="primary"
          :loading="loadingProcess"
          @click="modalReceiptPayment?.openModal()"
        >
          <template #icon>
            <FileDoneOutlined />
          </template>
          Thanh toán
        </a-button>
      </template>

      <template
        v-if="
          permissionIdMap[PermissionId.RECEIPT_SHIP] &&
          receipt.status === ReceiptStatus.AwaitingShipment
        "
      >
        <a-button type="primary" :loading="loadingProcess" @click="startShipAndPayment(0)">
          <template #icon>
            <FileDoneOutlined />
          </template>
          Nhập hàng
        </a-button>
      </template>

      <template
        v-if="
          permissionIdMap[PermissionId.RECEIPT_PAY_DEBT] && receipt.status === ReceiptStatus.Debt
        "
      >
        <a-button
          type="primary"
          :loading="loadingProcess"
          @click="modalReceiptPayment?.openModal()"
        >
          <template #icon>
            <FileDoneOutlined />
          </template>
          Trả nợ
        </a-button>
      </template>
    </div>
  </div>
</template>
