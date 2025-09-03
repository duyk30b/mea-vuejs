<script lang="ts" setup>
import { IconSortDown, IconSortUp } from '@/common/icon-font-awesome'

const props = withDefaults(
  defineProps<{
    index: number
    disabledUp?: boolean
    disabledDown?: boolean
  }>(),
  {
    index: 0,
    disabledUp: false,
    disabledDown: false,
  },
)

const emit = defineEmits<{
  (e: 'clickUp'): void
  (e: 'clickDown'): void
}>()
</script>

<template>
  <div class="flex flex-col items-center">
    <button
      type="button"
      style="
        border: none;
        font-size: 1.2rem;
        line-height: 0.5;
        background: none;
        margin-bottom: -0.5rem;
      "
      class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
      :disabled="disabledUp"
      @click="emit('clickUp')"
    >
      <IconSortUp style="opacity: 0.6" />
    </button>
    <span>{{ index }}</span>
    <button
      type="button"
      style="
        border: none;
        font-size: 1.2rem;
        line-height: 0.5;
        background: none;
        margin-top: -0.5rem;
      "
      class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
      :disabled="disabledDown"
      @click="emit('clickDown')"
    >
      <IconSortDown style="opacity: 0.6" />
    </button>
  </div>
</template>

<style scoped>
a {
  color: inherit;
  text-decoration: none;
}
</style>
