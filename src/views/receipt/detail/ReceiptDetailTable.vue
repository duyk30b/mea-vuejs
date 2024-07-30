<script setup lang="ts">
import { ExclamationCircleOutlined, FileSearchOutlined } from '@ant-design/icons-vue'
import { computed, ref } from 'vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PaymentViewType } from '../../../modules/enum'
import { ReceiptStatus } from '../../../modules/receipt'
import { timeToText } from '../../../utils'
import ModalProductDetail from '../../../views/product/detail/ModalProductDetail.vue'
import { receipt } from './receipt-detail.ref'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const emit = defineEmits<{ (e: 'showReceiptPayment', value: PaymentViewType): void }>()

const showModalReceiptPayment = (paymentView: PaymentViewType) => {
  emit('showReceiptPayment', paymentView)
}

const colspan = computed(() => {
  return 3 + Number(settingStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.unit)
})
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <div class="mt-2 table-wrapper" :class="!isMobile ? 'px-4 w-full' : ''">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Sản phẩm</th>
          <th>SL</th>
          <th v-if="settingStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.unit">ĐV</th>
          <th>G.Nhập</th>
          <th>T.Tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(receiptItem, index) in receipt.receiptItems || []" :key="index">
          <td class="text-center">{{ index + 1 }}</td>
          <td>
            <div class="text-justify">
              <div style="font-weight: 500">
                {{ receiptItem!.product!.brandName }}
                <a
                  v-if="settingStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.detail"
                  class="ml-1"
                  @click="modalProductDetail?.openModal(receiptItem.product!)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.substance"
                style="font-size: 0.8rem">
                {{ receiptItem!.product!.substance }}
              </div>
              <div
                v-if="settingStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.lotNumberAndExpiryDate"
                class="flex flex-wrap gap-2"
                style="font-size: 0.8rem">
                <div v-if="receiptItem.lotNumber">S.Lô {{ receiptItem.lotNumber }}</div>
                <div v-if="receiptItem.expiryDate">
                  - HSD {{ timeToText(receiptItem.expiryDate) }}
                </div>
              </div>
            </div>
          </td>
          <td class="text-center">
            {{ receiptItem.unitQuantity }}
          </td>
          <td v-if="settingStore.SCREEN_RECEIPT_DETAIL.receiptItemsTable.unit" class="text-center">
            {{ receiptItem.unitName }}
          </td>
          <td class="text-right">
            {{ formatMoney(receiptItem.unitCostPrice) }}
          </td>
          <td class="text-right">
            {{ formatMoney(receiptItem.amount) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_RECEIPT_DETAIL.paymentInfo.itemsActualMoney">
          <td class="text-right font-bold" style="padding-right: 1rem" :colspan="colspan">
            Tiền hàng
          </td>
          <td colspan="2" class="text-right font-bold whitespace-nowrap">
            {{ formatMoney(receipt.itemsActualMoney) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_RECEIPT_DETAIL.paymentInfo.discount || receipt.discountMoney">
          <td class="text-right" style="padding-right: 1rem" :colspan="colspan">Chiết khấu</td>
          <td colspan="2" class="text-right whitespace-nowrap">
            <a-tag v-if="receipt.discountType === '%'" color="success">
              {{ receipt.discountPercent || 0 }}%
            </a-tag>
            {{ formatMoney(receipt.discountMoney) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_RECEIPT_DETAIL.paymentInfo.surcharge || receipt.surcharge">
          <td class="text-right" style="padding-right: 1rem" :colspan="colspan">Phụ phí</td>
          <td colspan="2" class="text-right whitespace-nowrap">
            {{ formatMoney(receipt.surcharge) }}
          </td>
        </tr>
        <tr>
          <td class="text-right font-bold" style="padding-right: 1rem" :colspan="colspan">
            Tổng tiền
          </td>
          <td colspan="2" class="text-right font-bold whitespace-nowrap">
            {{ formatMoney(receipt.totalMoney) }}
          </td>
        </tr>
        <tr
          v-if="
            settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.paid ||
            receipt.paid !== receipt.totalMoney
          ">
          <td
            v-if="[ReceiptStatus.Draft, ReceiptStatus.Prepayment].includes(receipt.status)"
            class="text-right cursor-pointer"
            :colspan="colspan"
            @click="showModalReceiptPayment(PaymentViewType.Prepayment)">
            <a>
              <span class="mr-1">Đã tạm ứng</span>
              <ExclamationCircleOutlined />
            </a>
          </td>
          <td
            v-else-if="[ReceiptStatus.Debt, ReceiptStatus.Success].includes(receipt.status)"
            class="text-right cursor-pointer"
            :colspan="colspan"
            @click="showModalReceiptPayment(PaymentViewType.PayDebt)">
            <a>
              <span class="mr-1">Đã thanh toán</span>
              <ExclamationCircleOutlined />
            </a>
          </td>
          <td
            v-else
            class="text-right cursor-pointer"
            :colspan="colspan"
            @click="showModalReceiptPayment(PaymentViewType.Success)">
            <a>
              <span class="mr-1">Đã thanh toán</span>
              <ExclamationCircleOutlined />
            </a>
          </td>
          <td colspan="2" class="text-right">
            {{ formatMoney(receipt.paid) }}
          </td>
        </tr>
        <tr
          v-if="
            settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.debt || receipt.totalMoney - receipt.paid
          ">
          <template v-if="[ReceiptStatus.Draft, ReceiptStatus.Prepayment].includes(receipt.status)">
            <td class="text-right" :colspan="colspan">Còn thiếu</td>
            <td colspan="2" class="text-right font-medium">
              {{ formatMoney(receipt.totalMoney - receipt.paid) }}
            </td>
          </template>
          <template v-else>
            <td class="text-right" :colspan="colspan">Ghi nợ</td>
            <td colspan="2" class="text-right font-medium">
              {{ formatMoney(receipt.debt) }}
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped></style>
