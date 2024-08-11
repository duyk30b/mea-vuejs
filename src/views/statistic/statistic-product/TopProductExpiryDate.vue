<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { Batch, BatchApi } from '../../../modules/batch'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { timeToText } from '../../../utils'
import { ProductApi, type Product } from '../../../modules/product'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import { IconFileSearch } from '../../../common/icon'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const loaded = ref(false)
const productList = ref<Product[]>([])

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    loaded.value = false
    const { data, meta } = await ProductApi.pagination({
      page: page.value,
      limit: limit.value,
      sort: { expiryDate: 'ASC' },
      filter: {
        quantity: { NOT: 0 },
        expiryDate: { IS_NULL: false, LTE: closeExpiryDate.value },
        batchList: {
          quantity: { NOT: 0 },
        },
      },
      relation: { batchList: true },
    })
    data.forEach((product) => {
      product.batchList?.forEach((batch) => {
        batch.product = product
      })
    })
    productList.value = data
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

const now = computed(() => {
  return Date.now()
})

const closeExpiryDate = computed(() => {
  return Date.now() + 6 * 30 * 24 * 60 * 60 * 1000
})
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <div class="flex flex-col" style="height: 100%">
    <div class="flex justify-between items-center">
      <span style="font-size: 18px; font-weight: 500">Hàng cận date:</span>
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
          <tr v-if="productList.length === 0">
            <td colspan="20" class="text-center">Không có sản phẩm cận date</td>
          </tr>
          <template v-for="(product, productIndex) in productList" :key="productIndex">
            <template v-if="!product.batchList?.length">
              <tr>
                <td class="text-center" style="white-space: nowrap">
                  {{ productIndex + 1 }}
                </td>
                <td>
                  <div class="flex gap-2">
                    <div class="font-medium text-justify">
                      {{ product.brandName }}
                    </div>
                    <div>
                      <a @click="modalProductDetail?.openModal(product)">
                        <IconFileSearch />
                      </a>
                    </div>
                  </div>
                  <div v-if="product.substance" style="font-size: 0.8rem">
                    {{ product.substance }}
                  </div>
                </td>
                <td
                  class="text-center"
                  style="white-space: nowrap"
                  :style="
                    product.expiryDate && product.expiryDate < now
                      ? 'color:red; font-weight:500'
                      : product.expiryDate && product.expiryDate < closeExpiryDate
                        ? 'color:orange; font-weight:500'
                        : ''
                  ">
                  {{ timeToText(product.expiryDate) }}
                </td>
                <td class="text-center" style="white-space: nowrap">
                  {{ product.unitQuantity }}
                </td>
                <td class="text-center" style="white-space: nowrap">
                  {{ product.unitDefaultName }}
                </td>
                <td class="text-right" style="white-space: nowrap">
                  {{ formatMoney(product.unitRetailPrice || 0) }}
                </td>
              </tr>
            </template>
            <template v-if="product.batchList?.length">
              <tr v-for="(batch, batchIndex) in product.batchList" :key="batchIndex">
                <td
                  v-if="batchIndex === 0"
                  class="text-center"
                  style="white-space: nowrap"
                  :rowspan="product.batchList.length">
                  {{ productIndex + 1 }}
                </td>
                <td v-if="batchIndex === 0" :rowspan="product.batchList.length">
                  <div class="flex gap-2">
                    <div class="font-medium text-justify">
                      {{ product.brandName }}
                    </div>
                    <div>
                      <a @click="modalProductDetail?.openModal(product)">
                        <IconFileSearch />
                      </a>
                    </div>
                  </div>
                  <div v-if="product.substance" style="font-size: 0.8rem">
                    {{ product.substance }}
                  </div>
                </td>
                <td
                  class="text-center"
                  style="white-space: nowrap"
                  :style="
                    batch.expiryDate && batch.expiryDate < now
                      ? 'color:red; font-weight:500'
                      : batch.expiryDate && batch.expiryDate < closeExpiryDate
                        ? 'color:orange; font-weight:500'
                        : ''
                  ">
                  {{ timeToText(batch.expiryDate) }}
                </td>
                <td class="text-center" style="white-space: nowrap">
                  {{ batch.unitQuantity }}
                </td>
                <td class="text-center" style="white-space: nowrap">
                  {{ batch.product!.unitDefaultName }}
                </td>
                <td class="text-right" style="white-space: nowrap">
                  {{ formatMoney(batch.unitRetailPrice || 0) }}
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>

      <div class="mt-4 float-right">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          :total="total"
          show-size-changer
          :size="isMobile ? 'small' : 'default'"
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
    </div>
  </div>
</template>
