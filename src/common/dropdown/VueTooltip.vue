<template>
  <div class="vue-dropdown-container" ref="containerRef">
    <div class="dropdown-trigger" ref="triggerRef">
      <slot name="trigger"></slot>
    </div>
    <Teleport to="body">
      <Transition :name="position.vertical === 'top' ? 'slide-up' : 'slide-down'">
        <div
          v-show="isOpen"
          class="dropdown-content"
          :class="isClick ? 'dropdown-content-fix' : ''"
          :style="customStyle?.dropdown || ''"
          ref="dropdownRef"
        >
          <div
            class="dropdown-arrow"
            :class="`arrow-${positionFix.vertical} arrow-${positionFix.horizontal}`"
            ref="dropdownArrow"
          ></div>
          <slot></slot>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import {
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  type PropType,
  type StyleValue,
} from 'vue'

const props = defineProps({
  position: {
    type: Object as PropType<{
      vertical: 'top' | 'bottom' | 'middle'
      horizontal: 'start' | 'end' | 'center'
    }>,
    default: () => ({ vertical: 'top', horizontal: 'center' }),
  },
  customStyle: {
    type: Object as PropType<{ dropdown?: StyleValue }>,
  },
  offset: { type: Number, default: 10 },
  delay: { type: Number, default: 1000 },
})

const isOpen = ref(false)
let isHover = false
const isClick = ref(false)

const positionFix = reactive<{
  vertical: 'top' | 'bottom' | 'middle'
  horizontal: 'start' | 'end' | 'center'
}>({
  vertical: props.position.vertical,
  horizontal: props.position.horizontal,
})
const containerRef = ref<HTMLElement>(null as any)
const triggerRef = ref<HTMLElement>(null as any)
const dropdownRef = ref<HTMLElement>(null as any)
const dropdownArrow = ref<HTMLElement>(null as any)

const calculatePosition = () => {
  if (!triggerRef.value || !dropdownRef.value || !isOpen.value) return

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const dropdownRect = dropdownRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  const spaceBelow = viewportHeight - triggerRect.bottom
  const spaceAbove = triggerRect.top
  const spaceRight = viewportWidth - triggerRect.left
  const spaceLeft = triggerRect.left

  const spaceDropdownRectHeight =
    props.position.vertical === 'middle' ? dropdownRect.height / 2 : dropdownRect.height
  if (props.position.vertical !== 'top' && spaceBelow < spaceDropdownRectHeight) {
    positionFix.vertical = 'top'
  } else if (props.position.vertical !== 'bottom' && spaceAbove < spaceDropdownRectHeight) {
    positionFix.vertical = 'bottom'
  } else {
    positionFix.vertical = props.position.vertical
  }

  const spaceDropdownRectWidth =
    props.position.horizontal === 'center' ? dropdownRect.width / 2 : dropdownRect.width
  if (props.position.horizontal !== 'end' && spaceRight < spaceDropdownRectWidth) {
    positionFix.horizontal = 'end'
  } else if (props.position.horizontal !== 'start' && spaceLeft < spaceDropdownRectWidth) {
    positionFix.horizontal = 'start'
  } else {
    positionFix.horizontal = props.position.horizontal
  }

  if (positionFix.vertical === 'top') {
    dropdownRef.value.style.top =
      triggerRect.top - dropdownRect.height + window.scrollY - props.offset + 'px'
    dropdownRef.value.style.transformOrigin = 'bottom'
  } else if (positionFix.vertical === 'bottom') {
    dropdownRef.value.style.top = triggerRect.bottom + window.scrollY + props.offset + 'px'
    dropdownRef.value.style.transformOrigin = 'top'
  }

  if (positionFix.horizontal === 'start') {
    dropdownRef.value.style.left = triggerRect.left + window.scrollX + 'px'
    dropdownArrow.value.style.left = triggerRect.width / 2 + 'px'
    dropdownArrow.value.style.transform = 'translateX(-50%)'
  } else if (positionFix.horizontal === 'end') {
    dropdownRef.value.style.left = triggerRect.right - dropdownRect.width + window.scrollX + 'px'
    dropdownArrow.value.style.right = triggerRect.width / 2 + 'px'
    dropdownArrow.value.style.transform = 'translateX(50%)'
  } else if (positionFix.horizontal === 'center') {
    dropdownRef.value.style.left =
      triggerRect.left + triggerRect.width / 2 - dropdownRect.width / 2 + window.scrollX + 'px'
    dropdownArrow.value.style.left = '50%'
    dropdownArrow.value.style.transform = 'translateX(-50%)'
  }
}
onMounted(() => {
  document.addEventListener('click', handleClickDocument)
  document.addEventListener('mouseover', handleMouseOverDocument)
  document.addEventListener('scroll', calculatePosition, true)
  // document.addEventListener('resize', calculatePosition, true)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickDocument)
  document.removeEventListener('mouseover', handleMouseOverDocument)
  document.removeEventListener('scroll', calculatePosition, true)
  // document.removeEventListener('resize', calculatePosition, true)
})

const handleClickDocument = async (event: MouseEvent) => {
  if (!containerRef.value) return
  if (
    !containerRef.value.contains(event.target as any) &&
    !dropdownRef.value.contains(event.target as any)
  ) {
    isClick.value = false
    isOpen.value = false
  }
  if (containerRef.value.contains(event.target as any)) {
    isClick.value = true
    isOpen.value = true
    await nextTick()
    calculatePosition()
  }
}
let timeout = null as any
const handleMouseOverDocument = async (event: MouseEvent) => {
  if (!containerRef.value) return
  if (
    !containerRef.value.contains(event.target as any) &&
    !dropdownRef.value.contains(event.target as any)
  ) {
    isHover = false
    if (isOpen.value) {
      if (!timeout) {
        timeout = setTimeout(() => {
          if (isHover === false && !isClick.value) {
            isOpen.value = false
          }
        }, props.delay)
      }
    }
  }
  if (containerRef.value.contains(event.target as any)) {
    isHover = true
    isOpen.value = true
    await nextTick()
    calculatePosition()
    if (timeout != null) {
      clearTimeout(timeout)
      timeout = null
    }
  }
}
</script>

<style lang="scss" scoped>
.vue-dropdown-container {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  padding: 4px 8px;
  color: white;
  position: absolute;
  z-index: 9999;
  min-width: 100px;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
  background-color: rgba(0, 0, 0, 0.7);
  &.dropdown-content-fix {
    border: 1px solid #cdcdcd;
  }
}

.slide-down-enter-active,
.slide-down-leave-active,
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-to,
.slide-down-leave-from,
.slide-up-enter-to,
.slide-up-leave-from {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: scaleY(1) translateY(-10px);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: scaleY(1) translateY(10px);
}

.dropdown-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
  &.arrow-top {
    bottom: -4px;
    border-width: 4px 4px 0 4px;
    border-color: rgba(0, 0, 0, 0.85) transparent transparent transparent;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  &.arrow-bottom {
    top: -4px;
    border-width: 0 4px 4px 4px;
    border-color: transparent transparent rgba(0, 0, 0, 0.85) transparent;
    box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
  }
}
</style>
