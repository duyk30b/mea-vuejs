<template>
  <Popover
    show-on-hover
    :custom-style="{
      arrow: true,
      offset: 10,
      dropdownArrow: { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
      dropdownContent: { backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white' },
    }"
    :position="{ horizontal: 'center', vertical: 'top' }"
    :delay="1000"
  >
    <template #trigger>
      <slot name="trigger"></slot>
    </template>
    <template #content>
      <div class="tooltip-content">
        <slot></slot>
      </div>
    </template>
  </Popover>
</template>

<script lang="ts" setup>
import Popover from './Popover.vue'
</script>

<style lang="scss" scoped>
.tooltip-content {
  padding: 4px 10px;
}
</style>
