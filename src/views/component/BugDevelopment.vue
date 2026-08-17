<script lang="ts" setup>
import { IconBug } from '@/common/icon-antd'
import JsonViewer from '@/common/JsonViewer.vue'
import { VueTooltip } from '@/common/popover'

const emit = defineEmits<{ (e: 'update:isOpen', value: boolean): void }>()

const props = withDefaults(
  defineProps<{
    data: object
    maxHeight?: number | string
    maxWidth?: number | string
  }>(),
  {
    maxWidth: '800px',
    maxHeight: '600px',
  },
)

const handleIsOpenChange = (value: boolean) => {
  emit('update:isOpen', value)
}
</script>

<template>
  <VueTooltip :maxHeight="maxHeight" :maxWidth="`min(100%, ${maxWidth})`" @update:is-open="handleIsOpenChange">
    <template #trigger>
      <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
    </template>
    <JsonViewer :text="JSON.stringify(data, null, 4)" theme="dark" />
    <!-- <pre style="">{{ JSON.stringify(data, null, 4) }}</pre> -->
  </VueTooltip>
</template>

<style scoped>
a {
  color: inherit;
  text-decoration: none;
}

/* pre {
  white-space: pre-wrap;
  overflow-wrap: break-word;
} */
</style>
