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
      d="M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z"
    ></path>
  </svg>
</template>
