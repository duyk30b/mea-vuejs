<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { ProductBatch, ProductBatchApi } from '../../../modules/product-batch'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { timeToText } from '../../../utils'

const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore

const loaded = ref(false)
const productBatchList = ref<ProductBatch[]>([])
const numberOfDaysToExpire = ref(180)

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    loaded.value = false
    const timeIsExpire = Date.now() + numberOfDaysToExpire.value * 24 * 60 * 60 * 1000
    const { data, meta } = await ProductBatchApi.pagination({
      page: page.value,
      limit: limit.value,
      sort: { expiryDate: 'ASC' },
      filter: {
        expiryDate: { LT: new Date(timeIsExpire).getTime() },
        quantity: { NOT: 0 },
      },
      relation: { product: true },
    })
    productBatchList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: ProductReport.vue:28 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

onBeforeMount(async () => await startFetchData())

const handleNumberOfDaysToExpiryDate = async (value: number) => {
  await startFetchData()
}

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
      <a-select
        v-model:value="numberOfDaysToExpire"
        allow-clear
        style="width: 150px"
        @change="handleNumberOfDaysToExpiryDate"
      >
        <a-select-option :value="90"> 3 tháng </a-select-option>
        <a-select-option :value="180"> 6 tháng </a-select-option>
        <a-select-option :value="365"> 1 năm </a-select-option>
        <a-select-option :value="730"> 2 năm </a-select-option>
      </a-select>
    </div>
    <div class="mt-3">
      <table class="table-mobile">
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
          <tr v-if="productBatchList.length === 0">
            <td colspan="20" class="text-center">Không có sản phẩm cận date</td>
          </tr>
          <tr v-for="(productBatch, index) in productBatchList" :key="index">
            <td class="text-center" style="white-space: nowrap">
              {{ index + 1 }}
            </td>
            <td>
              <div>{{ productBatch.product?.brandName }}</div>
              <div v-if="productBatch.product?.substance" style="font-size: 0.8rem">
                {{ productBatch.product?.substance }}
              </div>
            </td>
            <td class="text-center" style="white-space: nowrap">
              {{ timeToText(productBatch.expiryDate) }}
            </td>
            <td class="text-center" style="white-space: nowrap">
              {{ productBatch.unitQuantity }}
            </td>
            <td class="text-center" style="white-space: nowrap">
              {{ productBatch.product?.unitName }}
            </td>
            <td class="text-right" style="white-space: nowrap">
              {{ formatMoney(productBatch.unitRetailPrice) }}
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
