<script setup lang="ts">
import { InputDate, InputOptions } from '@/common/vue-form'
import { Product, ProductBatch, ProductBatchService, ProductService } from '@/modules/product'
import { ReceiptItem } from '@/modules/receipt'
import { useOrganizationStore } from '@/store/organization.store'
import { formatNumber, timeToText } from '@/utils'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { onMounted, onUnmounted, ref } from 'vue'
import ModalProductUpsert from '../../product/components/ModalProductUpsert.vue'

const handleDocumentKeyup = (e: KeyboardEvent) => {
  if (e.key === 'F3') {
    e.preventDefault()
    inputSearchProduct.value?.focus()
  }
}
onMounted(() => {
  window.addEventListener('keydown', handleDocumentKeyup)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
})

const emit = defineEmits<{ (e: 'add_receipt_item', value: ReceiptItem): void }>()

const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const inputSearchProduct = ref<InstanceType<typeof InputOptions>>()

const organizationStore = useOrganizationStore()

const productList = ref<Product[]>([])
const product = ref<Product>(Product.blank())

const productBatch = ref<ProductBatch>(ProductBatch.blank())
const receiptItem = ref<ReceiptItem>(new ReceiptItem())

const searchingProduct = async (text: string) => {
  product.value.id = 0
  product.value.brandName = text
  productList.value = []
  receiptItem.value = new ReceiptItem()
  if (text) {
    productList.value = await ProductService.search({
      limit: 10,
      filter: {
        search_text: text,
        is_active: 'true',
        overdue: 'true',
        quantity_zero: 'true',
      },
      relations: { product_batches: true },
    })
  }
}

const selectProduct = (p: Product) => {
  p.productBatches.reverse()
  product.value = p

  const newBatch = ProductBatch.blank()
  newBatch.productId = p.id
  product.value.productBatches.unshift(newBatch)

  let defaultBatch = [...p.productBatches].reverse().find((i) => !i.batch && !i.expiryDate)
  selectProductBatch(defaultBatch!)

  productList.value = []
}

const handleChangeSelectProductBatch = (value: number) => {
  const batch = product.value.productBatches.find((i) => i.id === value)
  if (batch) selectProductBatch(batch)
}

const selectProductBatch = (batch: ProductBatch) => {
  productBatch.value = batch
  batch.product = Product.fromInstance(product.value)
  receiptItem.value.productBatchId = batch.id
  receiptItem.value.productBatch = batch
  receiptItem.value.unit = batch.product?.unit?.[0] || { name: '', rate: 1 }
}

const handleChangeSelectUnit = (value: number) => {
  const unit = product.value.unit.find((i) => i.rate === value)
  receiptItem.value.unit = unit || { name: '', rate: 1 }
}

const addReceiptItem = async () => {
  if (!product.value.id) {
    message.error('Lỗi: Chưa chọn sản phẩm')
    return inputSearchProduct.value?.focus()
  }

  if (!receiptItem.value.quantity) {
    return message.error('Lỗi: Chưa chọn số lượng')
  }

  if (!productBatch.value.id) {
    const batch = await ProductBatchService.createOne(productBatch.value)
    batch.product = product.value
    productBatch.value = batch
    receiptItem.value.productBatchId = batch.id
  }

  emit('add_receipt_item', receiptItem.value)

  product.value = Product.blank()
  productBatch.value = ProductBatch.blank()
  receiptItem.value = new ReceiptItem()
  // inputSearchProduct.value?.focus()
  productList.value = []
}

</script>

<template>
  <ModalProductUpsert ref="modalProductUpsert" @success="selectProduct" />
  <div>
    <div class="flex justify-between">
      <span>Tên sản phẩm</span>
      <a @click="modalProductUpsert?.openModal()">Thêm sản phẩm mới</a>
    </div>
    <InputOptions ref="inputSearchProduct" :options="productList" :searchText="product.brandName"
      @selectItem="selectProduct" @update:searchText="searchingProduct" :maxHeight="260"
      placeholder="(F3) Tìm kiếm bằng tên hoặc hoạt chất của sản phẩm">
      <template v-slot:each="{ item: { brandName, substance, unit, productBatches } }">
        <div> <b>{{ brandName }}</b> - {{ substance }}</div>
        <div v-for="(b, index) in productBatches" :key="index">
          - Lô {{ b.batch }} {{ timeToText(b.expiryDate) }}
          - Tồn: <b>{{ b.quantity }}</b> {{ unit?.[0].name }}
          - Nhập <b>{{ formatNumber(b.costPrice) }}</b>
          - Sỉ <b>{{ formatNumber(b.wholesalePrice) }}</b>
          - Lẻ <b>{{ formatNumber(b.retailPrice) }}</b>
        </div>
      </template>
    </InputOptions>
  </div>

  <div class="mt-2 flex gap-4">
    <div style="flex: 1; flex-basis: 100%;">
      <div>Nhập vào lô hàng</div>
      <a-select :value="receiptItem.productBatchId" :options="product.productBatches.map((i: ProductBatch) => ({
        value: i.id,
        label: i.id === 0 ? 'Lô mới' : `Lô: ${i.batch} ${timeToText(i.expiryDate, 'DD/MM/YYYY')}`
          + ` - Tồn: ${i.quantity} ${product.unit?.[0].name}`
          + ` - Nhập: ${formatNumber(i.costPrice)}`
          + ` - Sỉ: ${formatNumber(i.wholesalePrice)}`
          + ` - Lẻ: ${formatNumber(i.retailPrice)}`
      }))" @change="handleChangeSelectProductBatch" :disabled="product.productBatches.length == 1" class="w-full"
        placeholder="">
      </a-select>
    </div>
  </div>

  <div class="mt-2 flex flex-wrap gap-4">
    <div v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_UPSERT.receiptItemInput.batch"
      style="flex: 1; flex-basis: 280px;">
      <div>Số lô</div>
      <a-input v-model:value="productBatch.batch" class="w-full" :disabled="!!productBatch.id"></a-input>
    </div>
    <div style="flex: 1; flex-basis: 280px;">
      <div>Hạn sử dụng</div>
      <InputDate v-model:value="productBatch.expiryDate" typeParser="number" class="w-full"
        :disabled="!!productBatch.id" />
    </div>
    <div style="flex: 1; flex-basis: 280px;">
      <div>Số lượng
        <span v-if="receiptItem.unit.rate !== 1">
          (Quy đổi: <b>{{ receiptItem.quantity }}</b>
          {{ product.unit.find(i => i.rate === 1)?.name }})
        </span>
      </div>
      <a-input-number :value="receiptItem.quantity / receiptItem.unit.rate"
        @update:value="(e: any) => receiptItem.quantity = e * receiptItem.unit.rate" style="width: 100%;" :min="0">
        <template #addonBefore>
          <a-select :value="receiptItem.unit.rate" @change="handleChangeSelectUnit"
            :disabled="(productBatch.product?.unit?.length || 0) <= 1" style="width: 100px">
            <a-select-option v-for="(item, index) in productBatch.product?.unit || [{ name: '', rate: 1 }]" :key="index"
              :value="item.rate">
              {{ item.name }}
            </a-select-option>
          </a-select>
        </template>
      </a-input-number>
    </div>

    <div style="flex: 1; flex-basis: 280px;">
      <div>Giá nhập
        <span v-if="receiptItem.unit.rate !== 1">
          (Quy đổi: <b>{{ formatNumber(productBatch.costPrice) }} / </b>
          {{ product.unit.find(i => i.rate === 1)?.name }})
        </span>
      </div>
      <a-input-number :value="productBatch.costPrice * receiptItem.unit.rate"
        @update:value="(e: any) => productBatch.costPrice = e / receiptItem.unit.rate" step="1000" style="width: 100%;"
        :min="0" :disabled="!!productBatch.id" :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
        :parser="(value: any) => value.replace(/(,*)/g, '')">
        <template #addonBefore v-if="receiptItem.unit.rate !== 1">
          {{ receiptItem.unit.name }}
        </template>
      </a-input-number>
    </div>
    <div v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_UPSERT.receiptItemInput.wholesalePrice"
      style="flex: 1; flex-basis: 280px;">
      <div>Giá bán sỉ
        <span v-if="receiptItem.unit.rate !== 1">
          (Quy đổi: <b>{{ formatNumber(productBatch.wholesalePrice) }} / </b>
          {{ product.unit.find(i => i.rate === 1)?.name }})
        </span>
      </div>
      <a-input-number :value="productBatch.wholesalePrice * receiptItem.unit.rate" step="1000"
        @update:value="(e: any) => productBatch.wholesalePrice = e / receiptItem.unit.rate" style="width: 100%;" :min="0"
        :disabled="!!productBatch.id" :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
        :parser="(value: any) => value.replace(/(,*)/g, '')">
        <template #addonBefore v-if="receiptItem.unit.rate !== 1">
          {{ receiptItem.unit.name }}
        </template>
      </a-input-number>
    </div>
    <div v-if="organizationStore.SCREEN_PURCHASE_RECEIPT_UPSERT.receiptItemInput.retailPrice"
      style="flex: 1; flex-basis: 280px;">
      <div>Giá bán lẻ
        <span v-if="receiptItem.unit.rate !== 1">
          (Quy đổi: <b>{{ formatNumber(productBatch.retailPrice) }} / </b>
          {{ product.unit.find(i => i.rate === 1)?.name }})
        </span>
      </div>
      <a-input-number :value="productBatch.retailPrice * receiptItem.unit.rate"
        @update:value="(e: any) => productBatch.retailPrice = e / receiptItem.unit.rate" step="1000" style="width: 100%;"
        :min="0" :disabled="!!productBatch.id" :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
        :parser="(value: any) => value.replace(/(,*)/g, '')">
        <template #addonBefore v-if="receiptItem.unit.rate !== 1">
          {{ receiptItem.unit.name }}
        </template>
      </a-input-number>
    </div>
  </div>

  <div class="mt-4 text-center">
    <a-button type="primary" @click="addReceiptItem">
      <template #icon>
        <PlusOutlined />
      </template>
      Thêm sản phẩm
    </a-button>
  </div>
</template>

<style lang="scss"></style>
