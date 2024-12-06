<script setup lang="ts">
import {
  CheckCircleOutlined,
  FormOutlined,
  MinusCircleOutlined,
  ShopOutlined,
} from '@ant-design/icons-vue'
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconDownload, IconFileSearch, IconSetting } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputText, VueSelect } from '../../../common/vue-form'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { BatchService } from '../../../modules/batch'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { ProductApi, ProductService, type Product } from '../../../modules/product'
import { ProductGroup, ProductGroupService } from '../../../modules/product-group'
import { DTimer, arrayToKeyValue } from '../../../utils'
import ModalProductDetail from '../detail/ModalProductDetail.vue'
import ModalProductUpsert from '../upsert/ModalProductUpsert.vue'
import ModalDataProduct from './ModalDataProduct.vue'
import ModalProductGroupManager from './ModalProductGroupManager.vue'
import ModalProductListSettingScreen from './ModalProductListSettingScreen.vue'

const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const modalProductListSettingScreen = ref<InstanceType<typeof ModalProductListSettingScreen>>()
const modalDataProduct = ref<InstanceType<typeof ModalDataProduct>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProductGroupManager = ref<InstanceType<typeof ModalProductGroupManager>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const productList = ref<Product[]>([])
const productGroupAll = ref<ProductGroup[]>([])

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PRODUCT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const productGroupId = ref<number>(0)
const isActive = ref<1 | 0 | ''>(1)

const sortColumn = ref<'expiryDate' | 'id' | 'brandName' | 'quantity' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const productGroupMap = computed(() => arrayToKeyValue(productGroupAll.value, 'id'))

const startFetchData = async () => {
  try {
    const { data, meta } = await ProductService.pagination({
      relation: { batchList: true },
      page: page.value,
      limit: limit.value,
      filter: {
        productGroupId: productGroupId.value ? productGroupId.value : undefined,
        isActive: isActive.value !== '' ? isActive.value : undefined,
        searchText: searchText.value || undefined,
      },
      sort: sortValue.value
        ? {
            id: sortColumn.value === 'id' ? sortValue.value : undefined,
            brandName: sortColumn.value === 'brandName' ? sortValue.value : undefined,
            quantity: sortColumn.value === 'quantity' ? sortValue.value : undefined,
            expiryDate: sortColumn.value === 'expiryDate' ? sortValue.value : undefined,
          }
        : undefined,
    })
    productList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: ProductList.vue:86 ~ startFetchData ~ error:', error)
  }
}

onBeforeMount(async () => {
  dataLoading.value = true
  await startFetchData()
  dataLoading.value = false
  try {
    productGroupAll.value = await ProductGroupService.list({})
  } catch (error) {
    console.log('🚀 ~ file: ProductList.vue:107 ~ onBeforeMount ~ error:', error)
  }
})

onMounted(async () => {
  try {
    const { numberChange } = await ProductService.refreshDB()
    await BatchService.refreshDB()
    if (numberChange) {
      await startFetchData()
    }
  } catch (error: any) {
    console.log('🚀 ~ file: ProductList.vue:102 ~ onMounted ~ error:', error)
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
  type: 'CREATE' | 'UPDATE' | 'DESTROY'
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
  if (menu.key === 'PRODUCT_GROUP_MANAGER') {
    modalProductGroupManager.value?.openModal()
  }
}

const handleModalProductGroupManagerSuccess = async () => {
  productGroupAll.value = await ProductGroupService.list({})
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
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalProductListSettingScreen" />
  <ModalDataProduct ref="modalDataProduct" />
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProductGroupManager
    ref="modalProductGroupManager"
    @success="handleModalProductGroupManagerSuccess" />
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
        <a-dropdown
          v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
          trigger="click">
          <span>
            <IconSetting width="20" height="20" />
          </span>
          <template #overlay>
            <a-menu @click="handleMenuSettingClick">
              <a-menu-item key="screen-setting">Cài đặt hiển thị</a-menu-item>
              <a-menu-item key="data-setting">Cài đặt dữ liệu</a-menu-item>
              <a-menu-item key="PRODUCT_GROUP_MANAGER">Quản lý nhóm sản phẩm</a-menu-item>
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
        <div>Chọn nhóm sản phẩm</div>
        <div>
          <VueSelect
            v-model:value="productGroupId"
            :options="[
              { value: 0, text: 'Tất cả' },
              ...productGroupAll.map((group) => ({ value: group.id, text: group.name })),
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
        class="py-2 px-4 flex gap-4 text-white font-bold"
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
        <div class="cursor-pointer" @click="changeSort('expiryDate')">
          HSD &nbsp;
          <font-awesome-icon
            v-if="sortColumn !== 'expiryDate'"
            :icon="['fas', 'sort']"
            style="opacity: 0.4" />
          <font-awesome-icon
            v-if="sortColumn === 'expiryDate' && sortValue === 'ASC'"
            :icon="['fas', 'sort-up']" />
          <font-awesome-icon
            v-if="sortColumn === 'expiryDate' && sortValue === 'DESC'"
            :icon="['fas', 'sort-down']" />
        </div>
        <div class="cursor-pointer ml-auto" @click="changeSort('quantity')">
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
        <div
          v-for="(product, productIndex) in productList"
          :key="productIndex"
          class="px-4 py-2"
          style="border-bottom: 1px solid #cdcdcd"
          :style="{
            backgroundColor: productIndex % 2 !== 0 ? 'var(--color-table-td-even-bg)' : '',
          }"
          @dblclick="
            permissionIdMap[PermissionId.PRODUCT_UPDATE] &&
              modalProductUpsert?.openModal(product.id)
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
                {{ productGroupMap[product.productGroupId]?.name }}
              </div>
              <template v-if="!product.batchList?.length">
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
              </template>
              <template v-if="product.batchList?.length">
                <div
                  v-for="(batch, batchIndex) in product.batchList"
                  :key="batchIndex"
                  class="flex flex-wrap text-xs">
                  <div style="width: 10%; font-weight: 500">
                    ({{ formatMoney(batch.unitQuantity) }})
                  </div>
                  <div
                    style="width: 35%"
                    :style="
                      batch.expiryDate && batch.expiryDate < closeExpiryDate
                        ? 'color:red; font-weight:500'
                        : ''
                    ">
                    - HSD {{ DTimer.timeToText(batch.expiryDate) }}
                  </div>
                  <div
                    v-if="
                      permissionIdMap[PermissionId.READ_COST_PRICE] &&
                      settingStore.SCREEN_PRODUCT_LIST.costPrice
                    "
                    style="width: 22%">
                    - N: {{ formatMoney(batch.unitCostPrice) }}
                  </div>
                  <div v-if="settingStore.SYSTEM_SETTING.retailPrice" style="width: 22%">
                    - L: {{ formatMoney(batch.unitRetailPrice) }}
                  </div>
                </div>
              </template>
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
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.unit">Đ.Vị</th>
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.lotNumber">Số lô</th>
            <th
              v-if="settingStore.SCREEN_PRODUCT_LIST.expiryDate"
              class="cursor-pointer"
              @click="changeSort('expiryDate')">
              HSD &nbsp;
              <font-awesome-icon
                v-if="sortColumn !== 'expiryDate'"
                :icon="['fas', 'sort']"
                style="opacity: 0.4" />
              <font-awesome-icon
                v-if="sortColumn === 'expiryDate' && sortValue === 'ASC'"
                :icon="['fas', 'sort-up']" />
              <font-awesome-icon
                v-if="sortColumn === 'expiryDate' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
            </th>
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
                <td
                  v-if="batchIndex === 0"
                  class="text-center"
                  :rowspan="product.batchList.length || 1">
                  SP{{ product.id }}
                </td>
                <td v-if="batchIndex === 0" :rowspan="product.batchList.length || 1">
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
                <td
                  v-if="batchIndex === 0 && settingStore.SCREEN_PRODUCT_LIST.group"
                  :rowspan="product.batchList.length || 1"
                  class="text-center">
                  {{ productGroupMap[product.productGroupId!]?.name }}
                </td>
                <td
                  v-if="settingStore.SCREEN_PRODUCT_LIST.unit && batchIndex === 0"
                  :rowspan="product.batchList.length || 1"
                  class="text-center">
                  {{ product.unitDefaultName }}
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
                <td
                  v-if="settingStore.SCREEN_PRODUCT_LIST.isActive && batchIndex == 0"
                  :rowspan="product.batchList.length || 1"
                  class="text-center">
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
                    settingStore.SCREEN_PRODUCT_LIST.action &&
                    batchIndex == 0
                  "
                  :rowspan="product.batchList.length || 1"
                  class="text-center">
                  <a
                    style="color: #eca52b"
                    class="text-xl"
                    @click="modalProductUpsert?.openModal(product.id)">
                    <FormOutlined />
                  </a>
                </td>
              </tr>
            </template>
            <template v-else>
              <tr>
                <td class="text-center">SP{{ product.id }}</td>
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
                  {{ productGroupMap[product.productGroupId!]?.name }}
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.unit" class="text-center">
                  {{ product.unitDefaultName }}
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
                    @click="modalProductUpsert?.openModal(product.id)">
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
