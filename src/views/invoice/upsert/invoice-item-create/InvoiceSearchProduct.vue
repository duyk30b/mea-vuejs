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

const emit = defineEmits<{
  (e: 'selectBatch', value: Batch | null): void
  (e: 'selectProduct', value: Product | null): void
}>()

const inputSearchProduct = ref<InstanceType<typeof InputOptions>>()
const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()

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

const selectProduct = async (productData?: Product) => {
  if (productData) {
    product.value = Product.clone(productData)
    if (productData.hasManageBatches) {
      const batches = await batchStore.list({
        filter: {
          productId: productData.id,
          quantity: { GT: 0 },
        },
      })
      const productScope = Product.clone(productData)
      batches.forEach((i) => (i.product = productScope))
      batchList.value = batches

      if (screenStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.customAfterSearch) {
        if (batches.length) {
          selectBatch(batches[0].id)
        } else {
          emit('selectBatch', null)
        }
      }
    } else if (!productData.hasManageBatches) {
      batchList.value = []
      const productEmit = Product.clone(productData)
      emit('selectProduct', productEmit)
    }
  } else {
    product.value = Product.blank()
    emit('selectBatch', null)
  }
}

const selectBatch = (id: number) => {
  const batchFind = batchList.value.find((i) => i.id === id)
  if (batchFind) {
    batch.value = batchFind
    const batchEmit = Batch.clone(batchFind)
    emit('selectBatch', batchEmit)
  } else {
    batch.value = Batch.blank()
    emit('selectBatch', null)
  }
}

const focus = () => {
  productList.value = []
  batch.value = Batch.blank()
  inputSearchProduct.value?.focus()
}

const clear = () => {
  productList.value = []
  product.value = Product.blank()
  batch.value = Batch.blank()
}

const clearAndFocus = () => {
  productList.value = []
  batch.value = Batch.blank()
  product.value = Product.blank()
  inputSearchProduct.value?.focus()
}

defineExpose({ focus, clear, clearAndFocus })
</script>

<template>
  <ModalProductUpsert ref="modalProductUpsert" @success="selectProduct" />
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
        ref="inputSearchProduct"
        v-model:searchText="product.brandName"
        :options="productList"
        :maxHeight="320"
        placeholder="(F3) Tìm kiếm sản phẩm và lô hàng bằng tên hoặc hoạt chất của sản phẩm"
        @selectItem="selectProduct"
        @update:searchText="searchingProduct"
      >
        <template
          #each="{ item: { brandName, substance, unitName, unitQuantity, unitRetailPrice } }"
        >
          <div>
            <b>{{ brandName }}</b> -
            <span style="font-weight: 700" :class="unitQuantity <= 0 ? 'text-red-500' : ''">
              {{ unitQuantity }}
            </span>
            {{ unitName }}
            - Giá {{ formatMoney(unitRetailPrice) }}
          </div>
          <div>{{ substance }}</div>
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
        :options="
          batchList.map((i: Batch) => ({
            value: i.id,
            text:
              `${i.lotNumber} - ${timeToText(i.expiryDate, 'DD/MM/YYYY')} ` +
              `- SL: ${i.unitQuantity} ${i.product?.unitName}`,
          }))
        "
        :disabled="batchList.length == 0"
        @update:value="selectBatch"
      />
    </div>
  </div>
</template>

<style lang="scss"></style>
