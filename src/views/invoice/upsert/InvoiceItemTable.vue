<script setup lang="ts">
import { DeleteOutlined, FileSearchOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import { InputMoney, InputNumber } from '../../../common/vue-form'
import { DiscountType } from '../../../modules/enum'
import { InvoiceItem, InvoiceItemType } from '../../../modules/invoice-item/invoice-item.model'
import type { Procedure } from '../../../modules/procedure'
import type { Product } from '../../../modules/product'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { timeToText } from '../../../utils'
import ModalProcedureDetail from '../../procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import { invoice } from './invoice-upsert.ref'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore

const handleChangeUnitDiscountMoney = (data: number, index: number) => {
  const discountMoney = data / invoice.value.invoiceItems![index].unitRate
  const expectedPrice = invoice.value.invoiceItems![index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  invoice.value.invoiceItems![index].discountMoney = discountMoney
  invoice.value.invoiceItems![index].discountPercent = discountPercent
  invoice.value.invoiceItems![index].actualPrice = actualPrice
  invoice.value.invoiceItems![index].discountType = DiscountType.VND
}

const handleChangeDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = invoice.value.invoiceItems![index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  invoice.value.invoiceItems![index].discountPercent = discountPercent
  invoice.value.invoiceItems![index].discountMoney = discountMoney
  invoice.value.invoiceItems![index].actualPrice = actualPrice
  invoice.value.invoiceItems![index].discountType = DiscountType.Percent
}

const handleChangeHintUsage = (data: string, index: number) => {
  invoice.value.invoiceItems![index].hintUsage = data
}

const handleChangeUnitActualPrice = (data: number, index: number) => {
  const actualPrice = data / invoice.value.invoiceItems![index].unitRate
  const expectedPrice = invoice.value.invoiceItems![index].expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  invoice.value.invoiceItems![index].discountPercent = discountPercent
  invoice.value.invoiceItems![index].discountMoney = discountMoney
  invoice.value.invoiceItems![index].actualPrice = actualPrice
  invoice.value.invoiceItems![index].discountType = DiscountType.VND
}

const handleChangeInvoiceItemQuantity = (quantity: number, index: number) => {
  invoice.value.invoiceItems![index].unitQuantity = quantity
}

const openModalProductDetail = (product?: Product) => {
  if (product) modalProductDetail.value?.openModal(product.id)
}

const openModalProcedureDetail = (procedure?: Procedure) => {
  if (procedure) modalProcedureDetail.value?.openModal(procedure.id)
}

const overQuantityInvoiceItem = (invoiceItem: InvoiceItem): boolean => {
  if (invoiceItem.procedureId) return false
  if (invoiceItem.batchId) {
    return invoiceItem.quantity >= invoiceItem.batch!.quantity
  }
  if (!invoiceItem.batchId && invoiceItem.productId) {
    if (invoiceItem.product?.hasManageQuantity) {
      return invoiceItem.quantity > invoiceItem.product!.quantity
    } else {
      return false
    }
  }
  return false
}
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <div class="py-4">
    <div class="px-4">Danh sách sản phẩm trong phiếu</div>
    <div v-if="isMobile" class="mt-2 table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Sản phẩm</th>
            <th>SL</th>
            <th>TT</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="invoice.invoiceItems!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(invoiceItem, index) in invoice.invoiceItems || []" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td>
              <div v-if="invoiceItem.productId">
                <div class="font-medium text-justify">
                  {{ invoiceItem.product!.brandName }}
                  <a
                    v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                    class="ml-1"
                    @click="openModalProductDetail(invoiceItem.product)"
                  >
                    <FileSearchOutlined />
                  </a>
                </div>
                <div
                  v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.substance"
                  style="font-size: 0.8rem"
                  class="text-justify"
                >
                  {{ invoiceItem.product!.substance }}
                </div>
                <div
                  v-if="
                    screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.batch && invoiceItem.batchId
                  "
                  class="flex gap-2 flex-wrap"
                  style="font-size: 0.8rem"
                >
                  Số Lô: {{ invoiceItem.batch?.lotNumber }} - HSD:
                  {{ timeToText(invoiceItem.batch!.expiryDate, 'DD/MM/YY') }}
                </div>
                <div
                  v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.hintUsage"
                  style="font-size: 0.8rem"
                  class="flex gap-2"
                  contenteditable="true"
                  placeholder="Hướng dẫn sử dụng ..."
                  @input="(e) => handleChangeHintUsage((e.target as HTMLElement)?.innerText, index)"
                >
                  {{ invoiceItem.hintUsage }}
                </div>
              </div>
              <div v-if="invoiceItem.procedureId">
                <div class="font-medium text-justify">
                  {{ invoiceItem.procedure!.name }}
                  <a
                    v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                    class="ml-1"
                    @click="openModalProcedureDetail(invoiceItem.procedure)"
                  >
                    <FileSearchOutlined />
                  </a>
                </div>
              </div>
              <div class="flex gap-2" style="font-size: 0.8rem">
                <div v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.expectedPrice">
                  NY:
                  <span class="font-medium">
                    {{ formatMoney(invoiceItem.unitExpectedPrice) }}
                  </span>
                  <span
                    v-if="
                      screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit &&
                      invoiceItem.unitName
                    "
                  >
                    /{{ invoiceItem.unitName }}
                  </span>
                </div>
                <div v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount">
                  - CK:
                  <a-popconfirm>
                    <template #cancelButton>
                      <div></div>
                    </template>
                    <template #okButton>
                      <div></div>
                    </template>
                    <template #title>
                      <div>
                        Chiết khấu (Tiền hàng:
                        <b>{{ formatMoney(invoiceItem.expectedPrice * invoiceItem.unitRate) }}</b
                        >)
                      </div>
                      <div class="mt-2">
                        <div>
                          <InputMoney
                            :value="invoiceItem.unitDiscountMoney"
                            :append="'VNĐ'"
                            @update:value="(e: number) => handleChangeUnitDiscountMoney(e, index)"
                          />
                        </div>
                        <div class="mt-2">
                          <InputNumber
                            :value="invoiceItem.discountPercent"
                            append="%"
                            @update:value="(e: number) => handleChangeDiscountPercent(e, index)"
                          />
                        </div>
                      </div>
                    </template>
                    <a-tag
                      v-if="invoiceItem.discountType === 'VNĐ'"
                      color="success"
                      style="cursor: pointer; margin-top: -10px"
                    >
                      {{ formatMoney(invoiceItem.unitDiscountMoney) }}
                    </a-tag>
                    <a-tag
                      v-if="invoiceItem.discountType === '%'"
                      color="success"
                      style="cursor: pointer; margin-top: -10px"
                    >
                      {{ invoiceItem.discountPercent || 0 }}%
                    </a-tag>
                  </a-popconfirm>
                </div>
                <div>
                  - ĐG:
                  <span class="font-medium">
                    {{ formatMoney(invoiceItem.unitActualPrice) }}
                  </span>
                  <span
                    v-if="
                      screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit &&
                      invoiceItem.unitName
                    "
                  >
                    /{{ invoiceItem.unitName }}
                  </span>
                </div>
              </div>
            </td>
            <td class="text-center whitespace-nowrap">
              <!-- <div class="flex items-center justify-between">
                <div
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede]"
                  @click="invoice.invoiceItems![index].unitQuantity--"
                >
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </div>
                <div style="width: calc(100% - 60px)">
                  <InputNumber v-model:value="invoiceItem.unitQuantity" textAlign="right" />
                </div>
                <div
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede]"
                  @click="invoice.invoiceItems![index].unitQuantity++"
                >
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </div>
              </div> -->
              <div>
                <button
                  style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                  class="disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="
                    !screenStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.negativeQuantity &&
                    overQuantityInvoiceItem(invoice.invoiceItems![index])
                  "
                  @click="invoice.invoiceItems![index].quantity += invoiceItem.unitRate"
                >
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
                </button>
                <div
                  style="font-size: 1.1rem"
                  contenteditable="true"
                  @input="
                    (e) =>
                      handleChangeInvoiceItemQuantity(
                        Number((e.target as HTMLElement)?.innerText) || 0,
                        index
                      )
                  "
                >
                  {{ invoiceItem.quantity / invoiceItem.unitRate }}
                </div>
                <button
                  style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                  class="disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="invoiceItem.quantity == 0"
                  @click="invoice.invoiceItems![index].quantity -= invoiceItem.unitRate"
                >
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(invoiceItem.actualPrice * invoiceItem.quantity) }}
            </td>
            <td class="text-center">
              <a class="text-red-500" @click="invoice.invoiceItems!.splice(index, 1)">
                <DeleteOutlined />
              </a>
            </td>
          </tr>
          <tr>
            <td colspan="2" class="text-right">Tổng tiền hàng:</td>
            <td colspan="2" class="text-right">
              {{ formatMoney(invoice.itemsActualMoney) }}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!isMobile" class="table-wrapper mt-2 mx-4">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Tên</th>
            <th>Số lượng</th>
            <th v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit">Đ.Vị</th>
            <th v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount">C.Khấu</th>
            <th>Đơn giá</th>
            <th>Tổng tiền</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="invoice.invoiceItems!.length == 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(invoiceItem, index) in invoice.invoiceItems" :key="index">
            <td class="text-center">
              {{ index + 1 }}
            </td>
            <td>
              <div v-if="invoiceItem.productId">
                <div style="font-weight: 500" class="text-justify">
                  {{ invoiceItem.product!.brandName }}
                  <a
                    v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                    class="ml-1"
                    @click="openModalProductDetail(invoiceItem.product)"
                  >
                    <FileSearchOutlined />
                  </a>
                </div>
                <div
                  v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.substance"
                  class="text-justify"
                  style="font-size: 0.8rem"
                >
                  {{ invoiceItem.product!.substance }}
                </div>
                <div
                  v-if="
                    screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.batch && invoiceItem.batchId
                  "
                  style="font-size: 0.8rem"
                  class="flex gap-2"
                >
                  Số lô {{ invoiceItem.batch?.lotNumber }} - HSD
                  {{ timeToText(invoiceItem.batch!.expiryDate) }}
                </div>
                <div
                  v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.hintUsage"
                  placeholder="Hướng dẫn sử dụng ..."
                  contenteditable="true"
                  style="font-size: 0.8rem"
                  @input="(e) => handleChangeHintUsage((e.target as HTMLElement)?.innerText, index)"
                >
                  {{ invoiceItem.hintUsage }}
                </div>
              </div>
              <div v-if="invoiceItem.type === InvoiceItemType.Procedure">
                <div style="font-weight: 500">
                  {{ invoiceItem.procedure!.name }}
                  <a
                    v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                    class="ml-1"
                    @click="openModalProcedureDetail(invoiceItem.procedure)"
                  >
                    <FileSearchOutlined />
                  </a>
                </div>
              </div>
            </td>
            <td style="width: 150px">
              <div class="flex items-center justify-between">
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="invoiceItem.quantity === 0"
                  @click="invoice.invoiceItems![index].unitQuantity--"
                >
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber v-model:value="invoiceItem.unitQuantity" textAlign="right" />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="
                    !screenStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.negativeQuantity &&
                    overQuantityInvoiceItem(invoice.invoiceItems![index])
                  "
                  @click="invoice.invoiceItems![index].unitQuantity++"
                >
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </button>
              </div>
            </td>
            <td
              v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit"
              class="text-center"
              style="width: 20px"
            >
              {{ invoiceItem.unitName || 'Lần' }}
            </td>
            <td
              v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount"
              class="text-center"
              style="width: 40px"
            >
              <a-popconfirm>
                <template #cancelButton>
                  <div></div>
                </template>
                <template #okButton>
                  <div></div>
                </template>
                <template #title>
                  <div>
                    Chiết khấu (Tiền hàng:
                    <b>{{ formatMoney(invoiceItem.unitExpectedPrice) }}</b
                    >)
                  </div>
                  <div class="mt-2">
                    <div>
                      <InputMoney
                        :value="invoiceItem.unitDiscountMoney"
                        append="VNĐ"
                        @update:value="(e: number) => handleChangeUnitDiscountMoney(e, index)"
                      />
                    </div>
                    <div class="mt-2">
                      <div class="w-full">
                        <InputNumber
                          :value="invoiceItem.discountPercent"
                          append="%"
                          @update:value="(e: number) => handleChangeDiscountPercent(e, index)"
                        />
                      </div>
                    </div>
                  </div>
                </template>
                <a-tag
                  v-if="invoiceItem.discountType === 'VNĐ'"
                  color="success"
                  style="cursor: pointer"
                >
                  {{ formatMoney(invoiceItem.unitDiscountMoney) }}
                </a-tag>
                <a-tag
                  v-if="invoiceItem.discountType === '%'"
                  color="success"
                  style="cursor: pointer"
                >
                  {{ invoiceItem.discountPercent || 0 }}%
                </a-tag>
              </a-popconfirm>
            </td>
            <td class="text-center">
              <div v-if="!screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.editActualPrice">
                <div v-if="invoiceItem.discountMoney" class="text-xs italic text-red-500">
                  <del>{{ formatMoney(invoiceItem.unitExpectedPrice) }}</del>
                </div>
                <div>{{ formatMoney(invoiceItem.unitActualPrice) }}</div>
              </div>
              <div v-else class="w-full">
                <InputMoney
                  text-align="right"
                  :value="invoiceItem.unitActualPrice"
                  @update:value="(e: number) => handleChangeUnitActualPrice(e, index)"
                />
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(invoiceItem.actualPrice * invoiceItem.quantity) }}
            </td>
            <td class="text-center" style="width: 20px">
              <a class="text-red-500 text-xl" @click="invoice.invoiceItems!.splice(index, 1)">
                <DeleteOutlined />
              </a>
            </td>
          </tr>
          <tr>
            <td colspan="100" class="text-right">
              <span class="mr-10">Tổng tiền hàng:</span>
              <span class="mr-20"> {{ formatMoney(invoice.itemsActualMoney) }} </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
