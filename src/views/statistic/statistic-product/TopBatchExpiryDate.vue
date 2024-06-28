<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { Batch, BatchApi } from '../../../modules/batch'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { timeToText } from '../../../utils'

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const loaded = ref(false)
const batchList = ref<Batch[]>([])

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    loaded.value = false
    const { data, meta } = await BatchApi.pagination({
      page: page.value,
      limit: limit.value,
      sort: { expiryDate: 'ASC' },
      filter: {
        quantity: { NOT: 0 },
        expiryDate: { IS_NULL: false },
      },
      relation: { product: true },
    })
    batchList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: ProductReport.vue:28 ~ startFetchData ~ error:', error)
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
</script>

<template>
  <div class="flex flex-col" style="height: 100%">
    <div class="flex justify-between items-center">
      <span style="font-size: 18px; font-weight: 500"> Hàng cận date: </span>
    </div>
    <div class="mt-2 table-wrapper">
      <table class="">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên HH</th>
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
          <tr v-for="(batch, index) in batchList" :key="index">
            <td class="text-center" style="white-space: nowrap">
              {{ index + 1 }}
            </td>
            <td>
              <div>{{ batch.product?.brandName }}</div>
              <div v-if="batch.product?.substance" style="font-size: 0.8rem">
                {{ batch.product?.substance }}
              </div>
            </td>
            <td class="text-center" style="white-space: nowrap">
              {{ timeToText(batch.expiryDate) }}
            </td>
            <td class="text-center" style="white-space: nowrap">
              {{ batch.unitQuantity }}
            </td>
            <td class="text-center" style="white-space: nowrap">
              {{ batch.product?.unitDefaultName }}
            </td>
            <td class="text-right" style="white-space: nowrap">
              {{ formatMoney(batch.product?.unitRetailPrice || 0) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="mt-4 float-right">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          :total="total"
          show-size-changer
          :size="isMobile ? 'small' : 'default'"
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
        />
      </div>
    </div>
  </div>
</template>
