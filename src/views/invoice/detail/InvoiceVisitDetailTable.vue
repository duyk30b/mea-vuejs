<script setup lang="ts">
import { ExclamationCircleOutlined, FileSearchOutlined } from '@ant-design/icons-vue'
import { computed, ref } from 'vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { timeToText } from '../../../utils'
import ModalProcedureDetail from '../../../views/procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '../../../views/product/detail/ModalProductDetail.vue'
import { invoice, visit } from './invoice-detail.ref'
import { PaymentViewType } from '../../../modules/enum'
import { VisitStatus } from '../../../modules/visit'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const emit = defineEmits<{ (e: 'showInvoicePayment', value: PaymentViewType): void }>()

const showModalInvoicePayment = (paymentView: PaymentViewType) => {
  emit('showInvoicePayment', paymentView)
}
const colspan = computed(() => {
  if (isMobile) return 2
  return (
    3 +
    Number(settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit) +
    Number(settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount)
  )
})
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <div class="px-4 table-wrapper w-full" :class="isMobile ? '' : 'px-4 w-full'">
    <table>
      <template v-if="isMobile">
        <thead>
          <tr>
            <th>#</th>
            <th>Sản phẩm</th>
            <th>SL</th>
            <th>TT</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(visitProcedure, index) in visit.visitProcedureList || []" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td>
              <div class="font-medium text-justify">
                {{ visitProcedure.procedure!.name }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="modalProcedureDetail?.openModal(visitProcedure.procedureId)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div class="flex gap-2" style="font-size: 0.8rem">
                <div v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice">
                  NY:
                  <span class="font-medium">
                    {{ formatMoney(visitProcedure.expectedPrice) }}
                  </span>
                </div>
                <div
                  v-if="
                    visitProcedure.discountMoney &&
                    settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount
                  ">
                  - CK:
                  <span v-if="visitProcedure.discountType === 'VNĐ'" class="font-medium">
                    {{ formatMoney(visitProcedure.discountMoney) }}
                  </span>
                  <span v-if="visitProcedure.discountType === '%'" class="font-medium">
                    {{ visitProcedure.discountPercent || 0 }}%
                  </span>
                </div>
                <div>
                  - ĐG:
                  <span class="font-medium">
                    {{ formatMoney(visitProcedure.actualPrice) }}
                  </span>
                </div>
              </div>
            </td>
            <td class="text-center whitespace-nowrap">
              {{ visitProcedure.quantity }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(visitProcedure.actualPrice * visitProcedure.quantity) }}
            </td>
          </tr>
          <tr v-for="(visitProduct, index) in visit.visitProductList || []" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td>
              <div class="font-medium text-justify">
                {{ visitProduct.product!.brandName }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="modalProductDetail?.openModal(visitProduct.productId)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.substance"
                style="font-size: 0.8rem"
                class="text-justify">
                {{ visitProduct.product!.substance }}
              </div>
              <div
                v-if="
                  settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.batch && visitProduct.batchId
                "
                class="flex gap-2 flex-wrap"
                style="font-size: 0.8rem">
                S.Lô {{ visitProduct.batch!.lotNumber }}
                {{ timeToText(visitProduct.batch!.expiryDate, 'DD/MM/YY') }}
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.hintUsage"
                style="font-size: 0.8rem">
                {{ visitProduct.hintUsage }}
              </div>
              <div class="flex gap-2" style="font-size: 0.8rem">
                <div v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice">
                  NY:
                  <span class="font-medium">
                    {{ formatMoney(visitProduct.expectedPrice * visitProduct.unitRate) }}
                  </span>
                  <span
                    v-if="
                      settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit &&
                      visitProduct.unitName
                    ">
                    /{{ visitProduct.unitName }}
                  </span>
                </div>
                <div
                  v-if="
                    visitProduct.discountMoney &&
                    settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount
                  ">
                  - CK:
                  <span v-if="visitProduct.discountType === 'VNĐ'" class="font-medium">
                    {{ formatMoney(visitProduct.discountMoney * visitProduct.unitRate) }}
                  </span>
                  <span v-if="visitProduct.discountType === '%'" class="font-medium">
                    {{ visitProduct.discountPercent || 0 }}%
                  </span>
                </div>
                <div>
                  - ĐG:
                  <span class="font-medium">
                    {{ formatMoney(visitProduct.actualPrice * visitProduct.unitRate) }}
                  </span>
                  <span
                    v-if="
                      settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit &&
                      visitProduct.unitName
                    ">
                    /{{ visitProduct.unitName }}
                  </span>
                </div>
              </div>
            </td>
            <td class="text-center whitespace-nowrap">
              {{ visitProduct.quantity / visitProduct.unitRate }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(visitProduct.actualPrice * visitProduct.quantity) }}
            </td>
          </tr>
        </tbody>
      </template>
      <template v-if="!isMobile">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên</th>
            <th v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit">Đ.Vị</th>
            <th>S.Lượng</th>
            <th v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount">C.Khấu</th>
            <th>Đ.Giá</th>
            <th>T.Tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(visitProcedure, index) in visit.visitProcedureList" :key="index">
            <td class="auto-index text-center"></td>
            <td :colspan="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit ? '2' : '1'">
              <div class="text-justify font-medium whitespace-nowrap" style="word-break: break-all">
                {{ visitProcedure.procedure!.name }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="modalProcedureDetail?.openModal(visitProcedure.procedureId)">
                  <FileSearchOutlined />
                </a>
              </div>
            </td>
            <td class="text-center">{{ visitProcedure.quantity }}</td>
            <td
              v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount"
              class="text-center">
              <a-tag
                v-if="visitProcedure.discountType === 'VNĐ'"
                color="success"
                style="cursor: pointer">
                {{ formatMoney(visitProcedure.discountMoney) }}
              </a-tag>
              <a-tag
                v-if="visitProcedure.discountType === '%'"
                color="success"
                style="cursor: pointer">
                {{ visitProcedure.discountPercent || 0 }}%
              </a-tag>
            </td>
            <td class="text-right">
              <div
                v-if="
                  settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice &&
                  visitProcedure.discountMoney
                "
                class="text-xs italic line-through"
                style="color: var(--text-red)">
                {{ formatMoney(visitProcedure.expectedPrice) }}
              </div>
              <div>{{ formatMoney(visitProcedure.actualPrice) }}</div>
            </td>
            <td class="text-right">
              {{ formatMoney(visitProcedure.actualPrice * visitProcedure.quantity) }}
            </td>
          </tr>
          <tr v-for="(visitProduct, index) in visit.visitProductList" :key="index">
            <td class="auto-index text-center"></td>
            <td>
              <div class="text-justify font-medium">
                {{ visitProduct.product!.brandName }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="modalProductDetail?.openModal(visitProduct.productId)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.substance"
                style="font-size: 0.8rem">
                {{ visitProduct.product!.substance }}
              </div>
              <div
                v-if="
                  settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.batch && visitProduct.batchId
                "
                style="font-size: 0.8rem"
                class="flex gap-2">
                Lô {{ visitProduct.batch!.lotNumber }} - HSD
                {{ timeToText(visitProduct.batch!.expiryDate) }}
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.hintUsage"
                style="font-size: 0.8rem">
                {{ visitProduct.hintUsage }}
              </div>
            </td>
            <td
              v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.unit"
              class="text-center">
              {{ visitProduct.unitName }}
            </td>
            <td class="text-center">{{ visitProduct.unitQuantity }}</td>
            <td
              v-if="settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.discount"
              class="text-center">
              <a-tag
                v-if="visitProduct.discountType === 'VNĐ'"
                color="success"
                style="cursor: pointer">
                {{ formatMoney(visitProduct.discountMoney * visitProduct.unitRate) }}
              </a-tag>
              <a-tag
                v-if="visitProduct.discountType === '%'"
                color="success"
                style="cursor: pointer">
                {{ visitProduct.discountPercent || 0 }}%
              </a-tag>
            </td>
            <td class="text-right">
              <div
                v-if="
                  settingStore.SCREEN_INVOICE_DETAIL.invoiceItemsTable.expectedPrice &&
                  visitProduct.discountMoney
                "
                class="text-xs italic line-through"
                style="color: var(--text-red)">
                {{ formatMoney(visitProduct.expectedPrice * visitProduct.unitRate) }}
              </div>
              <div>{{ formatMoney(visitProduct.actualPrice * visitProduct.unitRate) }}</div>
            </td>
            <td class="text-right">
              {{ formatMoney(visitProduct.actualPrice * visitProduct.quantity) }}
            </td>
          </tr>
        </tbody>
      </template>
      <tbody>
        <tr v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.itemsActualMoney">
          <td class="text-right font-medium" :colspan="colspan">Tiền hàng</td>
          <td class="text-right font-medium" :colspan="2">
            {{ formatMoney(visit.productsMoney + visit.proceduresMoney + visit.radiologyMoney) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.discount || visit.discountMoney">
          <td class="text-right" :colspan="colspan">Chiết khấu</td>
          <td class="text-right" :colspan="2">
            <a-tag v-if="visit.discountType === '%'" color="success">
              {{ visit.discountPercent || 0 }}%
            </a-tag>
            {{ formatMoney(visit.discountMoney) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.surcharge || visit.surcharge">
          <td class="text-right" :colspan="colspan">
            Phụ phí
            <span
              v-if="
                (visit.visitSurchargeList || []).length > 1 ||
                ((visit.visitSurchargeList || []).length == 1 &&
                  visit.visitSurchargeList![0].key !== '_unknown')
              "
              class="ml-1">
              ({{
                visit
                  .visitSurchargeList!.map((i) => `${i.name}: ${formatMoney(i.money)}`)
                  .join(' - ')
              }})
            </span>
          </td>
          <td class="text-right" :colspan="2">
            {{ formatMoney(visit.surcharge) }}
          </td>
        </tr>
        <tr>
          <td class="text-right font-medium" :colspan="colspan">Tổng tiền</td>
          <td class="text-right font-medium" :colspan="2">
            {{ formatMoney(visit.totalMoney) }}
          </td>
        </tr>
        <tr v-if="settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.profit">
          <td class="text-right" :colspan="colspan">Tiền lãi</td>
          <td class="text-right font-medium" :colspan="2">
            {{ visit.visitStatus != VisitStatus.Cancel ? formatMoney(visit.profit) : 0 }}
          </td>
        </tr>
        <tr
          v-if="
            settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.paid || visit.paid !== visit.totalMoney
          ">
          <td
            v-if="
              [VisitStatus.Draft, VisitStatus.Waiting, VisitStatus.InProgress].includes(
                visit.visitStatus
              )
            "
            class="text-right cursor-pointer"
            :colspan="colspan"
            @click="showModalInvoicePayment(PaymentViewType.Prepayment)">
            <a>
              <span class="mr-1">Đã tạm ứng</span>
              <ExclamationCircleOutlined />
            </a>
          </td>
          <td
            v-else-if="[VisitStatus.Debt].includes(visit.visitStatus)"
            class="text-right cursor-pointer"
            :colspan="colspan"
            @click="showModalInvoicePayment(PaymentViewType.PayDebt)">
            <a>
              <span class="mr-1">Đã thanh toán</span>
              <ExclamationCircleOutlined />
            </a>
          </td>
          <td
            v-else
            class="text-right cursor-pointer"
            :colspan="colspan"
            @click="showModalInvoicePayment(PaymentViewType.Success)">
            <a>
              <span class="mr-1">Đã thanh toán</span>
              <ExclamationCircleOutlined />
            </a>
          </td>
          <td class="text-right" :colspan="2">
            {{ formatMoney(visit.paid) }}
          </td>
        </tr>
        <tr
          v-if="
            settingStore.SCREEN_INVOICE_DETAIL.paymentInfo.debt || visit.totalMoney - visit.paid
          ">
          <template v-if="[VisitStatus.Draft, VisitStatus.InProgress].includes(visit.visitStatus)">
            <td class="text-right" :colspan="colspan">Còn thiếu</td>
            <td class="text-right font-medium" :colspan="2">
              {{ formatMoney(visit.debt) }}
            </td>
          </template>
          <template v-else>
            <td class="text-right" :colspan="colspan">Ghi nợ</td>
            <td class="text-right font-medium" :colspan="2">
              {{ formatMoney(visit.debt) }}
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped></style>
