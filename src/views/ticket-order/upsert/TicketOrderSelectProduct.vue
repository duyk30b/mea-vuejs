<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import {
  InputHint,
  InputMoney,
  InputNumber,
  InputOptions,
  VueSelect,
} from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Batch, BatchService } from '../../../modules/batch'
import { DeliveryStatus, DiscountType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product, ProductService } from '../../../modules/product'
import { TicketProduct } from '../../../modules/ticket-product'
import { customFilter, DTimer } from '../../../utils'
import ModalProductUpsert from '../../product/upsert/ModalProductUpsert.vue'
import { ticket } from './ticket-order-upsert.ref'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import { IconFileSearch } from '../../../common/icon'
import { Warehouse } from '../../../modules/warehouse'
import { WarehouseService } from '../../../modules/warehouse/warehouse.service'

const inputOptionsProduct = ref<InstanceType<typeof InputOptions>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const product = ref(Product.blank())
const productList = ref<Product[]>([])
const batch = ref(Batch.blank())
const batchList = ref<Batch[]>([])

const ticketProduct = ref<TicketProduct>(TicketProduct.blank())
const productOutSellType = ref<'retailPrice' | 'wholesalePrice' | 'costPrice'>('retailPrice')

const warehouseMap = ref<Record<string, Warehouse>>({})

onMounted(async () => {
  console.log('🚀 ~ file: TicketOrderSelectProduct.vue:45  ~ onMounted')
  warehouseMap.value = await WarehouseService.getMap()
})

const handleFocusFirstSearchProduct = async () => {
  try {
    await Promise.all([ProductService.refreshDB(), BatchService.refreshDB()])
  } catch (error) {
    console.log('🚀 ~ file: TicketOrderSelectProduct.vue:56 ~ error:', error)
  }
}

const searchingProduct = async (text: string) => {
  console.log('🚀 ~ file: TicketOrderSelectProduct.vue:56 ~ searchingProduct ~ text:', text)
  if (!text) {
    productList.value = []
  } else {
    productList.value = await ProductService.list({
      filter: {
        isActive: 1,
        $OR: [{ brandName: { LIKE: text } }, { substance: { LIKE: text } }],
        warehouseIds: (value) => {
          try {
            const { warehouseIdList } = settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput
            const v: number[] = JSON.parse(value)
            if (!warehouseIdList.length || warehouseIdList.includes(0)) return true
            if (!v.length || v.includes(0)) return true

            for (let i = 0; i < v.length; i++) {
              if (warehouseIdList.includes(v[i])) {
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
    console.log(
      '🚀 ~ file: TicketOrderSelectProduct.vue:59 ~ searchingProduct ~ productList.value:',
      productList.value
    )
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

const selectProduct = async (instance?: Product) => {
  if (!instance) return clear()

  const vp = TicketProduct.blank()
  vp.productId = instance.id
  vp.deliveryStatus = DeliveryStatus.Pending
  vp.unitRate = instance.unitDefaultRate
  vp.quantity = 0
  vp.quantityPrescription = 0
  vp.expectedPrice = instance.retailPrice
  vp.discountType = DiscountType.Percent
  vp.discountPercent = 0
  vp.discountMoney = 0
  vp.actualPrice = instance.retailPrice
  vp.hintUsage = instance?.hintUsage || ''
  vp.product = Product.from(instance)

  product.value = Product.from(instance)
  productOutSellType.value = 'retailPrice'
  ticketProduct.value = vp

  const batchListResponse = await BatchService.list({
    filter: {
      productId: instance.id,
      quantity: { NOT: 0 },
    },
  })
  batchListResponse.forEach((i) => (i.product = instance))
  batchList.value = batchListResponse

  if (batchListResponse.length) {
    batch.value = batchListResponse[0]
    ticketProductSelectBatch(batchListResponse[0])
  }
}

const selectBatch = (instance: Batch) => {
  batch.value = instance
  ticketProductSelectBatch(instance)
}

const ticketProductSelectBatch = (instance?: Batch) => {
  if (!instance) return
  ticketProduct.value.batch = Batch.from(instance)
  ticketProduct.value.batchId = instance.id
}

const handleChangeInvoiceProductSellType = (
  type: 'costPrice' | 'wholesalePrice' | 'retailPrice'
) => {
  let expectedPrice = 0
  if (type === 'costPrice') {
    expectedPrice = ticketProduct.value.batch?.costPrice || 0
  }
  if (type === 'wholesalePrice') {
    expectedPrice = ticketProduct.value.product?.wholesalePrice || 0
  }
  if (type === 'retailPrice') {
    expectedPrice = ticketProduct.value.product?.retailPrice || 0
  }

  if (ticketProduct.value.discountType === '%') {
    const discountPercent = ticketProduct.value.discountPercent || 0
    const discountMoney = Math.round((expectedPrice * discountPercent) / 100)
    ticketProduct.value.discountMoney = discountMoney
    ticketProduct.value.actualPrice = expectedPrice - discountMoney
  }
  if (ticketProduct.value.discountType === 'VNĐ') {
    const discountMoney = ticketProduct.value.discountMoney || 0
    const discountPercent =
      expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
    ticketProduct.value.discountPercent = discountPercent
    ticketProduct.value.actualPrice = expectedPrice - discountMoney
  }
  ticketProduct.value.expectedPrice = expectedPrice
}

const handleChangeUnitDiscountMoney = (data: number) => {
  const discountMoney = data / ticketProduct.value.unitRate
  const expectedPrice = ticketProduct.value.expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketProduct.value.discountPercent = discountPercent
  ticketProduct.value.discountMoney = discountMoney
  ticketProduct.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeDiscountPercent = (data: number) => {
  const expectedPrice = ticketProduct.value.expectedPrice || 0
  const discountMoney = Math.round((expectedPrice * (data || 0)) / 100)
  ticketProduct.value.discountPercent = data
  ticketProduct.value.discountMoney = discountMoney
  ticketProduct.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeUnitActualPrice = (data: number) => {
  const actualPrice = data / ticketProduct.value.unitRate
  const expectedPrice = ticketProduct.value.expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketProduct.value.discountPercent = discountPercent
  ticketProduct.value.discountMoney = discountMoney
  ticketProduct.value.discountType = DiscountType.VND
  ticketProduct.value.actualPrice = actualPrice
}

const clear = () => {
  product.value = Product.blank()
  productList.value = []
  batch.value = Batch.blank()
  batchList.value = []
  ticketProduct.value = TicketProduct.blank()

  productOutSellType.value = 'retailPrice'
  inputOptionsProduct.value?.clear()
}

const addTicketProduct = () => {
  const { product, batch } = ticketProduct.value
  if (!ticketProduct.value.productId) {
    AlertStore.addError('Lỗi: Chưa chọn sản phẩm')
    return inputOptionsProduct.value?.focus()
  }
  if (ticketProduct.value.quantity <= 0) {
    return AlertStore.addError('Lỗi: Số lượng không hợp lệ')
  }
  if (product?.warehouseIds !== '[]') {
    if (!batch) {
      return AlertStore.addError('Lỗi: Không có lô hàng phù hợp')
    }
    if (!settingStore.SYSTEM_SETTING.allowNegativeQuantity) {
      if (ticketProduct.value.quantity > batch!.quantity) {
        return AlertStore.addError(
          `Lỗi: Số lượng tồn kho không đủ, tồn ${batch!.quantity} lấy ${
            ticketProduct.value.quantity
          }`
        )
      }
    }
  }

  if (settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.allowDuplicateItem) {
    ticket.value.ticketProductList?.push(ticketProduct.value)
  } else {
    const exist = ticket.value.ticketProductList?.find((i) => {
      if (i.batchId) {
        return i.productId === product!.id && i.batchId == batch!.id
      } else {
        return i.productId === product!.id
      }
    })
    if (exist) {
      exist.quantity += ticketProduct.value.quantity
    } else {
      ticket.value.ticketProductList?.push(ticketProduct.value)
    }
  }

  clear()
  if (!isMobile) {
    inputOptionsProduct.value?.focus()
  }
}

const closeExpiryDate = computed(() => {
  return Date.now()
})

const focus = () => {
  inputOptionsProduct.value?.focus()
}
defineExpose({ focus })
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProductUpsert ref="modalProductUpsert" @success="handleModalProductUpsertSuccess" />
  <form class="mt-4 flex flex-wrap gap-4" @submit.prevent="(e) => addTicketProduct()">
    <div style="flex-grow: 1; flex-basis: 80%">
      <div class="flex gap-1 flex-wrap">
        <span>Tên sản phẩm</span>
        <a v-if="product.id" c @click="modalProductDetail?.openModal(product)">
          <IconFileSearch />
        </a>
        <span
          v-if="ticketProduct.productId && ticketProduct.product?.warehouseIds != '[]'"
          :class="
            ticketProduct.quantity > ticketProduct.product!.quantity ? 'text-red-500 font-bold' : ''
          ">
          ( tồn:
          <b>
            {{ ticketProduct.product?.unitQuantity }} {{ ticketProduct.product?.unitDefaultName }}
          </b>
          )
        </span>
      </div>
      <div style="height: 40px">
        <InputOptions
          ref="inputOptionsProduct"
          :options="productList.map((i) => ({ value: i.id, text: i.brandName, data: i }))"
          :maxHeight="320"
          placeholder="(F3) Tìm kiếm sản phẩm và lô hàng bằng tên hoặc hoạt chất của sản phẩm"
          @selectItem="({ data }) => selectProduct(data)"
          @onFocusinFirst="handleFocusFirstSearchProduct"
          @update:text="searchingProduct">
          <template #option="{ item: { data } }">
            <div>
              <b>{{ data.brandName }}</b>
              <span v-if="data.hasManageQuantity">
                - Tồn
                <span
                  style="font-weight: 700"
                  :class="data.unitQuantity <= 0 ? 'text-red-500' : ''">
                  {{ data.unitQuantity }}
                </span>
                {{ data.unitDefaultName }}
              </span>
              - Giá {{ formatMoney(data.unitRetailPrice) }}
            </div>
            <div>{{ data.substance }}</div>
          </template>
        </InputOptions>
      </div>
    </div>

    <div style="flex-grow: 1; flex-basis: 80%">
      <div>
        Lô hàng
        <span v-if="batch?.expiryDate && batch?.expiryDate < closeExpiryDate" class="text-red-500">
          (Hết hạn sử dụng)
        </span>
        <span v-if="product.id && !batchList.length" class="text-red-500 font-bold">
          (Không còn tồn kho)
        </span>
      </div>
      <div>
        <VueSelect
          :value="batch.id"
          :options="batchList.map((i: Batch) => ({ value: i.id, data: i }))"
          :disabled="batchList.length == 0"
          @selectItem="({ data }) => selectBatch(data)">
          <template #option="{ item: { data } }">
            <div v-if="!data.id">Chưa chọn lô</div>
            <div v-if="data.id">
              Lô {{ data.lotNumber }}
              <span :style="data.expiryDate < closeExpiryDate ? 'color:red;' : ''">
                {{ DTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }}
              </span>
              - Tồn
              <b>{{ data.unitQuantity }}</b>
              {{ product.unitDefaultName }}
              - {{ warehouseMap[data.warehouseId]?.name }}
            </div>
          </template>
          <template #text="{ content: { data } }">
            <div v-if="!data?.id">Chưa chọn lô</div>
            <div v-if="data?.id">
              Lô {{ data.lotNumber }}
              <span :style="data.expiryDate < closeExpiryDate ? 'color:red;' : ''">
                {{ DTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }}
              </span>
              <span :class="ticketProduct.quantity > data.quantity ? 'text-red-500 font-bold' : ''">
                - Tồn
                <b>{{ data.unitQuantity }}</b>
                {{ product!.unitDefaultName }}
                - {{ warehouseMap[data.warehouseId]?.name }}
              </span>
            </div>
          </template>
        </VueSelect>
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.hintUsage"
      style="flex-grow: 1; flex-basis: 80%">
      <div>Hướng dẫn sử dụng</div>
      <div>
        <InputHint
          v-model:value="ticketProduct.hintUsage"
          :options="[
            ...(ticketProduct.product?.hintUsage ? [ticketProduct.product?.hintUsage] : []),
            ...settingStore.PRODUCT_HINT_USAGE,
          ]"
          :logic-filter="(item: string, text: string) => customFilter(item, text)" />
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.expectedPrice"
      class="grow basis-[90%] lg:basis-[45%]">
      <div>
        Giá niêm yết
        <span v-if="ticketProduct.unitRate !== 1">
          (
          <b>{{ formatMoney(ticketProduct.expectedPrice) }} /</b>
          {{ ticketProduct?.product?.unitBasicName }})
        </span>
      </div>
      <div class="flex">
        <div style="width: 120px">
          <VueSelect
            v-model:value="productOutSellType"
            :options="[
              ...(permissionIdMap[PermissionId.READ_COST_PRICE] &&
              settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.costPrice
                ? [{ value: 'costPrice', text: 'Giá nhập' }]
                : []),
              ...(settingStore.SYSTEM_SETTING.wholesalePrice
                ? [{ value: 'wholesalePrice', text: 'Giá bán sỉ' }]
                : []),
              ...(settingStore.SYSTEM_SETTING.retailPrice
                ? [{ value: 'retailPrice', text: 'Giá bán lẻ' }]
                : []),
            ]"
            @selectItem="({ value }) => handleChangeInvoiceProductSellType(value)"></VueSelect>
        </div>
        <div class="flex-1">
          <InputMoney :value="ticketProduct.unitExpectedPrice" disabled />
        </div>
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.quantity"
      class="grow basis-[90%] lg:basis-[45%]">
      <div class="flex flex-wrap gap-2">
        Số lượng
        <span v-if="ticketProduct.unitRate !== 1">
          (
          <b>{{ ticketProduct.quantity }}</b>
          {{ ticketProduct?.product?.unitBasicName }} )
        </span>
      </div>
      <div class="flex">
        <div style="width: 120px">
          <VueSelect
            v-model:value="ticketProduct.unitRate"
            :disabled="(ticketProduct.product?.unitObject.length || 0) <= 1"
            :options="
              ticketProduct.product?.unitObject.map((i) => ({
                value: i.rate,
                text: i.name,
                data: i,
              }))
            "
            required />
        </div>
        <div class="flex-1">
          <InputNumber v-model:value="ticketProduct.unitQuantity" :validate="{ gt: 0 }" />
        </div>
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.discount"
      class="grow basis-[90%] lg:basis-[45%]">
      <div>
        Chiết khấu
        <span
          v-if="
            (ticketProduct.discountType === DiscountType.Percent &&
              ticketProduct.discountPercent !== 0) ||
            ticketProduct.unitRate > 1
          ">
          (
          <b>{{ formatMoney(ticketProduct.discountMoney) }}</b>
          <span v-if="ticketProduct?.product?.unitBasicName">
            / {{ ticketProduct?.product?.unitBasicName }}
          </span>
          )
        </span>
      </div>
      <div class="flex">
        <VueSelect
          v-model:value="ticketProduct.discountType"
          style="width: 120px"
          :options="[
            { value: DiscountType.Percent, text: '%' },
            { value: DiscountType.VND, text: 'VNĐ' },
          ]" />
        <div style="width: calc(100% - 120px)">
          <InputMoney
            v-if="ticketProduct.discountType === DiscountType.VND"
            :value="ticketProduct.unitDiscountMoney"
            @update:value="handleChangeUnitDiscountMoney" />
          <InputNumber
            v-else
            :value="ticketProduct.discountPercent"
            @update:value="handleChangeDiscountPercent" />
        </div>
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.actualPrice"
      class="grow basis-[90%] lg:basis-[45%]">
      <div>
        Đơn giá
        <span v-if="ticketProduct.unitRate !== 1">
          (
          <b>{{ formatMoney(ticketProduct.actualPrice) }} /</b>
          {{ ticketProduct.product?.unitBasicName }})
        </span>
      </div>
      <div style="width: 100%">
        <InputMoney
          :value="ticketProduct.unitActualPrice"
          :prepend="ticketProduct.unitRate !== 1 ? ticketProduct.unitName : ''"
          @update:value="handleChangeUnitActualPrice" />
      </div>
    </div>

    <div class="grow basis-[90%] flex justify-center">
      <VueButton color="blue" type="submit" icon="plus">Thêm vào giỏ hàng</VueButton>
    </div>
  </form>
</template>

<style lang="scss"></style>
