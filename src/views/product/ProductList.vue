<script setup lang="ts">
import { ProductBatch, ProductBatchService, ProductService, type Product } from '@/modules/product'
import { useOrganizationStore } from '@/store/organization.store'
import { convertViToEn, formatNumber, timeToText } from '@/utils'
import {
  CheckCircleOutlined, FileSearchOutlined, FormOutlined,
  MinusCircleOutlined, PlusOutlined, SettingOutlined, ShopOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import ModalDataProduct from './components/ModalDataProduct.vue'
import ModalProductUpsert from './components/ModalProductUpsert.vue'
import ModalScreenProductList from './components/ModalScreenProductList.vue'
import ModalProductDetails from './details/ModalProductDetails.vue'

const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const modalScreenProductList = ref<InstanceType<typeof ModalScreenProductList>>()
const modalDataProduct = ref<InstanceType<typeof ModalDataProduct>>()
const modalProductDetails = ref<InstanceType<typeof ModalProductDetails>>()

const organizationStore = useOrganizationStore()
const productList = ref<Product[]>([])
const productBatchList = ref<ProductBatch[]>([])

const loadingComponent = ref(false)

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const searchText = ref('')
const sortColumn = ref<'expiry_date' | 'id' | 'brand_name' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const isActive = ref<'true' | 'false' | ''>('true')
const group = ref<string>('')

const startFetchProduct = async () => {
  try {
    let sort
    if (sortColumn.value !== 'expiry_date' && sortValue.value) {
      sort = { [sortColumn.value]: sortValue.value }
    }
    const data = await ProductService.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        group: group.value ? group.value : undefined,
        quantity_zero: 'true',
        is_active: isActive.value ? isActive.value : undefined,
        search_text: searchText.value ? convertViToEn(searchText.value) : undefined,
        overdue: 'true',
      },
      relations: { product_batches: true },
      sort,
    })
    productList.value = data.data
    total.value = data.total
  } catch (error) {
    console.log('🚀 ~ file: ProductList.vue:59 ~ error:', error)
  }
}

const startFetchProductBatch = async () => {
  try {
    let sort
    if (sortColumn.value === 'expiry_date' && sortValue.value) {
      sort = { expiry_date: sortValue.value }
    }
    const data = await ProductBatchService.pagination({
      page: page.value,
      limit: limit.value,
      relations: { product: true },
      sort,
    })
    group.value = ''
    searchText.value = ''
    productBatchList.value = data.data
    total.value = data.total
  } catch (error) {
    console.log('🚀 ~ file: ProductList.vue:77 ~ error:', error)
  }
}

onBeforeMount(async () => {
  await startFetchProduct()
})

const startSearch = async () => {
  page.value = 1
  await startFetchProduct()
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

const changeSort = async (value: 'expiry_date' | 'id' | 'brand_name') => {
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
  if (sortColumn.value !== 'expiry_date') await startFetchProduct()
  else await startFetchProductBatch()
}

const changePagination = async (options: { page?: number, limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit
  if (sortColumn.value !== 'expiry_date') await startFetchProduct()
  else await startFetchProductBatch()
}

const handleModalProductUpsertSuccess = async (data: Product, type: 'CREATE' | 'UPDATE') => {
  if (type === 'CREATE') {
    productList.value.unshift(data)
  }
  else if (type === 'UPDATE') {
    const indexProduct = productList.value.findIndex((i) => i.id === data.id)
    if (indexProduct !== -1) {
      productList.value[indexProduct] = data
    }

    const indexBatch = productBatchList.value.findIndex((i) => i.productId === data.id)
    if (indexBatch !== -1) {
      productBatchList.value[indexBatch].product = data
    }
  }
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
  <ModalProductDetails ref="modalProductDetails" />
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="flex justify-between items-center font-medium" style="font-size: 1.3rem;">
        <ShopOutlined style="margin-right: 1rem" />Danh sách hàng hóa
        <a-button type="primary" @click="modalProductUpsert?.openModal()" class="ml-4">
          <template #icon>
            <PlusOutlined />
          </template>
          Thêm hàng hóa
        </a-button>
      </div>
      <div>
        <a-dropdown trigger="click">
          <span style="font-size: 1.1rem; cursor: pointer;">
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
  </div>

  <div class="mx-4 mt-4 p-4 bg-white">
    <div class="flex flex-wrap gap-4">
      <div style="flex: 2; flex-basis: 500px;">
        <div>Tìm kiếm</div>
        <!-- <span class="ant-input-affix-wrapper">
          <input :value="searchText" @input="handleInputSearchText" allow-clear enter-button class="ant-input w-full"
            placeholder="Tìm kiếm bằng tên hoặc hoạt chất" />
        </span> -->
        <a-input-search v-model:value="searchText" allow-clear enter-button
          placeholder="Tìm kiếm bằng tên hoặc hoạt chất. Ấn Enter để tìm kiếm" @search="startSearch"
          style="width: 100%" />
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
    <div class="table-wrapper mt-4 w-full">
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
            <th>Số lượng</th>
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
              <td colspan="20" class="text-center">No data</td>
            </tr>
            <template v-for="(product, index) in productList" :key="index">
              <tr>
                <td :rowspan="product.productBatches.length || 1" class="text-center">PR{{ product.id }}</td>
                <td :rowspan="product.productBatches.length || 1">
                  <div class="flex justify-between">
                    <div style="font-weight: 500;">{{ product.brandName }}</div>
                    <div v-if="organizationStore.SCREEN_PRODUCT_LIST.table.detail">
                      <a class="text-xl" @click="modalProductDetails?.openModal(product)">
                        <FileSearchOutlined />
                      </a>
                    </div>
                  </div>
                  <div v-if="organizationStore.SCREEN_PRODUCT_LIST.table.substance">
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
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.batch" class="text-center">{{
                  product.productBatches[0]?.batch || '' }}</td>
                <td class="text-right">{{ product.productBatches[0]?.quantity || 0 }}</td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.expiryDate" class="text-center">
                  {{ timeToText(product.productBatches[0]?.expiryDate, 'DD/MM/YYYY') }}
                </td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.costPrice" class="text-right">
                  {{ formatNumber(product.productBatches[0]?.costPrice) }}
                </td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.wholesalePrice" class="text-right">
                  {{ formatNumber(product.productBatches[0]?.wholesalePrice) }}
                </td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.retailPrice" class="text-right">
                  {{ formatNumber(product.productBatches[0]?.retailPrice) }}
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
                  {{ formatNumber(avail.costPrice) }}
                </td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.wholesalePrice" class="text-right">
                  {{ formatNumber(avail.wholesalePrice) }}
                </td>
                <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.retailPrice" class="text-right">
                  {{ formatNumber(avail.retailPrice) }}
                </td>
              </tr>
            </template>
          </template>
          <template v-if="sortColumn === 'expiry_date'">
            <tr v-if="productBatchList.length === 0">
              <td colspan="20" class="text-center">No data</td>
            </tr>
            <tr v-for="(batch, index) in productBatchList" :key="index">
              <td class="text-center">PB{{ batch.id }}</td>
              <td>
                <div class="flex justify-between">
                  <div style="font-weight: 500;">{{ batch.product?.brandName }}</div>
                  <div v-if="organizationStore.SCREEN_PRODUCT_LIST.table.detail">
                    <a class="text-xl" @click="modalProductDetails?.openModal(batch.product!)">
                      <FileSearchOutlined />
                    </a>
                  </div>
                </div>
                <div v-if="organizationStore.SCREEN_PRODUCT_LIST.table.substance">
                  {{ batch.product!.substance }}
                </div>
              </td>
              <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.group" class="text-center">
                {{ organizationStore.PRODUCT_GROUP[batch.product!.group!] }}
              </td>
              <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.unit" class="text-center">
                {{ batch.product!.unit }}
              </td>
              <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.batch" class="text-center">
                {{ batch.batch }}
              </td>
              <td class="text-right">{{ batch.quantity }}</td>
              <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.expiryDate" class="text-right">
                <span v-if="batch.expiryDate && batch.expiryDate < Date.now()" style="color:#ff4d4f; font-weight: 500;">
                  {{ timeToText(batch.expiryDate, 'DD/MM/YYYY') }}
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
                {{ formatNumber(batch.costPrice) }}
              </td>
              <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.wholesalePrice" class="text-right">
                {{ formatNumber(batch.wholesalePrice) }}
              </td>
              <td v-if="organizationStore.SCREEN_PRODUCT_LIST.table.retailPrice" class="text-right">
                {{ formatNumber(batch.retailPrice) }}
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
        <a-pagination v-model:current="page" v-model:pageSize="limit" :total="total"
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })" />
      </div>
    </div>
  </div>
</template>
