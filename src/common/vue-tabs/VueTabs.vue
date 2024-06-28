<template>
  <div class="vue-tabs">
    <div class="tab-menu">
      <slot name="menu"></slot>
    </div>
    <div class="tab-panel">
      <slot name="panel" :tabSelect="tabSelect"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'

const props = withDefaults(
  defineProps<{
    tabStart?: string | number
  }>(),
  {
    tabStart: 0,
  }
)

const emit = defineEmits<{ (e: 'changeTab', value: string | number): void }>()
const tabSelect = ref<string | number>(props.tabStart)

const listenTabChange = (value: string | number) => {
  tabSelect.value = value
  emit('changeTab', value)
}

provide('eventTabChange', listenTabChange)
provide('tabSelect', tabSelect)
</script>

<style lang="scss">
.vue-tabs {
  .tab-menu {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    border-bottom: 1px solid #cdcdcd;
  }
  .tab-panel {
    background-color: #fff;
  }
}
</style>
