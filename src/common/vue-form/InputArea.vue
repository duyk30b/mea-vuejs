<template>
  <div class="input-text">
    <textarea :value="value" :disabled="disabled" @input="input" />
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
  emits: ['update:value'],
  methods: {
    input(e: Event) {
      const target = e.target as HTMLInputElement
      this.$emit('update:value', target.value)
    },
  },
}
</script>
