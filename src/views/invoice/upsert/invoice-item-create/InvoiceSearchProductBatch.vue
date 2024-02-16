<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { InputOptions } from '../../../../common/vue-form'
import { Product, useProductStore } from '../../../../modules/product'
import { ProductBatch, useProductBatchStore } from '../../../../modules/product-batch'
import { useScreenStore } from '../../../../modules/_me/screen.store'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'

const emit = defineEmits<{ (e: 'selectProductBatch', value: ProductBatch): void }>()

const inputSearchProductBatch = ref<InstanceType<typeof InputOptions>>()

const screenStore = useScreenStore()
const { formatMoney } = screenStore
const productStore = useProductStore()
const productBatchStore = useProductBatchStore()

const searchText = ref('')
const productBatchList = ref<ProductBatch[]>([])
const productBatch = ref<ProductBatch>(ProductBatch.blank())

onMounted(async () => {
  try {
    await productStore.refreshDB()
    await productBatchStore.refreshDB()
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const searchingProductBatch = async (text: string) => {
  productBatchList.value = await productBatchStore.search(text, {
    quantity: screenStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.searchHasZeroQuantity
      ? undefined
      : { NOT: 0 },
  })
}

const selectProductBatch = (instance?: ProductBatch) => {
  if (instance) {
    searchText.value = instance.product!.brandName
    productBatch.value = instance

    const dataEmit = ProductBatch.fromInstance(instance)
    dataEmit.product = Product.fromInstance(instance.product || Product.blank())
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
