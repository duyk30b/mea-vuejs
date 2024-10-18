<script lang="ts" setup>
import { DeleteOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { InputNumber, InputOptions, VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Batch, useBatchStore } from '../../../modules/batch'
import { DeliveryStatus } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product, useProductStore } from '../../../modules/product'
import { TicketStatus } from '../../../modules/ticket'
import { TicketClinicApi } from '../../../modules/ticket-clinic'
import { TicketProduct, TicketProductType } from '../../../modules/ticket-product'
import { DTimer } from '../../../utils'
import ModalProductUpsert from '../../product/upsert/ModalProductUpsert.vue'
import { ticketClinic } from './ticket-clinic-detail.ref'

const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()
const inputSearchProduct = ref<InstanceType<typeof InputOptions>>()

const meStore = useMeStore()
const { permissionIdMap } = meStore
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const productStore = useProductStore()
const batchStore = useBatchStore()

const ticketProductBlank = () => {
  const temp = TicketProduct.blank()
  temp.product!.hasManageBatches = 0
  return temp
}

const productList = ref<Product[]>([])
const batchList = ref<Batch[]>([])
const ticketProduct = ref<TicketProduct>(ticketProductBlank())

const ticketProductList = ref<TicketProduct[]>([])

const ticketProductConsumableRoot = computed(() => {
  return (ticketClinic.value.ticketProductList || []).filter((i) => {
    return i.type === TicketProductType.Consumable
  })
})

watch(
  () => ticketProductConsumableRoot.value,
  (newValue, oldValue) => {
    ticketProductList.value = TicketProduct.fromList(newValue)
  },
  { immediate: true }
)

const disabledButton = computed(() => {
  return (
    TicketProduct.equalList(ticketProductList.value, ticketProductConsumableRoot.value) ||
    [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinic.value.ticketStatus)
  )
})

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicConsumable.vue ~ onMounted')
  try {
    await Promise.all([productStore.refreshDB(), batchStore.refreshDB()])
  } catch (error: any) {
    console.log('🚀 ~ file: TicketClinicConsumable.vue:60 ~ onMounted ~ error:', error)
  }
})

const searchingProduct = async (text: string) => {
  productList.value = await productStore.search(text)
  if (!text) {
    clear()
  }
}

const clear = () => {
  ticketProduct.value = ticketProductBlank()
  productList.value = []
  batchList.value = []
}

const selectProduct = async (instance?: Product) => {
  if (instance) {
    const temp = ticketProductBlank()
    temp.customerId = ticketClinic.value.customerId
    temp.product = Product.from(instance)
    temp.productId = instance.id
    temp.type = TicketProductType.Consumable
    temp.unitRate = instance.unitDefaultRate
    temp.expectedPrice = instance.retailPrice
    temp.actualPrice = instance.retailPrice

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
  ticketProductList.value.push(ticketProduct.value)

  clear()
  inputSearchProduct.value?.clear()

  if (!isMobile) {
    inputSearchProduct.value?.focus()
  }
}

const changeQuantityTable = (index: number, unitQuantity: number) => {
  const ticketProductCurrent = ticketProductList.value[index]
  ticketProductCurrent.unitQuantity = unitQuantity
}

const changePriceTable = (index: number, unitPrice: number) => {
  const ticketProductCurrent = ticketProductList.value[index]
  ticketProductCurrent.unitActualPrice = unitPrice
  ticketProductCurrent.unitExpectedPrice = unitPrice
}

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketProductList.value[index]
  ticketProductList.value[index] = ticketProductList.value[index + count]
  ticketProductList.value[index + count] = temp
}

const handleUpdateUnitActualPrice = (price: number) => {
  ticketProduct.value.unitActualPrice = price
  ticketProduct.value.unitExpectedPrice = price
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

  await TicketClinicApi.changeConsumable({
    ticketId: ticketClinic.value.id,
    ticketProductList: ticketProductListChange,
  })
}
</script>
<template>
  <ModalProductUpsert ref="modalProductUpsert" @success="selectProduct" />
  <form class="mt-4 flex flex-wrap gap-4" @submit.prevent="(e) => addPrescriptionItem()">
    <div style="flex-grow: 1; flex-basis: 80%">
      <div class="flex justify-between">
        <div>
          <span>Tên vật tư</span>
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
          <a
            v-if="permissionIdMap[PermissionId.PRODUCT_CREATE]"
            @click="modalProductUpsert?.openModalFromTicket()">
            Thêm vật tư mới
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
          :disabled="
            [TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinic.ticketStatus)
          "
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
    </div>
    <div v-if="ticketProduct.product!.hasManageBatches" style="flex-grow: 1; flex-basis: 80%">
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

    <div style="flex-grow: 1; flex-basis: 300px">
      <div class="flex flex-wrap item-center gap-2">
        <span>Số lượng</span>
        <span v-if="ticketProduct.unitRate !== 1">
          (Quy đổi:
          <b>{{ ticketProduct.quantity }}</b>
          {{ ticketProduct.product?.unitBasicName }})
        </span>
      </div>
      <div class="flex">
        <div style="width: 100px">
          <VueSelect
            v-model:value="ticketProduct.unitRate"
            :disabled="ticketProduct.product!.unitObject.length <= 1"
            :options="
              ticketProduct.product!.unitObject.map((i) => ({
                value: i.rate,
                text: i.name,
                data: i,
              }))
            "
            required></VueSelect>
        </div>
        <div class="flex-1">
          <InputNumber v-model:value="ticketProduct.unitQuantity" required :validate="{ gt: 0 }" />
        </div>
      </div>
    </div>

    <div style="flex-grow: 1; flex-basis: 300px">
      <div class="flex flex-wrap item-center gap-2">
        <span>Giá tiền</span>
        <span v-if="ticketProduct.unitRate !== 1">
          (Quy đổi:
          <b>{{ ticketProduct.quantity }}</b>
          {{ ticketProduct.product?.unitBasicName }})
        </span>
      </div>
      <div class="flex">
        <div class="flex-1">
          <InputNumber
            :value="ticketProduct.unitActualPrice"
            required
            :validate="{ gte: 0 }"
            @update:value="handleUpdateUnitActualPrice" />
        </div>
      </div>
    </div>

    <div style="flex-grow: 1; flex-basis: 80%" class="mt-2 flex justify-center">
      <VueButton
        :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinic.ticketStatus)"
        color="blue"
        type="submit">
        <PlusOutlined />
        Thêm vào danh sách
      </VueButton>
    </div>
  </form>

  <div class="mt-4">
    <div>Danh sách vật tư</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Tên vật tư</th>
            <th>SL</th>
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
            </td>
            <td style="width: 150px">
              <div
                v-if="
                  tpItem.deliveryStatus === DeliveryStatus.Delivered ||
                  [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinic.ticketStatus)
                "
                class="text-center">
                {{ tpItem.unitQuantity }}
              </div>
              <div v-else class="flex items-center justify-between">
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="tpItem.quantity <= 0"
                  @click="changeQuantityTable(index, tpItem.unitQuantity - 1)">
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber
                    :value="tpItem.unitQuantity"
                    textAlign="right"
                    @update:value="(value) => changeQuantityTable(index, value)" />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  @click="changeQuantityTable(index, tpItem.unitQuantity + 1)">
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
              {{ formatMoney(tpItem.expectedPrice * tpItem.quantity || 0) }}
            </td>
            <td class="text-center">
              <a
                v-if="
                  !(
                    tpItem.deliveryStatus === DeliveryStatus.Delivered ||
                    [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinic.ticketStatus)
                  )
                "
                class="text-red-500"
                @click="ticketProductList!.splice(index, 1)">
                <DeleteOutlined />
              </a>
              <a-tooltip v-if="tpItem.deliveryStatus === DeliveryStatus.Delivered">
                <template #title>Đã xuất vật tư</template>
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
                      return (acc += item.expectedPrice * item.quantity)
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
  </div>
  <div class="mt-4 flex gap-4">
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
