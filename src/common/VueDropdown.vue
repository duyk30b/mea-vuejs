<template>
  <div class="vue-dropdown-container" ref="containerRef">
    <div class="dropdown-trigger" @click="toggleDropdown" ref="triggerRef">
      <slot name="trigger"></slot>
    </div>

    <Transition
      :name="dropdownPosition.includes('top') ? 'slide-up' : 'slide-down'"
      @before-enter="beforeEnter"
      @enter="enter"
      @leave="leave"
    >
      <div v-show="isOpen" class="dropdown-content" :class="dropdownPosition" ref="dropdownRef">
        <slot></slot>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onUnmounted, ref } from 'vue'

const props = defineProps({
  offset: { type: Number, default: 0 },
  closeOnClickOutside: { type: Boolean, default: true },
  closeOnClickInside: { type: Boolean, default: true },
  closeOnEsc: { type: Boolean, default: true },
})

const isOpen = ref(false)
const dropdownPosition = ref('bottom-start')
const containerRef = ref<HTMLElement>(null as any)
const triggerRef = ref<HTMLElement>(null as any)
const dropdownRef = ref<HTMLElement>(null as any)

const toggleDropdown = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await nextTick()
    calculatePosition()
    document.addEventListener('click', handleClick)
    window.addEventListener('resize', calculatePosition)
    window.addEventListener('scroll', calculatePosition, true)
    if (props.closeOnEsc) {
      window.addEventListener('keydown', handleEscKey)
    }
  }
}

const calculatePosition = () => {
  if (!triggerRef.value || !dropdownRef.value) return

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const dropdownRect = dropdownRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  const spaceBelow = viewportHeight - triggerRect.bottom
  const spaceAbove = triggerRect.top
  const shouldShowOnTop = spaceBelow < dropdownRect.height && spaceAbove > dropdownRect.height

  const spaceRight = viewportWidth - triggerRect.left
  const shouldAlignRight = spaceRight < (dropdownRect.width + 20) // + 20 do có scroll dễ làm vỡ

  if (shouldShowOnTop) {
    if (shouldAlignRight) {
      dropdownPosition.value = 'top-end'
    } else {
      dropdownPosition.value = 'top-start'
    }
  } else {
    if (shouldAlignRight) {
      dropdownPosition.value = 'bottom-end'
    } else {
      dropdownPosition.value = 'bottom-start'
    }
  }
}

const handleClick = (event: MouseEvent) => {
  if (!containerRef.value) return

  if (!containerRef.value.contains(event.target as any)) {
    if (props.closeOnClickOutside) {
      isOpen.value = false
      removeListeners()
    }
  }

  if (dropdownRef.value.contains(event.target as any)) {
    if (props.closeOnClickInside) {
      isOpen.value = false
      removeListeners()
    }
  }
}

const handleEscKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    isOpen.value = false
    removeListeners()
  }
}

const removeListeners = () => {
  document.removeEventListener('click', handleClick)
  window.removeEventListener('resize', calculatePosition)
  window.removeEventListener('scroll', calculatePosition, true)
  window.removeEventListener('keydown', handleEscKey)
}

const beforeEnter = (el: any) => {
  el.style.opacity = 0
  el.style.transformOrigin = dropdownPosition.value.includes('top') ? 'bottom' : 'top'
}

const enter = (el: any, done: any) => {
  const delay = 50
  setTimeout(() => {
    el.style.opacity = 1
    el.style.transform = 'scaleY(1)'
    done()
  }, delay)
}

const leave = (el: any) => {
  el.style.opacity = 0
  el.style.transform = 'scaleY(0.8)'
}

onUnmounted(() => {
  removeListeners()
})
</script>

<style scoped>
.vue-dropdown-container {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  position: absolute;
  z-index: 100;
  min-width: 100px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

/* Position classes */
.top-start {
  bottom: calc(100% + v-bind(offset + 'px'));
  left: 0;
}

.top-end {
  bottom: calc(100% + v-bind(offset + 'px'));
  right: 0;
}

.bottom-start {
  top: calc(100% + v-bind(offset + 'px'));
  left: 0;
}

.bottom-end {
  top: calc(100% + v-bind(offset + 'px'));
  right: 0;
}

.slide-down-enter-active,
.slide-down-leave-active,
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: scaleY(0.8) translateY(-10px);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: scaleY(0.8) translateY(10px);
}
</style>
