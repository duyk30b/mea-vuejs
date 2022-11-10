<script setup lang="ts">
import { PaymentStatus, PaymentStatusText } from '@/modules/enum'
import { Purchase, PurchaseReceiptService } from '@/modules/purchase'
import { formatNumber, timeToText } from '@/utils'
import {
  AuditOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  FileSearchOutlined, PlusOutlined, SearchOutlined,
  StopOutlined,
} from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'
import { onBeforeMount, ref } from 'vue'
import ModalDistributorDetails from '../distributor/details/ModalDistributorDetails.vue'

const modalDistributorDetails = ref<InstanceType<typeof ModalDistributorDetails>>()
const purchases = ref<Purchase[]>([])

const loadingComponent = ref(false)

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const timeRanger = ref<[Dayjs, Dayjs]>()
const paymentStatus = ref<PaymentStatus | ''>('')

const sortColumn = ref<'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    loadingComponent.value = true
    let sort
    if (sortColumn.value !== '' && sortValue.value !== '') {
      sort = { [sortColumn.value]: sortValue.value }
    }

    const response = await PurchaseReceiptService.pagination({
      relations: { distributor: true },
      filter: {
        from_time: timeRanger.value?.[0].startOf('day').valueOf(),
        to_time: timeRanger.value?.[1].endOf('day').valueOf(),
        payment_status: paymentStatus.value || undefined,
      },
      page: page.value,
      limit: limit.value,
      sort,
    })

    purchases.value = response.data
    total.value = response.total
    loadingComponent.value = false
  } catch (error) {
    console.log('🚀 ~ file: PurchaseReceiptList.vue:52 ~ error:', error)
  }
}

onBeforeMount(async () => {
  await startFetchData()
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const handleSelectPaymentStatus = async (value: PaymentStatus | '') => {
  await startSearch()
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
  <ModalDistributorDetails ref="modalDistributorDetails" />
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.3rem;">
        <AuditOutlined style="margin-right: 1rem" />Danh sách phiếu nhập hàng
        <a-button type="primary" @click="$router.push({ name: 'PurchaseReceiptUpsert' })" class="ml-4">
          <template #icon>
            <PlusOutlined />
          </template>
          Tạo phiếu mới
        </a-button>
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
    <div class="flex flex-wrap gap-4 items-end">
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
            <th>Nhà cung cấp</th>
            <th>Tổng Tiền</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="purchases.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(purchase, index) in purchases" :key="index">
            <td class="text-center">
              <a @click="$router.push({ name: 'PurchaseReceiptDetails', params: { id: purchase.id } })">
                PC{{ purchase.id }}
              </a>
            </td>
            <td class="text-center">{{ timeToText(purchase.createTime, 'hh:mm DD/MM/YYYY') }}</td>
            <td>
              <div class="flex justify-between">
                <div>{{ purchase.distributor?.fullNameVi }}</div>
                <a class="text-xl" @click="modalDistributorDetails?.openModal(purchase.distributor!)">
                  <FileSearchOutlined />
                </a>
              </div>
            </td>
            <td class="text-right">{{ formatNumber(purchase.totalMoney) }}</td>
            <td class="text-center">
              <a-tag v-if="purchase.paymentStatus === PaymentStatus.Unpaid" color="warning">
                <template #icon>
                  <ExclamationCircleOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Unpaid] }}
              </a-tag>
              <a-tag v-if="purchase.paymentStatus === PaymentStatus.Full" color="success">
                <template #icon>
                  <CheckCircleOutlined />
                </template>
                {{ PaymentStatusText[PaymentStatus.Full] }}
              </a-tag>
              <a-tag v-if="purchase.paymentStatus === PaymentStatus.Refund" color="error">
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
