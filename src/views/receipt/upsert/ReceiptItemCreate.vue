<script setup lang="ts">
import { InputDate, InputMoney, InputNumber, InputOptions } from '@/common/vue-form'
import { Product, ProductBatch, ProductBatchService, useProductStore } from '@/modules/product'
import { ReceiptItem } from '@/modules/receipt'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { onMounted, onUnmounted, ref } from 'vue'
import ModalProductUpsert from '../../product/upsert/ModalProductUpsert.vue'

const handleDocumentKeyup = (e: KeyboardEvent) => {
  if (e.key === 'F3') {
    e.preventDefault()
    inputSearchProduct.value?.focus()
  }
}

const emit = defineEmits<{ (e: 'addReceiptItem', value: ReceiptItem): void }>()

const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const inputSearchProduct = ref<InstanceType<typeof InputOptions>>()

const productStore = useProductStore()
const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const product = ref<Product>(Product.blank())
const productList = ref<Product[]>([])

const productBatch = ref<ProductBatch>(ProductBatch.blank())
const receiptItem = ref<ReceiptItem>(ReceiptItem.blank())

onMounted(async () => {
  window.addEventListener('keydown', handleDocumentKeyup)
  await productStore.fetchAll({
    relation: { productBatches: true },
    filter: {
      productBatch: {
        isActive: 1,
        // quantity: ['!=', 0]
      },
    },
  })
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
})

const searchingProduct = async (text: string) => {
  product.value.id = 0
  product.value.brandName = text
  receiptItem.value = ReceiptItem.blank()
  if (text) {
    productList.value = productStore.search(text)
  } else {
    productList.value = []
  }
}

const selectProduct = async (data?: Product) => {
  if (data) {
    const p = Product.fromInstance(data)
    p.productBatches = data.productBatches.map((i) => {
      const b = ProductBatch.fromInstance(i)
      b.product = p
      return b
    })
    // p.productBatches = await ProductBatchService.list({
    //   filter: {
    //     productId: p.id,
    //     isActive: 1,
    //     // quantity: ['!=', 0],
    //     // expiryDate: ['>', new Date().toISOString()],
    //   },
    // })

    product.value = p

    const newBatch = ProductBatch.blank()
    newBatch.productId = p.id
    newBatch.product = p
    product.value.productBatches.push(newBatch)

    // const defaultBatch = p.productBatches.find((i) => !i.batch && !i.expiryDate)
    const defaultBatch = p.productBatches[0]
    selectProductBatch(defaultBatch!)

    productList.value = []
  } else {
    product.value = Product.blank()
  }
}

const handleChangeSelectProductBatch = (value: number) => {
  const batch = product.value.productBatches.find((i) => i.id === value)
  if (batch) selectProductBatch(batch)
}

const selectProductBatch = (batch: ProductBatch) => {
  productBatch.value = batch
  receiptItem.value.productBatchId = batch.id
  receiptItem.value.productBatch = ProductBatch.clone(batch)

  const unitDefault = receiptItem.value.productBatch.product!.unitDefault
  receiptItem.value.unit = { name: unitDefault!.name, rate: unitDefault!.rate }
}

const handleChangeSelectUnit = (rate: number) => {
  const unit = product.value.unit.find((i) => i.rate === rate)
  receiptItem.value.unit = { name: unit!.name, rate: unit!.rate }
}

const addReceiptItem = async () => {
  if (!receiptItem.value.quantity) {
    return message.error('Lỗi: Số lượng phải lớn hơn 0')
  }

  if (!productBatch.value.id) {
    const batch = await ProductBatchService.createOne(productBatch.value)
    productStore.addBatch(ProductBatch.fromPlain(batch))
    batch.product = product.value
    productBatch.value = batch
    receiptItem.value.productBatchId = batch.id
    receiptItem.value.productBatch = batch
  }

  receiptItem.value.costPrice = productBatch.value.costPrice

  emit('addReceiptItem', receiptItem.value)

  product.value = Product.blank()
  productBatch.value = ProductBatch.blank()
  receiptItem.value = ReceiptItem.blank()
  // inputSearchProduct.value?.focus()
  productList.value = []
}
</script>

<template>
  <ModalProductUpsert ref="modalProductUpsert" @success="selectProduct" />
  <form @submit.prevent="addReceiptItem">
    <div>
      <div class="flex justify-between">
        <span>Tên sản phẩm</span>
        <a @click="modalProductUpsert?.openModal()">Thêm sản phẩm mới</a>
      </div>
      <div style="height: 40px">
        <InputOptions
          ref="inputSearchProduct"
          :options="productList"
          :searchText="product.brandName"
          :maxHeight="260"
          placeholder="(F3) Tìm kiếm bằng tên hoặc hoạt chất của sản phẩm"
          required
          @selectItem="selectProduct"
          @update:searchText="searchingProduct"
        >
          <template #each="{ item: { brandName, substance, unitName, unitQuantity } }">
            <div>
              <b>{{ brandName }}</b> - {{ unitQuantity }} {{ unitName }}
            </div>
            <div>{{ substance }}</div>
          </template>
        </InputOptions>
      </div>
    </div>

    <div class="mt-2 flex gap-4">
      <div style="flex: 1; flex-basis: 100%">
        <div>Nhập vào lô hàng</div>
        <div></div>
        <a-select
          :value="receiptItem.productBatchId"
          :options="
            product.productBatches.map((i: ProductBatch) => ({
              value: i.id,
              label: !i.id
                ? 'Lô mới'
                : `Lô: ${i.batch} ${timeToText(i.expiryDate, 'DD/MM/YYYY')}` +
                  ` - Tồn: ${i.unitQuantity} ${product.unitName}` +
                  ` - Nhập: ${formatMoney(i.unitCostPrice)}` +
                  (organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemInput.wholesalePrice
                    ? ` - Sỉ: ${formatMoney(i.unitWholesalePrice)}`
                    : '') +
                  ` - Lẻ: ${formatMoney(i.unitRetailPrice)}`,
            }))
          "
          :disabled="product.productBatches.length == 1"
          class="w-full"
          placeholder=""
          @change="handleChangeSelectProductBatch"
        />
      </div>
    </div>

    <div class="mt-2 flex flex-wrap gap-4">
      <div
        v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemInput.batch"
        style="flex-grow: 1"
        class="basis-[90%] lg:basis-[45%]"
      >
        <div>Số lô</div>
        <a-input v-model:value="productBatch.batch" class="w-full" :disabled="!!productBatch.id" />
      </div>
      <div
        v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemInput.expiryDate"
        style="flex-grow: 1"
        class="basis-[90%] lg:basis-[45%]"
      >
        <div>Hạn sử dụng</div>
        <InputDate
          v-model:value="productBatch.expiryDate"
          typeParser="number"
          class="w-full"
          :disabled="!!productBatch.id"
        />
      </div>
      <div style="flex-grow: 1" class="basis-[90%] lg:basis-[45%]">
        <div>
          Số lượng
          <span v-if="receiptItem.unit.rate !== 1">
            (Quy đổi: <b>{{ receiptItem.quantity }}</b> {{ product.unitBasicName }})
          </span>
        </div>
        <div class="flex">
          <a-select
            :value="receiptItem.unit.rate"
            :disabled="productBatch.product!.unit.length <= 1"
            style="flex-basis: 100px"
            @change="handleChangeSelectUnit"
          >
            <a-select-option
              v-for="(item, index) in productBatch.product!.unit"
              :key="index"
              :value="item.rate"
            >
              {{ item.name }}
            </a-select-option>
          </a-select>
          <div class="flex-1">
            <InputNumber v-model:value="receiptItem.unitQuantity" required />
          </div>
        </div>
      </div>

      <div style="flex-grow: 1" class="basis-[90%] lg:basis-[45%]">
        <div>
          Giá nhập
          <span v-if="receiptItem.unit.rate !== 1">
            (Quy đổi: <b>{{ formatMoney(productBatch.costPrice) }} / </b>
            {{ productBatch.product!.unitBasicName }})
          </span>
        </div>
        <div>
          <InputMoney
            :value="Number((productBatch.costPrice * receiptItem.unit.rate).toFixed())"
            style="width: 100%"
            required
            :min="0"
            :disabled="!!productBatch.id"
            :prepend="receiptItem.unit.rate !== 1 ? receiptItem.unit.name : ''"
            @update:value="(data) => (productBatch.costPrice = data / receiptItem.unit.rate)"
          />
        </div>
      </div>
      <div
        v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemInput.wholesalePrice"
        style="flex-grow: 1"
        class="basis-[90%] lg:basis-[45%]"
      >
        <div>
          Giá bán sỉ
          <span v-if="receiptItem.unit.rate !== 1">
            (Quy đổi: <b>{{ formatMoney(productBatch.wholesalePrice) }} / </b>
            {{ productBatch.product!.unitBasicName }})
          </span>
        </div>
        <div>
          <InputMoney
            :value="Number((productBatch.wholesalePrice * receiptItem.unit.rate).toFixed())"
            style="width: 100%"
            :min="0"
            :disabled="!!productBatch.id"
            :prepend="receiptItem.unit.rate !== 1 ? receiptItem.unit.name : ''"
            @update:value="(data) => (productBatch.wholesalePrice = data / receiptItem.unit.rate)"
          />
        </div>
      </div>
      <div
        v-if="organizationStore.SCREEN_RECEIPT_UPSERT.receiptItemInput.retailPrice"
        style="flex-grow: 1"
        class="basis-[90%] lg:basis-[45%]"
      >
        <div>
          Giá bán lẻ
          <span v-if="receiptItem.unit.rate !== 1">
            (Quy đổi: <b>{{ formatMoney(productBatch.retailPrice) }} / </b>
            {{ productBatch.product!.unitBasicName }})
          </span>
        </div>
        <div>
          <InputMoney
            :value="Number((productBatch.retailPrice * receiptItem.unit.rate).toFixed())"
            style="width: 100%"
            :min="0"
            :disabled="!!productBatch.id"
            :prepend="receiptItem.unit.rate !== 1 ? receiptItem.unit.name : ''"
            required
            @update:value="(data) => (productBatch.retailPrice = data / receiptItem.unit.rate)"
          />
        </div>
      </div>
    </div>

    <div class="mt-4 text-center">
      <a-button type="primary" htmlType="submit">
        <template #icon>
          <PlusOutlined />
        </template>
        Thêm sản phẩm
      </a-button>
    </div>
  </form>
</template>

<style lang="scss"></style>
