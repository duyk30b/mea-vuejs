<script lang="ts" setup>
import { IconEditSquare } from '@/common/icon-google'
import { ModalStore } from '@/common/vue-modal/vue-modal.store.ts'
import { MeService } from '@/modules/_me/me.service.ts'
import { useSettingStore } from '@/modules/_me/setting.store.ts'
import { Batch, BatchService } from '@/modules/batch'
import { Distributor, DistributorService } from '@/modules/distributor'
import { FileProductApi } from '@/modules/file-excel/file-product.api.ts'
import { PermissionId } from '@/modules/permission/permission.enum.ts'
import { type Product, ProductService } from '@/modules/product'
import { ProductGroup, ProductGroupService } from '@/modules/product-group'
import { Warehouse, WarehouseService } from '@/modules/warehouse'
import { ESArray, ESTimer } from '@/utils'
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VuePagination from '../../../common/VuePagination.vue'
import { IconDownload, IconFileSearch, IconSetting, IconUpload } from '../../../common/icon-antd'
import { IconSortChange } from '../../../common/icon-font-awesome'
import VueDropdown from '../../../common/popover/VueDropdown.vue'
import { InputSelect, InputText, VueSelect } from '../../../common/vue-form'
import Breadcrumb from '../../component/Breadcrumb.vue'
import ModalProductDetail from '../detail/ModalProductDetail.vue'
import ModalProductUpsert from '../upsert/ModalProductUpsert.vue'
import ModalDataProduct from './ModalDataProduct.vue'
import ModalProductListSettingScreen from './ModalProductListSettingScreen.vue'
import ModalProductMerge from './ModalProductMerge.vue'
import ModalUploadProduct from './ModalUploadProduct.vue'

const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const modalProductMerge = ref<InstanceType<typeof ModalProductMerge>>()
const modalUploadProduct = ref<InstanceType<typeof ModalUploadProduct>>()
const modalProductListSettingScreen = ref<InstanceType<typeof ModalProductListSettingScreen>>()
const modalDataProduct = ref<InstanceType<typeof ModalDataProduct>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const batchList = ref<Batch[]>([])

const productGroupOptions = ref<{ text: string; value: number; data: ProductGroup }[]>([])
const productGroupMap = ref<Record<string, ProductGroup>>({})

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

const sortColumn = ref<
  'product.id' | 'expiryDate' | 'lotNumber' | 'product.brandName' | 'quantity' | ''
>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  const paginationResponse = await BatchService.pagination({
    relation: { product: true },
    page: page.value,
    limit: limit.value,
    filter: {
      $OR: searchText.value
        ? [
            { ['product.brandName' as any]: { LIKE: searchText.value } },
            { ['product.substance' as any]: { LIKE: searchText.value } },
            { lotNumber: { LIKE: searchText.value } },
          ]
        : undefined,
      ['product.productGroupId' as any]: productGroupId.value ? productGroupId.value : undefined,
      warehouseId: warehouseId.value ? warehouseId.value : undefined,
      distributorId: distributorId.value ? distributorId.value : undefined,
      ['product.isActive' as any]: isActive.value !== '' ? isActive.value : undefined,
      // $OR:
      //   isActive.value !== ''
      //     ? [{ ['product.isActive' as any]: isActive.value }, { isActive: isActive.value }]
      //     : undefined,
    },
    sort: sortValue.value
      ? {
          lotNumber: sortColumn.value === 'lotNumber' ? sortValue.value : undefined,
          expiryDate: sortColumn.value === 'expiryDate' ? sortValue.value : undefined,
          quantity: sortColumn.value === 'quantity' ? sortValue.value : undefined,
          ['product.brandName' as any]:
            sortColumn.value === 'product.brandName' ? sortValue.value : undefined,
          ['product.id' as any]: sortColumn.value === 'product.id' ? sortValue.value : undefined,
        }
      : { productId: 'ASC' },
  })
  batchList.value = paginationResponse.batchList
  total.value = paginationResponse.total
}

const startFetchDataGroup = async () => {
  const productGroupAll = await ProductGroupService.list({})
  productGroupMap.value = ESArray.arrayToKeyValue(productGroupAll, 'id')
  productGroupOptions.value = [
    { value: 0, text: 'Tất cả', data: ProductGroup.blank() },
    ...productGroupAll.map((i) => ({ value: i.id, text: i.name, data: i })),
  ]
}

const startFetchWarehouse = async () => {
  const warehouseAll = await WarehouseService.list({})
  warehouseMap.value = ESArray.arrayToKeyValue(warehouseAll, 'id')
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
  distributorMap.value = ESArray.arrayToKeyValue(distributorAll, 'id')
}

onBeforeMount(async () => {
  try {
    dataLoading.value = true
    await startFetchData()
    await Promise.all([startFetchDataGroup(), startFetchWarehouse(), startFetchDistributor()])
  } catch (error) {
    console.log('🚀 ~ BatchList.vue:145 ~ onBeforeMount ~ error:', error)
  } finally {
    dataLoading.value = false
  }
})

onMounted(async () => {
  const [batchRefresh] = await Promise.all([BatchService.refreshDB()])
  if (batchRefresh?.numberChange) {
    await startFetchData()
  }
})

const startFilter = async () => {
  page.value = 1
  await startFetchData()
}

const changeSort = async (
  value: 'product.id' | 'expiryDate' | 'lotNumber' | 'product.brandName' | 'quantity',
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
  <ModalDataProduct ref="modalDataProduct" />
  <ModalProductMerge ref="modalProductMerge" />
  <ModalProductDetail ref="modalProductDetail" />
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
          @click="modalProductUpsert?.openModal()"
        >
          Thêm Sản Phẩm
        </VueButton>
      </div>
    </div>
    <div class="mr-2 flex items-center gap-4 flex-wrap">
      <div>
        <VueButton
          v-if="userPermission[PermissionId.FILE_EXCEL_UPLOAD_PRODUCT]"
          :icon="IconUpload"
          @click="modalUploadProduct?.openModal()"
        >
          Upload
        </VueButton>
      </div>
      <div>
        <VueButton
          v-if="userPermission[PermissionId.FILE_EXCEL_DOWNLOAD_PRODUCT]"
          :icon="IconDownload"
          @click="downloadExcelProductList"
        >
          Download
        </VueButton>
      </div>
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
            placeholder="Tìm kiếm bằng tên hoặc hoạt chất"
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
          @click="changeSort('product.brandName')"
        >
          Tên &nbsp;
          <IconSortChange :sort="sortColumn === 'product.brandName' ? sortValue : ''" />
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
          v-if="batchList.length === 0"
          class="p-2 text-center"
          style="border: 1px solid #cdcdcd"
        >
          Không có dữ liệu
        </div>
        <div
          v-for="(batch, batchIndex) in batchList"
          :key="batchIndex"
          :style="{
            backgroundColor:
              !batch.isActive || !batch.product?.isActive
                ? '#eeeeee'
                : batchIndex % 2 !== 0
                  ? 'var(--color-table-td-even-bg)'
                  : '',
            opacity: batch.isActive ? '' : '0.4',
          }"
          class="px-4 py-2"
          style="border-bottom: 1px solid #cdcdcd"
          @dblclick="
            userPermission[PermissionId.PRODUCT_UPDATE] &&
            modalProductUpsert?.openModal(batch.productId)
          "
        >
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
              <div v-if="settingStore.SCREEN_PRODUCT_LIST.substance" class="max-line-2 text-xs">
                {{ batch.product?.substance }}
              </div>
              <div v-if="settingStore.SCREEN_PRODUCT_LIST.group" class="text-xs">
                {{ productGroupMap[batch.product?.productGroupId || 0]?.name }}
              </div>
              <div class="text-xs flex justify-between flex-wrap">
                <div style="width: 10%; font-weight: 500">
                  ({{ formatMoney(batch.unitQuantity) }})&nbsp;
                </div>
                <div
                  v-if="batch.expiryDate"
                  :style="
                    batch.expiryDate && batch.expiryDate < closeExpiryDate
                      ? 'color:red; font-weight:500'
                      : ''
                  "
                >
                  <span>- HSD {{ ESTimer.timeToText(batch.expiryDate) }}</span>
                </div>
                <div
                  v-if="
                    userPermission[PermissionId.PRODUCT_READ_COST_PRICE] &&
                    settingStore.SCREEN_PRODUCT_LIST.costPrice
                  "
                >
                  - N: {{ formatMoney(batch.unitCostPrice) }}
                </div>
              </div>
            </div>
            <div>
              <div class="flex gap-1 items-center justify-end">
                <div
                  :class="(batch.unitQuantity || 0) <= 0 ? 'text-red-500' : ''"
                  style="font-size: 16px; font-weight: 500"
                >
                  {{ batch.unitQuantity || 0 }}
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
    </div>

    <div v-if="!isMobile" class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="cursor-pointer" style="width: 40px" @click="changeSort('product.id')">
              <div class="flex items-center justify-center">
                ID SP &nbsp;
                <IconSortChange :sort="sortColumn === 'product.id' ? sortValue : ''" />
              </div>
            </th>
            <th class="cursor-pointer" style="width: 100px" @click="changeSort('lotNumber')">
              <div class="flex items-center justify-center">
                Mã SP &nbsp;
                <IconSortChange :sort="sortColumn === 'lotNumber' ? sortValue : ''" />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('product.brandName')">
              <div class="flex items-center justify-center">
                Tên &nbsp;
                <IconSortChange :sort="sortColumn === 'product.brandName' ? sortValue : ''" />
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
          <tr v-if="batchList.length === 0">
            <td class="text-center" colspan="20">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(batch, batchIndex) in batchList"
            :key="batchIndex"
            :style="
              !batch.isActive || !batch.product?.isActive
                ? 'background-color: #eeeeee; opacity: 0.4'
                : ''
            "
          >
            <td class="text-center">{{ batch.productId }}</td>
            <td class="text-center">{{ batch.lotNumber }}</td>
            <td>
              <div>
                {{ batch.product?.brandName }}
                <a
                  v-if="settingStore.SCREEN_PRODUCT_LIST.detail"
                  class="ml-1"
                  @click="modalProductDetail?.openModal(batch.product!)"
                >
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="settingStore.SCREEN_PRODUCT_LIST.substance" style="font-size: 0.8rem">
                {{ batch.product?.substance }}
              </div>
            </td>
            <td v-if="settingStore.SCREEN_PRODUCT_LIST.group" class="text-center">
              {{ productGroupMap[batch.product?.productGroupId || 0]?.name || '' }}
            </td>
            <td v-if="settingStore.SCREEN_PRODUCT_LIST.unit" class="text-center">
              {{ batch.product?.unitDefaultName }}
            </td>
            <td v-if="settingStore.SCREEN_PRODUCT_LIST.warehouse" class="text-center">
              {{ warehouseMap[batch.warehouseId]?.name }}
            </td>
            <td v-if="settingStore.SCREEN_PRODUCT_LIST.distributor">
              {{ distributorMap[batch.distributorId]?.fullName }}
            </td>
            <td
              v-if="settingStore.SCREEN_PRODUCT_LIST.expiryDate"
              :style="
                batch.expiryDate && batch.expiryDate < closeExpiryDate
                  ? 'color:red; font-weight:500'
                  : ''
              "
              class="text-center"
            >
              {{ batch.expiryDate ? ESTimer.timeToText(batch.expiryDate, 'DD/MM/YYYY') : '' }}
            </td>
            <td :class="(batch.quantity || 0) <= 0 ? 'text-red-500' : ''" class="text-center">
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
            <td class="text-right">
              {{ formatMoney(batch.product?.unitRetailPrice) }}
            </td>

            <td
              v-if="
                userPermission[PermissionId.PRODUCT_UPDATE] &&
                settingStore.SCREEN_PRODUCT_LIST.action
              "
              class="text-center"
            >
              <a
                class="text-xl"
                style="color: #eca52b"
                @click="modalProductUpsert?.openModal(batch.productId)"
              >
                <IconEditSquare />
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="p-4 flex flex-wrap justify-end gap-4">
      <VuePagination
        v-model:page="page"
        :limit="limit"
        :total="total"
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
