<script setup lang="ts">
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import type { Distributor } from '@/modules/distributor'
import type { Product } from '@/modules/product'
import { Receipt, ReceiptService, ReceiptStatus } from '@/modules/receipt'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import { AuditOutlined, CheckCircleOutlined, ExceptionOutlined, ExclamationCircleOutlined, FileDoneOutlined, FileSearchOutlined, FileSyncOutlined, MoreOutlined, SettingOutlined, StopOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalDistributorDetail from '../../distributor/detail/ModalDistributorDetail.vue'
import ModalReceiptDetailSettingScreen from './ModalReceiptDetailSettingScreen.vue'

const modalReceiptDetailSettingScreen = ref<InstanceType<typeof ModalReceiptDetailSettingScreen>>()
const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()

const route = useRoute()
const router = useRouter()

const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const isMobile = window.innerWidth < 768

const receipt = ref<Receipt>(Receipt.blank())

const loadingProcess = ref(false)

const startFetchData = async (receiptId: number) => {
  receipt.value = await ReceiptService.detail(receiptId, {
    distributor: true,
    receiptItems: true,
  })
}

onBeforeMount(async () => {
  const receiptId = Number(route.params.id)
  if (receiptId) {
    await startFetchData(receiptId)
  }
})

const startShipAndPayment = async () => {
  try {
    loadingProcess.value = true
    await ReceiptService.startShipAndPayment(receipt.value.id!)
    await startFetchData(receipt.value.id)
    AlertStore.add({ type: 'success', message: 'Thành công', time: 1000 })
  } catch (error: any) {
    console.log('🚀 ~ file: ReceiptDetail.vue:51 ~ startShipAndPayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const startEdit = () => {
  router.push({ name: 'ReceiptUpsert', params: { id: receipt.value.id }, query: { mode: 'UPDATE' } })
}

const startDelete = async () => {
  try {
    loadingProcess.value = true
    await ReceiptService.deleteDraft(receipt.value.id!)
    AlertStore.add({ type: 'success', message: 'Xóa đơn thành công' })
    router.push({ name: 'ReceiptList' })
  } catch (error) {
    console.log('🚀 ~ startDelete ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const startRefund = async () => {
  try {
    loadingProcess.value = true
    const response = await ReceiptService.startRefund(receipt.value.id!)
    await startFetchData(receipt.value.id)
    AlertStore.add({ type: 'success', message: 'Thành công' })
  } catch (error: any) {
    console.log('🚀 ~ startRefund ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const clickRefund = () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn hoàn trả phiếu nhập này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Sau khi hoàn trả, kho hàng sẽ phải xuất ra số lượng tất cả hàng hóa trong phiếu nhập, hoàn trả ghi nợ của phiếu nhập này nếu có',
    async onOk() {
      await startRefund()
    },
    onCancel() { },
  })
}

const clickDelete = () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn muốn xóa phiếu nhập này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Đơn hàng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      await startDelete()
    },
    onCancel() { },
  })
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalReceiptDetailSettingScreen.value?.openModal()
  }
}

const handleMenuActionClick = (menu: { key: string }) => {
  if (menu.key === 'REFUND') clickRefund()
  if (menu.key === 'DELETE') clickDelete()
}

const openModalDistributorDetail = (data?: Distributor) => {
  if (data) modalDistributorDetail.value?.openModal(data)
}

const openModalProductDetail = (data?: Product) => {
  if (data) modalProductDetail.value?.openModal(data)
}

</script>

<template>
  <ModalReceiptDetailSettingScreen ref="modalReceiptDetailSettingScreen" />
  <ModalDistributorDetail ref="modalDistributorDetail" />
  <ModalProductDetail ref="modalProductDetail" />
  <div class="page-header">
    <div class="page-header-content">
      <AuditOutlined /> Thông tin phiếu nhập hàng
    </div>
    <div class="page-header-setting">
      <a-dropdown trigger="click">
        <span>
          <SettingOutlined />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting">
              Cài đặt hiển thị
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>

  <div class="md:mx-4 mt-4 p-4 bg-white">
    <table>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap" style="width: 120px;">Nhà cung cấp</td>
        <td class="font-medium px-2 py-1">{{ receipt.distributor?.fullName }}
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
        <td class="px-2 py-1">{{ timeToText(receipt.createTime, "hh:mm DD/MM/YY") }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">T.Gian thanh toán</td>
        <td class="px-2 py-1">{{ timeToText(receipt.paymentTime, "hh:mm DD/MM/YY") }}</td>
      </tr>
      <tr v-if="receipt.status === ReceiptStatus.Refund">
        <td class="px-2 py-1 whitespace-nowrap">T.Gian hoàn trả</td>
        <td class="px-2 py-1"> {{ timeToText(receipt.refundTime, "hh:mm DD/MM/YY") }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap align-top">Trạng thái</td>
        <td class="px-2 py-1">
          <a-tag v-if="receipt.status === ReceiptStatus.Draft" color="warning">
            <template #icon>
              <ExclamationCircleOutlined />
            </template>
            Nháp
          </a-tag>
          <a-tag v-if="receipt.status === ReceiptStatus.Finish" color="success">
            <template #icon>
              <CheckCircleOutlined />
            </template>
            Hoàn thành
          </a-tag>
          <a-tag v-if="receipt.status === ReceiptStatus.Refund" color="error">
            <template #icon>
              <StopOutlined />
            </template>
            Hoàn trả
          </a-tag>
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Ghi chú</td>
        <td class="px-2 py-1">{{ receipt.note }}</td>
      </tr>
    </table>
  </div>

  <div class="page-main">
    <div class="px-4 pt-2 flex justify-end">
      <a-button v-if="receipt.status === ReceiptStatus.Draft" type="primary" @click="startEdit">
        <template #icon>
          <ExceptionOutlined />
        </template>
        Sửa phiếu
      </a-button>

      <a-dropdown class="ml-4">
        <template #overlay>
          <a-menu @click="handleMenuActionClick">
            <a-menu-item v-if="receipt.status === ReceiptStatus.Finish || receipt.status === ReceiptStatus.Process"
              key="REFUND">
              <span class="text-red-500">
                <FileSyncOutlined class="mr-2" /> Hoàn trả
              </span>
            </a-menu-item>
            <a-menu-item v-if="receipt.status === ReceiptStatus.Draft" key="DELETE">
              <span class="text-red-500">
                <FileSyncOutlined class="mr-2" /> Xóa phiếu
              </span>
            </a-menu-item>
          </a-menu>
        </template>
        <a-button shape="circle">
          <template #icon>
            <MoreOutlined style="font-size: 1.2rem; font-weight: bold;" />
          </template>
        </a-button>
      </a-dropdown>
    </div>

    <div v-if="isMobile" class="mt-2">
      <table class="table-mobile">
        <thead>
          <tr>
            <th>#</th>
            <th>Sản phẩm</th>
            <th>SL</th>
            <th>ĐG</th>
            <th>TT</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(receiptItem, index) in (receipt.receiptItems || [])" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem;">{{ index + 1 }}</td>
            <td>
              <div class="font-medium">
                {{ receiptItem.productBatch?.product?.brandName }}
                <a v-if="organizationStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.detail" class="ml-1"
                  @click="openModalProductDetail(receiptItem.productBatch?.product)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div v-if="organizationStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.substance" style="font-size: 0.8rem;">
                {{ receiptItem.productBatch?.product?.substance }}
              </div>
              <div class="flex gap-2 flex-wrap" style="font-size: 0.8rem;">
                <div v-if="organizationStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.batch">
                  Lô: {{ receiptItem.productBatch.batch }}
                </div>
                <div v-if="organizationStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.expiryDate">
                  HSD: {{ timeToText(receiptItem.productBatch.expiryDate, 'DD/MM/YY') }}
                </div>
              </div>
            </td>
            <td class="text-center whitespace-nowrap">
              {{ receiptItem.quantity / receiptItem.unit.rate }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(receiptItem.productBatch?.costPrice * receiptItem.unit.rate) }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(receiptItem.productBatch.costPrice * receiptItem.quantity) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="mt-2 px-4 table-wrapper w-full">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Tên</th>
            <th v-if="organizationStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.batch">Lô</th>
            <th v-if="organizationStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.expiryDate">HSD</th>
            <th>Số lượng</th>
            <th v-if="organizationStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.unit">Đơn vị</th>
            <th>Giá nhập</th>
            <th>Tổng tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(receiptItem, index) in (receipt.receiptItems || [])" :key="index">
            <td class="index"></td>
            <td>
              <div class="text-justify">
                <div style="font-weight: 500;">{{ receiptItem.productBatch?.product?.brandName }} <a
                    v-if="organizationStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.detail" class="ml-1"
                    @click="openModalProductDetail(receiptItem.productBatch?.product)">
                    <FileSearchOutlined />
                  </a></div>
                <div v-if="organizationStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.substance">
                  {{ receiptItem.productBatch?.product?.substance }}
                </div>
              </div>
            </td>
            <td v-if="organizationStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.batch" class="text-center">
              {{ receiptItem.productBatch?.batch }}
            </td>
            <td v-if="organizationStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.expiryDate" class="text-center">
              {{ timeToText(receiptItem.productBatch?.expiryDate) }}
            </td>
            <td class="text-right"> {{ receiptItem.quantity / receiptItem.unit.rate }} </td>
            <td v-if="organizationStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.unit" class="text-center">
              {{ receiptItem.unit?.name }}
            </td>
            <td class="text-right">
              {{ formatMoney(receiptItem.productBatch?.costPrice * receiptItem.unit.rate) }}
            </td>
            <td class="text-right">
              {{ formatMoney(receiptItem.productBatch?.costPrice * receiptItem.quantity) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:px-4">
      <table class="table-mobile ">
        <tbody>
          <tr v-if="organizationStore.SCREEN_RECEIPT_DETAIL.paymentInfo.totalItemMoney">
            <td class="text-right font-bold" style="width: 70%;">Tiền hàng</td>
            <td class="text-right font-bold whitespace-nowrap"> {{ formatMoney(receipt.totalItemMoney) }} </td>
          </tr>
          <tr v-if="organizationStore.SCREEN_RECEIPT_DETAIL.paymentInfo.discount">
            <td class="text-right">Giảm giá</td>
            <td class="text-right whitespace-nowrap">
              <a-tag v-if="receipt.discountType === '%'" color="success">
                {{ receipt.discountPercent || 0 }}%
              </a-tag>
              {{ formatMoney(receipt.discountMoney) }}
            </td>
          </tr>
          <tr v-if="organizationStore.SCREEN_RECEIPT_DETAIL.paymentInfo.surcharge">
            <td class="text-right">Phụ phí</td>
            <td class="text-right whitespace-nowrap">{{ formatMoney(receipt.surcharge) }}</td>
          </tr>
          <tr>
            <td class="text-right font-bold">Tổng tiền</td>
            <td class="text-right font-bold whitespace-nowrap">{{ formatMoney(receipt.totalMoney) }}</td>
          </tr>
          <tr v-if="organizationStore.SCREEN_RECEIPT_DETAIL.paymentInfo.payment">
            <td class="text-right">Thanh toán</td>
            <td class="text-right whitespace-nowrap">{{ formatMoney(receipt.totalMoney - receipt.debt) }}</td>
          </tr>
          <tr v-if="organizationStore.SCREEN_RECEIPT_DETAIL.paymentInfo.debt">
            <td class="text-right">Ghi nợ</td>
            <td class="text-right whitespace-nowrap">{{ formatMoney(receipt.debt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mx-2 flex justify-center mt-6 mb-2">
      <a-button v-if="receipt.status === ReceiptStatus.Draft" type="primary" @click="startShipAndPayment"
        :loading="loadingProcess" style="background-color: #28a745; border-color: #28a745;">
        <template #icon>
          <FileDoneOutlined />
        </template>
        Nhập hàng và thanh toán
      </a-button>
    </div>
  </div>
</template>
