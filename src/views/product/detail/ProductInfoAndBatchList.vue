<script setup lang="ts">
import { FileDoneOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { IconEditSquare } from '../../../common/icon-google'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import type { Batch } from '../../../modules/batch'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product, ProductApi } from '../../../modules/product'
import { timeToText } from '../../../utils'
import ModalBatchUpdate from './ModalBatchUpdate.vue'

const modalBatchUpdate = ref<InstanceType<typeof ModalBatchUpdate>>()

const props = withDefaults(defineProps<{ productId: number }>(), { productId: 0 })

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const product = ref<Product>(Product.blank())
const hasZeroQuantity = ref<boolean>(false)
const startFetchData = async () => {
  if (!props.productId) return

  try {
    const productResponse = await ProductApi.detail(props.productId, {
      relation: { batchList: true },
      filter: { batchList: { quantity: hasZeroQuantity.value ? undefined : { NOT: 0 } } },
    })
    productResponse.batchList?.forEach((i) => (i.product = productResponse))
    product.value = productResponse
  } catch (error) {
    console.log('🚀 ~ file: ProductInfo.vue:35 ~ startFetchData ~ error:', error)
  }
}

watch(
  () => props.productId,
  async (newValue) => {
    await startFetchData()
  },
  { immediate: true }
)

const handleModalBatchUpdateSuccess = async (data: Batch, type: 'UPDATE') => {
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

const handleZeroQuantity = async (value: 'true' | 'false') => {
  await startFetchData()
}
</script>

<template>
  <ModalBatchUpdate
    v-if="permissionIdMap[PermissionId.BATCH_UPDATE]"
    ref="modalBatchUpdate"
    @success="handleModalBatchUpdateSuccess" />
  <div>
    <table class="w-full">
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Mã sản phẩm</td>
        <td class="px-2 font-medium">PR{{ product.id }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Tên sản phẩm</td>
        <td class="px-2">
          {{ product.brandName }}
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Số lượng</td>
        <td class="px-2">
          <b>{{ product.unitQuantity }}</b>
          {{ product.unitDefaultName }}
          <span v-if="product.unitDefaultRate != 1" class="ml-2">
            (
            <b>{{ product.quantity }}</b>
            {{ product.unitBasicName }})
          </span>
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Giá nhập</td>
        <td class="px-2 font-medium">
          {{ formatMoney(product.unitCostPrice) }}
        </td>
      </tr>
      <tr v-if="settingStore.SYSTEM_SETTING.wholesalePrice">
        <td class="px-2 py-1 whitespace-nowrap">Giá bán sỉ</td>
        <td class="px-2 font-medium">
          {{ formatMoney(product.unitWholesalePrice) }}
        </td>
      </tr>
      <tr v-if="settingStore.SYSTEM_SETTING.retailPrice">
        <td class="px-2 py-1 whitespace-nowrap">Giá bán lẻ</td>
        <td class="px-2 font-medium">
          {{ formatMoney(product.unitRetailPrice) }}
        </td>
      </tr>
      <tr v-if="settingStore.SYSTEM_SETTING.retailPrice">
        <td class="px-2 py-1 whitespace-nowrap">Giá vốn trung bình</td>
        <td class="px-2 font-medium">
          {{ formatMoney(Math.floor(product.costAmount / (product.quantity || 1))) }}
        </td>
      </tr>
      <tr v-if="settingStore.SYSTEM_SETTING.retailPrice">
        <td class="px-2 py-1 whitespace-nowrap">Tổng vốn</td>
        <td class="px-2 font-medium">
          {{ formatMoney(product.costAmount) }}
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Hoạt chất</td>
        <td class="px-2">
          {{ product.substance }}
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Nhóm</td>
        <td class="px-2">
          {{ settingStore.PRODUCT_GROUP[product.group || 0] }}
        </td>
      </tr>

      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Đơn vị</td>
        <td class="px-2">
          {{ unitString(product) }}
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Đường dùng</td>
        <td class="px-2">
          {{ product.route }}
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Nguồn gốc</td>
        <td class="px-2">
          {{ product.source }}
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Gợi ý cách dùng</td>
        <td class="px-2">
          {{ product.hintUsage }}
        </td>
      </tr>
    </table>
  </div>

  <div v-if="product.hasManageBatches" class="mt-6">
    <div class="flex justify-between items-end">
      <div style="font-size: 1.2rem">
        <FileDoneOutlined style="margin-right: 10px" />
        <span>Lô Hàng</span>
      </div>

      <div class="cursor-pointer">
        <a-checkbox v-model:checked="hasZeroQuantity" @change="handleZeroQuantity">
          Hiển thị lô hàng đã hết
        </a-checkbox>
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
          <tr v-if="product.batchList?.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(batch, index) in product.batchList || []" :key="index">
            <td>
              <div>Mã: {{ batch.id }}</div>
              <div class="flex justify-between">
                <div v-if="batch.lotNumber">S.Lô: {{ batch.lotNumber }}</div>
                <div v-if="batch.expiryDate">
                  HSD:
                  <span style="font-weight: 500">
                    {{ timeToText(batch.expiryDate, 'DD/MM/YYYY') }}
                  </span>
                </div>
              </div>
              <div class="flex justify-between">
                <div>
                  G.Nhập:
                  <span style="font-weight: 500">{{ formatMoney(batch.costPrice) }}</span>
                </div>
                <span>G.Sỉ: {{ formatMoney(batch.wholesalePrice) }}</span>
                <span>G.Lẻ: {{ formatMoney(batch.retailPrice) }}</span>
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
                @click="modalBatchUpdate?.openModal(batch)">
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
            <th>Mã</th>
            <th>Lô-HSD</th>
            <th>Đ.Vị</th>
            <th>SL</th>
            <th v-if="permissionIdMap[PermissionId.READ_COST_PRICE]">G.Nhập</th>
            <th v-if="settingStore.SYSTEM_SETTING.wholesalePrice">G.Sỉ</th>
            <th v-if="settingStore.SYSTEM_SETTING.retailPrice">G.Lẻ</th>
            <th v-if="permissionIdMap[PermissionId.BATCH_UPDATE]">Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="product.batchList?.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(batch, index) in product.batchList || []" :key="index">
            <td class="text-center">PB{{ batch.id }}</td>
            <td class="text-center">
              <div class="flex justify-between gap-2">
                <div v-if="batch.lotNumber" class="flex-1">{{ batch.lotNumber }} -</div>
                <div v-if="batch.expiryDate" class="flex-1 text-center">
                  {{ timeToText(batch.expiryDate, 'DD/MM/YYYY') }}
                </div>
              </div>
            </td>
            <td class="text-center">
              {{ batch.product?.unitDefaultName }}
            </td>
            <td class="text-center">
              {{ batch.unitQuantity }}
            </td>
            <td v-if="permissionIdMap[PermissionId.READ_COST_PRICE]" class="text-right">
              {{ formatMoney(batch.unitCostPrice) }}
            </td>
            <td v-if="settingStore.SYSTEM_SETTING.wholesalePrice" class="text-right">
              {{ formatMoney(batch.unitWholesalePrice) }}
            </td>
            <td v-if="settingStore.SYSTEM_SETTING.retailPrice" class="text-right">
              {{ formatMoney(batch.unitRetailPrice) }}
            </td>
            <td>
              <div
                v-if="permissionIdMap[PermissionId.BATCH_UPDATE]"
                style="color: #eca52b"
                class="mx-1 text-xl flex items-center cursor-pointer justify-center"
                @click="modalBatchUpdate?.openModal(batch)">
                <IconEditSquare />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
