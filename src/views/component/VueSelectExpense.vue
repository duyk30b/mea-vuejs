<script lang="ts" setup>
import { VueSelect } from '@/common/vue-form'
import { ExpenseService, type Expense } from '@/modules/expense'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'selectExpense', value: Expense | undefined): void
  (e: 'update:expenseId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    expenseId: number
    disabled?: boolean
    required?: boolean
  }>(),
  {
    expenseId: 0,
    disabled: false,
    required: false,
  },
)

const expenseOptions = ref<{ value: number; text: string; data: Expense }[]>([])

onMounted(async () => {
  const expenseAll = await ExpenseService.list({})
  expenseOptions.value = expenseAll.map((i) => ({ value: i.id, text: i.name, data: i }))
})

const handleUpdateValue = (expenseId: any) => {
  emit('update:expenseId', expenseId || 0)
}

const handleSelectItem = (item?: Expense) => {
  emit('selectExpense', item)
}
</script>
<template>
  <VueSelect
    :value="expenseId"
    :options="expenseOptions"
    :required="required"
    @update:value="handleUpdateValue"
    @selectItem="({ data }) => handleSelectItem(data)"
  />
</template>

<style lang="scss" scoped></style>
