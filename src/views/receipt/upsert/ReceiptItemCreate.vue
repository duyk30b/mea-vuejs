<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconFileSearch } from '../../../common/icon'
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
import { Batch, BatchService } from '../../../modules/batch'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product, ProductService } from '../../../modules/product'
import { ReceiptItem } from '../../../modules/receipt-item/receipt-item.model'
import { Warehouse } from '../../../modules/warehouse'
import { WarehouseService } from '../../../modules/warehouse/warehouse.service'
import { arrayToKeyValue, timeToText } from '../../../utils'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import ModalProductUpsert from '../../product/upsert/ModalProductUpsert.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { receipt } from './receipt-upsert.store'
import { Distributor, DistributorService } from '../../../modules/distributor'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
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

const productOptions = ref<{ value: number; text: string; data: Product }[]>([])
const batchOptions = ref<{ value: number; text?: string; data: Batch; disabled?: boolean }[]>([])

const warehouseOptions = ref<{ value: number; text: string; data: Warehouse }[]>([])
const warehouseMap = ref<Record<string, Warehouse>>({})
const distributorMap = ref<Record<string, Distributor>>({})
const warehouseAll = ref<Warehouse[]>([])

const product = ref<Product>(Product.blank())
const receiptItem = ref<ReceiptItem>(ReceiptItem.blank())

onMounted(async () => {
  try {
    window.addEventListener('keydown', handleDocumentKeyup)
    const fetchData = await Promise.all([WarehouseService.list({}), DistributorService.getMap()])
    warehouseAll.value = fetchData[0]
    distributorMap.value = fetchData[1]
    warehouseMap.value = arrayToKeyValue(warehouseAll.value, 'id')
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
})

const handleFocusFirstSearchProduct = async () => {
  await Promise.all([ProductService.refreshDB(), BatchService.refreshDB()])
}

watch(
  () => receipt.value.distributorId,
  () => {
    receiptItem.value.batchId = 0
  }
)

const searchingProduct = async (text: string) => {
  product.value.id = 0
  if (!text) {
    productOptions.value = []
  } else {
    const productList = await ProductService.search(text)
    productOptions.value = productList.map((i) => {
      return { value: i.id, text: i.brandName, data: i }
    })
  }
}

const handleModalUpsertProductSuccess = (
  productSuccess: Product,
  type: 'CREATE' | 'UPDATE' | 'DESTROY'
) => {
  if (type === 'CREATE') {
    inputOptionsProduct.value?.setItem({
      text: productSuccess?.brandName,
      data: productSuccess,
      value: productSuccess?.id,
    })
    selectProduct(productSuccess)
  }
  if (type === 'UPDATE') {
    inputOptionsProduct.value?.setItem({
      text: productSuccess?.brandName,
      data: productSuccess,
      value: productSuccess?.id,
    })
    receiptItem.value.product = Product.from(productSuccess)
    product.value = Product.from(productSuccess)
  }
  if (type === 'DESTROY') {
    receiptItem.value = ReceiptItem.blank()
    product.value = Product.blank()
  }
}

const selectProduct = async (productData?: Product) => {
  if (productData) {
    product.value = Product.from(productData)

    if (!productData.hasManageQuantity) {
      return ModalStore.alert({
        title: 'Không thể nhập hàng cho sản phẩm này',
        content: ['Sản phẩm này đang ở chế độ không theo dõi số lượng tồn kho'],
      })
    }

    if (productData.warehouseIds === JSON.stringify([0])) {
      warehouseOptions.value = [
        ...warehouseAll.value.map((i) => ({ value: i.id, text: i.name, data: i })),
        { value: 0, text: 'Không chọn kho', data: Warehouse.blank() },
      ]
    } else {
      warehouseOptions.value = warehouseAll.value
        .filter((i) => productData.warehouseIdList.includes(i.id))
        .map((i) => ({ value: i.id, text: i.name, data: i }))
    }

    receiptItem.value.product = Product.from(productData)
    receiptItem.value.productId = productData.id
    receiptItem.value.batchId = 0
    receiptItem.value.unitRate = productData.unitDefault.rate

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
    newBatch.distributorId = receipt.value.distributorId
    newBatch.productId = productData.id
    newBatch.costPrice = productData.costPrice
    newBatch.warehouseId = warehouseOptions.value.at(-1)?.value || 0
    batchListData.push(newBatch)

    const productClone = Product.from(productData)
    batchListData.forEach((i) => (i.product = productClone))

    batchOptions.value = batchListData.map((i) => {
      return { value: i.id, data: i, disabled: i.distributorId !== receipt.value.distributorId }
    })
    selectBatch(batchListData.at(-1)!)

    // productOptions.value = []
  } else {
    clear()
  }
}

const selectBatch = (batchData?: Batch) => {
  if (!batchData) return
  receiptItem.value.batchId = batchData.id
  receiptItem.value.batch = Batch.from(batchData)

  receiptItem.value.warehouseId = batchData.warehouseId
  receiptItem.value.lotNumber = batchData.lotNumber
  receiptItem.value.expiryDate = batchData.expiryDate
  receiptItem.value.costPrice = batchData.costPrice
}

const addReceiptItem = async () => {
  try {
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

const closeExpiryDate = computed(() => Date.now())

const clear = () => {
  product.value = Product.blank()
  receiptItem.value = ReceiptItem.blank()
  batchOptions.value = []
  productOptions.value = []
  warehouseOptions.value = []
}
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProductUpsert ref="modalProductUpsert" @success="handleModalUpsertProductSuccess" />
  <form @submit.prevent="addReceiptItem">
    <div class="flex flex-wrap gap-4">
      <div style="flex-basis: 80%; flex-grow: 1">
        <div class="flex gap-1 flex-wrap">
          <span>Tên sản phẩm</span>
          <a v-if="product.id" @click="modalProductDetail?.openModal(product)">
            <IconFileSearch />
          </a>
          <span v-if="!product.hasManageQuantity" style="font-weight: 500; color: var(--text-red)">
            (Sản phẩm không quản lý tồn kho)
          </span>
          <div v-if="product.id">
            (
            <span
              v-if="product.hasManageQuantity"
              :class="product.quantity <= 0 ? 'text-red-500 font-bold' : ''">
              Tồn:
              <b>{{ product?.unitQuantity }} {{ product.unitDefaultName }}</b>
            </span>
            <span>
              - Giá bán
              <b>{{ formatMoney(product!.unitRetailPrice) }}</b>
            </span>
            )
          </div>
          <a
            v-if="permissionIdMap[PermissionId.PRODUCT_UPDATE] && product.id"
            @click="modalProductUpsert?.openModal(product.id)">
            Sửa thông tin sản phẩm
          </a>
          <div class="ml-auto">
            <a
              v-if="permissionIdMap[PermissionId.PRODUCT_CREATE] && !product.id"
              @click="modalProductUpsert?.openModal()">
              Thêm sản phẩm mới
            </a>
          </div>
        </div>
        <div style="height: 40px">
          <InputOptions
            ref="inputOptionsProduct"
            :options="productOptions"
            :max-height="260"
            placeholder="(F3) Tìm kiếm bằng tên hoặc hoạt chất của sản phẩm"
            required
            :disabled="!receipt.distributorId"
            @selectItem="({ data }) => selectProduct(data)"
            @onFocusinFirst="handleFocusFirstSearchProduct"
            @update:text="searchingProduct">
            <template #option="{ item: { data } }">
              <div>
                <b>{{ data.brandName }}</b>
                -
                <span :class="data.unitQuantity <= 0 ? 'text-red-500 font-bold' : ''">
                  {{ data.unitQuantity }}
                </span>
                {{ data.unitDefaultName }} - G.Nhập {{ formatMoney(data.costPrice) }} - G.Bán
                {{ formatMoney(data.retailPrice) }}
              </div>
              <div>{{ data.substance }}</div>
            </template>
          </InputOptions>
        </div>
      </div>

      <div style="flex-basis: 80%; flex-grow: 1" class="flex flex-wrap gap-4">
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Nhập vào lô hàng</div>
          <div>
            <VueSelect
              v-model:value="receiptItem.batchId"
              :options="
                batchOptions.map((i) => ({
                  ...i,
                  disabled: i.data.distributorId !== receipt.distributorId,
                }))
              "
              @select-item="({ data }) => selectBatch(data)">
              <!-- template #option  là nội dung hiên thị trong danh sách -->
              <template #option="{ item: { data } }">
                <div v-if="!data.id">Tự động chọn lô</div>
                <div v-if="data.id">
                  Lô {{ data.lotNumber }}
                  <span :style="data.expiryDate < closeExpiryDate ? 'color:red;' : ''">
                    {{ timeToText(data.expiryDate, 'DD/MM/YYYY') }}
                  </span>
                  -
                  <span :class="data.quantity <= 0 ? 'text-red-500 font-bold' : ''">
                    Tồn
                    <b>{{ data.unitQuantity }}</b>
                  </span>
                  {{ product.unitDefaultName }} - G.Nhập
                  <b>{{ formatMoney(data.unitCostPrice) }}</b>
                  - {{ warehouseMap[data.warehouseId]?.name }} -
                  {{ distributorMap[data.distributorId]?.fullName }}
                </div>
              </template>
              <!-- template #text  là nội dung hiên thị trên mask sau khi chọn -->
              <template #text="{ content: { data } }">
                <div v-if="!data?.id">Tự động chọn lô</div>
                <div v-if="data?.id">
                  Lô {{ data.lotNumber }}
                  <span :style="data.expiryDate < closeExpiryDate ? 'color:red;' : ''">
                    {{ timeToText(data.expiryDate, 'DD/MM/YYYY') }}
                  </span>
                  -
                  <span :class="data.quantity <= 0 ? 'text-red-500 font-bold' : ''">
                    Tồn
                    <b>{{ data.unitQuantity }}</b>
                  </span>
                  {{ product.unitDefaultName }} - G.Nhập
                  <b>{{ formatMoney(data.unitCostPrice) }}</b>
                  - {{ warehouseMap[data.warehouseId]?.name }}
                </div>
              </template>
            </VueSelect>
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsSelect.warehouse"
          style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Nhập vào kho hàng</div>
          <div>
            <VueSelect
              v-model:value="receiptItem.warehouseId"
              :options="warehouseOptions"
              :disabled="!!receiptItem.batchId"
              @update:value="receiptItem.batchId = 0"></VueSelect>
          </div>
        </div>
      </div>

      <div
        v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsSelect.lotNumberAndExpiryDate"
        style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
        <div>Số lô</div>
        <div>
          <InputText
            v-model:value="receiptItem.lotNumber"
            class="w-full"
            :disabled="!!receiptItem.batchId" />
        </div>
      </div>

      <div
        v-if="settingStore.SCREEN_RECEIPT_UPSERT.receiptItemsSelect.lotNumberAndExpiryDate"
        style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
        <div>Hạn sử dụng</div>
        <div>
          <InputDate
            v-model:value="receiptItem.expiryDate"
            :disabled="!!receiptItem.batchId"
            typeParser="number"
            class="w-full" />
        </div>
      </div>

      <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
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

      <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
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
    </div>
    <div class="mt-6 flex justify-center">
      <VueButton type="submit" color="blue" icon="plus">Thêm vào giỏ hàng</VueButton>
    </div>
  </form>
</template>

<style lang="scss"></style>
