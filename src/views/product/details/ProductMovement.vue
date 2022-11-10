<script setup lang="ts">
import { ProductMovementType } from '@/modules/enum'
import type { Invoice } from '@/modules/invoice'
import { Product, ProductMovement, ProductMovementService } from '@/modules/product'
import type { Receipt } from '@/modules/receipt'
import { formatNumber, timeToText } from '@/utils'
import { MinusCircleOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{ product: Product }>(),
  { product: () => Product.blank() }
)

const router = useRouter()
const productMovements = ref<ProductMovement[]>([])

const page = ref(1)
const limit = ref(5)
const total = ref(0)

const startFetchData = async () => {
  try {
    const data = await ProductMovementService.pagination({
      page: page.value,
      limit: limit.value,
      filter: { product_id: props.product.id },
      relations: { product_batch: true, invoice: true, receipt: true },
      sort: { id: 'DESC' },
    })
    productMovements.value = data.data
    total.value = data.total
  } catch (error) {
    console.log('🚀 ~ file: ProductMovement.vue:35 ~ error:', error)
  }
}

const changePagination = async (options: { page?: number, limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit
  await startFetchData()
}

watch(
  () => props.product.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else productMovements.value = []
  },
  { immediate: true }
)

const openBlankReceiptDetail = async (rc: Receipt) => {
  let route = router.resolve({
    name: 'PurchaseReceiptDetails',
    params: { id: rc.purchaseId },
    query: { receipt_id: rc.id },
  })
  window.open(route.href, '_blank')
}

const openBlankInvoiceDetail = async (iv: Invoice) => {
  let route = router.resolve({
    name: 'ArrivalInvoiceDetail',
    params: { id: iv.arrivalId },
    query: { invoice_id: iv.id },
  })
  window.open(route.href, '_blank')
}

</script>

<template>
  <div class="table-wrapper">
    <table class="table">
      <thead>
        <tr>
          <th>Mã</th>
          <th><a-tag color="green">NCC</a-tag>- <a-tag color="blue">KH</a-tag></th>
          <th>Thời gian</th>
          <th>Lô</th>
          <th>HSD</th>
          <th>Đ.Vị</th>
          <th>SL trước</th>
          <th>Nhập/Xuất</th>
          <th>SL sau</th>
          <th>Giá</th>
          <th>T.Tiền</th>
          <th>Mã Phiếu</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="productMovements.length === 0">
          <td colspan="20" class="text-center">No data</td>
        </tr>
        <tr v-for="(mov, index) in productMovements" :key="index">
          <td class="text-center">PM{{ mov.id }}</td>
          <td v-if="mov.type === ProductMovementType.Receipt">
            <a-tag color="green">{{ mov.receipt?.distributor?.fullNameVi }}</a-tag>
          </td>
          <td v-if="mov.type === ProductMovementType.Invoice">
            <a-tag color="blue">{{ mov.invoice?.customer?.fullNameVi }}</a-tag>
          </td>
          <td class="text-center"> {{ timeToText(mov.createTime, "hh:mm DD/MM/YYYY") }} </td>
          <td class="text-center">{{ mov.productBatch?.batch }}</td>
          <td class="text-center"> {{ timeToText(mov.productBatch?.expiryDate, "DD/MM/YYYY") }} </td>
          <td class="text-right"> {{ product.unit.find(i => i.rate === 1)?.name }}</td>
          <td class="text-right"> {{ mov.openQuantity }}</td>
          <td class="text-right">
            <a-tag v-if="mov.isRefund" color="warning">
              <template #icon>
                <MinusCircleOutlined />
              </template>
              Hoàn trả
            </a-tag>{{ mov.number }}
          </td>
          <td class="text-right"> {{ mov.closeQuantity }} </td>
          <td class="text-right"> {{ formatNumber(mov.price) }}</td>
          <td class="text-right"> {{ formatNumber(mov.totalMoney) }}</td>
          <td class="text-center">
            <a v-if="mov.type === ProductMovementType.Invoice" @click="openBlankInvoiceDetail(mov.invoice!)">
              IV{{ mov.invoice!.id }}
            </a>
            <a v-if="mov.type === ProductMovementType.Receipt" @click="openBlankReceiptDetail(mov.receipt!)">
              RC{{ mov.receipt!.id }}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mt-4 float-right mb-2">
      <a-pagination v-model:current="page" v-model:pageSize="limit" :total="total"
        @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
    </div>
  </div>
</template>
