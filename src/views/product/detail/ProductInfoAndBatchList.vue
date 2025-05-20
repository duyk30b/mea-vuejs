<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { IconMergeCells, IconRead } from '../../../common/icon-antd'
import { IconEditSquare } from '../../../common/icon-google'
import { InputCheckbox } from '../../../common/vue-form'
import VueButton from '../../../common/VueButton.vue'
import { MeService } from '../../../modules/_me/me.service'
import { useMeStore } from '../../../modules/_me/me.store'
import { BatchDistributorIdRule, BatchWarehouseIdRule } from '../../../modules/_me/setting.default'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Batch, BatchService } from '../../../modules/batch'
import { Distributor, DistributorService } from '../../../modules/distributor'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product, ProductService } from '../../../modules/product'
import type { Warehouse } from '../../../modules/warehouse'
import { WarehouseService } from '../../../modules/warehouse/warehouse.service'
import { ESTimer } from '../../../utils'
import ModalBatchMerge from './ModalBatchMerge.vue'
import ModalBatchUpdate from './ModalBatchUpdate.vue'
import { InventoryStrategy } from '../../../modules/enum'

const modalBatchUpdate = ref<InstanceType<typeof ModalBatchUpdate>>()
const modalBatchMerge = ref<InstanceType<typeof ModalBatchMerge>>()

const emit = defineEmits<{ (e: 'changeProduct', value: Product): void }>()

const props = withDefaults(defineProps<{ productId: number }>(), { productId: 0 })

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const productSetting = ref(MeService.getProductSetting())

const hasZeroQuantity = ref<boolean>(false)
const warehouseMap = ref<Record<string, Warehouse>>({})
const distributorMap = ref<Record<string, Distributor>>({})

const product = ref<Product>(Product.blank())
const batchList = ref<Batch[]>([])

onMounted(async () => {
  const fetchPromise = await Promise.all([WarehouseService.getMap(), DistributorService.getMap()])
  warehouseMap.value = fetchPromise[0]
  distributorMap.value = fetchPromise[1]
})

const fetchBatchList = async () => {
  batchList.value = await BatchService.list({
    filter: {
      productId: props.productId,
      quantity: hasZeroQuantity.value ? undefined : { NOT: 0 },
    },
    sort: { registeredAt: 'ASC' },
  })
  batchList.value.forEach((i) => (i.product = product.value))
}

const fetchProduct = async () => {
  product.value = await ProductService.detail(
    props.productId,
    { relation: { productGroup: true } },
    { refetch: true },
  )
}

const startFetchData = async () => {
  if (!props.productId) return
  try {
    await Promise.all([fetchProduct(), fetchBatchList()])
    batchList.value.forEach((i) => (i.product = product.value))
  } catch (error) {
    console.log('🚀 ~ file: ProductInfo.vue:35 ~ startFetchData ~ error:', error)
  }
}

watch(
  () => props.productId,
  async (newValue) => {
    await startFetchData()
  },
  { immediate: true },
)

const handleModalBatchUpdateSuccess = async (data: Batch, type: 'UPDATE' | 'DESTROY') => {
  await startFetchData()
  if (data.product) {
    emit('changeProduct', data.product)
  }
}

const handleModalBatchMergeSuccess = async () => {
  await startFetchData()
}

const unitString = (data: Product) => {
  let result = data.unitBasicName
  for (let i = 1; i < (data.unitObject.length || 0); i++) {
    const currentUnit = data.unitObject[i]
    result += `, ${currentUnit.name} (${currentUnit.rate} ${data.unitBasicName})`
  }
  return result
}

const closeExpiryDate = computed(() => {
  return Date.now() + 6 * 30 * 24 * 60 * 60 * 1000
})
</script>

<template>
  <ModalBatchUpdate
    v-if="permissionIdMap[PermissionId.BATCH_UPDATE]"
    ref="modalBatchUpdate"
    @success="handleModalBatchUpdateSuccess"
  />
  <ModalBatchMerge
    v-if="permissionIdMap[PermissionId.BATCH_UPDATE]"
    ref="modalBatchMerge"
    @success="handleModalBatchMergeSuccess"
  />
  <div class="mt-4 flex flex-wrap">
    <div style="flex-basis: 45%; flex: 1; min-width: 300px">
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">ID sản phẩm</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0" class="font-medium">
          {{ product.id }}
        </div>
      </div>
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Mã sản phẩm</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0" class="font-medium">
          {{ product.productCode }}
        </div>
      </div>
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Tên sản phẩm</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0" class="font-medium">
          {{ product.brandName }}
        </div>
      </div>
      <div class="my-2 flex gap-4 items-center">
        <div style="width: 100px; flex-shrink: 0">Số lượng</div>
        <div
          v-if="product.inventoryStrategyFix !== InventoryStrategy.NoImpact"
          style="flex-shrink: 1; flex-grow: 1; flex-basis: 0"
        >
          <b style="font-size: 1.2em; color: var(--text-red)">{{ product.unitQuantity }}</b>
          {{ product.unitDefaultName }}
          <span v-if="product.unitDefaultRate != 1" class="ml-2">
            (
            <b>{{ product.quantity }}</b>
            {{ product.unitBasicName }})
          </span>
        </div>
        <div v-else style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">
          <span style="font-size: 1.2em; color: var(--text-red)">Không quản lý tồn kho</span>
        </div>
      </div>
      <div v-if="permissionIdMap[PermissionId.READ_COST_PRICE]" class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Giá nhập</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">
          <b>{{ formatMoney(product.unitCostPrice) }}</b>
          / {{ product.unitDefaultName }}
        </div>
      </div>
      <div v-if="settingStore.SYSTEM_SETTING.wholesalePrice" class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Giá bán sỉ</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">
          <b>{{ formatMoney(product.unitWholesalePrice) }}</b>
          / {{ product.unitDefaultName }}
        </div>
      </div>
      <div v-if="settingStore.SYSTEM_SETTING.retailPrice" class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Giá bán lẻ</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">
          <b>{{ formatMoney(product.unitRetailPrice) }}</b>
          / {{ product.unitDefaultName }}
        </div>
      </div>
    </div>
    <div style="flex-basis: 45%; flex: 1; min-width: 300px">
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Nhóm</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">
          {{ product.productGroup?.name }}
        </div>
      </div>
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Hoạt chất</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">{{ product.substance }}</div>
      </div>
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Đơn vị</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">{{ unitString(product) }}</div>
      </div>
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Đường dùng</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">{{ product.route }}</div>
      </div>
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Nguồn gốc</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">{{ product.source }}</div>
      </div>
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Gợi ý cách dùng</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">{{ product.hintUsage }}</div>
      </div>
    </div>
  </div>

  <div class="mt-6">
    <div class="flex flex-wrap items-center gap-4">
      <div style="font-size: 1.2rem" class="flex items-center gap-2">
        <span><IconRead /></span>
        <span>Lô Hàng</span>
      </div>

      <div class="ml-auto">
        <VueButton size="small" @click="modalBatchMerge?.openModal(productId)">
          <IconMergeCells />
          Gộp lô
        </VueButton>
      </div>

      <div class="cursor-pointer">
        <InputCheckbox v-model:value="hasZeroQuantity" @change="fetchBatchList">
          Hiển thị lô hàng có số lượng = 0
        </InputCheckbox>
      </div>
    </div>
    <div v-if="isMobile" class="table-wrapper mt-2">
      <table>
        <thead>
          <tr>
            <th>Lô</th>
            <th>SL</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="batchList?.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(batch, index) in batchList || []" :key="index">
            <td>
              <div>Mã: {{ batch.id }}</div>
              <div class="flex justify-between">
                <div v-if="batch.batchCode">S.Lô: {{ batch.batchCode }}</div>
                <div
                  v-if="batch.expiryDate"
                  :style="batch.expiryDate < closeExpiryDate ? 'color:red; font-weight:500' : ''"
                >
                  HSD: {{ ESTimer.timeToText(batch.expiryDate, 'DD/MM/YYYY') }}
                </div>
              </div>
              <div
                v-if="permissionIdMap[PermissionId.READ_COST_PRICE]"
                class="flex justify-between"
                style="font-size: 0.9em"
              >
                <span>G.Nhập: {{ formatMoney(batch.costPrice) }}</span>
              </div>
              <div v-if="productSetting.batch_warehouseId === BatchWarehouseIdRule.SplitOnDifferent">
                Kho: {{ warehouseMap[batch.warehouseId]?.name }}
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ batch.quantity }}
            </td>
            <td>
              <div
                v-if="permissionIdMap[PermissionId.BATCH_UPDATE]"
                style="color: #eca52b"
                class="mx-1 text-xl flex items-center cursor-pointer justify-center"
                @click="modalBatchUpdate?.openModal(batch)"
              >
                <IconEditSquare />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!isMobile" class="table-wrapper mt-2">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Mã lô</th>
            <th>HSD</th>
            <th>SL</th>
            <th v-if="permissionIdMap[PermissionId.READ_COST_PRICE]">G.Nhập</th>
            <th v-if="productSetting.batch_warehouseId === BatchWarehouseIdRule.SplitOnDifferent">Kho</th>
            <th v-if="productSetting.batch_distributorId === BatchDistributorIdRule.SplitOnDifferent">
              NCC
            </th>
            <th v-if="permissionIdMap[PermissionId.BATCH_UPDATE]">Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="batchList?.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(batch, index) in batchList || []" :key="index">
            <td class="text-center">{{ batch.id }}</td>
            <td class="text-center">{{ batch.batchCode }}</td>
            <td class="text-center">
              <div
                v-if="batch.expiryDate"
                :style="batch.expiryDate < closeExpiryDate ? 'color:red; font-weight:500' : ''"
              >
                {{ ESTimer.timeToText(batch.expiryDate, 'DD/MM/YYYY') }}
              </div>
            </td>
            <td class="text-center">
              {{ batch.unitQuantity }}
            </td>
            <td v-if="permissionIdMap[PermissionId.READ_COST_PRICE]" class="text-right">
              {{ formatMoney(batch.unitCostPrice) }}
            </td>
            <td
              v-if="productSetting.batch_warehouseId === BatchWarehouseIdRule.SplitOnDifferent"
              class="text-center"
            >
              {{ warehouseMap[batch.warehouseId]?.name }}
            </td>
            <td
              v-if="productSetting.batch_distributorId === BatchDistributorIdRule.SplitOnDifferent"
              class="text-center"
            >
              {{ distributorMap[batch.distributorId]?.fullName }}
            </td>
            <td>
              <div
                v-if="permissionIdMap[PermissionId.BATCH_UPDATE]"
                style="color: #eca52b"
                class="mx-1 text-xl flex items-center cursor-pointer justify-center"
                @click="modalBatchUpdate?.openModal(batch)"
              >
                <IconEditSquare />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
