<script setup lang="ts">
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  FormOutlined,
} from '@ant-design/icons-vue'
import { Modal, message } from 'ant-design-vue'
import { createVNode, ref, watch } from 'vue'
import { VueSelect } from '../../../common/vue-form'
import { Product } from '../../../modules/product'
import { Batch, BatchApi, useBatchStore } from '../../../modules/batch'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { timeToText } from '../../../utils'
import ModalBatchUpdate from './ModalBatchUpdate.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { PermissionId } from '../../../modules/permission/permission.enum'

const modalBatchUpdate = ref<InstanceType<typeof ModalBatchUpdate>>()

const props = withDefaults(defineProps<{ product: Product }>(), { product: () => Product.blank() })

const screenStore = useScreenStore()
const batchStore = useBatchStore()
const { formatMoney, isMobile } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PRODUCT_BATCH_PAGINATION_LIMIT')) || 10)
const total = ref(0)
const batches = ref<Batch[]>([])

const hasZeroQuantity = ref<boolean>(false)

const startFetchData = async () => {
  if (!props.product.hasManageBatches) return

  await batchStore.refreshDB()
  try {
    const pagination = await batchStore.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        productId: props.product.id,
        quantity: hasZeroQuantity.value ? undefined : { NOT: 0 },
      },
      sort: { id: 'DESC' },
    })
    const productClone = Product.clone(props.product)
    pagination.data.forEach((i) => (i.product = productClone))

    batches.value = pagination.data
    total.value = pagination.total
  } catch (error) {
    console.log('🚀 ~ file: Batch.vue:41 ~ error:', error)
  }
}

watch(
  () => props.product.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else batches.value = []
  },
  { immediate: true }
)

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('PRODUCT_BATCH_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const handleModalBatchUpdateSuccess = async (data: Batch, type: 'UPDATE') => {
  await startFetchData()
}

const unitString = (data: Product) => {
  let result = data.unitBasicName
  for (let i = 1; i < (data.unit.length || 0); i++) {
    const currentUnit = data.unit[i]
    result += `, ${currentUnit.name} (${currentUnit.rate} ${data.unitBasicName})`
  }
  return result
}

const handleChangeStatus = async (value: 'true' | 'false') => {
  await startFetchData()
}
</script>

<template>
  <ModalBatchUpdate
    v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_UPDATE]"
    ref="modalBatchUpdate"
    @success="handleModalBatchUpdateSuccess"
  />
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
          <b>{{ product.unitQuantity }}</b> {{ product.unitName }}
          <span v-if="product.unitRate != 1" class="ml-2">
            (<b>{{ product.quantity }}</b> {{ product.unitBasicName }})
          </span>
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Giá nhập</td>
        <td class="px-2 font-medium">
          {{ formatMoney(product.unitCostPrice) }}
        </td>
      </tr>
      <tr v-if="screenStore.SYSTEM_SETTING.wholesalePrice">
        <td class="px-2 py-1 whitespace-nowrap">Giá bán sỉ</td>
        <td class="px-2 font-medium">
          {{ formatMoney(product.unitWholesalePrice) }}
        </td>
      </tr>
      <tr v-if="screenStore.SYSTEM_SETTING.retailPrice">
        <td class="px-2 py-1 whitespace-nowrap">Giá bán lẻ</td>
        <td class="px-2 font-medium">
          {{ formatMoney(product.unitRetailPrice) }}
        </td>
      </tr>
      <tr v-if="screenStore.SYSTEM_SETTING.retailPrice">
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
          {{ screenStore.PRODUCT_GROUP[product.group || 0] }}
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

      <div>
        <a-checkbox v-model:checked="hasZeroQuantity" @change="handleChangeStatus">
          Hiển thị lô hàng đã hết
        </a-checkbox>
      </div>
    </div>
    <div v-if="isMobile" class="mt-2">
      <table class="table-mobile">
        <thead>
          <tr>
            <th>Lô</th>
            <th>SL</th>
            <th v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE]">Tiền vốn</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="batches.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(batch, index) in batches" :key="index">
            <td>
              <div>Mã: {{ batch.id }}</div>
              <div>S.Lô: {{ batch.lotNumber }}</div>
              <div>HSD: {{ timeToText(batch.expiryDate, 'DD/MM/YYYY') }}</div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ batch.quantity }}
            </td>
            <td class="text-right whitespace-nowrap">
              <div v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE]">
                {{ formatMoney(batch.costAmount) }}
              </div>
            </td>
            <td class="text-center">
              <div class="flex flex-col">
                <a
                  v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_UPDATE]"
                  style="color: #eca52b"
                  class="text-base"
                  @click="modalBatchUpdate?.openModal(product, batch)"
                >
                  <FormOutlined />
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td class="font-bold whitespace-nowrap">Tổng vốn</td>
            <td class="text-right whitespace-nowrap">
              {{ batches.reduce((acc, cur) => acc + cur.unitQuantity, 0) }}
            </td>
            <td class="text-right whitespace-nowrap">
              <span v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE]">
                {{ formatMoney(batches.reduce((acc, cur) => acc + cur.costAmount, 0)) }}
              </span>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!isMobile" class="table-wrapper mt-2">
      <table class="table">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Số lô</th>
            <th>HSD</th>
            <th>SL</th>
            <th v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE]">G.Nhập</th>
            <th v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE]">Tiền Vốn</th>
            <th>Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="batches.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(batch, index) in batches" :key="index">
            <td class="text-center">PB{{ batch.id }}</td>
            <td class="text-center">
              {{ batch.lotNumber }}
            </td>
            <td class="text-center">
              {{ timeToText(batch.expiryDate, 'DD/MM/YYYY') }}
            </td>
            <td class="text-right">
              {{ batch.unitQuantity }}
            </td>
            <td
              v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE]"
              class="text-right"
            >
              {{ formatMoney(batch.unitCostPrice) }}
            </td>
            <td
              v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE]"
              class="text-right"
            >
              {{ formatMoney(batch.costAmount) }}
            </td>
            <td class="text-center">
              <a
                v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_UPDATE]"
                style="color: #eca52b"
                class="mx-1 text-xl"
                @click="modalBatchUpdate?.openModal(product, batch)"
              >
                <FormOutlined />
              </a>
            </td>
          </tr>
          <tr>
            <td class="text-right font-bold" colspan="3">Tổng Vốn</td>
            <td class="text-right">
              {{ batches.reduce((acc, cur) => acc + cur.quantity, 0) }}
            </td>
            <td></td>
            <td
              v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE]"
              class="text-right font-bold"
            >
              {{ formatMoney(batches.reduce((acc, cur) => acc + cur.costAmount, 0)) }}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 float-right mb-2">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          :total="total"
          show-size-changer
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
        />
      </div>
    </div>
  </div>
</template>
