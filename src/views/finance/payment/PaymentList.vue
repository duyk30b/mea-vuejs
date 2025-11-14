<script setup lang="ts">
import { VueButton, VuePagination, VueTag } from '@/common'
import { IconBug, IconFileSearch, IconPrint } from '@/common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconEditSquare } from '@/common/icon-google'
import { InputDate, InputSelect, VueSelect } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import type { Customer } from '@/modules/customer'
import { WalletService } from '@/modules/wallet'
import { PaymentApi } from '@/modules/payment/payment.api'
import type { PaymentPaginationQuery } from '@/modules/payment/payment.dto'
import {
  MoneyDirection,
  Payment,
  PaymentActionType,
  PaymentActionTypeText,
  PaymentPersonType,
  PaymentVoucherType,
} from '@/modules/payment/payment.model'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PrintHtmlAction } from '@/modules/print-html'
import { ESTimer } from '@/utils'
import { Breadcrumb } from '@/views/component'
import ModalCustomerDetail from '@/views/customer/detail/ModalCustomerDetail.vue'
import ModalDistributorDetail from '@/views/distributor/detail/ModalDistributorDetail.vue'
import LinkAndStatusPurchaseOrder from '@/views/purchase-order/LinkAndStatusPurchaseOrder.vue'
import LinkAndStatusTicket from '@/views/room/room-ticket-base/LinkAndStatusTicket.vue'
import { onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import ModalCustomerPaymentMoneyIn from './ModalCustomerPaymentMoneyIn.vue'
import ModalDistributorPaymentMoneyOut from './ModalDistributorPaymentMoneyOut.vue'
import ModalOtherPaymentMoney from './ModalOtherPaymentMoney.vue'
import ModalPaymentUpdateInfo from './ModalPaymentUpdateInfo.vue'
import TicketLink from '@/views/room/room-ticket-base/TicketLink.vue'
import PurchaseOrderLink from '@/views/purchase-order/PurchaseOrderLink.vue'
import { VueTooltip } from '@/common/popover'

const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalCustomerPaymentMoneyIn = ref<InstanceType<typeof ModalCustomerPaymentMoneyIn>>()
const modalDistributorPaymentMoneyOut = ref<InstanceType<typeof ModalDistributorPaymentMoneyOut>>()
const modalOtherPaymentMoney = ref<InstanceType<typeof ModalOtherPaymentMoney>>()
const modalPaymentUpdateInfo = ref<InstanceType<typeof ModalPaymentUpdateInfo>>()

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, organization } = MeService

const paymentList = ref<Payment[]>([])

const dataLoading = ref(false)
const page = ref(1)
const limit = ref(Number(localStorage.getItem('PAYMENT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const moneyDirection = ref<MoneyDirection | null>(null)
const walletId = ref<number>(0)
const walletOptions = ref<{ value: string; text: string }[]>([])
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
        ticket: true,
        purchaseOrder: true,
        customer: true,
        distributor: true,
        cashier: true,
        wallet: true,
        paymentTicketItemList: true,
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
        walletId: walletId.value ? walletId.value : undefined,
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
    console.log('🚀 ~ file: PurchaseOrderList.vue:52 ~ error:', error)
  }
}

onBeforeMount(async () => {
  await startFetchData()
  const walletList = await WalletService.list({})
  walletOptions.value = walletList.map((i) => {
    return { value: i.id, text: i.name }
  })
  walletOptions.value.unshift({ value: '', text: 'Tất cả' })
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

const startPrintCustomerPayment = async (options: { customer: Customer; payment: Payment }) => {
  const payment = options.payment
  const paymentPrint = await Payment.refreshData(payment)
  await PrintHtmlAction.startPrintCustomerPayment({
    customer: options.customer!,
    payment: paymentPrint,
  })
}

const startPrintCustomerRefund = async (options: { customer: Customer; payment: Payment }) => {
  const payment = options.payment
  const paymentPrint = await Payment.refreshData(payment)
  await PrintHtmlAction.startPrintCustomerRefund({
    customer: options.customer!,
    payment: paymentPrint,
  })
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
  <ModalPaymentUpdateInfo ref="modalPaymentUpdateInfo" @success="startFetchData" />
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
            {{ formatMoney(st.sumPaidAmount) }}
          </div>
        </template>
        <template v-if="st.moneyDirection === MoneyDirection.Other">
          <div class="card-title">Khác</div>
          <div class="card-number" style="font-weight: 500">
            {{ formatMoney(st.sumPaidAmount) }}
          </div>
        </template>
      </div>

      <div class="ml-auto">
        <div class="flex flex-wrap gap-2">
          <div>
            <VueButton
              v-if="userPermission[PermissionId.PAYMENT_OTHER_CREATE_MONEY_IN]"
              color="green"
              icon="plus"
              @click="modalOtherPaymentMoney?.openModal(MoneyDirection.In)"
            >
              Tạo phiếu thu
            </VueButton>
          </div>
          <div>
            <VueButton
              v-if="userPermission[PermissionId.PAYMENT_OTHER_CREATE_MONEY_OUT]"
              color="blue"
              icon="plus"
              @click="modalOtherPaymentMoney?.openModal(MoneyDirection.Out)"
            >
              Tạo phiếu chi
            </VueButton>
          </div>
        </div>
        <div class="mt-2 flex gap-2">
          <!-- <div style="width: 220px">
            <VueButton
              v-if="userPermission[PermissionId.PAYMENT_DISTRIBUTOR_PAYMENT]"
              color="blue"
              icon="plus"
              @click="modalDistributorPaymentMoneyOut?.openModal()"
            >
              Tạo phiếu chi N.Cung Cấp
            </VueButton>
          </div> -->
          <!-- <div style="width: 220px">
            <VueButton
              v-if="userPermission[PermissionId.PAYMENT_CUSTOMER_PAYMENT]"
              color="green"
              icon="plus"
              @click="modalCustomerPaymentMoneyIn?.openModal()"
            >
              Tạo phiếu thu Khách Hàng
            </VueButton>
          </div> -->
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
              { value: MoneyDirection.Other, text: 'Khác' },
            ]"
            @update:value="startSearch"
          />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 250px">
        <div>Hình thức thanh toán</div>
        <div>
          <VueSelect
            v-model:value="walletId"
            :options="walletOptions"
            @update:value="startSearch"
          />
        </div>
      </div>
    </div>
    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>Phiếu</th>
            <th>Loại</th>
            <th>Người nộp/nhận</th>
            <th style="min-width: 100px">Lý do</th>
            <th>Tiền thu</th>
            <th>Tiền chi</th>
            <th>Ghi nợ</th>
            <th>Trả nợ</th>
            <th>Ví thanh toán</th>
            <th>NV thu/chi</th>
            <th></th>
            <th></th>
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
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              <VueTooltip>
                <template #trigger>
                  <IconBug width="1.2em" height="1.2em" />
                </template>
                <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
                  <pre>{{ JSON.stringify(payment, null, 4) }}</pre>
                </div>
              </VueTooltip>
            </td>
            <td>
              <div v-if="payment.voucherType === PaymentVoucherType.Ticket">
                <TicketLink :ticket="payment.ticket!" :ticketId="payment.voucherId" />
              </div>
              <div v-if="payment.voucherType === PaymentVoucherType.PurchaseOrder">
                <PurchaseOrderLink
                  :purchaseOrder="payment.purchaseOrder"
                  :purchaseOrderId="payment.voucherId"
                />
              </div>
              <div style="font-size: 0.9em">
                <span style="white-space: nowrap">
                  {{ ESTimer.timeToText(payment.createdAt, 'hh:mm DD/MM/YYYY') }}
                </span>
              </div>
            </td>
            <td>
              <div class="text-left" v-if="payment.moneyDirection === MoneyDirection.In">
                <VueTag color="blue" icon="dollar">Phiếu thu</VueTag>
              </div>
              <div class="text-right" v-if="payment.moneyDirection === MoneyDirection.Out">
                <VueTag color="green" icon="dollar">Phiếu chi</VueTag>
              </div>
              <div class="text-center" v-if="payment.moneyDirection === MoneyDirection.Other">
                <VueTag color="purple" icon="dollar">Khác</VueTag>
              </div>
            </td>
            <td class="">
              <div v-if="payment.personType === PaymentPersonType.Distributor">
                <span>{{ payment.distributor?.fullName }}</span>
                <a class="ml-1" @click="modalDistributorDetail?.openModal(payment.personId)">
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="payment.personType === PaymentPersonType.Customer">
                <span>{{ payment.customer?.fullName }}</span>
                <a class="ml-1" @click="modalCustomerDetail?.openModal(payment.personId)">
                  <IconFileSearch />
                </a>
              </div>
              <div
                v-if="payment.personOpenDebt !== 0 || payment.personCloseDebt !== 0"
                style="white-space: nowrap; font-size: 0.9em"
              >
                Nợ: {{ formatMoney(payment.personOpenDebt) }} ➞
                {{ formatMoney(payment.personCloseDebt) }}
              </div>
            </td>
            <td>
              <div>{{ PaymentActionTypeText[payment.paymentActionType] }}</div>
              <div v-if="payment.note" style="font-size: 0.9em; color: #555">
                {{ payment.note }}
              </div>
            </td>
            <td class="text-right">
              <span v-if="payment.moneyDirection === MoneyDirection.In">
                {{ formatMoney(payment.paidAmount) }}
              </span>
            </td>
            <td class="text-right">
              <span v-if="payment.moneyDirection === MoneyDirection.Out">
                {{ formatMoney(payment.paidAmount) }}
              </span>
            </td>
            <td class="text-right">
              <span v-if="payment.debtAmount > 0">{{ formatMoney(payment.debtAmount) }}</span>
            </td>
            <td class="text-right">
              <span v-if="payment.debtAmount < 0">{{ formatMoney(-payment.debtAmount) }}</span>
            </td>
            <td>
              <div>{{ payment.wallet?.name }}</div>
              <div style="white-space: nowrap; font-size: 0.9em">
                {{ formatMoney(payment.walletOpenMoney) }} ➞
                {{ formatMoney(payment.walletCloseMoney) }}
              </div>
            </td>
            <td>{{ payment.cashier?.fullName }}</td>
            <td>
              <IconEditSquare
                style="font-size: 20px; color: var(--text-orange); cursor: pointer"
                @click="modalPaymentUpdateInfo?.openModal(payment)"
              />
            </td>
            <td class="text-center">
              <IconPrint
                v-if="
                  [
                    PaymentActionType.PrepaymentForTicketItemList,
                    PaymentActionType.PrepaymentMoney,
                    PaymentActionType.PayDebt,
                  ].includes(payment.paymentActionType)
                "
                style="font-size: 18px; color: var(--text-blue); cursor: pointer"
                @click="startPrintCustomerPayment({ payment, customer: payment.customer })"
              />
              <IconPrint
                v-if="
                  [
                    PaymentActionType.RefundForTicketItemList,
                    PaymentActionType.RefundMoney,
                  ].includes(payment.paymentActionType)
                "
                style="font-size: 18px; color: var(--text-green); cursor: pointer"
                @click="startPrintCustomerRefund({ payment, customer: payment.customer })"
              />
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
