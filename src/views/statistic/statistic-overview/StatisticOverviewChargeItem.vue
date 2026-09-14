<script setup lang="ts">
import { VuePagination, VueTag } from '@/common'
import { InputDate, InputSelect } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import {
  TicketProcedureApi,
  TicketProcedureType,
  type TicketProcedure,
} from '@/modules/ticket-procedure'
import { TicketProductApi, type TicketProduct } from '@/modules/ticket-product'
import { TicketRadiologyApi, type TicketRadiology } from '@/modules/ticket-radiology'
import { ESTimer } from '@/utils'
import { BugDevelopment } from '@/views/component'
import TicketRadiologyStatusTooltip from '@/views/room/room-radiology/TicketRadiologyStatusTooltip.vue'
import TicketDeliveryStatusTooltip from '@/views/room/room-ticket-base/TicketDeliveryStatusTooltip.vue'
import TicketItemPaymentTypeTooltip from '@/views/room/room-ticket-base/TicketItemPaymentTypeTooltip.vue'
import TicketProcedureStatusTooltip from '@/views/room/room-ticket-clinic/detail/procedure/TicketProcedureStatusTooltip.vue'
import { onBeforeMount, reactive, ref } from 'vue'

const { userPermission, organizationPermission } = MeService
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const fromTime = ref<number>(ESTimer.startOfMonth(new Date()).getTime())
const toTime = ref<number>(ESTimer.endOfMonth(new Date()).getTime())

const ticketProductPagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  ticketProductList: <TicketProduct[]>[],
})
const ticketProcedurePagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  ticketProcedureList: <TicketProcedure[]>[],
})
const ticketRadiologyPagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  ticketRadiologyList: <TicketRadiology[]>[],
})

const loaded = ref(false)

onBeforeMount(async () => await startFetchData())

const getCreatedTimeFilter = () => ({
  GTE: fromTime.value ? ESTimer.startOfDate(fromTime.value).getTime() : undefined,
  LT: toTime.value ? ESTimer.endOfDate(toTime.value).getTime() : undefined,
})

const startFetchTicketProduct = async () => {
  try {
    const fetchPromise = await TicketProductApi.pagination({
      relation: { customer: true, product: true },
      filter: {
        createdAt: getCreatedTimeFilter(),
      },
      page: ticketProductPagination.page,
      limit: ticketProductPagination.limit,
    })
    ticketProductPagination.ticketProductList = fetchPromise.ticketProductList
    ticketProductPagination.total = fetchPromise.total
  } catch (error) {
    console.log('🚀 ~ StatisticOverviewChargeItem.vue:37 ~ startFetchTicketProduct ~ error:', error)
  }
}

const startFetchTicketProcedure = async () => {
  try {
    const fetchPromise = await TicketProcedureApi.pagination({
      relation: { customer: true, procedure: true },
      filter: {
        createdAt: getCreatedTimeFilter(),
      },
      page: ticketProcedurePagination.page,
      limit: ticketProcedurePagination.limit,
    })
    ticketProcedurePagination.ticketProcedureList = fetchPromise.ticketProcedureList
    ticketProcedurePagination.total = fetchPromise.total
  } catch (error) {
    console.log(
      '🚀 ~ StatisticOverviewChargeItem.vue:83 ~ startFetchTicketProcedure ~ error:',
      error,
    )
  }
}

const startFetchTicketRadiology = async () => {
  try {
    const fetchPromise = await TicketRadiologyApi.pagination({
      relation: { customer: true, radiology: {} },
      filter: {
        createdAt: getCreatedTimeFilter(),
      },
      page: ticketRadiologyPagination.page,
      limit: ticketRadiologyPagination.limit,
    })
    ticketRadiologyPagination.ticketRadiologyList = fetchPromise.ticketRadiologyList
    ticketRadiologyPagination.total = fetchPromise.total
  } catch (error) {
    console.log(
      '🚀 ~ StatisticOverviewChargeItem.vue:88 ~ startFetchTicketRadiology ~ error:',
      error,
    )
  }
}

const startFetchData = async () => {
  try {
    loaded.value = false
    await Promise.all([
      startFetchTicketProduct(),
      startFetchTicketProcedure(),
      startFetchTicketRadiology(),
    ])
  } catch (error) {
    console.log('🚀 ~ file: StatisticOverviewChargeItem.vue:49 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

const handleChangeTime = async (value: any) => {
  await startFetchData()
}
</script>

<template>
  <div class="mt-4">
    <div class="flex justify-end gap-4">
      <div style="flex-basis: 150px">
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

      <div style="flex-basis: 150px">
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
    </div>
    <div>
      <div style="font-weight: 500; font-size: 16px">
        Thống kê sản phẩm ({{ ticketProductPagination.total }})
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th v-if="CONFIG.MODE === 'development'"></th>
              <th>#</th>
              <th></th>
              <th></th>
              <th>Thời gian</th>
              <th>Khách hàng</th>
              <th>Tên sản phẩm</th>
              <th>Số lượng</th>
              <th>Đơn vị</th>
              <th>Đơn giá</th>
              <th>Chiết khấu</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="ticketProductPagination.ticketProductList!.length === 0">
              <td colspan="20" class="text-center">Không có dữ liệu</td>
            </tr>
            <tr
              v-for="(ticketProduct, index) in ticketProductPagination.ticketProductList || []"
              :key="ticketProduct._localId"
            >
              <td v-if="CONFIG.MODE === 'development'" style="text-align: center">
                <BugDevelopment :data="ticketProduct" />
              </td>
              <td class="text-center">
                {{ index + 1 + (ticketProductPagination.page - 1) * ticketProductPagination.limit }}
              </td>
              <td>
                <TicketItemPaymentTypeTooltip
                  :ticketItemPaymentType="ticketProduct.ticketItemPaymentType"
                />
              </td>
              <td class="text-center">
                <TicketDeliveryStatusTooltip :deliveryStatus="ticketProduct.deliveryStatusFix" />
              </td>
              <td class="text-center">
                {{ ESTimer.timeToText(ticketProduct.createdAt, 'hh:mm DD/MM/YYYY') }}
              </td>
              <td>
                {{ ticketProduct.customer?.fullName }}
              </td>
              <td>
                <div style="font-weight: 500">
                  {{ ticketProduct.product?.brandName }}
                </div>
                <div class="text-xs">{{ ticketProduct.product?.substance }}</div>
              </td>
              <td class="text-center">
                {{ formatMoney(ticketProduct.unitQuantity) }}
              </td>
              <td class="text-center whitespace-nowrap">
                {{ ticketProduct.unitName }}
              </td>
              <td class="text-right whitespace-nowrap">
                <div v-if="ticketProduct.unitDiscountMoney" class="text-xs italic text-red-500">
                  <del>{{ formatMoney(ticketProduct.unitExpectedPrice) }}</del>
                </div>
                <div>{{ formatMoney(ticketProduct.unitActualPrice) }}</div>
              </td>
              <td class="text-center">
                <div v-if="ticketProduct.discountMoney">
                  <VueTag v-if="ticketProduct.discountType === 'VNĐ'" color="green">
                    {{ formatMoney(ticketProduct.discountMoney) }}
                  </VueTag>
                  <VueTag v-if="ticketProduct.discountType === '%'" color="green">
                    {{ ticketProduct.discountPercent || 0 }}%
                  </VueTag>
                </div>
              </td>
              <td class="text-right whitespace-nowrap">
                {{ formatMoney(ticketProduct.unitActualPrice * ticketProduct.unitQuantity || 0) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 flex flex-wrap justify-end gap-4">
        <VuePagination
          class="ml-auto"
          v-model:page="ticketProductPagination.page"
          :total="ticketProductPagination.total"
          :limit="ticketProductPagination.limit"
          @update:page="(p: any) => startFetchTicketProduct()"
        />
        <InputSelect
          v-model:value="ticketProductPagination.limit"
          @update:value="(l: any) => startFetchTicketProduct()"
          :options="[
            { value: 10, label: '10 / page' },
            { value: 20, label: '20 / page' },
            { value: 50, label: '50 / page' },
            { value: 100, label: '100 / page' },
          ]"
        />
      </div>
    </div>

    <div class="mt-4">
      <div style="font-weight: 500; font-size: 16px">
        Thống kê dịch vụ ({{ ticketProcedurePagination.total }})
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th v-if="CONFIG.MODE === 'development'"></th>
              <th>#</th>
              <th></th>
              <th></th>
              <th>Thời gian</th>
              <th>Khách hàng</th>
              <th>Tên dịch vụ</th>
              <th>Số lượng</th>
              <th>Đơn giá</th>
              <th>Chiết khấu</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="ticketProcedurePagination.ticketProcedureList.length === 0">
              <td colspan="20" class="text-center">Không có dữ liệu</td>
            </tr>
            <tr
              v-for="(ticketProcedure, index) in ticketProcedurePagination.ticketProcedureList"
              :key="ticketProcedure.id"
            >
              <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                <BugDevelopment :data="ticketProcedure" />
              </td>
              <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
                {{
                  index + 1 + (ticketProcedurePagination.page - 1) * ticketProcedurePagination.limit
                }}
              </td>
              <td>
                <TicketItemPaymentTypeTooltip
                  :ticketItemPaymentType="ticketProcedure.ticketItemPaymentType"
                />
              </td>
              <td class="text-center">
                <TicketProcedureStatusTooltip :status="ticketProcedure.status" />
              </td>
              <td class="text-center">
                {{ ESTimer.timeToText(ticketProcedure.createdAt, 'hh:mm DD/MM/YYYY') }}
              </td>
              <td>
                {{ ticketProcedure.customer?.fullName }}
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <span>{{ ticketProcedure.procedure?.name }}</span>
                  <span
                    style="font-weight: 500"
                    v-if="ticketProcedure.ticketProcedureType === TicketProcedureType.InRegimen"
                  >
                    ({{ ticketProcedure.indexSession }})
                  </span>
                </div>
              </td>
              <td class="text-center">
                {{ ticketProcedure.quantity }}
              </td>

              <td class="text-right whitespace-nowrap">
                <div v-if="ticketProcedure.discountMoney" class="text-xs italic text-red-500">
                  <del>{{ formatMoney(ticketProcedure.expectedPrice) }}</del>
                </div>
                <div>{{ formatMoney(ticketProcedure.actualPrice) }}</div>
              </td>

              <td class="text-center">
                <div v-if="ticketProcedure.discountMoney">
                  <VueTag v-if="ticketProcedure.discountType === 'VNĐ'" color="green">
                    {{ formatMoney(ticketProcedure.discountMoney) }}
                  </VueTag>
                  <VueTag v-if="ticketProcedure.discountType === '%'" color="green">
                    {{ ticketProcedure.discountPercent || 0 }}%
                  </VueTag>
                </div>
              </td>
              <td class="text-right whitespace-nowrap">
                {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 flex flex-wrap justify-end gap-4">
        <VuePagination
          class="ml-auto"
          v-model:page="ticketProcedurePagination.page"
          :total="ticketProcedurePagination.total"
          :limit="ticketProcedurePagination.limit"
          @update:page="(p: any) => startFetchTicketProcedure()"
        />
        <InputSelect
          v-model:value="ticketProcedurePagination.limit"
          @update:value="(l: any) => startFetchTicketProcedure()"
          :options="[
            { value: 10, label: '10 / page' },
            { value: 20, label: '20 / page' },
            { value: 50, label: '50 / page' },
            { value: 100, label: '100 / page' },
          ]"
        />
      </div>
    </div>

    <div class="mt-4">
      <div style="font-weight: 500; font-size: 16px">
        Thống kê phiếu CĐHA ({{ ticketRadiologyPagination.total }})
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th v-if="CONFIG.MODE === 'development'"></th>
              <th>#</th>
              <th></th>
              <th></th>
              <th>Thời gian</th>
              <th>Khách hàng</th>
              <th>Tên phiếu</th>
              <th>Đơn giá</th>
              <th>Chiết khấu</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="ticketRadiologyPagination.ticketRadiologyList.length === 0">
              <td colspan="20" class="text-center">Không có dữ liệu</td>
            </tr>
            <tr
              v-for="(ticketRadiology, index) in ticketRadiologyPagination.ticketRadiologyList"
              :key="ticketRadiology.id"
            >
              <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                <BugDevelopment :data="ticketRadiology" />
              </td>
              <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
                {{
                  index + 1 + (ticketRadiologyPagination.page - 1) * ticketRadiologyPagination.limit
                }}
              </td>
              <td>
                <TicketItemPaymentTypeTooltip
                  :ticketItemPaymentType="ticketRadiology.ticketItemPaymentType"
                />
              </td>
              <td class="text-center">
                <TicketRadiologyStatusTooltip :status="ticketRadiology.status" />
              </td>
              <td class="text-center">
                {{ ESTimer.timeToText(ticketRadiology.createdAt, 'hh:mm DD/MM/YYYY') }}
              </td>
              <td>
                {{ ticketRadiology.customer?.fullName }}
              </td>
              <td>
                <span>{{ ticketRadiology.radiology?.name }}</span>
              </td>

              <td class="text-right whitespace-nowrap">
                <div v-if="ticketRadiology.discountMoney" class="text-xs italic text-red-500">
                  <del>{{ formatMoney(ticketRadiology.expectedPrice) }}</del>
                </div>
                <div>{{ formatMoney(ticketRadiology.actualPrice) }}</div>
              </td>

              <td class="text-center">
                <div v-if="ticketRadiology.discountMoney">
                  <VueTag v-if="ticketRadiology.discountType === 'VNĐ'" color="green">
                    {{ formatMoney(ticketRadiology.discountMoney) }}
                  </VueTag>
                  <VueTag v-if="ticketRadiology.discountType === '%'" color="green">
                    {{ ticketRadiology.discountPercent || 0 }}%
                  </VueTag>
                </div>
              </td>
              <td class="text-right whitespace-nowrap">
                {{ formatMoney(ticketRadiology.actualPrice) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 flex flex-wrap justify-end gap-4">
        <VuePagination
          class="ml-auto"
          v-model:page="ticketRadiologyPagination.page"
          :total="ticketRadiologyPagination.total"
          :limit="ticketRadiologyPagination.limit"
          @update:page="(p: any) => startFetchTicketRadiology()"
        />
        <InputSelect
          v-model:value="ticketRadiologyPagination.limit"
          @update:value="(l: any) => startFetchTicketRadiology()"
          :options="[
            { value: 10, label: '10 / page' },
            { value: 20, label: '20 / page' },
            { value: 50, label: '50 / page' },
            { value: 100, label: '100 / page' },
          ]"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
