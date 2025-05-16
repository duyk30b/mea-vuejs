<template>
  <Popover
    :position="{ horizontal: 'end', vertical: 'bottom' }"
    :custom-style="{
      offset: 8,
      arrow: true,
      dropdownArrow: { backgroundColor: '#bbb' },
      dropdownContent: { backgroundColor: 'white' },
    }"
  >
    <template #trigger>
      <slot name="trigger"></slot>
    </template>
    <template #content>
      <slot></slot>
    </template>
  </Popover>
</template>

<script lang="ts" setup>
import Popover from './Popover.vue'
</script>

<style lang="scss" scoped></style>
