<script setup lang="ts">
import { PrintHtmlAction } from '@/modules/print-html'
import { onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import VuePagination from '../../../common/VuePagination.vue'
import { IconFileSearch, IconPrint, IconSetting } from '../../../common/icon-antd'
import { IconSort, IconSortDown, IconSortUp } from '../../../common/icon-font-awesome'
import { IconVisibility } from '../../../common/icon-google'
import VueDropdown from '../../../common/popover/VueDropdown.vue'
import { InputDate, InputSelect, VueSelect } from '../../../common/vue-form'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import {
  PurchaseOrder,
  PurchaseOrderQueryApi,
  PurchaseOrderStatus,
} from '../../../modules/purchase-order'
import { timeToText } from '../../../utils'
import Breadcrumb from '../../component/Breadcrumb.vue'
import ModalDistributorDetail from '../../distributor/detail/ModalDistributorDetail.vue'
import PurchaseOrderStatusTag from '../PurchaseOrderStatusTag.vue'
import { EPurchaseOrderUpsertMode } from '../upsert/purchase-order-upsert.store'
import ModalPurchaseOrderListSetting from './ModalPurchaseOrderListSetting.vue'

const modalPurchaseOrderListSetting = ref<InstanceType<typeof ModalPurchaseOrderListSetting>>()
const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const purchaseOrderList = ref<PurchaseOrder[]>([])

const dataLoading = ref(false)
const page = ref(1)
const limit = ref(Number(localStorage.getItem('PURCHASE_ORDER_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const purchaseOrderStatus = ref<PurchaseOrderStatus | null>(null)
const fromTime = ref<number>()
const toTime = ref<number>()

const sortColumn = ref<'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const paginationResponse = await PurchaseOrderQueryApi.pagination({
      relation: {
        distributor: true,
        purchaseOrderItemList: settingStore.SCREEN_PURCHASE_ORDER_LIST.purchaseOrderItems
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
        status: purchaseOrderStatus.value !== null ? purchaseOrderStatus.value : undefined,
      },
      page: page.value,
      limit: limit.value,
      sort: sortValue.value
        ? { id: sortColumn.value === 'id' ? sortValue.value : undefined }
        : { id: 'DESC' },
    })

    purchaseOrderList.value = paginationResponse.purchaseOrderList
    total.value = paginationResponse.total
    dataLoading.value = false
  } catch (error) {
    console.log('🚀 ~ file: PurchaseOrderList.vue:52 ~ error:', error)
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
    localStorage.setItem('PURCHASE_ORDER_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const startPrintPurchaseOrderDetail = async (purchaseOrderId: number) => {
  const purchaseOrderData = await PurchaseOrderQueryApi.detail(purchaseOrderId, {
    relation: {
      distributor: true,
      purchaseOrderItemList: { product: true },
    },
  })
  await PrintHtmlAction.startPrintPurchaseOrderDetail({ purchaseOrder: purchaseOrderData })
}
</script>

<template>
  <ModalPurchaseOrderListSetting
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalPurchaseOrderListSetting"
  />
  <ModalDistributorDetail ref="modalDistributorDetail" />

  <div class="mx-4 mt-4 gap-2 flex items-center">
    <div class="hidden md:flex gap-2 items-center text-lg font-medium">
      <Breadcrumb />
    </div>
    <div>
      <VueButton
        v-if="userPermission[PermissionId.PURCHASE_ORDER_DRAFT_CRUD]"
        color="blue"
        icon="plus"
        @click="
          router.push({
            name: 'PurchaseOrderUpsertContainer',
            query: { mode: EPurchaseOrderUpsertMode.CREATE },
          })
        "
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
            v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
            @click="modalPurchaseOrderListSetting?.openModal()"
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
            v-model:value="purchaseOrderStatus"
            :options="[
              { text: 'Tất cả', value: null },
              { text: 'Nháp', value: PurchaseOrderStatus.Draft },
              { text: 'Tạm ứng (Chờ nhập hàng)', value: PurchaseOrderStatus.Deposited },
              { text: 'Nợ (Đã gửi hàng)', value: PurchaseOrderStatus.Debt },
              { text: 'Hoàn thành', value: PurchaseOrderStatus.Completed },
              { text: 'Hủy', value: PurchaseOrderStatus.Cancelled },
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
            <tr v-if="purchaseOrderList.length === 0">
              <td colspan="20" class="text-center">Không có dữ liệu</td>
            </tr>
            <tr
              v-for="(purchaseOrder, index) in purchaseOrderList"
              :key="index"
              @dblclick="
                router.push({
                  name: 'PurchaseOrderDetailContainer',
                  params: { id: purchaseOrder.id },
                })
              "
            >
              <td>
                <div class="font-medium text-justify">
                  {{ purchaseOrder.distributor?.fullName }}
                  <a
                    class="text-base"
                    @click="modalDistributorDetail?.openModal(purchaseOrder.distributorId)"
                  >
                    <IconFileSearch class="ml-1" />
                  </a>
                </div>
                <div class="text-xs">
                  {{ timeToText(purchaseOrder.startedAt, 'hh:mm DD/MM/YYYY') }}
                </div>
                <div v-if="purchaseOrder.distributor?.note" class="text-xs italic">
                  {{ purchaseOrder.distributor?.note }}
                </div>
                <div class="text-xs">
                  {{
                    (purchaseOrder.purchaseOrderItemList || [])
                      .map((i) => i.product?.brandName)
                      .join(', ')
                  }}
                </div>
              </td>
              <td class="text-right">
                <div>{{ formatMoney(purchaseOrder.totalMoney) }}</div>
                <div v-if="purchaseOrder.debt" class="text-xs">
                  Nợ: {{ formatMoney(purchaseOrder.debt) }}
                </div>
              </td>
              <td class="text-left">
                <PurchaseOrderStatusTag :purchaseOrder="purchaseOrder" />
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
            <th v-if="settingStore.SCREEN_PURCHASE_ORDER_LIST.purchaseOrderItems">Sản phẩm</th>
            <th>Tổng Tiền</th>
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
          <tr v-if="purchaseOrderList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(purchaseOrder, index) in purchaseOrderList" :key="index">
            <td class="text-center" style="white-space: nowrap">
              <router-link
                :to="{ name: 'PurchaseOrderDetailContainer', params: { id: purchaseOrder.id } }"
              >
                NH{{ purchaseOrder.id }}
                <span class="text-lg ml-1">
                  <IconVisibility />
                </span>
              </router-link>
            </td>
            <td style="white-space: nowrap" class="text-center">
              {{ timeToText(purchaseOrder.startedAt, 'hh:mm DD/MM/YYYY') }}
            </td>
            <td class="text-center">
              <PurchaseOrderStatusTag :purchaseOrder="purchaseOrder" />
            </td>
            <td>
              <div>
                {{ purchaseOrder.distributor?.fullName }}
                <a
                  class="ml-1"
                  @click="modalDistributorDetail?.openModal(purchaseOrder.distributorId)"
                >
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="purchaseOrder.distributor?.note" class="text-xs italic">
                {{ purchaseOrder.distributor?.note }}
              </div>
            </td>
            <td v-if="settingStore.SCREEN_PURCHASE_ORDER_LIST.purchaseOrderItems">
              <div class="max-line-2">
                {{
                  (purchaseOrder.purchaseOrderItemList || [])
                    .map((i) => i.product?.brandName)
                    .join(', ')
                }}
              </div>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(purchaseOrder.totalMoney) }}</div>
              <div v-if="purchaseOrder.debt" class="text-xs italic">
                Nợ: {{ formatMoney(purchaseOrder.debt) }}
              </div>
            </td>
            <td>
              <div
                class="flex items-center justify-center cursor-pointer"
                style="color: var(--text-blue)"
                @click="startPrintPurchaseOrderDetail(purchaseOrder.id)"
              >
                <IconPrint width="16px" height="16px" />
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
