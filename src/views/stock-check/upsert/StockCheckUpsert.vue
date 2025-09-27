<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconDelete, IconFileSearch, IconQuestionCircle, IconRight } from '@/common/icon-antd'
import { IconMinus, IconPlus, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import VueTooltip from '@/common/popover/VueTooltip.vue'
import { AlertStore } from '@/common/vue-alert'
import { InputDate, InputNumber, InputOptions, InputText, VueSelect } from '@/common/vue-form'
import InputHint from '@/common/vue-form/InputHint.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Batch, BatchService } from '@/modules/batch'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Product, ProductService } from '@/modules/product'
import { StockCheck, StockCheckApi } from '@/modules/stock-check'
import { StockCheckItem } from '@/modules/stock-check-item'
import { User } from '@/modules/user'
import { ESString, ESTimer } from '@/utils'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumb from '../../component/Breadcrumb.vue'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import ModalProductUpsert from '../../product/upsert/ModalProductUpsert.vue'
import ModalStockCheckAddMultipleProduct from './ModalStockCheckAddMultipleProduct.vue'

const modalStockCheckAddMultipleProduct =
  ref<InstanceType<typeof ModalStockCheckAddMultipleProduct>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const inputOptionsProduct = ref<InstanceType<typeof InputOptions>>()

const router = useRouter()
const route = useRoute()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, user } = MeService

const stockCheck = ref(StockCheck.blank())
const stockCheckItem = ref(StockCheckItem.blank())

const productOptions = ref<{ value: number; text: string; data: Product }[]>([])
const batchOptions = ref<{ value: number; text?: string; data: Batch; disabled?: boolean }[]>([])

const saveLoading = ref(false)

onMounted(async () => {
  const stockCheckId = route.params.id as string
  if (!stockCheckId) {
    stockCheck.value.createdAt = Date.now()
  } else {
    stockCheck.value = await StockCheckApi.detail(stockCheckId, {
      relation: { stockCheckItemList: { batch: true, product: true } },
    })
  }
  stockCheck.value.createdByUserId = user.value?.id || 0
  stockCheck.value.createdByUser = User.from(user.value || User.blank())
})

const searchingProduct = async (text: string) => {
  stockCheckItem.value = StockCheckItem.blank()
  if (!text) {
    productOptions.value = []
  } else {
    const productList = await ProductService.search(text)
    productOptions.value = productList.map((i) => {
      return { value: i.id, text: i.brandName, data: i }
    })
  }
}

const selectProduct = async (productData?: Product) => {
  if (productData) {
    if (productData.warehouseIds === '[]') {
      return ModalStore.alert({
        title: 'Không thể kiểm kê cho sản phẩm này',
        content: ['Sản phẩm này đang ở chế độ không quản lý số lượng tồn kho'],
      })
    }

    stockCheckItem.value.product = Product.from(productData)
    stockCheckItem.value.productId = productData.id
    stockCheckItem.value.batchId = 0

    const batchListData = await BatchService.list({
      filter: {
        productId: productData.id,
      },
      sort: { id: 'DESC' },
    })
    const productClone = Product.from(productData)
    batchListData.forEach((i) => (i.product = productClone))

    batchOptions.value = batchListData.map((i) => {
      return { value: i.id, data: i }
    })
    selectBatch(batchListData[0])

    // productOptions.value = []
  } else {
    clearSelectProduct()
  }
}

const selectBatch = (batchData?: Batch) => {
  if (!batchData) return
  stockCheckItem.value.batchId = batchData.id
  stockCheckItem.value.batch = Batch.from(batchData)

  stockCheckItem.value.systemQuantity = batchData.quantity
  stockCheckItem.value.systemCostAmount = batchData.costAmount
  if (batchData.quantity >= 0) {
    stockCheckItem.value.actualQuantity = batchData.quantity
    stockCheckItem.value.actualCostAmount = batchData.costAmount
  }
}

const clearSelectProduct = () => {
  stockCheckItem.value = StockCheckItem.blank()
  batchOptions.value = []
  productOptions.value = []
  inputOptionsProduct.value?.clear()
}

const handleModalUpsertProductSuccess = (
  productSuccess: Product,
  type: 'CREATE' | 'UPDATE' | 'DESTROY',
) => {
  if (type === 'CREATE') {
    inputOptionsProduct.value?.setItem({
      text: productSuccess?.brandName,
      data: productSuccess,
      value: productSuccess?.id,
    })
    selectProduct(productSuccess)
  }
  if (type === 'UPDATE') {
    inputOptionsProduct.value?.setItem({
      text: productSuccess?.brandName,
      data: productSuccess,
      value: productSuccess?.id,
    })
    stockCheckItem.value.product = Product.from(productSuccess)
  }
  if (type === 'DESTROY') {
    clearSelectProduct()
  }
}

const submitAddStockCheckItem = () => {
  const hasAdd = addStockCheckItem(StockCheckItem.from(stockCheckItem.value))
  if (hasAdd) {
    clearSelectProduct()
  }
}

const changeItemPosition = (index: number, count: number) => {
  const temp = stockCheck.value.stockCheckItemList![index]
  stockCheck.value.stockCheckItemList![index] = stockCheck.value.stockCheckItemList![index + count]
  stockCheck.value.stockCheckItemList![index + count] = temp
}

const handleModalStockCheckAddMultipleProductSuccess = (data: {
  stockCheckItemList: StockCheckItem[]
}) => {
  data.stockCheckItemList.forEach((i) => {
    addStockCheckItem(i)
  })
}

const sumCostAmountDifferent = computed(() => {
  return stockCheck.value.stockCheckItemList.reduce((acc, cur) => {
    return acc + cur.actualCostAmount - cur.systemCostAmount
  }, 0)
})

const addStockCheckItem = (scItem: StockCheckItem) => {
  const findExits = stockCheck.value.stockCheckItemList.find((i) => {
    return i.batchId === scItem.batchId
  })
  if (findExits) {
    AlertStore.addWarning(`Đã tồn tại sản phẩm ${scItem.product?.brandName} trong danh sách`, 3000)
  } else {
    stockCheck.value.stockCheckItemList!.push(scItem)
    return true
  }
}

const handleChangeActualQuantity = (index: number, actualQuantity: number) => {
  const scItem = stockCheck.value.stockCheckItemList![index]
  scItem.actualQuantity = actualQuantity
  if (scItem.systemQuantity === 0) {
    scItem.actualCostAmount = scItem.actualQuantity * (scItem.batch?.costPrice || 0)
  } else {
    scItem.actualCostAmount = Math.round(
      (scItem.systemCostAmount * scItem.actualQuantity) / scItem.systemQuantity,
    )
  }
}

const saveStockCheck = async () => {
  if (stockCheck.value.stockCheckItemList!.length == 0) {
    return AlertStore.addError('Lỗi: cần có ít nhất 1 sản phẩm trong phiếu')
  }
  try {
    saveLoading.value = true
    const response = await StockCheckApi.upsertDraft(stockCheck.value)
    router.push({ name: 'StockCheckDetail', params: { id: response.stockCheck.id } })
  } catch (error: any) {
    AlertStore.addError(error.message)
  } finally {
    saveLoading.value = false
  }
}

const handleFocusFirstSearchProduct = async () => {
  await Promise.all([ProductService.refreshDB(), BatchService.refreshDB()])
}
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProductUpsert ref="modalProductUpsert" @success="handleModalUpsertProductSuccess" />
  <ModalStockCheckAddMultipleProduct
    ref="modalStockCheckAddMultipleProduct"
    @success="handleModalStockCheckAddMultipleProductSuccess"
  />
  <div class="mx-4 mt-4 gap-2 flex items-center justify-between">
    <div class="hidden md:flex gap-2 items-center text-lg font-medium">
      <Breadcrumb />
      <IconRight style="font-size: 0.7em; opacity: 0.5" />
      <span>Tạo phiếu kiểm hàng mới</span>
    </div>
    <div class="mr-2 flex items-center gap-4 flex-wrap"></div>
  </div>

  <div class="flex flex-wrap mt-4 md:mx-4 gap-4 flex-row-reverse">
    <div class="bg-white p-4 flex-1">
      <div>
        <div class="">Thời gian tạo phiếu</div>
        <div>
          <InputDate v-model:value="stockCheck.createdAt" typeParser="number" show-time />
        </div>
      </div>
      <div class="mt-4">
        <div>Nhân viên tạo phiếu</div>
        <div>
          <InputText :value="stockCheck.createdByUser?.fullName" disabled />
        </div>
      </div>
      <div class="mt-4">
        <div>Ghi chú</div>
        <div>
          <InputText v-model:value="stockCheck.note" />
        </div>
      </div>
    </div>

    <div style="" class="flex-2">
      <form class="p-4 bg-white" @submit.prevent="submitAddStockCheckItem">
        <div>
          <div class="flex gap-1 flex-wrap">
            <span>Tên sản phẩm</span>
            <a
              v-if="stockCheckItem.productId"
              @click="modalProductDetail?.openModal(stockCheckItem.product!)"
            >
              <IconFileSearch />
            </a>
            <span
              v-if="stockCheckItem.product?.warehouseIds === '[]'"
              style="font-weight: 500; color: var(--text-red)"
            >
              (Sản phẩm không quản lý tồn kho)
            </span>
            <div v-if="stockCheckItem.productId">
              (
              <span
                v-if="stockCheckItem.product?.warehouseIds !== '[]'"
                :class="
                  (stockCheckItem.product?.quantity || 0) <= 0 ? 'text-red-500 font-bold' : ''
                "
              >
                Tồn:
                <b>{{ stockCheckItem.product?.quantity }}</b>
                <span>&nbsp;{{ stockCheckItem.product?.unitBasicName }}</span>
              </span>
              <span>
                - Giá bán
                <b>{{ formatMoney(stockCheckItem.product!.retailPrice) }}</b>
              </span>
              )
            </div>
            <a
              v-if="userPermission[PermissionId.PRODUCT_UPDATE] && stockCheckItem.productId"
              @click="modalProductUpsert?.openModal(stockCheckItem.productId)"
            >
              Sửa thông tin sản phẩm
            </a>
          </div>
          <div style="height: 40px">
            <InputOptions
              ref="inputOptionsProduct"
              :options="productOptions"
              :max-height="260"
              :prepend="stockCheckItem.product?.productCode || '&nbsp;'"
              placeholder="(F3) Tìm kiếm bằng mã, tên hoặc hoạt chất của sản phẩm"
              required
              @selectItem="({ data }) => selectProduct(data)"
              @onFocusinFirst="handleFocusFirstSearchProduct"
              @searching="searchingProduct"
            >
              <template #option="{ item: { data } }">
                <div>
                  <span>{{ data.productCode }}</span>
                  <span class="mx-1">-</span>
                  <b>{{ data.brandName }}</b>
                  <span class="mx-1">-</span>
                  <span :class="data.unitQuantity <= 0 ? 'text-red-500 font-bold' : ''">
                    {{ data.unitQuantity }} {{ data.unitDefaultName }}
                  </span>
                  <span class="mx-1">-</span>
                  <span>G.Nhập {{ formatMoney(data.costPrice) }}</span>
                  <span class="mx-1">-</span>
                  <span>G.Bán {{ formatMoney(data.retailPrice) }}</span>
                </div>
                <div>{{ data.substance }}</div>
              </template>
            </InputOptions>
          </div>
        </div>

        <div class="mt-4">
          <div>
            Lô hàng
            <span
              v-if="
                stockCheckItem.batch?.expiryDate && stockCheckItem.batch?.expiryDate < Date.now()
              "
              class="text-red-500 font-bold"
            >
              (Hết hạn sử dụng)
            </span>
            <span
              v-if="stockCheckItem.productId && !batchOptions.length"
              class="text-red-500 font-bold"
            >
              (Không có tồn kho)
            </span>
          </div>
          <div>
            <VueSelect
              :value="stockCheckItem.batchId"
              :options="batchOptions"
              :disabled="batchOptions.length == 0"
              @selectItem="({ data }) => selectBatch(data)"
            >
              <template #option="{ item: { data } }">
                <div v-if="!data.id">Chưa chọn lô</div>
                <div v-if="data.id">
                  Lô {{ data.lotNumber }} {{ ESTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }} -
                  Tồn
                  <b>{{ data.quantity }}</b>
                  {{ stockCheckItem.product!.unitBasicName }}
                </div>
              </template>
              <template #text="{ content: { data } }">
                <div v-if="!data?.id">Chưa chọn lô</div>
                <div v-if="data?.id">
                  Lô {{ data.lotNumber }} {{ ESTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }}
                  <span>
                    - Tồn
                    <b>{{ data.quantity }}</b>
                    {{ stockCheckItem.product!.unitBasicName }}
                  </span>
                </div>
              </template>
            </VueSelect>
          </div>
        </div>

        <div class="mt-10 flex justify-center">
          <VueButton type="submit" color="blue" icon="plus" :disabled="!stockCheckItem.batchId">
            Thêm vào danh sách
          </VueButton>
        </div>
      </form>
    </div>
  </div>

  <div class="mt-4 md:mx-4 gap-4">
    <div class="mt-4 bg-white p-4">
      <div class="flex flex-wrap items-baseline justify-between">
        <div>Danh sách sản phẩm</div>
        <div>
          <VueButton
            icon="plus"
            size="small"
            @click="modalStockCheckAddMultipleProduct?.openModal()"
          >
            Thêm danh sách sản phẩm
          </VueButton>
        </div>
      </div>
      <div class="table-wrapper mt-2">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Mã SP</th>
              <th style="min-width: 200px">Tên Sản phẩm</th>
              <th>Đơn vị</th>
              <th>SL tồn</th>
              <th>SL thực tế</th>
              <th>SL lệch</th>
              <th style="min-width: 120px">Ghi chú</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!stockCheck.stockCheckItemList.length">
              <td colspan="100" class="text-center">No data</td>
            </tr>
            <tr v-for="(scItem, index) in stockCheck.stockCheckItemList" :key="index">
              <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
                <div class="flex flex-col items-center">
                  <button
                    type="button"
                    style="
                      border: none;
                      font-size: 1.2rem;
                      line-height: 0.5;
                      background: none;
                      margin-bottom: -0.5rem;
                    "
                    class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                    :disabled="index === 0"
                    @click="changeItemPosition(index, -1)"
                  >
                    <IconSortUp style="opacity: 0.6" />
                  </button>
                  <span>{{ index + 1 }}</span>
                  <button
                    type="button"
                    style="
                      border: none;
                      font-size: 1.2rem;
                      line-height: 0.5;
                      background: none;
                      margin-top: -0.5rem;
                    "
                    class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                    :disabled="index === (stockCheck.stockCheckItemList?.length || 0) - 1"
                    @click="changeItemPosition(index, 1)"
                  >
                    <IconSortDown style="opacity: 0.6" />
                  </button>
                </div>
              </td>
              <td class="text-center whitespace-nowrap">{{ scItem.product?.productCode }}</td>
              <td style="min-width: 150px">
                <div>
                  <div class="font-medium">
                    {{ scItem?.product?.brandName }}
                    <a class="ml-1" @click="modalProductDetail?.openModal(scItem?.product!)">
                      <IconFileSearch />
                    </a>
                  </div>
                  <div style="font-size: 0.8rem">
                    {{ scItem?.product?.substance }}
                  </div>
                  <div style="font-size: 0.8rem" class="flex flex-wrap">
                    <div v-if="scItem.systemQuantity !== scItem.product?.quantity">
                      ID {{ scItem.batchId }} -&nbsp;
                    </div>
                    <div v-if="scItem.batch?.lotNumber">Lô {{ scItem.batch?.lotNumber }}</div>
                    <div v-if="scItem.batch?.expiryDate">
                      - HSD {{ ESTimer.timeToText(scItem.batch?.expiryDate) }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="text-center">{{ scItem.product?.unitBasicName || '' }}</td>
              <td class="text-center">
                <div class="flex flex-wrap items-center gap-2 justify-center">
                  <span>{{ scItem.systemQuantity }}</span>
                  <span v-if="scItem.systemQuantity !== scItem.product?.quantity">
                    / {{ scItem.product?.quantity }}
                  </span>
                  <VueTooltip
                    v-if="scItem.systemQuantity !== scItem.product?.quantity"
                    class="flex"
                  >
                    <template #trigger>
                      <IconQuestionCircle style="font-size: 16px; color: orange" />
                    </template>
                    <div>
                      Sản phẩm này có nhiều lô hàng khác nhau, với tổng số lượng là:
                      {{ scItem.product?.quantity }}
                    </div>
                    <div>Lô hàng này có số lượng là: {{ scItem.systemQuantity }}</div>
                  </VueTooltip>
                </div>
              </td>
              <td style="width: 150px">
                <div class="flex items-center justify-between">
                  <button
                    style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                    class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                    @click="handleChangeActualQuantity(index, scItem.actualQuantity - 1)"
                  >
                    <IconMinus />
                  </button>
                  <div style="width: calc(100% - 60px); min-width: 50px">
                    <InputNumber
                      :value="scItem.actualQuantity"
                      @update:value="(v) => handleChangeActualQuantity(index, v)"
                      textAlign="right"
                    />
                  </div>
                  <button
                    style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                    class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                    @click="handleChangeActualQuantity(index, scItem.actualQuantity + 1)"
                  >
                    <IconPlus />
                  </button>
                </div>
              </td>
              <td class="text-center">{{ scItem.actualQuantity - scItem.systemQuantity }}</td>
              <td>
                <div>
                  <InputHint
                    v-model:value="stockCheck.stockCheckItemList[index].note"
                    :options="['Hư hỏng', 'Mất', 'Khác']"
                    :logic-filter="(item: string, text: string) => ESString.customFilter(item, text)"
                  />
                </div>
              </td>
              <td>
                <div
                  class="flex items-center justify-center"
                  style="color: red; cursor: pointer"
                  @click="stockCheck.stockCheckItemList.splice(index, 1)"
                >
                  <IconDelete style="font-size: 18px" />
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="100">Tổng số sản phẩm: {{ stockCheck.stockCheckItemList.length }}</td>
            </tr>
            <tr>
              <td colspan="100">
                <span>Tổng vốn bị lệch:</span>
                <span class="ml-4 font-medium">{{ formatMoney(sumCostAmountDifferent) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-4">
      <div class="bg-white p-4 flex justify-center">
        <div class="">
          <VueButton
            color="blue"
            :loading="saveLoading"
            icon="save"
            type="button"
            @click="saveStockCheck"
          >
            Lưu phiếu
          </VueButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-payment {
  td {
    padding: 6px 0;
  }
}
</style>
