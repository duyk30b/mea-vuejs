<script setup lang="ts">
import { InputOptions } from '@/common/vue-form'
import { Product, ProductBatch, useProductStore } from '@/modules/product'
import { useOrganizationStore } from '@/store/organization.store'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{ (e: 'selectProductBatch', value: ProductBatch): void }>()

const inputSearchProductBatch = ref<InstanceType<typeof InputOptions>>()

const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore
const productStore = useProductStore()

const searchText = ref('')
const productBatchList = ref<ProductBatch[]>([])
const productBatch = ref<ProductBatch>(ProductBatch.blank())

onMounted(async () => {
  Promise.all([
    productStore.fetchAll({
      relation: { productBatches: true },
      filter: { productBatch: { isActive: 1, quantity: ['!=', 0] } },
    }),
  ])
})

const searchingProductBatch = async (text: string) => {
  if (text) {
    productBatchList.value = productStore.searchBatch(text)
  } else {
    productBatchList.value = []
  }
}

const selectProductBatch = (data?: ProductBatch) => {
  if (data) {
    searchText.value = data.product!.brandName
    productBatch.value = data

    const dataEmit = ProductBatch.fromInstance(data)
    dataEmit.product = Product.fromInstance(data.product || Product.blank())
    emit('selectProductBatch', dataEmit)
  } else {
    productBatch.value = ProductBatch.blank()
    // emit('selectProductBatch', ProductBatch.blank())
  }
}

const focus = () => {
  clear()
  inputSearchProductBatch.value?.focus()
}

const clear = () => {
  searchText.value = ''
  productBatchList.value = []
  productBatch.value = ProductBatch.blank()
}

defineExpose({ focus, clear })
</script>

<template>
  <div class="w-full">
    <div>Tên hàng hóa</div>
    <div style="height: 40px">
      <InputOptions
        ref="inputSearchProductBatch"
        v-model:searchText="searchText"
        :options="productBatchList"
        :maxHeight="320"
        placeholder="(F3) Tìm kiếm bằng tên hoặc hoạt chất của sản phẩm"
        @selectItem="selectProductBatch"
        @update:searchText="searchingProductBatch"
      >
        <template
          #each="{
            item: {
              product: { brandName, substance, unitName },
              unitQuantity,
              unitRetailPrice,
            },
          }"
        >
          <div>
            <b>{{ brandName }}</b> - <b>{{ unitQuantity }}</b> {{ unitName }} - Giá
            <b>{{ formatMoney(unitRetailPrice) }}</b>
          </div>
          <div>{{ substance }}</div>
        </template>
      </InputOptions>
    </div>
  </div>
</template>

<style lang="scss"></style>
