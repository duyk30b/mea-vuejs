<script setup lang="ts">
import VuePagination from '@/common/VuePagination.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { TicketProduct, TicketProductApi } from '@/modules/ticket-product'
import { ESTimer } from '@/utils'
import LinkAndStatusTicket from '@/views/room/room-ticket-base/LinkAndStatusTicket.vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{ customerId: number }>(), {
  customerId: 0,
})

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketProductList = ref<TicketProduct[]>([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const paginationResponse = await TicketProductApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        customerId: props.customerId!,
        deliveryStatus: {},
      },
      relation: {
        product: true,
        ticket: true,
      },
      sort: { id: 'DESC' },
    })
    ticketProductList.value = paginationResponse.ticketProductList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerProductHistory copy.vue:37 ~ error:', error)
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
  }
  await startFetchData()
}

watch(
  () => props.customerId,
  async (newValue) => {
    if (newValue) await startFetchData()
    else ticketProductList.value = []
  },
  { immediate: true },
)
</script>

<template>
  <div class="mt-4">
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
                {{ ESTimer.timeToText(ticketProduct.ticket?.startedAt, 'DD/MM/YYYY hh:mm') }}
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
                "
              >
                {{ formatMoney(ticketProduct.unitExpectedPrice) }}
              </div>
              <div style="white-space: nowrap">
                {{ formatMoney(ticketProduct.unitActualPrice) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
                {{ ESTimer.timeToText(ticketProduct.ticket?.startedAt, 'hh:mm DD/MM/YYYY') }}
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
                "
              >
                {{ formatMoney(ticketProduct.unitExpectedPrice) }}
              </div>
              <div style="white-space: nowrap">
                {{ formatMoney(ticketProduct.unitActualPrice) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="p-4 flex flex-wrap justify-end gap-4">
      <VuePagination
        class="ml-auto"
        v-model:page="page"
        :total="total"
        :limit="limit"
        @update:page="(p: any) => changePagination({ page: p, limit })"
      />
    </div>
  </div>
</template>
