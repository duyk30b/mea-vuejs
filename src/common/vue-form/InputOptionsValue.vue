<script lang="ts" setup>
import { CONFIG } from '@/config'
import { computed, nextTick, ref, watch } from 'vue'
import { IconSearch } from '../icon-antd'

export type ItemOption = { value: number; text: string; data?: any }

const props = withDefaults(
  defineProps<{
    value: number
    options: ItemOption[]
    disabled?: boolean
    placeholder?: string
    maxHeight?: number
    prepend?: string
    required?: boolean
    limit?: number
    logicFilter?: (item: ItemOption, text: string) => boolean
    clearTextIfNoSelect?: boolean
    messageNoResult?: string
  }>(),
  {
    value: 0,
    options: () => [],
    disabled: false,
    placeholder: '',
    maxHeight: 300,
    limit: 100,
    prepend: undefined,
    required: false,
    logicFilter: () => true,
    clearTextIfNoSelect: true,
    messageNoResult: 'Không tìm thấy kết quả phù hợp',
  },
)

const emit = defineEmits<{
  (e: 'searching', value: string): void
  (e: 'update:text', value: string): void
  (e: 'update:value', value: string | number | boolean | null): void
  (e: 'selectItem', value: ItemOption | undefined): void
}>()

const inputRef = ref<HTMLInputElement>()
const optionsElement = ref<HTMLElement>()

const searchText = ref('')
const indexFocus = ref<number>(-1)
const showOptions = ref<boolean>(false)

const currentValue = ref(0)
let propsText = '' // lấy text từ item select khi chọn

const randomId = computed(() => {
  return Math.random().toString(36).substring(2)
})

const optionsFilter = computed(() => {
  const optionsResult = []
  for (let i = 0; i < props.options.length; i++) {
    const item = props.options[i]
    if (props.logicFilter(item, searchText.value || '')) {
      optionsResult.push(item)
    }
    if (optionsResult.length >= props.limit) {
      break
    }
  }
  return optionsResult
})

watch(
  () => props.value,
  (newValue, oldValue) => {
    if (currentValue.value === newValue) return
    currentValue.value = newValue

    const findIndex = props.options.findIndex((item) => item.value === newValue)
    if (findIndex === -1) {
      searchText.value = ''
      propsText = ''
      emit('update:text', '')
    } else {
      const item = props.options[findIndex]
      searchText.value = item.text
      propsText = item.text
      // indexFocus.value = findIndex // muốn focus đến thằng nào đang giữ luôn, nhưng lỗi, chưa giải quyết được
      emit('update:text', item.text)
    }
  },
  { immediate: true },
)

let optionsStringify = ''
watch(
  () => props.options,
  (newValue, oldValue) => {
    const optionsStringifyNew = JSON.stringify(props.options)
    if (optionsStringify === optionsStringifyNew) return
    optionsStringify = optionsStringifyNew

    if (!props.value) return

    const findIndex = newValue.findIndex((item) => item.value === props.value)
    if (findIndex === -1) {
      searchText.value = ''
      propsText = ''
      emit('update:text', '')
    } else {
      const item = props.options[findIndex]
      searchText.value = item.text || ''
      propsText = item.text || ''
      // indexFocus.value = findIndex // muốn focus đến thằng nào đang giữ luôn, nhưng lỗi, chưa giải quyết được
      emit('update:text', item.text)
    }
  },
  { immediate: true },
)

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  indexFocus.value = -1
  showOptions.value = true

  currentValue.value = 0
  searchText.value = target.value
  emit('searching', target.value)
  emit('update:text', target.value)

  if (!searchText.value) {
    currentValue.value = 0
    if (props.value) {
      emit('update:value', 0)
      emit('selectItem', undefined)
    }
  } else {
    if (searchText.value === propsText) {
      currentValue.value = props.value
    }
  }
}

const handleClickOutside = () => {
  showOptions.value = false

  if (!currentValue.value) {
    if (props.clearTextIfNoSelect) {
      if (searchText.value) {
        searchText.value = ''
        emit('update:text', '')
      }
      if (propsText) propsText = ''
    }

    if (props.value) {
      emit('update:value', 0)
      emit('selectItem', undefined)
    }
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Tab' || e.key === 'Escape') {
    handleClickOutside()
  } else if (e.key === 'ArrowDown') {
    indexFocus.value += 1
    if (indexFocus.value >= optionsFilter.value.length) indexFocus.value = 0
    setScrollOption('ArrowDown')
  } else if (e.key === 'ArrowUp') {
    indexFocus.value -= 1
    if (indexFocus.value < 0) indexFocus.value = optionsFilter.value.length - 1
    setScrollOption('ArrowUp')
  } else if (e.key === 'Enter') {
    e.preventDefault()
    showOptions.value = !showOptions.value
    if (indexFocus.value !== -1) {
      handleSelectItem(indexFocus.value)
    }
  }
}

const handleSelectItem = (index: number) => {
  indexFocus.value = -1
  showOptions.value = false

  const item = optionsFilter.value[index]

  currentValue.value = item.value
  propsText = item.text || ''
  searchText.value = item.text || ''

  emit('update:text', item.text)
  emit('update:value', item.value)
  emit('selectItem', item) // phải để event này cuối cùng, để ghi đè: update:text
}

const setScrollOption = (type: 'ArrowUp' | 'ArrowDown') => {
  nextTick(() => {
    if (!optionsElement.value) return
    const activeItem = optionsElement.value.querySelector('.item-option.active') as HTMLElement
    if (!activeItem) return

    const topItem = activeItem.offsetTop
    const bottomItem = activeItem.offsetTop + activeItem.offsetHeight

    // nếu item vẫn đang trong khoảng có thể hiển thị thì không scroll
    if (
      topItem > optionsElement.value.scrollTop &&
      bottomItem < optionsElement.value.scrollTop + props.maxHeight
    ) {
      return
    }
    if (type === 'ArrowUp') optionsElement.value.scrollTop = topItem - 20
    if (type === 'ArrowDown') optionsElement.value.scrollTop = bottomItem - props.maxHeight + 20
  })
}

const focus = () => {
  if (inputRef.value) {
    inputRef.value.focus()
    inputRef.value.selectionStart = inputRef.value.selectionEnd = inputRef.value.value.length
  }
}

const onFocusin = () => {
  showOptions.value = true
}

defineExpose({ focus })
</script>

<template>
  <div v-click-outside="handleClickOutside" :class="{ 'vue-input': true, disabled }">
    <div v-if="prepend" class="prepend">
      <span>{{ prepend }}</span>
    </div>
    <div class="input-area">
      <input
        ref="inputRef"
        :value="searchText"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        @input="handleInput"
        @keydown="handleKeydown"
        @focusin="onFocusin"
      />
    </div>
    <div v-if="CONFIG.MODE === 'development'" class="development" style="color: violet">
      {{ randomId }} - {{ currentValue }} - {{ optionsFilter.length }}/{{ options.length }}
    </div>
    <div class="icon-append">
      <IconSearch class="icon-blur" />
      <!-- đang có lỗi icon-clear trên iphone (click 2 lần mới focus được vào ô input) -->
      <!-- <IconClearOutline class="icon-clear-hover" @click="handleClickClear" />
      <IconClearCircle class="icon-clear-blur" @click="handleClickClear" /> -->
    </div>
    <div
      v-if="showOptions"
      ref="optionsElement"
      class="options"
      :style="{ maxHeight: `${maxHeight}px` }"
    >
      <div
        v-for="(item, index) in optionsFilter"
        :key="index"
        :class="{ 'item-option': true, 'active': index == indexFocus }"
        @click="handleSelectItem(index)"
      >
        <slot name="option" :item="item" :index="index">
          <div class="item-text">{{ item.text }}</div>
        </slot>
      </div>
      <div
        v-if="!!messageNoResult && !optionsFilter.length && searchText"
        class="item-option"
        style="font-style: italic"
      >
        {{ messageNoResult }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.prepend {
  min-width: 60px;
  text-align: center;
  justify-content: center;
  align-items: center;
}
.development {
  position: absolute;
  right: 30px;
  bottom: 0;
  font-size: 0.8em;
  transform: translate(0, 50%);
  background-color: white;
  padding: 4px;
}
</style>
