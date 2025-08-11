<script setup lang="ts">
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VuePagination from '../../../common/VuePagination.vue'
import { IconDownload, IconFileSearch, IconSetting, IconUpload } from '../../../common/icon-antd'
import { IconSortChange } from '../../../common/icon-font-awesome'
import { IconEditSquare } from '../../../common/icon-google'
import VueDropdown from '../../../common/popover/VueDropdown.vue'
import { InputSelect, InputText, VueSelect } from '../../../common/vue-form'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { BatchService } from '../../../modules/batch'
import { Distributor, DistributorService } from '../../../modules/distributor'
import { PickupStrategy } from '../../../modules/enum'
import { FileProductApi } from '../../../modules/file-excel/file-product.api'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { ProductService, type Product } from '../../../modules/product'
import { ProductGroup, ProductGroupService } from '../../../modules/product-group'
import { Warehouse } from '../../../modules/warehouse'
import { WarehouseService } from '../../../modules/warehouse/warehouse.service'
import { ESTimer, arrayToKeyValue } from '../../../utils'
import Breadcrumb from '../../component/Breadcrumb.vue'
import ModalProductDetail from '../detail/ModalProductDetail.vue'
import ModalProductUpsert from '../upsert/ModalProductUpsert.vue'
import ModalDataProduct from './ModalDataProduct.vue'
import ModalProductListSettingScreen from './ModalProductListSettingScreen.vue'
import ModalProductMerge from './ModalProductMerge.vue'
import ModalUploadProduct from './ModalUploadProduct.vue'
import { VueTag } from '@/common'
import ModalProductGroupManager from './ModalProductGroupManager.vue'
import { CONFIG } from '@/config'

const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const modalProductMerge = ref<InstanceType<typeof ModalProductMerge>>()
const modalUploadProduct = ref<InstanceType<typeof ModalUploadProduct>>()
const modalProductListSettingScreen = ref<InstanceType<typeof ModalProductListSettingScreen>>()
const modalProductGroupManager = ref<InstanceType<typeof ModalProductGroupManager>>()
const modalDataProduct = ref<InstanceType<typeof ModalDataProduct>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const productList = ref<Product[]>([])

const productGroupOptions = ref<{ text: string; value: number; data: ProductGroup }[]>([])

const productGroupAll = ref<ProductGroup[]>([])
const productGroupMap = computed(() => arrayToKeyValue(productGroupAll.value, 'id'))

const warehouseOptions = ref<{ value: number; text: string; data: Warehouse }[]>([])
const warehouseMap = ref<Record<string, Warehouse>>({})
const distributorMap = ref<Record<string, Distributor>>({})
const distributorOptions = ref<{ value: number; text: string; data: Distributor }[]>([])

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PRODUCT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const productGroupId = ref<number>(0)
const warehouseId = ref<number>(0)
const distributorId = ref<number>(0)
const isActive = ref<1 | 0 | ''>(1)

const sortColumn = ref<'id' | 'expiryDate' | 'productCode' | 'brandName' | 'quantity' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  const paginationResponse = await ProductService.pagination({
    relation: { batchList: true, discountList: true },
    page: page.value,
    limit: limit.value,
    filter: {
      $OR: searchText.value
        ? [
            { productCode: { LIKE: searchText.value } },
            { brandName: { LIKE: searchText.value } },
            { substance: { LIKE: searchText.value } },
          ]
        : undefined,
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
      ['batchList.distributor' as any]: distributorId.value
        ? (v: any, record: Product) => {
            if (!record.batchList?.length) return false
            return record.batchList.some((b) => b.distributorId === distributorId.value)
          }
        : undefined,
      isActive: isActive.value !== '' ? isActive.value : undefined,
    },
    sort: sortValue.value
      ? {
          id: sortColumn.value === 'id' ? sortValue.value : undefined,
          productCode: sortColumn.value === 'productCode' ? sortValue.value : undefined,
          brandName: sortColumn.value === 'brandName' ? sortValue.value : undefined,
          quantity: sortColumn.value === 'quantity' ? sortValue.value : undefined,
          ['bachList.expiryDate' as any]:
            sortColumn.value === 'expiryDate'
              ? (a: Product, b: Product) => {
                  if (sortValue.value === 'ASC') {
                    let aExpiryDate: null | number = null
                    a.batchList?.forEach((batch) => {
                      if (batch.expiryDate == null) return
                      if (aExpiryDate == null) return (aExpiryDate = batch.expiryDate)
                      if (aExpiryDate < batch.expiryDate) {
                        aExpiryDate = batch.expiryDate
                      }
                    })
                    let bExpiryDate: null | number = null
                    b.batchList?.forEach((batch) => {
                      if (batch.expiryDate == null) return
                      if (bExpiryDate == null) return (bExpiryDate = batch.expiryDate)
                      if (bExpiryDate < batch.expiryDate) {
                        bExpiryDate = batch.expiryDate
                      }
                    })
                    if (bExpiryDate == null) return -1 // tăng hay giảm thì cũng để NULL ở cuối
                    if (aExpiryDate == null) return 1 // tăng hay giảm thì cũng để NULL ở cuối
                    return aExpiryDate < bExpiryDate ? -1 : 1
                  }
                  if (sortValue.value === 'DESC') {
                    let aExpiryDate: null | number = null
                    a.batchList?.forEach((batch) => {
                      if (batch.expiryDate == null) return
                      if (aExpiryDate == null) return (aExpiryDate = batch.expiryDate)
                      if (aExpiryDate > batch.expiryDate) {
                        aExpiryDate = batch.expiryDate
                      }
                    })
                    let bExpiryDate: null | number = null
                    b.batchList?.forEach((batch) => {
                      if (batch.expiryDate == null) return
                      if (bExpiryDate == null) return (bExpiryDate = batch.expiryDate)
                      if (bExpiryDate > batch.expiryDate) {
                        bExpiryDate = batch.expiryDate
                      }
                    })
                    if (bExpiryDate == null) return -1 // tăng hay giảm thì cũng để NULL ở cuối
                    if (aExpiryDate == null) return 1 // tăng hay giảm thì cũng để NULL ở cuối
                    return aExpiryDate > bExpiryDate ? -1 : 1
                  }
                  return a.id > b.id ? -1 : 1
                }
              : undefined,
        }
      : { id: 'DESC' },
  })
  productList.value = paginationResponse.productList
  total.value = paginationResponse.total
}

const startFetchDataGroup = async () => {
  try {
    productGroupAll.value = await ProductGroupService.list({})
    productGroupOptions.value = [
      { value: 0, text: 'Tất cả', data: ProductGroup.blank() },
      ...productGroupAll.value.map((i) => ({ value: i.id, text: i.name, data: i })),
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
  distributorOptions.value = [
    { value: 0, text: 'Tất cả', data: Distributor.blank() },
    ...distributorAll.map((i) => ({ value: i.id, text: i.fullName, data: i })),
  ]
  distributorMap.value = arrayToKeyValue(distributorAll, 'id')
}

onBeforeMount(async () => {
  dataLoading.value = true
  await startFetchData()
  dataLoading.value = false
  await Promise.all([startFetchDataGroup(), startFetchWarehouse(), startFetchDistributor()])
})

onMounted(async () => {
  const [productRefresh, batchRefresh] = await Promise.all([
    ProductService.refreshDB(),
    BatchService.refreshDB(),
  ])
  if (productRefresh?.numberChange || batchRefresh?.numberChange) {
    await startFetchData()
  }
})

const startSearch = async () => {
  await startFetchData()
}

const startFilter = async () => {
  page.value = 1
  await startFetchData()
}

const changeSort = async (
  value: 'id' | 'expiryDate' | 'productCode' | 'brandName' | 'quantity',
) => {
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
  await startFilter()
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('PRODUCT_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const handleModalProductGroupManagerSuccess = async () => {
  productGroupAll.value = await ProductGroupService.list({})
}

const handleModalProductUpsertSuccess = async (
  data: Product,
  type: 'CREATE' | 'UPDATE' | 'DESTROY',
) => {
  await startFetchData()
}

const downloadExcelProductList = async () => {
  ModalStore.confirm({
    title: 'Xác nhận tải file báo cáo',
    content: 'Thời gian tải file có thể tốn vài phút nếu dữ liệu lớn, bạn vẫn mốn tải ?',
    onOk: async () => {
      await FileProductApi.downloadExcel()
    },
  })
}

const closeExpiryDate = computed(() => {
  return Date.now() + 6 * 30 * 24 * 60 * 60 * 1000
})

const handleModalUploadProductSuccess = async () => {
  await Promise.all([ProductService.refreshDB(), BatchService.refreshDB()])
  await startFetchData()
}
</script>

<template>
  <ModalProductUpsert ref="modalProductUpsert" @success="handleModalProductUpsertSuccess" />
  <ModalUploadProduct ref="modalUploadProduct" @success="handleModalUploadProductSuccess" />
  <ModalProductListSettingScreen
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalProductListSettingScreen"
  />
  <ModalProductGroupManager
    ref="modalProductGroupManager"
    @success="handleModalProductGroupManagerSuccess"
  />
  <ModalDataProduct ref="modalDataProduct" />
  <ModalProductMerge ref="modalProductMerge" />
  <ModalProductDetail ref="modalProductDetail" @close="startFetchData" />
  <div class="mx-4 mt-4 gap-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="hidden md:block">
        <Breadcrumb />
      </div>
      <div class="">
        <VueButton
          v-if="userPermission[PermissionId.PRODUCT_CREATE]"
          color="blue"
          icon="plus"
          @click="modalProductUpsert?.openModal(0, { hasInitQuantity: true })"
        >
          Thêm Sản Phẩm
        </VueButton>
      </div>
    </div>
    <div class="mr-2 flex items-center gap-4 flex-wrap">
      <div v-if="!isMobile">
        <VueButton
          v-if="userPermission[PermissionId.FILE_EXCEL_UPLOAD_PRODUCT]"
          :icon="IconUpload"
          @click="modalUploadProduct?.openModal()"
        >
          Upload
        </VueButton>
      </div>
      <div v-if="!isMobile">
        <VueButton
          v-if="userPermission[PermissionId.FILE_EXCEL_DOWNLOAD_PRODUCT]"
          :icon="IconDownload"
          @click="downloadExcelProductList"
        >
          Download
        </VueButton>
      </div>
      <VueButton
        v-if="userPermission[PermissionId.PRODUCT_GROUP_CRUD]"
        icon="send"
        color="green"
        @click="modalProductGroupManager?.openModal()"
      >
        Nhóm sản phẩm
      </VueButton>
      <VueDropdown>
        <template #trigger>
          <span style="font-size: 1.2rem; cursor: pointer">
            <IconSetting />
          </span>
        </template>
        <div class="vue-menu">
          <a
            v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
            @click="modalProductListSettingScreen?.openModal()"
          >
            Cài đặt hiển thị
          </a>
          <a @click="modalDataProduct?.openModal()">Cài đặt dữ liệu</a>
          <a v-if="isMobile" @click="modalUploadProduct?.openModal()">Upload</a>
          <a v-if="isMobile" @click="downloadExcelProductList">Download</a>
          <a @click="modalProductMerge?.openModal()">*** Gộp sản phẩm</a>
        </div>
      </VueDropdown>
    </div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 5; flex-basis: 300px">
        <div>Tìm kiếm</div>
        <div>
          <InputText
            v-model:value="searchText"
            placeholder="Tìm kiếm bằng mã sản phẩm, tên hoặc hoạt chất"
            @update:value="startFetchData"
          />
        </div>
      </div>

      <div style="flex: 2; flex-basis: 160px">
        <div>Chọn kho</div>
        <div>
          <VueSelect
            v-model:value="warehouseId"
            :options="warehouseOptions"
            @update:value="startFilter"
          />
        </div>
      </div>

      <div style="flex: 2; flex-basis: 180px">
        <div>Chọn nhà cung cấp</div>
        <div>
          <VueSelect
            v-model:value="distributorId"
            :options="distributorOptions"
            @update:value="startFetchData"
          />
        </div>
      </div>

      <div style="flex: 2; flex-basis: 180px">
        <div>Chọn nhóm sản phẩm</div>
        <div>
          <VueSelect
            v-model:value="productGroupId"
            :options="productGroupOptions"
            @update:value="startFilter"
          />
        </div>
      </div>
      <div style="flex: 1; flex-basis: 150px">
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            v-model:value="isActive"
            :options="[
              { text: 'Tất cả', value: '' },
              { text: 'Active', value: 1 },
              { text: 'Ngừng kinh doanh', value: 0 },
            ]"
            @update:value="startFilter"
          />
        </div>
      </div>
    </div>
    <div v-if="isMobile" class="page-main-list">
      <div
        class="py-2 px-4 flex gap-4 text-white font-bold"
        style="background-color: var(--color-table-thead-bg)"
      >
        <div
          class="cursor-pointer flex items-center justify-center"
          @click="changeSort('brandName')"
        >
          Tên &nbsp;
          <IconSortChange :sort="sortColumn === 'brandName' ? sortValue : ''" />
        </div>
        <div
          class="cursor-pointer flex items-center justify-center"
          @click="changeSort('expiryDate')"
        >
          HSD &nbsp;
          <IconSortChange :sort="sortColumn === 'expiryDate' ? sortValue : ''" />
        </div>
        <div
          class="cursor-pointer ml-auto flex items-center justify-center"
          @click="changeSort('quantity')"
        >
          SL &nbsp;
          <IconSortChange :sort="sortColumn === 'quantity' ? sortValue : ''" />
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
      <div v-if="!dataLoading">
        <div
          v-if="productList.length === 0"
          class="p-2 text-center"
          style="border: 1px solid #cdcdcd"
        >
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
            userPermission[PermissionId.PRODUCT_UPDATE] && modalProductUpsert?.openModal(product.id)
          "
        >
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
              <div v-if="settingStore.SCREEN_PRODUCT_LIST.substance" class="max-line-2 text-xs">
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
                          userPermission[PermissionId.PRODUCT_READ_COST_PRICE] &&
                          settingStore.SCREEN_PRODUCT_LIST.costPrice
                        "
                      >
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
                        "
                      >
                        <span v-if="batch.expiryDate">
                          - HSD {{ ESTimer.timeToText(batch.expiryDate) }}
                        </span>
                      </td>
                      <td
                        v-if="
                          userPermission[PermissionId.PRODUCT_READ_COST_PRICE] &&
                          settingStore.SCREEN_PRODUCT_LIST.costPrice
                        "
                      >
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
                  :class="(product.unitQuantity || 0) <= 0 ? 'text-red-500' : ''"
                >
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
    </div>

    <div v-if="!isMobile" class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th
              v-if="CONFIG.MODE === 'development'"
              class="cursor-pointer"
              @click="changeSort('id')"
            >
              <div class="flex items-center justify-center gap-1">
                <span>ID</span>
                <IconSortChange :sort="sortColumn === 'id' ? sortValue : ''" />
              </div>
            </th>
            <th style="width: 100px" class="cursor-pointer" @click="changeSort('productCode')">
              <div class="flex items-center justify-center">
                Mã SP &nbsp;
                <IconSortChange :sort="sortColumn === 'productCode' ? sortValue : ''" />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('brandName')">
              <div class="flex items-center justify-center">
                Tên &nbsp;
                <IconSortChange :sort="sortColumn === 'brandName' ? sortValue : ''" />
              </div>
            </th>
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.group">Nhóm</th>
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.unit">Đ.Vị</th>
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.warehouse">Kho</th>
            <th v-if="settingStore.SCREEN_PRODUCT_LIST.distributor">NCC</th>
            <th
              v-if="settingStore.SCREEN_PRODUCT_LIST.expiryDate"
              class="cursor-pointer"
              @click="changeSort('expiryDate')"
            >
              <div class="flex items-center justify-center gap-1">
                <span>HSD</span>
                <IconSortChange :sort="sortColumn === 'expiryDate' ? sortValue : ''" />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('quantity')">
              <div class="flex items-center justify-center gap-1">
                <span>SL</span>
                <IconSortChange :sort="sortColumn === 'quantity' ? sortValue : ''" />
              </div>
            </th>
            <th
              v-if="
                userPermission[PermissionId.PRODUCT_READ_COST_PRICE] &&
                settingStore.SCREEN_PRODUCT_LIST.costPrice
              "
            >
              G.Nhập
            </th>
            <th v-if="settingStore.SYSTEM_SETTING.wholesalePrice">G.Sỉ</th>
            <th>G.Lẻ</th>
            <th>K.Mại</th>
            <th
              v-if="
                userPermission[PermissionId.PRODUCT_UPDATE] &&
                settingStore.SCREEN_PRODUCT_LIST.action
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
        <tbody v-if="!dataLoading">
          <tr v-if="productList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <template v-for="(product, productIndex) in productList" :key="productIndex">
            <template v-if="!product.batchList || product.batchList.length === 0">
              <tr :style="product.isActive ? '' : 'background-color: #eeeeee; opacity: 0.4'">
                <td v-if="CONFIG.MODE === 'development'" class="text-center" style="color: violet">
                  {{ product.id }}
                </td>
                <td class="text-center">{{ product.productCode }}</td>
                <td>
                  <div>
                    <span>{{ product.brandName }}</span>
                    <a
                      v-if="settingStore.SCREEN_PRODUCT_LIST.detail"
                      class="ml-1"
                      @click="modalProductDetail?.openModal(product)"
                    >
                      <IconFileSearch />
                    </a>
                  </div>
                  <div
                    v-if="settingStore.SCREEN_PRODUCT_LIST.substance"
                    class="max-line-2"
                    style="font-size: 0.8rem"
                  >
                    {{ product.substance }}
                  </div>
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.group" class="text-center">
                  <div class="max-line-2">
                    {{ productGroupMap[product.productGroupId!]?.name }}
                  </div>
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.unit" class="text-center">
                  {{ product.unitDefaultName }}
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.warehouse" class="text-center">
                  {{ product.warehouseIdList.map((i) => warehouseMap[i]?.name).join(', ') }}
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.distributor"></td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.expiryDate"></td>
                <td class="text-center" :class="(product.quantity || 0) <= 0 ? 'text-red-500' : ''">
                  {{ product.warehouseIds !== '[]' ? product.unitQuantity || 0 : '' }}
                </td>
                <td
                  v-if="
                    userPermission[PermissionId.PRODUCT_READ_COST_PRICE] &&
                    settingStore.SCREEN_PRODUCT_LIST.costPrice
                  "
                  class="text-right"
                >
                  {{ formatMoney(product.unitCostPrice || 0) }}
                </td>
                <td v-if="settingStore.SYSTEM_SETTING.wholesalePrice" class="text-right">
                  {{ formatMoney(product.unitWholesalePrice || 0) }}
                </td>
                <td class="text-right">
                  {{ formatMoney(product.unitRetailPrice) }}
                </td>
                <td class="text-center">
                  <VueTag v-if="product.discountApply" color="blue">
                    {{ product.discountApply?.valueText }}
                  </VueTag>
                </td>
                <td
                  v-if="
                    userPermission[PermissionId.PRODUCT_UPDATE] &&
                    settingStore.SCREEN_PRODUCT_LIST.action
                  "
                  class="text-center"
                >
                  <a
                    style="color: #eca52b"
                    class="text-xl"
                    @click="modalProductUpsert?.openModal(product.id)"
                  >
                    <IconEditSquare />
                  </a>
                </td>
              </tr>
            </template>
            <template v-if="product.batchList && product.batchList.length >= 1">
              <tr
                v-for="(batch, batchIndex) in product.batchList"
                :key="batchIndex"
                :style="product.isActive ? '' : 'background-color: #eeeeee; opacity: 0.4'"
              >
                <td
                  v-if="CONFIG.MODE === 'development' && batchIndex === 0"
                  style="color: violet; text-align: center"
                  :rowspan="product.batchList.length"
                >
                  {{ product.id }}
                </td>
                <td v-if="batchIndex === 0" class="text-center" :rowspan="product.batchList.length">
                  {{ product.productCode }}
                </td>
                <td v-if="batchIndex === 0" :rowspan="product.batchList.length">
                  <div>
                    {{ product.brandName }}
                    <a
                      v-if="settingStore.SCREEN_PRODUCT_LIST.detail"
                      class="ml-1"
                      @click="modalProductDetail?.openModal(product)"
                    >
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
                  class="text-center"
                >
                  {{ productGroupMap[product.productGroupId!]?.name }}
                </td>
                <td
                  v-if="settingStore.SCREEN_PRODUCT_LIST.unit && batchIndex === 0"
                  :rowspan="product.batchList.length"
                  class="text-center"
                >
                  {{ product.unitDefaultName }}
                </td>

                <td v-if="settingStore.SCREEN_PRODUCT_LIST.warehouse" class="text-center">
                  {{ warehouseMap[batch.warehouseId]?.name }}
                </td>
                <td v-if="settingStore.SCREEN_PRODUCT_LIST.distributor">
                  {{ distributorMap[batch.distributorId]?.fullName }}
                </td>

                <td
                  v-if="settingStore.SCREEN_PRODUCT_LIST.expiryDate"
                  class="text-center"
                  :style="
                    batch.expiryDate && batch.expiryDate < closeExpiryDate
                      ? 'color:red; font-weight:500'
                      : ''
                  "
                >
                  {{ batch.expiryDate ? ESTimer.timeToText(batch.expiryDate, 'DD/MM/YYYY') : '' }}
                </td>

                <td class="text-center" :class="(batch.quantity || 0) <= 0 ? 'text-red-500' : ''">
                  {{ batch.unitQuantity || 0 }}
                </td>
                <td
                  v-if="
                    userPermission[PermissionId.PRODUCT_READ_COST_PRICE] &&
                    settingStore.SCREEN_PRODUCT_LIST.costPrice
                  "
                  class="text-right"
                >
                  {{ formatMoney(batch.unitCostPrice || 0) }}
                </td>
                <td v-if="batchIndex == 0" :rowspan="product.batchList.length" class="text-right">
                  {{ formatMoney(product.unitRetailPrice) }}
                </td>
                <td v-if="batchIndex == 0" :rowspan="product.batchList.length" class="text-center">
                  <VueTag v-if="product.discountApply" color="blue">
                    {{ product.discountApply?.valueText }}
                  </VueTag>
                </td>
                <td
                  v-if="
                    userPermission[PermissionId.PRODUCT_UPDATE] &&
                    settingStore.SCREEN_PRODUCT_LIST.action &&
                    batchIndex == 0
                  "
                  :rowspan="product.batchList.length"
                  class="text-center"
                >
                  <a
                    style="color: #eca52b"
                    class="text-xl"
                    @click="modalProductUpsert?.openModal(product.id)"
                  >
                    <IconEditSquare />
                  </a>
                </td>
              </tr>
            </template>
          </template>
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
