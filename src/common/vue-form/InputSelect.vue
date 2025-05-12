<template>
  <div class="input-select" ref="wrapperRef">
    <div class="input-select-display" @click="toggleDropdown" :tabindex="0" @keydown="onKeyDown">
      <div class="label">{{ selectedLabel }}</div>
      <div v-if="!isOpen" class="arrow">&#9662;</div>
      <div v-else class="arrow">&#9652;</div>
    </div>

    <!-- Teleport dropdown to body -->
    <teleport to="body">
      <div v-if="isOpen" class="input-select-dropdown" :style="dropdownStyle" ref="dropdownRef">
        <div
          v-for="(option, index) in options"
          :key="option.value"
          class="input-select-option"
          :class="{ active: index === highlightedIndex }"
          @click="selectOption(option)"
        >
          {{ option.label }}
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

export type InputSelectOption = {
  value: string | number
  label: string
}

const props = defineProps<{
  options: InputSelectOption[]
  value: string | number | null | undefined
  height?: string
}>()

const emit = defineEmits<{
  (e: 'update:value', value: string | number): void
}>()

const wrapperRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const isOpen = ref(false)
const highlightedIndex = ref(-1)
const dropdownStyle = ref<Record<string, string>>({})

const selectedLabel = computed(() => {
  return props.options.find((o) => o.value === props.value)?.label || 'Chọn...'
})

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    updateDropdownPosition()
    nextTick(() => {
      highlightedIndex.value = props.options.findIndex((o) => o.value === props.value)
    })
  }
}

function updateDropdownPosition() {
  if (!wrapperRef.value) return
  const rect = wrapperRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'absolute',
    top: `${rect.bottom + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
    zIndex: '9999',
    background: 'white',
    border: '1px solid #ccc',
    maxHeight: props.height || '200px',
    overflowY: 'auto',
  }
}

function selectOption(option: InputSelectOption) {
  emit('update:value', option.value)
  isOpen.value = false
}

function onClickOutside(e: MouseEvent) {
  if (
    wrapperRef.value &&
    !wrapperRef.value.contains(e.target as Node) &&
    (!dropdownRef.value || !dropdownRef.value.contains(e.target as Node))
  ) {
    isOpen.value = false
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (!isOpen.value) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      toggleDropdown()
      e.preventDefault()
    }
    return
  }

  if (e.key === 'ArrowDown') {
    highlightedIndex.value = (highlightedIndex.value + 1) % props.options.length
    e.preventDefault()
  } else if (e.key === 'ArrowUp') {
    highlightedIndex.value =
      (highlightedIndex.value - 1 + props.options.length) % props.options.length
    e.preventDefault()
  } else if (e.key === 'Enter') {
    const option = props.options[highlightedIndex.value]
    if (option) {
      selectOption(option)
    }
  } else if (e.key === 'Escape') {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style lang="scss" scoped>
.input-select {
  position: relative;
  .input-select-display {
    padding: 8px;
    border: 1px solid #ccc;
    background: white;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    .label {
      flex-grow: 1;
      user-select: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .arrow {
      transform: scaleX(1.6);
      color: #777;
    }
  }
}

.input-select-dropdown {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  .input-select-option {
    padding: 8px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    &:hover {
      background: #e9e9e9;
    }
    &.active {
      background-color: dodgerblue;
      color: #fff;
    }
  }
}
</style>
