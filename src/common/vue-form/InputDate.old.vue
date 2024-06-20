<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { DTimer } from '../../utils'
import IconCalendar from '../icon/IconCalendar.vue'
import DatePicker from './DatePicker.vue'

const props = withDefaults(
  defineProps<{
    value?: string | number | Date
    format?: string
    typeParser?: string
    disabled?: boolean
  }>(),
  {
    value: undefined,
    format: 'DD/MM/YYYY',
    typeParser: 'string',
    disabled: false,
  }
)
const emit = defineEmits<{ (e: 'update:value', value: string | number | Date | undefined): void }>()

const inputDate = ref<HTMLInputElement>()
const showDatePicker = ref<boolean>(false)
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

// onMounted(() => {
//   if (!inputDate.value) return
//   if (props.value == null) return (inputDate.value.value = '')
//   inputDate.value.value = DTimer.timeToText(props.value, props.format)
// })

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

const handleValueDatePicker = (value: number) => {
  emit('update:value', value)
  showDatePicker.value = false
}
const handleBlur = () => {}
const handleFocusin = () => {}

const handleClickOutside = () => {
  showDatePicker.value = false
}
</script>

<template>
  <div v-click-outside="handleClickOutside" :class="{ 'vue-input': true, 'disabled': disabled }">
    <div class="input-area">
      <input
        ref="inputDate"
        :placeholder="props.format"
        :disabled="disabled"
        @input="handleInput"
        @change="handleChange"
        @blur="handleBlur"
        @focusin="handleFocusin"
      />
    </div>
    <div class="icon-append" @click="showDatePicker = !showDatePicker">
      <IconCalendar />
    </div>
    <div v-if="showDatePicker" class="date-picker">
      <DatePicker
        :value="new Date(value || '2024-01-02').getTime()"
        @update:value="handleValueDatePicker"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.date-picker {
  position: absolute;
  top: 100%;
  max-width: 400px;
  left: 0;
  width: 100%;
  z-index: 1000;
}
</style>
