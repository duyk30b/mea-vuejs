<script lang="ts" setup>
import { InputSelect, type InputSelectOption } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { CustomerSourceService, type CustomerSource } from '@/modules/customer-source'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'selectCustomerSource', value: CustomerSource | undefined): void
  (e: 'update:customerSourceId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    customerSourceId: number
    disabled?: boolean
    required?: boolean
    removeLabelWrapper?: boolean
  }>(),
  {
    customerSourceId: 0,
    disabled: false,
    required: false,
    removeLabelWrapper: false,
  },
)

const customerSourceOptions = ref<InputSelectOption<CustomerSource>[]>([])

const handleUpdateValue = (customerSourceId: any) => {
  emit('update:customerSourceId', customerSourceId || 0)
}

const handleSelectItem = (item?: CustomerSource) => {
  emit('selectCustomerSource', item)
}

onMounted(async () => {
  const customerSourceAll = await CustomerSourceService.list({})
  customerSourceOptions.value = customerSourceAll.map((i) => {
    return { value: i.id, label: i.name, data: i }
  })
})
</script>
<template>
  <div v-if="!removeLabelWrapper" class="flex gap-1 flex-wrap">
    <span>Nguồn khách hàng</span>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">({{ customerSourceId }})</span>
  </div>

  <div>
    <InputSelect
      :value="customerSourceId"
      :options="customerSourceOptions"
      :required="required"
      @update:value="handleUpdateValue"
      @selectItem="(item: any) => handleSelectItem(item.data)"
    />
  </div>
</template>

<style lang="scss" scoped></style>
