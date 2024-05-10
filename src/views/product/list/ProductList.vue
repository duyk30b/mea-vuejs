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
const { formatMoney, isMobile } = screenStore
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
      relation: { batches: true },
      filter: {
        group: group.value ? group.value : undefined,
        isActive: isActive.value !== '' ? isActive.value : undefined,
        searchText: searchText.value || undefined,
        batches: { quantity: { NOT: 0 } },
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
        Thêm Sản Phẩm
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
              <div class="flex text-xs">
                <div
                  v-if="
                    permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE] &&
                    screenStore.SCREEN_PRODUCT_LIST.costPrice
                  "
                  style="width: 25%"
                >
                  N: {{ formatMoney(product.unitCostPrice) }}
                </div>
                <div v-if="screenStore.SYSTEM_SETTING.wholesalePrice" style="width: 20%">
                  S: {{ formatMoney(product.unitWholesalePrice) }}
                </div>
                <div v-if="screenStore.SYSTEM_SETTING.retailPrice" style="width: 20%">
                  L: {{ formatMoney(product.unitRetailPrice) }}
                </div>
              </div>
            </div>
            <div v-if="screenStore.SCREEN_PRODUCT_LIST.unit" style="width: 50px">
              <span class="ml-1 text-xs"> {{ product.unitName }} </span>
            </div>
            <div
              style="width: 40px; font-size: 16px; font-weight: 500; text-align: right"
              :class="(product.unitQuantity || 0) <= 0 ? 'text-red-500' : ''"
            >
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
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
        />
      </div>
    </div>

    <div v-if="!isMobile" class="page-main-table table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">
              Mã SP &nbsp;
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
              v-if="
                permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE] &&
                screenStore.SCREEN_PRODUCT_LIST.costPrice
              "
            >
              G.Nhập
            </th>
            <th v-if="screenStore.SYSTEM_SETTING.wholesalePrice">G.Sỉ</th>
            <th v-if="screenStore.SYSTEM_SETTING.retailPrice">G.Lẻ</th>
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
        <tbody v-if="!dataLoading">
          <tr v-if="productList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(product, index) in productList" :key="index">
            <td class="text-center">PR{{ product.id }}</td>
            <td>
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
            <td v-if="screenStore.SCREEN_PRODUCT_LIST.group" class="text-center">
              {{ screenStore.PRODUCT_GROUP[product.group!] }}
            </td>
            <td v-if="screenStore.SCREEN_PRODUCT_LIST.unit" class="text-center">
              {{ product.unitName }}
            </td>
            <td class="text-right" :class="(product.quantity || 0) <= 0 ? 'text-red-500' : ''">
              {{ product.unitQuantity || 0 }}
            </td>
            <td
              v-if="
                permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE] &&
                screenStore.SCREEN_PRODUCT_LIST.costPrice
              "
              class="text-right"
            >
              {{ formatMoney(product.unitCostPrice || 0) }}
            </td>
            <td v-if="screenStore.SYSTEM_SETTING.wholesalePrice" class="text-right">
              {{ formatMoney(product.unitWholesalePrice || 0) }}
            </td>
            <td v-if="screenStore.SYSTEM_SETTING.retailPrice" class="text-right">
              {{ formatMoney(product.unitRetailPrice) }}
            </td>
            <td v-if="screenStore.SCREEN_PRODUCT_LIST.isActive" class="text-center">
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
