<script setup lang="ts">
import { Product, ProductBatch, ProductBatchService } from '@/modules/product'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import { DeleteOutlined, ExclamationCircleOutlined, FileDoneOutlined, FormOutlined } from '@ant-design/icons-vue'
import { Modal, message } from 'ant-design-vue'
import { createVNode, ref, watch } from 'vue'
import ModalProductBatchUpdate from './ModalProductBatchUpdate.vue'

const modalProductBatchUpdate = ref<InstanceType<typeof ModalProductBatchUpdate>>()

const props = withDefaults(
  defineProps<{ product: Product }>(),
  { product: () => Product.blank() }
)

const organizationStore = useOrganizationStore()
const { formatMoney, isMobile } = organizationStore

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PRODUCT_BATCH_PAGINATION_LIMIT')) || 10)
const total = ref(0)
const productBatches = ref<ProductBatch[]>([])

const isActive = ref<'true' | 'false'>('true')

const startFetchData = async () => {
  try {
    const data = await ProductBatchService.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        product_id: props.product.id,
        is_active: isActive.value,
      },
      relation: { product: false },
      sort: { id: 'DESC' },
    })
    productBatches.value = data.data
    total.value = data.total
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

const changePagination = async (options: { page?: number, limit?: number }) => {
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
        await ProductBatchService.deleteOne(id)
        message.success('Xóa lô hàng thành công')
        const index = productBatches.value.findIndex((i) => i.id === id)
        productBatches.value.splice(index, 1)
      } catch (error) {
        console.log('🚀 ~ file: ProductBatch.vue:73 ~ onOk ~ error:', error)
      }
    },
    onCancel() { },
  })
}

const handleModalProductBatchUpdateSuccess = (newProductBatch: ProductBatch, type: 'UPDATE') => {
  if (type === 'UPDATE') {
    const findIndex = productBatches.value.findIndex((i) => i.id === newProductBatch.id)
    if (findIndex !== -1) {
      productBatches.value[findIndex] = newProductBatch
    }
  }
}

const unitString = (data: Product) => {
  const basicUnit = data.unit?.[0]?.name
  let result = basicUnit
  for (let i = 1; i < (data.unit?.length || 0); i++) {
    result += `, ${data.unit?.[i].name} (${data.unit?.[i].rate} ${basicUnit})`
  }
  return result
}

const handleSelectStatus = async (value: 'true' | 'false') => {
  await startFetchData()
}

</script>

<template>
  <ModalProductBatchUpdate ref="modalProductBatchUpdate" @success="handleModalProductBatchUpdateSuccess" />
  <div>
    <table class="w-full">
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Mã sản phẩm</td>
        <td class="px-2 font-medium">PR{{ product.id }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Tên sản phẩm</td>
        <td class="px-2">{{ product.brandName }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Hoạt chất</td>
        <td class="px-2">{{ product.substance }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Nhóm</td>
        <td class="px-2">{{ organizationStore.PRODUCT_GROUP[product.group || 0] }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Số lượng</td>
        <td class="px-2">
          <b>{{ product.quantity }}</b> {{ product.unit[0].name }}
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Đơn vị</td>
        <td class="px-2">{{ unitString(product) }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Đường dùng</td>
        <td class="px-2">{{ product.route }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Nguồn gốc</td>
        <td class="px-2">{{ product.source }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Gợi ý cách dùng</td>
        <td class="px-2">{{ product.hintUsage }}</td>
      </tr>
    </table>
  </div>

  <div class="mt-6">
    <div class="flex justify-between items-end">
      <div style="font-size: 1.2rem;">
        <FileDoneOutlined style="margin-right: 10px" />
        <span>Hàng tồn</span>
      </div>

      <div class="flex items-center gap-4">
        <span>Trạng thái</span>
        <a-select v-model:value="isActive" allow-clear @change="handleSelectStatus" placeholder="Tất cả"
          class="w-[120px]">
          <a-select-option value="true">Active</a-select-option>
          <a-select-option value="false">Inactive</a-select-option>
        </a-select>
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
              <div>HSD: {{ timeToText(productBatch.expiryDate, "DD/MM/YYYY") }}</div>
            </td>
            <td class="text-right">
              <div> Nhập: {{ formatMoney(productBatch.costPrice) }} </div>
              <div> Sỉ: {{ formatMoney(productBatch.wholesalePrice) }} </div>
              <div> Lẻ: {{ formatMoney(productBatch.retailPrice) }} </div>
            </td>
            <td class="text-right"> {{ productBatch.quantity }}</td>
            <td class="text-center">
              <div class="flex flex-col">
                <a style="color: #eca52b;" class="text-base"
                  @click="modalProductBatchUpdate?.openModal(product, productBatch)">
                  <FormOutlined />
                </a>
                <a v-if="productBatch.quantity === 0" style="color: #d9534f;" class="text-base"
                  @click="startDeleteProductBatch(productBatch.id)">
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
                  SL: {{ productBatches.reduce((acc, cur) => acc + cur.quantity, 0) }}
                </span>
                <span>
                  Nhập: {{ formatMoney(productBatches.reduce((acc, cur) => acc + cur.quantity * cur.costPrice, 0))
                  }}</span>
                <span>Lẻ: {{ formatMoney(productBatches.reduce((acc, cur) => acc + cur.quantity * cur.retailPrice, 0))
                }}</span>
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
            <th>G.Nhập</th>
            <th>G.Sỉ</th>
            <th>G.Lẻ</th>
            <th>S.Lượng</th>
            <th>T.Nhập</th>
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
            <td class="text-center">{{ productBatch.batch }}</td>
            <td class="text-center">{{ timeToText(productBatch.expiryDate, "DD/MM/YYYY") }}</td>
            <td class="text-right"> {{ formatMoney(productBatch.costPrice) }}</td>
            <td class="text-right"> {{ formatMoney(productBatch.wholesalePrice) }}</td>
            <td class="text-right"> {{ formatMoney(productBatch.retailPrice) }}</td>
            <td class="text-right"> {{ productBatch.quantity }}</td>
            <td class="text-right"> {{ formatMoney(productBatch.costPrice * productBatch.quantity) }}</td>
            <td class="text-right"> {{ formatMoney(productBatch.retailPrice * productBatch.quantity) }}</td>
            <td class="text-center">
              <a style="color: #eca52b;" class="mx-1 text-xl"
                @click="modalProductBatchUpdate?.openModal(product, productBatch)">
                <FormOutlined />
              </a>
              <a v-if="productBatch.quantity === 0" style="color: #d9534f;" class="mx-1 text-xl"
                @click="startDeleteProductBatch(productBatch.id)">
                <DeleteOutlined />
              </a>
            </td>
          </tr>
          <tr>
            <td colspan="6" class="text-right">Tổng</td>
            <td class="text-right">
              {{ productBatches.reduce((acc, cur) => acc + cur.quantity, 0) }}
            </td>
            <td class="text-right font-bold">
              {{ formatMoney(productBatches.reduce((acc, cur) => acc + cur.quantity * cur.costPrice, 0)) }}
            </td>
            <td class="text-right font-bold">
              {{ formatMoney(productBatches.reduce((acc, cur) => acc + cur.quantity * cur.retailPrice, 0)) }}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 float-right mb-2">
        <a-pagination v-model:current="page" v-model:pageSize="limit" :total="total" show-size-changer
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
      </div>
    </div>
  </div>
</template>
