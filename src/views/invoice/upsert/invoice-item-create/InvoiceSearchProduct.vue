<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputOptions, VueSelect } from '../../../../common/vue-form'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useScreenStore } from '../../../../modules/_me/screen.store'
import { Batch, useBatchStore } from '../../../../modules/batch'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Product, useProductStore } from '../../../../modules/product'
import { timeToText } from '../../../../utils'
import ModalProductUpsert from '../../../product/upsert/ModalProductUpsert.vue'
import { InvoiceItem } from '../../../../modules/invoice-item/invoice-item.model'
import { invoiceItem } from './invoice-item.ref'
import { InvoiceItemType } from '../../../../modules/invoice-item/invoice-item.model'
import { DiscountType } from '../../../../modules/enum'

const inputOptionsProduct = ref<InstanceType<typeof InputOptions>>()
const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()

const props = withDefaults(defineProps<{ tabsKey: 'product' | 'procedure' }>(), {
  tabsKey: 'product',
})

const emit = defineEmits<{
  (e: 'createInvoiceItemProduct'): void
}>()

const screenStore = useScreenStore()
const { formatMoney } = screenStore
const productStore = useProductStore()
const batchStore = useBatchStore()
const meStore = useMeStore()
const { permissionIdMap } = meStore

const product = ref(Product.blank())
const productList = ref<Product[]>([])
const batch = ref(Batch.blank())
const batchList = ref<Batch[]>([])

onMounted(async () => {
  try {
    await productStore.refreshDB()
    await batchStore.refreshDB()
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
  if (instance) {
    product.value = instance
    if (instance.hasManageBatches) {
      const batchListResponse = await batchStore.list({
        filter: {
          productId: instance.id,
          quantity: { GT: 0 },
        },
      })
      batchListResponse.forEach((i) => (i.product = instance))
      batchList.value = batchListResponse

      batch.value = batchListResponse[0]
      createInvoiceItemBatch(batchListResponse[0])
    } else {
      batchList.value = []
      createInvoiceItemProduct(instance)
      emit('createInvoiceItemProduct')
    }
  } else {
    batchList.value = []
    product.value = Product.blank()
    createInvoiceItemProduct()
    emit('createInvoiceItemProduct')
  }
}

const selectBatch = (instance: Batch) => {
  batch.value = instance
  createInvoiceItemBatch(instance)
  emit('createInvoiceItemProduct')
}

const createInvoiceItemProduct = (instance?: Product) => {
  const ii = InvoiceItem.blank()
  if (instance) {
    ii.batchId = 0
    ii.productId = instance.id
    ii.procedureId = 0
    ii.product = instance

    if (instance.hasManageQuantity) {
      ii.type = InvoiceItemType.ProductHasManageQuantity
    } else {
      ii.type = InvoiceItemType.ProductNoManageQuantity
    }

    ii.unitRate = instance.unitDefaultRate
    ii.expectedPrice = instance.retailPrice
    ii.actualPrice = instance.retailPrice
    ii.quantity = 0
    ii.hintUsage = instance?.hintUsage || ''
  }
  invoiceItem.value = ii
}

const createInvoiceItemBatch = (instance?: Batch) => {
  const ii = InvoiceItem.blank()
  if (instance) {
    ii.batchId = instance.id
    ii.productId = instance.productId
    ii.procedureId = 0

    ii.type = InvoiceItemType.Batch
    ii.batch = instance
    ii.product = instance.product

    ii.unitRate = instance.product!.unitDefaultRate
    ii.expectedPrice = instance.product!.retailPrice
    ii.actualPrice = instance.product!.retailPrice
    ii.discountMoney = 0
    ii.discountPercent = 0
    ii.discountType = DiscountType.Percent
    ii.quantity = 0
    ii.hintUsage = instance.product?.hintUsage || ''
  }
  invoiceItem.value = ii
}

const focus = () => {
  productList.value = []
  product.value = Product.blank()
  batch.value = Batch.blank()

  inputOptionsProduct.value?.focus()
}

const clear = () => {
  product.value = Product.blank()
  productList.value = []
  batch.value = Batch.blank()
  batchList.value = []

  inputOptionsProduct.value?.clear()
}

const clearAndFocus = () => {
  product.value = Product.blank()
  productList.value = []
  batch.value = Batch.blank()
  batchList.value = []

  inputOptionsProduct.value?.clear()
  inputOptionsProduct.value?.focus()
}

defineExpose({ focus, clear, clearAndFocus })
</script>

<template>
  <ModalProductUpsert ref="modalProductUpsert" @success="createProduct" />
  <div class="w-full">
    <div class="flex justify-between">
      <span>Tên sản phẩm</span>
      <span>
        <a
          v-if="permissionIdMap[PermissionId.PRODUCT_CREATE]"
          @click="modalProductUpsert?.openModalFromInvoice()"
        >
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
        :required="tabsKey === 'product'"
        @selectItem="({ data }) => selectProduct(data)"
        @update:text="searchingProduct"
      >
        <template #option="{ item: { data } }">
          <div>
            <b>{{ data.brandName }}</b>
            <span v-if="data.hasManageQuantity">
              - Tồn
              <span style="font-weight: 700" :class="data.unitQuantity <= 0 ? 'text-red-500' : ''">
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
  <div v-if="product.hasManageBatches" style="flex-grow: 1; flex-basis: 400px">
    <div>
      Lô hàng
      <span
        v-if="batch?.expiryDate && batch?.expiryDate < Date.now()"
        class="text-red-500 font-bold"
      >
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
        @selectItem="({ data }) => selectBatch(data)"
      >
        <template #option="{ item: { data } }">
          <div v-if="!data.id">Chưa chọn lô</div>
          <div v-if="data.id">
            Lô {{ data.lotNumber }} {{ timeToText(data.expiryDate, 'DD/MM/YYYY') }} - Tồn
            <b> {{ data.unitQuantity }}</b> {{ product.unitDefaultName }} - G.Nhập
            <b> {{ formatMoney(data.unitCostPrice) }}</b>
          </div>
        </template>
        <template #text="{ content: { data } }">
          <div v-if="!data?.id">Chưa chọn lô</div>
          <div v-if="data?.id">
            Lô {{ data.lotNumber }} {{ timeToText(data.expiryDate, 'DD/MM/YYYY') }} - Tồn
            <b> {{ data.unitQuantity }}</b> {{ product.unitDefaultName }} - G.Nhập
            <b> {{ formatMoney(data.unitCostPrice) }}</b>
          </div>
        </template>
      </VueSelect>
    </div>
  </div>
</template>

<style lang="scss"></style>
