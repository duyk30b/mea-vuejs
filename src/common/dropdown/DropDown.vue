<template>
  <div ref="triggerRef" @click="toggle" style="display: inline-block">
    <slot name="trigger"></slot>
  </div>

  <teleport to="body">
    <transition name="slide">
      <div v-if="visible" ref="dropdownRef" class="dropdown" :style="dropdownStyle">
        <slot name="content"></slot>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watchEffect, nextTick } from 'vue'

const visible = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref({}) // type <Partial<CSSStyleDeclaration>>

const toggle = async () => {
  visible.value = !visible.value
  await nextTick()
  if (visible.value) {
    updatePosition()
  }
}

const updatePosition = () => {
  const trigger = triggerRef.value
  const dropdown = dropdownRef.value
  if (!trigger || !dropdown) return

  const triggerRect = trigger.getBoundingClientRect()
  const dropdownRect = dropdown.getBoundingClientRect()

  let top = triggerRect.bottom
  let left = triggerRect.left

  // Nếu không đủ chỗ dưới, hiển thị lên trên
  if (window.innerHeight < triggerRect.bottom + dropdownRect.height) {
    top = triggerRect.top - dropdownRect.height
  }

  // Nếu không đủ chỗ bên trái, đẩy sang phải 1 chút
  if (left + dropdownRect.width > window.innerWidth) {
    left = window.innerWidth - dropdownRect.width - 8
  }

  dropdownStyle.value = {
    position: 'absolute',
    top: `${top + window.scrollY}px`,
    left: `${left + window.scrollX}px`,
    zIndex: '9999',
  }
}

const hideOnClickOutside = (e: MouseEvent) => {
  if (
    !triggerRef.value?.contains(e.target as Node) &&
    !dropdownRef.value?.contains(e.target as Node)
  ) {
    visible.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', hideOnClickOutside)
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', hideOnClickOutside)
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
})

watchEffect(() => {
  if (visible.value) updatePosition()
})
</script>

<style scoped>
.dropdown {
  background: white;
  border: 1px solid #ddd;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  min-width: 120px;
  padding: 8px 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease;
  transition: opacity 0.2s ease;
}
.slide-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
