<script setup lang="ts">
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { InputMoney, VueSelect } from '../../../common/vue-form'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { UNKNOWN_KEY } from '../../../modules/enum'
import { InvoiceSurcharge } from '../../../modules/invoice'
import { invoice } from './invoice-upsert.ref'
import VueButton from '../../../common/VueButton.vue'

const screenStore = useScreenStore()
const { formatMoney } = screenStore

const handleChangeMoneyInvoiceSurchargeDetail = (money: number, index: number) => {
  invoice.value.invoiceSurcharges![index].money = money
  invoice.value.surcharge = invoice.value.invoiceSurcharges!.reduce(
    (acc, cur) => acc + cur.money,
    0
  )
}

const handleDeleteSurchargeDetail = (index: number) => {
  invoice.value.invoiceSurcharges!.splice(index, 1)
  invoice.value.surcharge = invoice.value.invoiceSurcharges!.reduce(
    (acc, cur) => acc + cur.money,
    0
  )
}

const handleAddSurchargeDetail = () => {
  const existKey = invoice.value.invoiceSurcharges!.map((i) => i.key)
  existKey.push(UNKNOWN_KEY)
  const allKey = Object.keys(screenStore.INVOICE_SURCHARGE_DETAIL)
  const key = allKey.find((i) => !existKey.includes(i)) || UNKNOWN_KEY
  const name = screenStore.INVOICE_SURCHARGE_DETAIL[key]
  const newSurcharge = new InvoiceSurcharge()
  newSurcharge.key = key
  newSurcharge.name = name || ''
  newSurcharge.money = 0
  invoice.value.invoiceSurcharges!.push(newSurcharge)
}

const handleChangeInvoiceSurcharge = (data: number) => {
  invoice.value.surcharge = data

  let totalKnownMoney = 0
  let indexOther = -1
  for (let i = 0; i < invoice.value.invoiceSurcharges!.length; i++) {
    const item = invoice.value.invoiceSurcharges![i]
    if (item.key !== UNKNOWN_KEY) totalKnownMoney += item.money
    else indexOther = i
  }

  // nếu có other thì cập nhật money của other
  if (indexOther !== -1) {
    invoice.value.invoiceSurcharges![indexOther].money = data - totalKnownMoney
  } else {
    // nếu không có other thì thêm mới other
    const other = InvoiceSurcharge.blank()
    other.key = UNKNOWN_KEY
    other.name = screenStore.INVOICE_SURCHARGE_DETAIL[UNKNOWN_KEY]
    other.money = data - totalKnownMoney
    invoice.value.invoiceSurcharges!.push(other)
  }
}
</script>

<template>
  <td class="cursor-pointer whitespace-nowrap">
    <a-popconfirm>
      <template #cancelButton>
        <div></div>
      </template>
      <template #okButton>
        <div></div>
      </template>
      <template #title>
        <div style="max-width: 100vw;">
          <div class="flex">
            <div style="width: 160px; font-size: 13px">Loại phụ phí</div>
            <div style="flex: 1; font-size: 13px">Số tiền</div>
          </div>
          <div class="flex flex-col gap-2 mt-2">
            <div
              v-for="(surcharge, index) in invoice.invoiceSurcharges"
              :key="index"
              class="flex items-stretch"
            >
              <VueSelect
                v-model:value="invoice.invoiceSurcharges![index].key"
                style="width: 160px"
                :options="
                  [
                    ...Object.entries(screenStore.INVOICE_SURCHARGE_DETAIL).map(([key, text]) => ({
                      value: key,
                      text: text,
                    })),
                    ...(screenStore.INVOICE_SURCHARGE_DETAIL[surcharge.key]
                      ? []
                      : [{ value: surcharge.key, text: surcharge.name }]),
                  ].reverse()
                "
              />
              <div style="flex: 1">
                <InputMoney
                  :value="surcharge.money"
                  @update:value="(data) => handleChangeMoneyInvoiceSurchargeDetail(data, index)"
                />
              </div>
              <div style="width: 60px">
                <VueButton color="red" danger @click="handleDeleteSurchargeDetail(index)"> Xóa </VueButton>
              </div>
            </div>
          </div>
          <div class="text-end mt-1" style="font-size: 13px">
            <a @click="handleAddSurchargeDetail">Thêm phụ phí khác</a>
          </div>
          <div class="flex mt-2">
            <div style="width: 160px">Tổng phụ phí:</div>
            <div style="flex: 1">
              <b class="ml-3" style="font-size: 16px">
                {{ formatMoney(invoice.surcharge) }}
              </b>
            </div>
          </div>
        </div>
      </template>
      <div>
        <span class="mr-2"> Phụ phí</span>
        <ExclamationCircleOutlined />
      </div>
    </a-popconfirm>
  </td>
  <td>
    <InputMoney
      :value="invoice.surcharge"
      class="input-payment"
      style="width: 100%"
      @update:value="handleChangeInvoiceSurcharge"
    />
  </td>
</template>
