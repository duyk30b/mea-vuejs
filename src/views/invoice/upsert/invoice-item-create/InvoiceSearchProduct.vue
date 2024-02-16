<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { InputOptions, VueSelect } from '../../../../common/vue-form'
import { Product, useProductStore } from '../../../../modules/product'
import { ProductBatch, useProductBatchStore } from '../../../../modules/product-batch'
import { useScreenStore } from '../../../../modules/_me/screen.store'
import { timeToText } from '../../../../utils'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'

const emit = defineEmits<{ (e: 'selectProductBatch', value: ProductBatch): void }>()

const inputSearchProduct = ref<InstanceType<typeof InputOptions>>()

const screenStore = useScreenStore()
const { formatMoney } = screenStore
const productStore = useProductStore()
const productBatchStore = useProductBatchStore()

const searchText = ref('')
const productList = ref<Product[]>([])
const product = ref(Product.blank())
const productBatch = ref(ProductBatch.blank())

onMounted(async () => {
  try {
    await productStore.refreshDB()
    await productBatchStore.refreshDB()
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const searchingProduct = async (text: string) => {
  productList.value = await productStore.search(text)
}

const selectProduct = async (instance?: Product) => {
  if (instance) {
    const p = Product.fromInstance(instance)
    p.productBatches = await productBatchStore.list({
      filter: {
        productId: p.id,
        isActive: 1,
        quantity: screenStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.searchHasZeroQuantity
          ? undefined
          : { NOT: 0 },
      },
    })
    p.productBatches.forEach((b) => (b.product = p))

    searchText.value = p.brandName
    product.value = p
    if (screenStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.customAfterSearch) {
      if (p.productBatches.length) {
        selectProductBatch(p.productBatches[0].id)
      }
    }
  } else {
    product.value = Product.blank()
    searchText.value = ''
  }
}

const selectProductBatch = (id: number) => {
  const batch = product.value.productBatches.find((i) => i.id === id)
  if (batch) {
    productBatch.value = batch
    const batchEmit = ProductBatch.clone(batch)
    emit('selectProductBatch', batchEmit)
  } else {
    productBatch.value = ProductBatch.blank()
    // emit('selectProductBatch', ProductBatch.blank())
  }
}

const focus = () => {
  clear()
  inputSearchProduct.value?.focus()
}

const clear = () => {
  searchText.value = ''
  productList.value = []
  product.value = Product.blank()
  productBatch.value = ProductBatch.blank()
}

defineExpose({ focus, clear })
</script>

<template>
  <div class="w-full">
    <div>Tên hàng hóa</div>
    <div style="height: 40px">
      <InputOptions
        ref="inputSearchProduct"
        v-model:searchText="searchText"
        :options="productList"
        :maxHeight="320"
        placeholder="(F3) Tìm kiếm bằng tên hoặc hoạt chất của sản phẩm"
        @selectItem="selectProduct"
        @update:searchText="searchingProduct"
      >
        <template #each="{ item: { brandName, substance, unitName, unitQuantity } }">
          <div>
            <b>{{ brandName }}</b> - <b>{{ unitQuantity }}</b> {{ unitName }}
          </div>
          <div>{{ substance }}</div>
        </template>
      </InputOptions>
    </div>
  </div>
  <div style="flex-grow: 1; flex-basis: 400px">
    <div>
      Lô hàng
      <span
        v-if="productBatch?.expiryDate && productBatch?.expiryDate < Date.now()"
        class="text-red-500 font-bold"
      >
        (Hết hạn sử dụng)
      </span>
    </div>
    <div>
      <VueSelect
        :value="productBatch.id"
        :options="
          product.productBatches.map((i: ProductBatch) => ({
            value: i.id,
            text:
              `${i.batch} - ${timeToText(i.expiryDate, 'DD/MM/YYYY')} ` +
              `- SL: ${i.unitQuantity} ${i.product?.unitName} ` +
              `- Giá ${formatMoney(i.unitRetailPrice)}`,
          }))
        "
        :disabled="product.productBatches.length == 0"
        @update:value="selectProductBatch"
      />
    </div>
  </div>
</template>

<style lang="scss"></style>