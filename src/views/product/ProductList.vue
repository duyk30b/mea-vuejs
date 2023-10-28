<script setup lang="ts">
import {
  useProductBatchStore, useProductStore,
  type Product, type ProductBatch,
} from '@/modules/product'
import { useOrganizationStore } from '@/store/organization.store'
import { convertViToEn, timeToText } from '@/utils'
import {
  CheckCircleOutlined, FileSearchOutlined, FormOutlined,
  MinusCircleOutlined, PlusOutlined, SettingOutlined, ShopOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, onMounted, ref } from 'vue'
import ModalDataProduct from './components/ModalDataProduct.vue'
import ModalProductUpsert from './components/ModalProductUpsert.vue'
import ModalScreenProductList from './components/ModalScreenProductList.vue'
import ModalProductDetail from './detail/ModalProductDetail.vue'

const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const modalScreenProductList = ref<InstanceType<typeof ModalScreenProductList>>()
const modalDataProduct = ref<InstanceType<typeof ModalDataProduct>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()

const productStore = useProductStore()
const productBatchStore = useProductBatchStore()
const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const isMobile = window.innerWidth < 768

const productList = ref<Product[]>([])
const productBatchList = ref<ProductBatch[]>([])

const loadingComponent = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PRODUCT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const group = ref<string>('')
const isActive = ref<'true' | 'false' | ''>('true')

const sortColumn = ref<'expiry_date' | 'id' | 'brand_name' | 'quantity' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchProduct = async () => {
  loadingComponent.value = true
  try {
    let sort: any
    if (sortColumn.value !== 'expiry_date' && sortValue.value) {
      sort = { [sortColumn.value]: sortValue.value }
    }
    const data = productStore.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        group: group.value ? group.value : undefined,
        is_active: isActive.value ? isActive.value : undefined,
        search_text: searchText.value ? convertViToEn(searchText.value) : undefined,
      },
      sort,
    })
    productList.value = data.data
    total.value = data.total
  } catch (error) {
    console.log('🚀 ~ file: ProductList.vue:59 ~ error:', error)
  } finally {
    loadingComponent.value = false
  }
}

const startFetchProductBatch = async () => {
  try {
    let sort: any
    if (sortColumn.value === 'expiry_date' && sortValue.value) {
      sort = { expiry_date: sortValue.value }
    }
    const data = productBatchStore.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        group: group.value ? group.value : undefined,
        is_active: isActive.value ? isActive.value : undefined,
        search_text: searchText.value ? convertViToEn(searchText.value) : undefined,
      },
      relation: { product: true },
      sort,
    })
    productBatchList.value = data.data
    total.value = data.total
  } catch (error) {
    console.log('🚀 ~ file: ProductList.vue:77 ~ error:', error)
  }
}

onBeforeMount(async () => {
  await productStore.fetchAll()
  await startFetchData()
})

onMounted(async () => {
  await productBatchStore.fetchAll()
})

const startFetchData = async () => {
  if (sortColumn.value !== 'expiry_date') {
    await startFetchProduct()
  } else {
    await startFetchProductBatch()
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

const handleSelectStatus = async (value: 'true' | 'false') => {
  await startSearch()
}

const changeSort = async (value: 'expiry_date' | 'id' | 'brand_name' | 'quantity') => {
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

const changePagination = async (options: { page?: number, limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('PRODUCT_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const handleModalProductUpsertSuccess = async (data: Product, type: 'CREATE' | 'UPDATE') => {
  if (type === 'CREATE') {
    productStore.createOne(data)
  } else if (type === 'UPDATE') {
    const { productBatches, ...productSnap } = data
    productStore.updateOne(data.id, productSnap)
    productBatchStore.updateProduct(data)
  }
  await startFetchData()
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalScreenProductList.value?.openModal()
  }
  if (menu.key === 'data-setting') {
    modalDataProduct.value?.openModal()
  }
}

</script>

<template>
  <ModalProductUpsert ref="modalProductUpsert" @success="handleModalProductUpsertSuccess" />
  <ModalScreenProductList ref="modalScreenProductList" />
  <ModalDataProduct ref="modalDataProduct" />
  <ModalProductDetail ref="modalProductDetail" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <ShopOutlined /> Danh sách hàng hóa
      </div>
      <a-button type="primary" @click="modalProductUpsert?.openModal()">
        <template #icon>
          <PlusOutlined />
        </template>
        Thêm hàng hóa
      </a-button>
    </div>
    <div class="page-header-setting">
      <a-dropdown trigger="click">
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
      <div style="flex: 2; flex-basis: 500px;">
        <div>Tìm kiếm</div>
        <!-- <span class="ant-input-affix-wrapper">
          <input :value="searchText" @input="handleInputSearchText" allow-clear enter-button class="ant-input w-full"
            placeholder="Tìm kiếm bằng tên hoặc hoạt chất" />
        </span> -->
        <a-input-search :value="searchText" @input="handleInputSearchText" allow-clear enter-button
          placeholder="Tìm kiếm bằng tên hoặc hoạt chất" @search="startSearch" style="width: 100%" />
      </div>

      <div style="flex: 1; flex-basis: 250px;">
        <div>Chọn nhóm thuốc</div>
        <a-select v-model:value="group" allow-clear @change="handleSelectGroup" class="w-full" placeholder="Tất cả">
          <a-select-option value="">Tất cả</a-select-option>
          <a-select-option v-for="(text, value) in organizationStore.PRODUCT_GROUP" :key="value" :value="value">
            {{ text }}
          </a-select-option>
        </a-select>
      </div>

      <div style="flex: 1; flex-basis: 250px;">
        <div>Chọn trạng thái</div>
        <a-select v-model:value="isActive" allow-clear @change="handleSelectStatus" class="w-full" placeholder="Tất cả">
          <a-select-option value="">Tất cả</a-select-option>
          <a-select-option value="true">Active</a-select-option>
          <a-select-option value="false">Inactive</a-select-option>
        </a-select>
      </div>
    </div>
    <div v-if="isMobile" class="page-main-list">
      <div class="py-2 px-4 flex justify-between text-white font-bold"
        style="background-color: var(--color-table-thead-bg);">
        <div class="cursor-pointer" @click="changeSort('brand_name')">
          Tên hàng &nbsp;
          <font-awesome-icon v-if="sortColumn !== 'brand_name'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
          <font-awesome-icon v-if="sortColumn === 'brand_name' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
          <font-awesome-icon v-if="sortColumn === 'brand_name' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
        </div>
        <div class="cursor-pointer" @click="changeSort('quantity')">
          Số lượng &nbsp;
          <font-awesome-icon v-if="sortColumn !== 'quantity'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
          <font-awesome-icon v-if="sortColumn === 'quantity' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
          <font-awesome-icon v-if="sortColumn === 'quantity' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
        </div>
      </div>
      <div v-if="sortColumn !== 'expiry_date'">
        <div v-if="productList.length === 0" class="p-2 text-center" style="border: 1px solid #cdcdcd;">
          Không có dữ liệu
        </div>
        <div class="px-4 py-2" style="border-bottom: 1px solid #cdcdcd;" v-for="(product, index) in productList"
          :key="index" @dblclick="modalProductUpsert?.openModal(product)"
          :style="{ backgroundColor: index % 2 !== 0 ? 'var(--color-table-td-even-bg)' : '' }">
          <div class="flex items-center">
            <div class="flex-1">
              <div class="flex gap-2">
                <div class="font-medium text-justify">{{ product.brandName }}</div>
                <div v-if="organizationStore.SCREEN_PRODUCT_LIST.table.detail">
                  <a @click="modalProductDetail?.openModal(product)">
                    <FileSearchOutlined />
                  </a>
                </div>
              </div>
              <div v-if="organizationStore.SCREEN_PRODUCT_LIST.table.substance" class="text-xs">
                {{ product.substance }}
              </div>
              <div v-if="organizationStore.SCREEN_PRODUCT_LIST.table.group" class="text-xs">
                {{ organizationStore.PRODUCT_GROUP[product.group!] }}
              </div>
            </div>
            <div class="text-lg">
              {{ product.quantity }}
            </div>
            <div v-if="organizationStore.SCREEN_PRODUCT_LIST.table.unit" style="flex-basis: 30px;"
              class="flex justify-end">
              <span class="ml-1 text-xs text-right"> {{ product.unit?.[0]?.name }} </span>
            </div>
          </div>
          <div v-if="product.productBatches.length > 0 && organizationStore.SCREEN_PRODUCT_LIST.table.batch">
            <div v-for="(avail, y) in product.productBatches" :key="y">
              <div class="flex justify-between text-xs">
                <div v-if="organizationStore.SCREEN_PRODUCT_LIST.table.expiryDate" style="width: 35%;">
                  HSD: {{ timeToText(avail.expiryDate, 'DD/MM/YYYY') }}
                  <span v-if="product.productBatches.length > 1">({{ avail.quantity }})</span>
                </div>
                <div v-if="organizationStore.SCREEN_PRODUCT_LIST.table.costPrice" style="width: 20%;">
                  N: {{ formatMoney(avail.costPrice) }}
                </div>
                <div v-if="organizationStore.SCREEN_PRODUCT_LIST.table.wholesalePrice" style="width: 20%;">
                  S: {{ formatMoney(avail.wholesalePrice) }}
                </div>
                <div v-if="organizationStore.SCREEN_PRODUCT_LIST.table.retailPrice" style="width: 20%;">
                  L: {{ formatMoney(avail.retailPrice) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 float-right mb-2">
        <a-pagination size="small" v-model:current="page" v-model:pageSize="limit" :total="total" show-size-changer
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
      </div>
    </div>
    <div v-else class="page-main-table table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">Mã HH &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'id'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'id' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th class="cursor-pointer" @click="changeSort('brand_name')">Tên &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'brand_name'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'brand_name' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'brand_name' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="organizationStore.SCREEN_PRODUCT_LIST.table.group">Nhóm</th>
            <th v-if="organizationStore.SCREEN_PRODUCT_LIST.table.unit">Đ.Vị</th>
            <th v-if="organizationStore.SCREEN_PRODUCT_LIST.table.batch">Lô</th>
            <th class="cursor-pointer" @click="changeSort('quantity')">
              SL &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'quantity'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'quantity' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'quantity' && sortValue === 'DESC'" :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="organizationStore.SCREEN_PRODUCT_LIST.table.expiryDate" class="cursor-pointer"
              @click="changeSort('expiry_date')">
              HSD &nbsp;
              <font-awesome-icon v-if="sortColumn !== 'expiry_date'" :icon="['fas', 'sort']" style="opacity: 0.4;" />
              <font-awesome-icon v-if="sortColumn === 'expiry_date' && sortValue === 'ASC'" :icon="['fas', 'sort-up']" />
              <font-awesome-icon v-if="sortColumn === 'expiry_date' && sortValue === 'DESC'"
                :icon="['fas', 'sort-down']" />
            </th>
            <th v-if="organizationStore.SCREEN_PRODUCT_LIST.table.costPrice">G.Nhập</th>
            <th v-if="organizationStore.SCREEN_PRODUCT_LIST.table.wholesalePrice">G.Sỉ</th>
            <th v-if="organizationStore.SCREEN_PRODUCT_LIST.table.retailPrice">G.Lẻ</th>
            <th v-if="organizationStore.SCREEN_PRODUCT_LIST.table.isActive">Trạng thái</th>
            <th v-if="organizationStore.SCREEN_PRODUCT_LIST.table.action">Sửa</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="sortColumn !== 'expiry_date'">
            <tr v-if="productList.length === 0">
              <td colspan="20" class="text-center">Không có dữ liệu</td>
            </tr>
            <template v-for="(product, index) in productList" :key="index">
              <tr>
                <td :rowspan="product.productBatches.length || 1" class="text-center">PR{{ product.id }}</td>
                <td :rowspan="product.productBatches.length || 1">
                  <div>
                    {{ product.brandName }}
                    <a v-if="organizationStore.SCREEN_PRODUCT_LIST.table.detail" class="ml-1"
                      @click="modalProductDetail?.openModal(product)">
                      <FileSearchOutlined />
                    </a>
                  </div>
                  <div v-if="organizationStore.SCREEN_PRODUCT_LIST.table.substance" style="font-size: 0.8rem;">
                    {{ product.substance }}
                  </div>
                </td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.group" :rowspan="product.productBatches.length || 1"
                  class="text-center">
                  {{ organizationStore.PRODUCT_GROUP[product.group!] }}
                </td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.unit" :rowspan="product.productBatches.length || 1"
                  class="text-center">
                  {{ product.unit[0].name }}
                </td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.batch" class="text-center">
                  {{ product.productBatches[0]?.batch || '' }}
                </td>
                <td class="text-right">{{ product.productBatches[0]?.quantity || 0 }}</td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.expiryDate" class="text-center">
                  {{ timeToText(product.productBatches[0]?.expiryDate, 'DD/MM/YYYY') }}
                </td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.costPrice" class="text-right">
                  {{ formatMoney(product.productBatches[0]?.costPrice) }}
                </td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.wholesalePrice" class="text-right">
                  {{ formatMoney(product.productBatches[0]?.wholesalePrice) }}
                </td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.retailPrice" class="text-right">
                  {{ formatMoney(product.productBatches[0]?.retailPrice) }}
                </td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.isActive"
                  :rowspan="product.productBatches.length || 1" class="text-center">
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
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.action"
                  :rowspan="product.productBatches.length || 1" class="text-center">
                  <a style="color: #eca52b;" class="text-xl" @click="modalProductUpsert?.openModal(product)">
                    <FormOutlined />
                  </a>
                </td>
              </tr>

              <tr v-for="(avail, i) in product.productBatches.slice(1)" :key="i">
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.batch" class="text-center">{{ avail.batch }}</td>
                <td class="text-right">{{ avail.quantity }}</td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.expiryDate" class="text-center">
                  <span v-if="avail.expiryDate && avail.expiryDate < Date.now()"
                    style="color:#ff4d4f; font-weight: bold;">
                    {{ timeToText(avail.expiryDate, 'DD/MM/YYYY') }}
                  </span>
                  <span v-else-if="avail.expiryDate && avail.expiryDate < Date.now() + 6 * 30 * 24 * 60 * 60 * 1000"
                    style="color:orange; font-weight: bold;">
                    {{ timeToText(avail.expiryDate, 'DD/MM/YYYY') }}
                  </span>
                  <span v-else>
                    {{ timeToText(avail.expiryDate, 'DD/MM/YYYY') }}
                  </span>
                </td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.costPrice" class="text-right">
                  {{ formatMoney(avail.costPrice) }}
                </td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.wholesalePrice" class="text-right">
                  {{ formatMoney(avail.wholesalePrice) }}
                </td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.retailPrice" class="text-right">
                  {{ formatMoney(avail.retailPrice) }}
                </td>
              </tr>
            </template>
          </template>

          <template v-if="sortColumn === 'expiry_date'">
            <tr v-if="productBatchList.length === 0">
              <td colspan="20" class="text-center">Không có dữ liệu</td>
            </tr>
            <tr v-for="(batch, index) in productBatchList" :key="index">
              <td class="text-center">PB{{ batch.id }}</td>
              <td>
                <div class="flex justify-between">
                  <div style="font-weight: 500;">{{ batch.product?.brandName }}</div>
                  <div v-if="organizationStore.SCREEN_PRODUCT_LIST.table.detail">
                    <a class="text-xl" @click="modalProductDetail?.openModal(batch.product!)">
                      <FileSearchOutlined />
                    </a>
                  </div>
                </div>
                <div v-if="organizationStore.SCREEN_PRODUCT_LIST.table.substance">
                  {{ batch.product?.substance }}
                </div>
              </td>

              <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.group" class="text-center">
                {{ organizationStore.PRODUCT_GROUP[batch.product!.group!] }}
              </td>
              <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.unit" class="text-center">
                {{ batch.product!.unit[0].name }}
              </td>
              <td class="text-center">
                {{ batch!.quantity }}
              </td>
              <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.batch" class="text-center">
                {{ batch.batch }}
              </td>
              <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.expiryDate" class="text-right">
                <span v-if="batch.expiryDate && batch.expiryDate < Date.now()" style="color:#ff4d4f; font-weight: 500;">
                  {{ timeToText(batch.expiryDate, 'DD/MM/YYYY') }} ({{ batch.quantity }})
                </span>
                <span v-else-if="batch.expiryDate && batch.expiryDate < Date.now() + 6 * 30 * 24 * 60 * 60 * 1000"
                  style="color:orange">
                  {{ timeToText(batch.expiryDate, 'DD/MM/YYYY') }}
                </span>
                <span v-else>
                  {{ timeToText(batch.expiryDate, 'DD/MM/YYYY') }}
                </span>
              </td>
              <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.costPrice" class="text-right">
                {{ formatMoney(batch.costPrice) }}
              </td>
              <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.wholesalePrice" class="text-right">
                {{ formatMoney(batch.wholesalePrice) }}
              </td>
              <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.retailPrice" class="text-right">
                {{ formatMoney(batch.retailPrice) }}
              </td>
              <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.isActive" class="text-center">
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
              <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.action" class="text-center">
                <a style="color: #eca52b;" class="text-xl" @click="modalProductUpsert?.openModal(batch.product)">
                  <FormOutlined />
                </a>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <div class="mt-4 float-right mb-2">
        <a-pagination v-model:current="page" v-model:pageSize="limit" :total="total" show-size-changer
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
      </div>
    </div>
  </div>
</template>
