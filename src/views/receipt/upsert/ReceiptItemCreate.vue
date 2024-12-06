<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Batch, BatchApi, BatchService } from '../../../modules/batch'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product, ProductService } from '../../../modules/product'
import { ReceiptItem } from '../../../modules/receipt-item/receipt-item.model'
import { timeToText } from '../../../utils'
import ModalProductUpsert from '../../product/upsert/ModalProductUpsert.vue'

const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const inputOptionsProduct = ref<InstanceType<typeof InputOptions>>()

const handleDocumentKeyup = (e: KeyboardEvent) => {
  if (e.key === 'F3') {
    e.preventDefault()
    inputOptionsProduct.value?.focus()
  }
}

const emit = defineEmits<{ (e: 'addReceiptItem', value: ReceiptItem): void }>()

const meStore = useMeStore()
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { permissionIdMap } = meStore

const productList = ref<Product[]>([])
const batchList = ref<Batch[]>([])

const product = ref<Product>(Product.blank())
const receiptItem = ref<ReceiptItem>(ReceiptItem.blank())

onMounted(async () => {
  try {
    window.addEventListener('keydown', handleDocumentKeyup)
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
})

const handleFocusFirstSearchProduct = async () => {
  try {
    await Promise.all([ProductService.refreshDB(), BatchService.refreshDB()])
  } catch (error) {
    console.log('🚀 ~ file: ReceiptItemCreate.vue:61 ~ error:', error)
  }
}

const searchingProduct = async (text: string) => {
  product.value.id = 0
  if (!text) {
    productList.value = []
  } else {
    productList.value = await ProductService.search(text)
  }
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
    product.value = Product.from(productData)

    if (!productData.hasManageQuantity) {
      return AlertStore.addError(
        `Sản phẩm ${productData.brandName} không theo dõi số lượng tồn kho`
      )
    }

    receiptItem.value.product = Product.from(productData)
    receiptItem.value.productId = productData.id
    receiptItem.value.batchId = 0
    receiptItem.value.lotNumber = productData.lotNumber
    receiptItem.value.expiryDate = productData.expiryDate
    receiptItem.value.costPrice = productData.costPrice
    receiptItem.value.wholesalePrice = productData.wholesalePrice
    receiptItem.value.retailPrice = productData.retailPrice
    receiptItem.value.unitRate = productData.unitDefault.rate

    if (productData.hasManageBatches) {
      const batchListData = await BatchService.list({
        filter: {
          productId: productData.id,
          // quantity: { NOT: 0 },
          $OR: [
            { expiryDate: { GT: Date.now() } },
            { expiryDate: { IS_NULL: true } },
            { quantity: { NOT: 0 } },
          ],
        },
        sort: { expiryDate: 'DESC' },
      })

      // thêm tự động chọn lô
      const newBatch = Batch.blank()
      newBatch.productId = productData.id
      newBatch.expiryDate = undefined
      newBatch.costPrice = productData.costPrice
      batchListData.push(newBatch)

      const productClone = Product.from(productData)
      batchListData.forEach((i) => (i.product = productClone))

      batchList.value = batchListData
      selectBatch(batchListData.at(-1)!)
    } else {
      batchList.value = []
    }

    productList.value = []
  } else {
    clear()
  }
}

const selectBatch = (data?: Batch) => {
  if (data) {
    receiptItem.value.batchId = data.id
    receiptItem.value.batch = Batch.from(data)
    if (data.id) {
      // nếu có lô thì mới cập nhật giá theo lô, còn không thì vẫn lấy giá theo giá sản phẩm
      receiptItem.value.lotNumber = data.lotNumber
      receiptItem.value.expiryDate = data.expiryDate
      receiptItem.value.costPrice = data.costPrice
      receiptItem.value.wholesalePrice = data.wholesalePrice
      receiptItem.value.retailPrice = data.retailPrice
    }
  }
}

const addReceiptItem = async () => {
  if (!receiptItem.value.quantity) {
    return AlertStore.addError('Lỗi: Số lượng phải lớn hơn 0')
  }
  if (!receiptItem.value.productId) {
    return AlertStore.addError('Lỗi: Sản phẩm không hợp lệ')
  }

  try {
    // nếu tự động chọn lô thì làm quả API
    if (!receiptItem.value.batchId && product.value.hasManageBatches) {
      const batchResponse = await BatchApi.findOrCreate(receiptItem.value)
      receiptItem.value.batch = batchResponse
      receiptItem.value.batchId = batchResponse.id
    }

    emit('addReceiptItem', receiptItem.value)

    inputOptionsProduct.value?.clear()
    clear()

    if (!isMobile) {
      inputOptionsProduct.value?.focus()
    }
  } catch (error) {
    console.log('🚀 ~ file: ReceiptItemCreate.vue:173 ~ addReceiptItem ~ error:', error)
  }
}

const closeExpiryDate = computed(() => {
  return Date.now()
})

const clear = () => {
  product.value = Product.blank()
  receiptItem.value = ReceiptItem.blank()
  batchList.value = []
  productList.value = []
}
</script>

<template>
  <ModalProductUpsert ref="modalProductUpsert" @success="createProduct" />
  <form @submit.prevent="addReceiptItem">
    <div>
      <div class="flex justify-between">
        <span>
          Tên sản phẩm
          <span v-if="!product.hasManageQuantity" style="font-weight: 500; color: var(--text-red)">
            (Sản phẩm không quản lý tồn kho)
          </span>
          <span
            v-if="product.id && product.hasManageQuantity"
            :class="product?.quantity == 0 ? 'text-red-500 font-bold' : ''">
            ( tồn:
            <b>{{ product?.unitQuantity }} {{ product.unitDefaultName }}</b>
            )
          </span>
        </span>
        <span>
          <a
            v-if="permissionIdMap[PermissionId.PRODUCT_CREATE]"
            @click="modalProductUpsert?.openModal()">
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
          @onFocusinFirst="handleFocusFirstSearchProduct"
          @update:text="searchingProduct">
          <template #option="{ item: { data } }">
            <div>
              <b>{{ data.brandName }}</b>
              - {{ data.unitQuantity }} {{ data.unitDefaultName }} - G.Nhập
              {{ formatMoney(data.costPrice) }} - G.Bán {{ formatMoney(data.retailPrice) }}
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
            v-model:value="receiptItem.batchId"
            :options="batchList.map((i: Batch) => ({ value: i.id, data: i }))"
            @select-item="({ data }) => selectBatch(data)">
            <template #option="{ item: { data } }">
              <div v-if="!data.id">Tự động chọn lô</div>
              <div v-if="data.id">
                Lô {{ data.lotNumber }}
                <span :style="data.expiryDate < closeExpiryDate ? 'color:red;' : ''">
                  {{ timeToText(data.expiryDate, 'DD/MM/YYYY') }}
                </span>
                - Tồn
                <b>{{ data.unitQuantity }}</b>
                {{ product.unitDefaultName }} - G.Nhập
                <b>{{ formatMoney(data.unitCostPrice) }}</b>
              </div>
            </template>
            <template #text="{ content: { data } }">
              <div v-if="!data?.id">Tự động chọn lô</div>
              <div v-if="data?.id">
                Lô {{ data.lotNumber }}
                <span :style="data.expiryDate < closeExpiryDate ? 'color:red;' : ''">
                  {{ timeToText(data.expiryDate, 'DD/MM/YYYY') }}
                </span>
                - Tồn
                <b>{{ data.unitQuantity }}</b>
                {{ product.unitDefaultName }} - G.Nhập
                <b>{{ formatMoney(data.unitCostPrice) }}</b>
              </div>
            </template>
          </VueSelect>
        </div>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-4">
      <div style="flex-grow: 1" class="basis-[90%] lg:basis-[45%]">
        <div>Số lô</div>
        <div>
          <InputText
            v-model:value="receiptItem.lotNumber"
            class="w-full"
            :disabled="
              !!receiptItem.batchId || (!product.hasManageBatches && !!product.lotNumber)
            " />
        </div>
      </div>

      <div style="flex-grow: 1" class="basis-[90%] lg:basis-[45%]">
        <div>Hạn sử dụng</div>
        <div>
          <InputDate
            v-model:value="receiptItem.expiryDate"
            :disabled="!!receiptItem.batchId || (!product.hasManageBatches && !!product.expiryDate)"
            typeParser="number"
            class="w-full" />
        </div>
      </div>

      <div style="flex-grow: 1" class="basis-[90%] lg:basis-[45%]">
        <div>
          Số lượng
          <span v-if="receiptItem.unitRate !== 1" class="italic">
            (
            <b>{{ receiptItem.quantity }}</b>
            {{ product.unitBasicName }})
          </span>
        </div>
        <div class="flex">
          <div style="width: 100px">
            <VueSelect
              v-model:value="receiptItem.unitRate"
              :disabled="product.unitObject.length <= 1"
              :options="
                product.unitObject.map((i) => ({ value: i.rate, text: i.name, data: i }))
              " />
          </div>
          <div class="flex-1">
            <InputNumber v-model:value="receiptItem.unitQuantity" required :validate="{ gt: 0 }" />
          </div>
        </div>
      </div>

      <div style="flex-grow: 1" class="basis-[90%] lg:basis-[45%]">
        <div>
          Giá nhập
          <span v-if="receiptItem.unitRate !== 1" class="italic">
            (
            <b>{{ formatMoney(receiptItem.costPrice) }} /</b>
            {{ product.unitBasicName }})
          </span>
        </div>
        <div>
          <InputMoney
            v-model:value="receiptItem.unitCostPrice"
            :disabled="!!receiptItem.batchId"
            style="width: 100%"
            required
            :min="0"
            :prepend="product.getUnitNameByRate(receiptItem.unitRate)" />
        </div>
      </div>

      <div
        v-if="settingStore.SYSTEM_SETTING.wholesalePrice"
        style="flex-grow: 1"
        class="basis-[90%] lg:basis-[45%]">
        <div>
          Giá bán sỉ
          <span v-if="receiptItem.unitRate !== 1" class="italic">
            (
            <b>{{ formatMoney(receiptItem.wholesalePrice || 0) }} /</b>
            {{ product.unitBasicName }})
          </span>
        </div>
        <div>
          <InputMoney
            v-model:value="receiptItem.unitWholesalePrice"
            style="width: 100%"
            :min="0"
            :prepend="product.getUnitNameByRate(receiptItem.unitRate)" />
        </div>
      </div>

      <div
        v-if="settingStore.SYSTEM_SETTING.retailPrice"
        style="flex-grow: 1"
        class="basis-[90%] lg:basis-[45%]">
        <div>
          Giá bán lẻ
          <span v-if="receiptItem.unitRate !== 1" class="italic">
            (
            <b>{{ formatMoney(receiptItem.retailPrice) }} /</b>
            {{ product.unitBasicName }})
          </span>
        </div>
        <div>
          <InputMoney
            v-model:value="receiptItem.unitRetailPrice"
            style="width: 100%"
            :min="0"
            :prepend="product.getUnitNameByRate(receiptItem.unitRate)"
            required />
        </div>
      </div>
    </div>

    <div class="mt-6 flex justify-center">
      <VueButton type="submit" color="blue" icon="plus">Thêm vào giỏ hàng</VueButton>
    </div>
  </form>
</template>

<style lang="scss"></style>
