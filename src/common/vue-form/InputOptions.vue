<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import IconClearCircle from '../icon/IconClearCircle.vue'
import IconClearOutline from '../icon/IconClearOutline.vue'
import IconSearch from '../icon/IconSearch.vue'

const props = withDefaults(
  defineProps<{
    value?: string | number | boolean | null
    options?: { value: any; text: string; data?: any }[]
    disabled?: boolean
    placeholder?: string
    maxHeight?: number
    required?: boolean
    clearAfterSelected?: boolean
    noClearTextWhenNotSelected?: boolean
    logicFilter?: Function
  }>(),
  {
    value: null,
    options: () => [],
    disabled: false,
    placeholder: '',
    maxHeight: 300,
    required: false,
    clearAfterSelected: false,
    noClearTextWhenNotSelected: false,
    logicFilter: () => true,
  }
)

const emit = defineEmits<{
  (e: 'update:text', value: string): void
  (e: 'update:value', value: string | number | boolean | null): void
  (e: 'selectItem', value: { value?: any; text?: string; data?: any }): void
}>()

const inputRef = ref<HTMLInputElement>()
const optionsElement = ref<HTMLElement>()

const searchText = ref('')
const indexFocus = ref<number>(-1)
const showOptions = ref<boolean>(false)
const itemSelected = ref<any>(null)

const optionsFilter = computed(() => {
  return props.options.filter((item) => {
    return props.logicFilter(item, searchText.value || '')
  })
})

watch(
  () => props.value, // mục đích của watch value là để tìm và show ra text
  (newVal) => {
    if (newVal != null) {
      const optionsWatch = props.options.filter((item) => props.logicFilter(item, searchText.value))
      const findIndex = optionsWatch.findIndex((item) => item.value === newVal)
      if (findIndex === -1) {
        itemSelected.value = {}
        searchText.value = ''
        emit('update:text', '')
      } else {
        const item = optionsWatch[findIndex]
        itemSelected.value = item
        searchText.value = item.text
        // indexFocus.value = findIndex // muốn focus đến thằng nào đang giữ luôn, nhưng lỗi, chưa giải quyết được
        emit('update:text', item.text)
      }
    }
  },
  { immediate: true }
)

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  indexFocus.value = -1
  showOptions.value = true

  itemSelected.value = null
  searchText.value = target.value
  emit('update:text', target.value)
  emit('update:value', null)
  // emit('selectItem', {}) // không được bắn event này khi input, nó làm ô input nháy khi gõ
}

const handleClickOutside = () => {
  showOptions.value = false
  if (itemSelected.value == null && !props.noClearTextWhenNotSelected) {
    searchText.value = ''
    emit('update:text', '')
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Tab' || e.key === 'Escape') {
    showOptions.value = false
    if (itemSelected.value == null && !props.noClearTextWhenNotSelected) {
      searchText.value = ''
      emit('update:text', '')
    }
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

const handleClickClear = () => {
  if (props.disabled) return
  indexFocus.value = -1
  showOptions.value = false

  itemSelected.value = null
  searchText.value = ''

  emit('update:text', '')
  emit('update:value', null)
  emit('selectItem', {})
}

const handleSelectItem = (index: number) => {
  indexFocus.value = -1
  showOptions.value = false

  const item = optionsFilter.value[index]

  emit('update:text', item.text)
  emit('update:value', item.value)
  emit('selectItem', item) // phải để event này cuối cùng, để ghi đè: update:text

  if (props.clearAfterSelected) {
    itemSelected.value = null
    searchText.value = ''
  } else {
    itemSelected.value = item
    searchText.value = item.text
  }
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

const focus = () => inputRef.value?.focus()
const clear = () => {
  itemSelected.value = null
  searchText.value = ''
}
const setItem = (item: { text?: string; value?: any; data: any }) => {
  searchText.value = item.text || ''
  itemSelected.value = item.data || 0
}

defineExpose({ focus, clear, setItem })
</script>

<template>
  <div v-click-outside="handleClickOutside" :class="{ 'vue-input': true, disabled }">
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
        @focusin="showOptions = true"
      />
    </div>
    <div class="icon-append">
      <IconSearch class="icon-blur" />
      <IconClearOutline class="icon-clear-hover" @click="handleClickClear" />
      <IconClearCircle class="icon-clear-focus" @click="handleClickClear" />
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
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
