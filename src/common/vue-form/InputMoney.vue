<script setup lang="ts">
import { ref } from 'vue'
import { useScreenStore } from '../../modules/_me/screen.store'
import InputNumber from './InputNumber.vue'

const props = withDefaults(defineProps<{ value: number }>(), {
  value: 0,
})
const emit = defineEmits<{ (e: 'update:value', value: number): void }>()

const screenStore = useScreenStore()

const inputNumber = ref<HTMLInputElement | null>(null)

const handleUpdateValue = (v: number) => {
  emit('update:value', v * screenStore.SYSTEM_SETTING.moneyDivisionFormat)
}

const focus = () => {
  inputNumber.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <InputNumber
    ref="inputNumber"
    :value="value / screenStore.SYSTEM_SETTING.moneyDivisionFormat"
    @update:value="handleUpdateValue"
  />
</template>
