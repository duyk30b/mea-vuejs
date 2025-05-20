<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconFileSearch } from '../../../common/icon-antd'
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
import { Batch } from '../../../modules/batch'
import { DeliveryStatus, DiscountType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Product, ProductService } from '../../../modules/product'
import { TicketProduct } from '../../../modules/ticket-product'
import type { Warehouse } from '../../../modules/warehouse'
import { WarehouseService } from '../../../modules/warehouse/warehouse.service'
import { customFilter } from '../../../utils'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import ModalProductUpsert from '../../product/upsert/ModalProductUpsert.vue'
import { ticketOrderUpsertRef } from './ticket-order-upsert.ref'

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
const warehouseIdOptions = ref<number[]>([0])

onMounted(async () => {
  console.log('🚀 ~ file: TicketOrderSelectProduct.vue:45  ~ onMounted')
  warehouseMap.value = await WarehouseService.getMap()
})

const handleFocusFirstSearchProduct = async () => {
  await Promise.all([ProductService.refreshDB()])
}

const searchingProduct = async (text: string) => {
  if (!text) {
    productList.value = []
  } else {
    productList.value = await ProductService.list({
      filter: {
        isActive: 1,
        $OR: [
          { productCode: { LIKE: text } },
          { brandName: { LIKE: text } },
          { substance: { LIKE: text } },
        ],
        warehouseIds: (value) => {
          try {
            const warehouseIdAcceptList =
              settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.warehouseIdList
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

const handleModalProductUpsertSuccess = (instance?: Product) => {
  inputOptionsProduct.value?.setItem({
    text: instance?.brandName,
    data: instance,
    value: instance?.id,
  })
  selectProduct(instance)
}

const selectProduct = async (productProp?: Product) => {
  if (!productProp) return clear()

  const tp = TicketProduct.blank()
  tp.productId = productProp.id
  tp.product = Product.from(productProp)

  tp.deliveryStatus = DeliveryStatus.Pending
  tp.unitRate = productProp.unitDefaultRate
  tp.quantity = 0

  tp.expectedPrice = productProp.retailPrice
  tp.discountType = DiscountType.Percent
  tp.discountPercent = 0
  tp.discountMoney = 0
  tp.actualPrice = productProp.retailPrice
  if (settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.hintUsage) {
    tp.hintUsage = productProp?.hintUsage || ''
  }

  tp.warehouseId = 0 // chưa có setup chọn warehouseId
  tp.costAmount = tp.quantity * (tp.product.quantity || 0) // xuất hàng mới tính được costAmount, đây chỉ là tính lãi tạm thời

  if (productProp.hasManageQuantity) {
    tp.hasInventoryImpact = 1 // có thể thêm lựa chọn impact = 0 khi thêm config bán hàng ko số lượng
  } else {
    tp.hasInventoryImpact = 0 // không quản lý số lượng thì impact phải là 0
  }

  product.value = Product.from(productProp)
  productOutSellType.value = 'retailPrice'
  ticketProduct.value = tp

  // tính toán cho warehouseID
  const warehouseIdAcceptList: number[] =
    settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.warehouseIdList
  const productWarehouseIdList: number[] = JSON.parse(productProp.warehouseIds)
  if (!warehouseIdAcceptList.length || warehouseIdAcceptList.includes(0)) {
    warehouseIdOptions.value = [0]
  } else if (!productWarehouseIdList.length || productWarehouseIdList.includes(0)) {
    warehouseIdOptions.value = [0]
  } else {
    // trường hợp này có thể có nhiều warehouseID, thôi kệ, code sau
    warehouseIdOptions.value = []
    warehouseIdAcceptList.forEach((i) => {
      if (productWarehouseIdList.includes(i)) {
        warehouseIdOptions.value.push(i)
      }
    })
  }
  ticketProduct.value.warehouseId = warehouseIdOptions.value[0]

  let canGetAllWarehouse = false
  if (!warehouseIdAcceptList.length) canGetAllWarehouse = true
  else if (warehouseIdAcceptList.includes(0)) canGetAllWarehouse = true
}

const handleChangeInvoiceProductSellType = (
  type: 'costPrice' | 'wholesalePrice' | 'retailPrice',
) => {
  let expectedPrice = 0
  if (type === 'costPrice') {
    expectedPrice = ticketProduct.value.product?.costPrice || 0
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
  const { product } = ticketProduct.value
  if (!ticketProduct.value.productId) {
    AlertStore.addError('Lỗi: Sản phẩm không phù hợp')
    return inputOptionsProduct.value?.focus()
  }

  if (product?.hasManageQuantity) {
    if (ticketProduct.value.quantity > product!.quantity) {
      AlertStore.addWarning(
        `Cảnh báo: ${product.brandName} không đủ tồn kho, còn ${product!.quantity} lấy ${
          ticketProduct.value.quantity
        }`,
      )
    }
  }

  if (settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.allowDuplicateItem) {
    ticketOrderUpsertRef.value.ticketProductList?.push(ticketProduct.value)
  } else {
    const exist = ticketOrderUpsertRef.value.ticketProductList?.find((i) => {
      return i.productId === product!.id
    })
    if (exist) {
      exist.quantity += ticketProduct.value.quantity
    } else {
      ticketOrderUpsertRef.value.ticketProductList?.push(ticketProduct.value)
    }
  }

  clear()
  if (!isMobile) {
    inputOptionsProduct.value?.focus()
  }
}

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
          v-if="ticketProduct.productId && ticketProduct.product?.hasManageQuantity"
          :class="
            ticketProduct.quantity > ticketProduct.product!.quantity ? 'text-red-500 font-bold' : ''
          "
        >
          ( tồn:
          <b>
            {{ ticketProduct.product?.unitQuantity }} {{ ticketProduct.product?.unitDefaultName }}
          </b>
          )
        </span>
        <a
          v-if="permissionIdMap[PermissionId.PRODUCT_UPDATE] && product.id"
          @click="modalProductUpsert?.openModal(product.id)"
        >
          Sửa thông tin sản phẩm
        </a>
      </div>
      <div style="height: 40px">
        <InputOptions
          ref="inputOptionsProduct"
          :options="productList.map((i) => ({ value: i.id, text: i.brandName, data: i }))"
          :maxHeight="320"
          :prepend="ticketProduct?.product?.productCode"
          placeholder="(F3) Tìm kiếm bằng mã, tên hoặc hoạt chất của sản phẩm"
          required
          @selectItem="({ data }) => selectProduct(data)"
          @onFocusinFirst="handleFocusFirstSearchProduct"
          @update:text="searchingProduct"
        >
          <template #option="{ item: { data } }">
            <div>
              <span>{{ data.productCode }}</span>
              <span class="mx-1">-</span>
              <b>{{ data.brandName }}</b>
              <span v-if="data.hasManageQuantity">
                - Tồn
                <span
                  style="font-weight: 700"
                  :class="data.unitQuantity <= 0 ? 'text-red-500' : ''"
                >
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

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.hintUsage"
      style="flex-grow: 1; flex-basis: 80%"
    >
      <div>Hướng dẫn sử dụng</div>
      <div>
        <InputHint
          v-model:value="ticketProduct.hintUsage"
          :options="[
            ...(ticketProduct.product?.hintUsage ? [ticketProduct.product?.hintUsage] : []),
            ...settingStore.PRODUCT_HINT_USAGE,
          ]"
          :logic-filter="(item: string, text: string) => customFilter(item, text)"
        />
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.expectedPrice"
      class="grow basis-[90%] lg:basis-[45%]"
    >
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
            @selectItem="({ value }) => handleChangeInvoiceProductSellType(value)"
          ></VueSelect>
        </div>
        <div class="flex-1">
          <InputMoney :value="ticketProduct.unitExpectedPrice" disabled />
        </div>
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.quantity"
      class="grow basis-[90%] lg:basis-[45%]"
    >
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
              (ticketProduct.product?.unitObject || []).map((i) => ({
                value: i.rate,
                text: i.name,
                data: i,
              }))
            "
            required
          />
        </div>
        <div class="flex-1">
          <InputNumber v-model:value="ticketProduct.unitQuantity" :validate="{ gt: 0 }" />
        </div>
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.discount"
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div>
        Chiết khấu
        <span
          v-if="
            (ticketProduct.discountType === DiscountType.Percent &&
              ticketProduct.discountPercent !== 0) ||
            ticketProduct.unitRate > 1
          "
        >
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
          ]"
        />
        <div style="width: calc(100% - 120px)">
          <InputMoney
            v-if="ticketProduct.discountType === DiscountType.VND"
            :value="ticketProduct.unitDiscountMoney"
            @update:value="handleChangeUnitDiscountMoney"
          />
          <InputNumber
            v-else
            :value="ticketProduct.discountPercent"
            @update:value="handleChangeDiscountPercent"
          />
        </div>
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.actualPrice"
      class="grow basis-[90%] lg:basis-[45%]"
    >
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
          @update:value="handleChangeUnitActualPrice"
        />
      </div>
    </div>

    <div style="flex-grow: 1; flex-basis: 80%" class="flex justify-center">
      <VueButton color="blue" type="submit" icon="plus">Thêm vào giỏ hàng</VueButton>
    </div>
  </form>
</template>

<style lang="scss"></style>
