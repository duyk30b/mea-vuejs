<script setup lang="ts">
import {
  CheckCircleOutlined,
  FileSearchOutlined,
  FormOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SettingOutlined,
  ShopOutlined,
} from '@ant-design/icons-vue'
import { storeToRefs } from 'pinia'
import { onBeforeMount, onMounted, ref, watch } from 'vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { useProductStore, type Product } from '../../../modules/product'
import type { ProductBatch } from '../../../modules/product-batch'
import { useProductBatchStore } from '../../../modules/product-batch/product-batch.store'
import { timeToText } from '../../../utils'
import ModalProductDetail from '../detail/ModalProductDetail.vue'
import ModalProductUpsert from '../upsert/ModalProductUpsert.vue'
import ModalDataProduct from './ModalDataProduct.vue'
import ModalProductListSettingScreen from './ModalProductListSettingScreen.vue'

const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const modalProductListSettingScreen = ref<InstanceType<typeof ModalProductListSettingScreen>>()
const modalDataProduct = ref<InstanceType<typeof ModalDataProduct>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()

const screenStore = useScreenStore()
const productStore = useProductStore()
const productBatchStore = useProductBatchStore()
const { formatMoney, isMobile } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore
const { timeSync: productTimeSync } = storeToRefs(productStore)
const { timeSync: productBatchTimeSync } = storeToRefs(productBatchStore)

const productList = ref<Product[]>([])
const productBatchList = ref<ProductBatch[]>([])

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PRODUCT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const group = ref<string>('')
const isActive = ref<1 | 0 | ''>(1)

const sortColumn = ref<'expiryDate' | 'id' | 'brandName' | 'quantity' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

watch(productTimeSync, async () => {
  startFetchData()
})
watch(productBatchTimeSync, async () => {
  startFetchData()
})

const startFetchProduct = async () => {
  try {
    const data = await productStore.pagination({
      page: page.value,
      limit: limit.value,
      relation: { productBatches: true },
      filter: {
        group: group.value ? group.value : undefined,
        isActive: isActive.value !== '' ? isActive.value : undefined,
        searchText: searchText.value || undefined,
        productBatch: {},
      },
      sort: sortValue.value
        ? {
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
            brandName: sortColumn.value === 'brandName' ? sortValue.value : undefined,
            quantity: sortColumn.value === 'quantity' ? sortValue.value : undefined,
          }
        : undefined,
    })
    productList.value = data.data
    total.value = data.total
  } catch (error) {
    console.log('🚀 ~ file: ProductList.vue:59 ~ error:', error)
  }
}

const startFetchProductBatch = async () => {
  try {
    const data = await productBatchStore.pagination({
      page: page.value,
      limit: limit.value,
      relation: { product: true },
      filter: {
        product: {
          isActive: isActive.value !== '' ? isActive.value : undefined,
          searchText: searchText.value || undefined,
          group: group.value || undefined,
        },
        deletedAt: { IS_NULL: true },
      },
      sort: sortValue.value
        ? { expiryDate: sortColumn.value === 'expiryDate' ? sortValue.value : undefined }
        : undefined,
    })
    productBatchList.value = data.data
    total.value = data.total
  } catch (error) {
    console.log('🚀 ~ file: ProductList.vue:77 ~ error:', error)
  }
}

onBeforeMount(async () => {
  try {
    dataLoading.value = true
    await startFetchData()
  } catch (error) {
    console.log('🚀 ~ onBeforeMount ~ error:', error)
  } finally {
    dataLoading.value = false
  }
})

onMounted(async () => {
  try {
    const productList = await productStore.refreshDB()
    const productBatchList = await productBatchStore.refreshDB()
    if (productList?.length || productBatchList?.length) {
      await startFetchData()
    }
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const startFetchData = async () => {
  if (sortColumn.value === 'expiryDate') {
    await startFetchProductBatch()
  } else {
    await startFetchProduct()
  }
}

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const handleInputSearchText = (event: any) => {
  searchText.value = event.target.value
  startSearch()
}

const handleSelectGroup = async () => {
  await startSearch()
}

const handleSelectStatus = async (value: 1 | 0 | '') => {
  isActive.value = value
  await startSearch()
}

const changeSort = async (value: 'expiryDate' | 'id' | 'brandName' | 'quantity') => {
  page.value = 1
  if (sortValue.value == 'DESC') {
    sortColumn.value = ''
    sortValue.value = ''
  } else if (sortValue.value == 'ASC') {
    sortColumn.value = value
    sortValue.value = 'DESC'
  } else {
    sortColumn.value = value
    sortValue.value = 'ASC'
  }
  await startSearch()
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('PRODUCT_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const handleModalProductUpsertSuccess = async (
  data: Product,
  type: 'CREATE' | 'UPDATE' | 'DELETE'
) => {
  // await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalProductListSettingScreen.value?.openModal()
  }
  if (menu.key === 'data-setting') {
    modalDataProduct.value?.openModal()
  }
}
</script>

<template>
  <ModalProductUpsert ref="modalProductUpsert" @success="handleModalProductUpsertSuccess" />
  <ModalProductListSettingScreen
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]"
    ref="modalProductListSettingScreen"
  />
  <ModalDataProduct ref="modalDataProduct" />
  <ModalProductDetail ref="modalProductDetail" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block"><ShopOutlined /> Tồn kho</div>
      <a-button
        v-if="permissionIdMap[PermissionId.PRODUCT_CREATE]"
        type="primary"
        @click="modalProductUpsert?.openModal()"
      >
        <template #icon>
          <PlusOutlined />
        </template>
        Thêm hàng hóa
      </a-button>
    </div>
    <div class="page-header-setting">
      <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]" trigger="click">
        <span>
          <SettingOutlined />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting"> Cài đặt hiển thị </a-menu-item>
            <a-menu-item key="data-setting"> Cài đặt dữ liệu </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 2; flex-basis: 500px">
        <div>Tìm kiếm</div>
        <!-- <span class="ant-input-affix-wrapper">
          <input :value="searchText" @input="handleInputSearchText" allow-clear enter-button class="ant-input w-full"
            placeholder="Tìm kiếm bằng tên hoặc hoạt chất" />
        </span> -->
        <a-input-search
          :value="searchText"
          allow-clear
          enter-button
          placeholder="Tìm kiếm bằng tên hoặc hoạt chất"
          style="width: 100%"
          @input="handleInputSearchText"
          @search="startSearch"
        />
      </div>

      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn nhóm hàng</div>
        <a-select
          v-model:value="group"
          allow-clear
          class="w-full"
          placeholder="Tất cả"
          @change="handleSelectGroup"
        >
          <a-select-option value=""> Tất cả </a-select-option>
          <a-select-option
            v-for="(text, value) in screenStore.PRODUCT_GROUP"
            :key="value"
            :value="value"
          >
            {{ text }}
          </a-select-option>
        </a-select>
      </div>

      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            :value="isActive"
            :options="[
              { text: 'Tất cả', value: '' },
              { text: 'Active', value: 1 },
              { text: 'Inactive', value: 0 },
            ]"
            @update:value="handleSelectStatus"
          />
        </div>
      </div>
    </div>
    <div v-if="isMobile" class="page-main-list">
      <div
        class="py-2 px-4 flex justify-between text-white font-bold"
        style="background-color: var(--color-table-thead-bg)"
      >
        <div class="cursor-pointer" @click="changeSort('brandName')">
          Tên hàng &nbsp;
          <font-awesome-icon
            v-if="sortColumn !== 'brandName'"
            :icon="['fas', 'sort']"
            style="opacity: 0.4"
          />
          <font-awesome-icon
            v-if="sortColumn === 'brandName' && sortValue === 'ASC'"
            :icon="['fas', 'sort-up']"
          />
          <font-awesome-icon
            v-if="sortColumn === 'brandName' && sortValue === 'DESC'"
            :icon="['fas', 'sort-down']"
          />
        </div>
        <div class="cursor-pointer" @click="changeSort('quantity')">
          Số lượng &nbsp;
          <font-awesome-icon
            v-if="sortColumn !== 'quantity'"
            :icon="['fas', 'sort']"
            style="opacity: 0.4"
          />
          <font-awesome-icon
            v-if="sortColumn === 'quantity' && sortValue === 'ASC'"
            :icon="['fas', 'sort-up']"
          />
          <font-awesome-icon
            v-if="sortColumn === 'quantity' && sortValue === 'DESC'"
            :icon="['fas', 'sort-down']"
          />
        </div>
      </div>
      <div v-if="dataLoading">
        <div class="vue-skeleton-loading mt-2"></div>
        <div class="vue-skeleton-loading mt-2"></div>
        <div class="vue-skeleton-loading mt-2"></div>
        <div class="vue-skeleton-loading mt-2"></div>
        <div class="vue-skeleton-loading mt-2"></div>
        <div class="vue-skeleton-loading mt-2"></div>
        <div class="vue-skeleton-loading mt-2"></div>
        <div class="vue-skeleton-loading mt-2"></div>
        <div class="vue-skeleton-loading mt-2"></div>
        <div class="vue-skeleton-loading mt-2"></div>
      </div>
      <div v-else>
        <div
          v-if="productList.length === 0"
          class="p-2 text-center"
          style="border: 1px solid #cdcdcd"
        >
          Không có dữ liệu
        </div>
        <div
          v-for="(product, index) in productList"
          :key="index"
          class="px-4 py-2"
          style="border-bottom: 1px solid #cdcdcd"
          :style="{ backgroundColor: index % 2 !== 0 ? 'var(--color-table-td-even-bg)' : '' }"
          @dblclick="
            permissionIdMap[PermissionId.PRODUCT_UPDATE] && modalProductUpsert?.openModal(product)
          "
        >
          <div class="flex items-center">
            <div class="flex-1">
              <div class="flex gap-2">
                <div class="font-medium text-justify">
                  {{ product.brandName }}
                </div>
                <div v-if="screenStore.SCREEN_PRODUCT_LIST.detail">
                  <a @click="modalProductDetail?.openModal(product)">
                    <FileSearchOutlined />
                  </a>
                </div>
              </div>
              <div v-if="screenStore.SCREEN_PRODUCT_LIST.substance" class="text-xs">
                {{ product.substance }}
              </div>
              <div v-if="screenStore.SCREEN_PRODUCT_LIST.group" class="text-xs">
                {{ screenStore.PRODUCT_GROUP[product.group!] }}
              </div>
            </div>
            <div style="font-size: 16px; font-weight: 500">
              {{ product.unitQuantity }}
            </div>
            <div
              v-if="screenStore.SCREEN_PRODUCT_LIST.unit"
              style="flex-basis: 30px"
              class="flex justify-end"
            >
              <span class="ml-1 text-xs text-right"> {{ product.unitName }} </span>
            </div>
          </div>
          <div v-if="product.productBatches.length > 0 && screenStore.SCREEN_PRODUCT_LIST.batch">
            <div v-for="(avail, y) in product.productBatches" :key="y">
              <div class="flex justify-between text-xs">
                <div v-if="screenStore.SCREEN_PRODUCT_LIST.expiryDate" style="width: 35%">
                  HSD:
                  <span
                    v-if="avail.expiryDate && avail.expiryDate < Date.now()"
                    style="color: #ff4d4f; font-weight: bold"
                  >
                    {{ timeToText(avail.expiryDate, 'DD/MM/YYYY') }}
                  </span>
                  <span
                    v-else-if="
                      avail.expiryDate &&
                      avail.expiryDate < Date.now() + 6 * 30 * 24 * 60 * 60 * 1000
                    "
                    style="color: orange; font-weight: bold"
                  >
                    {{ timeToText(avail.expiryDate, 'DD/MM/YYYY') }}
                  </span>
                  <span v-else>
                    {{ timeToText(avail.expiryDate, 'DD/MM/YYYY') }}
                  </span>

                  <span v-if="product.productBatches.length > 1"> ({{ avail.unitQuantity }}) </span>
                </div>
                <div
                  v-if="
                    permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE] &&
                    screenStore.SCREEN_PRODUCT_LIST.costPrice
                  "
                  style="width: 20%"
                >
                  N: {{ formatMoney(avail.unitCostPrice) }}
                </div>
                <div v-if="screenStore.SCREEN_PRODUCT_LIST.wholesalePrice" style="width: 20%">
                  S: {{ formatMoney(avail.unitWholesalePrice) }}
                </div>
                <div v-if="screenStore.SCREEN_PRODUCT_LIST.retailPrice" style="width: 20%">
                  L: {{ formatMoney(avail.unitRetailPrice) }}
                </div>
              </div>
            </div>
          </div>
        </div>
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

    <div v-else class="page-main-table table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">
              Mã HH &nbsp;
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
            <th class="cursor-pointer" @click="changeSort('brandName')">
              Tên &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'brandName'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4"
              />
              <font-awesome-icon
                v-if="sortColumn === 'brandName' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']"
              />
              <font-awesome-icon
                v-if="sortColumn === 'brandName' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']"
              />
            </th>
            <th v-if="screenStore.SCREEN_PRODUCT_LIST.group">Nhóm</th>
            <th v-if="screenStore.SCREEN_PRODUCT_LIST.unit">Đ.Vị</th>
            <th v-if="screenStore.SCREEN_PRODUCT_LIST.batch">Lô</th>
            <th class="cursor-pointer" @click="changeSort('quantity')">
              SL &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'quantity'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4"
              />
              <font-awesome-icon
                v-if="sortColumn === 'quantity' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']"
              />
              <font-awesome-icon
                v-if="sortColumn === 'quantity' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']"
              />
            </th>
            <th
              v-if="screenStore.SCREEN_PRODUCT_LIST.expiryDate"
              class="cursor-pointer"
              @click="changeSort('expiryDate')"
            >
              HSD &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'expiryDate'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4"
              />
              <font-awesome-icon
                v-if="sortColumn === 'expiryDate' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']"
              />
              <font-awesome-icon
                v-if="sortColumn === 'expiryDate' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']"
              />
            </th>
            <th
              v-if="
                permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE] &&
                screenStore.SCREEN_PRODUCT_LIST.costPrice
              "
            >
              G.Nhập
            </th>
            <th v-if="screenStore.SCREEN_PRODUCT_LIST.wholesalePrice">G.Sỉ</th>
            <th v-if="screenStore.SCREEN_PRODUCT_LIST.retailPrice">G.Lẻ</th>
            <th v-if="screenStore.SCREEN_PRODUCT_LIST.isActive">Trạng thái</th>
            <th
              v-if="
                permissionIdMap[PermissionId.PRODUCT_UPDATE] &&
                screenStore.SCREEN_PRODUCT_LIST.action
              "
            >
              Sửa
            </th>
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
          <template v-if="sortColumn !== 'expiryDate'">
            <tr v-if="productList.length === 0">
              <td colspan="20" class="text-center">Không có dữ liệu</td>
            </tr>
            <template v-for="(product, index) in productList" :key="index">
              <tr>
                <td :rowspan="product.productBatches.length || 1" class="text-center">
                  PR{{ product.id }}
                </td>
                <td :rowspan="product.productBatches.length || 1">
                  <div>
                    {{ product.brandName }}
                    <a
                      v-if="screenStore.SCREEN_PRODUCT_LIST.detail"
                      class="ml-1"
                      @click="modalProductDetail?.openModal(product)"
                    >
                      <FileSearchOutlined />
                    </a>
                  </div>
                  <div v-if="screenStore.SCREEN_PRODUCT_LIST.substance" style="font-size: 0.8rem">
                    {{ product.substance }}
                  </div>
                </td>
                <td
                  v-if="screenStore.SCREEN_PRODUCT_LIST.group"
                  :rowspan="product.productBatches.length || 1"
                  class="text-center"
                >
                  {{ screenStore.PRODUCT_GROUP[product.group!] }}
                </td>
                <td
                  v-if="screenStore.SCREEN_PRODUCT_LIST.unit"
                  :rowspan="product.productBatches.length || 1"
                  class="text-center"
                >
                  {{ product.unitName }}
                </td>
                <td v-if="screenStore.SCREEN_PRODUCT_LIST.batch" class="text-center">
                  {{ product.productBatches[0]?.batch || '' }}
                </td>
                <td class="text-right">
                  {{ product.productBatches[0]?.unitQuantity || 0 }}
                </td>
                <td v-if="screenStore.SCREEN_PRODUCT_LIST.expiryDate" class="text-center">
                  <span
                    v-if="
                      product.productBatches[0]?.expiryDate &&
                      product.productBatches[0]?.expiryDate < Date.now()
                    "
                    style="color: #ff4d4f; font-weight: bold"
                  >
                    {{ timeToText(product.productBatches[0]?.expiryDate, 'DD/MM/YYYY') }}
                  </span>
                  <span
                    v-else-if="
                      product.productBatches[0]?.expiryDate &&
                      product.productBatches[0]?.expiryDate <
                        Date.now() + 6 * 30 * 24 * 60 * 60 * 1000
                    "
                    style="color: orange; font-weight: bold"
                  >
                    {{ timeToText(product.productBatches[0]?.expiryDate, 'DD/MM/YYYY') }}
                  </span>
                  <span v-else>
                    {{ timeToText(product.productBatches[0]?.expiryDate, 'DD/MM/YYYY') }}
                  </span>
                </td>
                <td
                  v-if="
                    permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE] &&
                    screenStore.SCREEN_PRODUCT_LIST.costPrice
                  "
                  class="text-right"
                >
                  {{ formatMoney(product.productBatches[0]?.unitCostPrice) }}
                </td>
                <td v-if="screenStore.SCREEN_PRODUCT_LIST.wholesalePrice" class="text-right">
                  {{ formatMoney(product.productBatches[0]?.unitWholesalePrice) }}
                </td>
                <td v-if="screenStore.SCREEN_PRODUCT_LIST.retailPrice" class="text-right">
                  {{ formatMoney(product.productBatches[0]?.unitRetailPrice) }}
                </td>
                <td
                  v-if="screenStore.SCREEN_PRODUCT_LIST.isActive"
                  :rowspan="product.productBatches.length || 1"
                  class="text-center"
                >
                  <a-tag v-if="product.isActive" color="success">
                    <template #icon>
                      <CheckCircleOutlined />
                    </template>
                    Active
                  </a-tag>
                  <a-tag v-else color="warning">
                    <template #icon>
                      <MinusCircleOutlined />
                    </template>
                    Inactive
                  </a-tag>
                </td>
                <td
                  v-if="
                    permissionIdMap[PermissionId.PRODUCT_UPDATE] &&
                    screenStore.SCREEN_PRODUCT_LIST.action
                  "
                  :rowspan="product.productBatches.length || 1"
                  class="text-center"
                >
                  <a
                    style="color: #eca52b"
                    class="text-xl"
                    @click="modalProductUpsert?.openModal(product)"
                  >
                    <FormOutlined />
                  </a>
                </td>
              </tr>

              <tr v-for="(avail, i) in product.productBatches.slice(1)" :key="i">
                <td v-if="screenStore.SCREEN_PRODUCT_LIST.batch" class="text-center">
                  {{ avail.batch }}
                </td>
                <td class="text-right">
                  {{ avail.unitQuantity }}
                </td>
                <td v-if="screenStore.SCREEN_PRODUCT_LIST.expiryDate" class="text-center">
                  <span
                    v-if="avail.expiryDate && avail.expiryDate < Date.now()"
                    style="color: #ff4d4f; font-weight: bold"
                  >
                    {{ timeToText(avail.expiryDate, 'DD/MM/YYYY') }}
                  </span>
                  <span
                    v-else-if="
                      avail.expiryDate &&
                      avail.expiryDate < Date.now() + 6 * 30 * 24 * 60 * 60 * 1000
                    "
                    style="color: orange; font-weight: bold"
                  >
                    {{ timeToText(avail.expiryDate, 'DD/MM/YYYY') }}
                  </span>
                  <span v-else>
                    {{ timeToText(avail.expiryDate, 'DD/MM/YYYY') }}
                  </span>
                </td>
                <td
                  v-if="
                    permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE] &&
                    screenStore.SCREEN_PRODUCT_LIST.costPrice
                  "
                  class="text-right"
                >
                  {{ formatMoney(avail.unitCostPrice) }}
                </td>
                <td v-if="screenStore.SCREEN_PRODUCT_LIST.wholesalePrice" class="text-right">
                  {{ formatMoney(avail.unitWholesalePrice) }}
                </td>
                <td v-if="screenStore.SCREEN_PRODUCT_LIST.retailPrice" class="text-right">
                  {{ formatMoney(avail.unitRetailPrice) }}
                </td>
              </tr>
            </template>
          </template>

          <template v-if="sortColumn === 'expiryDate'">
            <tr v-if="productBatchList.length === 0">
              <td colspan="20" class="text-center">Không có dữ liệu</td>
            </tr>
            <tr v-for="(batch, index) in productBatchList" :key="index">
              <td class="text-center">PB{{ batch.id }}</td>
              <td>
                <div class="flex justify-between">
                  <div style="font-weight: 500">
                    {{ batch.product?.brandName }}
                  </div>
                  <div v-if="screenStore.SCREEN_PRODUCT_LIST.detail">
                    <a class="text-xl" @click="modalProductDetail?.openModal(batch.product!)">
                      <FileSearchOutlined />
                    </a>
                  </div>
                </div>
                <div v-if="screenStore.SCREEN_PRODUCT_LIST.substance">
                  {{ batch.product?.substance }}
                </div>
              </td>

              <td v-if="screenStore.SCREEN_PRODUCT_LIST.group" class="text-center">
                {{ screenStore.PRODUCT_GROUP[batch.product!.group!] }}
              </td>
              <td v-if="screenStore.SCREEN_PRODUCT_LIST.unit" class="text-center">
                {{ batch.product?.unitName }}
              </td>
              <td class="text-center">
                {{ batch.unitQuantity }}
              </td>
              <td v-if="screenStore.SCREEN_PRODUCT_LIST.batch" class="text-center">
                {{ batch.batch }}
              </td>
              <td v-if="screenStore.SCREEN_PRODUCT_LIST.expiryDate" class="text-right">
                <span
                  v-if="batch.expiryDate && batch.expiryDate < Date.now()"
                  style="color: #ff4d4f; font-weight: 500"
                >
                  {{ timeToText(batch.expiryDate, 'DD/MM/YYYY') }} ({{ batch.unitQuantity }})
                </span>
                <span
                  v-else-if="
                    batch.expiryDate && batch.expiryDate < Date.now() + 6 * 30 * 24 * 60 * 60 * 1000
                  "
                  style="color: orange"
                >
                  {{ timeToText(batch.expiryDate, 'DD/MM/YYYY') }}
                </span>
                <span v-else>
                  {{ timeToText(batch.expiryDate, 'DD/MM/YYYY') }}
                </span>
              </td>
              <td v-if="screenStore.SCREEN_PRODUCT_LIST.costPrice" class="text-right">
                {{ formatMoney(batch.unitCostPrice) }}
              </td>
              <td v-if="screenStore.SCREEN_PRODUCT_LIST.wholesalePrice" class="text-right">
                {{ formatMoney(batch.unitWholesalePrice) }}
              </td>
              <td v-if="screenStore.SCREEN_PRODUCT_LIST.retailPrice" class="text-right">
                {{ formatMoney(batch.unitRetailPrice) }}
              </td>
              <td v-if="screenStore.SCREEN_PRODUCT_LIST.isActive" class="text-center">
                <a-tag v-if="batch.product!.isActive" color="success">
                  <template #icon>
                    <CheckCircleOutlined />
                  </template>
                  Active
                </a-tag>
                <a-tag v-else color="warning">
                  <template #icon>
                    <MinusCircleOutlined />
                  </template>
                  Inactive
                </a-tag>
              </td>
              <td v-if="screenStore.SCREEN_PRODUCT_LIST.action" class="text-center">
                <a
                  style="color: #eca52b"
                  class="text-xl"
                  @click="modalProductUpsert?.openModal(batch.product)"
                >
                  <FormOutlined />
                </a>
              </td>
            </tr>
          </template>
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
