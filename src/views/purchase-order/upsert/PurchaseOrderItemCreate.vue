<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import VueButton from '@/common/VueButton.vue'
import { IconFileSearch } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert'
import {
  InputDate,
  InputMoney,
  InputNumber,
  InputOptions,
  InputSelect,
  InputText,
  VueSelect,
} from '@/common/vue-form'
import type { VueSelectOption } from '@/common/vue-form/VueSelect.vue'
import { MeService } from '@/modules/_me/me.service.ts'
import { useSettingStore } from '@/modules/_me/setting.store.ts'
import { Batch, BatchService } from '@/modules/batch'
import { Distributor, DistributorService } from '@/modules/distributor'
import { PermissionId } from '@/modules/permission/permission.enum.ts'
import { Product, ProductService } from '@/modules/product'
import { PurchaseOrderItem } from '@/modules/purchase-order-item'
import { Warehouse, WarehouseService } from '@/modules/warehouse'
import { arrayToKeyValue, timeToText } from '@/utils'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import ModalProductUpsert from '../../product/upsert/ModalProductUpsert.vue'
import { purchaseOrder, warehouseId } from './purchase-order-upsert.store'
import { ProductType } from '@/modules/enum.ts'
import { CONFIG } from '@/config'
import { BugDevelopment } from '@/views/component'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const inputOptionsProduct = ref<InstanceType<typeof InputOptions>>()

const handleDocumentKeyup = (e: KeyboardEvent) => {
  if (e.key === 'F3') {
    e.preventDefault()
    inputOptionsProduct.value?.focus()
  }
}

const emit = defineEmits<{ (e: 'addPurchaseOrderItem', value: PurchaseOrderItem): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const productOptions = ref<{ value: number; text: string; data: Product }[]>([])
const batchOptions = ref<{ value: number; text?: string; data: Batch; disabled?: boolean }[]>([])

const warehouseMap = ref<Record<string, Warehouse>>({})
const distributorMap = ref<Record<string, Distributor>>({})

const warehouseAll = ref<Warehouse[]>([])
const warehouseOptions = ref<VueSelectOption<Warehouse>[]>([])

const product = ref<Product>(Product.blank())
const purchaseOrderItem = ref<PurchaseOrderItem>(PurchaseOrderItem.blank())

onMounted(async () => {
  try {
    window.addEventListener('keydown', handleDocumentKeyup)
    const fetchData = await Promise.all([WarehouseService.list({}), DistributorService.getMap()])
    warehouseAll.value = fetchData[0]
    distributorMap.value = fetchData[1]

    warehouseMap.value = arrayToKeyValue(warehouseAll.value, 'id')
    warehouseOptions.value = [
      ...warehouseAll.value.map((i) => ({ value: i.id, text: i.name, data: i })),
      { value: 0, text: 'Không chọn kho', data: Warehouse.blank() },
    ]
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
  () => purchaseOrder.value.distributorId,
  () => {
    purchaseOrderItem.value.batchId = 0
  },
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
  type: 'CREATE' | 'UPDATE' | 'DESTROY',
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
    purchaseOrderItem.value.product = Product.from(productSuccess)
    product.value = Product.from(productSuccess)
  }
  if (type === 'DESTROY') {
    purchaseOrderItem.value = PurchaseOrderItem.blank()
    product.value = Product.blank()
  }
}

const selectProduct = async (productData?: Product) => {
  if (productData) {
    product.value = Product.from(productData)

    if (productData.warehouseIds === '[]') {
      return AlertStore.addWarning('Sản phẩm này đang ở chế độ không quản lý số lượng tồn kho')
    }

    purchaseOrderItem.value.product = Product.from(productData)
    purchaseOrderItem.value.productId = productData.id
    purchaseOrderItem.value.batchId = 0
    purchaseOrderItem.value.unitRate = productData.unitDefaultRate

    const batchListData = await BatchService.list({
      filter: { productId: productData.id, isActive: 1 },
      sort: { expiryDate: 'DESC' },
    })

    // thêm tự động chọn lô
    const newBatch = Batch.blank()
    newBatch.distributorId = purchaseOrder.value.distributorId
    newBatch.productId = productData.id
    newBatch.costPrice = productData.costPrice
    batchListData.push(newBatch)

    batchListData.forEach((i) => {
      i.product = Product.basic(productData)
    })

    batchOptions.value = batchListData.map((i) => {
      return { value: i.id, data: i }
    })

    if (productData.productType === ProductType.Basic) {
      selectBatch(batchListData[0])
    }

    if (productData.productType === ProductType.SplitBatch) {
      selectBatch(batchListData[batchListData.length - 1])
    }

    // productOptions.value = []
  } else {
    clear()
  }
}

const selectBatch = (batchData?: Batch) => {
  if (!batchData) return
  purchaseOrderItem.value.batchId = batchData.id
  purchaseOrderItem.value.batch = Batch.from(batchData)

  purchaseOrderItem.value.warehouseId = batchData.warehouseId
  purchaseOrderItem.value.lotNumber = batchData.lotNumber
  purchaseOrderItem.value.expiryDate = batchData.expiryDate
  purchaseOrderItem.value.unitCostPrice = batchData.costPrice * purchaseOrderItem.value.unitRate
  purchaseOrderItem.value.unitListPrice =
    (batchData.product?.retailPrice || 0) * purchaseOrderItem.value.unitRate
}

const addPurchaseOrderItem = async () => {
  try {
    purchaseOrderItem.value.warehouseId = warehouseId.value
    emit('addPurchaseOrderItem', purchaseOrderItem.value)
    inputOptionsProduct.value?.clear()
    clear()
  } catch (error) {
    console.log('🚀 ~ file: PurchaseOrderItemCreate.vue:173 ~ addPurchaseOrderItem ~ error:', error)
  }
}

const closeExpiryDate = computed(() => Date.now())

const clear = () => {
  product.value = Product.blank()
  purchaseOrderItem.value = PurchaseOrderItem.blank()
  batchOptions.value = []
  productOptions.value = []
}
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProductUpsert ref="modalProductUpsert" @success="handleModalUpsertProductSuccess" />
  <form @submit.prevent="addPurchaseOrderItem">
    <div class="flex flex-wrap gap-4">
      <div style="flex-basis: 80%; flex-grow: 1">
        <div class="flex gap-1 flex-wrap">
          <span>Tên sản phẩm</span>
          <a v-if="product.id" @click="modalProductDetail?.openModal(product)">
            <IconFileSearch />
          </a>
          <span
            v-if="product.warehouseIds === '[]'"
            style="font-weight: 500; color: var(--text-red)"
          >
            (Sản phẩm không quản lý tồn kho)
          </span>
          <div v-if="product.id">
            (
            <span
              v-if="product.warehouseIds !== '[]'"
              :class="product.quantity <= 0 ? 'text-red-500 font-bold' : ''"
            >
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
            v-if="userPermission[PermissionId.PRODUCT_UPDATE] && product.id"
            @click="modalProductUpsert?.openModal(product.id)"
          >
            Sửa thông tin sản phẩm
          </a>
          <div style="margin-left: auto">
            <a
              v-if="userPermission[PermissionId.PRODUCT_CREATE] && !product.id"
              @click="modalProductUpsert?.openModal()"
            >
              Thêm sản phẩm mới
            </a>
          </div>
        </div>
        <div style="height: 40px">
          <InputOptions
            ref="inputOptionsProduct"
            :max-height="260"
            :options="productOptions"
            :prepend="purchaseOrderItem.product?.productCode"
            placeholder="(F3) Tìm kiếm bằng mã, tên hoặc hoạt chất của sản phẩm"
            required
            @onFocusinFirst="handleFocusFirstSearchProduct"
            @selectItem="({ data }) => selectProduct(data)"
            @searching="searchingProduct"
          >
            <template #option="{ item: { data } }">
              <div>
                <span>{{ data.productCode }}</span>
                <span class="mx-1">-</span>
                <b>{{ data.brandName }}</b>
                <span class="mx-1">-</span>
                <span :class="data.unitQuantity <= 0 ? 'text-red-500 font-bold' : ''">
                  {{ data.unitQuantity }} {{ data.unitDefaultName }}
                </span>
                <span class="mx-1">-</span>
                <span>G.Nhập {{ formatMoney(data.costPrice) }}</span>
                <span class="mx-1">-</span>
                <span>G.Bán {{ formatMoney(data.retailPrice) }}</span>
              </div>
              <div>{{ data.substance }}</div>
            </template>
          </InputOptions>
        </div>
      </div>

      <div
        v-if="purchaseOrderItem.product?.productType === ProductType.SplitBatch"
        style="flex-basis: 80%; flex-grow: 1; min-width: 300px"
      >
        <div>Nhập vào lô hàng</div>
        <div>
          <VueSelect
            v-model:value="purchaseOrderItem.batchId"
            :options="batchOptions"
            @select-item="({ data }) => selectBatch(data)"
          >
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
        v-if="settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsSelect.warehouse"
        style="flex-basis: 40%; flex-grow: 1; min-width: 300px"
      >
        <div>Nhập vào kho hàng</div>
        <div>
          <VueSelect
            v-model:value="warehouseId"
            :disabled="!!purchaseOrderItem.batchId"
            :options="warehouseOptions"
          ></VueSelect>
        </div>
      </div>

      <div
        v-if="
          settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsSelect.lotNumberAndExpiryDate
        "
        style="flex-basis: 40%; flex-grow: 1; min-width: 300px"
      >
        <div>Số lô / Mã lô</div>
        <div>
          <InputText v-model:value="purchaseOrderItem.lotNumber" class="w-full" />
        </div>
      </div>

      <div
        v-if="
          settingStore.SCREEN_PURCHASE_ORDER_UPSERT.purchaseOrderItemsSelect.lotNumberAndExpiryDate
        "
        style="flex-basis: 40%; flex-grow: 1; min-width: 300px"
      >
        <div>Hạn sử dụng</div>
        <div>
          <InputDate
            v-model:value="purchaseOrderItem.expiryDate"
            class="w-full"
            typeParser="number"
          />
        </div>
      </div>

      <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
        <div>
          Số lượng
          <span v-if="purchaseOrderItem.unitRate !== 1" class="italic">
            (
            <b>{{ purchaseOrderItem.quantity }}</b>
            {{ product.unitBasicName }})
          </span>
        </div>
        <div class="flex">
          <div style="width: 100px">
            <InputSelect
              :value="purchaseOrderItem.unitRate"
              :disabled="product.unitObject.length <= 1"
              :options="product.unitObject.map((i) => ({ value: i.rate, label: i.name, data: i }))"
              @update:value="(v: any) => purchaseOrderItem.changeUnitRate(v)"
            />
          </div>
          <div class="flex-1">
            <InputNumber
              v-model:value="purchaseOrderItem.unitQuantity"
              :validate="{ gt: 0 }"
              required
            />
          </div>
        </div>
      </div>

      <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
        <div>
          Giá nhập
          <span v-if="purchaseOrderItem.unitRate !== 1" class="italic">
            (
            <b>{{ formatMoney(purchaseOrderItem.costPrice) }} /</b>
            {{ product.unitBasicName }})
          </span>
        </div>
        <div>
          <InputMoney
            v-model:value="purchaseOrderItem.unitCostPrice"
            :min="0"
            :prepend="purchaseOrderItem.unitName"
            required
            style="width: 100%"
          />
        </div>
      </div>

      <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
        <div>
          Giá bán
          <span v-if="purchaseOrderItem.unitRate !== 1" class="italic">
            (
            <b>{{ formatMoney(purchaseOrderItem.listPrice) }} /</b>
            {{ product.unitBasicName }})
          </span>
        </div>
        <div>
          <InputMoney
            v-model:value="purchaseOrderItem.unitListPrice"
            :min="0"
            :prepend="purchaseOrderItem.unitName"
            required
            style="width: 100%"
          />
        </div>
      </div>
    </div>
    <div class="mt-6 flex justify-center items-center gap-4">
      <div v-if="CONFIG.MODE === 'development'">
        <BugDevelopment :data="purchaseOrderItem" />
      </div>
      <VueButton color="blue" icon="plus" type="submit">Thêm vào giỏ hàng</VueButton>
    </div>
  </form>
</template>

<style lang="scss"></style>
