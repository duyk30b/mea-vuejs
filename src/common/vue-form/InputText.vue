<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: string | null
    prepend?: string
    append?: string
    disabled?: boolean
    required?: boolean
    textAlign?: 'left' | 'right'
    maxlength?: number
    placeholder?: string
    pattern?: string
    title?: string
  }>(),
  {
    value: '',
    prepend: undefined,
    append: undefined,
    disabled: false,
    required: false,
    textAlign: undefined,
    maxlength: undefined,
    placeholder: undefined,
    pattern: undefined,
    title: undefined,
  }
)
const emit = defineEmits<{ (e: 'update:value', value: string): void }>()

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:value', target.value)
}
</script>

<template>
  <div :class="{ 'vue-input': true, 'disabled': disabled }">
    <div v-if="prepend" class="prepend">{{ prepend }}</div>
    <div class="input-area">
      <input
        ref="inputRef"
        :value="value"
        :style="{ textAlign }"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :maxlength="maxlength"
        :pattern="pattern"
        :title="title"
        @input="handleInput"
      />
    </div>
    <div v-if="append" class="append">{{ append }}</div>
  </div>
</template>
