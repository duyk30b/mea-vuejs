<!-- VueTabPanel.vue -->
<template>
  <div v-if="render" v-show="tabSelect == tabKey" class="tab-panel-item">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch, type Ref } from 'vue'

const tabSelect = inject<Ref<string | number>>('tabSelect')

const props = withDefaults(
  defineProps<{
    tabKey: string | number
    renderOnStart?: boolean
    destroyOnInActive?: boolean
  }>(),
  {
    tabKey: 0,
    renderOnStart: false,
    destroyOnInActive: false,
  }
)

const renderCount = ref<number>(Number(props.renderOnStart))

watch(
  () => tabSelect?.value,
  (newVal) => {
    if (newVal === props.tabKey) renderCount.value++
  },
  { immediate: true }
)

const render = computed(() => {
  return tabSelect?.value === props.tabKey || (renderCount.value > 0 && !props.destroyOnInActive)
})
</script>

<style lang="scss" scoped></style>
