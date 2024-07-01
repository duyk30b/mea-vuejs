<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import {
  InputHint,
  InputMoney,
  InputNumber,
  InputOptions,
  VueSelect,
} from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Batch, useBatchStore } from '../../../modules/batch'
import { DiscountType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product, useProductStore } from '../../../modules/product'
import { VisitBatch } from '../../../modules/visit-batch'
import { VisitProduct } from '../../../modules/visit-product'
import { customFilter, timeToText } from '../../../utils'
import ModalProductUpsert from '../../product/upsert/ModalProductUpsert.vue'
import { visit } from './invoice-upsert.ref'

const inputOptionsProduct = ref<InstanceType<typeof InputOptions>>()
const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const productStore = useProductStore()
const batchStore = useBatchStore()
const meStore = useMeStore()
const { permissionIdMap } = meStore

const product = ref(Product.blank())
const productList = ref<Product[]>([])
const batch = ref(Batch.blank())
const batchList = ref<Batch[]>([])

const visitProduct = ref<VisitProduct>(VisitProduct.blank())
const productOutSellType = ref<'retailPrice' | 'wholesalePrice' | 'costPrice' | 'costPriceAverage'>(
  'retailPrice'
)

onMounted(async () => {
  try {
    await Promise.all([productStore.refreshDB(), batchStore.refreshDB()])
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const searchingProduct = async (text: string) => {
  productList.value = await productStore.search(text)
}

const createProduct = (instance?: Product) => {
  inputOptionsProduct.value?.setItem({
    text: instance?.brandName,
    data: instance,
    value: instance?.id,
  })
  selectProduct(instance)
}

const selectProduct = async (instance?: Product) => {
  if (!instance) return clear()

  product.value = instance
  createVisitProduct(instance)
  if (instance.hasManageBatches) {
    const batchListResponse = await batchStore.list({
      filter: {
        productId: instance.id,
        quantity: { GT: 0 },
      },
    })
    batchListResponse.forEach((i) => (i.product = instance))
    batchList.value = batchListResponse

    if (batchListResponse.length) {
      batch.value = batchListResponse[0]
      createVisitBatch(batchListResponse[0])
    }
  } else {
    batchList.value = []
  }
}

const selectBatch = (instance: Batch) => {
  batch.value = instance
  createVisitBatch(instance)
}

const createVisitProduct = (instance?: Product) => {
  const vp = VisitProduct.blank()
  if (instance) {
    vp.productId = instance.id
    vp.isSent = 0
    vp.unitRate = instance.unitDefaultRate
    vp.quantity = 0
    vp.quantityPrescription = 0
    vp.costAmount = instance.costAmount
    vp.expectedPrice = instance.retailPrice
    vp.discountType = DiscountType.Percent
    vp.discountPercent = 0
    vp.discountMoney = 0
    vp.actualPrice = instance.retailPrice
    vp.hintUsage = instance?.hintUsage || ''

    vp.product = Product.from(instance)
    vp.visitBatchList = []
  }
  visitProduct.value = vp
}

const createVisitBatch = (instance?: Batch) => {
  if (!instance) return

  const vb = VisitBatch.blank()
  vb.productId = instance.productId
  vb.batchId = instance.id
  vb.visitProductId = 0 // chỗ này để back-end xử lý
  vb.quantity = 0

  vb.batch = Batch.from(instance)
  visitProduct.value.visitBatchList![0] = vb
}

const handleChangeInvoiceProductSellType = (
  type: 'retailPrice' | 'wholesalePrice' | 'costPrice' | 'costPriceAverage'
) => {
  let expectedPrice = visitProduct.value.product?.[type] || 0
  if (visitProduct.value.discountType === '%') {
    const discountPercent = visitProduct.value.discountPercent || 0
    const discountMoney = Math.round((expectedPrice * discountPercent) / 100)
    visitProduct.value.discountMoney = discountMoney
    visitProduct.value.actualPrice = expectedPrice - discountMoney
  }
  if (visitProduct.value.discountType === 'VNĐ') {
    const discountMoney = visitProduct.value.discountMoney || 0
    const discountPercent =
      expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
    visitProduct.value.discountPercent = discountPercent
    visitProduct.value.actualPrice = expectedPrice - discountMoney
  }
  visitProduct.value.expectedPrice = expectedPrice
}

const handleChangeUnitDiscountMoney = (data: number) => {
  const discountMoney = data / visitProduct.value.unitRate
  const expectedPrice = visitProduct.value.expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  visitProduct.value.discountPercent = discountPercent
  visitProduct.value.discountMoney = discountMoney
  visitProduct.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeDiscountPercent = (data: number) => {
  const expectedPrice = visitProduct.value.expectedPrice || 0
  const discountMoney = Math.round((expectedPrice * (data || 0)) / 100)
  visitProduct.value.discountPercent = data
  visitProduct.value.discountMoney = discountMoney
  visitProduct.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeUnitActualPrice = (data: number) => {
  const actualPrice = data / visitProduct.value.unitRate
  const expectedPrice = visitProduct.value.expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  visitProduct.value.discountPercent = discountPercent
  visitProduct.value.discountMoney = discountMoney
  visitProduct.value.discountType = DiscountType.VND
  visitProduct.value.actualPrice = actualPrice
}

const clear = () => {
  product.value = Product.blank()
  productList.value = []
  batch.value = Batch.blank()
  batchList.value = []
  visitProduct.value = VisitProduct.blank()

  productOutSellType.value = 'retailPrice'
  inputOptionsProduct.value?.clear()
}

const addVisitProduct = () => {
  const { product, quantity, visitBatchList } = visitProduct.value
  const batch = visitBatchList?.[0]?.batch
  if (!visitProduct.value.productId) {
    AlertStore.addError('Lỗi: Chưa chọn sản phẩm')
    return inputOptionsProduct.value?.focus()
  }
  if (visitProduct.value.quantity <= 0) {
    return AlertStore.addError('Lỗi: Số lượng không hợp lệ')
  }
  if (visitProduct.value.product?.hasManageQuantity) {
    if (visitProduct.value.product.hasManageBatches) {
      if (visitProduct.value.visitBatchList?.length == 0) {
        return AlertStore.addError('Lỗi: Không có lô hàng phù hợp')
      }
      if (!settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.negativeQuantity) {
        if (quantity > batch!.quantity) {
          return AlertStore.addError(
            `Lỗi: Số lượng tồn kho không đủ, tồn ${batch!.quantity} lấy ${quantity}`
          )
        }
      }
    }

    if (!visitProduct.value.product.hasManageBatches) {
      if (!settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.negativeQuantity) {
        if (quantity > product!.quantity) {
          return AlertStore.addError(
            `Lỗi: Số lượng tồn kho không đủ, tồn ${product!.quantity} lấy ${quantity}`
          )
        }
      }
    }
  }
  visit.value.visitProductList?.push(visitProduct.value)
  clear()
  if (!isMobile) {
    inputOptionsProduct.value?.focus()
  }
}

const focus = () => {
  inputOptionsProduct.value?.focus()
}
defineExpose({ focus })
</script>

<template>
  <ModalProductUpsert ref="modalProductUpsert" @success="createProduct" />
  <form class="mt-4 flex flex-wrap gap-4" @submit.prevent="(e) => addVisitProduct()">
    <div style="flex-grow: 1; flex-basis: 80%">
      <div class="flex justify-between">
        <span>Tên sản phẩm</span>
        <span>
          <a
            v-if="permissionIdMap[PermissionId.PRODUCT_CREATE]"
            @click="modalProductUpsert?.openModalFromInvoice()">
            Thêm sản phẩm mới
          </a>
        </span>
      </div>
      <div style="height: 40px">
        <InputOptions
          ref="inputOptionsProduct"
          :options="productList.map((i) => ({ value: i.id, text: i.brandName, data: i }))"
          :maxHeight="320"
          placeholder="(F3) Tìm kiếm sản phẩm và lô hàng bằng tên hoặc hoạt chất của sản phẩm"
          @selectItem="({ data }) => selectProduct(data)"
          @update:text="searchingProduct">
          <template #option="{ item: { data } }">
            <div>
              <b>{{ data.brandName }}</b>
              <span v-if="data.hasManageQuantity">
                - Tồn
                <span
                  style="font-weight: 700"
                  :class="data.unitQuantity <= 0 ? 'text-red-500' : ''">
                  {{ data.unitQuantity }}
                </span>
                {{ data.unitDefaultName }}
              </span>
              - Giá {{ formatMoney(data.unitRetailPrice) }}
            </div>
            <div>{{ data.substance }}</div>
          </template>
        </InputOptions>
      </div>
    </div>

    <div v-if="product.hasManageBatches" style="flex-grow: 1; flex-basis: 80%">
      <div>
        Lô hàng
        <span
          v-if="batch?.expiryDate && batch?.expiryDate < Date.now()"
          class="text-red-500 font-bold">
          (Hết hạn sử dụng)
        </span>
        <span v-if="product.id && !batchList.length" class="text-red-500 font-bold">
          (Không còn tồn kho)
        </span>
      </div>
      <div>
        <VueSelect
          :value="batch.id"
          :options="batchList.map((i: Batch) => ({ value: i.id, data: i }))"
          :disabled="batchList.length == 0"
          @selectItem="({ data }) => selectBatch(data)">
          <template #option="{ item: { data } }">
            <div v-if="!data.id">Chưa chọn lô</div>
            <div v-if="data.id">
              Lô {{ data.lotNumber }} {{ timeToText(data.expiryDate, 'DD/MM/YYYY') }} - Tồn
              <b>{{ data.unitQuantity }}</b>
              {{ product.unitDefaultName }} - G.Nhập
              <b>{{ formatMoney(data.unitCostPrice) }}</b>
            </div>
          </template>
          <template #text="{ content: { data } }">
            <div v-if="!data?.id">Chưa chọn lô</div>
            <div v-if="data?.id">
              Lô {{ data.lotNumber }} {{ timeToText(data.expiryDate, 'DD/MM/YYYY') }} - Tồn
              <b>{{ data.unitQuantity }}</b>
              {{ product.unitDefaultName }} - G.Nhập
              <b>{{ formatMoney(data.unitCostPrice) }}</b>
            </div>
          </template>
        </VueSelect>
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.hintUsage"
      style="flex-grow: 1; flex-basis: 80%">
      <div>Hướng dẫn sử dụng</div>
      <div>
        <InputHint
          v-model:value="visitProduct.hintUsage"
          :options="[
            ...(visitProduct.product?.hintUsage ? [visitProduct.product?.hintUsage] : []),
            ...settingStore.PRODUCT_HINT_USAGE,
          ]"
          :logic-filter="(item: string, text: string) => customFilter(item, text)" />
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.expectedPrice"
      class="grow basis-[90%] lg:basis-[45%]">
      <div>
        Giá niêm yết
        <span v-if="visitProduct.unitRate !== 1">
          (
          <b>{{ formatMoney(visitProduct.expectedPrice) }} /</b>
          {{ visitProduct?.product?.unitBasicName }})
        </span>
      </div>
      <div class="flex">
        <div style="width: 120px">
          <VueSelect
            v-model:value="productOutSellType"
            :options="[
              ...(permissionIdMap[PermissionId.READ_COST_PRICE] &&
              settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.costPrice
                ? [{ value: 'costPrice', text: 'Giá nhập' }]
                : []),
              ...(permissionIdMap[PermissionId.READ_COST_PRICE] &&
              settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.costPriceAverage
                ? [{ value: 'costPriceAverage', text: 'Giá vốn TB' }]
                : []),
              ...(settingStore.SYSTEM_SETTING.wholesalePrice
                ? [{ value: 'wholesalePrice', text: 'Giá bán sỉ' }]
                : []),
              ...(settingStore.SYSTEM_SETTING.retailPrice
                ? [{ value: 'retailPrice', text: 'Giá bán lẻ' }]
                : []),
            ]"
            @selectItem="({ value }) => handleChangeInvoiceProductSellType(value)"></VueSelect>
        </div>
        <div class="flex-1">
          <InputMoney :value="visitProduct.unitExpectedPrice" disabled />
        </div>
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.quantity"
      class="grow basis-[90%] lg:basis-[45%]">
      <div class="flex flex-wrap gap-2">
        Số lượng
        <template v-if="visitProduct.product?.hasManageQuantity">
          <span
            v-if="!visitProduct.product?.hasManageBatches"
            :class="
              visitProduct.quantity > (visitProduct.product?.quantity || 0)
                ? 'text-red-500 font-bold'
                : ''
            ">
            (tồn:
            <b>{{ (visitProduct.product?.quantity || 0) / visitProduct.unitRate }}</b>
            )
          </span>
          <span
            v-if="visitProduct.product?.hasManageBatches"
            :class="
              visitProduct.quantity > (visitProduct.visitBatchList![0]?.batch?.quantity || 0)
                ? 'text-red-500 font-bold'
                : ''
            ">
            (tồn:
            <b>
              {{ (visitProduct.visitBatchList![0]?.batch?.quantity || 0) / visitProduct.unitRate }}
            </b>
            )
          </span>
          <span v-if="visitProduct.unitRate !== 1" style="margin-left: auto">
            <b>{{ visitProduct.quantity }}</b>
            {{ visitProduct?.product?.unitBasicName }}
          </span>
        </template>
      </div>
      <div class="flex">
        <div style="width: 120px">
          <VueSelect
            v-model:value="visitProduct.unitRate"
            :disabled="(visitProduct.product?.unitObject.length || 0) <= 1"
            :options="
              visitProduct.product?.unitObject.map((i) => ({
                value: i.rate,
                text: i.name,
                data: i,
              }))
            "
            required />
        </div>
        <div class="flex-1">
          <InputNumber v-model:value="visitProduct.unitQuantity" :validate="{ gt: 0 }" />
        </div>
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.discount"
      class="grow basis-[90%] lg:basis-[45%]">
      <div>
        Chiết khấu
        <span
          v-if="
            (visitProduct.discountType === DiscountType.Percent &&
              visitProduct.discountPercent !== 0) ||
            visitProduct.unitRate > 1
          ">
          (
          <b>{{ formatMoney(visitProduct.discountMoney) }}</b>
          {{ visitProduct.productId ? ' / ' + visitProduct?.product?.unitBasicName : '' }}
          )
        </span>
      </div>
      <div class="flex">
        <VueSelect
          v-model:value="visitProduct.discountType"
          style="width: 120px"
          :options="[
            { value: DiscountType.Percent, text: '%' },
            { value: DiscountType.VND, text: 'VNĐ' },
          ]" />
        <div style="width: calc(100% - 120px)">
          <InputMoney
            v-if="visitProduct.discountType === DiscountType.VND"
            :value="visitProduct.unitDiscountMoney"
            @update:value="handleChangeUnitDiscountMoney" />
          <InputNumber
            v-else
            :value="visitProduct.discountPercent"
            @update:value="handleChangeDiscountPercent" />
        </div>
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.actualPrice"
      class="grow basis-[90%] lg:basis-[45%]">
      <div>
        Đơn giá
        <span v-if="visitProduct.unitRate !== 1">
          (
          <b>{{ formatMoney(visitProduct.actualPrice) }} /</b>
          {{ visitProduct.product?.unitBasicName }})
        </span>
      </div>
      <div style="width: 100%">
        <InputMoney
          :value="visitProduct.unitActualPrice"
          :prepend="visitProduct.unitRate !== 1 ? visitProduct.unitName : ''"
          @update:value="handleChangeUnitActualPrice" />
      </div>
    </div>

    <div class="grow basis-[90%] flex justify-center">
      <VueButton color="blue" type="submit" icon="plus">Thêm vào đơn</VueButton>
    </div>
  </form>
</template>

<style lang="scss"></style>
