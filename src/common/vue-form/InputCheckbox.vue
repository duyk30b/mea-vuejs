<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value?: number | boolean
    checked?: boolean
    typeParser?: 'number' | 'boolean'
    indeterminate?: boolean
    label?: string
    disabled?: boolean
  }>(),
  {
    value: false,
    checked: false,
    typeParser: 'boolean',
    indeterminate: false,
    label: '',
    disabled: false,
  }
)
const emit = defineEmits<{
  (e: 'update:value', value: boolean | number): void
  (e: 'update:checked', value: boolean): void
  (e: 'change', event: Event): void
}>()

const randomId = computed(() => Math.random().toString(36).substring(2))

const handleChangeCheckbox = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:checked', target.checked)
  emit('change', e)
  if (props.typeParser === 'number') {
    emit('update:value', Number(target.checked))
  }
  if (props.typeParser === 'boolean') {
    emit('update:value', target.checked)
  }
}

defineExpose({ focus })
</script>

<template>
  <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center">
    <div>
      <input
        :id="randomId"
        style="cursor: pointer"
        :checked="Boolean(value) || checked"
        :indeterminate="indeterminate"
        type="checkbox"
        :name="randomId"
        :disabled="disabled"
        @change="(e) => handleChangeCheckbox(e)" />
    </div>
    <label style="cursor: pointer; user-select: none" :for="randomId">
      <span v-if="label">{{ label }}</span>
      <slot></slot>
    </label>
  </div>
</template>
