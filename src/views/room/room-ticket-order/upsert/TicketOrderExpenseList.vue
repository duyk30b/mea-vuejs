<script setup lang="ts">
import { IconDelete } from '@/common/icon-antd'
import VuePopConfirm from '@/common/popover/VuePopConfirm.vue'
import { InputMoney } from '@/common/vue-form'
import { useSettingStore } from '@/modules/_me/setting.store'
import { ExpenseService } from '@/modules/expense'
import { TicketExpense } from '@/modules/ticket-expense/ticket-expense.model'
import VueSelectExpense from '@/views/component/VueSelectExpense.vue'
import { useRouter } from 'vue-router'
import { ticketOrderUpsertRef } from './ticket-order-upsert.ref'

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const expenseAll = ExpenseService.expenseAll
const openBlankExpenseList = async () => {
  const route = router.resolve({ name: 'Expense' })
  window.open(route.href, '_blank')
}
</script>

<template>
  <VuePopConfirm :position="{ horizontal: 'right', vertical: 'top' }">
    <template #trigger>
      <div
        class="cursor-pointer text-right"
        style="padding-right: 11px; border-bottom: 1px solid #cdcdcd"
      >
        {{ formatMoney(ticketOrderUpsertRef.expense) }}
      </div>
    </template>
    <div class="p-4" style="max-width: 90vw; overflow-x: auto">
      <div style="">
        <table style="width: 100%">
          <thead>
            <tr>
              <th class="px-1">STT</th>
              <th>Loại chi phí</th>
              <th>Số tiền</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(ticketExpense, index) in ticketOrderUpsertRef.ticketExpenseList"
              :key="ticketExpense._localId"
            >
              <td class="px-1 py-1" style="text-align: center">{{ index + 1 }}</td>
              <td class="px-1 py-1">
                <div>
                  <VueSelectExpense v-model:expenseId="ticketExpense.expenseId" />
                </div>
              </td>
              <td class="px-1 py-1">
                <div>
                  <InputMoney v-model:value="ticketExpense.money" />
                </div>
              </td>
              <td class="px-1 py-1 cursor-pointer">
                <IconDelete
                  color="red"
                  width="16px"
                  height="16px"
                  @click="ticketOrderUpsertRef.ticketExpenseList!.splice(index, 1)"
                ></IconDelete>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-1" style="font-size: 13px">
        <a @click="ticketOrderUpsertRef.ticketExpenseList?.push(TicketExpense.blank())">
          Thêm chi phí
        </a>
      </div>
      <div v-if="!expenseAll.length" class="mt-1" style="font-size: 13px">
        <a style="text-decoration: underline; font-style: italic" @click="openBlankExpenseList">
          Chưa có chi phí ? Vào trang quản lý chi phí
        </a>
      </div>
      <div class="text-end mt-2">
        Tổng chi phí:
        <b>
          {{ formatMoney(ticketOrderUpsertRef.expense) }}
        </b>
      </div>
    </div>
  </VuePopConfirm>
</template>
