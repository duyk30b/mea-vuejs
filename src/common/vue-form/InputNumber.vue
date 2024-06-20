<script setup lang="ts">
import { onMounted } from 'vue'
import { ref, watch, watchEffect } from 'vue'
import { formatNumber } from '../../utils'

const props = withDefaults(
  defineProps<{
    value: number
    prepend?: string
    append?: string
    textAlign?: 'left' | 'right'
    disabled?: boolean
    placeholder?: string
    required?: boolean
    validate?: {
      'gt'?: number
      'GT'?: number
      '>'?: number
      'gte'?: number
      'GTE'?: number
      '>='?: number
      'lt'?: number
      'LT'?: number
      '<'?: number
      'lte'?: number
      'LTE'?: number
      '<='?: number
    }
  }>(),
  {
    value: 0,
    prepend: '',
    append: '',
    textAlign: 'left',
    disabled: false,
    placeholder: '',
    required: false,
    validate: () => ({}),
  }
)
const emit = defineEmits<{ (e: 'update:value', value: number): void }>()

const inputNumber = ref<HTMLInputElement | null>(null)

watchEffect(() => {
  if (inputNumber.value && props.validate && props.value != null) {
    let msg = ''
    ;['GT', 'gt', '>'].forEach((rule) => {
      const propsValid = props.validate[rule as keyof typeof props.validate]
      if (propsValid != null && !(props.value > propsValid)) {
        msg = `Giá trị phải lớn hơn ${formatNumber({ number: propsValid })}`
      }
    })
    ;['GTE', 'gte', '>='].forEach((rule) => {
      const propsValid = props.validate[rule as keyof typeof props.validate]
      if (propsValid != null && !(props.value >= propsValid)) {
        msg = `Giá trị phải lớn hơn hoặc bằng ${formatNumber({ number: propsValid })}`
      }
    })
    ;['LT', 'lt', '<'].forEach((rule) => {
      const propsValid = props.validate[rule as keyof typeof props.validate]
      if (propsValid != null && !(props.value < propsValid)) {
        msg = `Giá trị phải nhỏ hơn hoặc bằng ${formatNumber({ number: propsValid })}`
      }
    })
    ;['LTE', 'lte', '<='].forEach((rule) => {
      const propsValid = props.validate[rule as keyof typeof props.validate]
      if (propsValid != null && !(props.value <= propsValid)) {
        msg = `Giá trị phải nhỏ hơn hoặc bằng ${formatNumber({ number: propsValid })}`
      }
    })
    return inputNumber.value.setCustomValidity(msg)
  }
})

onMounted(() => {
  watch(
    () => props.value,
    (newValue, oldValue) => {
      const currentValue = Number(inputNumber.value!.value.replace(/,/g, ''))
      if (currentValue !== newValue) {
        inputNumber.value!.value = newValue
          .toString()
          .split('.') // convert cho những số trước dấu '.'
          .map((i, index) => (index === 0 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : i))
          .join('.')
      }
    },
    { immediate: true }
  )
})

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const selectionStart = target.selectionStart || 0
  const inputType = (e as InputEvent).inputType

  const beforeValue = target.value
  const afterValue = beforeValue
    .replace(/[^\d.-]/g, '') // Loại bỏ ký tự không phải số và dấu - và .
    .replace(/(?!^)-/g, '') // Loại bỏ tất cả dấu '-' không ở vị trí đầu tiên
    .replace(/(\..*?)\./g, '$1') // Loại bỏ tất cả các dấu '.' không phải là dấu '.' đầu tiên
    .split('.') // convert cho những số trước dấu '.'
    .map((i, index) => (index === 0 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : i))
    .join('.')

  target.value = afterValue

  if (inputType.startsWith('insert') || inputType.startsWith('delete')) {
    const newSelectionStart = selectionStart + (afterValue.length - beforeValue.length)
    target.selectionStart = newSelectionStart
    target.selectionEnd = newSelectionStart
  }

  const number = Number(afterValue.replace(/,/g, '')) || 0
  emit('update:value', number)
}

const handleFocus = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.value) {
    target.select()
  }
}

const focus = () => {
  inputNumber.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div :class="{ 'vue-input': true, 'disabled': disabled }">
    <div v-if="prepend" class="prepend">
      {{ prepend }}
    </div>
    <div class="input-area">
      <input
        ref="inputNumber"
        :style="{ textAlign }"
        :placeholder="placeholder || '0'"
        :disabled="disabled"
        :required="required"
        inputmode="decimal"
        @focus="handleFocus"
        @input="handleInput"
      />
    </div>
    <div v-if="append" class="append">
      {{ append }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
input {
  padding-right: 12px !important;
}
</style>
