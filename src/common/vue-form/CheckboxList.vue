<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    options: { value: number | string; text: string }[]
    value: (number | string)[]
  }>(),
  {
    options: () => [],
    value: () => [],
  }
)
const emit = defineEmits<{ (e: 'update:value', value: (number | string)[]): void }>()

const randomId = computed(() => Math.random().toString(36).substring(2))

// watch(
//   () => props.value,
//   (newValue, oldValue) => {
//     console.log('🚀 ~ file: CheckboxList.vue:23 ~ newValue:', newValue)
//     // valueString.value = JSON.stringify(newValue || '[]')
//   },
//   { immediate: true }
// )

// watch(
//   () => props.options,
//   (newValue, oldValue) => {
//     console.log('🚀 ~ file: CheckboxList.vue:32 ~ newValue:', newValue)
//   },
//   { immediate: true }
// )

const handleChangeInput = (e: Event, data: number | string) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    const newValue = [...props.value, data]
    emit('update:value', newValue)
  } else {
    const newValue = props.value.filter((i) => i !== data)
    emit('update:value', newValue)
  }
}

defineExpose({ focus })
</script>

<template>
  <div style="display: flex; gap: 16px">
    <template v-for="(item, index) in options" :key="index">
      <div>
        <input
          :id="randomId + '_' + index"
          :checked="value.some((i) => i === item.value)"
          type="checkbox"
          :name="randomId + '_' + index"
          @change="(e) => handleChangeInput(e, item.value)" />
        <label class="mx-2 cursor-pointer" :for="randomId + '_' + index">
          {{ item.text }}
        </label>
      </div>
    </template>
  </div>
</template>
