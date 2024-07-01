<script setup lang="ts">
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import VueButton from '../../../common/VueButton.vue'
import { InputMoney, VueSelect } from '../../../common/vue-form'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { UNKNOWN_KEY } from '../../../modules/enum'
import { VisitExpense } from '../../../modules/visit-expense/visit-expense.model'
import { visit } from './invoice-upsert.ref'

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const handleChangeMoneyInvoiceExpenseDetail = (money: number, index: number) => {
  visit.value.visitExpenseList![index].money = money
  visit.value.expense = visit.value.visitExpenseList!.reduce((acc, cur) => {
    return acc + cur.money
  }, 0)
}

const handleDeleteExpenseDetail = (index: number) => {
  visit.value.visitExpenseList!.splice(index, 1)
  visit.value.expense = visit.value.visitExpenseList!.reduce((acc, cur) => {
    return acc + cur.money
  }, 0)
}

const handleAddExpenseDetail = () => {
  const existKey = visit.value.visitExpenseList!.map((i) => i.key)
  existKey.push(UNKNOWN_KEY)
  const allKey = Object.keys(settingStore.INVOICE_EXPENSE_DETAIL)
  const key = allKey.find((i) => !existKey.includes(i)) || UNKNOWN_KEY
  const name = settingStore.INVOICE_EXPENSE_DETAIL[key]
  const newExpense = new VisitExpense()
  newExpense.key = key
  newExpense.name = name || ''
  newExpense.money = 0
  visit.value.visitExpenseList!.push(newExpense)
}

const handleChangeInvoiceExpense = (data: number) => {
  visit.value.expense = data

  let totalKnownMoney = 0
  let indexOther = -1
  for (let i = 0; i < visit.value.visitExpenseList!.length; i++) {
    const item = visit.value.visitExpenseList![i]
    if (item.key !== UNKNOWN_KEY) totalKnownMoney += item.money
    else indexOther = i
  }

  // nếu có other thì cập nhật money của other
  if (indexOther !== -1) {
    visit.value.visitExpenseList![indexOther].money = data - totalKnownMoney
  } else {
    // nếu không có other thì thêm mới other
    const other = VisitExpense.blank()
    other.key = UNKNOWN_KEY
    other.name = settingStore.INVOICE_EXPENSE_DETAIL[UNKNOWN_KEY]
    other.money = data - totalKnownMoney
    visit.value.visitExpenseList!.push(other)
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
            <div style="width: 160px; font-size: 13px">Loại chi phí</div>
            <div style="flex: 1; font-size: 13px">Số tiền</div>
          </div>
          <div class="flex flex-col gap-2 mt-2">
            <div
              v-for="(expense, index) in visit.visitExpenseList"
              :key="index"
              class="flex items-stretch">
              <VueSelect
                v-model:value="visit.visitExpenseList![index].key"
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
                " />
              <div style="flex: 1">
                <InputMoney
                  :value="expense.money"
                  @update:value="(data) => handleChangeMoneyInvoiceExpenseDetail(data, index)" />
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
                {{ formatMoney(visit.expense) }}
              </b>
            </div>
          </div>
        </div>
      </template>
      <div>
        <span class="mr-2">Chi phí</span>
        <ExclamationCircleOutlined />
      </div>
    </a-popconfirm>
  </td>
  <td>
    <InputMoney
      :value="visit.expense"
      class="input-payment"
      style="width: 100%"
      @update:value="handleChangeInvoiceExpense" />
  </td>
</template>
