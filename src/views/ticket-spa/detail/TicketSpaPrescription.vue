<script lang="ts" setup>
import { DeleteOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { BasicEditor } from '../../../ckeditor/class-editor'
import VueButton from '../../../common/VueButton.vue'
import { InputHint, InputNumber, InputOptions, VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Batch, useBatchStore } from '../../../modules/batch'
import { DeliveryStatus } from '../../../modules/enum'
import { Product, useProductStore } from '../../../modules/product'
import { TicketStatus, ticketRef } from '../../../modules/ticket'
import { TicketClinicApi } from '../../../modules/ticket-clinic'
import { TicketProduct, TicketProductType } from '../../../modules/ticket-product'
import { DTimer, customFilter } from '../../../utils'
import ModalProductUpsert from '../../product/upsert/ModalProductUpsert.vue'
import { ticketSpaPrescriptionHtmlContent } from './print-content/ticket-spa-prescription-html-print-content'

const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const inputSearchProduct = ref<InstanceType<typeof InputOptions>>()

const meStore = useMeStore()
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const productStore = useProductStore()
const batchStore = useBatchStore()

const productList = ref<Product[]>([])
const batchList = ref<Batch[]>([])
const ticketProduct = ref<TicketProduct>(TicketProduct.blank())

const ticketProductList = ref<TicketProduct[]>([])
const advice = ref('')

const ticketProductPrescriptionRoot = computed(() => {
  return (ticketRef.value.ticketProductList || []).filter((i) => {
    return i.type === TicketProductType.Prescription
  })
})

watch(
  () => ticketProductPrescriptionRoot.value,
  (newValue, oldValue) => {
    ticketProductList.value = TicketProduct.fromList(newValue)
  },
  { immediate: true }
)
watch(
  () => ticketRef.value.ticketDiagnosis!.advice,
  (newValue, oldValue) => (advice.value = newValue || ''),
  { immediate: true }
)

const disabledButton = computed(() => {
  return (
    (TicketProduct.equalList(ticketProductList.value, ticketProductPrescriptionRoot.value) &&
      advice.value === ticketRef.value.ticketDiagnosis!.advice) ||
    [TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.value.ticketStatus)
  )
})

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicPrescription.vue ~ onMounted')
  try {
    await Promise.all([productStore.refreshDB(), batchStore.refreshDB()])
  } catch (error: any) {
    console.log('🚀 ~ file: TicketClinicPrescription.vue:67 ~ onMounted ~ error:', error)
  }
})

const searchingProduct = async (text: string) => {
  productList.value = await productStore.search(text)
  if (!text) {
    clear()
  }
}

const clear = () => {
  ticketProduct.value = TicketProduct.blank()
  productList.value = []
  batchList.value = []
}

const selectProduct = async (instance?: Product) => {
  if (instance) {
    const temp = TicketProduct.blank()
    temp.customerId = ticketRef.value.customerId
    temp.product = Product.from(instance)
    temp.productId = instance.id
    temp.type = TicketProductType.Prescription
    temp.unitRate = instance.unitDefaultRate
    temp.expectedPrice = instance.retailPrice
    temp.actualPrice = instance.retailPrice
    temp.hintUsage = instance.hintUsage

    ticketProduct.value = temp
    if (instance.hasManageBatches) {
      const batchListResponse = await batchStore.list({
        filter: {
          productId: instance.id,
          quantity: { GT: 0 },
        },
      })
      batchListResponse.forEach((i) => (i.product = instance))
      batchList.value = batchListResponse

      if (batchListResponse.length) {
        selectBatch(batchListResponse[0])
      } else {
        selectBatch(null)
      }
    } else {
      batchList.value = []
      selectBatch(null)
    }
  } else {
    clear()
  }
}

const selectBatch = (instance: Batch | null) => {
  if (instance) {
    ticketProduct.value.batch = Batch.from(instance)
    ticketProduct.value.batchId = instance.id

    ticketProduct.value.expectedPrice = instance.retailPrice
    ticketProduct.value.actualPrice = instance.retailPrice
  } else {
    ticketProduct.value.batch = Batch.blank()
    ticketProduct.value.batchId = 0
  }
}

const addPrescriptionItem = () => {
  if (!ticketProduct.value.productId) {
    return inputSearchProduct.value?.focus()
  }

  // gán số lượng trong đơn
  ticketProduct.value.quantityPrescription = ticketProduct.value.quantity

  // costAmount được tính khi lưu

  ticketProductList.value.push(ticketProduct.value)

  clear()
  inputSearchProduct.value?.clear()

  if (!isMobile) {
    inputSearchProduct.value?.focus()
  }
}

const changeQuantityTable = (index: number, unitQuantity: number) => {
  const ticketProductCurrent = ticketProductList.value[index]
  ticketProductCurrent.unitQuantityPrescription = unitQuantity
  ticketProductCurrent.unitQuantity = unitQuantity
}

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketProductList.value[index]
  ticketProductList.value[index] = ticketProductList.value[index + count]
  ticketProductList.value[index + count] = temp
}

const startPrint = async () => {
  try {
    // const response = await fetch('/template/prescription.hbs')
    // const templateHtml = await response.text()

    // const templateCompile = Handlebars.compile(templateHtml)
    // const content = templateCompile({
    //   organization: meStore.organization,
    //   visit: ticketRef.value,
    // })

    const content = ticketSpaPrescriptionHtmlContent(ticketRef.value)
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

const savePrescription = async () => {
  const ticketProductListChange = ticketProductList.value.filter((i) => {
    return [DeliveryStatus.NoStock, DeliveryStatus.Pending].includes(i.deliveryStatus)
  })
  ticketProductListChange.forEach((i) => {
    // luôn tính lại costAmount
    let itemCostAmount = 0
    if (i.batchId) {
      itemCostAmount = i.quantity * i.batch!.costPrice
    } else if (i.product!.quantity <= 0) {
      itemCostAmount = (i.product?.costPrice || 0) * i.quantity
    } else {
      itemCostAmount = (i.product!.costAmount * i.quantity) / i.product!.quantity
    }
    const itemCostAmountFix = Math.floor(itemCostAmount / 10) * 10

    i.costAmount = itemCostAmountFix

    // i.quantityPrescription = i.quantity // bỏ logic này vì có thể có những sản phẩm không bán
  })

  await TicketClinicApi.changePrescription({
    ticketId: ticketRef.value.id,
    ticketProductList: ticketProductListChange,
    advice: advice.value,
  })
}
</script>
<template>
  <ModalProductUpsert ref="modalProductUpsert" @success="selectProduct" />
  <form @submit.prevent="(e) => addPrescriptionItem()">
    <div class="mt-4 flex justify-between">
      <div>
        <span>Tên thuốc</span>
        <span>
          <span
            v-if="ticketProduct.product!.id && ticketProduct.product?.hasManageQuantity"
            :class="
              ticketProduct.quantity > ticketProduct.product!.quantity
                ? 'text-red-500 font-bold'
                : ''
            ">
            - Tồn kho:
            <b>{{ ticketProduct.product.unitQuantity }}</b>
            {{ ticketProduct.product.unitDefaultName }}
          </span>
          <span v-if="ticketProduct.product!.id && !ticketProduct.product?.hasManageBatches">
            - Giá
            <b>{{ formatMoney(ticketProduct.product!.unitRetailPrice) }}</b>
          </span>
        </span>
      </div>
      <span>
        <!-- <a
          v-if="permissionIdMap[PermissionId.PRODUCT_CREATE]"
          @click="modalProductUpsert?.openModalFromTicket()">
          Thêm thuốc mới
        </a> -->
      </span>
    </div>

    <div style="height: 40px">
      <InputOptions
        ref="inputSearchProduct"
        required
        :options="productList.map((i) => ({ value: i.id, text: i.brandName, data: i }))"
        :maxHeight="320"
        placeholder="Tìm kiếm sản phẩm và lô hàng bằng tên hoặc hoạt chất của sản phẩm"
        :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketRef.ticketStatus)"
        @selectItem="({ data }) => selectProduct(data)"
        @update:text="searchingProduct">
        <template #option="{ item: { data } }">
          <div>
            <b>{{ data.brandName }}</b>
            -
            <span style="font-weight: 700" :class="data.unitQuantity <= 0 ? 'text-red-500' : ''">
              {{ data.unitQuantity }}
            </span>
            {{ data.unitDefaultName }}
            - Giá
            <span style="font-weight: 600">{{ formatMoney(data.unitRetailPrice) }}</span>
            /{{ data.unitDefaultName }}
          </div>
          <div>{{ data.substance }}</div>
        </template>
      </InputOptions>
    </div>
    <div
      v-if="ticketProduct.product!.hasManageBatches"
      class="mt-4"
      style="flex-grow: 1; flex-basis: 80%">
      <div>
        Lô hàng
        <span
          v-if="ticketProduct.batch?.expiryDate && ticketProduct.batch?.expiryDate < Date.now()"
          class="text-red-500 font-bold">
          (Hết hạn sử dụng)
        </span>
        <span v-if="ticketProduct.productId && !batchList.length" class="text-red-500 font-bold">
          (Không còn tồn kho)
        </span>
      </div>
      <div>
        <VueSelect
          :value="ticketProduct.batch!.id"
          :options="batchList.map((i: Batch) => ({ value: i.id, data: i }))"
          :disabled="batchList.length == 0"
          @selectItem="({ data }) => selectBatch(data)">
          <template #option="{ item: { data } }">
            <div v-if="!data.id">Chưa chọn lô</div>
            <div v-if="data.id">
              Lô {{ data.lotNumber }} {{ DTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }} - Tồn
              <b>{{ data.unitQuantity }}</b>
              {{ ticketProduct.product!.unitDefaultName }} - Giá
              <b>{{ formatMoney(data.unitRetailPrice) }}</b>
            </div>
          </template>
          <template #text="{ content: { data } }">
            <div v-if="!data?.id">Chưa chọn lô</div>
            <div v-if="data?.id">
              Lô {{ data.lotNumber }} {{ DTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }}
              <span :class="ticketProduct.quantity > data.quantity ? 'text-red-500 font-bold' : ''">
                - Tồn
                <b>{{ data.unitQuantity }}</b>
                {{ ticketProduct.product!.unitDefaultName }}
              </span>
              - Giá
              <b>{{ formatMoney(data.unitRetailPrice) }}</b>
            </div>
          </template>
        </VueSelect>
      </div>
    </div>


    <div class="mt-4">
      <div>Hướng dẫn sử dụng</div>
      <InputHint
        v-model:value="ticketProduct.hintUsage"
        :options="[
          ...(ticketProduct.product!.hintUsage ? [ticketProduct.product!.hintUsage] : []),
          ...settingStore.PRODUCT_HINT_USAGE,
        ]"
        :maxHeight="320"
        :logic-filter="(item: any, text: string) => customFilter(item, text)"></InputHint>
    </div>
    <div class="mt-4 flex justify-center">
      <VueButton
        :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketRef.ticketStatus)"
        color="blue"
        type="submit">
        <PlusOutlined />
        Thêm vào đơn
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
          <tr v-if="ticketProductList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(tpItem, index) in ticketProductList || []" :key="tpItem.productId">
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
                  :disabled="index === 0 || tpItem.deliveryStatus === DeliveryStatus.Delivered"
                  @click="changeItemPosition(index, -1)">
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
                </button>
                <span>{{ index + 1 }}</span>
                <button
                  style="
                    border: none;
                    font-size: 1.2rem;
                    line-height: 0.5;
                    background: none;
                    margin-top: -0.5rem;
                  "
                  class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                  :disabled="
                    index === ticketProductList.length - 1 ||
                    tpItem.deliveryStatus === DeliveryStatus.Delivered
                  "
                  @click="changeItemPosition(index, 1)">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td>
              <div style="font-weight: 500">{{ tpItem.product?.brandName }}</div>
              <div class="text-xs">{{ tpItem.product?.substance }}</div>
              <div class="text-xs italic">{{ tpItem.hintUsage }}</div>
            </td>
            <td style="width: 150px">
              <div
                v-if="
                  tpItem.deliveryStatus === DeliveryStatus.Delivered ||
                  [TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.ticketStatus)
                "
                class="text-center">
                {{ tpItem.unitQuantityPrescription }}
              </div>
              <div v-else class="flex items-center justify-between">
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="tpItem.quantityPrescription <= 0"
                  @click="changeQuantityTable(index, tpItem.unitQuantityPrescription - 1)">
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber
                    :value="tpItem.unitQuantityPrescription"
                    textAlign="right"
                    @update:value="(value) => changeQuantityTable(index, value)" />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  @click="changeQuantityTable(index, tpItem.unitQuantityPrescription + 1)">
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </button>
              </div>
            </td>
            <td class="text-center whitespace-nowrap">
              {{ tpItem.unitName }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(tpItem.unitExpectedPrice || 0) }}
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(tpItem.expectedPrice * tpItem.quantityPrescription || 0) }}
            </td>
            <td class="text-center">
              <a
                v-if="
                  !(
                    tpItem.deliveryStatus === DeliveryStatus.Delivered ||
                    [TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.ticketStatus)
                  )
                "
                class="text-red-500"
                @click="ticketProductList!.splice(index, 1)">
                <DeleteOutlined />
              </a>
              <a-tooltip v-if="tpItem.deliveryStatus === DeliveryStatus.Delivered">
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
                    ticketProductList.reduce((acc, item) => {
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
    <VueButton color="blue" icon="print" @click="startPrint">In đơn thuốc</VueButton>
    <VueButton
      color="blue"
      class="ml-auto"
      :disabled="disabledButton"
      icon="save"
      @click="savePrescription">
      Lưu lại
    </VueButton>
  </div>
</template>

<style lang="scss" scoped>
:deep(.ck-editor__editable) {
  height: 100px !important;
}
</style>
