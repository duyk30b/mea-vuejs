<script setup lang="ts">
import { IconBug, IconDelete, IconFileSearch } from '@/common/icon-antd'
import { IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconEditSquare } from '@/common/icon-google'
import { InputNumber } from '@/common/vue-form'
import VueTag from '@/common/VueTag.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import type { Procedure } from '@/modules/procedure'
import type { Product } from '@/modules/product'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import { ref } from 'vue'
import ModalTicketOrderUpdateProcedure from './ModalTicketOrderUpdateProcedure.vue'
import ModalTicketOrderUpdateProduct from './ModalTicketOrderUpdateProduct.vue'
import { ticketOrderUpsertRef } from './ticket-order-upsert.ref'
import { CONFIG } from '@/config'
import { VueTooltip } from '@/common/popover'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalTicketOrderUpdateProcedure = ref<InstanceType<typeof ModalTicketOrderUpdateProcedure>>()
const modalTicketOrderUpdateProduct = ref<InstanceType<typeof ModalTicketOrderUpdateProduct>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const openModalProductDetail = (product?: Product) => {
  if (product) modalProductDetail.value?.openModal(product)
}

const openModalProcedureDetail = (procedure?: Procedure) => {
  if (procedure) modalProcedureDetail.value?.openModal(procedure.id)
}

const changeTicketProductPosition = (index: number, count: number) => {
  const temp = ticketOrderUpsertRef.value.ticketProductList![index]
  ticketOrderUpsertRef.value.ticketProductList![index] =
    ticketOrderUpsertRef.value.ticketProductList![index + count]
  ticketOrderUpsertRef.value.ticketProductList![index + count] = temp
}

const changeTicketProcedurePosition = (index: number, count: number) => {
  const temp = ticketOrderUpsertRef.value.ticketProcedureList![index]
  ticketOrderUpsertRef.value.ticketProcedureList![index] =
    ticketOrderUpsertRef.value.ticketProcedureList![index + count]
  ticketOrderUpsertRef.value.ticketProcedureList![index + count] = temp
}

const startRemoveTicketProduct = (_localId: string) => {
  const index = ticketOrderUpsertRef.value.ticketProductList!.findIndex((i) => {
    return i._localId === _localId
  })
  ticketOrderUpsertRef.value.ticketProductList!.splice(index, 1)
}

const startRemoveTicketProcedure = (_localId: string) => {
  const index = ticketOrderUpsertRef.value.ticketProcedureList!.findIndex((i) => {
    return i._localId === _localId
  })
  ticketOrderUpsertRef.value.ticketProcedureList!.splice(index, 1)
}
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalTicketOrderUpdateProduct ref="modalTicketOrderUpdateProduct" />
  <ModalTicketOrderUpdateProcedure ref="modalTicketOrderUpdateProcedure" />
  <div class="py-4">
    <div class="px-4">Giỏ hàng</div>
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
          <template v-if="ticketOrderUpsertRef.ticketProcedureList!.length">
            <tr v-if="ticketOrderUpsertRef.ticketProductList?.length">
              <td colspan="100" class="font-bold">Dịch vụ</td>
            </tr>
            <tr
              v-for="(ticketProcedure, index) in ticketOrderUpsertRef.ticketProcedureList || []"
              :key="index"
            >
              <td style="padding: 0.5rem 0.2rem; white-space: nowrap">
                <div class="flex flex-col items-center">
                  <button
                    type="button"
                    style="
                      border: none;
                      font-size: 1.2rem;
                      line-height: 0.5;
                      background: none;
                      margin-bottom: -0.5rem;
                    "
                    class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                    :disabled="index === 0"
                    @click="changeTicketProcedurePosition(index, -1)"
                  >
                    <IconSortUp style="opacity: 0.6" />
                  </button>
                  <span>{{ index + 1 }}</span>
                  <button
                    type="button"
                    style="
                      border: none;
                      font-size: 1.2rem;
                      line-height: 0.5;
                      background: none;
                      margin-top: -0.5rem;
                    "
                    class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                    :disabled="
                      index === (ticketOrderUpsertRef.ticketProcedureList!.length || 0) - 1
                    "
                    @click="changeTicketProcedurePosition(index, 1)"
                  >
                    <IconSortDown :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                  </button>
                </div>
              </td>
              <td>
                <div class="font-medium text-justify">
                  {{ ticketProcedure.procedure!.name }}
                  <a
                    v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                    class="ml-1"
                    @click="openModalProcedureDetail(ticketProcedure.procedure)"
                  >
                    <IconFileSearch />
                  </a>
                </div>
                <div class="" style="font-size: 0.8rem">
                  <div
                    v-if="
                      ticketProcedure.discountMoney &&
                      settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.expectedPrice
                    "
                  >
                    - NY:
                    <span class="font-medium">
                      {{ formatMoney(ticketProcedure.expectedPrice) }}
                    </span>
                  </div>
                  <div
                    v-if="
                      ticketProcedure.discountMoney &&
                      settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount
                    "
                  >
                    - CK:
                    <VueTag v-if="ticketProcedure.discountType === 'VNĐ'" color="green">
                      {{ formatMoney(ticketProcedure.discountMoney) }}
                    </VueTag>
                    <VueTag v-if="ticketProcedure.discountType === '%'" color="green">
                      {{ ticketProcedure.discountPercent || 0 }}%
                    </VueTag>
                  </div>
                  <div>
                    - ĐG:
                    <span class="font-medium">
                      {{ formatMoney(ticketProcedure.actualPrice) }}
                    </span>
                  </div>
                </div>
              </td>
              <td style="width: 100px">
                <InputNumber v-model:value="ticketProcedure.quantity" controlVertical />
              </td>
              <td class="text-right whitespace-nowrap">
                {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
              </td>
              <td class="text-center" style="font-size: 20px">
                <a
                  class="text-orange-500"
                  @click="modalTicketOrderUpdateProcedure?.openModal(index)"
                >
                  <IconEditSquare />
                </a>
              </td>
            </tr>
          </template>
          <template v-if="ticketOrderUpsertRef.ticketProductList!.length">
            <tr v-if="ticketOrderUpsertRef.ticketProcedureList?.length">
              <td colspan="100" class="font-bold">Sản phẩm</td>
            </tr>
            <tr
              v-for="(ticketProduct, index) in ticketOrderUpsertRef.ticketProductList || []"
              :key="index"
            >
              <td style="padding: 0.5rem 0.2rem; white-space: nowrap">
                <div class="flex flex-col items-center">
                  <button
                    type="button"
                    style="
                      border: none;
                      font-size: 1.2rem;
                      line-height: 0.5;
                      background: none;
                      margin-bottom: -0.5rem;
                    "
                    class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                    :disabled="index === 0"
                    @click="changeTicketProductPosition(index, -1)"
                  >
                    <IconSortUp style="opacity: 0.6" />
                  </button>
                  <span>{{ index + 1 }}</span>
                  <button
                    type="button"
                    style="
                      border: none;
                      font-size: 1.2rem;
                      line-height: 0.5;
                      background: none;
                      margin-top: -0.5rem;
                    "
                    class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                    :disabled="index === (ticketOrderUpsertRef.ticketProductList!.length || 0) - 1"
                    @click="changeTicketProductPosition(index, 1)"
                  >
                    <IconSortDown style="opacity: 0.6" />
                  </button>
                </div>
              </td>
              <td>
                <div class="font-medium text-justify">
                  {{ ticketProduct.product!.brandName }}
                  <a
                    v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                    class="ml-1"
                    @click="openModalProductDetail(ticketProduct.product!)"
                  >
                    <IconFileSearch />
                  </a>
                </div>
                <div
                  v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.substance"
                  style="font-size: 0.8rem"
                  class="text-justify"
                >
                  {{ ticketProduct.product!.substance }}
                </div>
                <div v-if="ticketProduct.hintUsage" style="font-size: 0.8rem" class="flex gap-2">
                  {{ ticketProduct.hintUsage }}
                </div>
                <div class="" style="font-size: 0.8rem">
                  <div
                    v-if="
                      ticketProduct.unitDiscountMoney &&
                      settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.expectedPrice
                    "
                  >
                    - NY:
                    <span class="font-medium">
                      {{ formatMoney(ticketProduct.unitExpectedPrice) }}
                    </span>
                    <span
                      v-if="
                        settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit &&
                        ticketProduct.unitName
                      "
                    >
                      /{{ ticketProduct.unitName }}
                    </span>
                  </div>
                  <div
                    v-if="
                      ticketProduct.unitDiscountMoney &&
                      settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount
                    "
                  >
                    - CK:
                    <VueTag v-if="ticketProduct.discountType === 'VNĐ'" color="green">
                      {{ formatMoney(ticketProduct.unitDiscountMoney) }}
                    </VueTag>
                    <VueTag v-if="ticketProduct.discountType === '%'" color="green">
                      {{ ticketProduct.discountPercent || 0 }}%
                    </VueTag>
                  </div>
                  <div>
                    - ĐG:
                    <span class="font-medium">
                      {{ formatMoney(ticketProduct.unitActualPrice) }}
                    </span>
                    <span
                      v-if="
                        settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit &&
                        ticketProduct.unitName
                      "
                    >
                      /{{ ticketProduct.unitName }}
                    </span>
                  </div>
                </div>
              </td>
              <td style="width: 100px">
                <InputNumber v-model:value="ticketProduct.unitQuantity" controlVertical />
              </td>
              <td class="text-right whitespace-nowrap">
                {{ formatMoney(ticketProduct.unitActualPrice * ticketProduct.unitQuantity) }}
              </td>
              <td class="text-center" style="font-size: 20px">
                <a class="text-orange-500" @click="modalTicketOrderUpdateProduct?.openModal(index)">
                  <IconEditSquare />
                </a>
              </td>
            </tr>
          </template>
          <tr>
            <td colspan="2" class="text-right">Tổng tiền:</td>
            <td colspan="2" class="text-right">
              {{
                formatMoney(ticketOrderUpsertRef.productMoney + ticketOrderUpsertRef.procedureMoney)
              }}
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
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>#</th>
            <th>Tên</th>
            <th v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit">Đ.Vị</th>
            <th>Số lượng</th>
            <th v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount">C.Khấu</th>
            <th>Đơn giá</th>
            <th>Tổng tiền</th>
            <th colspan="2">Action</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="ticketOrderUpsertRef.ticketProcedureList!.length">
            <tr v-if="ticketOrderUpsertRef.ticketProductList?.length">
              <td colspan="100" class="font-bold">Dịch vụ</td>
            </tr>
            <tr
              v-for="(ticketProcedure, index) in ticketOrderUpsertRef.ticketProcedureList"
              :key="ticketProcedure._localId"
            >
              <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                  <template #trigger>
                    <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
                  </template>
                  <pre>{{ JSON.stringify(ticketProcedure, null, 4) }}</pre>
                </VueTooltip>
              </td>
              <td>
                <div class="flex flex-col items-center">
                  <button
                    type="button"
                    style="
                      border: none;
                      font-size: 1.2rem;
                      line-height: 0.5;
                      background: none;
                      margin-bottom: -0.5rem;
                    "
                    class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                    :disabled="index === 0"
                    @click="changeTicketProcedurePosition(index, -1)"
                  >
                    <IconSortUp style="opacity: 0.6" />
                  </button>
                  <span>{{ index + 1 }}</span>
                  <button
                    type="button"
                    style="
                      border: none;
                      font-size: 1.2rem;
                      line-height: 0.5;
                      background: none;
                      margin-top: -0.5rem;
                    "
                    class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                    :disabled="
                      index === (ticketOrderUpsertRef.ticketProcedureList!.length || 0) - 1
                    "
                    @click="changeTicketProcedurePosition(index, 1)"
                  >
                    <IconSortDown style="opacity: 0.6" />
                  </button>
                </div>
              </td>
              <td :colspan="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit ? '2' : '1'">
                <div style="font-weight: 500">
                  {{ ticketProcedure.procedure!.name }}
                  <a
                    v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                    class="ml-1"
                    @click="openModalProcedureDetail(ticketProcedure.procedure)"
                  >
                    <IconFileSearch />
                  </a>
                </div>
              </td>
              <td style="width: 150px">
                <InputNumber
                  v-model:value="ticketProcedure.quantity"
                  textAlign="right"
                  controlHorizontal
                />
              </td>
              <td
                v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount"
                class="text-center"
                style="width: 40px"
              >
                <VueTag v-if="ticketProcedure.discountType === 'VNĐ'" color="green">
                  {{ formatMoney(ticketProcedure.discountMoney) }}
                </VueTag>
                <VueTag v-if="ticketProcedure.discountType === '%'" color="green">
                  {{ ticketProcedure.discountPercent || 0 }}%
                </VueTag>
              </td>
              <td class="text-right">
                <div v-if="ticketProcedure.discountMoney" class="text-xs italic text-red-500">
                  <del>{{ formatMoney(ticketProcedure.expectedPrice) }}</del>
                </div>
                <div>{{ formatMoney(ticketProcedure.actualPrice) }}</div>
              </td>
              <td class="text-right">
                {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
              </td>
              <td class="text-center" style="width: 24px; font-size: 20px">
                <a
                  class="text-orange-500"
                  @click="modalTicketOrderUpdateProcedure?.openModal(index)"
                >
                  <IconEditSquare />
                </a>
              </td>
              <td class="text-center" style="width: 24px; font-size: 20px">
                <a
                  style="color: var(--text-red)"
                  @click="startRemoveTicketProcedure(ticketProcedure._localId)"
                >
                  <IconDelete />
                </a>
              </td>
            </tr>
          </template>
          <template v-if="ticketOrderUpsertRef.ticketProductList!.length">
            <tr v-if="ticketOrderUpsertRef.ticketProcedureList?.length">
              <td colspan="100" class="font-bold">Sản phẩm</td>
            </tr>
            <tr
              v-for="(ticketProduct, index) in ticketOrderUpsertRef.ticketProductList || []"
              :key="ticketProduct._localId"
            >
              <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                  <template #trigger>
                    <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
                  </template>
                  <pre>{{ JSON.stringify(ticketProduct, null, 4) }}</pre>
                </VueTooltip>
              </td>
              <td>
                <div class="flex flex-col items-center">
                  <button
                    type="button"
                    style="
                      border: none;
                      font-size: 1.2rem;
                      line-height: 0.5;
                      background: none;
                      margin-bottom: -0.5rem;
                    "
                    class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                    :disabled="index === 0"
                    @click="changeTicketProductPosition(index, -1)"
                  >
                    <IconSortUp style="opacity: 0.6" />
                  </button>
                  <span>{{ index + 1 }}</span>
                  <button
                    type="button"
                    style="
                      border: none;
                      font-size: 1.2rem;
                      line-height: 0.5;
                      background: none;
                      margin-top: -0.5rem;
                    "
                    class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                    :disabled="index === (ticketOrderUpsertRef.ticketProductList!.length || 0) - 1"
                    @click="changeTicketProductPosition(index, 1)"
                  >
                    <IconSortDown style="opacity: 0.6" />
                  </button>
                </div>
              </td>
              <td>
                <div style="font-weight: 500" class="text-justify">
                  {{ ticketProduct.product!.brandName }}
                  <a
                    v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                    class="ml-1"
                    @click="openModalProductDetail(ticketProduct.product!)"
                  >
                    <IconFileSearch />
                  </a>
                </div>
                <div
                  v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.substance"
                  class="text-justify"
                  style="font-size: 0.8rem"
                >
                  {{ ticketProduct.product!.substance }}
                </div>
                <div v-if="ticketProduct.hintUsage">
                  {{ ticketProduct.hintUsage }}
                </div>
              </td>
              <td
                v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit"
                class="text-center"
              >
                {{ ticketProduct.unitName }}
              </td>
              <td style="width: 150px">
                <InputNumber
                  v-model:value="ticketProduct.unitQuantity"
                  textAlign="right"
                  controlHorizontal
                />
              </td>
              <td
                v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount"
                class="text-center"
                style="width: 40px"
              >
                <VueTag v-if="ticketProduct.discountType === 'VNĐ'" color="green">
                  {{ formatMoney(ticketProduct.unitDiscountMoney) }}
                </VueTag>
                <VueTag v-if="ticketProduct.discountType === '%'" color="green">
                  {{ ticketProduct.discountPercent || 0 }}%
                </VueTag>
              </td>

              <td class="text-right">
                {{ formatMoney(ticketProduct.unitActualPrice) }}
              </td>
              <td class="text-right">
                <div v-if="ticketProduct.unitDiscountMoney" class="text-xs italic text-red-500">
                  <del>
                    {{ formatMoney(ticketProduct.unitExpectedPrice * ticketProduct.unitQuantity) }}
                  </del>
                </div>
                <div>{{ formatMoney(ticketProduct.unitActualPrice * ticketProduct.unitQuantity) }}</div>
              </td>
              <td class="text-center" style="width: 24px; font-size: 20px">
                <a class="text-orange-500" @click="modalTicketOrderUpdateProduct?.openModal(index)">
                  <IconEditSquare />
                </a>
              </td>
              <td class="text-center" style="width: 24px; font-size: 20px">
                <a
                  style="color: var(--text-red)"
                  @click="startRemoveTicketProduct(ticketProduct._localId)"
                >
                  <IconDelete />
                </a>
              </td>
            </tr>
          </template>
          <tr>
            <td colspan="100" class="text-right">
              <span class="mr-10">Tổng tiền:</span>
              <span class="mr-15 font-bold">
                {{
                  formatMoney(
                    ticketOrderUpsertRef.productMoney + ticketOrderUpsertRef.procedureMoney,
                  )
                }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
