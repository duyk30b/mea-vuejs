<script setup lang="ts">
import VueButton from '../../../common/VueButton.vue'
import { IconExclamationCircle } from '../../../common/icon-antd'
import VuePopConfirm from '../../../common/popover/VuePopConfirm.vue'
import { InputMoney, VueSelect } from '../../../common/vue-form'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { UNKNOWN_KEY } from '../../../modules/enum'
import { TicketExpense } from '../../../modules/ticket-expense/ticket-expense.model'
import { ticketOrderUpsertRef } from './ticket-order-upsert.ref'

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const handleChangeMoneyInvoiceExpenseDetail = (money: number, index: number) => {
  ticketOrderUpsertRef.value.ticketExpenseList![index].money = money
  ticketOrderUpsertRef.value.expense = ticketOrderUpsertRef.value.ticketExpenseList!.reduce(
    (acc, cur) => {
      return acc + cur.money
    },
    0,
  )
}

const handleDeleteExpenseDetail = (index: number) => {
  ticketOrderUpsertRef.value.ticketExpenseList!.splice(index, 1)
  ticketOrderUpsertRef.value.expense = ticketOrderUpsertRef.value.ticketExpenseList!.reduce(
    (acc, cur) => {
      return acc + cur.money
    },
    0,
  )
}

const handleAddExpenseDetail = () => {
  const existKey = ticketOrderUpsertRef.value.ticketExpenseList!.map((i) => i.key)
  existKey.push(UNKNOWN_KEY)
  const allKey = Object.keys(settingStore.INVOICE_EXPENSE_DETAIL)
  const key = allKey.find((i) => !existKey.includes(i)) || UNKNOWN_KEY
  const name = settingStore.INVOICE_EXPENSE_DETAIL[key]
  const newExpense = new TicketExpense()
  newExpense.key = key
  newExpense.name = name || ''
  newExpense.money = 0
  ticketOrderUpsertRef.value.ticketExpenseList!.push(newExpense)
}

const handleChangeInvoiceExpense = (data: number) => {
  ticketOrderUpsertRef.value.expense = data

  let totalKnownMoney = 0
  let indexOther = -1
  for (let i = 0; i < ticketOrderUpsertRef.value.ticketExpenseList!.length; i++) {
    const item = ticketOrderUpsertRef.value.ticketExpenseList![i]
    if (item.key !== UNKNOWN_KEY) totalKnownMoney += item.money
    else indexOther = i
  }

  // nếu có other thì cập nhật money của other
  if (indexOther !== -1) {
    ticketOrderUpsertRef.value.ticketExpenseList![indexOther].money = data - totalKnownMoney
  } else {
    // nếu không có other thì thêm mới other
    const other = TicketExpense.blank()
    other.key = UNKNOWN_KEY
    other.name = settingStore.INVOICE_EXPENSE_DETAIL[UNKNOWN_KEY]
    other.money = data - totalKnownMoney
    ticketOrderUpsertRef.value.ticketExpenseList!.push(other)
  }
}
</script>

<template>
  <td class="cursor-pointer whitespace-nowrap">
    <VuePopConfirm>
      <template #trigger>
        <a>
          <span class="mr-2">Chi phí</span>
          <IconExclamationCircle />
        </a>
      </template>
      <div style="max-width: 100vw" class="p-4">
        <div class="flex">
          <div style="width: 160px; font-size: 13px">Loại chi phí</div>
          <div style="flex: 1; font-size: 13px">Số tiền</div>
        </div>
        <div class="flex flex-col gap-2 mt-2">
          <div
            v-for="(expense, index) in ticketOrderUpsertRef.ticketExpenseList"
            :key="index"
            class="flex items-stretch"
          >
            <VueSelect
              v-model:value="ticketOrderUpsertRef.ticketExpenseList![index].key"
              style="width: 160px"
              :options="
                [
                  ...Object.entries(settingStore.INVOICE_EXPENSE_DETAIL).map(([key, text]) => ({
                    value: key,
                    text: text,
                  })),
                  ...(settingStore.INVOICE_EXPENSE_DETAIL[expense.key]
                    ? []
                    : [{ value: expense.key, text: expense.name }]),
                ].reverse()
              "
            />
            <div style="flex: 1">
              <InputMoney
                :value="expense.money"
                @update:value="(data) => handleChangeMoneyInvoiceExpenseDetail(data, index)"
              />
            </div>
            <div style="width: 60px">
              <VueButton color="red" @click="handleDeleteExpenseDetail(index)">Xóa</VueButton>
            </div>
          </div>
        </div>
        <div class="text-end mt-1" style="font-size: 13px">
          <a @click="handleAddExpenseDetail">Thêm chi phí khác</a>
        </div>
        <div class="flex mt-2">
          <div style="width: 160px">Tổng chi phí:</div>
          <div style="flex: 1">
            <b class="ml-3" style="font-size: 16px">
              {{ formatMoney(ticketOrderUpsertRef.expense) }}
            </b>
          </div>
        </div>
      </div>
    </VuePopConfirm>
  </td>
  <td>
    <InputMoney
      :value="ticketOrderUpsertRef.expense"
      class="input-payment"
      style="width: 100%"
      @update:value="handleChangeInvoiceExpense"
    />
  </td>
</template>
