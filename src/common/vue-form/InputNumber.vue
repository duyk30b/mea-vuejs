<template>
  <div :class="{ 'input-text': true, disabled: disabled }">
    <input :value="value" @input="input" type="number" :placeholder="placeholder" :disabled="disabled" :step="step"
      :min="min" :max="max" />
    <div v-if="append" class="append">{{ append }}</div>
    <label>{{ label }}</label>
  </div>
</template>

<script lang="ts">
export default {
  props: {
    label: { type: String, default: () => '' },
    value: { type: Number },
    placeholder: { type: String, default: () => '' },
    disabled: { type: Boolean, default: () => false },
    step: { type: Number },
    min: { type: Number },
    max: { type: Number },
    append: { type: String },
  },
  methods: {
    input(e: Event) {
      const target = e.target as HTMLInputElement
      this.$emit('update:value', Number(target.value))
    },
  },
}
</script>
