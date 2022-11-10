<script setup lang="ts">
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { Product, ProductBatch, ProductBatchService } from '@/modules/product'
import { useOrganizationStore } from '@/store/organization.store'
import { formatNumber, timeToText } from '@/utils'
import { DeleteOutlined, ExclamationCircleOutlined, FileDoneOutlined, FormOutlined } from '@ant-design/icons-vue'
import { Modal, message } from 'ant-design-vue'
import { createVNode, ref, watch } from 'vue'
import ModalEditProductBatch from './ModalEditProductBatch.vue'

const modalEditProductBatch = ref<InstanceType<typeof ModalEditProductBatch>>()

const props = withDefaults(
  defineProps<{ product: Product }>(),
  { product: () => Product.blank() }
)

const organizationStore = useOrganizationStore()

const page = ref(1)
const limit = ref(10)
const total = ref(0)
const productBatches = ref<ProductBatch[]>([])
const quantityZero = ref(false)

const startFetchData = async () => {
  try {
    const data = await ProductBatchService.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        product_id: props.product.id,
        quantity_zero: quantityZero.value,
      },
      relations: { product: false },
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
  if (options.limit) limit.value = options.limit
  await startFetchData()
}

const startDeleteProductBatch = (id: number) => {
  Modal.confirm({
    title: 'Bạn có chắc chắn muốn xóa lô hàng này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Chỉ có thể xóa những lô hàng chưa có giao dịch, chưa từng nhập hàng hoặc xuất hàng',
    async onOk() {
      const response = await ProductBatchService.deleteOne(id)
      if (response.success) {
        message.success('Xóa lô hàng thành công')
        const index = productBatches.value.findIndex((i) => i.id === id)
        productBatches.value.splice(index, 1)
      }
      else {
        AlertStore.add({ type: 'error', message: 'Lô hàng đã có dữ liệu không thể xóa' })
        console.log(response)
      }
    },
    onCancel() { },
  })
}

const handleModalEditProductBatchSuccess = (newProductBatch: ProductBatch, type: 'UPDATE') => {
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

</script>

<template>
  <ModalEditProductBatch ref="modalEditProductBatch" @success="handleModalEditProductBatchSuccess" />
  <div>
    <p>
      <span class="inline-block w-40">Tên sản phẩm</span>
      <b>{{ product.brandName }}</b>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Hoạt chất</span>
      <span>{{ product.substance }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Nhóm thuốc</span>
      <span>{{ organizationStore.PRODUCT_GROUP[product.group || 0] }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Đơn vị</span>
      <span>{{ unitString(product) }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Đường dùng</span>
      <span>{{ product.route }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Nguồn gốc</span>
      <span>{{ product.source }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Gợi ý cách dùng</span>
      <span>{{ product.hintUsage }}</span>
    </p>
  </div>

  <div class="mt-6">
    <div class="flex justify-between items-end">
      <div style="font-size: 1.2rem;">
        <FileDoneOutlined style="margin-right: 10px" />
        <span>Danh sách hàng tồn</span>
      </div>
      <a-checkbox v-model:checked="quantityZero" @change="startFetchData">
        Hiển thị lô hàng có số lượng = 0
      </a-checkbox>
    </div>
    <div class="table-wrapper mt-2">
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
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(productBatch, index) in productBatches" :key="index">
            <td class="text-center">PB{{ productBatch.id }}</td>
            <td class="text-center">{{ productBatch.batch }}</td>
            <td class="text-center">{{ timeToText(productBatch.expiryDate, "DD/MM/YYYY") }}</td>
            <td class="text-right"> {{ formatNumber(productBatch.costPrice) }}</td>
            <td class="text-right"> {{ formatNumber(productBatch.wholesalePrice) }}</td>
            <td class="text-right"> {{ formatNumber(productBatch.retailPrice) }}</td>
            <td class="text-right"> {{ productBatch.quantity }}</td>
            <td class="text-right"> {{ formatNumber(productBatch.costPrice * productBatch.quantity) }}</td>
            <td class="text-right"> {{ formatNumber(productBatch.retailPrice * productBatch.quantity) }}</td>
            <td class="text-center">
              <a style="color: #eca52b;" class="mx-1 text-xl"
                @click="modalEditProductBatch?.openModal(product, productBatch)">
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
              {{ formatNumber(productBatches.reduce((acc, cur) => acc + cur.quantity * cur.costPrice, 0)) }}
            </td>
            <td class="text-right font-bold">
              {{ formatNumber(productBatches.reduce((acc, cur) => acc + cur.quantity * cur.retailPrice, 0)) }}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 float-right mb-2">
        <a-pagination v-model:current="page" v-model:pageSize="limit" :total="total"
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
      </div>
    </div>
  </div>
</template>
