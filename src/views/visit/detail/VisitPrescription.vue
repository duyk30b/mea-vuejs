<script lang="ts" setup>
import {
  DeleteOutlined,
  PlusOutlined,
  PrinterOutlined,
  SaveOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { BasicEditor } from '../../../ckeditor/class-editor'
import VueButton from '../../../common/VueButton.vue'
import { InputHint, InputNumber, InputOptions, VueSelect } from '../../../common/vue-form'
import { Handlebars } from '../../../core/handlebars'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { DiscountType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product, useProductStore } from '../../../modules/product'
import { VisitApi, VisitStatus } from '../../../modules/visit'
import { VisitProduct } from '../../../modules/visit-product'
import { customFilter } from '../../../utils'
import ModalProductUpsert from '../../product/upsert/ModalProductUpsert.vue'
import { visit } from './visit.ref'

const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const inputSearchProduct = ref<InstanceType<typeof InputOptions>>()

const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const productStore = useProductStore()
const product = ref(Product.blank())
const productList = ref<Product[]>([])

const hintUsage = ref('')
const quantity = ref(0)
const unitRate = ref(1)

const visitProductList = ref<VisitProduct[]>([])
const advice = ref('')

watch(
  () => visit.value.visitProductList,
  (newValue, oldValue) => {
    visitProductList.value = VisitProduct.cloneList(newValue || [])
  },
  { immediate: true }
)
watch(
  () => visit.value.visitDiagnosis!.advice,
  (newValue, oldValue) => (advice.value = newValue || ''),
  { immediate: true }
)

const disabledButton = computed(() => {
  return (
    (JSON.stringify(visitProductList.value) === JSON.stringify(visit.value.visitProductList) &&
      advice.value === visit.value.visitDiagnosis!.advice) ||
    [VisitStatus.Debt, VisitStatus.Completed].includes(visit.value.visitStatus)
  )
})

onMounted(async () => {
  try {
    await productStore.refreshDB()
  } catch (error: any) {
    console.log('🚀 ~ file: VisitPrescription.vue:56 ~ onMounted ~ error:', error)
  }
})

const clear = () => {
  product.value = Product.blank()
  unitRate.value = 1
  quantity.value = 0
  hintUsage.value = ''
  productList.value = []
}

const searchingProduct = async (text: string) => {
  productList.value = await productStore.search(text)
}

const selectProduct = async (productData?: Product) => {
  if (productData) {
    product.value = Product.clone(productData)
    unitRate.value = productData.unitDefaultRate
    hintUsage.value = productData.hintUsage
  } else {
    clear()
  }
}

const addPrescriptionItem = () => {
  if (!product.value.id) {
    return inputSearchProduct.value?.focus()
  }

  const visitProduct = VisitProduct.blank()
  visitProduct.productId = product.value.id
  visitProduct.isSent = 0
  visitProduct.product = Product.clone(product.value)
  visitProduct.unitRate = unitRate.value
  visitProduct.quantityPrescription = quantity.value
  visitProduct.quantity = quantity.value
  visitProduct.costAmount = Math.floor(
    ((visitProduct.product?.costAmount || 0) * visitProduct.quantity) /
      (visitProduct.product?.quantity || 1)
  )
  visitProduct.expectedPrice = product.value.retailPrice
  visitProduct.discountMoney = 0
  visitProduct.discountPercent = 0
  visitProduct.discountType = DiscountType.VND
  visitProduct.actualPrice = product.value.retailPrice
  visitProduct.hintUsage = hintUsage.value

  visitProductList.value.push(visitProduct)

  clear()
  inputSearchProduct.value?.clear()

  if (!isMobile) {
    inputSearchProduct.value?.focus()
  }
}

const changeQuantityTable = (index: number, unitQuantity: number) => {
  const visitProductCurrent = visitProductList.value[index]
  visitProductCurrent.unitQuantityPrescription = unitQuantity
  visitProductCurrent.unitQuantity = unitQuantity
  visitProductCurrent.costAmount = Math.floor(
    ((visitProductCurrent.product?.costAmount || 0) * visitProductCurrent.quantity) /
      (visitProductCurrent.product?.quantity || 1)
  )
}

const changeItemPosition = (index: number, count: number) => {
  const temp = visitProductList.value[index]
  visitProductList.value[index] = visitProductList.value[index + count]
  visitProductList.value[index + count] = temp
}

const startPrint = async () => {
  try {
    const response = await fetch('/template/prescription.hbs')
    const templateHtml = await response.text()

    const templateCompile = Handlebars.compile(templateHtml)
    const content = templateCompile({
      organization: meStore.organization,
      visit: visit.value,
    })

    const iframePrint = document.getElementById('iframe-print') as HTMLIFrameElement
    const pri = iframePrint.contentWindow as Window
    pri.document.open()
    pri.document.write(content)
    pri.document.close()
    pri.focus()
    pri.print()
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
  }
}

const saveVisitProducts = async () => {
  await VisitApi.replaceVisitPrescription({
    visitId: visit.value.id,
    visitProductList: visitProductList.value.filter((i) => !i.isSent),
    advice: advice.value,
  })
}
</script>
<template>
  <ModalProductUpsert ref="modalProductUpsert" @success="selectProduct" />
  <form @submit.prevent="(e) => addPrescriptionItem()">
    <div class="flex justify-between">
      <span>Tên thuốc</span>
      <span>
        <a
          v-if="permissionIdMap[PermissionId.PRODUCT_CREATE]"
          @click="modalProductUpsert?.openModalFromInvoice()"
        >
          Thêm thuốc mới
        </a>
      </span>
    </div>

    <div style="height: 40px">
      <InputOptions
        ref="inputSearchProduct"
        required
        :options="productList.map((i) => ({ value: i.id, text: i.brandName, data: i }))"
        :maxHeight="320"
        placeholder="Tìm kiếm sản phẩm và lô hàng bằng tên hoặc hoạt chất của sản phẩm"
        :disabled="[VisitStatus.Completed, VisitStatus.Debt].includes(visit.visitStatus)"
        @selectItem="({ data }) => selectProduct(data)"
        @update:text="searchingProduct"
      >
        <template #option="{ item: { data } }">
          <div>
            <b>{{ data.brandName }}</b> -
            <span style="font-weight: 700" :class="data.unitQuantity <= 0 ? 'text-red-500' : ''">
              {{ data.unitQuantity }}
            </span>
            {{ data.unitDefaultName }}
            - Giá <span style="font-weight: 600">{{ formatMoney(data.unitRetailPrice) }}</span> /{{
              data.unitDefaultName
            }}
          </div>
          <div>{{ data.substance }}</div>
        </template>
      </InputOptions>
    </div>

    <div class="mt-4">
      <div class="flex flex-wrap item-center gap-2">
        <span> Số lượng </span>
        <span v-if="unitRate !== 1">
          (Quy đổi: <b>{{ quantity }}</b> {{ product?.unitBasicName }})
        </span>
        <span
          v-if="product.id && product?.hasManageQuantity"
          :class="quantity > (product?.quantity || 0) ? 'text-red-500 font-bold' : ''"
        >
          ( Tồn kho: <b>{{ Number((product?.quantity / unitRate).toFixed(3)) }}</b>
          {{ product.getUnitNameByRate(unitRate) }}
          - Giá {{ formatMoney(product.retailPrice * unitRate) }})
        </span>
      </div>
      <div class="flex">
        <div style="width: 100px">
          <VueSelect
            v-model:value="unitRate"
            :disabled="product.unitObject.length <= 1"
            :options="product.unitObject.map((i) => ({ value: i.rate, text: i.name, data: i }))"
            required
          >
          </VueSelect>
        </div>
        <div class="flex-1">
          <InputNumber
            :value="quantity / unitRate"
            required
            :validate="{ gt: 0 }"
            @update:value="(value) => (quantity = value * unitRate)"
          />
        </div>
      </div>
    </div>
    <div class="mt-4">
      <div>Hướng dẫn sử dụng</div>
      <InputHint
        v-model:value="hintUsage"
        :options="[
          ...(product.hintUsage ? [product.hintUsage] : []),
          ...screenStore.PRODUCT_HINT_USAGE,
        ]"
        :maxHeight="320"
        :logic-filter="(item: any, text: string) => customFilter(item, text)"
      >
      </InputHint>
    </div>
    <div class="mt-4 flex justify-center">
      <VueButton
        :disabled="[VisitStatus.Completed, VisitStatus.Debt].includes(visit.visitStatus)"
        color="blue"
        type="submit"
      >
        <PlusOutlined /> Thêm vào đơn
      </VueButton>
    </div>
  </form>
  <div class="mt-4">
    <div>Đơn thuốc</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Tên Thuốc</th>
            <th>SL kê</th>
            <th>Đ.Vị</th>
            <th>Giá</th>
            <th>T.Tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="visitProductList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(visitProduct, index) in visitProductList || []" :key="visitProduct.productId">
            <td>
              <div class="flex flex-col items-center">
                <button
                  style="
                    border: none;
                    font-size: 1.2rem;
                    line-height: 0.5;
                    background: none;
                    margin-bottom: -0.5rem;
                  "
                  class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                  :disabled="index === 0 || !!visit.isSent"
                  @click="changeItemPosition(index, -1)"
                >
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
                </button>
                <span> {{ index + 1 }} </span>
                <button
                  style="
                    border: none;
                    font-size: 1.2rem;
                    line-height: 0.5;
                    background: none;
                    margin-top: -0.5rem;
                  "
                  class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                  :disabled="index === visitProductList.length - 1 || !!visit.isSent"
                  @click="changeItemPosition(index, 1)"
                >
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td>
              <div style="font-weight: 500">{{ visitProduct.product?.brandName }}</div>
              <div class="text-xs">{{ visitProduct.product?.substance }}</div>
              <div class="text-xs italic">{{ visitProduct.hintUsage }}</div>
            </td>
            <td style="width: 150px">
              <div
                v-if="
                  visitProduct.isSent ||
                  [VisitStatus.Debt, VisitStatus.Completed].includes(visit.visitStatus)
                "
                class="text-center"
              >
                {{ visitProduct.unitQuantityPrescription }}
              </div>
              <div v-else class="flex items-center justify-between">
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="visitProduct.quantityPrescription <= 0 || !!visitProduct.isSent"
                  @click="changeQuantityTable(index, visitProduct.unitQuantityPrescription - 1)"
                >
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber
                    :value="visitProduct.unitQuantityPrescription"
                    textAlign="right"
                    :disabled="!!visitProduct.isSent"
                    @update:value="(value) => changeQuantityTable(index, value)"
                  />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="!!visitProduct.isSent"
                  @click="changeQuantityTable(index, visitProduct.unitQuantityPrescription + 1)"
                >
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </button>
              </div>
            </td>
            <td class="text-center whitespace-nowrap">
              {{ visitProduct.unitName }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(visitProduct.unitExpectedPrice || 0) }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(visitProduct.expectedPrice * visitProduct.quantityPrescription || 0) }}
            </td>
            <td class="text-center">
              <a
                v-if="
                  !(
                    visitProduct.isSent ||
                    [VisitStatus.Debt, VisitStatus.Completed].includes(visit.visitStatus)
                  )
                "
                class="text-red-500"
                @click="visitProductList!.splice(index, 1)"
              >
                <DeleteOutlined />
              </a>
              <a-tooltip v-if="visitProduct.isSent">
                <template #title>Đã xuất thuốc</template>
                <ShoppingCartOutlined style="color: #52c41a; cursor: not-allowed !important" />
              </a-tooltip>
            </td>
          </tr>
          <tr>
            <td colspan="5" class="text-right">
              <b>Tổng tiền</b>
            </td>
            <td class="text-right">
              <b>
                {{
                  formatMoney(
                    visitProductList.reduce((acc, item) => {
                      return (acc += item.expectedPrice * item.quantityPrescription)
                    }, 0)
                  )
                }}
              </b>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4">
      <div>Lời dặn của bác sĩ</div>
      <div>
        <ckeditor v-model="advice" :editor="BasicEditor"></ckeditor>
      </div>
    </div>
  </div>
  <div class="mt-4 flex gap-4">
    <!-- <button class="btn" @click="resetVisitProducts">
        <UndoOutlined />
        Tải lại
      </button> -->
    <button class="btn btn-blue" @click="startPrint"><PrinterOutlined /> In đơn thuốc</button>
    <button class="btn btn-blue ml-auto" :disabled="disabledButton" @click="saveVisitProducts">
      <SaveOutlined /> Lưu lại
    </button>
  </div>
</template>

<style lang="scss" scoped>
:deep(.ck-editor__editable) {
  height: 100px !important;
}
</style>
