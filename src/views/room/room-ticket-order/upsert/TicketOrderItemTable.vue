<script setup lang="ts">
import { IconFileSearch } from '@/common/icon-antd'
import { IconMinus, IconPlus, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconEditSquare } from '@/common/icon-google'
import { InputNumber } from '@/common/vue-form'
import VueTag from '@/common/VueTag.vue'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType, PickupStrategy } from '@/modules/enum'
import type { Procedure } from '@/modules/procedure'
import type { Product } from '@/modules/product'
import type { TicketProduct } from '@/modules/ticket-product'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import { ref } from 'vue'
import ModalTicketOrderUpdateProcedure from './ModalTicketOrderUpdateProcedure.vue'
import ModalTicketOrderUpdateProduct from './ModalTicketOrderUpdateProduct.vue'
import { ticketOrderUpsertRef } from './ticket-order-upsert.ref'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalTicketOrderUpdateProcedure = ref<InstanceType<typeof ModalTicketOrderUpdateProcedure>>()
const modalTicketOrderUpdateProduct = ref<InstanceType<typeof ModalTicketOrderUpdateProduct>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const pickupStrategy = ref(MeService.getPickupStrategy().order)

const handleChangeHintUsage = (data: string, index: number) => {
  ticketOrderUpsertRef.value.ticketProductList![index].hintUsage = data
}

const overQuantityTicketProduct = (ticketProduct: TicketProduct): boolean => {
  if (
    ticketProduct.product?.warehouseIds !== '[]' &&
    pickupStrategy.value !== PickupStrategy.NoImpact
  ) {
    return ticketProduct.quantity >= ticketProduct.product!.quantity
  }
  return false
}

const handleChangeTicketProductUnitDiscountMoney = (data: number, index: number) => {
  const discountMoney = data / ticketOrderUpsertRef.value.ticketProductList![index].unitRate
  const expectedPrice = ticketOrderUpsertRef.value.ticketProductList![index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  ticketOrderUpsertRef.value.ticketProductList![index].discountMoney = discountMoney
  ticketOrderUpsertRef.value.ticketProductList![index].discountPercent = discountPercent
  ticketOrderUpsertRef.value.ticketProductList![index].actualPrice = actualPrice
  ticketOrderUpsertRef.value.ticketProductList![index].discountType = DiscountType.VND
}

const handleChangeTicketProductDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = ticketOrderUpsertRef.value.ticketProductList![index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  ticketOrderUpsertRef.value.ticketProductList![index].discountPercent = discountPercent
  ticketOrderUpsertRef.value.ticketProductList![index].discountMoney = discountMoney
  ticketOrderUpsertRef.value.ticketProductList![index].actualPrice = actualPrice
  ticketOrderUpsertRef.value.ticketProductList![index].discountType = DiscountType.Percent
}

const handleChangeTicketProductUnitActualPrice = (data: number, index: number) => {
  const actualPrice = data / ticketOrderUpsertRef.value.ticketProductList![index].unitRate
  const expectedPrice = ticketOrderUpsertRef.value.ticketProductList![index].expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketOrderUpsertRef.value.ticketProductList![index].discountPercent = discountPercent
  ticketOrderUpsertRef.value.ticketProductList![index].discountMoney = discountMoney
  ticketOrderUpsertRef.value.ticketProductList![index].actualPrice = actualPrice
  ticketOrderUpsertRef.value.ticketProductList![index].discountType = DiscountType.VND
}

const handleChangeTicketProductUnitQuantity = (unitQuantity: number, index: number) => {
  ticketOrderUpsertRef.value.ticketProductList![index].unitQuantity = unitQuantity
}

const handleChangeTicketProcedureDiscountMoney = (data: number, index: number) => {
  const discountMoney = data
  const expectedPrice = ticketOrderUpsertRef.value.ticketProcedureList![index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  ticketOrderUpsertRef.value.ticketProcedureList![index].discountMoney = discountMoney
  ticketOrderUpsertRef.value.ticketProcedureList![index].discountPercent = discountPercent
  ticketOrderUpsertRef.value.ticketProcedureList![index].actualPrice = actualPrice
  ticketOrderUpsertRef.value.ticketProcedureList![index].discountType = DiscountType.VND
}

const handleChangeTicketProcedureDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = ticketOrderUpsertRef.value.ticketProcedureList![index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  ticketOrderUpsertRef.value.ticketProcedureList![index].discountPercent = discountPercent
  ticketOrderUpsertRef.value.ticketProcedureList![index].discountMoney = discountMoney
  ticketOrderUpsertRef.value.ticketProcedureList![index].actualPrice = actualPrice
  ticketOrderUpsertRef.value.ticketProcedureList![index].discountType = DiscountType.Percent
}

const handleChangeTicketProcedureQuantity = (quantity: number, index: number) => {
  ticketOrderUpsertRef.value.ticketProcedureList![index].quantity = quantity
}

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
              <td class="text-center whitespace-nowrap">
                <!-- <div class="flex items-center justify-between">
                <div
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede]"
                  @click="ticketOrderUpsertRef.ticketItems![index].unitQuantity--"
                >
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </div>
                <div style="width: calc(100% - 60px)">
                  <InputNumber v-model:value="ticketItem.unitQuantity" textAlign="right" />
                </div>
                <div
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede]"
                  @click="ticketOrderUpsertRef.ticketItems![index].unitQuantity++"
                >
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </div>
              </div> -->
                <div>
                  <button
                    style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                    class="disabled:opacity-[30%] disabled:cursor-not-allowed"
                    @click="ticketProcedure.quantity++"
                  >
                    <IconSortUp style="opacity: 0.6" />
                  </button>
                  <div
                    style="font-size: 1.1rem"
                    contenteditable="true"
                    @input="
                      (e) =>
                        handleChangeTicketProcedureQuantity(
                          Number((e.target as HTMLElement)?.innerText) || 0,
                          index,
                        )
                    "
                  >
                    {{ ticketProcedure.quantity }}
                  </div>
                  <button
                    style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                    class="disabled:opacity-[30%] disabled:cursor-not-allowed"
                    :disabled="ticketProcedure.quantity == 0"
                    @click="ticketProcedure.quantity--"
                  >
                    <IconSortDown style="opacity: 0.6" />
                  </button>
                </div>
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
                      ticketProduct.discountMoney &&
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
                      ticketProduct.discountMoney &&
                      settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount
                    "
                  >
                    - CK:
                    <VueTag v-if="ticketProduct.discountType === 'VNĐ'" color="green">
                      {{ formatMoney(ticketProduct.discountMoney * ticketProduct.unitRate) }}
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
              <td class="text-center whitespace-nowrap">
                <!-- <div class="flex items-center justify-between">
                <div
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede]"
                  @click="ticketOrderUpsertRef.ticketItems![index].unitQuantity--"
                >
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </div>
                <div style="width: calc(100% - 60px)">
                  <InputNumber v-model:value="ticketItem.unitQuantity" textAlign="right" />
                </div>
                <div
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede]"
                  @click="ticketOrderUpsertRef.ticketItems![index].unitQuantity++"
                >
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </div>
              </div> -->
                <div>
                  <button
                    style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                    class="disabled:opacity-[30%] disabled:cursor-not-allowed"
                    :disabled="
                      !settingStore.PRODUCT_SETTING.allowNegativeQuantity &&
                      overQuantityTicketProduct(ticketProduct)
                    "
                    @click="
                      (e) =>
                        handleChangeTicketProductUnitQuantity(ticketProduct.unitQuantity + 1, index)
                    "
                  >
                    <IconSortUp style="opacity: 0.6" />
                  </button>
                  <div
                    style="font-size: 1.1rem"
                    contenteditable="true"
                    @input="
                      (e) =>
                        handleChangeTicketProductUnitQuantity(
                          Number((e.target as HTMLElement)?.innerText) || 0,
                          index,
                        )
                    "
                  >
                    {{ ticketProduct.unitQuantity }}
                  </div>
                  <button
                    style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                    class="disabled:opacity-[30%] disabled:cursor-not-allowed"
                    :disabled="ticketProduct.unitQuantity == 0"
                    @click="
                      (e) =>
                        handleChangeTicketProductUnitQuantity(ticketProduct.unitQuantity - 1, index)
                    "
                  >
                    <IconSortDown style="opacity: 0.6" />
                  </button>
                </div>
              </td>
              <td class="text-right whitespace-nowrap">
                {{ formatMoney(ticketProduct.actualPrice * ticketProduct.quantity) }}
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
            <th>#</th>
            <th>Tên</th>
            <th v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit">Đ.Vị</th>
            <th>Số lượng</th>
            <th v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount">C.Khấu</th>
            <th>Đơn giá</th>
            <th>Tổng tiền</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="ticketOrderUpsertRef.ticketProcedureList!.length">
            <tr v-if="ticketOrderUpsertRef.ticketProductList?.length">
              <td colspan="100" class="font-bold">Dịch vụ</td>
            </tr>
            <tr
              v-for="(ticketProcedure, index) in ticketOrderUpsertRef.ticketProcedureList"
              :key="index"
            >
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
                <div class="flex items-center justify-between">
                  <button
                    style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                    class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                    :disabled="ticketProcedure.quantity <= 0"
                    @click="ticketProcedure.quantity--"
                  >
                    <IconMinus />
                  </button>
                  <div style="width: calc(100% - 60px); min-width: 50px">
                    <InputNumber v-model:value="ticketProcedure.quantity" textAlign="right" />
                  </div>
                  <button
                    style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                    class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                    @click="ticketProcedure.quantity++"
                  >
                    <IconPlus />
                  </button>
                </div>
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
                <div class="flex items-center justify-between">
                  <button
                    style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                    class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                    :disabled="ticketProduct.quantity === 0"
                    @click="
                      (e) =>
                        handleChangeTicketProductUnitQuantity(ticketProduct.unitQuantity - 1, index)
                    "
                  >
                    <IconMinus />
                  </button>
                  <div style="width: calc(100% - 60px); min-width: 50px">
                    <InputNumber
                      :value="ticketProduct.unitQuantity"
                      textAlign="right"
                      @update:value="(v) => handleChangeTicketProductUnitQuantity(v, index)"
                    />
                  </div>
                  <button
                    style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                    class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                    :disabled="
                      !settingStore.PRODUCT_SETTING.allowNegativeQuantity &&
                      overQuantityTicketProduct(ticketProduct)
                    "
                    @click="
                      (e) =>
                        handleChangeTicketProductUnitQuantity(ticketProduct.unitQuantity + 1, index)
                    "
                  >
                    <IconPlus />
                  </button>
                </div>
              </td>
              <td
                v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount"
                class="text-center"
                style="width: 40px"
              >
                <VueTag v-if="ticketProduct.discountType === 'VNĐ'" color="green">
                  {{ formatMoney(ticketProduct.discountMoney * ticketProduct.unitRate) }}
                </VueTag>
                <VueTag v-if="ticketProduct.discountType === '%'" color="green">
                  {{ ticketProduct.discountPercent || 0 }}%
                </VueTag>
              </td>

              <td class="text-right">
                {{ formatMoney(ticketProduct.unitActualPrice) }}
              </td>
              <td class="text-right">
                <div v-if="ticketProduct.discountMoney" class="text-xs italic text-red-500">
                  <del>
                    {{ formatMoney(ticketProduct.unitExpectedPrice * ticketProduct.quantity) }}
                  </del>
                </div>
                <div>{{ formatMoney(ticketProduct.unitActualPrice * ticketProduct.quantity) }}</div>
              </td>
              <td class="text-center" style="width: 24px; font-size: 20px">
                <a class="text-orange-500" @click="modalTicketOrderUpdateProduct?.openModal(index)">
                  <IconEditSquare />
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
