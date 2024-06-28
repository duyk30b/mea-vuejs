<script setup lang="ts">
import { ref } from 'vue'
import { useSettingStore } from '../../modules/_me/setting.store'
import InputNumber from './InputNumber.vue'

const props = withDefaults(defineProps<{ value: number }>(), {
  value: 0,
})
const emit = defineEmits<{ (e: 'update:value', value: number): void }>()

const settingStore = useSettingStore()

const inputNumber = ref<HTMLInputElement | null>(null)

const handleUpdateValue = (v: number) => {
  emit('update:value', v * settingStore.SYSTEM_SETTING.moneyDivisionFormat)
}

const focus = () => {
  inputNumber.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <InputNumber
    ref="inputNumber"
    :value="value / settingStore.SYSTEM_SETTING.moneyDivisionFormat"
    @update:value="handleUpdateValue"
  />
</template>
