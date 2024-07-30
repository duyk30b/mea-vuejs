<script setup lang="ts">
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import VueButton from '../../../common/VueButton.vue'
import { InputMoney, VueSelect } from '../../../common/vue-form'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { UNKNOWN_KEY } from '../../../modules/enum'
import { TicketSurcharge } from '../../../modules/ticket-surcharge/ticket-surcharge.model'
import { ticket } from './ticket-order-upsert.ref'

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const handleChangeMoneyInvoiceSurchargeDetail = (money: number, index: number) => {
  ticket.value.ticketSurchargeList![index].money = money
  ticket.value.surcharge = ticket.value.ticketSurchargeList!.reduce((acc, cur) => {
    return acc + cur.money
  }, 0)
}

const handleDeleteSurchargeDetail = (index: number) => {
  ticket.value.ticketSurchargeList!.splice(index, 1)
  ticket.value.surcharge = ticket.value.ticketSurchargeList!.reduce((acc, cur) => {
    return acc + cur.money
  }, 0)
}

const handleAddSurchargeDetail = () => {
  const existKey = ticket.value.ticketSurchargeList!.map((i) => i.key)
  existKey.push(UNKNOWN_KEY)
  const allKey = Object.keys(settingStore.INVOICE_SURCHARGE_DETAIL)
  const key = allKey.find((i) => !existKey.includes(i)) || UNKNOWN_KEY
  const name = settingStore.INVOICE_SURCHARGE_DETAIL[key]
  const newSurcharge = new TicketSurcharge()
  newSurcharge.key = key
  newSurcharge.name = name || ''
  newSurcharge.money = 0
  ticket.value.ticketSurchargeList!.push(newSurcharge)
}

const handleChangeInvoiceSurcharge = (data: number) => {
  ticket.value.surcharge = data

  let totalKnownMoney = 0
  let indexOther = -1
  for (let i = 0; i < ticket.value.ticketSurchargeList!.length; i++) {
    const item = ticket.value.ticketSurchargeList![i]
    if (item.key !== UNKNOWN_KEY) totalKnownMoney += item.money
    else indexOther = i
  }

  // nếu có other thì cập nhật money của other
  if (indexOther !== -1) {
    ticket.value.ticketSurchargeList![indexOther].money = data - totalKnownMoney
  } else {
    // nếu không có other thì thêm mới other
    const other = TicketSurcharge.blank()
    other.key = UNKNOWN_KEY
    other.name = settingStore.INVOICE_SURCHARGE_DETAIL[UNKNOWN_KEY]
    other.money = data - totalKnownMoney
    ticket.value.ticketSurchargeList!.push(other)
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
        <div style="max-width: 100vw">
          <div class="flex">
            <div style="width: 160px; font-size: 13px">Loại phụ phí</div>
            <div style="flex: 1; font-size: 13px">Số tiền</div>
          </div>
          <div class="flex flex-col gap-2 mt-2">
            <div
              v-for="(surcharge, index) in ticket.ticketSurchargeList"
              :key="index"
              class="flex items-stretch">
              <VueSelect
                v-model:value="ticket.ticketSurchargeList![index].key"
                style="width: 160px"
                :options="
                  [
                    ...Object.entries(settingStore.INVOICE_SURCHARGE_DETAIL).map(([key, text]) => ({
                      value: key,
                      text: text,
                    })),
                    ...(settingStore.INVOICE_SURCHARGE_DETAIL[surcharge.key]
                      ? []
                      : [{ value: surcharge.key, text: surcharge.name }]),
                  ].reverse()
                " />
              <div style="flex: 1">
                <InputMoney
                  :value="surcharge.money"
                  @update:value="(data) => handleChangeMoneyInvoiceSurchargeDetail(data, index)" />
              </div>
              <div style="width: 60px">
                <VueButton color="red" danger @click="handleDeleteSurchargeDetail(index)">
                  Xóa
                </VueButton>
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
                {{ formatMoney(ticket.surcharge) }}
              </b>
            </div>
          </div>
        </div>
      </template>
      <div>
        <span class="mr-2">Phụ phí</span>
        <ExclamationCircleOutlined />
      </div>
    </a-popconfirm>
  </td>
  <td>
    <InputMoney
      :value="ticket.surcharge"
      class="input-payment"
      style="width: 100%"
      @update:value="handleChangeInvoiceSurcharge" />
  </td>
</template>
