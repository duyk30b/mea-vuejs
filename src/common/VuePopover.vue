<script setup lang="ts">
import { ref, type PropType, type StyleValue, onMounted, onUnmounted, type Ref } from 'vue'

const root = ref(null) as Ref<HTMLElement | null>

const docClick = (e: Event) => {
}
onMounted(() => {
  document.body.addEventListener('click', docClick)
})

onUnmounted(() => {
  document.body.removeEventListener('click', docClick)
})

const show = ref(false)
</script>

<template>
  <div style="position: relative">
    <slot>
      <div @click="show = true">
        <div>Click here show popover</div>
      </div>
    </slot>
    <Transition name="popover">
      <div v-if="show" class="popover-container right">
        <slot name="popover">
          <div style="padding: 20px; background-color: #fff">
            <div>Popover Header</div>
            <div>
              <button @click="show = false">Close</button>
            </div>
          </div>
        </slot>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.popover-container {
  position: absolute;
  width: 500px;
  max-width: 100vw;
  height: 400px;
  bottom: calc(100% + 20px);

  transition: all 0.2s ease;

  background-color: #fff;
  border-radius: 2px;
  box-shadow:
    0 3px 6px -4px rgba(0, 0, 0, 0.12),
    0 6px 16px 0 rgba(0, 0, 0, 0.08),
    0 9px 28px 8px rgba(0, 0, 0, 0.05);
  z-index: 9;

  &.right {
    right: 0;
  }

  &.left {
    left: 0;
  }
}

.popover-enter-from {
  opacity: 0;
}

.popover-leave-to {
  opacity: 0;
}

.popover-enter-from .popover-container,
.popover-leave-to .popover-container {
  -webkit-transform: scale(0.9);
  transform: scale(0.9);
}
</style>
