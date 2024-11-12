<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer } from '../../../modules/customer'
import { TicketProduct, TicketProductApi } from '../../../modules/ticket-product'
import { DTimer, formatPhone } from '../../../utils'
import LinkAndStatusTicket from './LinkAndStatusTicket.vue'

const props = withDefaults(defineProps<{ customer: Customer }>(), {
  customer: () => Customer.blank(),
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketProductList = ref<TicketProduct[]>([])
const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_PRODUCT_HISTORY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await TicketProductApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        customerId: props.customer.id!,
        deliveryStatus: {},
      },
      relation: {
        product: true,
        ticket: true,
        batch: true,
      },
      sort: { id: 'DESC' },
    })
    ticketProductList.value = data
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
    else ticketProductList.value = []
  },
  { immediate: true }
)
</script>

<template>
  <div class="mt-4">
    <div class="flex flex-wrap items-center gap-2">
      <span>
        KH:
        <b>{{ customer.fullName }}</b>
      </span>
      <span>
        <a :href="'tel:' + customer.phone">{{ formatPhone(customer.phone || '') }}</a>
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
          <tr v-if="ticketProductList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(ticketProduct, index) in ticketProductList" :key="index">
            <td>
              <div class="font-medium">
                {{ ticketProduct.product!.brandName }}
              </div>
              <LinkAndStatusTicket :ticket="ticketProduct.ticket!" />
              <div style="font-size: 0.8rem">
                {{ DTimer.timeToText(ticketProduct.ticket?.startedAt, 'DD/MM/YYYY hh:mm') }}
              </div>
            </td>
            <td class="text-center">
              {{ -ticketProduct.unitQuantity }}
            </td>
            <td class="text-right">
              <div
                v-if="ticketProduct.expectedPrice !== ticketProduct.actualPrice"
                style="
                  color: var(--text-red);
                  font-size: 0.8rem;
                  text-decoration: line-through;
                  font-style: italic;
                  white-space: nowrap;
                ">
                {{ formatMoney(ticketProduct.unitExpectedPrice) }}
              </div>
              <div style="white-space: nowrap">
                {{ formatMoney(ticketProduct.unitActualPrice) }}
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
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
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
          <tr v-if="ticketProductList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticketProduct, index) in ticketProductList" :key="index">
            <td>
              <LinkAndStatusTicket :ticket="ticketProduct.ticket!" />
              <div style="font-size: 0.8rem">
                {{ DTimer.timeToText(ticketProduct.ticket?.startedAt, 'hh:mm DD/MM/YYYY') }}
              </div>
            </td>
            <td>
              <div class="font-medium">
                {{ ticketProduct.product!.brandName }}
              </div>
            </td>
            <td class="text-center">
              {{ ticketProduct.unitName }}
            </td>
            <td class="text-center">
              {{ -ticketProduct.unitQuantity }}
            </td>
            <td class="text-right">
              <div
                v-if="ticketProduct.expectedPrice !== ticketProduct.actualPrice"
                style="
                  color: var(--text-red);
                  font-size: 0.8rem;
                  text-decoration: line-through;
                  font-style: italic;
                  white-space: nowrap;
                ">
                {{ formatMoney(ticketProduct.unitExpectedPrice) }}
              </div>
              <div style="white-space: nowrap">
                {{ formatMoney(ticketProduct.unitActualPrice) }}
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
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
    </div>
  </div>
</template>
