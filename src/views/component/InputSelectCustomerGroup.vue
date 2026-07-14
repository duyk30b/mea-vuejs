<script lang="ts" setup>
import { InputSelect, type InputSelectOption } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { CustomerGroupService, type CustomerGroup } from '@/modules/customer_group'
import { onMounted, ref } from 'vue'
import BugDevelopment from './BugDevelopment.vue'

const emit = defineEmits<{
  (e: 'selectCustomerGroup', value: CustomerGroup | undefined): void
  (e: 'update:customerGroupId', value: string): void
}>()

const props = withDefaults(
  defineProps<{
    customerGroupId: string
    disabled?: boolean
    required?: boolean
    removeLabelWrapper?: boolean
  }>(),
  {
    customerGroupId: '',
    disabled: false,
    required: false,
    removeLabelWrapper: false,
  },
)

const customerGroupOptions = ref<InputSelectOption<CustomerGroup>[]>([])

const handleUpdateValue = (customerGroupId: any) => {
  emit('update:customerGroupId', customerGroupId || '')
}

const handleSelectItem = (item?: CustomerGroup) => {
  emit('selectCustomerGroup', item)
}

onMounted(async () => {
  const customerGroupAll = await CustomerGroupService.list({})
  customerGroupOptions.value = customerGroupAll.map((i) => {
    return { value: i.id, label: i.name, data: i }
  })
  customerGroupOptions.value.unshift({ value: '', label: '-- Chọn --' })
})
</script>
<template>
  <div v-if="!removeLabelWrapper" class="flex gap-1 flex-wrap">
    <span>Nhóm khách hàng</span>
    <span v-if="CONFIG.MODE === 'development'">
      <BugDevelopment :data="{ customerGroupId }" />
    </span>
  </div>

  <div>
    <InputSelect
      :value="customerGroupId"
      :options="customerGroupOptions"
      :required="required"
      :disabled="disabled"
      @update:value="handleUpdateValue"
      @selectItem="(item: any) => handleSelectItem(item.data)"
    />
  </div>
</template>

<style lang="scss" scoped></style>
