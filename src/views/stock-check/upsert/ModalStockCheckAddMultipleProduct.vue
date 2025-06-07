<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import { VueButton, VuePagination } from '../../../common'
import { IconClose } from '../../../common/icon-antd'
import { IconSortChange } from '../../../common/icon-font-awesome'
import { InputSelect, InputText, VueSelect } from '../../../common/vue-form'
import { VueModal } from '../../../common/vue-modal'
import { Batch, BatchService } from '../../../modules/batch'
import { Product, ProductService } from '../../../modules/product'
import { ProductGroup, ProductGroupService } from '../../../modules/product-group'
import { StockCheckItem } from '../../../modules/stock-check-item'
import { Warehouse } from '../../../modules/warehouse'
import { WarehouseService } from '../../../modules/warehouse/warehouse.service'
import { ESArray, arrayToKeyValue } from '../../../utils'

const emit = defineEmits<{ (e: 'success', data: { stockCheckItemList: StockCheckItem[] }): void }>()

const productList = ref<Product[]>([])
const productGroupMap = ref<Record<string, ProductGroup>>({})

const productGroupOptions = ref<{ value: number; text: string; data: ProductGroup }[]>([])
const warehouseOptions = ref<{ value: number; text: string; data: Warehouse }[]>([])

const searchText = ref('')
const productGroupId = ref(0)
const warehouseId = ref(0)

const checkedAll = ref(false)
const indeterminate = ref<boolean>(false)
const productMapSelect = ref<Record<string, Product | false>>({})

const showModal = ref(false)
const saveLoading = ref(false)

const sortColumn = ref<'quantity' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const selectedLength = computed(() => {
  return Object.values(productMapSelect.value).filter((i) => !!i).length
})

watchEffect(() => {
  let hasCheckedAll = true
  let noCheckedAll = true
  productList.value.forEach((i) => {
    if (!productMapSelect.value[i.id]) {
      hasCheckedAll = false
    }
    if (productMapSelect.value[i.id]) {
      noCheckedAll = false
    }
  })

  if (hasCheckedAll) {
    checkedAll.value = true
    indeterminate.value = false
  } else if (noCheckedAll) {
    checkedAll.value = false
    indeterminate.value = false
  } else {
    checkedAll.value = false
    indeterminate.value = true
  }
})

const startFetchProduct = async () => {
  const productPagination = await ProductService.pagination({
    relation: {},
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
      isActive: 1,
      $OR: searchText.value
        ? [
            { productCode: { LIKE: searchText.value } },
            { brandName: { LIKE: searchText.value } },
            { substance: { LIKE: searchText.value } },
          ]
        : undefined,
    },
    sort: sortValue.value
      ? {
          quantity: sortColumn.value === 'quantity' ? sortValue.value : undefined,
        }
      : { id: 'DESC' },
  })
  productList.value = productPagination.productList
  total.value = productPagination.total
}

const startSearch = async () => {
  page.value = 1
  startFetchProduct()
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit
  startFetchProduct()
}

const changeSort = async (value: 'quantity') => {
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
  await startFetchProduct()
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
    console.log('🚀 ~ ModalStockCheckAddMultipleProduct.vue:140  ~ error:', error)
  }
}

const startFetchWarehouse = async () => {
  try {
    const warehouseAll = await WarehouseService.list({ sort: { id: 'ASC' } })
    warehouseOptions.value = [
      { value: 0, text: 'Tất cả', data: Warehouse.blank() },
      ...warehouseAll.map((i) => ({ value: i.id, text: i.name, data: i })),
    ]
  } catch (error) {
    console.log('🚀 ~ ModalStockCheckAddMultipleProduct.vue:152 ~ error:', error)
  }
}

const openModal = async () => {
  showModal.value = true
  await Promise.all([startFetchWarehouse(), startFetchProductGroup(), startFetchProduct()])
}

const closeModal = () => {
  showModal.value = false
  productMapSelect.value = {}
}

const handleChangeInput = (e: Event, product: Product) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    productMapSelect.value[product.id] = product
  } else {
    productMapSelect.value[product.id] = false
  }
}

const handleChangeCheckedAll = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    checkedAll.value = true
    productList.value.forEach((product) => {
      productMapSelect.value[product.id] = product
    })
  } else {
    checkedAll.value = false
    productList.value.forEach((i) => {
      productMapSelect.value[i.id] = false
    })
  }
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const productIdList = Object.entries(productMapSelect.value)
      .filter(([key, value]) => !!value)
      .map(([key, value]) => Number(key))
    const batchList = await BatchService.list({
      filter: { productId: { IN: productIdList }, quantity: { NOT: 0 } },
      sort: { productId: 'ASC' },
    })
    const batchMap = ESArray.arrayToKeyValue(batchList, 'id')

    const stockCheckItemList = batchList.map((batch) => {
      const scItem = StockCheckItem.blank()
      scItem.batchId = batch.id
      scItem.productId = batch.productId
      scItem.systemQuantity = batch.quantity
      scItem.actualQuantity = batch.quantity
      scItem.product = Product.from(productMapSelect.value[batch.productId] as Product)
      scItem.batch = Batch.from(batch)
      return scItem
    })
    emit('success', { stockCheckItemList })
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalCopyProductSystem.vue:124 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 100px; width: 1200px">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Danh sách sản phẩm</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 pb-4 mt-4 modal-data-product-tabs">
        <div class="mt-4 flex flex-wrap gap-4">
          <div style="flex: 2; flex-basis: 400px">
            <div>Lọc theo mã, tên hoặc hoạt chất</div>
            <div>
              <InputText v-model:value="searchText" @update:value="startSearch" />
            </div>
          </div>
          <div style="flex: 1; flex-basis: 200px">
            <div>Lọc theo nhóm</div>
            <div>
              <VueSelect
                v-model:value="productGroupId"
                :options="productGroupOptions"
                @update:value="startSearch"
              />
            </div>
          </div>
          <div style="flex: 1; flex-basis: 200px">
            <div>Lọc theo kho</div>
            <div>
              <VueSelect
                v-model:value="warehouseId"
                :options="warehouseOptions"
                @update:value="startSearch"
              />
            </div>
          </div>
        </div>

        <div class="mt-4 table-wrapper">
          <table>
            <thead>
              <tr>
                <th style="width: 100px">
                  <input
                    style="cursor: pointer"
                    :checked="checkedAll"
                    :indeterminate="indeterminate"
                    type="checkbox"
                    @change="(e) => handleChangeCheckedAll(e)"
                  />
                </th>
                <th>Mã SP</th>
                <th>Tên SP</th>
                <th>Nhóm</th>
                <th class="cursor-pointer" @click="changeSort('quantity')">
                  <div class="flex items-center justify-center">
                    SL &nbsp;
                    <IconSortChange :sort="sortColumn === 'quantity' ? sortValue : ''" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="productList.length === 0">
                <td colspan="20" class="text-center">Không có dữ liệu</td>
              </tr>
              <tr v-for="product in productList" :key="product.id">
                <td class="text-center">
                  <input
                    style="cursor: pointer"
                    :checked="!!productMapSelect[product.id]"
                    type="checkbox"
                    @change="(e) => handleChangeInput(e, product)"
                  />
                </td>
                <td class="text-center">{{ product.productCode }}</td>
                <td>{{ product.brandName }}</td>
                <td>{{ productGroupMap[product.productGroupId]?.name }}</td>
                <td class="text-center">{{ product.quantity }}</td>
              </tr>
            </tbody>
          </table>
          <div class="mt-4 flex gap-4 justify-between mb-2">
            <div>
              Đã chọn
              <span class="font-bold">{{ selectedLength }}</span>
              sản phẩm
            </div>
            <VuePagination
              v-model:page="page"
              :total="total"
              :limit="limit"
              @update:page="(p: number) => changePagination({ page: p, limit })"
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
      </div>

      <div class="p-4 mt-2 flex justify-center gap-4">
        <VueButton icon="close" @click="closeModal">Hủy bỏ</VueButton>
        <VueButton icon="save" color="blue" :loading="saveLoading" @click="handleSave">
          Thêm vào phiếu
        </VueButton>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
