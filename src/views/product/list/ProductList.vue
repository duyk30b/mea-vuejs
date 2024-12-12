<script setup lang="ts">
import {
  CheckCircleOutlined,
  FormOutlined,
  MinusCircleOutlined,
  ShopOutlined,
} from '@ant-design/icons-vue'
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconDownload, IconFileSearch, IconSetting, IconSort } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputText, VueSelect } from '../../../common/vue-form'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Batch, BatchService } from '../../../modules/batch'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { ProductApi, ProductService, type Product } from '../../../modules/product'
import { ProductGroup, ProductGroupService } from '../../../modules/product-group'
import { DTimer, arrayToKeyValue } from '../../../utils'
import ModalProductDetail from '../detail/ModalProductDetail.vue'
import ModalProductUpsert from '../upsert/ModalProductUpsert.vue'
import ModalDataProduct from './ModalDataProduct.vue'
import ModalProductGroupManager from './ModalProductGroupManager.vue'
import ModalProductListSettingScreen from './ModalProductListSettingScreen.vue'
import { Warehouse } from '../../../modules/warehouse'
import { WarehouseService } from '../../../modules/warehouse/warehouse.service'
import { Distributor, DistributorService } from '../../../modules/distributor'

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
const batchList = ref<Batch[]>([])

const productGroupOptions = ref<{ text: string; value: number; data: ProductGroup }[]>([])
const productGroupMap = ref<Record<string, ProductGroup>>({})

const warehouseOptions = ref<{ value: number; text: string; data: Warehouse }[]>([])
const warehouseMap = ref<Record<string, Warehouse>>({})
const distributorMap = ref<Record<string, Distributor>>({})
const distributorOptions = ref<{ value: number; text: string; data: Distributor }[]>([])

const tableType = ref<'TABLE_PRODUCT' | 'TABLE_BATCH'>('TABLE_PRODUCT')
const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PRODUCT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const productGroupId = ref<number>(0)
const warehouseId = ref<number>(0)
const distributorId = ref<number>(0)
const isActive = ref<1 | 0 | ''>(1)

const sortColumn = ref<'expiryDate' | 'id' | 'brandName' | 'quantity' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchProduct = async () => {
  const { data, meta } = await ProductService.pagination({
    relation: { batchList: true },
    page: page.value,
    limit: limit.value,
    filter: {
      productGroupId: productGroupId.value ? productGroupId.value : undefined,
      warehouseIds: warehouseId.value
        ? (value) => {
            try {
              const v: number[] = JSON.parse(value)
              if (!v.length || v.includes(0)) return true
              return v.includes(warehouseId.value)
            } catch (error) {
              return true
            }
          }
        : undefined,
      isActive: isActive.value !== '' ? isActive.value : undefined,
      $OR: searchText.value
        ? [{ brandName: { LIKE: searchText.value } }, { substance: { LIKE: searchText.value } }]
        : undefined,
    },
    sort: sortValue.value
      ? {
          id: sortColumn.value === 'id' ? sortValue.value : undefined,
          brandName: sortColumn.value === 'brandName' ? sortValue.value : undefined,
          quantity: sortColumn.value === 'quantity' ? sortValue.value : undefined,
        }
      : undefined,
  })
  productList.value = data
  total.value = meta.total
}

const startFetchBatch = async () => {
  const { data, meta } = await BatchService.pagination({
    relation: { product: true },
    page: page.value,
    limit: limit.value,
    filter: {
      quantity: { NOT: 0 },
      product: {
        productGroupId: productGroupId.value ? productGroupId.value : undefined,
        isActive: isActive.value !== '' ? isActive.value : undefined,
        searchText: searchText.value || undefined,
      },
    },
    sort: sortValue.value
      ? {
          id: sortColumn.value === 'id' ? sortValue.value : undefined,
          expiryDate: sortColumn.value === 'expiryDate' ? sortValue.value : undefined,
        }
      : undefined,
  })
  batchList.value = data
  total.value = meta.total
}

const startFetchData = async () => {
  try {
    if (tableType.value === 'TABLE_PRODUCT') {
      await startFetchProduct()
    }
    if (tableType.value === 'TABLE_BATCH') {
      await startFetchBatch()
    }
  } catch (error) {
    console.log('🚀 ~ file: ProductList.vue:86 ~ startFetchData ~ error:', error)
  }
}

const startFetchProductGroup = async () => {
  try {
    const productGroupAll = await ProductGroupService.list({})
    productGroupMap.value = arrayToKeyValue(productGroupAll, 'id')
    productGroupOptions.value = [
      { value: 0, text: 'Tất cả', data: ProductGroup.blank() },
      ...productGroupAll.map((i) => ({ value: i.id, text: i.name, data: i })),
    ]
  } catch (error) {
    console.log('🚀 ~ file: ProductList.vue:107 ~ onBeforeMount ~ error:', error)
  }
}

const startFetchWarehouse = async () => {
  const warehouseAll = await WarehouseService.list({})
  warehouseMap.value = arrayToKeyValue(warehouseAll, 'id')
  warehouseOptions.value = [
    { value: 0, text: 'Tất cả', data: Warehouse.blank() },
    ...warehouseAll.map((i) => ({ value: i.id, text: i.name, data: i })),
  ]
}

const startFetchDistributor = async () => {
  const distributorAll = await DistributorService.list({})
  distributorMap.value = arrayToKeyValue(distributorAll, 'id')
}

onBeforeMount(async () => {
  dataLoading.value = true
  await startFetchData()
  dataLoading.value = false
  await Promise.all([startFetchProductGroup(), startFetchWarehouse(), startFetchDistributor()])
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
  // console.log('🚀 ~ file: ProductList.vue:155 ~ startSearch ~ tableType.value:', tableType.value)
  page.value = 1
  if (sortColumn.value === 'expiryDate' && sortValue.value != '') {
    tableType.value = 'TABLE_BATCH'
  }
  // else if (warehouseId.value != 0) {
  //   tableType.value = 'TABLE_BATCH'
  // } else {
  //   tableType.value = 'TABLE_PRODUCT'
  // }
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
  await startFetchProductGroup()
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
      <div style="flex: 5; flex-basis: 400px">
        <div>Tìm kiếm</div>
        <div>
          <InputText
            v-model:value="searchText"
            placeholder="Tìm kiếm bằng tên hoặc hoạt chất"
            @update:value="startSearch" />
        </div>
      </div>

      <div style="flex: 2; flex-basis: 200px">
        <div>Chọn kho</div>
        <div>
          <VueSelect
            v-model:value="warehouseId"
            :options="warehouseOptions"
            @update:value="startSearch" />
        </div>
      </div>

      <div style="flex: 2; flex-basis: 200px">
        <div>Chọn nhóm sản phẩm</div>
        <div>
          <VueSelect
            v-model:value="productGroupId"
            :options="productGroupOptions"
            @update:value="startSearch" />
        </div>
      </div>
      <div style="flex: 1; flex-basis: 180px">
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            v-model:value="isActive"
            :options="[
              { text: 'Tất cả', value: '' },
              { text: 'Active', value: 1 },
              { text: 'Ngừng kinh doanh', value: 0 },
            ]"
            @update:value="startSearch" />
        </div>
      </div>
    </div>
    <div v-if="isMobile" class="page-main-list">
      <div
        class="py-2 px-4 flex gap-4 text-white font-bold"
        style="background-color: var(--color-table-thead-bg)">
        <div
          class="cursor-pointer flex items-center justify-center"
          @click="changeSort('brandName')">
          Tên &nbsp;
          <IconSort :sort="sortColumn === 'brandName' ? sortValue : ''" />
        </div>
        <div
          class="cursor-pointer flex items-center justify-center"
          @click="changeSort('expiryDate')">
          HSD &nbsp;
          <IconSort :sort="sortColumn === 'expiryDate' ? sortValue : ''" />
        </div>
        <div
          class="cursor-pointer ml-auto flex items-center justify-center"
          @click="changeSort('quantity')">
          SL &nbsp;
          <IconSort :sort="sortColumn === 'quantity' ? sortValue : ''" />
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
      <div v-if="!dataLoading && tableType === 'TABLE_PRODUCT'">
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
            backgroundColor: !product.isActive
              ? '#eeeeee'
              : productIndex % 2 !== 0
                ? 'var(--color-table-td-even-bg)'
                : '',
            opacity: product.isActive ? '' : '0.4',
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
              <div v-if="!product.batchList?.length" class="text-xs">
                <table style="width: 100%">
                  <tbody>
                    <tr>
                      <td
                        v-if="
                          permissionIdMap[PermissionId.READ_COST_PRICE] &&
                          settingStore.SCREEN_PRODUCT_LIST.costPrice
                        ">
                        N: {{ formatMoney(product.unitCostPrice) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="product.batchList?.length" class="text-xs">
                <table style="width: 100%">
                  <tbody>
                    <tr v-for="(batch, batchIndex) in product.batchList" :key="batchIndex">
                      <td style="width: 10%; font-weight: 500">
                        ({{ formatMoney(batch.unitQuantity) }})&nbsp;
                      </td>
                      <td
                        :style="
                          batch.expiryDate && batch.expiryDate < closeExpiryDate
                            ? 'color:red; font-weight:500'
                            : ''
                        ">
                        <span v-if="batch.expiryDate">
                          - HSD {{ DTimer.timeToText(batch.expiryDate) }}
                        </span>
                      </td>
                      <td
                        v-if="
                          permissionIdMap[PermissionId.READ_COST_PRICE] &&
                          settingStore.SCREEN_PRODUCT_LIST.costPrice
                        ">
                        - N: {{ formatMoney(product.unitCostPrice) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <div class="flex gap-1 items-center justify-end">
                <div
                  style="font-size: 16px; font-weight: 500"
                  :class="(product.unitQuantity || 0) <= 0 ? 'text-red-500' : ''">
                  {{ product.unitQuantity || 0 }}
                </div>
                <span v-if="settingStore.SCREEN_PRODUCT_LIST.unit">
                  {{ product.unitDefaultName }}
                </span>
              </div>
              <div class="text-xs" style="text-align: right">
                Giá: {{ formatMoney(product.unitRetailPrice) }}
              </div>
              <div class="text-xs" style="text-align: right">
                Sỉ: {{ formatMoney(product.wholesalePrice) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!dataLoading && tableType === 'TABLE_BATCH'">
        <div
          v-if="batchList.length === 0"
          class="p-2 text-center"
          style="border: 1px solid #cdcdcd">
          Không có dữ liệu
        </div>
        <div
          v-for="(batch, batchIndex) in batchList"
          :key="batchIndex"
          class="px-4 py-2"
          style="border-bottom: 1px solid #cdcdcd"
          :style="{
            backgroundColor: !batch.product?.isActive
              ? '#eeeeee'
              : batchIndex % 2 !== 0
                ? 'var(--color-table-td-even-bg)'
                : '',
            opacity: batch.product?.isActive ? '' : '0.4',
          }"
          @dblclick="
            permissionIdMap[PermissionId.PRODUCT_UPDATE] &&
              modalProductUpsert?.openModal(batch.productId)
          ">
          <div class="flex items-center">
            <div class="flex-1">
              <div class="flex gap-2">
                <div class="font-medium text-justify">
                  {{ batch.product?.brandName }}
                </div>
                <div v-if="settingStore.SCREEN_PRODUCT_LIST.detail">
                  <a @click="modalProductDetail?.openModal(batch.product!)">
                    <IconFileSearch />
                  </a>
                </div>
              </div>
              <div v-if="settingStore.SCREEN_PRODUCT_LIST.substance" class="text-xs">
                {{ batch.product?.substance }}
              </div>
              <div v-if="settingStore.SCREEN_PRODUCT_LIST.group" class="text-xs">
                {{ productGroupMap[batch.product!.productGroupId]?.name }}
              </div>
              <div class="text-xs">
                <table style="width: 100%">
                  <tbody>
                    <tr>
                      <td style="width: 10%; font-weight: 500">
                        ({{ formatMoney(batch.unitQuantity) }})&nbsp;
                      </td>
                      <td
                        :style="
                          batch.expiryDate && batch.expiryDate < closeExpiryDate
                            ? 'color:red; font-weight:500'
                            : ''
                        ">
                        <span v-if="batch.expiryDate">
                          - HSD {{ DTimer.timeToText(batch.expiryDate) }}
                        </span>
                      </td>
                      <td
                        v-if="
                          permissionIdMap[PermissionId.READ_COST_PRICE] &&
                          settingStore.SCREEN_PRODUCT_LIST.costPrice
                        ">
                        - N: {{ formatMoney(batch.product?.unitCostPrice) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <div class="flex gap-1 items-center justify-end">
                <div
                  style="font-size: 16px; font-weight: 500"
                  :class="(batch.product?.unitQuantity || 0) <= 0 ? 'text-red-500' : ''">
                  {{ batch.product?.unitQuantity || 0 }}
                </div>
                <span v-if="settingStore.SCREEN_PRODUCT_LIST.unit">
                  {{ batch.product?.unitDefaultName }}
                </span>
              </div>
              <div class="text-xs" style="text-align: right">
                Giá: {{ formatMoney(batch.product?.unitRetailPrice) }}
              </div>
              <div class="text-xs" style="text-align: right">
                Sỉ: {{ formatMoney(batch.product?.wholesalePrice) }}
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
              <div class="flex items-center justify-center">
                Mã SP &nbsp;
                <IconSort :sort="sortColumn === 'id' ? sortValue : ''" />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('brandName')">
              <div class="flex items-center justify-center">
                Tên &nbsp;
                <IconSort :sort="sortColumn === 'brandName' ? sortValue : ''" />
              </div>
            </th>
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.group">Nhóm</th>
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.unit">Đ.Vị</th>
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.warehouse">Kho</th>
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.distributor">NCC</th>
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.lotNumber">Số lô</th>
            <th
              v-if="settingStore.SCREEN_PRODUCT_LIST.expiryDate"
              class="cursor-pointer"
              @click="changeSort('expiryDate')">
              <div class="flex items-center justify-center">
                HSD &nbsp;
                <IconSort :sort="sortColumn === 'expiryDate' ? sortValue : ''" />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('quantity')">
              <div class="flex items-center justify-center">
                SL &nbsp;
                <IconSort :sort="sortColumn === 'quantity' ? sortValue : ''" />
              </div>
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
        <tbody v-if="!dataLoading && tableType === 'TABLE_PRODUCT'">
          <tr v-if="productList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <template v-for="(product, productIndex) in productList" :key="productIndex">
            <template v-if="!product.batchList || product.batchList.length === 0">
              <tr :style="product.isActive ? '' : 'background-color: #eeeeee; opacity: 0.4'">
                <td class="text-center">SP{{ product.id }}</td>
                <td>
                  <div>
                    <span>{{ product.brandName }}</span>
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
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.warehouse">
                  {{ product.warehouseIdList.map((i) => warehouseMap[i]?.name).join(', ') }}
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.distributor"></td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.lotNumber" class="text-center"></td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.expiryDate" class="text-center"></td>

                <td class="text-center" :class="(product.quantity || 0) <= 0 ? 'text-red-500' : ''">
                  {{ product.hasManageQuantity ? product.unitQuantity || 0 : '' }}
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
            <template v-if="product.batchList && product.batchList.length >= 1">
              <tr
                v-for="(batch, batchIndex) in product.batchList"
                :key="batchIndex"
                :style="product.isActive ? '' : 'background-color: #eeeeee; opacity: 0.4'">
                <td v-if="batchIndex === 0" class="text-center" :rowspan="product.batchList.length">
                  SP{{ product.id }}
                </td>
                <td v-if="batchIndex === 0" :rowspan="product.batchList.length">
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
                  :rowspan="product.batchList.length"
                  class="text-center">
                  {{ productGroupMap[product.productGroupId!]?.name }}
                </td>
                <td
                  v-if="settingStore.SCREEN_PRODUCT_LIST.unit && batchIndex === 0"
                  :rowspan="product.batchList.length"
                  class="text-center">
                  {{ product.unitDefaultName }}
                </td>

                <td v-if="settingStore.SCREEN_PRODUCT_LIST.warehouse">
                  {{ product.warehouseIdList.map((i) => warehouseMap[i]?.name).join(', ') }}
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.warehouse" class="text-center">
                  {{ distributorMap[batch.distributorId]?.fullName }} {{ batch.distributorId }}
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
                <td
                  v-if="batchIndex == 0 && settingStore.SYSTEM_SETTING.wholesalePrice"
                  :rowspan="product.batchList.length"
                  class="text-right">
                  {{ formatMoney(product.unitWholesalePrice || 0) }}
                </td>
                <td
                  v-if="batchIndex == 0 && settingStore.SYSTEM_SETTING.retailPrice"
                  :rowspan="product.batchList.length"
                  class="text-right">
                  {{ formatMoney(product.unitRetailPrice) }}
                </td>
                <td
                  v-if="
                    permissionIdMap[PermissionId.PRODUCT_UPDATE] &&
                    settingStore.SCREEN_PRODUCT_LIST.action &&
                    batchIndex == 0
                  "
                  :rowspan="product.batchList.length"
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
        <tbody v-if="!dataLoading && tableType === 'TABLE_BATCH'">
          <tr v-if="batchList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(batch, batchIndex) in batchList"
            :key="batchIndex"
            :style="batch.product?.isActive ? '' : 'background-color: #eeeeee; opacity: 0.4'">
            <td class="text-center">SP{{ batch.productId }}</td>
            <td>
              <div>
                {{ batch.product?.brandName }}
                <a
                  v-if="settingStore.SCREEN_PRODUCT_LIST.detail"
                  class="ml-1"
                  @click="modalProductDetail?.openModal(batch.product!)">
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="settingStore.SCREEN_PRODUCT_LIST.substance" style="font-size: 0.8rem">
                {{ batch.product?.substance }}
              </div>
            </td>
            <td v-if="settingStore.SCREEN_PRODUCT_LIST.group" class="text-center">
              {{ productGroupMap[batch.product?.productGroupId!]?.name }}
            </td>
            <td v-if="settingStore.SCREEN_PRODUCT_LIST.unit" class="text-center">
              {{ batch.product?.unitDefaultName }}
            </td>
            <td v-if="settingStore.SCREEN_PRODUCT_LIST.warehouse" class="text-center">
              {{ warehouseMap[batch.warehouseId]?.name }}
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
              {{ formatMoney(batch.unitCostPrice) }}
            </td>
            <td v-if="settingStore.SYSTEM_SETTING.wholesalePrice" class="text-right">
              {{ formatMoney(batch.product?.unitWholesalePrice) }}
            </td>
            <td v-if="settingStore.SYSTEM_SETTING.retailPrice" class="text-right">
              {{ formatMoney(batch.product?.unitRetailPrice) }}
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
                @click="modalProductUpsert?.openModal(batch.productId)">
                <FormOutlined />
              </a>
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
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
    </div>
  </div>
</template>
