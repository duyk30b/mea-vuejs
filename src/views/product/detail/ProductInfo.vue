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
import { ProductBatch, ProductBatchApi, useProductBatchStore } from '../../../modules/product-batch'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { timeToText } from '../../../utils'
import ModalProductBatchUpdate from './ModalProductBatchUpdate.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { PermissionId } from '../../../modules/permission/permission.enum'

const modalProductBatchUpdate = ref<InstanceType<typeof ModalProductBatchUpdate>>()

const props = withDefaults(defineProps<{ product: Product }>(), { product: () => Product.blank() })

const screenStore = useScreenStore()
const productBatchStore = useProductBatchStore()
const { formatMoney, isMobile } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PRODUCT_BATCH_PAGINATION_LIMIT')) || 10)
const total = ref(0)
const productBatches = ref<ProductBatch[]>([])

const hasDelete = ref<boolean>(false)

const startFetchData = async () => {
  try {
    const pagination = await productBatchStore.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        productId: props.product.id,
        deletedAt: hasDelete.value ? undefined : { IS_NULL: true },
      },
      sort: { id: 'DESC' },
      relation: { product: true },
    })

    productBatches.value = pagination.data
    total.value = pagination.total
  } catch (error) {
    console.log('🚀 ~ file: ProductBatch.vue:41 ~ error:', error)
  }
}

watch(
  () => props.product.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else productBatches.value = []
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

const startDeleteProductBatch = (id: number) => {
  Modal.confirm({
    title: 'Bạn có chắc chắn muốn xóa lô hàng này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Chỉ có thể xóa những lô hàng chưa có giao dịch, chưa từng nhập hàng hoặc xuất hàng',
    async onOk() {
      try {
        await productBatchStore.deleteOne(id)
        message.success('Xóa lô hàng thành công')
        await startFetchData()
      } catch (error) {
        console.log('🚀 ~ file: ProductBatch.vue:73 ~ onOk ~ error:', error)
      }
    },
    onCancel() {},
  })
}

const handleModalProductBatchUpdateSuccess = async (data: ProductBatch, type: 'UPDATE') => {
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
  <ModalProductBatchUpdate
    v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_UPDATE]"
    ref="modalProductBatchUpdate"
    @success="handleModalProductBatchUpdateSuccess"
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
        <td class="px-2 py-1 whitespace-nowrap">Số lượng</td>
        <td class="px-2">
          <b>{{ product.unitQuantity }}</b> {{ product.unitName }}
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

  <div class="mt-6">
    <div class="flex justify-between items-end">
      <div style="font-size: 1.2rem">
        <FileDoneOutlined style="margin-right: 10px" />
        <span>Hàng tồn</span>
      </div>

      <div>
        <a-checkbox v-model:checked="hasDelete" @change="handleChangeStatus">
          Hiển thị lô hàng đã xóa
        </a-checkbox>
      </div>
    </div>
    <div v-if="isMobile" class="mt-2">
      <table class="table-mobile">
        <thead>
          <tr>
            <th>Lô</th>
            <th>Giá</th>
            <th>SL</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="productBatches.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(productBatch, index) in productBatches" :key="index">
            <td>
              <div>Mã PB: {{ productBatch.id }}</div>
              <div>Lô: {{ productBatch.batch }}</div>
              <div>HSD: {{ timeToText(productBatch.expiryDate, 'DD/MM/YYYY') }}</div>
            </td>
            <td class="text-right">
              <div v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE]">
                Nhập: {{ formatMoney(productBatch.unitCostPrice) }}
              </div>
              <div>Sỉ: {{ formatMoney(productBatch.unitWholesalePrice) }}</div>
              <div>Lẻ: {{ formatMoney(productBatch.unitRetailPrice) }}</div>
            </td>
            <td class="text-right">
              {{ productBatch.quantity }}
            </td>
            <td class="text-center">
              <div class="flex flex-col">
                <a
                  v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_UPDATE]"
                  style="color: #eca52b"
                  class="text-base"
                  @click="modalProductBatchUpdate?.openModal(product, productBatch)"
                >
                  <FormOutlined />
                </a>
                <a
                  v-if="
                    permissionIdMap[PermissionId.PRODUCT_BATCH_DELETE] &&
                    productBatch.quantity === 0
                  "
                  style="color: #d9534f"
                  class="text-base"
                  @click="startDeleteProductBatch(productBatch.id)"
                >
                  <DeleteOutlined />
                </a>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <table class="table-mobile">
        <tbody>
          <tr>
            <td class="font-bold whitespace-nowrap">Tổng</td>
            <td>
              <div class="flex gap-4 justify-between">
                <span>
                  SL: {{ productBatches.reduce((acc, cur) => acc + cur.unitQuantity, 0) }}
                </span>
                <span v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE]">
                  Nhập:
                  {{
                    formatMoney(productBatches.reduce((acc, cur) => acc + cur.totalCostPrice, 0))
                  }}
                </span>
                <span
                  >Lẻ:
                  {{
                    formatMoney(productBatches.reduce((acc, cur) => acc + cur.totalRetailPrice, 0))
                  }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="table-wrapper mt-2">
      <table class="table">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Lô hàng</th>
            <th>HSD</th>
            <th v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE]">G.Nhập</th>
            <th>G.Sỉ</th>
            <th>G.Lẻ</th>
            <th>S.Lượng</th>
            <th v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE]">T.Nhập</th>
            <th>T.Lẻ</th>
            <th>Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="productBatches.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(productBatch, index) in productBatches" :key="index">
            <td class="text-center">PB{{ productBatch.id }}</td>
            <td class="text-center">
              {{ productBatch.batch }}
            </td>
            <td class="text-center">
              {{ timeToText(productBatch.expiryDate, 'DD/MM/YYYY') }}
            </td>
            <td
              v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE]"
              class="text-right"
            >
              {{ formatMoney(productBatch.unitCostPrice) }}
            </td>
            <td class="text-right">
              {{ formatMoney(productBatch.unitWholesalePrice) }}
            </td>
            <td class="text-right">
              {{ formatMoney(productBatch.unitRetailPrice) }}
            </td>
            <td class="text-right">
              {{ productBatch.unitQuantity }}
            </td>
            <td
              v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE]"
              class="text-right"
            >
              {{ formatMoney(productBatch.totalCostPrice) }}
            </td>
            <td class="text-right">
              {{ formatMoney(productBatch.totalRetailPrice) }}
            </td>
            <td class="text-center">
              <a
                v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_UPDATE]"
                style="color: #eca52b"
                class="mx-1 text-xl"
                @click="modalProductBatchUpdate?.openModal(product, productBatch)"
              >
                <FormOutlined />
              </a>
              <a
                v-if="
                  permissionIdMap[PermissionId.PRODUCT_BATCH_DELETE] && productBatch.quantity === 0
                "
                style="color: #d9534f"
                class="mx-1 text-xl"
                @click="startDeleteProductBatch(productBatch.id)"
              >
                <DeleteOutlined />
              </a>
            </td>
          </tr>
        </tbody>
      </table>
      <table class="table">
        <tbody>
          <tr>
            <td style="width: 60%" class="text-right">Tổng</td>
            <td class="text-right">
              <div class="flex justify-between">
                <span>SL: </span>
                <span>
                  {{ productBatches.reduce((acc, cur) => acc + cur.quantity, 0) }}
                </span>
              </div>
            </td>
            <td
              v-if="permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE]"
              class="text-right font-bold"
            >
              <div class="flex justify-between">
                <span>T.Nhập: </span>
                <span>
                  {{
                    formatMoney(productBatches.reduce((acc, cur) => acc + cur.totalCostPrice, 0))
                  }}
                </span>
              </div>
            </td>
            <td class="text-right font-bold">
              <div class="flex justify-between">
                <span>T.Lẻ: </span>
                <span>
                  {{
                    formatMoney(productBatches.reduce((acc, cur) => acc + cur.totalRetailPrice, 0))
                  }}
                </span>
              </div>
            </td>
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
