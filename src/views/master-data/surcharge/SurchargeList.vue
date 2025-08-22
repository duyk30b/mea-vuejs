<script setup lang="ts">
import { CONFIG } from '@/config'
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VuePagination from '../../../common/VuePagination.vue'
import { IconEditSquare } from '../../../common/icon-google'
import { InputSelect } from '../../../common/vue-form'
import { MeService } from '../../../modules/_me/me.service'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { SurchargeService, type Surcharge } from '../../../modules/surcharge'
import Breadcrumb from '../../component/Breadcrumb.vue'
import ModalSurchargeUpsert from './SurchargeUpsert.vue'

const modalSurchargeUpsert = ref<InstanceType<typeof ModalSurchargeUpsert>>()

const { userPermission } = MeService

const surchargeList = ref<Surcharge[]>([])

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const paginationResponse = await SurchargeService.pagination({
      page: page.value,
      limit: limit.value,
      relation: {},
      filter: {},
      sort: { id: 'ASC' },
    })

    surchargeList.value = paginationResponse.surchargeList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ SurchargeList.vue:45 ~ startFetchData ~ error:', error)
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

const handleModalSurchargeUpsertSuccess = async (
  data: Surcharge,
  type: 'CREATE' | 'UPDATE' | 'DESTROY',
) => {
  await startFetchData()
}
</script>

<template>
  <ModalSurchargeUpsert ref="modalSurchargeUpsert" @success="handleModalSurchargeUpsertSuccess" />
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div>
      <VueButton
        v-if="userPermission[PermissionId.MASTER_DATA_WAREHOUSE]"
        color="blue"
        icon="plus"
        @click="modalSurchargeUpsert?.openModal()"
      >
        Thêm mới
      </VueButton>
    </div>
    <div class="ml-auto flex items-center gap-8"></div>
  </div>

  <div class="mt-4 md:mx-4 p-4 bg-white">
    <div class="w-full">
      <details>
        <summary style="font-style: italic">Giải thích chi tiết về phụ phí</summary>
        <div class="mt-4">
          <p class="italic">
            - Tiền
            <b>phụ phí</b>
            là tiền thu thêm người mua khi mua hàng
          </p>
        </div>
        <p>
          - Các phụ phí thường gặp như:
          <b>tiền vận chuyển</b>
          , tiền tư vấn, ...
        </p>
        <p class="italic">- Công thức tính tổng tiền đơn hàng:</p>
        <div class="mt-4 flex">
          <div class="ml-4 p-2" style="border: 1px solid #cdcdcd">
            <span class="mx-2 font-bold">Tổng tiền</span>
            =
            <span class="mx-2">Tiền hàng</span>
            -
            <span class="mx-2">Chiết khấu</span>
            +
            <span class="mx-2 font-bold">Phụ phí</span>
          </div>
        </div>
      </details>
    </div>
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
          <tr v-if="surchargeList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="surcharge in surchargeList" :key="surcharge.id">
            <td
              v-if="CONFIG.MODE === 'development'"
              class="text-center"
              style="width: 100px; color: violet"
            >
              {{ surcharge.id }}
            </td>
            <td class="text-center" style="width: 100px">{{ surcharge.code }}</td>
            <td>{{ surcharge.name }}</td>
            <td
              v-if="userPermission[PermissionId.MASTER_DATA_PAYMENT_METHOD]"
              class="text-center"
              style="width: 100px"
            >
              <a
                style="color: var(--text-orange)"
                @click="modalSurchargeUpsert?.openModal(surcharge.id)"
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
