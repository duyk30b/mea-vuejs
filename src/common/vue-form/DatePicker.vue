<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DTimer } from '../../utils'

const props = withDefaults(
  defineProps<{
    value?: number
    defaultType?: 'date' | 'month' | 'year'
  }>(),
  {
    value: () => Date.now(),
    defaultType: 'year',
  }
)
const emit = defineEmits<{ (e: 'update:value', value: number): void }>()

const currentTime = ref<number>(Date.now())
const startOfMonth = ref<number>(Date.now())
const endOfMonth = ref<number>(Date.now())

const dateList = ref<Date[]>([])

const type = ref<'date' | 'month' | 'year'>(props.defaultType)

const startOfDateValue = computed(() => {
  return DTimer.startOfDate(currentTime.value).getTime()
})
const currentFullYear = computed(() => {
  return new Date(currentTime.value).getFullYear()
})
const currentMonth = computed(() => {
  return new Date(currentTime.value).getMonth()
})
const yearList = computed(() => {
  const firstYear = Math.floor(currentFullYear.value / 25) * 25
  return Array.from({ length: 25 }, (_, i) => {
    return firstYear + 1 + i
  })
})

watch(
  () => props.value,
  (newValue) => (currentTime.value = newValue),
  { immediate: true }
)
watch(
  () => currentTime.value,
  (newCurrentDate) => {
    startOfMonth.value = DTimer.startOfMonth(newCurrentDate).getTime()
    endOfMonth.value = DTimer.endOfMonth(newCurrentDate).getTime()

    const temp = startOfMonth.value - 7 * 24 * 60 * 60 * 1000
    let firstDate = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(temp + i * 24 * 60 * 60 * 1000)
      if (date.getDay() === 0) {
        firstDate = date
      }
    }

    dateList.value = Array.from({ length: 42 }, (_, i) => {
      return new Date(firstDate.getTime() + i * 24 * 60 * 60 * 1000)
    })
  },
  { immediate: true }
)

const clickIncreaseYear = (number: number) => {
  const currentDate = new Date(currentTime.value)
  currentDate.setFullYear(currentDate.getFullYear() + number)
  currentTime.value = currentDate.getTime()
}

const clickIncreaseMonth = (number: number) => {
  const currentDate = new Date(currentTime.value)
  currentDate.setMonth(currentDate.getMonth() + number)
  currentTime.value = currentDate.getTime()
}

const selectYear = (year: number) => {
  const time = new Date(currentTime.value)
  time.setFullYear(year)
  currentTime.value = time.getTime()
  type.value = 'month'
}

const selectMonth = (month: number) => {
  const time = new Date(currentTime.value)
  time.setMonth(month)
  currentTime.value = time.getTime()
  type.value = 'date'
}
const selectDate = (time: number) => {
  currentTime.value = time
  emit('update:value', time)
}
</script>

<template>
  <div class="date-picker-container">
    <template v-if="type === 'date'">
      <div class="date-picker-header">
        <div class="pick-arrow" @click="clickIncreaseYear(-1)">«</div>
        <div class="pick-arrow" @click="clickIncreaseMonth(-1)">‹</div>
        <div class="month-year">
          <span @click.stop="type = 'month'">
            {{ (new Date(currentTime).getMonth() + 1).toString().padStart(2, '0') }}
          </span>
          <span style="margin-left: 8px; margin-right: 8px;">/</span>
          <span @click.stop="type = 'year'">{{ new Date(currentTime).getFullYear() }}</span>
        </div>
        <div class="pick-arrow" @click="clickIncreaseMonth(1)">›</div>
        <div class="pick-arrow" @click="clickIncreaseYear(1)">»</div>
      </div>
      <div class="date-picker-content grid-date">
        <div class="grid-item item-day"><div class="grid-item-inner">CN</div></div>
        <div class="grid-item item-day"><div class="grid-item-inner">T2</div></div>
        <div class="grid-item item-day"><div class="grid-item-inner">T3</div></div>
        <div class="grid-item item-day"><div class="grid-item-inner">T4</div></div>
        <div class="grid-item item-day"><div class="grid-item-inner">T5</div></div>
        <div class="grid-item item-day"><div class="grid-item-inner">T6</div></div>
        <div class="grid-item item-day"><div class="grid-item-inner">T7</div></div>
        <div
          v-for="(date, index) in dateList"
          :key="index"
          class="grid-item item-date"
          @click="selectDate(date.getTime())">
          <div
            :class="{
              'grid-item-inner': true,
              'active': date.getTime() === startOfDateValue,
              'outside': date.getTime() < startOfMonth || date.getTime() > endOfMonth,
            }">
            {{ date.getDate() }}
          </div>
        </div>
      </div>
    </template>
    <template v-if="type === 'year'">
      <div class="date-picker-header">
        <div class="pick-arrow" @click="clickIncreaseYear(-25)">«</div>
        <div class="month-year" @click.stop="type = 'month'">
          {{ yearList[0] }} -
          {{ yearList[yearList.length - 1] }}
        </div>
        <div class="pick-arrow" @click="clickIncreaseYear(25)">»</div>
      </div>
      <div class="date-picker-content grid-year">
        <div
          v-for="(year, index) in yearList"
          :key="index"
          class="grid-item item-year"
          @click.stop="selectYear(year)">
          <div
            :class="{
              'grid-item-inner': true,
              'active': year === currentFullYear,
            }">
            {{ year }}
          </div>
        </div>
      </div>
    </template>
    <template v-if="type === 'month'">
      <div class="date-picker-header">
        <div class="pick-arrow" @click="clickIncreaseYear(-10)">«</div>
        <div class="pick-arrow" @click="clickIncreaseYear(-1)">‹</div>
        <div class="month-year" @click.stop="type = 'date'">
          {{ new Date(currentTime).getFullYear() }}
        </div>
        <div class="pick-arrow" @click="clickIncreaseYear(1)">›</div>
        <div class="pick-arrow" @click="clickIncreaseYear(10)">»</div>
      </div>
      <div class="date-picker-content grid-month">
        <div
          v-for="(month, index) in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]"
          :key="index"
          class="grid-item item-month"
          @click.stop="selectMonth(month)">
          <div
            :class="{
              'grid-item-inner': true,
              'active': month === currentMonth,
            }">
            {{ (month + 1).toString().padStart(2, '0') }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.date-picker-container {
  width: 100%;
  max-width: 400px;
  border: 1px solid #ccc;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  .date-picker-header {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #ccc;
    background-color: #5884c4;
    color: #fff;
    font-weight: bold;

    .month-year {
      flex: 2;
      padding: 6px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      user-select: none;
    }
    .pick-arrow {
      flex: 1;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      user-select: none;
    }
  }
  .date-picker-content {
    background-color: #fff;
    padding-bottom: 8px;
    .grid-item {
      cursor: pointer;
      display: flex;
      .grid-item-inner {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        user-select: none;
        &:hover {
          background-color: #f2f2f2;
        }
        &.outside {
          opacity: 0.3;
        }
        &.active {
          background-color: #5884c4;
          color: #fff;
        }
      }
    }
    &.grid-date {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      grid-template-rows: auto 1fr 1fr 1fr 1fr 1fr 1fr;
      .item-day {
        background-color: #f0f0f0;
        border-bottom: 1px solid #aeaeae;
        padding: 6px 4px;
      }
      .item-date {
        padding: 4px;
        .grid-item-inner {
          padding: 4px 4px;
          border-radius: 4px;
        }
      }
    }
    &.grid-year {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      grid-template-rows: repeat(5, 1fr);
      .item-year {
        padding: 4px;
        .grid-item-inner {
          padding: 6px 4px;
          border-radius: 4px;
        }
      }
    }
    &.grid-month {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(4, 1fr);
      .item-month {
        padding: 4px;
        .grid-item-inner {
          padding: 6px 4px;
          border-radius: 4px;
        }
      }
    }
  }
}
</style>
