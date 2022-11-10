<script setup lang="ts">
import { ArrivalInvoiceService, type Arrival } from '@/modules/arrival'
import { ArrivalType, PaymentStatus, PaymentStatusText } from '@/modules/enum'
import { formatNumber, timeToText } from '@/utils'
import { CheckCircleOutlined, ExclamationCircleOutlined, FileSearchOutlined, ScheduleOutlined, SearchOutlined, StopOutlined } from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'
import { onBeforeMount, ref } from 'vue'
import ModalCustomerDetails from '../customer/details/ModalCustomerDetails.vue'

const modalCustomerDetails = ref<InstanceType<typeof ModalCustomerDetails>>()

const loadingComponent = ref(false)
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const arrivals = ref<Arrival[]>([])

const timeRanger = ref<[Dayjs, Dayjs]>()
const paymentStatus = ref<PaymentStatus>()

const sortColumn = ref<'full_name_en' | 'debt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    loadingComponent.value = true
    let sort
    if (sortColumn.value !== '' && sortValue.value !== '') {
      sort = { [sortColumn.value]: sortValue.value }
    }

    const response = await ArrivalInvoiceService.pagination({
      page: page.value,
      limit: limit.value,
      relations: { customer: true },
      filter: {
        from_time: timeRanger.value?.[0].startOf('day').valueOf(),
        to_time: timeRanger.value?.[1].endOf('day').valueOf(),
        types: JSON.stringify([ArrivalType.Invoice]),
        payment_status: paymentStatus.value || undefined,
      },
      sort,
    })

    arrivals.value = response.data
    total.value = response.total
    loadingComponent.value = false
  } catch (error) {
    console.log('🚀 ~ file: ArrivalInvoiceList.vue:50 ~ error:', error)
  }
}

onBeforeMount(async () => {
  await startFetchData()
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const handleSelectPaymentStatus = async (value?: PaymentStatus) => {
  await startFetchData()
}

const changeSort = async (column: 'id') => {
  if (sortValue.value == 'DESC') {
    sortColumn.value = ''
    sortValue.value = ''
  } else if (sortValue.value == 'ASC') {
    sortColumn.value = column
    sortValue.value = 'DESC'
  } else {
    sortColumn.value = column
    sortValue.value = 'ASC'
  }
  await startSearch()
}

const changePagination = async (options: { page?: number, limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit
  await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    // modalSettingArrivalList.value?.openModal()
  }
}

</script>

<template>
  <ModalCustomerDetails ref="modalCustomerDetails" />
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.3rem;">
        <ScheduleOutlined style="margin-right: 1rem" />
        Danh sách tiếp đón
      </div>
      <!-- <div>
        <a-dropdown trigger="click">
          <span style="font-size: 1.1rem; cursor: pointer;">
            <SettingOutlined />
          </span>
          <template #overlay>
            <a-menu @click="handleMenuSettingClick">
              <a-menu-item key="screen-setting"> Cài đặt hiển thị </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div> -->
    </div>
  </div>

  <div class="mx-4 mt-4 p-4 bg-white">
    <div class="flex flex-wrap gap-4">
      <div style="flex: 1; flex-basis: 250px;">
        <div>Chọn thời gian</div>
        <div>
          <a-range-picker v-model:value="timeRanger" format="DD-MM-YYYY" style="width: 100%"
            :placeholder="['DD-MM-YYYY', 'DD-MM-YYYY']" />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 250px;">
        <div>Chọn trạng thái</div>
        <a-select v-model:value="paymentStatus" allow-clear @change="handleSelectPaymentStatus" class="w-full"
          placeholder="Tất cả">
          <a-select-option value="">Tất cả</a-select-option>
          <a-select-option :value="PaymentStatus.Unpaid"> {{ PaymentStatusText[PaymentStatus.Unpaid] }}</a-select-option>
          <a-select-option :value="PaymentStatus.Full"> {{ PaymentStatusText[PaymentStatus.Full] }}</a-select-option>
          <a-select-option :value="PaymentStatus.Refund"> {{ PaymentStatusText[PaymentStatus.Refund] }}</a-select-option>
        </a-select>
      </div>

      <div style="flex: 2; flex-basis: 500px;">
        <div>&nbsp;</div>
        <a-button type="primary" @click="startSearch">Tìm kiếm
          <template #icon>
            <SearchOutlined />
          </template>
        </a-button>
      </div>
    </div>
    <div class="table-wrapper mt-4 w-full">
      <table class="table">
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">Mã &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'id'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th>Thời gian</th>
            <th>Khách hàng</th>
            <th>Tổng Tiền</th>
            <th>Thanh toán</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="arrivals.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(arrival, index) in arrivals" :key="index">
            <td class="text-center">
              <a @click="$router.push({ name: 'ArrivalInvoiceDetail', params: { id: arrival.id } })">
                AR{{ arrival.id }}
              </a>
            </td>
            <td class="text-center">{{ timeToText(arrival.createTime, 'hh:mm DD/MM/YYYY') }}</td>
            <td>
              <div class="flex justify-between">
                <div>{{ arrival.customer?.fullNameVi }}</div>
                <a class="text-xl" @click="modalCustomerDetails?.openModal(arrival.customer!)">
                  <FileSearchOutlined />
                </a>
              </div>
            </td>
            <td class="text-right">{{ formatNumber(arrival.totalMoney) }}</td>
            <td class="text-center">
              <a-tag v-if="arrival.paymentStatus === PaymentStatus.Full" color="success">
                <template #icon>
                  <CheckCircleOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Full] }}
              </a-tag>
              <a-tag v-if="arrival.paymentStatus === PaymentStatus.Unpaid" color="warning">
                <template #icon>
                  <ExclamationCircleOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Unpaid] }}
              </a-tag>
              <a-tag v-if="arrival.paymentStatus === PaymentStatus.Refund" color="error">
                <template #icon>
                  <StopOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Refund] }}
              </a-tag>
            </td>
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
