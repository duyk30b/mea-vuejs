<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Customer } from '../../../modules/customer'
import { InvoiceItemApi } from '../../../modules/invoice-item/invoice-item.api'
import { InvoiceItemType, type InvoiceItem } from '../../../modules/invoice-item/invoice-item.model'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { formatPhone, timeToText } from '../../../utils'
import InvoiceStatusTag from '../../../views/invoice/InvoiceStatusTag.vue'
import { ProductMovementApi } from '../../../modules/product-movement/product-movement.api'
import { MovementType, VoucherType } from '../../../modules/enum'
import type { ProductMovement } from '../../../modules/product-movement/product-movement.model'

const props = withDefaults(defineProps<{ customer: Customer }>(), {
  customer: () => Customer.blank(),
})

const router = useRouter()

const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore

const productMovementList = ref<ProductMovement[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_PRODUCT_HISTORY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await ProductMovementApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        contactId: props.customer.id!,
        voucherType: { IN: [VoucherType.Invoice, VoucherType.Visit] },
      },
      relation: {
        product: true,
      },
      sort: { id: 'DESC' },
    })
    productMovementList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerProductHistory copy.vue:37 ~ error:', error)
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('CUSTOMER_PRODUCT_HISTORY_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

watch(
  () => props.customer.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else productMovementList.value = []
  },
  { immediate: true }
)

const openBlankInvoiceDetail = (invoiceId: number) => {
  let route = router.resolve({
    name: 'InvoiceDetail',
    params: { id: invoiceId },
  })
  window.open(route.href, '_blank')
}

const openBlankVisitDetail = (visitId: number) => {
  let route = router.resolve({
    name: 'VisitDetail',
    params: { id: visitId },
  })
  window.open(route.href, '_blank')
}
</script>

<template>
  <div>
    <div class="flex flex-wrap">
      <span class="mr-2"
        >KH: <b>{{ customer.fullName }}</b></span
      >
      <span>
        <a :href="'tel:' + customer.phone"> {{ formatPhone(customer.phone || '') }} </a>
      </span>
    </div>
    <div v-if="isMobile" class="mt-4 w-full table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>SL</th>
            <th>ĐG</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="productMovementList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(productMovement, index) in productMovementList" :key="index">
            <td>
              <div class="font-medium">
                {{ productMovement.product!.brandName }}
              </div>
              <div
                v-if="(productMovement.voucherType = VoucherType.Invoice)"
                style="font-size: 0.8rem"
              >
                <a class="mr-2" @click="openBlankInvoiceDetail(productMovement.voucherId)">
                  IV{{ productMovement.voucherId }}
                </a>
              </div>
              <div
                v-if="(productMovement.voucherType = VoucherType.Visit)"
                style="font-size: 0.8rem"
              >
                <a class="mr-2" @click="openBlankVisitDetail(productMovement.voucherId)">
                  IV{{ productMovement.voucherId }}
                </a>
              </div>
              <div style="font-size: 0.8rem">
                TG {{ timeToText(productMovement.createdAt, 'DD/MM/YYYY hh:mm') }}
              </div>
            </td>
            <td class="text-center">
              {{ -productMovement.unitQuantity }}
            </td>
            <td class="text-right">
              <div
                v-if="productMovement.expectedPrice !== productMovement.actualPrice"
                style="
                  color: var(--text-red);
                  font-size: 0.8rem;
                  text-decoration: line-through;
                  font-style: italic;
                  white-space: nowrap;
                "
              >
                {{ formatMoney(productMovement.unitExpectedPrice) }}
              </div>
              <div style="white-space: nowrap">
                {{ formatMoney(productMovement.unitActualPrice) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 float-right mb-2">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          size="small"
          :total="total"
          show-size-changer
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
        />
      </div>
    </div>
    <div v-if="!isMobile" class="table-wrapper mt-4 w-full">
      <table>
        <thead>
          <tr>
            <th>HĐ</th>
            <th>Sản phẩm</th>
            <th>Đơn vị</th>
            <th>S.Lượng</th>
            <th>Đ.Giá</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="productMovementList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(productMovement, index) in productMovementList" :key="index">
            <td>
              <div v-if="productMovement.voucherType === VoucherType.Invoice">
                <a @click="openBlankInvoiceDetail(productMovement.voucherId)">
                  IV{{ productMovement.voucherId }}
                </a>
              </div>
              <div v-if="productMovement.voucherType === VoucherType.Visit">
                <a @click="openBlankVisitDetail(productMovement.voucherId)">
                  VS{{ productMovement.voucherId }}
                </a>
              </div>
              <div style="font-size: 0.8rem">
                {{ timeToText(productMovement.createdAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td>
              <div class="font-medium">
                {{ productMovement.product!.brandName }}
              </div>
            </td>
            <td class="text-center">
              {{ productMovement.unitName }}
            </td>
            <td class="text-center">
              {{ -productMovement.unitQuantity }}
            </td>
            <td class="text-right">
              <div
                v-if="productMovement.expectedPrice !== productMovement.actualPrice"
                style="
                  color: var(--text-red);
                  font-size: 0.8rem;
                  text-decoration: line-through;
                  font-style: italic;
                  white-space: nowrap;
                "
              >
                {{ formatMoney(productMovement.unitExpectedPrice) }}
              </div>
              <div style="white-space: nowrap">
                {{ formatMoney(productMovement.unitActualPrice) }}
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
