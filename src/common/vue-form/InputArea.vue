<template>
  <div class="input-text">
    <textarea :value="value" @input="input" :disabled="disabled"> </textarea>
    <label>{{ label }}</label>
  </div>
</template>

<script lang="ts">
export default {
  props: {
    label: { type: String, default: () => '' },
    value: { type: String, default: () => '' },
    disabled: { type: Boolean, default: () => false },
  },
  methods: {
    input(e: Event) {
      const target = e.target as HTMLInputElement
      this.$emit('update:value', target.value)
    },
  },
}
</script>
