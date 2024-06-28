<script setup lang="ts">
import {
  AuditOutlined,
  FileSearchOutlined,
  FormOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'
import { onBeforeMount, ref } from 'vue'
import { VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Receipt, ReceiptStatus, useReceiptStore } from '../../../modules/receipt'
import { timeToText } from '../../../utils'
import ModalDistributorDetail from '../../distributor/detail/ModalDistributorDetail.vue'
import ReceiptStatusTag from '../ReceiptStatusTag.vue'
import { EReceiptUpsertMode } from '../upsert/receipt-upsert.store'
import VueButton from '../../../common/VueButton.vue'

const modalDistributorDetail = ref<InstanceType<typeof ModalDistributorDetail>>()

const receiptStore = useReceiptStore()
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const receipts = ref<Receipt[]>([])

const loadingComponent = ref(false)
const page = ref(1)
const limit = ref(Number(localStorage.getItem('RECEIPT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const timeRanger = ref<[Dayjs, Dayjs]>()
const receiptStatus = ref<ReceiptStatus | null>(null)

const sortColumn = ref<'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    loadingComponent.value = true

    const fromTime = timeRanger.value?.[0].startOf('day').toISOString()
    const toTime = timeRanger.value?.[1].endOf('day').toISOString()

    const { data, meta } = await receiptStore.pagination({
      relation: { distributor: true },
      filter: {
        startedAt: fromTime && toTime ? { BETWEEN: [fromTime, toTime] } : undefined,
        deletedAt: { IS_NULL: true },
        status: receiptStatus.value ?? undefined,
      },
      page: page.value,
      limit: limit.value,
      sort: sortValue.value
        ? { id: sortColumn.value === 'id' ? sortValue.value : undefined }
        : { id: 'DESC' },
    })

    receipts.value = data
    total.value = meta.total
    loadingComponent.value = false
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

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    // modalSettingArrivalList.value?.openModal()
  }
}
</script>

<template>
  <ModalDistributorDetail ref="modalDistributorDetail" />
  <div class="page-header">
    <div class="flex items-center gap-4">
      <div
        class="hidden md:block"
        style="font-size: 1.25rem; font-weight: 500; line-height: 1.75rem"
      >
        <AuditOutlined class="mr-1" /> Danh sách phiếu nhập hàng
      </div>
      <div>
        <VueButton
          v-if="permissionIdMap[PermissionId.RECEIPT_CREATE_DRAFT]"
          class="btn btn-blue"
          @click="
            $router.push({ name: 'ReceiptUpsert', query: { mode: EReceiptUpsertMode.CREATE } })
          "
        >
          <PlusOutlined /> Tạo phiếu nhập hàng mới
        </VueButton>
      </div>
    </div>
    <div class="page-header-setting">
      <!-- <a-dropdown trigger="click">
          <span style="font-size: 1.2rem; cursor: pointer;">
            <SettingOutlined />
          </span>
          <template #overlay>
            <a-menu @click="handleMenuSettingClick">
              <a-menu-item key="screen-setting"> Cài đặt hiển thị </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown> -->
    </div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn thời gian</div>
        <div>
          <a-range-picker
            v-model:value="timeRanger"
            :onChange="handleChangeTime"
            format="DD-MM-YYYY"
            style="width: 100%"
            :placeholder="['DD-MM-YYYY', 'DD-MM-YYYY']"
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
              { text: 'Tạm ứng (Chờ nhập hàng)', value: ReceiptStatus.Prepayment },
              { text: 'Nợ (Đã gửi hàng)', value: ReceiptStatus.Debt },
              { text: 'Hoàn thành', value: ReceiptStatus.Success },
              { text: 'Hoàn trả', value: ReceiptStatus.Refund },
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
          <tbody>
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
                    <FileSearchOutlined class="ml-1" />
                  </a>
                </div>
                <div class="text-xs">
                  {{ timeToText(receipt.startedAt, 'hh:mm DD/MM/YYYY') }}
                </div>
                <div v-if="receipt.distributor?.note" class="text-xs italic">
                  {{ receipt.distributor?.note }}
                </div>
              </td>
              <td class="text-right">
                <div>{{ formatMoney(receipt.totalMoney) }}</div>
                <div v-if="receipt.debt" class="text-xs">Nợ: {{ formatMoney(receipt.debt) }}</div>
              </td>
              <td class="text-left">
                <ReceiptStatusTag :status="receipt.status" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-4 float-right mb-2">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          size="small"
          :total="total"
          show-size-changer
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
        />
      </div>
    </div>

    <div v-if="!isMobile" class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">
              Mã &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'id'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4"
              />
              <font-awesome-icon
                v-if="sortColumn === 'id' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']"
              />
              <font-awesome-icon
                v-if="sortColumn === 'id' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']"
              />
            </th>
            <th>Thời gian</th>
            <th>Nhà cung cấp</th>
            <th>Tổng Tiền</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="receipts.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(receipt, index) in receipts" :key="index">
            <td class="text-center">RC{{ receipt.id }}</td>
            <td class="text-center">
              {{ timeToText(receipt.startedAt, 'hh:mm DD/MM/YYYY') }}
            </td>
            <td>
              <div>
                {{ receipt.distributor?.fullName }}
                <a class="ml-1" @click="modalDistributorDetail?.openModal(receipt.distributorId)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div v-if="receipt.distributor?.note" class="text-xs italic">
                {{ receipt.distributor?.note }}
              </div>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(receipt.totalMoney) }}</div>
              <div v-if="receipt.debt" class="text-xs">Nợ: {{ formatMoney(receipt.debt) }}</div>
            </td>
            <td class="text-center">
              <ReceiptStatusTag :status="receipt.status" />
            </td>
            <td v-if="permissionIdMap[PermissionId.RECEIPT_READ]" class="text-center">
              <router-link :to="{ name: 'ReceiptDetail', params: { id: receipt.id } }">
                <span style="color: #eca52b" class="text-xl">
                  <FormOutlined />
                </span>
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="mt-4 float-right mb-2">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          :total="total"
          show-size-changer
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
        />
      </div>
    </div>
  </div>
</template>
