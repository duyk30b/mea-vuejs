<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { DTimer } from '../../utils'

const props = withDefaults(
  defineProps<{ value?: string | number | Date; format?: string; typeParser?: string }>(),
  {
    value: undefined,
    format: 'DD/MM/YYYY',
    typeParser: 'string',
  }
)
const emit = defineEmits<{ (e: 'update:value', value: string | number | Date | undefined): void }>()

const inputDate = ref<HTMLInputElement>()
const ruleFormat = props.format.replace(/D|M|Y/g, 'x')
const ruleValidIndex = ruleFormat.split('').reduce((acc, cur, index: number) => {
  if (cur === 'x') acc.push(index + 1)
  return acc
}, [] as number[])

watch(
  () => props.value,
  (newValue, oldValue) => {
    if (!inputDate.value) return
    if (newValue == null) return (inputDate.value.value = '')
    inputDate.value.value = DTimer.timeToText(newValue, props.format)
  },
  { immediate: true }
)

onMounted(() => {
  if (!inputDate.value) return
  if (props.value == null) return (inputDate.value.value = '')
  inputDate.value.value = DTimer.timeToText(props.value, props.format)
})

const startFormatMask = (text: string, format: string) => {
  const arrOrigin = text.replace(/[^\d]/g, '').split('')
  const arrFormat = format.split('')
  const arrResult = []

  for (let i = 0; i < arrFormat.length; i++) {
    if (arrOrigin.length === 0) break

    if (arrFormat[i] !== 'x') {
      arrResult.push(arrFormat[i]) // nếu là ký tự đặc biệt thì lấy ký tự đó
    } else {
      arrResult.push(arrOrigin.shift())
    }
  }
  return arrResult.join('')
}

const handleChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.value.length < props.format.length) {
    target.value = ''
    emit('update:value', undefined)
    return
  }

  const time = DTimer.textToTime(target.value, props.format)

  if (props.typeParser === 'number') {
    emit('update:value', time.getTime())
  }
  if (props.typeParser === 'string') {
    emit('update:value', time.toISOString())
  }
  if (props.typeParser === 'object') {
    emit('update:value', time)
  }
}

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const selectionStart = target.selectionStart || 0

  const value = startFormatMask(target.value, ruleFormat)
  target.value = value

  // Đổi value của ô input làm cursor về cuối ô, cần chỉnh lại
  if ((e as InputEvent).inputType === 'deleteContentBackward') {
    for (let i = ruleValidIndex.length - 1; i >= 0; i--) {
      if (ruleValidIndex[i] <= selectionStart) {
        target.selectionStart = ruleValidIndex[i]
        target.selectionEnd = ruleValidIndex[i]
        break
      }
    }
  } else if ((e as InputEvent).inputType === 'insertText') {
    for (let i = 0; i < ruleValidIndex.length; i++) {
      if (ruleValidIndex[i] >= selectionStart) {
        target.selectionStart = ruleValidIndex[i]
        target.selectionEnd = ruleValidIndex[i]
        break
      }
    }
  }
}
</script>

<template>
  <input ref="inputDate" :placeholder="props.format" @input="handleInput" @change="handleChange" />
</template>

<style lang="scss" scoped>
input {
  padding: 4px 11px;
  outline: none;
  border: 1px solid #d9d9d9;
  border-radius: 2px;

  &:focus {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgb(24 144 255 / 20%);
  }

  &:hover {
    border-color: #40a9ff;
  }

  &::placeholder {
    opacity: 0.5;
  }

  &:disabled {
    cursor: not-allowed;
    border: 1px solid #d9d9d9;
    background-color: #f5f5f5;
    color: rgb(0, 0, 0, 0.25);
  }
}
</style>
