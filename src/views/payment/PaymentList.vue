<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { VueButton, VuePagination, VueTag } from '../../common'
import { IconFileSearch } from '../../common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '../../common/icon-font-awesome'
import { IconVisibility } from '../../common/icon-google'
import { InputDate, InputSelect, VueSelect } from '../../common/vue-form'
import { MeService } from '../../modules/_me/me.service'
import { useSettingStore } from '../../modules/_me/setting.store'
import { PaymentMethodService } from '../../modules/payment-method'
import { PaymentApi } from '../../modules/payment/payment.api'
import type { PaymentPaginationQuery } from '../../modules/payment/payment.dto'
import {
MoneyDirection,
Payment,
PaymentTiming,
PersonType,
VoucherType,
} from '../../modules/payment/payment.model'
import { PermissionId } from '../../modules/permission/permission.enum'
import { ESTimer } from '../../utils'
import { Breadcrumb } from '../component'
import ModalCustomerDetail from '../customer/detail/ModalCustomerDetail.vue'
import ModalDistributorDetail from '../distributor/detail/ModalDistributorDetail.vue'
import ModalCustomerPaymentMoneyIn from './ModalCustomerPaymentMoneyIn.vue'
import ModalDistributorPaymentMoneyOut from './ModalDistributorPaymentMoneyOut.vue'
import ModalOtherPaymentMoney from './ModalOtherPaymentMoney.vue'
import PaymentTimingTag from './PaymentTimingTag.vue'

const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalCustomerPaymentMoneyIn = ref<InstanceType<typeof ModalCustomerPaymentMoneyIn>>()
const modalDistributorPaymentMoneyOut = ref<InstanceType<typeof ModalDistributorPaymentMoneyOut>>()
const modalOtherPaymentMoney = ref<InstanceType<typeof ModalOtherPaymentMoney>>()

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const paymentList = ref<Payment[]>([])

const dataLoading = ref(false)
const page = ref(1)
const limit = ref(Number(localStorage.getItem('PAYMENT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const moneyDirection = ref<MoneyDirection | null>(null)
const paymentMethodId = ref<number>(0)
const paymentMethodOptions = ref<{ value: number; text: string }[]>([])
const fromTime = ref<number>(ESTimer.startOfMonth(new Date()).getTime())
const toTime = ref<number>(ESTimer.endOfMonth(new Date()).getTime())

const sortColumn = ref<'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const statistics = ref<
  {
    moneyDirection: MoneyDirection
    sumPaidAmount: number
    count: number
  }[]
>([])

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const query: PaymentPaginationQuery = {
      relation: {
        customer: true,
        distributor: true,
        employee: true,
        cashier: true,
        paymentMethod: true,
      },
      filter: {
        createdAt:
          fromTime.value || toTime.value
            ? {
                GTE: fromTime.value ? ESTimer.startOfDate(fromTime.value) : undefined,
                LT: toTime.value ? ESTimer.endOfDate(toTime.value) : undefined,
              }
            : undefined,
        moneyDirection: moneyDirection.value !== null ? moneyDirection.value : undefined,
        paymentMethodId: paymentMethodId.value ? paymentMethodId.value : undefined,
      },
      page: page.value,
      limit: limit.value,
      sort: sortValue.value
        ? { id: sortColumn.value === 'id' ? sortValue.value : undefined }
        : { createdAt: 'DESC' },
    }

    const [paginationResponse, sumMoneyResponse] = await Promise.all([
      PaymentApi.pagination(query),
      PaymentApi.sumMoney({ filter: query.filter }),
    ])

    paymentList.value = paginationResponse.paymentList
    total.value = paginationResponse.total
    statistics.value = sumMoneyResponse.aggregate
    dataLoading.value = false
  } catch (error) {
    console.log('🚀 ~ file: ReceiptList.vue:52 ~ error:', error)
  }
}

onBeforeMount(async () => {
  await startFetchData()
  const paymentMethodList = await PaymentMethodService.list({})
  paymentMethodOptions.value = paymentMethodList.map((i) => {
    return { value: i.id, text: i.name }
  })
  paymentMethodOptions.value.unshift({ value: 0, text: 'Tất cả' })
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const handleChangeTime = async (value: any) => {
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

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('PAYMENT_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}
</script>

<template>
  <ModalCustomerPaymentMoneyIn ref="modalCustomerPaymentMoneyIn" @success="startFetchData" />
  <ModalDistributorPaymentMoneyOut
    ref="modalDistributorPaymentMoneyOut"
    @success="startFetchData"
  />
  <ModalOtherPaymentMoney ref="modalOtherPaymentMoney" @success="startFetchData" />
  <ModalDistributorDetail ref="modalDistributorDetail" />
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <div class="mx-4 mt-4 gap-2 flex items-center">
    <div class="hidden md:flex gap-2 items-center text-lg font-medium">
      <Breadcrumb />
    </div>
  </div>

  <div class="page-main">
    <div class="mt-2 p-4 flex flex-wrap items-center gap-6">
      <div v-for="(st, i) in statistics" :key="i" class="card">
        <template v-if="st.moneyDirection === MoneyDirection.In">
          <div class="card-title">Tổng thu trong kỳ</div>
          <div class="card-number" style="font-weight: 500">
            {{ formatMoney(st.sumPaidAmount) }}
          </div>
        </template>
        <template v-if="st.moneyDirection === MoneyDirection.Out">
          <div class="card-title">Tổng chi trong kỳ</div>
          <div class="card-number" style="font-weight: 500">
            {{ formatMoney(-st.sumPaidAmount) }}
          </div>
        </template>
      </div>

      <div class="ml-auto">
        <div class="flex gap-2">
          <div style="width: 220px">
            <VueButton
              v-if="userPermission[PermissionId.PAYMENT_CUSTOMER_MONEY_IN]"
              color="green"
              icon="plus"
              @click="modalCustomerPaymentMoneyIn?.openModal()"
            >
              Tạo phiếu thu Khách Hàng
            </VueButton>
          </div>
          <div>
            <VueButton
              v-if="userPermission[PermissionId.PAYMENT_OTHER_MONEY_IN]"
              color="green"
              icon="plus"
              @click="modalOtherPaymentMoney?.openModal(MoneyDirection.In)"
            >
              Tạo phiếu thu khác
            </VueButton>
          </div>
        </div>
        <div class="mt-2 flex gap-2">
          <div style="width: 220px">
            <VueButton
              v-if="userPermission[PermissionId.PAYMENT_DISTRIBUTOR_MONEY_OUT]"
              color="blue"
              icon="plus"
              @click="modalDistributorPaymentMoneyOut?.openModal()"
            >
              Tạo phiếu chi N.Cung Cấp
            </VueButton>
          </div>
          <div>
            <VueButton
              v-if="userPermission[PermissionId.PAYMENT_OTHER_MONEY_OUT]"
              color="blue"
              icon="plus"
              @click="modalOtherPaymentMoney?.openModal(MoneyDirection.Out)"
            >
              Tạo phiếu chi khác
            </VueButton>
          </div>
        </div>
      </div>
    </div>

    <div class="page-main-options">
      <div style="flex: 1; flex-basis: 200px">
        <div>Từ ngày</div>
        <div>
          <InputDate
            v-model:value="fromTime"
            type-parser="number"
            class="w-full"
            @selectTime="handleChangeTime"
          />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 200px">
        <div>Đến ngày</div>
        <div>
          <InputDate
            v-model:value="toTime"
            type-parser="number"
            class="w-full"
            @selectTime="handleChangeTime"
          />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn loại thu/chi</div>
        <div>
          <VueSelect
            v-model:value="moneyDirection"
            :options="[
              { value: null, text: 'Tất cả' },
              { value: MoneyDirection.In, text: 'Phiếu thu' },
              { value: MoneyDirection.Out, text: 'Phiếu chi' },
            ]"
            @update:value="startSearch"
          />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 250px">
        <div>Hình thức thanh toán</div>
        <div>
          <VueSelect
            v-model:value="paymentMethodId"
            :options="paymentMethodOptions"
            @update:value="startSearch"
          />
        </div>
      </div>
    </div>
    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="cursor-pointer whitespace-nowrap" @click="changeSort('id')">
              <div class="flex items-center gap-1 justify-center">
                <span>Mã</span>
                <IconSort v-if="sortColumn !== 'id'" style="opacity: 0.4" />
                <IconSortUp
                  v-if="sortColumn === 'id' && sortValue === 'ASC'"
                  style="opacity: 0.4"
                />
                <IconSortDown
                  v-if="sortColumn === 'id' && sortValue === 'DESC'"
                  style="opacity: 0.4"
                />
              </div>
            </th>
            <th>Loại</th>
            <th style="min-width: 130px">Phiếu</th>
            <th>Người nộp</th>
            <th>Hành động</th>
            <th>Tiền thu</th>
            <th>Tiền chi</th>
            <th>Ghi nợ</th>
            <th>HT Thanh toán</th>
            <th>NV thu/chi</th>
          </tr>
        </thead>
        <tbody v-if="dataLoading">
          <tr>
            <td colspan="100">
              <div class="vue-skeleton-loading"></div>
              <div class="vue-skeleton-loading mt-2"></div>
            </td>
          </tr>
          <tr>
            <td colspan="100">
              <div class="vue-skeleton-loading"></div>
              <div class="vue-skeleton-loading mt-2"></div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-if="paymentList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(payment, index) in paymentList" :key="index">
            <td class="text-center" style="white-space: nowrap">P{{ payment.id }}</td>
            <td>
              <div class="text-left" v-if="payment.moneyDirection === MoneyDirection.In">
                <VueTag color="green" icon="dollar">Phiếu thu</VueTag>
              </div>
              <div class="text-right" v-if="payment.moneyDirection === MoneyDirection.Out">
                <VueTag color="blue" icon="dollar">Phiếu chi</VueTag>
              </div>
            </td>
            <td>
              <div v-if="payment.voucherType === VoucherType.Receipt">
                <router-link :to="{ name: 'ReceiptDetail', params: { id: payment.voucherId } }">
                  NH{{ payment.voucherId }}
                  <span class="text-lg ml-1">
                    <IconVisibility />
                  </span>
                </router-link>
              </div>
              <div v-if="payment.voucherType === VoucherType.Ticket">
                <router-link :to="{ name: 'TicketOrderDetail', params: { id: payment.voucherId } }">
                  BH{{ payment.voucherId }}
                  <span class="text-lg ml-1">
                    <IconVisibility />
                  </span>
                </router-link>
              </div>
              <div>{{ ESTimer.timeToText(payment.createdAt, 'hh:mm DD/MM/YYYY') }}</div>
            </td>
            <td class="">
              <div v-if="payment.personType === PersonType.Distributor">
                <span>{{ payment.distributor?.fullName }}</span>
                <a class="ml-1" @click="modalDistributorDetail?.openModal(payment.personId)">
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="payment.personType === PersonType.Customer">
                <span>{{ payment.customer?.fullName }}</span>
                <a class="ml-1" @click="modalCustomerDetail?.openModal(payment.personId)">
                  <IconFileSearch />
                </a>
              </div>
              <div style="min-width: 150px; font-size: 0.9em; color: #555">
                <div class="max-line-2" v-if="payment.note">{{ payment.note }}</div>
                <div class="max-line-2" v-if="payment.description">{{ payment.description }}</div>
              </div>
            </td>
            <td>
              <PaymentTimingTag :paymentTiming="payment.paymentTiming" />
              <div v-if="payment.paymentTiming === PaymentTiming.TopUp">
                {{ formatMoney(-payment.debtAmount) }}
              </div>
            </td>
            <td class="text-right">
              <span v-if="payment.paidAmount > 0">{{ formatMoney(payment.paidAmount) }}</span>
            </td>
            <td class="text-right">
              <span v-if="payment.paidAmount < 0">{{ formatMoney(-payment.paidAmount) }}</span>
            </td>
            <td class="text-right">
              <template v-if="payment.paymentTiming !== PaymentTiming.TopUp">
                {{ formatMoney(payment.debtAmount) }}
              </template>
            </td>
            <td>{{ payment.paymentMethod?.name }}</td>
            <td>
              <div>
                {{ payment.cashier?.fullName }}
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
      <InputSelect
        v-model:value="limit"
        @update:value="(l: any) => changePagination({ page, limit: l })"
        :options="[
          { value: 10, label: '10' },
          { value: 20, label: '20' },
          { value: 50, label: '50' },
          { value: 100, label: '100' },
        ]"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card {
  padding: 8px 20px;
  border: 1px solid #dedede;
  border-radius: 4px;
  box-shadow: 0 4px 2px 0 rgba(0, 0, 0, 0.2);
  width: 200px;
  @media screen and (max-width: 900px) {
    width: 45%;
  }
  .card-title {
    font-size: 12px;
    opacity: 0.8;
  }
  .card-number {
    font-size: 20px;
    font-weight: 500;
  }
}
</style>
