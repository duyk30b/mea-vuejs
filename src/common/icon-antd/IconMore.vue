<script lang="ts" setup>
const props = withDefaults(defineProps<{ width?: number | string; height?: number | string }>(), {
  width: '1em',
  height: '1em',
})
</script>
<template>
  <svg
    :width="width"
    :height="height"
    fill="currentColor"
    aria-hidden="true"
    viewBox="64 64 896 896"
  >
    <path
      d="M456 231a56 56 0 10112 0 56 56 0 10-112 0zm0 280a56 56 0 10112 0 56 56 0 10-112 0zm0 280a56 56 0 10112 0 56 56 0 10-112 0z"
    ></path>
  </svg>
</template>
