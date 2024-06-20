<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import {
  InputDate,
  InputMoney,
  InputNumber,
  InputOptions,
  InputText,
  VueSelect,
} from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { Batch, useBatchStore } from '../../../modules/batch'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product, useProductStore } from '../../../modules/product'
import { useReceiptStore } from '../../../modules/receipt'
import type { ProductAndBatchUpsertBody } from '../../../modules/receipt-item/receipt-item.dto'
import { ReceiptItem } from '../../../modules/receipt-item/receipt-item.model'
import { timeToText } from '../../../utils'
import ModalProductUpsert from '../../product/upsert/ModalProductUpsert.vue'

const handleDocumentKeyup = (e: KeyboardEvent) => {
  if (e.key === 'F3') {
    e.preventDefault()
    inputOptionsProduct.value?.focus()
  }
}

const emit = defineEmits<{ (e: 'addReceiptItem', value: ReceiptItem): void }>()

const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const inputOptionsProduct = ref<InstanceType<typeof InputOptions>>()

const productStore = useProductStore()
const batchStore = useBatchStore()
const receiptStore = useReceiptStore()
const meStore = useMeStore()
const screenStore = useScreenStore()
const { formatMoney } = screenStore
const { permissionIdMap } = meStore

const productList = ref<Product[]>([])
const batchList = ref<Batch[]>([])

const product = ref<Product>(Product.blank())
const batch = ref<Batch>(Batch.blank())

const info = reactive({
  batchId: 0,
  productId: 0,
  lotNumber: '',
  expiryDate: undefined as number | undefined,
  costPrice: 0,
  retailPrice: 0,
  wholesalePrice: 0,
  quantity: 0,
  unitRate: 1,
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
  info.unitRate = 1
  info.quantity = 0
}

const searchingProduct = async (text: string) => {
  product.value.id = 0
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

const selectProduct = async (productData?: Product) => {
  if (productData) {
    if (!productData.hasManageQuantity) {
      return message.error(`Sản phẩm ${productData.brandName} không theo dõi số lượng tồn kho`)
    }

    product.value = Product.clone(productData)
    info.productId = productData.id
    info.costPrice = productData.costPrice
    info.wholesalePrice = productData.wholesalePrice
    info.retailPrice = productData.retailPrice
    info.unitRate = productData.unitDefault.rate

    if (productData.hasManageBatches) {
      const batchListData = await batchStore.list({
        filter: {
          productId: productData.id,
          // quantity: { NOT: 0 },
          expiryDate: { GT: Date.now() },
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

const selectBatch = (data?: Batch) => {
  if (data) {
    batch.value = Batch.clone(data)
    info.expiryDate = data.expiryDate
    info.lotNumber = data.lotNumber
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
  receiptItem.unitRate = info.unitRate
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

  inputOptionsProduct.value?.clear()
  product.value = Product.blank()
  clearInfo()
  productList.value = []
  batchList.value = []
}
</script>

<template>
  <ModalProductUpsert ref="modalProductUpsert" @success="createProduct" />
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
          ref="inputOptionsProduct"
          :options="productList.map((i) => ({ value: i.id, text: i.brandName, data: i }))"
          :max-height="260"
          placeholder="(F3) Tìm kiếm bằng tên hoặc hoạt chất của sản phẩm"
          required
          @selectItem="({ data }) => selectProduct(data)"
          @update:text="searchingProduct"
        >
          <template #option="{ item: { data } }">
            <div>
              <b>{{ data.brandName }}</b> - {{ data.unitQuantity }} {{ data.unitDefaultName }} -
              G.Nhập {{ formatMoney(data.costPrice) }} - G.Bán {{ formatMoney(data.retailPrice) }}
            </div>
            <div>{{ data.substance }}</div>
          </template>
        </InputOptions>
      </div>
    </div>

    <div v-if="product?.hasManageBatches" class="mt-4 flex gap-4">
      <div style="flex: 1; flex-basis: 100%">
        <div>Nhập vào lô hàng</div>
        <div>
          <VueSelect
            v-model:value="info.batchId"
            :options="batchList.map((i: Batch) => ({ value: i.id, data: i }))"
            @select-item="({ data }) => selectBatch(data)"
          >
            <template #option="{ item: { data } }">
              <div v-if="!data.id">Tự động chọn lô</div>
              <div v-if="data.id">
                Lô {{ data.lotNumber }} {{ timeToText(data.expiryDate, 'DD/MM/YYYY') }} - Tồn
                <b> {{ data.unitQuantity }}</b> {{ product.unitDefaultName }} - G.Nhập
                <b> {{ formatMoney(data.unitCostPrice) }}</b>
              </div>
            </template>
            <template #text="{ content: { data } }">
              <div v-if="!data?.id">Tự động chọn lô</div>
              <div v-if="data?.id">
                Lô {{ data.lotNumber }} {{ timeToText(data.expiryDate, 'DD/MM/YYYY') }} - Tồn
                <b> {{ data.unitQuantity }}</b> {{ product.unitDefaultName }} - G.Nhập
                <b> {{ formatMoney(data.unitCostPrice) }}</b>
              </div>
            </template>
          </VueSelect>
        </div>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-4">
      <div v-if="product?.hasManageBatches" style="flex-grow: 1" class="basis-[90%] lg:basis-[45%]">
        <div>Số lô</div>
        <div>
          <InputText v-model:value="info.lotNumber" class="w-full" :disabled="!!!!info.batchId" />
        </div>
      </div>
      <div v-if="product!.hasManageBatches" style="flex-grow: 1" class="basis-[90%] lg:basis-[45%]">
        <div>Hạn sử dụng</div>
        <div>
          <InputDate
            v-model:value="info.expiryDate"
            typeParser="number"
            class="w-full"
            :disabled="!!info.batchId"
          />
        </div>
      </div>
      <div style="flex-grow: 1" class="basis-[90%] lg:basis-[45%]">
        <div>
          Số lượng
          <span :class="product?.quantity == 0 ? 'text-red-500 font-bold' : ''">
            (tồn:
            <b>
              {{ (info.batchId ? batch.quantity : product?.quantity) || 0 / info.unitRate }} </b
            >)
          </span>
          <span v-if="info.unitRate !== 1" class="italic">
            (<b>{{ info.quantity }}</b> {{ product.unitBasicName }})
          </span>
        </div>
        <div class="flex">
          <div style="width: 100px">
            <VueSelect
              v-model:value="info.unitRate"
              :disabled="product.unitObject.length <= 1"
              :options="product.unitObject.map((i) => ({ value: i.rate, text: i.name, data: i }))"
            >
            </VueSelect>
          </div>
          <div class="flex-1">
            <InputNumber
              :value="info.quantity / info.unitRate"
              required
              :validate="{ gt: 0 }"
              @update:value="(data) => (info.quantity = data * info.unitRate)"
            />
          </div>
        </div>
      </div>

      <div style="flex-grow: 1" class="basis-[90%] lg:basis-[45%]">
        <div>
          Giá nhập
          <span v-if="info.unitRate !== 1" class="italic">
            (<b>{{ formatMoney(info.costPrice) }} / </b> {{ product.unitBasicName }})
          </span>
        </div>
        <div>
          <InputMoney
            :value="Number((info.costPrice * info.unitRate).toFixed())"
            style="width: 100%"
            required
            :min="0"
            :prepend="product.getUnitNameByRate(info.unitRate)"
            @update:value="(data) => (info.costPrice = data / info.unitRate)"
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
          <span v-if="info.unitRate !== 1" class="italic">
            (<b>{{ formatMoney(info.wholesalePrice || 0) }} / </b> {{ product.unitBasicName }})
          </span>
        </div>
        <div>
          <InputMoney
            :value="Number((info.wholesalePrice * info.unitRate).toFixed())"
            style="width: 100%"
            :min="0"
            :prepend="product.getUnitNameByRate(info.unitRate)"
            @update:value="(data) => (info.wholesalePrice = data / info.unitRate)"
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
          <span v-if="info.unitRate !== 1" class="italic">
            (<b>{{ formatMoney(info.retailPrice) }} / </b> {{ product.unitBasicName }})
          </span>
        </div>
        <div>
          <InputMoney
            :value="Number((info.retailPrice * info.unitRate).toFixed())"
            style="width: 100%"
            :min="0"
            :prepend="product.getUnitNameByRate(info.unitRate)"
            required
            @update:value="(data) => (info.retailPrice = data / info.unitRate)"
          />
        </div>
      </div>
    </div>

    <div class="mt-6 flex justify-center">
      <VueButton type="submit" color="blue"><PlusOutlined /> Thêm sản phẩm</VueButton>
    </div>
  </form>
</template>

<style lang="scss"></style>
