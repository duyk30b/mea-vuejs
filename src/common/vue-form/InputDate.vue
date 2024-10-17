<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import IconCalendar from '../icon/IconCalendar.vue'
import DatePicker from './DatePicker.vue'
import IconClearOutline from '../icon/IconClearOutline.vue'
import IconClearCircle from '../icon/IconClearCircle.vue'

const props = withDefaults(
  defineProps<{
    value?: string | number | Date | null
    typeParser?: string
    disabled?: boolean
    defaultType?: 'date' | 'month' | 'year'
    showTime?: boolean
  }>(),
  {
    value: undefined,
    typeParser: 'string',
    disabled: false,
    defaultType: 'date',
    showTime: false,
  }
)
const emit = defineEmits<{
  (e: 'update:value', value: string | number | Date | null | undefined): void
}>()

const inputYear = ref<HTMLElement>()
const inputMonth = ref<HTMLElement>()
const inputDate = ref<HTMLElement>()

const inputHour = ref<HTMLElement>()
const inputMinute = ref<HTMLElement>()
const inputSecond = ref<HTMLElement>()

const showDatePicker = ref<boolean>(false)

onMounted(() => {
  watch(
    () => props.value,
    (newValue, oldValue) => {
      const newDate = new Date(newValue as any)
      if (newValue === null || newDate.toString() == 'Invalid Date') {
        inputYear.value!.innerHTML = ''
        inputMonth.value!.innerHTML = ''
        inputDate.value!.innerHTML = ''

        if (props.showTime) {
          inputHour.value!.innerHTML = ''
          inputMinute.value!.innerHTML = ''
          inputSecond.value!.innerHTML = ''
        }
        return
      }
      const currentTime = getCurrentTime()
      if (currentTime?.getTime() === newDate.getTime()) return

      inputYear.value!.innerHTML = newDate.getFullYear().toString()

      inputMonth.value!.innerHTML = Number(newDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')
      inputDate.value!.innerHTML = newDate.getDate().toString().padStart(2, '0')

      if (props.showTime) {
        inputHour.value!.innerHTML = newDate.getHours().toString().padStart(2, '0')
        inputMinute.value!.innerHTML = newDate.getMinutes().toString().padStart(2, '0')
        inputSecond.value!.innerHTML = newDate.getSeconds().toString().padStart(2, '0')
      }
    },
    { immediate: true }
  )
})

const handleInput = (e: Event, type: 'YEAR' | 'MONTH' | 'DATE' | 'HOUR' | 'MINUTE' | 'SECOND') => {
  let CONFIG = { LENGTH: 0, MAX: 0 }

  if (type === 'YEAR') CONFIG = { LENGTH: 4, MAX: 9999 }
  else if (type === 'MONTH') CONFIG = { LENGTH: 2, MAX: 12 }
  else if (type === 'DATE') CONFIG = { LENGTH: 2, MAX: 31 }
  else if (type === 'HOUR') CONFIG = { LENGTH: 2, MAX: 23 }
  else if (type === 'MINUTE') CONFIG = { LENGTH: 2, MAX: 60 }
  else if (type === 'SECOND') CONFIG = { LENGTH: 2, MAX: 60 }

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

    if (props.showTime) {
      if (type === 'YEAR') inputHour.value?.focus()
      if (type === 'HOUR') inputMinute.value?.focus()
      if (type === 'MINUTE') inputSecond.value?.focus()
    }
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
  const time = new Date(1990, 10, 2, 0, 0, 0, 0)
  time.setFullYear(Number(inputYear.value.innerHTML))
  time.setMonth(Number(inputMonth.value.innerHTML) - 1)
  time.setDate(Number(inputDate.value.innerHTML))

  if (props.showTime) {
    if (inputHour.value) time.setHours(Number(inputHour.value.innerHTML))
    if (inputMinute.value) time.setMinutes(Number(inputMinute.value.innerHTML))
    if (inputSecond.value) time.setSeconds(Number(inputSecond.value.innerHTML))
  }

  return time
}

const handleClickOutside = () => {
  showDatePicker.value = false
}

const handleClickClear = () => {
  emit('update:value', undefined)
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
          placeholder="D"
          @input="(e) => handleInput(e, 'DATE')"
          @focus="handleFocus"
          @blur="(e) => handleBlur(e, 2)"></div>
        <div>/</div>
        <div
          ref="inputMonth"
          class="input-item input-month"
          :contenteditable="!disabled"
          placeholder="M"
          @input="(e) => handleInput(e, 'MONTH')"
          @focus="handleFocus"
          @blur="(e) => handleBlur(e, 2)"></div>
        <div>/</div>
        <div
          ref="inputYear"
          class="input-item input-year"
          placeholder="Y"
          :contenteditable="!disabled"
          @input="(e) => handleInput(e, 'YEAR')"
          @focus="handleFocus"
          @blur="(e) => handleBlur(e, 4)"></div>
        <div></div>
        <div
          v-if="showTime"
          ref="inputHour"
          class="input-item input-hour"
          :contenteditable="!disabled"
          placeholder="h"
          @input="(e) => handleInput(e, 'HOUR')"
          @focus="handleFocus"
          @blur="(e) => handleBlur(e, 2)"></div>
        <div v-if="showTime">:</div>
        <div
          v-if="showTime"
          ref="inputMinute"
          class="input-item input-minute"
          :contenteditable="!disabled"
          placeholder="m"
          @input="(e) => handleInput(e, 'MINUTE')"
          @focus="handleFocus"
          @blur="(e) => handleBlur(e, 2)"></div>
        <div v-if="showTime">:</div>
        <div
          v-if="showTime"
          ref="inputSecond"
          class="input-item input-second"
          :contenteditable="!disabled"
          placeholder="s"
          @input="(e) => handleInput(e, 'SECOND')"
          @focus="handleFocus"
          @blur="(e) => handleBlur(e, 2)"></div>
      </div>
    </div>
    <div class="icon-append">
      <IconClearOutline class="icon-clear-blur" @click="handleClickClear" />
      <IconClearCircle class="icon-clear-hover" @click="handleClickClear" />
      <IconCalendar style="margin-left: 12px" @click="showDatePicker = !showDatePicker" />
    </div>
    <div v-if="showDatePicker && !disabled" class="date-picker">
      <DatePicker
        :value="new Date(value || '2024-01-02').getTime()"
        :defaultType="defaultType"
        @update:value="handleValueDatePicker" />
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
  .input-hour {
    width: 2em;
    cursor: text;
  }
  .input-minute {
    width: 2em;
    cursor: text;
  }
  .input-second {
    width: 2em;
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
