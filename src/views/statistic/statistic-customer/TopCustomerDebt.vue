<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { Customer, CustomerApi } from '../../../modules/customer'
import { StatisticService } from '../../../modules/statistics'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { formatPhone } from '../../../utils'

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const loaded = ref(false)
const customerList = ref<Customer[]>([])
const sumDebt = ref(0)

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    loaded.value = false
    const [customerPagination, sumCustomerDebt] = await Promise.all([
      CustomerApi.pagination({
        page: page.value,
        limit: limit.value,
        filter: { debt: { NOT: 0 } },
        sort: { debt: 'DESC' },
      }),
      StatisticService.sumCustomerDebt(),
    ])

    customerList.value = customerPagination.data
    total.value = customerPagination.meta.total
    sumDebt.value = sumCustomerDebt
  } catch (error) {
    console.log('🚀 ~ file: ProductReport.vue:28 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

onBeforeMount(async () => await startFetchData())

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit

  await startFetchData()
}
</script>

<template>
  <div class="flex flex-col" style="height: 100%">
    <div class="flex justify-between items-center">
      <span style="font-size: 18px; font-weight: 500">
        Danh sách khách nợ: (Tổng nợ {{ formatMoney(sumDebt) }})
      </span>
    </div>
    <div class="mt-2 table-wrapper">
      <table class="">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên KH</th>
            <th>SĐT</th>
            <th>Nợ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="customerList.length === 0">
            <td colspan="20" class="text-center">Không có khách hàng nợ</td>
          </tr>
          <tr v-for="(customer, index) in customerList" :key="index">
            <td class="text-center" style="white-space: nowrap">
              {{ index + 1 }}
            </td>
            <td>{{ customer.fullName }}</td>
            <td class="text-center" style="white-space: nowrap">
              <a :href="'tel:' + customer.phone">
                {{ formatPhone(customer.phone || '') }}
              </a>
            </td>
            <td class="text-center" style="white-space: nowrap">
              {{ formatMoney(customer.debt) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="mt-4 float-right">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          :total="total"
          show-size-changer
          :size="isMobile ? 'small' : 'default'"
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
        />
      </div>
    </div>
  </div>
</template>
