<script setup lang="ts">
import { InputOptions, VueSelect } from '@/common/vue-form'
import { Product, ProductBatch, useProductStore } from '@/modules/product'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{ (e: 'selectProductBatch', value: ProductBatch): void }>()

const inputSearchProduct = ref<InstanceType<typeof InputOptions>>()

const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore
const productStore = useProductStore()

const searchText = ref('')
const productList = ref<Product[]>([])
const product = ref(Product.blank())
const productBatch = ref(ProductBatch.blank())

onMounted(async () => {
  await productStore.fetchAll({
    relation: { productBatches: true },
    filter: { productBatch: { isActive: 1, quantity: ['!=', 0] } },
  })
})

const searchingProduct = async (text: string) => {
  if (text) {
    productList.value = productStore.search(text)
  } else {
    productList.value = []
  }
}

const selectProduct = async (data?: Product) => {
  if (data) {
    searchText.value = data.brandName
    product.value = data
    if (organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.customAfterSearch) {
      selectProductBatch(data.productBatches[0].id)
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
