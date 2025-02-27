<script setup lang="ts">
import { FileSearchOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import { IconDelete } from '../../../common/icon-google'
import { InputMoney, InputNumber } from '../../../common/vue-form'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DiscountType } from '../../../modules/enum'
import type { Procedure } from '../../../modules/procedure'
import type { Product } from '../../../modules/product'
import type { TicketProduct } from '../../../modules/ticket-product'
import { timeToText } from '../../../utils'
import ModalProcedureDetail from '../../master-data/procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import { ticket } from './ticket-order-upsert.ref'
import VueTag from '../../../common/VueTag.vue'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const handleChangeHintUsage = (data: string, index: number) => {
  ticket.value.ticketProductList![index].hintUsage = data
}

const overQuantityTicketProduct = (ticketProduct: TicketProduct): boolean => {
  if (ticketProduct.product?.hasManageQuantity) {
    return ticketProduct.quantity >= ticketProduct.batch!.quantity
  }
  return false
}

const handleChangeTicketProductUnitDiscountMoney = (data: number, index: number) => {
  const discountMoney = data / ticket.value.ticketProductList![index].unitRate
  const expectedPrice = ticket.value.ticketProductList![index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  ticket.value.ticketProductList![index].discountMoney = discountMoney
  ticket.value.ticketProductList![index].discountPercent = discountPercent
  ticket.value.ticketProductList![index].actualPrice = actualPrice
  ticket.value.ticketProductList![index].discountType = DiscountType.VND
}

const handleChangeTicketProductDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = ticket.value.ticketProductList![index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  ticket.value.ticketProductList![index].discountPercent = discountPercent
  ticket.value.ticketProductList![index].discountMoney = discountMoney
  ticket.value.ticketProductList![index].actualPrice = actualPrice
  ticket.value.ticketProductList![index].discountType = DiscountType.Percent
}

const handleChangeTicketProductUnitActualPrice = (data: number, index: number) => {
  const actualPrice = data / ticket.value.ticketProductList![index].unitRate
  const expectedPrice = ticket.value.ticketProductList![index].expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticket.value.ticketProductList![index].discountPercent = discountPercent
  ticket.value.ticketProductList![index].discountMoney = discountMoney
  ticket.value.ticketProductList![index].actualPrice = actualPrice
  ticket.value.ticketProductList![index].discountType = DiscountType.VND
}

const handleChangeTicketProductUnitQuantity = (unitQuantity: number, index: number) => {
  ticket.value.ticketProductList![index].unitQuantity = unitQuantity
}

const handleChangeTicketProcedureDiscountMoney = (data: number, index: number) => {
  const discountMoney = data
  const expectedPrice = ticket.value.ticketProcedureList![index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  ticket.value.ticketProcedureList![index].discountMoney = discountMoney
  ticket.value.ticketProcedureList![index].discountPercent = discountPercent
  ticket.value.ticketProcedureList![index].actualPrice = actualPrice
  ticket.value.ticketProcedureList![index].discountType = DiscountType.VND
}

const handleChangeTicketProcedureDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = ticket.value.ticketProcedureList![index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  ticket.value.ticketProcedureList![index].discountPercent = discountPercent
  ticket.value.ticketProcedureList![index].discountMoney = discountMoney
  ticket.value.ticketProcedureList![index].actualPrice = actualPrice
  ticket.value.ticketProcedureList![index].discountType = DiscountType.Percent
}

const handleChangeTicketProcedureActualPrice = (data: number, index: number) => {
  const actualPrice = data
  const expectedPrice = ticket.value.ticketProcedureList![index].expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticket.value.ticketProcedureList![index].discountPercent = discountPercent
  ticket.value.ticketProcedureList![index].discountMoney = discountMoney
  ticket.value.ticketProcedureList![index].actualPrice = actualPrice
  ticket.value.ticketProcedureList![index].discountType = DiscountType.VND
}

const handleChangeTicketProcedureQuantity = (quantity: number, index: number) => {
  ticket.value.ticketProcedureList![index].quantity = quantity
}

const openModalProductDetail = (product?: Product) => {
  if (product) modalProductDetail.value?.openModal(product)
}

const openModalProcedureDetail = (procedure?: Procedure) => {
  if (procedure) modalProcedureDetail.value?.openModal(procedure)
}

const changeTicketProductPosition = (index: number, count: number) => {
  const temp = ticket.value.ticketProductList![index]
  ticket.value.ticketProductList![index] = ticket.value.ticketProductList![index + count]
  ticket.value.ticketProductList![index + count] = temp
}

const changeTicketProcedurePosition = (index: number, count: number) => {
  const temp = ticket.value.ticketProcedureList![index]
  ticket.value.ticketProcedureList![index] = ticket.value.ticketProcedureList![index + count]
  ticket.value.ticketProcedureList![index + count] = temp
}
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProcedureDetail ref="modalProcedureDetail" />
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
          <tr
            v-if="ticket.ticketProductList!.length == 0 && ticket.ticketProcedureList!.length == 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(ticketProcedure, index) in ticket.ticketProcedureList || []" :key="index">
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
                  @click="changeTicketProcedurePosition(index, -1)">
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
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
                  :disabled="index === (ticket.ticketProcedureList!.length || 0) - 1"
                  @click="changeTicketProcedurePosition(index, 1)">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td>
              <div class="font-medium text-justify">
                {{ ticketProcedure.procedure!.name }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="openModalProcedureDetail(ticketProcedure.procedure)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div class="flex gap-2" style="font-size: 0.8rem">
                <div v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.expectedPrice">
                  NY:
                  <span class="font-medium">
                    {{ formatMoney(ticketProcedure.expectedPrice) }}
                  </span>
                </div>
                <div v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount">
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
                        <b>
                          {{ formatMoney(ticketProcedure.expectedPrice) }}
                        </b>
                        )
                      </div>
                      <div class="mt-2">
                        <div>
                          <InputMoney
                            :value="ticketProcedure.discountMoney"
                            :append="'VNĐ'"
                            @update:value="
                              (e: number) => handleChangeTicketProcedureDiscountMoney(e, index)
                            " />
                        </div>
                        <div class="mt-2">
                          <InputNumber
                            :value="ticketProcedure.discountPercent"
                            append="%"
                            @update:value="
                              (e: number) => handleChangeTicketProcedureDiscountPercent(e, index)
                            " />
                        </div>
                      </div>
                    </template>
                    <VueTag v-if="ticketProcedure.discountType === 'VNĐ'" color="green">
                      {{ formatMoney(ticketProcedure.discountMoney) }}
                    </VueTag>
                    <VueTag v-if="ticketProcedure.discountType === '%'" color="green">
                      {{ ticketProcedure.discountPercent || 0 }}%
                    </VueTag>
                  </a-popconfirm>
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
                  @click="ticket.ticketItems![index].unitQuantity--"
                >
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </div>
                <div style="width: calc(100% - 60px)">
                  <InputNumber v-model:value="ticketItem.unitQuantity" textAlign="right" />
                </div>
                <div
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede]"
                  @click="ticket.ticketItems![index].unitQuantity++"
                >
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </div>
              </div> -->
              <div>
                <button
                  style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                  class="disabled:opacity-[30%] disabled:cursor-not-allowed"
                  @click="ticketProcedure.quantity++">
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
                </button>
                <div
                  style="font-size: 1.1rem"
                  contenteditable="true"
                  @input="
                    (e) =>
                      handleChangeTicketProcedureQuantity(
                        Number((e.target as HTMLElement)?.innerText) || 0,
                        index
                      )
                  ">
                  {{ ticketProcedure.quantity }}
                </div>
                <button
                  style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                  class="disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="ticketProcedure.quantity == 0"
                  @click="ticketProcedure.quantity--">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
            </td>
            <td class="text-center">
              <a class="text-red-500 text-xl" @click="ticket.ticketProcedureList!.splice(index, 1)">
                <IconDelete />
              </a>
            </td>
          </tr>
          <tr v-for="(ticketProduct, index) in ticket.ticketProductList || []" :key="index">
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
                  @click="changeTicketProductPosition(index, -1)">
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
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
                  :disabled="index === (ticket.ticketProductList!.length || 0) - 1"
                  @click="changeTicketProductPosition(index, 1)">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td>
              <div class="font-medium text-justify">
                {{ ticketProduct.product!.brandName }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="openModalProductDetail(ticketProduct.product!)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.substance"
                style="font-size: 0.8rem"
                class="text-justify">
                {{ ticketProduct.product!.substance }}
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.lotNumberAndExpiryDate"
                style="font-size: 0.8rem"
                class="flex gap-2">
                <div v-if="ticketProduct.lotNumber">S.Lô {{ ticketProduct.lotNumber }}</div>
                <div v-if="ticketProduct.expiryDate">
                  - HSD {{ timeToText(ticketProduct.expiryDate) }}
                </div>
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.hintUsage"
                style="font-size: 0.8rem"
                class="flex gap-2"
                contenteditable="true"
                placeholder="Hướng dẫn sử dụng ..."
                @input="(e) => handleChangeHintUsage((e.target as HTMLElement)?.innerText, index)">
                {{ ticketProduct.hintUsage }}
              </div>
              <div class="flex gap-2" style="font-size: 0.8rem">
                <div v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.expectedPrice">
                  NY:
                  <span class="font-medium">
                    {{ formatMoney(ticketProduct.unitExpectedPrice) }}
                  </span>
                  <span
                    v-if="
                      settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit &&
                      ticketProduct.unitName
                    ">
                    /{{ ticketProduct.unitName }}
                  </span>
                </div>
                <div v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount">
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
                        <b>
                          {{ formatMoney(ticketProduct.expectedPrice * ticketProduct.unitRate) }}
                        </b>
                        )
                      </div>
                      <div class="mt-2">
                        <div>
                          <InputMoney
                            :value="ticketProduct.unitDiscountMoney"
                            :append="'VNĐ'"
                            @update:value="
                              (e: number) => handleChangeTicketProductUnitDiscountMoney(e, index)
                            " />
                        </div>
                        <div class="mt-2">
                          <InputNumber
                            :value="ticketProduct.discountPercent"
                            append="%"
                            @update:value="
                              (e: number) => handleChangeTicketProductDiscountPercent(e, index)
                            " />
                        </div>
                      </div>
                    </template>
                    <VueTag v-if="ticketProduct.discountType === 'VNĐ'" color="green">
                      {{ formatMoney(ticketProduct.discountMoney * ticketProduct.unitRate) }}
                    </VueTag>
                    <VueTag v-if="ticketProduct.discountType === '%'" color="green">
                      {{ ticketProduct.discountPercent || 0 }}%
                    </VueTag>
                  </a-popconfirm>
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
                    ">
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
                  @click="ticket.ticketItems![index].unitQuantity--"
                >
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </div>
                <div style="width: calc(100% - 60px)">
                  <InputNumber v-model:value="ticketItem.unitQuantity" textAlign="right" />
                </div>
                <div
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede]"
                  @click="ticket.ticketItems![index].unitQuantity++"
                >
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </div>
              </div> -->
              <div>
                <button
                  style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                  class="disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="
                    !settingStore.SYSTEM_SETTING.allowNegativeQuantity &&
                    overQuantityTicketProduct(ticketProduct)
                  "
                  @click="
                    (e) =>
                      handleChangeTicketProductUnitQuantity(ticketProduct.unitQuantity + 1, index)
                  ">
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
                </button>
                <div
                  style="font-size: 1.1rem"
                  contenteditable="true"
                  @input="
                    (e) =>
                      handleChangeTicketProductUnitQuantity(
                        Number((e.target as HTMLElement)?.innerText) || 0,
                        index
                      )
                  ">
                  {{ ticketProduct.unitQuantity }}
                </div>
                <button
                  style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                  class="disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="ticketProduct.unitQuantity == 0"
                  @click="
                    (e) =>
                      handleChangeTicketProductUnitQuantity(ticketProduct.unitQuantity - 1, index)
                  ">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(ticketProduct.actualPrice * ticketProduct.quantity) }}
            </td>
            <td class="text-center">
              <a class="text-red-500 text-xl" @click="ticket.ticketProductList!.splice(index, 1)">
                <IconDelete />
              </a>
            </td>
          </tr>
          <tr>
            <td colspan="2" class="text-right">Tổng tiền:</td>
            <td colspan="2" class="text-right">
              {{ formatMoney(ticket.productMoney + ticket.procedureMoney) }}
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
          <tr
            v-if="ticket.ticketProductList!.length == 0 && ticket.ticketProcedureList!.length == 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticketProcedure, index) in ticket.ticketProcedureList" :key="index">
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
                  @click="changeTicketProcedurePosition(index, -1)">
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
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
                  :disabled="index === (ticket.ticketProcedureList!.length || 0) - 1"
                  @click="changeTicketProcedurePosition(index, 1)">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td :colspan="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit ? '2' : '1'">
              <div style="font-weight: 500">
                {{ ticketProcedure.procedure!.name }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="openModalProcedureDetail(ticketProcedure.procedure)">
                  <FileSearchOutlined />
                </a>
              </div>
            </td>
            <td style="width: 150px">
              <div class="flex items-center justify-between">
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="ticketProcedure.quantity === 0"
                  @click="ticketProcedure.quantity--">
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber v-model:value="ticketProcedure.quantity" textAlign="right" />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  @click="ticketProcedure.quantity++">
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </button>
              </div>
            </td>
            <td
              v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount"
              class="text-center"
              style="width: 40px">
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
                    <b>{{ formatMoney(ticketProcedure.expectedPrice) }}</b>
                    )
                  </div>
                  <div class="mt-2">
                    <div>
                      <InputMoney
                        :value="ticketProcedure.discountMoney"
                        append="VNĐ"
                        @update:value="
                          (e: number) => handleChangeTicketProcedureDiscountMoney(e, index)
                        " />
                    </div>
                    <div class="mt-2">
                      <div class="w-full">
                        <InputNumber
                          :value="ticketProcedure.discountPercent"
                          append="%"
                          @update:value="
                            (e: number) => handleChangeTicketProcedureDiscountPercent(e, index)
                          " />
                      </div>
                    </div>
                  </div>
                </template>
                <VueTag v-if="ticketProcedure.discountType === 'VNĐ'" color="green">
                  {{ formatMoney(ticketProcedure.discountMoney) }}
                </VueTag>
                <VueTag v-if="ticketProcedure.discountType === '%'" color="green">
                  {{ ticketProcedure.discountPercent || 0 }}%
                </VueTag>
              </a-popconfirm>
            </td>
            <td class="text-center">
              <div v-if="!settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.editActualPrice">
                <div v-if="ticketProcedure.discountMoney" class="text-xs italic text-red-500">
                  <del>{{ formatMoney(ticketProcedure.expectedPrice) }}</del>
                </div>
                <div>{{ formatMoney(ticketProcedure.actualPrice) }}</div>
              </div>
              <div v-else class="w-full">
                <InputMoney
                  text-align="right"
                  :value="ticketProcedure.actualPrice"
                  @update:value="(e: number) => handleChangeTicketProcedureActualPrice(e, index)" />
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
            </td>
            <td class="text-center" style="width: 20px">
              <a class="text-red-500 text-xl" @click="ticket.ticketProcedureList!.splice(index, 1)">
                <IconDelete />
              </a>
            </td>
          </tr>
          <tr v-for="(ticketProduct, index) in ticket.ticketProductList || []" :key="index">
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
                  @click="changeTicketProductPosition(index, -1)">
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
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
                  :disabled="index === (ticket.ticketProductList!.length || 0) - 1"
                  @click="changeTicketProductPosition(index, 1)">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td>
              <div style="font-weight: 500" class="text-justify">
                {{ ticketProduct.product!.brandName }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="openModalProductDetail(ticketProduct.product!)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.substance"
                class="text-justify"
                style="font-size: 0.8rem">
                {{ ticketProduct.product!.substance }}
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.lotNumberAndExpiryDate"
                style="font-size: 0.8rem"
                class="flex gap-2">
                <div v-if="ticketProduct.lotNumber">S.Lô {{ ticketProduct.lotNumber }}</div>
                <div v-if="ticketProduct.expiryDate">
                  - HSD {{ timeToText(ticketProduct.expiryDate) }}
                </div>
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.hintUsage"
                placeholder="Hướng dẫn sử dụng ..."
                contenteditable="true"
                style="font-size: 0.8rem"
                @input="(e) => handleChangeHintUsage((e.target as HTMLElement)?.innerText, index)">
                {{ ticketProduct.hintUsage }}
              </div>
            </td>
            <td
              v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit"
              class="text-center"
              style="width: 20px">
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
                  ">
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber
                    :value="ticketProduct.unitQuantity"
                    textAlign="right"
                    @update:value="(v) => handleChangeTicketProductUnitQuantity(v, index)" />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="
                    !settingStore.SYSTEM_SETTING.allowNegativeQuantity &&
                    overQuantityTicketProduct(ticketProduct)
                  "
                  @click="
                    (e) =>
                      handleChangeTicketProductUnitQuantity(ticketProduct.unitQuantity + 1, index)
                  ">
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </button>
              </div>
            </td>
            <td
              v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.discount"
              class="text-center"
              style="width: 40px">
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
                    <b>{{ formatMoney(ticketProduct.unitExpectedPrice) }}</b>
                    )
                  </div>
                  <div class="mt-2">
                    <div>
                      <InputMoney
                        :value="ticketProduct.unitDiscountMoney"
                        append="VNĐ"
                        @update:value="
                          (e: number) => handleChangeTicketProductUnitDiscountMoney(e, index)
                        " />
                    </div>
                    <div class="mt-2">
                      <div class="w-full">
                        <InputNumber
                          :value="ticketProduct.discountPercent"
                          append="%"
                          @update:value="
                            (e: number) => handleChangeTicketProductDiscountPercent(e, index)
                          " />
                      </div>
                    </div>
                  </div>
                </template>
                <VueTag v-if="ticketProduct.discountType === 'VNĐ'" color="green">
                  {{ formatMoney(ticketProduct.discountMoney * ticketProduct.unitRate) }}
                </VueTag>
                <VueTag v-if="ticketProduct.discountType === '%'" color="green">
                  {{ ticketProduct.discountPercent || 0 }}%
                </VueTag>
              </a-popconfirm>
            </td>

            <td class="text-center">
              <div v-if="!settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.editActualPrice">
                <div v-if="ticketProduct.discountMoney" class="text-xs italic text-red-500">
                  <del>{{ formatMoney(ticketProduct.unitExpectedPrice) }}</del>
                </div>
                <div>{{ formatMoney(ticketProduct.unitActualPrice) }}</div>
              </div>
              <div v-else class="w-full">
                <InputMoney
                  text-align="right"
                  :value="ticketProduct.unitActualPrice"
                  @update:value="
                    (e: number) => handleChangeTicketProductUnitActualPrice(e, index)
                  " />
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(ticketProduct.actualPrice * ticketProduct.quantity) }}
            </td>
            <td class="text-center" style="width: 20px">
              <a class="text-red-500 text-xl" @click="ticket.ticketProductList!.splice(index, 1)">
                <IconDelete />
              </a>
            </td>
          </tr>

          <tr>
            <td colspan="100" class="text-right">
              <span class="mr-10">Tổng tiền:</span>
              <span class="mr-20">
                {{ formatMoney(ticket.productMoney + ticket.procedureMoney) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
