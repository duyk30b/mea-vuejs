<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-mask" @mousedown.self="closeModal">
        <div class="modal-container" :style="style">
          <slot>
            <div style="padding: 20px; background-color: #fff">
              <div>Modal Header</div>
              <div>
                <button @click="closeModal">Close</button>
              </div>
            </div>
          </slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts">
import type { PropType, StyleValue } from 'vue'

export default {
  props: {
    show: { type: Boolean, default: () => false },
    style: {
      type: [String, Object] as PropType<StyleValue>,
      default: () => ({ width: '800px' }),
    },
  },
  emits: ['update:show'],
  methods: {
    closeModal() {
      this.$emit('update:show', false)
    },
  },
}
</script>

<style>
.modal-mask {
  position: fixed;
  z-index: 99;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  transition: opacity 0.2s ease;
}

.modal-container {
  max-width: 96%;
  max-height: 90%;
  overflow-y: auto;
  width: 800px;
  margin-top: auto;
  margin-bottom: auto;
  margin-left: auto;
  margin-right: auto;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.2s ease;
}

.modal-enter-from {
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  -webkit-transform: scale(0.8);
  transform: scale(0.8);
}
</style>
