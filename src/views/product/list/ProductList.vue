<script setup lang="ts">
import {
  CheckCircleOutlined,
  FormOutlined,
  MinusCircleOutlined,
  ShopOutlined,
} from '@ant-design/icons-vue'
import { storeToRefs } from 'pinia'
import { computed, onBeforeMount, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconDownload, IconFileSearch, IconSetting } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputText, VueSelect } from '../../../common/vue-form'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { useBatchStore } from '../../../modules/batch'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { ProductApi, useProductStore, type Product } from '../../../modules/product'
import { DTimer, arrayToKeyArray } from '../../../utils'
import ModalProductDetail from '../detail/ModalProductDetail.vue'
import ModalProductUpsert from '../upsert/ModalProductUpsert.vue'
import ModalDataProduct from './ModalDataProduct.vue'
import ModalProductListSettingScreen from './ModalProductListSettingScreen.vue'

const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const modalProductListSettingScreen = ref<InstanceType<typeof ModalProductListSettingScreen>>()
const modalDataProduct = ref<InstanceType<typeof ModalDataProduct>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()

const settingStore = useSettingStore()
const productStore = useProductStore()
const batchStore = useBatchStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore
const { timeSync: productTimeSync } = storeToRefs(productStore)

const productList = ref<Product[]>([])

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

const startFetchData = async () => {
  try {
    const data = await productStore.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        group: group.value ? group.value : undefined,
        isActive: isActive.value !== '' ? isActive.value : undefined,
        searchText: searchText.value || undefined,
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

    const productIdList = productList.value.map((i) => i.id)
    const batchList = await batchStore.list({
      filter: { productId: { IN: productIdList }, quantity: { NOT: 0 } },
    })
    const batchListMapProductId = arrayToKeyArray(batchList, 'productId')
    productList.value.forEach((i) => {
      i.batchList = batchListMapProductId[i.id] || []
      i.batchList.forEach((j) => (j.product = i))
    })
  } catch (error) {
    console.log('🚀 ~ file: ProductList.vue:89 ~ error:', error)
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
    await batchStore.refreshDB()
    if (productList?.length) {
      await startFetchData()
    }
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
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
  await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalProductListSettingScreen.value?.openModal()
  }
  if (menu.key === 'data-setting') {
    modalDataProduct.value?.openModal()
  }
}

const downloadExcelProductList = async () => {
  ModalStore.confirm({
    title: 'Xác nhận tải file báo cáo',
    content: 'Thời gian tải file có thể tốn vài phút nếu dữ liệu lớn, bạn vẫn mốn tải ?',
    onOk: async () => {
      await ProductApi.downloadExcelProductList()
    },
  })
}

const closeExpiryDate = computed(() => {
  return Date.now() + 6 * 30 * 24 * 60 * 60 * 1000
})
</script>

<template>
  <ModalProductUpsert ref="modalProductUpsert" @success="handleModalProductUpsertSuccess" />
  <ModalProductListSettingScreen
    v-if="permissionIdMap[PermissionId.SETTING_UPSERT]"
    ref="modalProductListSettingScreen" />
  <ModalDataProduct ref="modalDataProduct" />
  <ModalProductDetail ref="modalProductDetail" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <ShopOutlined />
        Tồn kho
      </div>
      <VueButton
        v-if="permissionIdMap[PermissionId.PRODUCT_CREATE]"
        color="blue"
        icon="plus"
        @click="modalProductUpsert?.openModal()">
        Thêm Sản Phẩm
      </VueButton>
    </div>
    <div class="flex mr-2 gap-8">
      <div style="cursor: pointer">
        <IconDownload width="20" height="20" @click="downloadExcelProductList" />
      </div>
      <span style="cursor: pointer">
        <a-dropdown v-if="permissionIdMap[PermissionId.SETTING_UPSERT]" trigger="click">
          <span>
            <IconSetting width="20" height="20" />
          </span>
          <template #overlay>
            <a-menu @click="handleMenuSettingClick">
              <a-menu-item key="screen-setting">Cài đặt hiển thị</a-menu-item>
              <a-menu-item key="data-setting">Cài đặt dữ liệu</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </span>
    </div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 2; flex-basis: 500px">
        <div>Tìm kiếm</div>
        <div>
          <InputText
            v-model:value="searchText"
            placeholder="Tìm kiếm bằng tên hoặc hoạt chất"
            @update:value="startSearch" />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn nhóm hàng</div>
        <div>
          <VueSelect
            v-model:value="group"
            :options="[
              { value: '', text: 'Tất cả' },
              ...Object.entries(settingStore.PRODUCT_GROUP).map(([value, text]) => ({
                value,
                text,
              })),
            ]"
            @update:value="startSearch" />
        </div>
      </div>
      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            v-model:value="isActive"
            :options="[
              { text: 'Tất cả', value: '' },
              { text: 'Active', value: 1 },
              { text: 'Inactive', value: 0 },
            ]"
            @update:value="startSearch" />
        </div>
      </div>
    </div>
    <div v-if="isMobile" class="page-main-list">
      <div
        class="py-2 px-4 flex justify-between text-white font-bold"
        style="background-color: var(--color-table-thead-bg)">
        <div class="cursor-pointer" @click="changeSort('brandName')">
          Tên hàng &nbsp;
          <font-awesome-icon
            v-if="sortColumn !== 'brandName'"
            :icon="['fas', 'sort']"
            style="opacity: 0.4" />
          <font-awesome-icon
            v-if="sortColumn === 'brandName' && sortValue === 'ASC'"
            :icon="['fas', 'sort-up']" />
          <font-awesome-icon
            v-if="sortColumn === 'brandName' && sortValue === 'DESC'"
            :icon="['fas', 'sort-down']" />
        </div>
        <div class="cursor-pointer" @click="changeSort('quantity')">
          Số lượng &nbsp;
          <font-awesome-icon
            v-if="sortColumn !== 'quantity'"
            :icon="['fas', 'sort']"
            style="opacity: 0.4" />
          <font-awesome-icon
            v-if="sortColumn === 'quantity' && sortValue === 'ASC'"
            :icon="['fas', 'sort-up']" />
          <font-awesome-icon
            v-if="sortColumn === 'quantity' && sortValue === 'DESC'"
            :icon="['fas', 'sort-down']" />
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
          style="border: 1px solid #cdcdcd">
          Không có dữ liệu
        </div>
        <template v-for="(product, productIndex) in productList" :key="productIndex">
          <template v-if="product.batchList?.length">
            <div
              v-for="(batch, batchIndex) in product.batchList"
              :key="batchIndex"
              class="px-4 py-2"
              style="border-bottom: 1px solid #cdcdcd"
              :style="{
                backgroundColor: productIndex % 2 !== 0 ? 'var(--color-table-td-even-bg)' : '',
              }"
              @dblclick="
                permissionIdMap[PermissionId.PRODUCT_READ] && modalProductUpsert?.openModal(product)
              ">
              <div class="flex items-center">
                <div class="flex-1">
                  <div class="flex gap-2">
                    <div class="font-medium text-justify">
                      {{ product.brandName }}
                    </div>
                    <div v-if="settingStore.SCREEN_PRODUCT_LIST.detail">
                      <a @click="modalProductDetail?.openModal(product)">
                        <IconFileSearch />
                      </a>
                    </div>
                  </div>
                  <div v-if="settingStore.SCREEN_PRODUCT_LIST.substance" class="text-xs">
                    {{ product.substance }}
                  </div>
                  <div v-if="settingStore.SCREEN_PRODUCT_LIST.group" class="text-xs">
                    {{ settingStore.PRODUCT_GROUP[product.group!] }}
                  </div>
                  <div class="flex text-xs gap-2">
                    <div v-if="settingStore.SCREEN_PRODUCT_LIST.lotNumber && batch.lotNumber">
                      S.Lô {{ batch.lotNumber }}
                    </div>
                    <div
                      v-if="settingStore.SCREEN_PRODUCT_LIST.expiryDate && batch.expiryDate"
                      :style="
                        batch.expiryDate < closeExpiryDate ? 'color:red; font-weight:500' : ''
                      ">
                      - HSD {{ DTimer.timeToText(batch.expiryDate) }}
                    </div>
                  </div>
                  <div class="flex text-xs">
                    <div
                      v-if="
                        permissionIdMap[PermissionId.READ_COST_PRICE] &&
                        settingStore.SCREEN_PRODUCT_LIST.costPrice
                      "
                      style="width: 25%">
                      N: {{ formatMoney(batch.unitCostPrice) }}
                    </div>
                    <div v-if="settingStore.SYSTEM_SETTING.wholesalePrice" style="width: 25%">
                      S: {{ formatMoney(batch.unitWholesalePrice) }}
                    </div>
                    <div v-if="settingStore.SYSTEM_SETTING.retailPrice" style="width: 25%">
                      L: {{ formatMoney(batch.unitRetailPrice) }}
                    </div>
                  </div>
                </div>
                <div v-if="settingStore.SCREEN_PRODUCT_LIST.unit" style="width: 50px">
                  <span class="ml-1 text-xs">{{ product.unitDefaultName }}</span>
                </div>
                <div
                  style="width: 40px; font-size: 16px; font-weight: 500; text-align: right"
                  :class="(batch.quantity || 0) <= 0 ? 'text-red-500' : ''">
                  {{ batch.unitQuantity || 0 }}
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <div
              class="px-4 py-2"
              style="border-bottom: 1px solid #cdcdcd"
              :style="{
                backgroundColor: productIndex % 2 !== 0 ? 'var(--color-table-td-even-bg)' : '',
              }"
              @dblclick="
                permissionIdMap[PermissionId.PRODUCT_UPDATE] &&
                  modalProductUpsert?.openModal(product)
              ">
              <div class="flex items-center">
                <div class="flex-1">
                  <div class="flex gap-2">
                    <div class="font-medium text-justify">
                      {{ product.brandName }}
                    </div>
                    <div v-if="settingStore.SCREEN_PRODUCT_LIST.detail">
                      <a @click="modalProductDetail?.openModal(product)">
                        <IconFileSearch />
                      </a>
                    </div>
                  </div>
                  <div v-if="settingStore.SCREEN_PRODUCT_LIST.substance" class="text-xs">
                    {{ product.substance }}
                  </div>
                  <div v-if="settingStore.SCREEN_PRODUCT_LIST.group" class="text-xs">
                    {{ settingStore.PRODUCT_GROUP[product.group!] }}
                  </div>
                  <div class="flex text-xs gap-2">
                    <div v-if="settingStore.SCREEN_PRODUCT_LIST.lotNumber && product.lotNumber">
                      S.Lô {{ product.lotNumber }}
                    </div>
                    <div
                      v-if="settingStore.SCREEN_PRODUCT_LIST.expiryDate && product.expiryDate"
                      :style="
                        product.expiryDate < closeExpiryDate ? 'color:red; font-weight:500' : ''
                      ">
                      - HSD {{ DTimer.timeToText(product.expiryDate) }}
                    </div>
                  </div>
                  <div class="flex text-xs">
                    <div
                      v-if="
                        permissionIdMap[PermissionId.READ_COST_PRICE] &&
                        settingStore.SCREEN_PRODUCT_LIST.costPrice
                      "
                      style="width: 25%">
                      N: {{ formatMoney(product.unitCostPrice) }}
                    </div>
                    <div v-if="settingStore.SYSTEM_SETTING.wholesalePrice" style="width: 25%">
                      S: {{ formatMoney(product.unitWholesalePrice) }}
                    </div>
                    <div v-if="settingStore.SYSTEM_SETTING.retailPrice" style="width: 25%">
                      L: {{ formatMoney(product.unitRetailPrice) }}
                    </div>
                  </div>
                </div>
                <div v-if="settingStore.SCREEN_PRODUCT_LIST.unit" style="width: 50px">
                  <span class="ml-1 text-xs">{{ product.unitDefaultName }}</span>
                </div>
                <div
                  style="width: 40px; font-size: 16px; font-weight: 500; text-align: right"
                  :class="(product.unitQuantity || 0) <= 0 ? 'text-red-500' : ''">
                  {{ product.unitQuantity || 0 }}
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>

      <div class="mt-4 float-right mb-2">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          size="small"
          :total="total"
          show-size-changer
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
    </div>

    <div v-if="!isMobile" class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">
              Mã SP &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'id'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4" />
              <font-awesome-icon
                v-if="sortColumn === 'id' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']" />
              <font-awesome-icon
                v-if="sortColumn === 'id' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
            </th>
            <th class="cursor-pointer" @click="changeSort('brandName')">
              Tên &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'brandName'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4" />
              <font-awesome-icon
                v-if="sortColumn === 'brandName' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']" />
              <font-awesome-icon
                v-if="sortColumn === 'brandName' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.group">Nhóm</th>
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.lotNumber">Số lô</th>
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.expiryDate">HSD</th>
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.unit">Đ.Vị</th>
            <th class="cursor-pointer" @click="changeSort('quantity')">
              SL &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'quantity'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4" />
              <font-awesome-icon
                v-if="sortColumn === 'quantity' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']" />
              <font-awesome-icon
                v-if="sortColumn === 'quantity' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
            </th>
            <th
              v-if="
                permissionIdMap[PermissionId.READ_COST_PRICE] &&
                settingStore.SCREEN_PRODUCT_LIST.costPrice
              ">
              G.Nhập
            </th>
            <th v-if="settingStore.SYSTEM_SETTING.wholesalePrice">G.Sỉ</th>
            <th v-if="settingStore.SYSTEM_SETTING.retailPrice">G.Lẻ</th>
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.isActive">Trạng thái</th>
            <th
              v-if="
                permissionIdMap[PermissionId.PRODUCT_UPDATE] &&
                settingStore.SCREEN_PRODUCT_LIST.action
              ">
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
        <tbody v-if="!dataLoading">
          <tr v-if="productList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <template v-for="(product, productIndex) in productList" :key="productIndex">
            <template v-if="product.batchList?.length">
              <tr v-for="(batch, batchIndex) in product.batchList" :key="batchIndex">
                <td class="text-center">PR{{ product.id }}</td>
                <td>
                  <div>
                    {{ product.brandName }}
                    <a
                      v-if="settingStore.SCREEN_PRODUCT_LIST.detail"
                      class="ml-1"
                      @click="modalProductDetail?.openModal(product)">
                      <IconFileSearch />
                    </a>
                  </div>
                  <div v-if="settingStore.SCREEN_PRODUCT_LIST.substance" style="font-size: 0.8rem">
                    {{ product.substance }}
                  </div>
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.group" class="text-center">
                  {{ settingStore.PRODUCT_GROUP[product.group!] }}
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.lotNumber" class="text-center">
                  {{ batch.lotNumber }}
                </td>
                <td
                  v-if="settingStore.SCREEN_PRODUCT_LIST.expiryDate"
                  class="text-center"
                  :style="
                    batch.expiryDate && batch.expiryDate < closeExpiryDate
                      ? 'color:red; font-weight:500'
                      : ''
                  ">
                  {{ batch.expiryDate ? DTimer.timeToText(batch.expiryDate, 'DD/MM/YYYY') : '' }}
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.unit" class="text-center">
                  {{ product.unitDefaultName }}
                </td>
                <td class="text-center" :class="(batch.quantity || 0) <= 0 ? 'text-red-500' : ''">
                  {{ batch.unitQuantity || 0 }}
                </td>
                <td
                  v-if="
                    permissionIdMap[PermissionId.READ_COST_PRICE] &&
                    settingStore.SCREEN_PRODUCT_LIST.costPrice
                  "
                  class="text-right">
                  {{ formatMoney(batch.unitCostPrice || 0) }}
                </td>
                <td v-if="settingStore.SYSTEM_SETTING.wholesalePrice" class="text-right">
                  {{ formatMoney(batch.unitWholesalePrice || 0) }}
                </td>
                <td v-if="settingStore.SYSTEM_SETTING.retailPrice" class="text-right">
                  {{ formatMoney(batch.unitRetailPrice) }}
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.isActive" class="text-center">
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
                    settingStore.SCREEN_PRODUCT_LIST.action
                  "
                  class="text-center">
                  <a
                    style="color: #eca52b"
                    class="text-xl"
                    @click="modalProductUpsert?.openModal(product)">
                    <FormOutlined />
                  </a>
                </td>
              </tr>
            </template>
            <template v-else>
              <tr>
                <td class="text-center">PR{{ product.id }}</td>
                <td>
                  <div>
                    {{ product.brandName }}
                    <a
                      v-if="settingStore.SCREEN_PRODUCT_LIST.detail"
                      class="ml-1"
                      @click="modalProductDetail?.openModal(product)">
                      <IconFileSearch />
                    </a>
                  </div>
                  <div v-if="settingStore.SCREEN_PRODUCT_LIST.substance" style="font-size: 0.8rem">
                    {{ product.substance }}
                  </div>
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.group" class="text-center">
                  {{ settingStore.PRODUCT_GROUP[product.group!] }}
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.lotNumber" class="text-center">
                  {{ product.lotNumber }}
                </td>
                <td
                  v-if="settingStore.SCREEN_PRODUCT_LIST.expiryDate"
                  class="text-center"
                  :style="
                    product.expiryDate && product.expiryDate < closeExpiryDate
                      ? 'color:red; font-weight:500'
                      : ''
                  ">
                  {{
                    product.expiryDate ? DTimer.timeToText(product.expiryDate, 'DD/MM/YYYY') : ''
                  }}
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.unit" class="text-center">
                  {{ product.unitDefaultName }}
                </td>
                <td class="text-center" :class="(product.quantity || 0) <= 0 ? 'text-red-500' : ''">
                  {{ product.unitQuantity || 0 }}
                </td>
                <td
                  v-if="
                    permissionIdMap[PermissionId.READ_COST_PRICE] &&
                    settingStore.SCREEN_PRODUCT_LIST.costPrice
                  "
                  class="text-right">
                  {{ formatMoney(product.unitCostPrice || 0) }}
                </td>
                <td v-if="settingStore.SYSTEM_SETTING.wholesalePrice" class="text-right">
                  {{ formatMoney(product.unitWholesalePrice || 0) }}
                </td>
                <td v-if="settingStore.SYSTEM_SETTING.retailPrice" class="text-right">
                  {{ formatMoney(product.unitRetailPrice) }}
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.isActive" class="text-center">
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
                    settingStore.SCREEN_PRODUCT_LIST.action
                  "
                  class="text-center">
                  <a
                    style="color: #eca52b"
                    class="text-xl"
                    @click="modalProductUpsert?.openModal(product)">
                    <FormOutlined />
                  </a>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>

      <div class="mt-4 float-right mb-2">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          :total="total"
          show-size-changer
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
    </div>
  </div>
</template>
