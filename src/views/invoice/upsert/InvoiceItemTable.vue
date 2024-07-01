<script setup lang="ts">
import { DeleteOutlined, FileSearchOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import { IconDelete } from '../../../common/icon-google'
import { InputMoney, InputNumber } from '../../../common/vue-form'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DiscountType } from '../../../modules/enum'
import type { Procedure } from '../../../modules/procedure'
import type { Product } from '../../../modules/product'
import type { VisitProduct } from '../../../modules/visit-product'
import { timeToText } from '../../../utils'
import ModalProcedureDetail from '../../procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import { invoice, visit } from './invoice-upsert.ref'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const handleChangeHintUsage = (data: string, index: number) => {
  invoice.value.invoiceItems![index].hintUsage = data
}

const overQuantityVisitProduct = (visitProduct: VisitProduct): boolean => {
  if (visitProduct.product?.hasManageQuantity) {
    if (!visitProduct.product!.hasManageBatches) {
      return visitProduct.quantity >= visitProduct.product!.quantity
    } else {
      return visitProduct.quantity >= visitProduct.visitBatchList![0].batch!.quantity
    }
  }
  return false
}

const handleChangeVisitProductUnitDiscountMoney = (data: number, index: number) => {
  const discountMoney = data / visit.value.visitProductList![index].unitRate
  const expectedPrice = visit.value.visitProductList![index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  visit.value.visitProductList![index].discountMoney = discountMoney
  visit.value.visitProductList![index].discountPercent = discountPercent
  visit.value.visitProductList![index].actualPrice = actualPrice
  visit.value.visitProductList![index].discountType = DiscountType.VND
}

const handleChangeVisitProductDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = visit.value.visitProductList![index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  visit.value.visitProductList![index].discountPercent = discountPercent
  visit.value.visitProductList![index].discountMoney = discountMoney
  visit.value.visitProductList![index].actualPrice = actualPrice
  visit.value.visitProductList![index].discountType = DiscountType.Percent
}

const handleChangeVisitProductUnitActualPrice = (data: number, index: number) => {
  const actualPrice = data / visit.value.visitProductList![index].unitRate
  const expectedPrice = visit.value.visitProductList![index].expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  visit.value.visitProductList![index].discountPercent = discountPercent
  visit.value.visitProductList![index].discountMoney = discountMoney
  visit.value.visitProductList![index].actualPrice = actualPrice
  visit.value.visitProductList![index].discountType = DiscountType.VND
}

const handleChangeVisitProductQuantity = (quantity: number, index: number) => {
  visit.value.visitProductList![index].unitQuantity = quantity
}

const handleChangeVisitProcedureDiscountMoney = (data: number, index: number) => {
  const discountMoney = data
  const expectedPrice = visit.value.visitProcedureList![index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  visit.value.visitProcedureList![index].discountMoney = discountMoney
  visit.value.visitProcedureList![index].discountPercent = discountPercent
  visit.value.visitProcedureList![index].actualPrice = actualPrice
  visit.value.visitProcedureList![index].discountType = DiscountType.VND
}

const handleChangeVisitProcedureDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = visit.value.visitProcedureList![index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  visit.value.visitProcedureList![index].discountPercent = discountPercent
  visit.value.visitProcedureList![index].discountMoney = discountMoney
  visit.value.visitProcedureList![index].actualPrice = actualPrice
  visit.value.visitProcedureList![index].discountType = DiscountType.Percent
}

const handleChangeVisitProcedureActualPrice = (data: number, index: number) => {
  const actualPrice = data
  const expectedPrice = visit.value.visitProcedureList![index].expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  visit.value.visitProcedureList![index].discountPercent = discountPercent
  visit.value.visitProcedureList![index].discountMoney = discountMoney
  visit.value.visitProcedureList![index].actualPrice = actualPrice
  visit.value.visitProcedureList![index].discountType = DiscountType.VND
}

const handleChangeVisitProcedureQuantity = (quantity: number, index: number) => {
  visit.value.visitProcedureList![index].quantity = quantity
}

const openModalProductDetail = (product?: Product) => {
  if (product) modalProductDetail.value?.openModal(product.id)
}

const openModalProcedureDetail = (procedure?: Procedure) => {
  if (procedure) modalProcedureDetail.value?.openModal(procedure.id)
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
          <tr v-if="visit.visitProductList!.length == 0 && visit.visitProcedureList!.length == 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(visitProduct, index) in visit.visitProductList || []" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td>
              <div class="font-medium text-justify">
                {{ visitProduct.product!.brandName }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="openModalProductDetail(visitProduct.product!)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.substance"
                style="font-size: 0.8rem"
                class="text-justify">
                {{ visitProduct.product!.substance }}
              </div>
              <div
                v-if="
                  settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.batch &&
                  visitProduct.product?.hasManageBatches
                "
                style="font-size: 0.8rem"
                class="flex gap-2">
                S.Lô {{ visitProduct.visitBatchList![0].batch?.lotNumber }}
                {{ timeToText(visitProduct.visitBatchList![0].batch!.expiryDate) }}
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.hintUsage"
                style="font-size: 0.8rem"
                class="flex gap-2"
                contenteditable="true"
                placeholder="Hướng dẫn sử dụng ..."
                @input="(e) => handleChangeHintUsage((e.target as HTMLElement)?.innerText, index)">
                {{ visitProduct.hintUsage }}
              </div>
              <div class="flex gap-2" style="font-size: 0.8rem">
                <div v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.expectedPrice">
                  NY:
                  <span class="font-medium">
                    {{ formatMoney(visitProduct.unitExpectedPrice) }}
                  </span>
                  <span
                    v-if="
                      settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit &&
                      visitProduct.unitName
                    ">
                    /{{ visitProduct.unitName }}
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
                        <b>{{ formatMoney(visitProduct.expectedPrice * visitProduct.unitRate) }}</b>
                        )
                      </div>
                      <div class="mt-2">
                        <div>
                          <InputMoney
                            :value="visitProduct.unitDiscountMoney"
                            :append="'VNĐ'"
                            @update:value="
                              (e: number) => handleChangeVisitProductUnitDiscountMoney(e, index)
                            " />
                        </div>
                        <div class="mt-2">
                          <InputNumber
                            :value="visitProduct.discountPercent"
                            append="%"
                            @update:value="
                              (e: number) => handleChangeVisitProductDiscountPercent(e, index)
                            " />
                        </div>
                      </div>
                    </template>
                    <a-tag
                      v-if="visitProduct.discountType === 'VNĐ'"
                      color="success"
                      style="cursor: pointer; margin-top: -10px">
                      {{ formatMoney(visitProduct.unitDiscountMoney) }}
                    </a-tag>
                    <a-tag
                      v-if="visitProduct.discountType === '%'"
                      color="success"
                      style="cursor: pointer; margin-top: -10px">
                      {{ visitProduct.discountPercent || 0 }}%
                    </a-tag>
                  </a-popconfirm>
                </div>
                <div>
                  - ĐG:
                  <span class="font-medium">
                    {{ formatMoney(visitProduct.unitActualPrice) }}
                  </span>
                  <span
                    v-if="
                      settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit &&
                      visitProduct.unitName
                    ">
                    /{{ visitProduct.unitName }}
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
                    !settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.negativeQuantity &&
                    overQuantityVisitProduct(visitProduct)
                  "
                  @click="visitProduct.unitQuantity++">
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
                </button>
                <div
                  style="font-size: 1.1rem"
                  contenteditable="true"
                  @input="
                    (e) =>
                      handleChangeVisitProductQuantity(
                        Number((e.target as HTMLElement)?.innerText) || 0,
                        index
                      )
                  ">
                  {{ visitProduct.unitQuantity }}
                </div>
                <button
                  style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                  class="disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="visitProduct.unitQuantity == 0"
                  @click="visitProduct.unitQuantity--">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(visitProduct.actualPrice * visitProduct.quantity) }}
            </td>
            <td class="text-center">
              <a class="text-red-500 text-xl" @click="visit.visitProductList!.splice(index, 1)">
                <IconDelete />
              </a>
            </td>
          </tr>
          <tr v-for="(visitProcedure, index) in visit.visitProcedureList || []" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td>
              <div class="font-medium text-justify">
                {{ visitProcedure.procedure!.name }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="openModalProcedureDetail(visitProcedure.procedure)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div class="flex gap-2" style="font-size: 0.8rem">
                <div v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.expectedPrice">
                  NY:
                  <span class="font-medium">
                    {{ formatMoney(visitProcedure.expectedPrice) }}
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
                          {{ formatMoney(visitProcedure.expectedPrice) }}
                        </b>
                        )
                      </div>
                      <div class="mt-2">
                        <div>
                          <InputMoney
                            :value="visitProcedure.discountMoney"
                            :append="'VNĐ'"
                            @update:value="
                              (e: number) => handleChangeVisitProcedureDiscountMoney(e, index)
                            " />
                        </div>
                        <div class="mt-2">
                          <InputNumber
                            :value="visitProcedure.discountPercent"
                            append="%"
                            @update:value="
                              (e: number) => handleChangeVisitProcedureDiscountPercent(e, index)
                            " />
                        </div>
                      </div>
                    </template>
                    <a-tag
                      v-if="visitProcedure.discountType === 'VNĐ'"
                      color="success"
                      style="cursor: pointer; margin-top: -10px">
                      {{ formatMoney(visitProcedure.discountMoney) }}
                    </a-tag>
                    <a-tag
                      v-if="visitProcedure.discountType === '%'"
                      color="success"
                      style="cursor: pointer; margin-top: -10px">
                      {{ visitProcedure.discountPercent || 0 }}%
                    </a-tag>
                  </a-popconfirm>
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
                  @click="visitProcedure.quantity++">
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
                </button>
                <div
                  style="font-size: 1.1rem"
                  contenteditable="true"
                  @input="
                    (e) =>
                      handleChangeVisitProcedureQuantity(
                        Number((e.target as HTMLElement)?.innerText) || 0,
                        index
                      )
                  ">
                  {{ visitProcedure.quantity }}
                </div>
                <button
                  style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                  class="disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="visitProcedure.quantity == 0"
                  @click="visitProcedure.quantity--">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(visitProcedure.actualPrice * visitProcedure.quantity) }}
            </td>
            <td class="text-center">
              <a class="text-red-500 text-xl" @click="visit.visitProcedureList!.splice(index, 1)">
                <IconDelete />
              </a>
            </td>
          </tr>

          <tr>
            <td colspan="2" class="text-right">Tổng tiền:</td>
            <td colspan="2" class="text-right">
              {{ formatMoney(visit.productsMoney + visit.proceduresMoney) }}
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
          <tr v-if="visit.visitProductList!.length == 0 && visit.visitProcedureList!.length == 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(visitProduct, index) in visit.visitProductList || []" :key="index">
            <td class="text-center">
              {{ index + 1 }}
            </td>
            <td>
              <div style="font-weight: 500" class="text-justify">
                {{ visitProduct.product!.brandName }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="openModalProductDetail(visitProduct.product!)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.substance"
                class="text-justify"
                style="font-size: 0.8rem">
                {{ visitProduct.product!.substance }}
              </div>
              <div
                v-if="
                  settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.batch &&
                  visitProduct.product?.hasManageBatches
                "
                style="font-size: 0.8rem"
                class="flex gap-2">
                S.Lô {{ visitProduct.visitBatchList![0].batch?.lotNumber }}
                {{ timeToText(visitProduct.visitBatchList![0].batch!.expiryDate) }}
              </div>
              <div
                v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.hintUsage"
                placeholder="Hướng dẫn sử dụng ..."
                contenteditable="true"
                style="font-size: 0.8rem"
                @input="(e) => handleChangeHintUsage((e.target as HTMLElement)?.innerText, index)">
                {{ visitProduct.hintUsage }}
              </div>
            </td>
            <td
              v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit"
              class="text-center"
              style="width: 20px">
              {{ visitProduct.unitName }}
            </td>
            <td style="width: 150px">
              <div class="flex items-center justify-between">
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="visitProduct.quantity === 0"
                  @click="visitProduct.unitQuantity--">
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber v-model:value="visitProduct.unitQuantity" textAlign="right" />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="
                    !settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.negativeQuantity &&
                    overQuantityVisitProduct(visitProduct)
                  "
                  @click="visitProduct.unitQuantity++">
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
                    <b>{{ formatMoney(visitProduct.unitExpectedPrice) }}</b>
                    )
                  </div>
                  <div class="mt-2">
                    <div>
                      <InputMoney
                        :value="visitProduct.unitDiscountMoney"
                        append="VNĐ"
                        @update:value="
                          (e: number) => handleChangeVisitProductUnitDiscountMoney(e, index)
                        " />
                    </div>
                    <div class="mt-2">
                      <div class="w-full">
                        <InputNumber
                          :value="visitProduct.discountPercent"
                          append="%"
                          @update:value="
                            (e: number) => handleChangeVisitProductDiscountPercent(e, index)
                          " />
                      </div>
                    </div>
                  </div>
                </template>
                <a-tag
                  v-if="visitProduct.discountType === 'VNĐ'"
                  color="success"
                  style="cursor: pointer">
                  {{ formatMoney(visitProduct.unitDiscountMoney) }}
                </a-tag>
                <a-tag
                  v-if="visitProduct.discountType === '%'"
                  color="success"
                  style="cursor: pointer">
                  {{ visitProduct.discountPercent || 0 }}%
                </a-tag>
              </a-popconfirm>
            </td>

            <td class="text-center">
              <div v-if="!settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.editActualPrice">
                <div v-if="visitProduct.discountMoney" class="text-xs italic text-red-500">
                  <del>{{ formatMoney(visitProduct.unitExpectedPrice) }}</del>
                </div>
                <div>{{ formatMoney(visitProduct.unitActualPrice) }}</div>
              </div>
              <div v-else class="w-full">
                <InputMoney
                  text-align="right"
                  :value="visitProduct.unitActualPrice"
                  @update:value="
                    (e: number) => handleChangeVisitProductUnitActualPrice(e, index)
                  " />
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(visitProduct.actualPrice * visitProduct.quantity) }}
            </td>
            <td class="text-center" style="width: 20px">
              <a class="text-red-500 text-xl" @click="visit.visitProductList!.splice(index, 1)">
                <IconDelete />
              </a>
            </td>
          </tr>
          <tr v-for="(visitProcedure, index) in visit.visitProcedureList" :key="index">
            <td class="text-center">{{ index + 1 }}</td>
            <td :colspan="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.unit ? '2' : '1'">
              <div style="font-weight: 500">
                {{ visitProcedure.procedure!.name }}
                <a
                  v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.detail"
                  class="ml-1"
                  @click="openModalProcedureDetail(visitProcedure.procedure)">
                  <FileSearchOutlined />
                </a>
              </div>
            </td>
            <td style="width: 150px">
              <div class="flex items-center justify-between">
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="visitProcedure.quantity === 0"
                  @click="visitProcedure.quantity--">
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber v-model:value="visitProcedure.quantity" textAlign="right" />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  @click="visitProcedure.quantity++">
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
                    <b>{{ formatMoney(visitProcedure.expectedPrice) }}</b>
                    )
                  </div>
                  <div class="mt-2">
                    <div>
                      <InputMoney
                        :value="visitProcedure.discountMoney"
                        append="VNĐ"
                        @update:value="
                          (e: number) => handleChangeVisitProcedureDiscountMoney(e, index)
                        " />
                    </div>
                    <div class="mt-2">
                      <div class="w-full">
                        <InputNumber
                          :value="visitProcedure.discountPercent"
                          append="%"
                          @update:value="
                            (e: number) => handleChangeVisitProcedureDiscountPercent(e, index)
                          " />
                      </div>
                    </div>
                  </div>
                </template>
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
              </a-popconfirm>
            </td>
            <td class="text-center">
              <div v-if="!settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.editActualPrice">
                <div v-if="visitProcedure.discountMoney" class="text-xs italic text-red-500">
                  <del>{{ formatMoney(visitProcedure.expectedPrice) }}</del>
                </div>
                <div>{{ formatMoney(visitProcedure.actualPrice) }}</div>
              </div>
              <div v-else class="w-full">
                <InputMoney
                  text-align="right"
                  :value="visitProcedure.actualPrice"
                  @update:value="(e: number) => handleChangeVisitProcedureActualPrice(e, index)" />
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(visitProcedure.actualPrice * visitProcedure.quantity) }}
            </td>
            <td class="text-center" style="width: 20px">
              <a class="text-red-500 text-xl" @click="visit.visitProcedureList!.splice(index, 1)">
                <IconDelete />
              </a>
            </td>
          </tr>
          <tr>
            <td colspan="100" class="text-right">
              <span class="mr-10">Tổng tiền:</span>
              <span class="mr-20">
                {{ formatMoney(visit.productsMoney + visit.proceduresMoney) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
