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
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product, useProductStore } from '../../../modules/product'
import { TicketStatus } from '../../../modules/ticket'
import { TicketEyeApi, ticketEyeRef } from '../../../modules/ticket-eye'
import { TicketProduct, TicketProductType } from '../../../modules/ticket-product'
import { DTimer, customFilter } from '../../../utils'
import { ticketEyePrintPrescription } from './print-content/ticket-eye-print-prescription'

const inputSearchProduct = ref<InstanceType<typeof InputOptions>>()

const meStore = useMeStore()
const { permissionIdMap } = meStore
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const productStore = useProductStore()
const batchStore = useBatchStore()

const productList = ref<Product[]>([])
const batchList = ref<Batch[]>([])

const ticketProductPrescription = ref<TicketProduct>(TicketProduct.blank())
const ticketProductPrescriptionList = ref<TicketProduct[]>([])
const advice = ref('')

watch(
  () => ticketEyeRef.value.ticketProductPrescriptionList,
  (newValue, oldValue) => {
    ticketProductPrescriptionList.value = TicketProduct.fromList(newValue || [])
  },
  { immediate: true }
)
watch(
  () => ticketEyeRef.value.ticketDiagnosis!.advice,
  (newValue, oldValue) => (advice.value = newValue || ''),
  { immediate: true }
)

const disabledButton = computed(() => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketEyeRef.value.ticketStatus)) {
    return true
  }
  if (
    !TicketProduct.equalList(
      ticketProductPrescriptionList.value,
      ticketEyeRef.value.ticketProductPrescriptionList || []
    )
  ) {
    return false
  }

  if (advice.value !== ticketEyeRef.value.ticketDiagnosis!.advice) {
    return false
  }
  return true
})

onMounted(async () => {
  console.log('🚀 ~ file: TicketEyePrescription.vue:69 ~ onMounted')
  try {
    await Promise.all([productStore.refreshDB(), batchStore.refreshDB()])
  } catch (error: any) {
    console.log('🚀 ~ file: TicketEyePrescription.vue:74 ~ onMounted ~ error:', error)
  }
})

const searchingProduct = async (text: string) => {
  productList.value = await productStore.search(text)
  if (!text) {
    clear()
  }
}

const clear = () => {
  ticketProductPrescription.value = TicketProduct.blank()
  productList.value = []
  batchList.value = []
}

const selectProduct = async (instance?: Product) => {
  if (instance) {
    const temp = TicketProduct.blank()
    temp.customerId = ticketEyeRef.value.customerId
    temp.product = Product.from(instance)
    temp.productId = instance.id
    temp.type = TicketProductType.Prescription
    temp.unitRate = instance.unitDefaultRate
    temp.expectedPrice = instance.retailPrice
    temp.actualPrice = instance.retailPrice
    temp.hintUsage = instance.hintUsage

    ticketProductPrescription.value = temp
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
    ticketProductPrescription.value.batch = Batch.from(instance)
    ticketProductPrescription.value.batchId = instance.id

    ticketProductPrescription.value.expectedPrice = instance.retailPrice
    ticketProductPrescription.value.actualPrice = instance.retailPrice
  } else {
    ticketProductPrescription.value.batch = Batch.blank()
    ticketProductPrescription.value.batchId = 0
  }
}

const addPrescriptionItem = () => {
  if (!ticketProductPrescription.value.productId) {
    return inputSearchProduct.value?.focus()
  }

  // gán số lượng trong đơn
  ticketProductPrescription.value.quantityPrescription = ticketProductPrescription.value.quantity

  // costAmount không tính bây giờ, tính khi save

  ticketProductPrescriptionList.value.push(ticketProductPrescription.value)

  clear()
  inputSearchProduct.value?.clear()

  if (!isMobile) {
    inputSearchProduct.value?.focus()
  }
}

const changeQuantityTable = (index: number, unitQuantity: number) => {
  const ticketProductCurrent = ticketProductPrescriptionList.value[index]
  ticketProductCurrent.unitQuantityPrescription = unitQuantity
  ticketProductCurrent.unitQuantity = unitQuantity
}

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketProductPrescriptionList.value[index]
  ticketProductPrescriptionList.value[index] = ticketProductPrescriptionList.value[index + count]
  ticketProductPrescriptionList.value[index + count] = temp
}

const startPrint = async () => {
  try {
    // const response = await fetch('/template/prescription.hbs')
    // const templateHtml = await response.text()

    // const templateCompile = Handlebars.compile(templateHtml)
    // const content = templateCompile({
    //   organization: meStore.organization,
    //   visit: ticketEyeRef.value,
    // })

    const content = ticketEyePrintPrescription(ticketEyeRef.value, '')
    const iframePrint = document.getElementById('iframe-print') as HTMLIFrameElement
    const pri = iframePrint.contentWindow as Window
    pri.document.open()
    pri.document.write(content)
    pri.document.close()
    pri.focus()
    pri.print()
  } catch (error) {
    console.log('🚀 ~ file: TicketEyePrescription.vue:191 ~ startPrint ~ error:', error)
  }
}

const savePrescription = async () => {
  if (
    TicketProduct.equalList(
      ticketProductPrescriptionList.value,
      ticketEyeRef.value.ticketProductPrescriptionList || []
    )
  ) {
    return await TicketEyeApi.updateTicketProductPrescription({
      ticketId: ticketEyeRef.value.id,
      advice:
        advice.value != ticketEyeRef.value.ticketDiagnosis!.advice ? advice.value || '' : undefined,
    })
  }

  const ticketProductPrescriptionListChange = ticketProductPrescriptionList.value.filter((i) => {
    return [DeliveryStatus.NoStock, DeliveryStatus.Pending].includes(i.deliveryStatus)
  })
  ticketProductPrescriptionListChange.forEach((i) => {
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

  await TicketEyeApi.updateTicketProductPrescription({
    ticketId: ticketEyeRef.value.id,
    ticketProductPrescriptionList: ticketProductPrescriptionListChange,
    advice:
      advice.value != ticketEyeRef.value.ticketDiagnosis!.advice ? advice.value || '' : undefined,
  })
}
</script>
<template>
  <form @submit.prevent="(e) => addPrescriptionItem()">
    <div class="mt-4 flex justify-between">
      <div>
        <span>Tên thuốc</span>
        <span>
          <span
            v-if="
              ticketProductPrescription.product!.id &&
              ticketProductPrescription.product?.hasManageQuantity
            "
            :class="
              ticketProductPrescription.quantity > ticketProductPrescription.product!.quantity
                ? 'text-red-500 font-bold'
                : ''
            ">
            - Tồn kho:
            <b>{{ ticketProductPrescription.product.unitQuantity }}</b>
            {{ ticketProductPrescription.product.unitDefaultName }}
          </span>
          <span
            v-if="
              ticketProductPrescription.product!.id &&
              !ticketProductPrescription.product?.hasManageBatches
            ">
            - Giá
            <b>{{ formatMoney(ticketProductPrescription.product!.unitRetailPrice) }}</b>
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
        :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketEyeRef.ticketStatus)"
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
      v-if="ticketProductPrescription.product!.hasManageBatches"
      class="mt-4"
      style="flex-grow: 1; flex-basis: 80%">
      <div>
        Lô hàng
        <span
          v-if="
            ticketProductPrescription.batch?.expiryDate &&
            ticketProductPrescription.batch?.expiryDate < Date.now()
          "
          class="text-red-500 font-bold">
          (Hết hạn sử dụng)
        </span>
        <span
          v-if="ticketProductPrescription.productId && !batchList.length"
          class="text-red-500 font-bold">
          (Không còn tồn kho)
        </span>
      </div>
      <div>
        <VueSelect
          :value="ticketProductPrescription.batch!.id"
          :options="batchList.map((i: Batch) => ({ value: i.id, data: i }))"
          :disabled="batchList.length == 0"
          @selectItem="({ data }) => selectBatch(data)">
          <template #option="{ item: { data } }">
            <div v-if="!data.id">Chưa chọn lô</div>
            <div v-if="data.id">
              Lô {{ data.lotNumber }} {{ DTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }} - Tồn
              <b>{{ data.unitQuantity }}</b>
              {{ ticketProductPrescription.product!.unitDefaultName }} - Giá
              <b>{{ formatMoney(data.unitRetailPrice) }}</b>
            </div>
          </template>
          <template #text="{ content: { data } }">
            <div v-if="!data?.id">Chưa chọn lô</div>
            <div v-if="data?.id">
              Lô {{ data.lotNumber }} {{ DTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }}
              <span
                :class="
                  ticketProductPrescription.quantity > data.quantity ? 'text-red-500 font-bold' : ''
                ">
                - Tồn
                <b>{{ data.unitQuantity }}</b>
                {{ ticketProductPrescription.product!.unitDefaultName }}
              </span>
              - Giá
              <b>{{ formatMoney(data.unitRetailPrice) }}</b>
            </div>
          </template>
        </VueSelect>
      </div>
    </div>

    <div class="mt-4">
      <div class="flex flex-wrap item-center gap-2">
        <span>Số lượng</span>
        <span v-if="ticketProductPrescription.unitRate !== 1">
          (Quy đổi:
          <b>{{ ticketProductPrescription.quantity }}</b>
          {{ ticketProductPrescription.product?.unitBasicName }})
        </span>
      </div>
      <div class="flex">
        <div style="width: 100px">
          <VueSelect
            v-model:value="ticketProductPrescription.unitRate"
            :disabled="ticketProductPrescription.product!.unitObject.length <= 1"
            :options="
              ticketProductPrescription.product!.unitObject.map((i) => ({
                value: i.rate,
                text: i.name,
                data: i,
              }))
            "
            required></VueSelect>
        </div>
        <div class="flex-1">
          <InputNumber
            v-model:value="ticketProductPrescription.unitQuantity"
            required
            :validate="{ gt: 0 }" />
        </div>
      </div>
    </div>
    <div class="mt-4">
      <div>Hướng dẫn sử dụng</div>
      <InputHint
        v-model:value="ticketProductPrescription.hintUsage"
        :options="[
          ...(ticketProductPrescription.product!.hintUsage
            ? [ticketProductPrescription.product!.hintUsage]
            : []),
          ...settingStore.PRODUCT_HINT_USAGE,
        ]"
        :maxHeight="320"
        :logic-filter="(item: any, text: string) => customFilter(item, text)"></InputHint>
    </div>
    <div class="mt-4 flex justify-center">
      <VueButton
        :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketEyeRef.ticketStatus)"
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
          <tr v-if="ticketProductPrescriptionList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(tpItem, index) in ticketProductPrescriptionList || []"
            :key="tpItem.productId">
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
                    index === ticketProductPrescriptionList.length - 1 ||
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
                  [TicketStatus.Debt, TicketStatus.Completed].includes(ticketEyeRef.ticketStatus)
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
                    [TicketStatus.Debt, TicketStatus.Completed].includes(ticketEyeRef.ticketStatus)
                  )
                "
                class="text-red-500"
                @click="ticketProductPrescriptionList!.splice(index, 1)">
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
                    ticketProductPrescriptionList.reduce((acc, item) => {
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
      v-if="permissionIdMap[PermissionId.TICKET_EYE_UPDATE_TICKET_PRODUCT_CONSUMABLE]"
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
