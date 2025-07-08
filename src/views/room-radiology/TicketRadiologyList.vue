<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { IconEye, IconPrint } from '@/common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconEditSquare } from '@/common/icon-google'
import { AlertStore } from '@/common/vue-alert'
import { InputDate, InputOptions, InputSelect, VueSelect } from '@/common/vue-form'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { CustomerService, type Customer } from '@/modules/customer'
import { PermissionId } from '@/modules/permission/permission.enum'
import { compiledTemplatePrintHtml, PrintHtmlService } from '@/modules/print-html'
import { Radiology, RadiologyService } from '@/modules/radiology'
import {
  TicketRadiology,
  TicketRadiologyApi,
  TicketRadiologyService,
  TicketRadiologyStatus,
} from '@/modules/ticket-radiology'
import { DString, ESDom, ESTimer } from '@/utils'
import { onBeforeMount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Breadcrumb from '../component/Breadcrumb.vue'
import ModalTicketRadiologyGroupResult from './ModalTicketRadiologyResult.vue'
import TicketRadiologyStatusTag from './TicketRadiologyStatusTag.vue'
import { fromTime, toTime } from './ticket-radiology-list.ref'

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission, organization } = MeService
const modalTicketRadiologyGroupResult = ref<InstanceType<typeof ModalTicketRadiologyGroupResult>>()

const customerList = ref<Customer[]>([])
const dataLoading = ref(false)

const customerId = ref<number>()
const status = ref<TicketRadiologyStatus | null>(null)

const sortColumn = ref<'registeredAt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const page = ref(1)
const limit = ref(Number(localStorage.getItem('TICKET_RADIOLOGY_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const radiologyMap = RadiologyService.radiologyMap
const ticketRadiologyList = ref<TicketRadiology[]>([])

const startFetchData = async (options?: { noLoading?: boolean }) => {
  try {
    if (options?.noLoading) {
      dataLoading.value = false
    } else {
      dataLoading.value = true
    }

    const { data, meta } = await TicketRadiologyApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {
        customer: true,
        ticket: true,
        ticketUserList: false,
        radiology: false,
      },
      filter: {
        customerId: customerId.value ? customerId.value : undefined,
        status: status.value ? status.value : undefined,
        registeredAt:
          fromTime.value || toTime.value
            ? {
                GTE: fromTime.value ? fromTime.value : undefined,
                LT: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
              }
            : undefined,
      },
      sort: sortValue.value
        ? {
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
            registeredAt: sortColumn.value === 'registeredAt' ? sortValue.value : undefined,
          }
        : { registeredAt: 'DESC' },
    })

    ticketRadiologyList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicList.vue:84 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

onBeforeMount(async () => {
  try {
    await Promise.all([startFetchData(), CustomerService.refreshDB(), RadiologyService.reloadMap()])
  } catch (error) {
    console.log('🚀 ~ onBeforeMount ~ error:', error)
  }
})

watch(
  () => TicketRadiologyService.refreshTime.value,
  async () => await startFetchData({ noLoading: true }),
)

const handleFocusFirstSearchCustomer = async () => {
  await CustomerService.refreshDB()
}

const searchingCustomer = async (text: string) => {
  if (!text) {
    customerList.value = []
    if (customerId.value) {
      // nếu đang chọn customer rồi, thì khi xóa hết text đi thì quay về search với text = ''
      customerId.value = undefined
      await startFetchData()
    }
  } else {
    customerList.value = await CustomerService.search(text)
  }
}

const selectCustomer = async (data?: Customer) => {
  customerId.value = data?.id
  await startFetchData()
}

const startFilter = async () => {
  page.value = 1
  await startFetchData()
}

const changeSort = async (column: 'id' | 'registeredAt') => {
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
  await startFilter()
}

const changePage = async (pageSelect: number) => {
  await startFetchData()
}

const changeLimit = async (limitSelect: any) => {
  limit.value = limitSelect
  localStorage.setItem('TICKET_RADIOLOGY_PAGINATION_LIMIT', String(limitSelect))
  await startFetchData()
}

const startPrint = async (ticketRadiologyData: TicketRadiology) => {
  try {
    const radiologyData = ticketRadiologyData.radiology || Radiology.blank()
    let printHtmlId = radiologyData.printHtmlId
    const printHtmlHeader = await PrintHtmlService.getPrintHtmlHeader()
    const printHtmlRadiology = await PrintHtmlService.getPrintHtmlRadiology(printHtmlId)

    if (!printHtmlHeader || !printHtmlRadiology || !printHtmlRadiology.html) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const compiledHeader = compiledTemplatePrintHtml({
      organization: organization.value,
      ticket: ticketRadiologyData.ticket!,
      masterData: {
        customer: ticketRadiologyData.customer!,
      },
      data: ticketRadiologyData,
      printHtml: printHtmlHeader,
      customVariables: radiologyData.customVariables || '',
    })
    const compiledContent = compiledTemplatePrintHtml({
      organization: organization.value,
      ticket: ticketRadiologyData.ticket!,
      masterData: {
        customer: ticketRadiologyData.customer!,
      },
      data: ticketRadiologyData,
      printHtml: printHtmlRadiology,
      _LAYOUT: {
        HEADER: compiledHeader.html,
      },
      customVariables: radiologyData.customVariables || '',
    })

    if (!compiledContent.html) {
      AlertStore.addError('Mẫu in không hợp lệ')
      return
    }

    await ESDom.startPrint('iframe-print', {
      html: compiledContent.html,
      cssList: [compiledHeader.css, compiledContent.css, radiologyData.customStyles],
    })
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
  }
}
</script>

<template>
  <ModalTicketRadiologyGroupResult ref="modalTicketRadiologyGroupResult" />
  <div class="mx-4 mt-4 gap-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="hidden md:block">
        <Breadcrumb />
      </div>
    </div>
    <div class="mr-2 flex items-center gap-4 flex-wrap"></div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 1; flex-basis: 250px">
        <div>Khách hàng</div>
        <div>
          <InputOptions
            ref="inputSearchCustomer"
            :options="customerList.map((i) => ({ value: i.id, text: i.fullName, data: i }))"
            :maxHeight="260"
            placeholder="Tên hoặc Số Điện Thoại"
            @selectItem="({ data }) => selectCustomer(data)"
            @onFocusinFirst="handleFocusFirstSearchCustomer"
            @update:text="searchingCustomer"
          >
            <template #option="{ item: { data } }">
              <div>
                <b>{{ data.fullName }}</b>
                - {{ data.phone }} -
                {{ ESTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
              </div>
              <div>
                {{ data.addressWard }} - {{ data.addressDistrict }} - {{ data.addressProvince }}
              </div>
            </template>
          </InputOptions>
        </div>
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <div>Từ ngày</div>
        <div>
          <InputDate
            v-model:value="fromTime"
            type-parser="number"
            class="w-full"
            @selectTime="startFilter"
          />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <div>Đến ngày</div>
        <div>
          <InputDate
            v-model:value="toTime"
            type-parser="number"
            class="w-full"
            @selectTime="startFilter"
          />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 150px">
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            v-model:value="status"
            :options="[
              { value: null, text: 'Tất cả' },
              { value: TicketRadiologyStatus.Pending, text: 'Đang chờ' },
              { value: TicketRadiologyStatus.Completed, text: 'Hoàn thành' },
            ]"
            @update:value="startFilter"
          />
        </div>
      </div>

      <div>
        <div>&nbsp;</div>
        <div>
          <VueButton color="blue" @click="startFilter">Tìm kiếm</VueButton>
        </div>
      </div>
    </div>

    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th style="width: 40px">Mã</th>
            <th style="min-width: 150px">Khách hàng</th>
            <th>Tên phiếu</th>
            <th class="">Trạng thái</th>
            <th class="cursor-pointer" @click="changeSort('registeredAt')">
              <div class="flex items-center gap-1 justify-center">
                <span>TG Chỉ định</span>
                <IconSort v-if="sortColumn !== 'registeredAt'" style="opacity: 0.4" />
                <IconSortUp
                  v-if="sortColumn === 'registeredAt' && sortValue === 'ASC'"
                  style="opacity: 0.4"
                />
                <IconSortDown
                  v-if="sortColumn === 'registeredAt' && sortValue === 'DESC'"
                  style="opacity: 0.4"
                />
              </div>
            </th>
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
          <tr v-if="ticketRadiologyList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(ticketRadiology, index) in ticketRadiologyList" :key="index">
            <td>
              <div class="flex justify-center items-center gap-2">
                {{
                  (ticketRadiology.ticket?.date?.toString()?.padStart(2, '0') || '') +
                  ticketRadiology.ticket?.month?.toString().padStart(2, '0') +
                  ticketRadiology.ticket?.year?.toString().slice(-2) +
                  '_' +
                  ticketRadiology.ticket?.dailyIndex?.toString().padStart(2, '0') +
                  '_' +
                  ticketRadiology.id
                }}
              </div>
            </td>
            <td>
              <div>
                {{ ticketRadiology.customer?.fullName }}
              </div>
              <div v-if="ticketRadiology.customer?.note" class="text-xs italic">
                {{ ticketRadiology.customer?.note }}
              </div>
              <div class="text-xs italic">
                {{ DString.formatAddress(ticketRadiology.customer!) }}
              </div>
            </td>
            <td class="">
              {{ radiologyMap[ticketRadiology.radiologyId]?.name }}
            </td>
            <td class="text-center">
              <TicketRadiologyStatusTag :status="ticketRadiology.status" />
            </td>
            <td class="text-center">
              {{ ESTimer.timeToText(ticketRadiology.registeredAt, 'hh:mm DD/MM/YYYY') }}
            </td>

            <td class="text-center">
              <a
                v-if="userPermission[PermissionId.RADIOLOGY_RESULT]"
                class="text-orange-500"
                @click="modalTicketRadiologyGroupResult?.openModal(ticketRadiology.id)"
              >
                <IconEditSquare width="20" height="20" />
              </a>
              <a
                v-else
                @click="
                  modalTicketRadiologyGroupResult?.openModal(ticketRadiology.id, { noEdit: true })
                "
              >
                <IconEye width="22" height="22" />
              </a>
            </td>

            <td class="text-center">
              <a v-if="ticketRadiology.startedAt != null" @click="startPrint(ticketRadiology)">
                <IconPrint width="18" height="18" />
              </a>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="my-4 flex flex-wrap justify-end items-center gap-4">
        <div class="">Tổng: {{ total }}</div>
        <VuePagination
          class="ml-auto"
          v-model:page="page"
          :total="total"
          :limit="limit"
          @update:page="changePage"
        />
        <InputSelect
          v-model:value="limit"
          @update:value="changeLimit"
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
