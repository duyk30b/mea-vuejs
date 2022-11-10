<script setup lang="ts">
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import type { Distributor } from '@/modules/distributor'
import { PaymentStatus, PaymentStatusText } from '@/modules/enum'
import type { Product } from '@/modules/product'
import { Purchase, PurchaseReceiptService } from '@/modules/purchase'
import { Receipt } from '@/modules/receipt'
import { useOrganizationStore } from '@/store/organization.store'
import { formatNumber, timeToText } from '@/utils'
import ModalProductDetails from '@/views/product/details/ModalProductDetails.vue'
import { AuditOutlined, CheckCircleOutlined, ExceptionOutlined, ExclamationCircleOutlined, FileDoneOutlined, FileSearchOutlined, FileSyncOutlined, MoreOutlined, SettingOutlined, StopOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalDistributorDetails from '../../distributor/details/ModalDistributorDetails.vue'
import ModalPurchaseReceiptDetailsSettingScreen from './ModalPurchaseReceiptDetailsSettingScreen.vue'

const modalScreenPurchaseReceiptDetails = ref<InstanceType<typeof ModalPurchaseReceiptDetailsSettingScreen>>()
const modalDistributorDetails = ref<InstanceType<typeof ModalDistributorDetails>>()
const modalProductDetails = ref<InstanceType<typeof ModalProductDetails>>()

const route = useRoute()
const router = useRouter()

const organizationStore = useOrganizationStore()

const purchase = ref<Purchase>(Purchase.blank())
const receipt = ref<Receipt>(Receipt.blank())

const currentReceiptId = ref<number>()
const newestReceiptId = ref<number>()

const loadingRefund = ref(false)
const loadingImport = ref(false)

const startFetchData = async (purchaseId: number) => {
  const purchaseResponse = await PurchaseReceiptService.getOne(purchaseId, {
    distributor: true,
    receipts: true,
  })
  purchaseResponse.receipts.reverse()

  purchase.value = purchaseResponse
  receipt.value = purchaseResponse.receipts[0]
  currentReceiptId.value = purchaseResponse.receipts[0].id
  newestReceiptId.value = purchaseResponse.receipts[0].id
}

onBeforeMount(async () => {
  const purchaseId = route.params.id as unknown as number
  const receiptId = Number(route.query.receipt_id)
  await startFetchData(purchaseId)

  if (receiptId) {
    currentReceiptId.value = receiptId
    receipt.value = purchase.value.receipts.find((i) => i.id === receiptId) || Receipt.blank()
  }
})

const startPaymentReceipt = async () => {
  try {
    loadingImport.value = true
    const response = await PurchaseReceiptService.paymentReceiptDraft(receipt.value.id!)
    if (response.success) {
      await startFetchData(response.data.purchaseId)
    }
    else AlertStore.add({ type: 'error', message: response.message })
  } catch (error: any) {
    console.log('🚀 ~ file: PurchaseDetail.vue:52 ~ startPaymentReceipt ~ error:', error)
  } finally {
    loadingImport.value = false
  }
}

const startEdit = () => {
  router.push({ name: 'PurchaseReceiptUpsert', params: { id: receipt.value.id } })
}

const startRefund = async () => {
  try {
    loadingRefund.value = true
    const response = await PurchaseReceiptService.refundReceipt(receipt.value.id!)
    if (response.success) {
      await startFetchData(response.data.purchaseId)
    }
    else AlertStore.add({ type: 'error', message: response.message })
  } catch (error: any) {
    console.log('🚀 ~ file: PurchaseDetail.vue:67 ~ startRefund ~ error:', error)
  } finally {
    loadingRefund.value = false
  }
}

const clickRefund = () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn hoàn trả phiếu nhập này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Sau khi hoàn trả, kho hàng sẽ phải trừ đi số lượng tất cả hàng hóa trong đơn, xóa bỏ ghi nợ của phiếu nhập này nếu có',
    async onOk() {
      await startRefund()
    },
    onCancel() { },
  })
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalScreenPurchaseReceiptDetails.value?.openModal()
  }
}

const handleMenuActionClick = (menu: { key: string }) => {
  if (menu.key === 'REFUND') clickRefund()
}

const handleChangeSelectReceipt = (value: number) => {
  currentReceiptId.value = value
  receipt.value = purchase.value.receipts.find((i) => i.id === value)!
}

const openModalDistributorDetail = (data?: Distributor) => {
  if (data) modalDistributorDetails.value?.openModal(data)
}

const openModalProductDetail = (data?: Product) => {
  if (data) modalProductDetails.value?.openModal(data)
}

</script>

<template>
  <ModalPurchaseReceiptDetailsSettingScreen ref="modalScreenPurchaseReceiptDetails" />
  <ModalDistributorDetails ref="modalDistributorDetails" />
  <ModalProductDetails ref="modalProductDetails" />
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.3rem;">
        <AuditOutlined style="margin-right: 10px" /> Thông tin phiếu nhập hàng
      </div>
      <div>
        <a-dropdown trigger="click">
          <span style="font-size: 1.1rem; cursor: pointer;">
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
  </div>

  <div class="mx-4 mt-4 p-4 bg-white">
    <div class="flex flex-col md:flex-row">
      <div class="md:w-full w-1/2">
        <p>
          <span class="inline-block w-40">Nhà cung cấp</span>
          <b>{{ purchase.distributor?.fullNameVi }}</b>
          <a-tooltip>
            <template #title>Xem chi tiết</template>
            <a class="text-large ml-2" @click="openModalDistributorDetail(purchase.distributor)">
              <FileSearchOutlined />
            </a>
          </a-tooltip>
        </p>
        <p class="mt-2">
          <span class="inline-block w-40">Mã phiếu</span>RC{{ receipt.id }}
        </p>
        <div class="mt-2 flex">
          <div class="w-40">Trạng thái</div>
          <div>
            <a-tag v-if="receipt.paymentStatus === PaymentStatus.Unpaid" color="warning">
              <template #icon>
                <ExclamationCircleOutlined />
              </template>
              {{ PaymentStatusText[PaymentStatus.Unpaid] }}
            </a-tag>
            <div v-if="receipt.paymentStatus !== PaymentStatus.Unpaid">
              <a-tag color="success">
                <template #icon>
                  <CheckCircleOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Full] }}
              </a-tag>
              {{ timeToText(receipt.paymentTime, "hh:mm DD/MM/YY") }}
            </div>

            <p v-if="receipt.paymentStatus === PaymentStatus.Refund" class="mt-2">
              <a-tag color="error">
                <template #icon>
                  <StopOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Refund] }}
              </a-tag>
              {{ timeToText(receipt.refundTime, "hh:mm DD/MM/YY") }}
            </p>
          </div>
        </div>
        <p class="mt-2">
          <span class="inline-block w-40">Ghi chú</span>{{ receipt.note }}
        </p>
      </div>
      <div class="md:w-full w-1/2">
        <div>Lịch sử</div>
        <a-select :value="currentReceiptId" :options="purchase.receipts.map((i: Receipt) => ({
          value: i.id,
          label: `${timeToText(i.refundTime || i.paymentTime || purchase.createTime, 'hh:mm DD/MM/YYYY')} - ${PaymentStatusText[i.paymentStatus]}`
        }))" @change="handleChangeSelectReceipt" :disabled="purchase.receipts.length <= 1" class="w-full"
          placeholder="">
        </a-select>
      </div>
    </div>

  </div>

  <div class="mx-4 mt-4 p-4 bg-white">
    <div class="flex justify-end">
      <a-button
        v-if="receipt.id === newestReceiptId && (receipt.paymentStatus === PaymentStatus.Unpaid || receipt.paymentStatus === PaymentStatus.Refund)"
        type="primary" @click="startEdit">
        <template #icon>
          <ExceptionOutlined />
        </template>
        Sửa phiếu
      </a-button>

      <a-dropdown v-if="receipt.paymentStatus === PaymentStatus.Full" class="ml-4">
        <template #overlay>
          <a-menu @click="handleMenuActionClick">
            <a-menu-item v-if="receipt.paymentStatus === PaymentStatus.Full" key="REFUND">
              <span class="text-red-500">
                <FileSyncOutlined class="mr-2" /> Hoàn trả
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

    <div class="mt-2 table-wrapper w-full">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Tên</th>
            <th v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_DETAIL.receiptItem.batch">Lô</th>
            <th v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_DETAIL.receiptItem.expiryDate">HSD</th>
            <th>Số lượng</th>
            <th v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_DETAIL.receiptItem.unit">Đơn vị</th>
            <th>Giá nhập</th>
            <th>Tổng tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(receiptItem, index) in (receipt.receiptItems || [])" :key="index">
            <td class="index"></td>
            <td>
              <div class="flex justify-between">
                <div>
                  <div style="font-weight: 500;">{{ receiptItem.productBatch?.product?.brandName }}</div>
                  <div v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_DETAIL.receiptItem.substance">
                    {{ receiptItem.productBatch?.product?.substance }}
                  </div>
                </div>
                <a v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_DETAIL.receiptItem.detail" class="text-xl ml-2"
                  @click="openModalProductDetail(receiptItem.productBatch?.product)">
                  <FileSearchOutlined />
                </a>
              </div>
            </td>
            <td v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_DETAIL.receiptItem.batch" class="text-center">
              {{ receiptItem.productBatch?.batch }}
            </td>
            <td v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_DETAIL.receiptItem.expiryDate" class="text-center">
              {{ timeToText(receiptItem.productBatch?.expiryDate) }}
            </td>
            <td class="text-right"> {{ receiptItem.quantity / receiptItem.unit.rate }} </td>
            <td v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_DETAIL.receiptItem.unit" class="text-center">
              {{ receiptItem.unit?.name }}
            </td>
            <td class="text-right">
              {{ formatNumber(receiptItem.productBatch?.costPrice * receiptItem.unit.rate) }}
            </td>
            <td class="text-right">
              {{ formatNumber(receiptItem.productBatch?.costPrice * receiptItem.quantity) }}
            </td>
          </tr>
          <tr v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_DETAIL.paymentInfo.totalItemMoney">
            <td colspan="100">
              <div class="flex justify-end text-right font-bold">
                <div>Tiền hàng</div>
                <div class="w-[200px]">{{ formatNumber(receipt.totalItemMoney) }}</div>
              </div>
            </td>
          </tr>
          <tr v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_DETAIL.paymentInfo.discount">
            <td colspan="100">
              <div class="flex justify-end text-right">
                <div>Giảm giá</div>
                <div class="w-[200px]">
                  {{ `(${receipt.discountPercent}%)` }}
                  &nbsp; {{ formatNumber(receipt.discountMoney) }}
                </div>
              </div>
            </td>
          </tr>
          <tr v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_DETAIL.paymentInfo.surcharge">
            <td colspan="100">
              <div class="flex justify-end text-right">
                <div>Phụ phí</div>
                <div class="w-[200px]"> {{ formatNumber(receipt.surcharge) }} </div>
              </div>
            </td>
          </tr>
          <tr>
            <td colspan="100">
              <div class="flex justify-end text-right font-bold">
                <div>Tổng tiền</div>
                <div class="w-[200px]">{{ formatNumber(receipt.totalMoney) }}</div>
              </div>
            </td>
          </tr>
          <tr v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_DETAIL.paymentInfo.payment">
            <td colspan="100">
              <div class="flex justify-end text-right">
                <div>Thanh toán</div>
                <div class="w-[200px]"> {{ formatNumber(receipt.totalMoney - receipt.debt) }} </div>
              </div>
            </td>
          </tr>
          <tr v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_DETAIL.paymentInfo.debt">
            <td colspan="100">
              <div class="flex justify-end text-right">
                <div>Ghi nợ</div>
                <div class="w-[200px]"> {{ formatNumber(receipt.debt) }} </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mx-2 flex justify-center mt-6 mb-2">
      <a-button v-if="purchase.paymentStatus === PaymentStatus.Unpaid" type="primary" @click="startPaymentReceipt"
        :loading="loadingImport" style="background-color: #28a745; border-color: #28a745;">
        <template #icon>
          <FileDoneOutlined />
        </template>
        Thanh toán
      </a-button>
    </div>
  </div>
</template>
