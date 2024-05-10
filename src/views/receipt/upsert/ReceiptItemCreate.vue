<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputDate, InputMoney, InputNumber, InputOptions } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { Batch, useBatchStore } from '../../../modules/batch'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product, useProductStore } from '../../../modules/product'
import { ReceiptItem } from '../../../modules/receipt-item/receipt-item.model'
import { timeToText } from '../../../utils'
import ModalProductUpsert from '../../product/upsert/ModalProductUpsert.vue'
import { ReceiptItemApi } from '../../../modules/receipt-item/receipt-item.api'
import type { ProductAndBatchUpsertBody } from '../../../modules/receipt-item/receipt-item.dto'
import { useReceiptStore } from '../../../modules/receipt'

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
const batchStore = useBatchStore()
const receiptStore = useReceiptStore()
const meStore = useMeStore()
const screenStore = useScreenStore()
const { formatMoney } = screenStore
const { permissionIdMap } = meStore

const product = ref<Product>(Product.blank())

const productList = ref<Product[]>([])
const batch = ref<Batch>(Batch.blank())
const batchList = ref<Batch[]>([])

const info = reactive({
  batchId: 0,
  productId: 0,
  lotNumber: '',
  expiryDate: undefined as number | undefined,
  costPrice: 0,
  retailPrice: 0,
  wholesalePrice: 0,
  quantity: 0,
  unit: { name: '', rate: 1 },
})

onMounted(async () => {
  try {
    window.addEventListener('keydown', handleDocumentKeyup)
    await productStore.refreshDB()
    await batchStore.refreshDB()
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
})

const clearInfo = () => {
  info.batchId = 0
  info.productId = 0
  info.costPrice = 0
  info.wholesalePrice = 0
  info.retailPrice = 0
  info.lotNumber = ''
  info.expiryDate = undefined
  info.unit.name = ''
  info.unit.rate = 1
  info.quantity = 0
}

const searchingProduct = async (text: string) => {
  product.value.id = 0
  productList.value = await productStore.search(text)
}

const handleSelectProduct = async (productData?: Product) => {
  if (productData) {
    if (!productData.hasManageQuantity) {
      return message.error(`Sản phẩm ${productData.brandName} không theo dõi số lượng tồn kho`)
    }

    product.value = Product.clone(productData)
    info.productId = productData.id
    info.costPrice = productData.costPrice
    info.wholesalePrice = productData.wholesalePrice
    info.retailPrice = productData.retailPrice
    info.unit.name = productData.unitDefault.name
    info.unit.rate = productData.unitDefault.rate

    if (productData.hasManageBatches) {
      const batchListData = await batchStore.list({
        filter: {
          productId: productData.id,
          quantity: { NOT: 0 },
        },
        sort: { expiryDate: 'DESC' },
      })

      const newBatch = Batch.blank()
      newBatch.productId = productData.id
      newBatch.expiryDate = undefined
      newBatch.costPrice = productData.costPrice
      batchListData.push(newBatch)

      const productClone = Product.clone(productData)
      batchListData.forEach((i) => (i.product = productClone))

      batchList.value = batchListData
      selectBatch(batchListData.at(-1)!)
    } else {
      batchList.value = []
    }

    productList.value = []
  } else {
    product.value = Product.blank()
    batchList.value = []
    productList.value = []
    clearInfo()
  }
}

const handleChangeSelectBatch = (value: number) => {
  const batch = batchList.value.find((i) => i.id === value)
  if (batch) selectBatch(batch)
}

const selectBatch = (data: Batch) => {
  batch.value = Batch.clone(data)
  info.expiryDate = data.expiryDate
  info.lotNumber = data.lotNumber
}

const handleChangeSelectUnit = (rate: number) => {
  const unit = product.value.unit.find((i) => i.rate === rate)
  if (unit) {
    info.unit.rate = unit.rate
    info.unit.name = unit.name
  }
}

const addReceiptItem = async () => {
  if (!info.quantity) {
    return message.error('Lỗi: Số lượng phải lớn hơn 0')
  }

  const receiptItem = ReceiptItem.blank()
  receiptItem.batchId = info.batchId
  receiptItem.productId = info.productId
  receiptItem.costPrice = info.costPrice
  receiptItem.unit = {
    name: info.unit.name,
    rate: info.unit.rate,
  }
  receiptItem.quantity = info.quantity
  receiptItem.product = Product.clone(product.value)
  if (receiptItem.batchId) {
    receiptItem.batch = Batch.clone(batch.value)
  }

  const upsertInfoBatchAndProduct: ProductAndBatchUpsertBody = {}
  if (
    info.costPrice !== product.value.costPrice ||
    info.wholesalePrice !== product.value.wholesalePrice ||
    info.retailPrice !== product.value.retailPrice
  ) {
    upsertInfoBatchAndProduct.product = {
      productId: info.productId,
      costPrice: info.costPrice,
      wholesalePrice: info.wholesalePrice,
      retailPrice: info.retailPrice,
    }
  }

  if (!info.batchId && product.value.hasManageBatches) {
    upsertInfoBatchAndProduct.batch = {
      productId: info.productId,
      lotNumber: info.lotNumber,
      expiryDate: info.expiryDate,
      costPrice: info.costPrice,
    }
  }

  if (upsertInfoBatchAndProduct.batch || upsertInfoBatchAndProduct.product) {
    const dataResponse = await receiptStore.upsertProductAndBatch({
      product: upsertInfoBatchAndProduct.product,
      batch: upsertInfoBatchAndProduct.batch,
    })
    if (dataResponse.batch) {
      receiptItem.batchId = dataResponse.batch?.id || 0
      receiptItem.batch = dataResponse.batch
    }
    if (dataResponse.product) {
      receiptItem.productId = dataResponse.product?.id || 0
      receiptItem.product = dataResponse.product
    }
  }

  emit('addReceiptItem', receiptItem)

  product.value = Product.blank()
  clearInfo()
  productList.value = []
  batchList.value = []
}
</script>

<template>
  <ModalProductUpsert ref="modalProductUpsert" @success="handleSelectProduct" />
  <form @submit.prevent="addReceiptItem">
    <div>
      <div class="flex justify-between">
        <span>Tên sản phẩm</span>
        <span>
          <a
            v-if="permissionIdMap[PermissionId.PRODUCT_CREATE]"
            @click="modalProductUpsert?.openModal()"
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
          :maxHeight="260"
          placeholder="(F3) Tìm kiếm bằng tên hoặc hoạt chất của sản phẩm"
          required
          @selectItem="handleSelectProduct"
          @update:searchText="searchingProduct"
        >
          <template
            #each="{
              item: {
                brandName,
                substance,
                unitName,
                unitQuantity,
                costPrice,
                retailPrice: retailPriceScope,
              },
            }"
          >
            <div>
              <b>{{ brandName }}</b> - {{ unitQuantity }} {{ unitName }} - G.Nhập
              {{ formatMoney(costPrice) }} - G.Bán {{ formatMoney(retailPriceScope) }}
            </div>
            <div>{{ substance }}</div>
          </template>
        </InputOptions>
      </div>
    </div>

    <div v-if="product?.hasManageBatches" class="mt-4 flex gap-4">
      <div style="flex: 1; flex-basis: 100%">
        <div>Nhập vào lô hàng</div>
        <div></div>
        <a-select
          v-model:value="info.batchId"
          :options="
            batchList.map((i: Batch) => ({
              value: i.id,
              label: !i.id
                ? 'Lô mới'
                : `Lô: ${i.lotNumber} ${timeToText(i.expiryDate, 'DD/MM/YYYY')}` +
                  ` - Tồn: ${i.unitQuantity} ${product.unitName}` +
                  ` - Nhập: ${formatMoney(i.unitCostPrice)}`,
            }))
          "
          :disabled="batchList.length <= 1"
          class="w-full"
          placeholder=""
          @change="handleChangeSelectBatch"
        />
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-4">
      <div v-if="product?.hasManageBatches" style="flex-grow: 1" class="basis-[90%] lg:basis-[45%]">
        <div>Số lô</div>
        <a-input v-model:value="info.lotNumber" class="w-full" :disabled="!!!!info.batchId" />
      </div>
      <div v-if="product!.hasManageBatches" style="flex-grow: 1" class="basis-[90%] lg:basis-[45%]">
        <div>Hạn sử dụng</div>
        <InputDate
          v-model:value="info.expiryDate"
          typeParser="number"
          class="w-full"
          :disabled="!!info.batchId"
        />
      </div>
      <div style="flex-grow: 1" class="basis-[90%] lg:basis-[45%]">
        <div>
          Số lượng
          <span v-if="info.unit.rate !== 1">
            (Quy đổi: <b>{{ info.quantity }}</b> {{ product.unitBasicName }})
          </span>
        </div>
        <div class="flex">
          <a-select
            :value="info.unit.rate"
            :disabled="product!.unit.length <= 1"
            style="flex-basis: 100px"
            @change="handleChangeSelectUnit"
          >
            <a-select-option v-for="(item, index) in product!.unit" :key="index" :value="item.rate">
              {{ item.name }}
            </a-select-option>
          </a-select>
          <div class="flex-1">
            <InputNumber
              :value="info.quantity / info.unit.rate"
              required
              @update:value="(data) => (info.quantity = data * info.unit.rate)"
            />
          </div>
        </div>
      </div>

      <div style="flex-grow: 1" class="basis-[90%] lg:basis-[45%]">
        <div>
          Giá nhập
          <span v-if="info.unit.rate !== 1">
            (Quy đổi: <b>{{ formatMoney(info.costPrice) }} / </b> {{ product.unitBasicName }})
          </span>
        </div>
        <div>
          <InputMoney
            :value="Number((info.costPrice * info.unit.rate).toFixed())"
            style="width: 100%"
            required
            :min="0"
            :prepend="info.unit.rate !== 1 ? info.unit.name : ''"
            @update:value="(data) => (info.costPrice = data / info.unit.rate)"
          />
        </div>
      </div>
      <div
        v-if="
          screenStore.SCREEN_RECEIPT_UPSERT.receiptItemInput.salePrice &&
          screenStore.SYSTEM_SETTING.wholesalePrice
        "
        style="flex-grow: 1"
        class="basis-[90%] lg:basis-[45%]"
      >
        <div>
          Giá bán sỉ
          <span v-if="info.unit.rate !== 1">
            (Quy đổi: <b>{{ formatMoney(info.wholesalePrice || 0) }} / </b>
            {{ product.unitBasicName }})
          </span>
        </div>
        <div>
          <InputMoney
            :value="Number((info.wholesalePrice * info.unit.rate).toFixed())"
            style="width: 100%"
            :min="0"
            :prepend="info.unit.rate !== 1 ? info.unit.name : ''"
            @update:value="(data) => (info.wholesalePrice = data / info.unit.rate)"
          />
        </div>
      </div>

      <div
        v-if="
          screenStore.SCREEN_RECEIPT_UPSERT.receiptItemInput.salePrice &&
          screenStore.SYSTEM_SETTING.retailPrice
        "
        style="flex-grow: 1"
        class="basis-[90%] lg:basis-[45%]"
      >
        <div>
          Giá bán lẻ
          <span v-if="info.unit.rate !== 1">
            (Quy đổi: <b>{{ formatMoney(info.retailPrice) }} / </b> {{ product.unitBasicName }})
          </span>
        </div>
        <div>
          <InputMoney
            :value="Number((info.retailPrice * info.unit.rate).toFixed())"
            style="width: 100%"
            :min="0"
            :prepend="info.unit.rate !== 1 ? info.unit.name : ''"
            required
            @update:value="(data) => (info.retailPrice = data / info.unit.rate)"
          />
        </div>
      </div>
    </div>

    <div class="mt-6 text-center">
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
