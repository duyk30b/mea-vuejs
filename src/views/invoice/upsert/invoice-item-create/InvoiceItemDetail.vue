<script setup lang="ts">
import { ref } from 'vue'
import { InputHint, InputMoney, InputNumber, VueSelect } from '../../../../common/vue-form'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useScreenStore } from '../../../../modules/_me/screen.store'
import { DiscountType } from '../../../../modules/enum'
import { InvoiceItemType } from '../../../../modules/invoice-item/invoice-item.model'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { customFilter } from '../../../../utils'
import { invoiceItem } from './invoice-item.ref'

// cần dùng tabskey chứ không phải invoiceItemType vì ban đầu chưa có invoiceItem
// Chế độ hiển thị thay đổi ngay khi di chuyển tab
const props = withDefaults(defineProps<{ tabsKey: 'product' | 'procedure' }>(), {
  tabsKey: 'product',
})

const screenStore = useScreenStore()
const { formatMoney } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const productOutSellType = ref<'retailPrice' | 'wholesalePrice' | 'costPrice'>('retailPrice')

const handleChangeInvoiceProductSellType = (
  type: 'retailPrice' | 'wholesalePrice' | 'costPrice'
) => {
  let expectedPrice = invoiceItem.value.product?.[type] || 0
  if (invoiceItem.value.discountType === '%') {
    const discountPercent = invoiceItem.value.discountPercent || 0
    const discountMoney = Math.round((expectedPrice * discountPercent) / 100)
    invoiceItem.value.discountMoney = discountMoney
    invoiceItem.value.actualPrice = expectedPrice - discountMoney
  }
  if (invoiceItem.value.discountType === 'VNĐ') {
    const discountMoney = invoiceItem.value.discountMoney || 0
    const discountPercent =
      expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
    invoiceItem.value.discountPercent = discountPercent
    invoiceItem.value.actualPrice = expectedPrice - discountMoney
  }
  invoiceItem.value.expectedPrice = expectedPrice
}

const handleChangeUnitDiscountMoney = (data: number) => {
  const discountMoney = data / invoiceItem.value.unitRate
  const expectedPrice = invoiceItem.value.expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  invoiceItem.value.discountPercent = discountPercent
  invoiceItem.value.discountMoney = discountMoney
  invoiceItem.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeDiscountPercent = (data: number) => {
  const expectedPrice = invoiceItem.value.expectedPrice || 0
  const discountMoney = Math.round((expectedPrice * (data || 0)) / 100)
  invoiceItem.value.discountPercent = data
  invoiceItem.value.discountMoney = discountMoney
  invoiceItem.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeUnitActualPrice = (data: number) => {
  const actualPrice = data / invoiceItem.value.unitRate
  const expectedPrice = invoiceItem.value.expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  invoiceItem.value.discountPercent = discountPercent
  invoiceItem.value.discountMoney = discountMoney
  invoiceItem.value.discountType = DiscountType.VND
  invoiceItem.value.actualPrice = actualPrice
}

const clear = () => {
  productOutSellType.value = 'retailPrice'
}

defineExpose({ clear })
</script>

<template>
  <div class="flex flex-wrap gap-4">
    <div
      v-if="tabsKey === 'product' && screenStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.hintUsage"
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div>Hướng dẫn sử dụng</div>
      <div>
        <InputHint
          v-model:value="invoiceItem.hintUsage"
          :options="[
            ...(invoiceItem.product?.hintUsage ? [invoiceItem.product?.hintUsage] : []),
            ...screenStore.PRODUCT_HINT_USAGE,
          ]"
          :logic-filter="(item: string, text: string) => customFilter(item, text)"
        />
      </div>
    </div>

    <div
      v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.expectedPrice"
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div>
        Giá niêm yết
        <span v-if="invoiceItem.unitRate !== 1">
          (<b>{{ formatMoney(invoiceItem.expectedPrice) }} / </b>
          {{ invoiceItem?.product?.unitBasicName }})
        </span>
      </div>
      <div class="flex">
        <div v-if="tabsKey === 'product'" style="width: 120px">
          <VueSelect
            v-model:value="productOutSellType"
            :options="[
              ...(permissionIdMap[PermissionId.PRODUCT_BATCH_READ_COST_PRICE] &&
              screenStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.costPrice
                ? [{ value: 'costPrice', text: 'Giá nhập' }]
                : []),
              ...(screenStore.SYSTEM_SETTING.wholesalePrice
                ? [{ value: 'wholesalePrice', text: 'Giá bán sỉ' }]
                : []),
              ...(screenStore.SYSTEM_SETTING.retailPrice
                ? [{ value: 'retailPrice', text: 'Giá bán lẻ' }]
                : []),
            ]"
            @selectItem="({ value }) => handleChangeInvoiceProductSellType(value)"
          >
          </VueSelect>
        </div>
        <div class="flex-1">
          <InputMoney :value="invoiceItem.unitExpectedPrice" disabled />
        </div>
      </div>
    </div>

    <div
      v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.quantity"
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div>
        Số lượng
        <span
          v-if="invoiceItem.type === InvoiceItemType.ProductHasManageQuantity"
          :class="
            invoiceItem.quantity > (invoiceItem.product?.quantity || 0)
              ? 'text-red-500 font-bold'
              : ''
          "
        >
          (tồn: <b>{{ (invoiceItem.product?.quantity || 0) / invoiceItem.unitRate }}</b
          >)
        </span>
        <span
          v-if="invoiceItem.type === InvoiceItemType.Batch"
          :class="
            invoiceItem.quantity > (invoiceItem.batch?.quantity || 0)
              ? 'text-red-500 font-bold'
              : ''
          "
        >
          (tồn: <b>{{ (invoiceItem.batch?.quantity || 0) / invoiceItem.unitRate }}</b
          >)
        </span>
        <span v-if="invoiceItem.unitRate !== 1">
          (<b>{{ invoiceItem.quantity }}</b> {{ invoiceItem?.product?.unitBasicName }})
        </span>
      </div>
      <div class="flex">
        <div style="width: 120px">
          <VueSelect
            v-model:value="invoiceItem.unitRate"
            :disabled="(invoiceItem.product?.unitObject.length || 0) <= 1"
            :options="
              invoiceItem.product?.unitObject.map((i) => ({ value: i.rate, text: i.name, data: i }))
            "
            required
          >
          </VueSelect>
        </div>
        <div class="flex-1">
          <InputNumber v-model:value="invoiceItem.unitQuantity" :validate="{ gt: 0 }" />
        </div>
      </div>
    </div>

    <div
      v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.discount"
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div>
        Chiết khấu
        <span
          v-if="
            (invoiceItem.discountType === DiscountType.Percent &&
              invoiceItem.discountPercent !== 0) ||
            invoiceItem.unitRate > 1
          "
        >
          (<b>{{ formatMoney(invoiceItem.discountMoney) }}</b>
          {{ invoiceItem.productId ? ' / ' + invoiceItem?.product?.unitBasicName : '' }}
          )
        </span>
      </div>
      <div class="flex">
        <VueSelect
          v-model:value="invoiceItem.discountType"
          style="width: 120px"
          :options="[
            { value: DiscountType.Percent, text: '%' },
            { value: DiscountType.VND, text: 'VNĐ' },
          ]"
        />
        <div style="width: calc(100% - 120px)">
          <InputMoney
            v-if="invoiceItem.discountType === DiscountType.VND"
            :value="invoiceItem.unitDiscountMoney"
            @update:value="handleChangeUnitDiscountMoney"
          />
          <InputNumber
            v-else
            :value="invoiceItem.discountPercent"
            @update:value="handleChangeDiscountPercent"
          />
        </div>
      </div>
    </div>

    <div
      v-if="screenStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.actualPrice"
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div>
        Đơn giá
        <span v-if="invoiceItem.unitRate !== 1">
          (<b>{{ formatMoney(invoiceItem.actualPrice) }} / </b>
          {{ invoiceItem.product?.unitBasicName }})
        </span>
      </div>
      <div style="width: 100%">
        <InputMoney
          :value="invoiceItem.unitActualPrice"
          :prepend="invoiceItem.unitRate !== 1 ? invoiceItem.unitName : ''"
          @update:value="handleChangeUnitActualPrice"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss"></style>
