<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import IconCalendar from '../icon/IconCalendar.vue'
import DatePicker from './DatePicker.vue'

const props = withDefaults(
  defineProps<{
    value?: string | number | Date
    typeParser?: string
    disabled?: boolean
  }>(),
  {
    value: undefined,
    typeParser: 'string',
    disabled: false,
  }
)
const emit = defineEmits<{ (e: 'update:value', value: string | number | Date | undefined): void }>()

const inputDate = ref<HTMLElement>()
const inputMonth = ref<HTMLElement>()
const inputYear = ref<HTMLElement>()
const showDatePicker = ref<boolean>(false)

onMounted(() => {
  watch(
    () => props.value,
    (newValue, oldValue) => {
      const newDate = new Date(newValue as any)
      if (newValue === null || newDate.toString() == 'Invalid Date') {
        inputDate.value!.innerHTML = ''
        inputMonth.value!.innerHTML = ''
        inputYear.value!.innerHTML = ''
        return
      }
      const currentTime = getCurrentTime()
      if (currentTime?.getTime() === newDate.getTime()) return

      inputDate.value!.innerHTML = newDate.getDate().toString().padStart(2, '0')
      inputMonth.value!.innerHTML = Number(newDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')
      inputYear.value!.innerHTML = newDate.getFullYear().toString()
    },
    { immediate: true }
  )
})

const handleInput = (e: Event, type: 'DATE' | 'MONTH' | 'YEAR') => {
  let CONFIG = { LENGTH: 2, MAX: 31 }
  if (type === 'MONTH') CONFIG = { LENGTH: 2, MAX: 12 }
  if (type === 'YEAR') CONFIG = { LENGTH: 4, MAX: 9999 }

  const target = e.target as HTMLElement
  const beforeValue = target.innerHTML || ''
  const range = document.createRange()
  const selection = window.getSelection()
  let selectionStart = selection?.getRangeAt(0)?.startOffset || selection?.anchorOffset || 0

  let convert = beforeValue.replace(/[^\d/]/g, '').slice(0, CONFIG.LENGTH)
  if (Number(convert) > CONFIG.MAX) {
    convert = convert.slice(0, 1)
  }
  const afterValue = convert
  target.innerHTML = afterValue

  if (target.childNodes[0]) {
    range.setStart(target.childNodes[0], selectionStart + afterValue.length - beforeValue.length)
    range.setEnd(target.childNodes[0], selectionStart + afterValue.length - beforeValue.length)
    selection?.removeAllRanges()
    selection?.addRange(range)
  }

  if (afterValue.length >= CONFIG.LENGTH) {
    if (type === 'DATE') inputMonth.value?.focus()
    if (type === 'MONTH') inputYear.value?.focus()
  }
}

const handleFocus = (e: Event) => {
  const target = e.target as HTMLElement
  const range = document.createRange()
  const selection = window.getSelection()
  if (target?.childNodes?.[0]) {
    range.selectNodeContents(target) // Chọn toàn bộ nội dung của div
    selection?.removeAllRanges() // Xóa tất cả các range hiện tại
    selection?.addRange(range) // Thêm range mới để bôi đen toàn bộ nội dung
  }
}

const handleBlur = (e: Event, LENGTH = 2) => {
  const target = e.target as HTMLElement
  const beforeValue = target.textContent || ''
  if (!beforeValue) {
    return emit('update:value', undefined)
  }
  let newValue = beforeValue.padStart(LENGTH, '0')
  target.innerHTML = newValue

  const time = getCurrentTime()
  if (!time) return
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

const handleValueDatePicker = (value: number) => {
  emit('update:value', value)
  showDatePicker.value = false
}

const getCurrentTime = () => {
  if (!inputDate.value || inputDate.value.innerHTML.length < 2) {
    return undefined
  }
  if (!inputMonth.value || inputMonth.value.innerHTML.length < 2) {
    return undefined
  }
  if (!inputYear.value || inputYear.value.innerHTML.length < 2) {
    return undefined
  }
  const time = new Date(2000, 11, 1, 0, 0, 0, 0)
  time.setFullYear(Number(inputYear.value.innerHTML))
  time.setMonth(Number(inputMonth.value.innerHTML) - 1)
  time.setDate(Number(inputDate.value.innerHTML))
  return time
}

const handleClickOutside = () => {
  showDatePicker.value = false
}
</script>

<template>
  <div v-click-outside="handleClickOutside" :class="{ 'vue-input': true, 'disabled': disabled }">
    <div class="input-area">
      <div class="wrapper-date-time">
        <div
          ref="inputDate"
          class="input-item input-date"
          :contenteditable="!disabled"
          @input="(e) => handleInput(e, 'DATE')"
          @focus="handleFocus"
          @blur="(e) => handleBlur(e, 2)"
        ></div>
        <div>/</div>
        <div
          ref="inputMonth"
          class="input-item input-month"
          :contenteditable="!disabled"
          @input="(e) => handleInput(e, 'MONTH')"
          @focus="handleFocus"
          @blur="(e) => handleBlur(e, 2)"
        ></div>
        <div>/</div>
        <div
          ref="inputYear"
          class="input-item input-year"
          :contenteditable="!disabled"
          @input="(e) => handleInput(e, 'YEAR')"
          @focus="handleFocus"
          @blur="(e) => handleBlur(e, 4)"
        ></div>
      </div>
    </div>
    <div class="icon-append" @click="showDatePicker = !showDatePicker">
      <IconCalendar />
    </div>
    <div v-if="showDatePicker && !disabled" class="date-picker">
      <DatePicker
        :value="new Date(value || '2024-01-02').getTime()"
        @update:value="handleValueDatePicker"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wrapper-date-time {
  padding: 6px 6px;
  display: flex;
  .input-item {
    outline: none;
    padding: 0 6px;
  }
  .input-date {
    width: 2em;
    cursor: text;
  }
  .input-month {
    width: 2em;
    cursor: text;
  }
  .input-year {
    width: 4em;
    cursor: text;
  }
}

.date-picker {
  position: absolute;
  top: 100%;
  max-width: 400px;
  left: 0;
  width: 100%;
  z-index: 1000;
}
</style>
