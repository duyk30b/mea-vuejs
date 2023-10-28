<script setup lang="ts">
import { useOrganizationStore } from '@/store/organization.store'

const props = withDefaults(defineProps<{
  value: number,
  prepend?: string,
  append?: string
}>(), { value: 0 })
const emit = defineEmits<{ (e: 'update:value', value: number): void }>()

const organizationStore = useOrganizationStore()

const handleChange = (data: number) => {
  emit('update:value', data * organizationStore.SYSTEM_SETTING.moneyDivisionFormat)
}

</script>

<template>
  <a-input-number :value="value / organizationStore.SYSTEM_SETTING.moneyDivisionFormat" @change="handleChange"
    :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
    :parser="(value: any) => value.replace(/(,*)/g, '')"
    :step="1000 / organizationStore.SYSTEM_SETTING.moneyDivisionFormat">
    <template #addonBefore v-if="prepend"> {{ prepend }} </template>
    <template #addonAfter v-if="append"> {{ append }} </template>
  </a-input-number>
</template>