<script setup lang="ts">
import { InputMoney, InputNumber, VueSelect } from '@/common/vue-form'
import { DiscountType } from '@/modules/enum'
import { InvoiceItem } from '@/modules/invoice'
import { useOrganizationStore } from '@/store/organization.store'
import { convertViToEn } from '@/utils'
import { PlusOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'addInvoiceItem', value: InvoiceItem): void }>()

const props = withDefaults(defineProps<{ tabsKey: 'product' | 'procedure' }>(), {
  tabsKey: 'product',
})

const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const invoiceItem = ref<InvoiceItem>(InvoiceItem.blank())

const productOutSellType = ref<'retailPrice' | 'wholesalePrice' | 'costPrice'>('retailPrice')

const setInvoiceItem = (data: InvoiceItem) => {
  invoiceItem.value = data
}

const handleChangeSelectUnit = (rate: number) => {
  const unit = invoiceItem.value.productBatch!.product!.unit.find((i) => i.rate === rate)
  invoiceItem.value.unit = { name: unit!.name, rate: unit!.rate }
}

const handleChangeInvoiceProductSellType = (
  type: 'retailPrice' | 'wholesalePrice' | 'costPrice'
) => {
  let expectedPrice = invoiceItem.value.productBatch?.[type] || 0

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
  const discountMoney = data / invoiceItem.value.unit.rate
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
  const actualPrice = data / invoiceItem.value.unit.rate
  const expectedPrice = invoiceItem.value.expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  invoiceItem.value.discountPercent = discountPercent
  invoiceItem.value.discountMoney = discountMoney
  invoiceItem.value.discountType = DiscountType.VND
  invoiceItem.value.actualPrice = actualPrice
}

const filterOption = (input: string, option: any) => {
  const inputText = convertViToEn(input).toLowerCase()
  const optionLabel = convertViToEn(option.label || option.value).toLowerCase()
  return optionLabel.indexOf(inputText) >= 0
}

const addInvoiceItem = () => {
  const ii = InvoiceItem.clone(invoiceItem.value)
  emit('addInvoiceItem', ii)
}

defineExpose({ setInvoiceItem })
</script>

<template>
  <form class="flex flex-wrap gap-4" @submit.prevent="(e) => addInvoiceItem()">
    <div
      v-if="
        tabsKey === 'product' && organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.hintUsage
      "
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div>Hướng dẫn sử dụng</div>
      <a-auto-complete
        v-model:value="invoiceItem.hintUsage"
        :filter-option="filterOption"
        :options="organizationStore.PRODUCT_HINT_USAGE.map((i) => ({ value: i }))"
        class="w-full"
      />
    </div>

    <div
      v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.expectedPrice"
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div>
        Giá niêm yết
        <span v-if="invoiceItem.unit.rate !== 1">
          (Quy đổi: <b>{{ formatMoney(invoiceItem.expectedPrice) }} / </b>
          {{ invoiceItem.productBatch?.product!.unitBasicName }})
        </span>
      </div>
      <div class="flex">
        <a-select
          v-if="tabsKey === 'product'"
          v-model:value="productOutSellType"
          style="width: 120px"
          @change="handleChangeInvoiceProductSellType"
        >
          <a-select-option
            v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.retailPrice"
            value="retailPrice"
          >
            Giá bán lẻ
          </a-select-option>
          <a-select-option
            v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.wholesalePrice"
            value="wholesalePrice"
          >
            Giá bán sỉ
          </a-select-option>
          <a-select-option
            v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.costPrice"
            value="costPrice"
          >
            Giá nhập
          </a-select-option>
        </a-select>
        <div class="flex-1">
          <InputMoney :value="invoiceItem.unitExpectedPrice" disabled />
        </div>
      </div>
    </div>

    <div
      v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.quantity"
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div>
        Số lượng
        <span v-if="invoiceItem.unit.rate !== 1">
          (Quy đổi: <b>{{ invoiceItem.quantity }}</b>
          {{ invoiceItem.productBatch?.product!.unitBasicName }})
        </span>
      </div>
      <div class="flex">
        <a-select
          :value="invoiceItem.unit.rate"
          style="flex-basis: 80px"
          :disabled="(invoiceItem.productBatch?.product!.unit!.length || 0) <= 1"
          @change="handleChangeSelectUnit"
        >
          <a-select-option
            v-for="(item, index) in invoiceItem.productBatch?.product!.unit || [
              { name: '', rate: 1 },
            ]"
            :key="index"
            :value="item.rate"
          >
            {{ item.name }}
          </a-select-option>
        </a-select>
        <div class="flex-1">
          <InputNumber v-model:value="invoiceItem.unitQuantity" />
        </div>
      </div>
    </div>

    <div
      v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.discount"
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div>
        Chiết khấu
        <span
          v-if="
            (invoiceItem.discountType === DiscountType.Percent &&
              invoiceItem.discountPercent !== 0) ||
            invoiceItem.unit.rate > 1
          "
        >
          <b>(Quy đổi: {{ formatMoney(invoiceItem.discountMoney) }}</b>
          {{
            tabsKey === 'product' ? ' / ' + invoiceItem.productBatch?.product!.unitBasicName : ''
          }})
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
            v-if="invoiceItem.discountType === DiscountType.Percent"
            :value="invoiceItem.discountPercent"
            @update:value="handleChangeDiscountPercent"
          />
        </div>
      </div>
    </div>

    <div
      v-if="organizationStore.SCREEN_INVOICE_UPSERT.invoiceItemInput.actualPrice"
      class="grow basis-[90%] lg:basis-[45%]"
    >
      <div>
        Đơn giá
        <span v-if="invoiceItem.unit.rate !== 1">
          (Quy đổi: <b>{{ formatMoney(invoiceItem.actualPrice) }} / </b>
          {{ invoiceItem.productBatch?.product!.unitBasicName }})
        </span>
      </div>
      <div style="width: 100%">
        <InputMoney
          :value="invoiceItem.unitActualPrice"
          :prepend="invoiceItem.unit.rate !== 1 ? invoiceItem.unit.name : ''"
          @update:value="handleChangeUnitActualPrice"
        />
      </div>
    </div>

    <div class="grow basis-[90%] text-center">
      <a-button type="primary" htmlType="submit">
        <template #icon>
          <PlusOutlined />
        </template>
        Thêm vào đơn
      </a-button>
    </div>
  </form>
</template>

<style lang="scss"></style>
