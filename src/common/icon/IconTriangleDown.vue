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
    style="vertical-align: middle; fill: currentColor; overflow: hidden"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M859.8528 292.9664H164.1472c-40.1408 0-60.3136 48.5376-31.8464 77.0048L480.1536 717.824c17.6128 17.6128 46.1824 17.6128 63.7952 0l347.8528-347.8528c28.3648-28.4672 8.2944-77.0048-31.9488-77.0048z"
    />
  </svg>
</template>
