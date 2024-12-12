<script lang="ts" setup>
import {
  DeleteOutlined,
  FileSearchOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconFileSearch } from '../../../common/icon'
import { InputNumber, InputOptions, VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Batch, BatchService } from '../../../modules/batch'
import { DeliveryStatus, DiscountType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product, ProductService } from '../../../modules/product'
import { TicketStatus } from '../../../modules/ticket'
import { TicketClinicApi, ticketClinicRef } from '../../../modules/ticket-clinic'
import { TicketProduct, TicketProductApi, TicketProductType } from '../../../modules/ticket-product'
import { DTimer } from '../../../utils'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import ModalProductUpsert from '../../product/upsert/ModalProductUpsert.vue'

const inputOptionsProduct = ref<InstanceType<typeof InputOptions>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()

const meStore = useMeStore()
const { permissionIdMap } = meStore
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const productList = ref<Product[]>([])
const batchList = ref<Batch[]>([])

const ticketProductConsumable = ref<TicketProduct>(TicketProduct.blank())
const ticketProductConsumableList = ref<TicketProduct[]>([])

watch(
  () => ticketClinicRef.value.ticketProductConsumableList,
  (newValue, oldValue) => {
    ticketProductConsumableList.value = TicketProduct.fromList(newValue || [])
  },
  { immediate: true }
)

const disabledButton = computed(() => {
  return (
    TicketProduct.equalList(
      ticketProductConsumableList.value,
      ticketClinicRef.value.ticketProductConsumableList || []
    ) || [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)
  )
})

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicConsumable.vue:56  ~ onMounted')
})

const handleFocusFirstSearchProduct = async () => {
  try {
    await Promise.all([ProductService.refreshDB(), BatchService.refreshDB()])
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicConsumable.vue:69  ~ error:', error)
  }
}

const searchingProduct = async (text: string) => {
  if (!text) {
    clear()
  } else {
    productList.value = await ProductService.list({
      filter: {
        isActive: 1,
        $OR: [{ brandName: { LIKE: text } }, { substance: { LIKE: text } }],
        warehouseIds: (value) => {
          try {
            const warehouseIdAcceptList =
              settingStore.TICKET_CLINIC_DETAIL.consumable.warehouseIdList
            const v: number[] = JSON.parse(value)
            if (!warehouseIdAcceptList.length || warehouseIdAcceptList.includes(0)) return true
            if (!v.length || v.includes(0)) return true

            for (let i = 0; i < v.length; i++) {
              if (warehouseIdAcceptList.includes(v[i])) {
                return true
              }
            }
            return false
          } catch (error) {
            return true
          }
        },
      },
    })
  }
}

const clear = () => {
  ticketProductConsumable.value = TicketProduct.blank()
  productList.value = []
  batchList.value = []
}

const selectProduct = async (instance?: Product) => {
  if (instance) {
    const temp = TicketProduct.blank()
    temp.customerId = ticketClinicRef.value.customerId
    temp.productId = instance.id
    temp.product = Product.from(instance)

    temp.type = TicketProductType.Consumable
    temp.deliveryStatus = DeliveryStatus.Pending
    temp.unitRate = instance.unitDefaultRate

    temp.expectedPrice = instance.retailPrice
    temp.discountType = DiscountType.Percent
    temp.discountPercent = 0
    temp.discountMoney = 0
    temp.actualPrice = instance.retailPrice

    if (!instance.hasManageQuantity) {
      temp.warehouseId = 0 // set tạm như này để cho trường hợp !hasManageQuantity, khi gắn batch set lại sau
      temp.costPrice = instance.costPrice // set tạm như này để cho trường hợp !hasManageQuantity, khi gắn batch set lại sau
    }

    ticketProductConsumable.value = temp

    const warehouseIdAcceptList = settingStore.TICKET_CLINIC_DETAIL.consumable.warehouseIdList
    const batchListResponse = await BatchService.list({
      filter: {
        productId: instance.id,
        quantity: { NOT: 0 },
        $OR: [{ warehouseId: { EQUAL: 0 } }, { warehouseId: { IN: warehouseIdAcceptList } }],
      },
    })
    batchListResponse.forEach((i) => (i.product = instance))
    batchList.value = batchListResponse

    if (batchListResponse.length) {
      selectBatch(batchListResponse[0])
    } else {
      selectBatch(Batch.blank())
    }
  } else {
    clear()
  }
}

const selectBatch = (batchSelected: Batch | null) => {
  if (!batchSelected) return
  ticketProductConsumable.value.batch = Batch.from(batchSelected)
  ticketProductConsumable.value.batchId = batchSelected.id
  ticketProductConsumable.value.warehouseId = batchSelected.warehouseId
  ticketProductConsumable.value.costPrice = batchSelected.costPrice
}

const addConsumableItem = () => {
  if (!ticketProductConsumable.value.productId) {
    return inputOptionsProduct.value?.focus()
  }
  ticketProductConsumableList.value.push(ticketProductConsumable.value)

  clear()
  inputOptionsProduct.value?.clear()

  if (!isMobile) {
    inputOptionsProduct.value?.focus()
  }
}

const changeQuantityTable = (index: number, unitQuantity: number) => {
  const ticketProductCurrent = ticketProductConsumableList.value[index]
  ticketProductCurrent.unitQuantity = unitQuantity
}

const changePriceTable = (index: number, unitPrice: number) => {
  const ticketProductCurrent = ticketProductConsumableList.value[index]
  ticketProductCurrent.unitActualPrice = unitPrice
  ticketProductCurrent.unitExpectedPrice = unitPrice
}

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketProductConsumableList.value[index]
  ticketProductConsumableList.value[index] = ticketProductConsumableList.value[index + count]
  ticketProductConsumableList.value[index + count] = temp
}

const handleUpdateUnitActualPrice = (price: number) => {
  ticketProductConsumable.value.unitActualPrice = price
  ticketProductConsumable.value.unitExpectedPrice = price
}

const saveConsumable = async () => {
  const ticketProductConsumableListChange = ticketProductConsumableList.value.filter((i) => {
    return [DeliveryStatus.NoStock, DeliveryStatus.Pending].includes(i.deliveryStatus)
  })

  await TicketClinicApi.updateTicketProductConsumable({
    ticketId: ticketClinicRef.value.id,
    ticketProductConsumableList: ticketProductConsumableListChange,
  })
}

const destroyTicketProductZeroQuantity = async (ticketProductId: number) => {
  await TicketProductApi.destroyZeroQuantity(ticketProductId)
  const findIndexCurrent = ticketProductConsumableList.value.findIndex((i) => {
    return i.id === ticketProductId
  })
  if (findIndexCurrent !== -1) {
    ticketProductConsumableList.value.splice(findIndexCurrent, 1)
  }

  const findIndexRoot = ticketClinicRef.value.ticketProductConsumableList!.findIndex((i) => {
    return i.id === ticketProductId
  })
  if (findIndexRoot !== -1) {
    ticketClinicRef.value.ticketProductConsumableList!.splice(findIndexCurrent, 1)
  }
}

const handleModalProductUpsertSuccess = (instance?: Product) => {
  inputOptionsProduct.value?.setItem({
    text: instance?.brandName,
    data: instance,
    value: instance?.id,
  })
  selectProduct(instance)
}

const openModalProductDetail = (product?: Product) => {
  if (product) modalProductDetail.value?.openModal(product)
}
</script>
<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProductUpsert ref="modalProductUpsert" @success="handleModalProductUpsertSuccess" />
  <form class="mt-4 flex flex-wrap gap-4" @submit.prevent="(e) => addConsumableItem()">
    <div style="flex-grow: 1; flex-basis: 80%">
      <div class="flex gap-1 flex-wrap">
        <span>Tên vật tư</span>
        <a
          v-if="ticketProductConsumable.product?.id"
          @click="modalProductDetail?.openModal(ticketProductConsumable.product)">
          <IconFileSearch />
        </a>
        <div v-if="ticketProductConsumable.product">
          (
          <span
            v-if="ticketProductConsumable.product?.hasManageQuantity"
            :class="
              ticketProductConsumable.quantity > ticketProductConsumable.product!.quantity
                ? 'text-red-500 font-bold'
                : ''
            ">
            Tồn:
            <b>
              {{ ticketProductConsumable.product?.unitQuantity }}
              {{ ticketProductConsumable.product?.unitDefaultName }}
            </b>
          </span>
          <span>
            - Giá
            <b>{{ formatMoney(ticketProductConsumable.product!.unitRetailPrice) }}</b>
          </span>
          )
        </div>

        <a
          v-if="permissionIdMap[PermissionId.PRODUCT_UPDATE] && ticketProductConsumable.product?.id"
          @click="modalProductUpsert?.openModal(ticketProductConsumable.product.id)">
          Sửa thông tin sản phẩm
        </a>
      </div>
      <div style="height: 40px">
        <InputOptions
          ref="inputOptionsProduct"
          required
          :options="productList.map((i) => ({ value: i.id, text: i.brandName, data: i }))"
          :maxHeight="320"
          placeholder="Tìm kiếm sản phẩm và lô hàng bằng tên hoặc hoạt chất của sản phẩm"
          :disabled="
            [TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.ticketStatus)
          "
          @onFocusinFirst="handleFocusFirstSearchProduct"
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
    <div style="flex-grow: 1; flex-basis: 80%">
      <div>
        Lô hàng
        <span
          v-if="
            ticketProductConsumable.batch?.expiryDate &&
            ticketProductConsumable.batch?.expiryDate < Date.now()
          "
          class="text-red-500 font-bold">
          (Hết hạn sử dụng)
        </span>
        <span
          v-if="ticketProductConsumable.productId && !batchList.length"
          class="text-red-500 font-bold">
          (Không còn tồn kho)
        </span>
      </div>
      <div>
        <VueSelect
          :value="ticketProductConsumable.batch!.id"
          :options="batchList.map((i: Batch) => ({ value: i.id, data: i }))"
          :disabled="batchList.length == 0"
          @selectItem="({ data }) => selectBatch(data)">
          <template #option="{ item: { data } }">
            <div v-if="!data.id">Chưa chọn lô</div>
            <div v-if="data.id">
              Lô {{ data.lotNumber }} {{ DTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }} - Tồn
              <b>{{ data.unitQuantity }}</b>
              {{ ticketProductConsumable.product!.unitDefaultName }}
            </div>
          </template>
          <template #text="{ content: { data } }">
            <div v-if="!data?.id">Chưa chọn lô</div>
            <div v-if="data?.id">
              Lô {{ data.lotNumber }} {{ DTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }}
              <span
                :class="
                  ticketProductConsumable.quantity > data.quantity ? 'text-red-500 font-bold' : ''
                ">
                - Tồn
                <b>{{ data.unitQuantity }}</b>
                {{ ticketProductConsumable.product!.unitDefaultName }}
              </span>
            </div>
          </template>
        </VueSelect>
      </div>
    </div>

    <div style="flex-grow: 1; flex-basis: 300px">
      <div class="flex flex-wrap item-center gap-2">
        <span>Số lượng</span>
        <span v-if="ticketProductConsumable.unitRate !== 1">
          (Quy đổi:
          <b>{{ ticketProductConsumable.quantity }}</b>
          {{ ticketProductConsumable.product?.unitBasicName }})
        </span>
      </div>
      <div class="flex">
        <div style="width: 100px">
          <VueSelect
            v-model:value="ticketProductConsumable.unitRate"
            :disabled="ticketProductConsumable.product!.unitObject.length <= 1"
            :options="
              ticketProductConsumable.product!.unitObject.map((i) => ({
                value: i.rate,
                text: i.name,
                data: i,
              }))
            "
            required></VueSelect>
        </div>
        <div class="flex-1">
          <InputNumber
            v-model:value="ticketProductConsumable.unitQuantity"
            required
            :validate="{ gt: 0 }" />
        </div>
      </div>
    </div>

    <div style="flex-grow: 1; flex-basis: 300px">
      <div class="flex flex-wrap item-center gap-2">
        <span>Giá tiền</span>
        <span v-if="ticketProductConsumable.unitRate !== 1">
          (Quy đổi:
          <b>{{ ticketProductConsumable.quantity }}</b>
          {{ ticketProductConsumable.product?.unitBasicName }})
        </span>
      </div>
      <div class="flex">
        <div class="flex-1">
          <InputNumber
            :value="ticketProductConsumable.unitActualPrice"
            required
            :validate="{ gte: 0 }"
            @update:value="handleUpdateUnitActualPrice" />
        </div>
      </div>
    </div>

    <div style="flex-grow: 1; flex-basis: 80%" class="mt-2 flex justify-center">
      <VueButton
        :disabled="
          [TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.ticketStatus)
        "
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
          <tr v-if="ticketProductConsumableList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(tpItem, index) in ticketProductConsumableList || []" :key="tpItem.productId">
            <td>
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
                  :disabled="index === 0 || tpItem.deliveryStatus === DeliveryStatus.Delivered"
                  @click="changeItemPosition(index, -1)">
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
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
                  :disabled="
                    index === ticketProductConsumableList.length - 1 ||
                    tpItem.deliveryStatus === DeliveryStatus.Delivered
                  "
                  @click="changeItemPosition(index, 1)">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td>
              <div style="font-weight: 500">
                {{ tpItem.product?.brandName }}
                <a class="ml-1" @click="openModalProductDetail(tpItem.product!)">
                  <FileSearchOutlined />
                </a>
              </div>
              <div class="text-xs">{{ tpItem.product?.substance }}</div>
            </td>
            <td style="width: 150px">
              <div
                v-if="
                  tpItem.deliveryStatus === DeliveryStatus.Delivered ||
                  [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.ticketStatus)
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
                v-if="tpItem.deliveryStatus === DeliveryStatus.Delivered && tpItem.quantity == 0"
                class="text-red-500"
                @click="destroyTicketProductZeroQuantity(tpItem.id)">
                <DeleteOutlined />
              </a>
              <a
                v-else-if="
                  !(
                    tpItem.deliveryStatus === DeliveryStatus.Delivered ||
                    [TicketStatus.Debt, TicketStatus.Completed].includes(
                      ticketClinicRef.ticketStatus
                    )
                  )
                "
                class="text-red-500"
                @click="ticketProductConsumableList!.splice(index, 1)">
                <DeleteOutlined />
              </a>
              <a-tooltip v-else-if="tpItem.deliveryStatus === DeliveryStatus.Delivered">
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
                    ticketProductConsumableList.reduce((acc, item) => {
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
      v-if="permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PRODUCT_CONSUMABLE]"
      color="blue"
      class="ml-auto"
      :disabled="disabledButton"
      icon="save"
      @click="saveConsumable">
      Lưu lại
    </VueButton>
  </div>
</template>

<style lang="scss" scoped>
:deep(.ck-editor__editable) {
  height: 100px !important;
}
</style>
