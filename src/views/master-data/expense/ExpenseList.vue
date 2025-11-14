<script setup lang="ts">
import { CONFIG } from '@/config'
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VuePagination from '../../../common/VuePagination.vue'
import { IconEditSquare } from '../../../common/icon-google'
import { InputSelect } from '../../../common/vue-form'
import { MeService } from '../../../modules/_me/me.service'
import { ExpenseService, type Expense } from '../../../modules/expense'
import { PermissionId } from '../../../modules/permission/permission.enum'
import Breadcrumb from '../../component/Breadcrumb.vue'
import ModalExpenseUpsert from './ExpenseUpsert.vue'

const modalExpenseUpsert = ref<InstanceType<typeof ModalExpenseUpsert>>()

const { userPermission } = MeService

const expenseList = ref<Expense[]>([])

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const paginationResponse = await ExpenseService.pagination({
      page: page.value,
      limit: limit.value,
      relation: {},
      filter: {},
      sort: { id: 'ASC' },
    })

    expenseList.value = paginationResponse.expenseList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ ExpenseList.vue:45 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit

  startFetchData()
}

onBeforeMount(async () => {
  await startFetchData()
})

const handleModalExpenseUpsertSuccess = async (
  data: Expense,
  type: 'CREATE' | 'UPDATE' | 'DESTROY',
) => {
  await startFetchData()
}
</script>

<template>
  <ModalExpenseUpsert ref="modalExpenseUpsert" @success="handleModalExpenseUpsertSuccess" />
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div>
      <VueButton
        v-if="userPermission[PermissionId.MASTER_DATA_WAREHOUSE]"
        color="blue"
        icon="plus"
        @click="modalExpenseUpsert?.openModal()"
      >
        Thêm mới
      </VueButton>
    </div>
    <div class="ml-auto flex items-center gap-8"></div>
  </div>

  <div class="mt-4 md:mx-4 p-4 bg-white">
    <details class="my-2">
      <summary style="font-style: italic">Giải thích chi tiết về chi phí</summary>
      <div class="mt-4">
        <p class="italic">
          - Tiền
          <b>chi phí</b>
          là tiền
          <b>người bán phải chịu</b>
          khi tạo đơn hàng
        </p>
      </div>
      <p>
        - Các chi phí thường gặp như:
        <b>tiền đóng gói</b>
        , tiền hao hụt, thất thoát, tiền bảo quản ...
      </p>
      <div class="italic">- Công thức tính lãi của đơn hàng:</div>
      <div class="mt-4 flex">
        <div class="ml-4 p-2" style="border: 1px solid #cdcdcd">
          <span class="mx-2 font-bold">Tiền lãi</span>
          =
          <span class="mx-2">Tổng tiền</span>
          <span class="mx-2 font-bold">-</span>
          (
          <span class="mx-2">Tiền vốn</span>
          +
          <span class="mx-2">Hoa hồng nhân viên</span>
          +
          <span class="mx-2 font-bold">Chi phí</span>
          )
        </div>
      </div>
    </details>

    <div class="mt-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'" style="width: 50px">ID</th>
            <th style="width: 100px">Mã</th>
            <th>Tên</th>
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
        <tbody v-if="!dataLoading">
          <tr v-if="expenseList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="expense in expenseList" :key="expense.id">
            <td
              v-if="CONFIG.MODE === 'development'"
              class="text-center"
              style="width: 100px; color: violet"
            >
              {{ expense.id }}
            </td>
            <td class="text-center">{{ expense.code }}</td>
            <td>{{ expense.name }}</td>
            <td
              v-if="userPermission[PermissionId.MASTER_DATA_WALLET]"
              class="text-center"
              style="width: 100px"
            >
              <a
                style="color: var(--text-orange)"
                @click="modalExpenseUpsert?.openModal(expense.id)"
              >
                <IconEditSquare width="24px" height="24px" />
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="p-4 flex flex-wrap justify-end gap-4">
      <VuePagination
        v-model:page="page"
        :total="total"
        :limit="limit"
        @update:page="(p: any) => changePagination({ page: p, limit })"
      />
      <InputSelect
        v-model:value="limit"
        @update:value="(l: any) => changePagination({ page, limit: l })"
        :options="[
          { value: 10, label: '10 / page' },
          { value: 20, label: '20 / page' },
          { value: 50, label: '50 / page' },
          { value: 100, label: '100 / page' },
        ]"
      />
    </div>
  </div>
</template>
