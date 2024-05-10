<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Customer } from '../../../modules/customer'
import { InvoiceItemApi } from '../../../modules/invoice-item/invoice-item.api'
import { InvoiceItemType, type InvoiceItem } from '../../../modules/invoice-item/invoice-item.model'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { formatPhone, timeToText } from '../../../utils'
import InvoiceStatusTag from '../../../views/invoice/InvoiceStatusTag.vue'

const props = withDefaults(defineProps<{ customer: Customer }>(), {
  customer: () => Customer.blank(),
})

const router = useRouter()

const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore

const invoiceItems = ref<InvoiceItem[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_PRODUCT_HISTORY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await InvoiceItemApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        customerId: props.customer.id!,
        type: InvoiceItemType.Batch,
      },
      relation: {
        batch: true,
        product: true,
        invoice: { customer: false },
      },
      sort: { id: 'DESC' },
    })
    invoiceItems.value = data
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
    else invoiceItems.value = []
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
    <div v-if="isMobile" class="mt-4 w-full">
      <table class="table-mobile">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>SL</th>
            <th>ĐG</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="invoiceItems.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(invoiceItem, index) in invoiceItems" :key="index">
            <td>
              <div class="font-medium">
                {{ invoiceItem.product!.brandName }}
              </div>
              <div style="font-size: 0.8rem">
                Lô {{ invoiceItem.batch!.lotNumber }} - HSD
                {{ timeToText(invoiceItem.batch!.expiryDate) }}
              </div>
              <div style="font-size: 0.8rem">
                ĐH
                <a class="mr-2" @click="openBlankInvoiceDetail(invoiceItem.invoice!.id)">
                  IV{{ invoiceItem.invoice!.id }}
                </a>
                <InvoiceStatusTag :status="invoiceItem.invoice!.status" />
              </div>
              <div style="font-size: 0.8rem">
                TG {{ timeToText(invoiceItem.invoice?.startedAt, 'DD/MM/YYYY hh:mm') }}
              </div>
            </td>
            <td class="text-center">
              {{ invoiceItem.quantity }}
            </td>
            <td class="text-right">
              <div
                v-if="invoiceItem.discountMoney"
                style="
                  font-size: 0.8rem;
                  text-decoration: line-through;
                  font-style: italic;
                  white-space: nowrap;
                "
              >
                {{ formatMoney(invoiceItem.expectedPrice) }}
              </div>
              <div style="white-space: nowrap">
                {{ formatMoney(invoiceItem.actualPrice) }}
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
      <table class="table">
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
          <tr v-if="invoiceItems.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(invoiceItem, index) in invoiceItems" :key="index">
            <td>
              <div>
                <a @click="openBlankInvoiceDetail(invoiceItem.invoice!.id)">
                  IV{{ invoiceItem.invoice!.id }}
                </a>
                <span class="ml-2">
                  <InvoiceStatusTag :status="invoiceItem.invoice!.status" />
                </span>
              </div>
              <div style="font-size: 0.8rem">
                {{ timeToText(invoiceItem.invoice?.startedAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td>
              <div class="font-medium">
                {{ invoiceItem.product!.brandName }}
              </div>
              <div style="font-size: 0.8rem">
                Lô {{ invoiceItem.batch!.lotNumber }} - HSD
                {{ timeToText(invoiceItem.batch!.expiryDate) }}
              </div>
            </td>
            <td class="text-center">
              {{ invoiceItem.product!.unitBasicName }}
            </td>
            <td class="text-center">
              {{ invoiceItem.quantity }}
            </td>
            <td class="text-right">
              <div
                v-if="invoiceItem.discountMoney"
                style="
                  font-size: 0.8rem;
                  text-decoration: line-through;
                  font-style: italic;
                  white-space: nowrap;
                "
              >
                {{ formatMoney(invoiceItem.expectedPrice) }}
              </div>
              <div style="white-space: nowrap">
                {{ formatMoney(invoiceItem.actualPrice) }}
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
