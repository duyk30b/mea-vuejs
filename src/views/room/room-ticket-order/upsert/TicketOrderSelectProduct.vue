<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconFileSearch } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert'
import {
  InputHint,
  InputMoney,
  InputNumber,
  InputOptions,
  InputSelect,
  VueSelect,
} from '@/common/vue-form'
import { MeService } from '@/modules/_me/me.service.ts'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Batch, BatchService } from '@/modules/batch'
import { DeliveryStatus, DiscountType, PickupStrategy, ProductType } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Product, ProductService } from '@/modules/product'
import { TicketProduct } from '@/modules/ticket-product'
import type { Warehouse } from '@/modules/warehouse'
import { WarehouseService } from '@/modules/warehouse/warehouse.service'
import { customFilter, ESTimer } from '@/utils'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import ModalProductUpsert from '@/views/product/upsert/ModalProductUpsert.vue'
import { onMounted, ref } from 'vue'
import { ticketOrderUpsertRef } from './ticket-order-upsert.ref'

const inputOptionsProduct = ref<InstanceType<typeof InputOptions>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProductUpsert = ref<InstanceType<typeof ModalProductUpsert>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const product = ref(Product.blank())
const productList = ref<Product[]>([])
const batch = ref(Batch.blank())
const batchList = ref<Batch[]>([])

const ticketProduct = ref<TicketProduct>(TicketProduct.blank())
const productOutSellType = ref<'retailPrice' | 'wholesalePrice' | 'costPrice'>('retailPrice')

const warehouseMap = ref<Record<string, Warehouse>>({})

onMounted(async () => {
  warehouseMap.value = await WarehouseService.getMap()
})

const handleFocusFirstSearchProduct = async () => {
  await Promise.all([ProductService.refreshDB(), BatchService.refreshDB()])
}

const searchingProduct = async (text: string) => {
  if (!text) {
    productList.value = []
  } else {
    productList.value = await ProductService.list({
      filter: {
        isActive: 1,
        $AND: [
          {
            $OR: [
              { productCode: { LIKE: text } },
              { brandName: { LIKE: text } },
              { substance: { LIKE: text } },
            ],
          },
          {
            $OR: [
              {
                quantity: settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput
                  .searchIncludeZeroQuantity
                  ? undefined
                  : { NOT: 0 },
              },
              { warehouseIds: '[]' },
            ],
          },
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
    text: instance?.brandName || '',
    data: instance,
    value: instance?.id,
  })
  selectProduct(instance)
}

const selectProduct = async (productProp?: Product) => {
  if (!productProp) return clear()

  const tpItem = TicketProduct.blank()
  tpItem.productId = productProp.id
  tpItem.product = Product.from(productProp)

  tpItem.pickupStrategy = MeService.getPickupStrategy(productProp).order

  tpItem.deliveryStatus = DeliveryStatus.Pending
  tpItem.unitRate = productProp.unitDefaultRate
  tpItem.unitQuantity = 0

  tpItem.unitExpectedPrice = productProp.retailPrice * productProp.unitDefaultRate
  tpItem.discountType = DiscountType.Percent
  tpItem.discountPercent = 0
  tpItem.unitDiscountMoney = 0
  tpItem.unitActualPrice = productProp.retailPrice * productProp.unitDefaultRate

  tpItem.createdAt = Date.now()

  await ProductService.executeRelation([productProp], { discountList: true })
  const discountApply = productProp?.discountApply
  if (discountApply) {
    let { discountType, discountPercent, discountMoney } = discountApply
    const expectedPrice = Math.floor((tpItem.unitExpectedPrice || 0) / tpItem.unitRate)
    if (discountType === DiscountType.Percent) {
      discountMoney = Math.round((expectedPrice * (discountPercent || 0)) / 100)
    }
    if (discountType === DiscountType.VND) {
      discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
    }
    tpItem.discountType = discountType
    tpItem.discountPercent = discountPercent
    tpItem.unitDiscountMoney = discountMoney * tpItem.unitRate
    tpItem.unitActualPrice = tpItem.unitExpectedPrice - tpItem.unitDiscountMoney
  }

  if (settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.hintUsage) {
    tpItem.hintUsage = productProp?.hintUsage || ''
  }

  tpItem.warehouseIds = JSON.stringify(
    settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.warehouseIdList,
  )

  product.value = Product.from(productProp)
  productOutSellType.value = 'retailPrice'
  ticketProduct.value = tpItem

  if (!settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.buttonSubmit) {
    addTicketProduct()
    return // Vào chế độ này rồi thì không thể chọn lô
  }

  // Tính toán cho batchID // lằng nhằng nhé
  if (productProp.productType === ProductType.SplitBatch) {
    const warehouseIdAcceptList: number[] =
      settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.warehouseIdList
    let canGetAllWarehouse = false
    if (!warehouseIdAcceptList.length) canGetAllWarehouse = true
    else if (warehouseIdAcceptList.includes(0)) canGetAllWarehouse = true
    const batchListFetch = await BatchService.list({
      filter: {
        productId: productProp.id,
        ...(canGetAllWarehouse
          ? {}
          : {
              $OR: [{ warehouseId: { EQUAL: 0 } }, { warehouseId: { IN: warehouseIdAcceptList } }],
            }),
      },
    })
    let batchListResponse = batchListFetch
      .filter((i) => !!i.quantity)
      .sort((a, b) => {
        if (a.expiryDate == null && b.expiryDate == null) {
          return a.registeredAt < b.registeredAt ? 1 : -1 // registeredAt xếp theo DESC
        }
        if (b.expiryDate == null) return -1
        if (a.expiryDate == null) return 1
        return a.expiryDate < b.expiryDate ? -1 : 1 // HSD xếp theo ASC
      })
    if (settingStore.PRODUCT_SETTING.allowNegativeQuantity && batchListResponse.length < 5) {
      let batchZero = batchListFetch
        .filter((i) => !i.quantity)
        .sort((a, b) => {
          if (a.expiryDate == null && b.expiryDate == null) {
            return a.registeredAt < b.registeredAt ? 1 : -1 // registeredAt xếp theo DESC
          }
          if (b.expiryDate == null) return 1
          if (a.expiryDate == null) return -1
          return a.expiryDate > b.expiryDate ? -1 : 1 // HSD xếp theo DESC
        })
      batchZero = batchZero.slice(0, 5 - batchListResponse.length)
      batchListResponse = [...batchListResponse, ...batchZero]
    }
    batchListResponse.forEach((i) => (i.product = productProp))
    batchList.value = batchListResponse
    if (batchListResponse.length) {
      selectBatch(batchListResponse[0])
    } else {
      selectBatch(Batch.blank())
    }
  }
}

const selectBatch = (batchSelected: Batch) => {
  if (!batchSelected) return
  ticketProduct.value.batch = Batch.from(batchSelected)
  ticketProduct.value.batchId = batchSelected.id
  ticketProduct.value.warehouseIds = JSON.stringify([batchSelected.warehouseId])
}

const handleChangeInvoiceProductSellType = (
  type: 'costPrice' | 'wholesalePrice' | 'retailPrice',
) => {
  let unitExpectedPrice = 0
  if (type === 'costPrice') {
    unitExpectedPrice = (ticketProduct.value.product?.costPrice || 0) * ticketProduct.value.unitRate
  }
  if (type === 'wholesalePrice') {
    unitExpectedPrice =
      (ticketProduct.value.product?.wholesalePrice || 0) * ticketProduct.value.unitRate
  }
  if (type === 'retailPrice') {
    unitExpectedPrice =
      (ticketProduct.value.product?.retailPrice || 0) * ticketProduct.value.unitRate
  }

  if (ticketProduct.value.discountType === '%') {
    const discountPercent = ticketProduct.value.discountPercent || 0
    const unitDiscountMoney = Math.round((unitExpectedPrice * discountPercent) / 100)
    ticketProduct.value.unitDiscountMoney = unitDiscountMoney
    ticketProduct.value.unitActualPrice = unitExpectedPrice - unitDiscountMoney
  }
  if (ticketProduct.value.discountType === 'VNĐ') {
    const unitDiscountMoney = ticketProduct.value.unitDiscountMoney || 0
    const discountPercent =
      unitExpectedPrice == 0 ? 0 : Math.round((unitDiscountMoney * 100) / unitExpectedPrice)
    ticketProduct.value.discountPercent = discountPercent
    ticketProduct.value.unitActualPrice = unitExpectedPrice - unitDiscountMoney
  }
  ticketProduct.value.unitExpectedPrice = unitExpectedPrice
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
    AlertStore.addError('Lỗi: Sản phẩm không phù hợp')
    return inputOptionsProduct.value?.focus()
  }
  if (!Number.isInteger(ticketProduct.value.unitQuantity)) {
    return AlertStore.addWarning('Lỗi: Số lượng phải là 1 số nguyên dương')
  }

  if (
    product?.warehouseIds !== '[]' &&
    ticketProduct.value.pickupStrategy !== PickupStrategy.NoImpact
  ) {
    if (ticketProduct.value.unitQuantity * ticketProduct.value.unitRate > product!.quantity) {
      AlertStore.addWarning(
        `Cảnh báo: ${product!.brandName} không đủ tồn kho, còn ${product!.quantity} lấy ${
          ticketProduct.value.unitQuantity * ticketProduct.value.unitRate
        }`,
      )
    }
    if (
      ticketProduct.value.batchId &&
      ticketProduct.value.unitQuantity * ticketProduct.value.unitRate > batch!.quantity
    ) {
      AlertStore.addWarning(
        `Cảnh báo: ${product!.brandName} không đủ tồn kho, còn ${batch!.quantity} lấy ${
          ticketProduct.value.unitQuantity * ticketProduct.value.unitRate
        }`,
      )
    }
  }

  if (settingStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.allowDuplicateItem) {
    ticketOrderUpsertRef.value.ticketProductList?.push(ticketProduct.value)
  } else {
    const exist = ticketOrderUpsertRef.value.ticketProductList?.find((i: any) => {
      return i.productId === product!.id
    })
    if (exist) {
      exist.unitQuantity += Number(
        (
          (ticketProduct.value.unitQuantity * ticketProduct.value.unitRate) /
          exist.unitRate
        ).toFixed(3),
      )
    } else {
      ticketOrderUpsertRef.value.ticketProductList?.push(ticketProduct.value)
    }
  }

  clear()

  if (!settingStore.isMobile) {
    focus()
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
          v-if="ticketProduct.productId && ticketProduct.product?.warehouseIds !== '[]'"
          :class="
            ticketProduct.unitQuantity * ticketProduct.unitRate > ticketProduct.product!.quantity
              ? 'text-red-500 font-bold'
              : ''
          "
        >
          ( tồn:
          <b>
            {{ ticketProduct.product?.unitQuantity }} {{ ticketProduct.product?.unitDefaultName }}
          </b>
          )
        </span>
        <a
          v-if="userPermission[PermissionId.PRODUCT_UPDATE] && product.id"
          @click="modalProductUpsert?.openModal(product.id)"
        >
          Sửa thông tin sản phẩm
        </a>
      </div>
      <div style="height: 40px">
        <InputOptions
          ref="inputOptionsProduct"
          :clearAfterSelected="!settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.buttonSubmit"
          :maxHeight="320"
          :options="productList.map((i) => ({ value: i.id, text: i.brandName, data: i }))"
          :prepend="ticketProduct?.product?.productCode"
          placeholder="(F3) Tìm kiếm bằng mã, tên hoặc hoạt chất của sản phẩm"
          required
          @onFocusinFirst="handleFocusFirstSearchProduct"
          @searching="searchingProduct"
          @selectItem="({ data }) => selectProduct(data)"
        >
          <template #option="{ item: { data } }">
            <div>
              <span>{{ data.productCode }}</span>
              <span class="mx-1">-</span>
              <b>{{ data.brandName }}</b>
              <span
                v-if="
                  data?.warehouseIds !== '[]' &&
                  ticketProduct.pickupStrategy !== PickupStrategy.NoImpact
                "
              >
                - Tồn
                <span
                  :class="data.unitQuantity <= 0 ? 'text-red-500' : ''"
                  style="font-weight: 700"
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
      v-if="ticketProduct.product?.productType === ProductType.SplitBatch"
      style="flex-grow: 1; flex-basis: 80%"
    >
      <div>
        Lô hàng
        <span
          v-if="ticketProduct.batch?.expiryDate && ticketProduct.batch?.expiryDate < Date.now()"
          class="text-red-500 font-bold"
        >
          (Hết hạn sử dụng)
        </span>
        <span v-if="ticketProduct.productId && !batchList.length" class="text-red-500 font-bold">
          (Không còn tồn kho)
        </span>
      </div>
      <div>
        <VueSelect
          :disabled="batchList.length == 0"
          :options="batchList.map((i: Batch) => ({ value: i.id, data: i }))"
          :value="ticketProduct.batch!.id"
          @selectItem="({ data }) => selectBatch(data)"
        >
          <template #option="{ item: { data } }">
            <div v-if="!data.id">Chưa chọn lô</div>
            <div v-if="data.id">
              Lô {{ data.lotNumber }} {{ ESTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }} - Tồn
              <b>{{ data.unitQuantity }}</b>
              {{ ticketProduct.product!.unitDefaultName }}
            </div>
          </template>
          <template #text="{ content: { data } }">
            <div v-if="!data?.id">Chưa chọn lô</div>
            <div v-if="data?.id">
              Lô {{ data.lotNumber }} {{ ESTimer.timeToText(data.expiryDate, 'DD/MM/YYYY') }}
              <span
                :class="
                  ticketProduct.unitQuantity * ticketProduct.unitRate > data.quantity
                    ? 'text-red-500 font-bold'
                    : ''
                "
              >
                - Tồn
                <b>{{ data.unitQuantity }}</b>
                {{ ticketProduct.product!.unitDefaultName }}
              </span>
            </div>
          </template>
        </VueSelect>
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
          :logic-filter="(item: string, text: string) => customFilter(item, text)"
          :options="[
            ...(ticketProduct.product?.hintUsage ? [ticketProduct.product?.hintUsage] : []),
            ...settingStore.PRODUCT_HINT_USAGE,
          ]"
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
          <b>{{ formatMoney(ticketProduct.expectedPrice) }}</b>
          <span v-if="ticketProduct?.product?.unitBasicName">
            / {{ ticketProduct?.product?.unitBasicName }})
          </span>
        </span>
      </div>
      <div class="flex">
        <div style="width: 120px">
          <InputSelect
            v-model:value="productOutSellType"
            :options="[
              ...(userPermission[PermissionId.PRODUCT_READ_COST_PRICE] &&
              settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.costPrice
                ? [{ value: 'costPrice', label: 'Giá nhập' }]
                : []),
              ...(settingStore.SYSTEM_SETTING.wholesalePrice
                ? [{ value: 'wholesalePrice', label: 'Giá bán sỉ' }]
                : []),
              { value: 'retailPrice', label: 'Giá bán lẻ' },
            ]"
            @selectItem="({ value }) => handleChangeInvoiceProductSellType(value)"
            :tabindex="-1"
          ></InputSelect>
        </div>
        <div class="flex-1">
          <InputMoney
            :value="ticketProduct.unitExpectedPrice"
            @update:value="(v) => ticketProduct.changeUnitExpectedPrice(v)"
          />
        </div>
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.quantity"
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div class="flex flex-wrap gap-1">
        <span>Số lượng</span>
        <span v-if="ticketProduct.unitRate !== 1">
          (
          <b>{{ ticketProduct.quantity }}</b>
          {{ ticketProduct?.product?.unitBasicName }} )
        </span>
      </div>
      <div class="flex">
        <div style="width: 120px">
          <InputSelect
            :value="ticketProduct.unitRate"
            :disabled="(ticketProduct.product?.unitObject.length || 0) <= 1"
            :options="
              (ticketProduct.product?.unitObject || []).map((i) => ({
                value: i.rate,
                label: i.name,
                data: i,
              }))
            "
            @update:value="(value: any) => ticketProduct.changeUnitRate(value)"
            :tabindex="-1"
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
        <span>Chiết khấu</span>
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
        <InputSelect
          v-model:value="ticketProduct.discountType"
          :options="[
            { value: DiscountType.Percent, label: '%' },
            { value: DiscountType.VND, label: 'VNĐ' },
          ]"
          style="width: 120px"
          :tabindex="-1"
        />
        <div style="width: calc(100% - 120px)">
          <InputMoney
            v-if="ticketProduct.discountType === DiscountType.VND"
            :validate="{ gte: 0 }"
            :value="ticketProduct.unitDiscountMoney"
            @update:value="(v) => ticketProduct.changeUnitDiscountMoney(v)"
          />
          <InputNumber
            v-else
            :validate="{ gte: 0, lte: 100 }"
            :value="ticketProduct.discountPercent"
            @update:value="(v) => ticketProduct.changeDiscountPercent(v)"
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
          <b>
            {{ formatMoney(Math.floor(ticketProduct.unitActualPrice / ticketProduct.unitRate)) }} /
          </b>
          {{ ticketProduct.product?.unitBasicName }})
        </span>
      </div>
      <div style="width: 100%">
        <InputMoney
          :prepend="ticketProduct.unitRate !== 1 ? ticketProduct.unitName : ''"
          :value="ticketProduct.unitActualPrice"
          @update:value="(v) => ticketProduct.changeUnitActualPrice(v)"
        />
      </div>
    </div>

    <div
      v-if="settingStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.buttonSubmit"
      class="flex justify-center"
      style="flex-grow: 1; flex-basis: 80%"
    >
      <VueButton color="blue" icon="plus" type="submit">Thêm vào giỏ hàng</VueButton>
    </div>
  </form>
</template>

<style lang="scss"></style>
