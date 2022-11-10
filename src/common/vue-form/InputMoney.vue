<template>
  <div :class="{ 'input-text': true, disabled: disabled }">
    <input :value="money" @input="input" type="number" :placeholder="placeholder" :disabled="disabled" :step="step"
      :min="min" :max="max" />
    <div class="append">.000 vnđ</div>
    <label>{{ label }}</label>
  </div>
</template>

<script lang="ts">
export default {
  props: {
    label: { type: String, default: () => '' },
    value: { type: Number, default: () => 0 },
    placeholder: { type: String, default: () => '' },
    disabled: { type: Boolean, default: () => false },
    step: { type: Number, default: () => 1 },
    min: { type: Number },
    max: { type: Number },
  },

  data() {
    return { money: this.value / 1000 }
  },

  watch: {
    value(newValue) {
      this.money = newValue / 1000
    },
  },

  methods: {
    input(e: Event) {
      const target = e.target as HTMLInputElement
      this.$emit('update:value', Number(target.value) * 1000)
    },
  },
}
</script>
