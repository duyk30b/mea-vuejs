<template>
  <div class="tab-menu-item" :class="tabSelect == tabKey ? 'active' : ''" @click="handleClick">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'

const emit = defineEmits<{ (e: 'active', value: string | number): void }>()

const emitTabChange = inject<(value: string | number) => void>('eventTabChange')
const tabSelect = inject<Ref<string | number>>('tabSelect')

const props = defineProps<{
  tabKey: string | number
}>()

const handleClick = (e: Event) => {
  if (emitTabChange) {
    emitTabChange(props.tabKey)
    emit('active', props.tabKey)
  }
}
</script>

<style lang="scss" scoped>
.tab-menu-item {
  padding: 6px 20px;
  cursor: pointer;
  border: 1px solid #cdcdcd;
  border-top: 5px solid #d6d6d6;
  margin-bottom: -1px;
  white-space: nowrap;
  background-color: #f5f5f5;
  opacity: 1;
  display: flex;
  align-items: center;
  gap: 0.5em;

  &.active {
    border-top-color: #1890ff;
    color: #1890ff;
    border-bottom: 0;
    font-weight: 500;
    opacity: 1;
    background-color: white;
  }
}
</style>
