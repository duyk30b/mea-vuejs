<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VuePagination from '../../../common/VuePagination.vue'
import { IconFileSearch, IconGroup, IconPlus, IconSetting } from '../../../common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '../../../common/icon-font-awesome'
import { IconVisibility } from '../../../common/icon-google'
import VueDropdown from '../../../common/popover/VueDropdown.vue'
import { InputDate, InputSelect, VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Receipt, ReceiptApi, ReceiptStatus } from '../../../modules/receipt'
import { timeToText } from '../../../utils'
import ModalDistributorDetail from '../../distributor/detail/ModalDistributorDetail.vue'
import ReceiptStatusTag from '../ReceiptStatusTag.vue'
import { EReceiptUpsertMode } from '../upsert/receipt-upsert.store'
import ModalReceiptListSetting from './ModalReceiptListSetting.vue'
import Breadcrumb from '../../component/Breadcrumb.vue'

const modalReceiptListSetting = ref<InstanceType<typeof ModalReceiptListSetting>>()
const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const receipts = ref<Receipt[]>([])

const dataLoading = ref(false)
const page = ref(1)
const limit = ref(Number(localStorage.getItem('RECEIPT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const receiptStatus = ref<ReceiptStatus | null>(null)
const fromTime = ref<number>()
const toTime = ref<number>()

const sortColumn = ref<'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const { data, meta } = await ReceiptApi.pagination({
      relation: {
        distributor: true,
        receiptItemList: settingStore.SCREEN_RECEIPT_LIST.receiptItems
          ? { product: true, batch: false }
          : false,
      },
      filter: {
        startedAt:
          fromTime.value || toTime.value
            ? {
                GTE: fromTime.value ? fromTime.value : undefined,
                LT: toTime.value ? toTime.value + 24 * 60 * 60 * 1000 : undefined,
              }
            : undefined,
        status: receiptStatus.value !== null ? receiptStatus.value : undefined,
      },
      page: page.value,
      limit: limit.value,
      sort: sortValue.value
        ? { id: sortColumn.value === 'id' ? sortValue.value : undefined }
        : { id: 'DESC' },
    })

    receipts.value = data
    total.value = meta.total
    dataLoading.value = false
  } catch (error) {
    console.log('🚀 ~ file: ReceiptList.vue:52 ~ error:', error)
  }
}

onBeforeMount(async () => {
  await startFetchData()
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
    localStorage.setItem('RECEIPT_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}
</script>

<template>
  <ModalReceiptListSetting
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalReceiptListSetting"
  />
  <ModalDistributorDetail ref="modalDistributorDetail" />

  <div class="mx-4 mt-4 gap-2 flex items-center">
    <div class="hidden md:flex gap-2 items-center text-lg font-medium">
      <Breadcrumb />
    </div>
    <div>
      <VueButton
        v-if="permissionIdMap[PermissionId.RECEIPT_DRAFT_CRUD]"
        color="blue"
        icon="plus"
        @click="$router.push({ name: 'ReceiptUpsert', query: { mode: EReceiptUpsertMode.CREATE } })"
      >
        Tạo phiếu nhập hàng mới
      </VueButton>
    </div>
    <div class="ml-auto flex items-center gap-4 flex-wrap">
      <VueDropdown>
        <template #trigger>
          <span style="font-size: 1.2rem; cursor: pointer">
            <IconSetting />
          </span>
        </template>
        <div class="vue-menu">
          <a
            v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
            @click="modalReceiptListSetting?.openModal()"
          >
            Cài đặt hiển thị
          </a>
        </div>
      </VueDropdown>
    </div>
  </div>

  <div class="page-main">
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
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            v-model:value="receiptStatus"
            :options="[
              { text: 'Tất cả', value: null },
              { text: 'Nháp', value: ReceiptStatus.Draft },
              { text: 'Tạm ứng (Chờ nhập hàng)', value: ReceiptStatus.Deposited },
              { text: 'Nợ (Đã gửi hàng)', value: ReceiptStatus.Debt },
              { text: 'Hoàn thành', value: ReceiptStatus.Completed },
              { text: 'Hủy', value: ReceiptStatus.Cancelled },
            ]"
            @update:value="startSearch"
          />
        </div>
      </div>
    </div>

    <div v-if="isMobile" class="page-main-list" style="width: 100%">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nhà cung cấp</th>
              <th>Tiền</th>
              <th>T.Thái</th>
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
            <tr v-if="receipts.length === 0">
              <td colspan="20" class="text-center">Không có dữ liệu</td>
            </tr>
            <tr
              v-for="(receipt, index) in receipts"
              :key="index"
              @dblclick="$router.push({ name: 'ReceiptDetail', params: { id: receipt.id } })"
            >
              <td>
                <div class="font-medium text-justify">
                  {{ receipt.distributor?.fullName }}
                  <a
                    class="text-base"
                    @click="modalDistributorDetail?.openModal(receipt.distributorId)"
                  >
                    <IconFileSearch class="ml-1" />
                  </a>
                </div>
                <div class="text-xs">
                  {{ timeToText(receipt.startedAt, 'hh:mm DD/MM/YYYY') }}
                </div>
                <div v-if="receipt.distributor?.note" class="text-xs italic">
                  {{ receipt.distributor?.note }}
                </div>
                <div class="text-xs">
                  {{ (receipt.receiptItemList || []).map((i) => i.product?.brandName).join(', ') }}
                </div>
              </td>
              <td class="text-right">
                <div>{{ formatMoney(receipt.totalMoney) }}</div>
                <div v-if="receipt.debt" class="text-xs">Nợ: {{ formatMoney(receipt.debt) }}</div>
              </td>
              <td class="text-left">
                <ReceiptStatusTag :receipt="receipt" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="!isMobile" class="page-main-table table-wrapper">
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
            <th>Thời gian</th>
            <th>Trạng thái</th>
            <th>Nhà cung cấp</th>
            <th v-if="settingStore.SCREEN_RECEIPT_LIST.receiptItems">Sản phẩm</th>
            <th>Tổng Tiền</th>
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
          <tr v-if="receipts.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(receipt, index) in receipts" :key="index">
            <td class="text-center" style="white-space: nowrap">
              <router-link :to="{ name: 'ReceiptDetail', params: { id: receipt.id } }">
                NH{{ receipt.id }}
                <span class="text-lg ml-1">
                  <IconVisibility />
                </span>
              </router-link>
            </td>
            <td style="white-space: nowrap" class="text-center">
              {{ timeToText(receipt.startedAt, 'hh:mm DD/MM/YYYY') }}
            </td>
            <td class="text-center">
              <ReceiptStatusTag :receipt="receipt" />
            </td>
            <td>
              <div>
                {{ receipt.distributor?.fullName }}
                <a class="ml-1" @click="modalDistributorDetail?.openModal(receipt.distributorId)">
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="receipt.distributor?.note" class="text-xs italic">
                {{ receipt.distributor?.note }}
              </div>
            </td>
            <td v-if="settingStore.SCREEN_RECEIPT_LIST.receiptItems">
              <div>
                {{ (receipt.receiptItemList || []).map((i) => i.product?.brandName).join(', ') }}
              </div>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(receipt.totalMoney) }}</div>
              <div v-if="receipt.debt" class="text-xs italic">
                Nợ: {{ formatMoney(receipt.debt) }}
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
