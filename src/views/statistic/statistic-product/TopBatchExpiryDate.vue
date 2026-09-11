<script setup lang="ts">
import { IconDownload } from '@/common/icon-google'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { FileBatchApi } from '@/modules/file-excel/file-batch.api'
import { BugDevelopment } from '@/views/component'
import { computed, onBeforeMount, ref } from 'vue'
import VuePagination from '../../../common/VuePagination.vue'
import { IconFileSearch } from '../../../common/icon-antd'
import { InputNumber, InputSelect } from '../../../common/vue-form'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Batch, BatchApi } from '../../../modules/batch'
import { ESTimer } from '../../../utils'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const loaded = ref(false)
const batchList = ref<Batch[]>([])
const expiryMonth = ref(3)

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    loaded.value = false
    const paginationResponse = await BatchApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: { product: true, distributor: true },
      filter: {
        quantity: { NOT: 0 },
        expiryDate: {
          IS_NULL: false,
          LTE: Date.now() + expiryMonth.value * 30 * 24 * 60 * 60 * 1000,
        },
      },
      sort: { expiryDate: 'ASC' },
    })
    batchList.value = paginationResponse.batchList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ file: TopBatchExpiryDate.vue:36 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

onBeforeMount(async () => await startFetchData())

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit

  await startFetchData()
}

const now = computed(() => {
  return Date.now()
})

const expiryDateWarn = computed(() => {
  return Date.now() + 3 * 30 * 24 * 60 * 60 * 1000
})

const downloadExcelBatchStatistic = async () => {
  ModalStore.confirm({
    title: 'Xác nhận tải file báo cáo',
    content: 'Thời gian tải file có thể tốn vài phút nếu dữ liệu lớn, bạn vẫn mốn tải ?',
    onOk: async () => {
      await FileBatchApi.downloadExcel({
        relation: { product: true, distributor: true },
        filter: {
          quantity: { NOT: 0 },
          expiryDate: {
            IS_NULL: false,
            LTE: Date.now() + expiryMonth.value * 30 * 24 * 60 * 60 * 1000,
          },
        },
      })
    },
  })
}
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <div>
    <div class="mt-4 flex flex-wrap items-center">
      <span style="font-size: 18px; font-weight: 500">Hàng cận date:</span>
      <div class="ml-auto flex gap-4">
        <div style="width: 150px">
          <InputNumber v-model:value="expiryMonth" append="tháng" @update:value="startFetchData" />
        </div>
        <div
          style="cursor: pointer; border: 1px solid #ccc; padding: 4px; border-radius: 4px"
          @click="downloadExcelBatchStatistic"
        >
          <IconDownload width="20" height="20" />
        </div>
      </div>
    </div>
    <div class="mt-2 table-wrapper">
      <table class="">
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>#</th>
            <th>Mã sản phẩm</th>
            <th>Tên sản phẩm</th>
            <th>Nhà cung cấp</th>
            <th>HSD</th>
            <th>SL</th>
            <th>ĐV</th>
            <th>Giá</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="batchList.length === 0">
            <td colspan="20" class="text-center">Không có sản phẩm cận date</td>
          </tr>
          <tr v-for="(batch, batchIndex) in batchList" :key="batchIndex">
            <td v-if="CONFIG.MODE === 'development'" class="text-center">
              <BugDevelopment :data="batch" />
            </td>
            <td class="text-center" style="white-space: nowrap">
              {{ batchIndex + 1 }}
            </td>
            <td class="text-center" style="white-space: nowrap">
              {{ batch.product?.productCode }}
            </td>
            <td>
              <div class="flex gap-2">
                <div class="font-medium text-justify">
                  {{ batch.product?.brandName }}
                </div>
                <div>
                  <a @click="modalProductDetail?.openModal(batch.product!)">
                    <IconFileSearch />
                  </a>
                </div>
              </div>
              <div v-if="batch.product?.substance" style="font-size: 0.8rem">
                {{ batch.product?.substance }}
              </div>
            </td>
            <td class="text-center" style="white-space: nowrap">
              {{ batch.distributor?.fullName }}
            </td>
            <td
              class="text-center"
              style="white-space: nowrap"
              :style="
                batch.expiryDate && batch.expiryDate < now
                  ? 'color:red; font-weight:500'
                  : batch.expiryDate && batch.expiryDate < expiryDateWarn
                    ? 'color:orange; font-weight:500'
                    : ''
              "
            >
              {{ ESTimer.timeToText(batch.expiryDate) }}
            </td>
            <td class="text-center" style="white-space: nowrap">
              {{ batch.quantity }}
            </td>
            <td class="text-center" style="white-space: nowrap">
              {{ batch.product?.unitBasicName }}
            </td>
            <td class="text-right" style="white-space: nowrap">
              {{ formatMoney(batch.product?.retailPrice || 0) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="py-4 flex flex-wrap justify-end gap-4">
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
