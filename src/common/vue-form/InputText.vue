<template>
  <div :class="{ 'input-text': true, 'disabled': disabled }">
    <div
      v-if="prepend"
      class="prepend"
    >
      {{ prepend }}
    </div>
    <input
      ref="inputRef"
      :value="value"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      @input="input"
    >
    <div
      v-if="append"
      class="append"
    >
      {{ append }}
    </div>
    <label>{{ label }}</label>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue'

export default {
  props: {
    label: { type: String, default: () => '' },
    value: { type: String, default: () => '' },
    placeholder: { type: String, default: () => '' },
    disabled: { type: Boolean, default: () => false },
    maxlength: { type: String, default: () => '' },
    append: { type: String, default: () => '' },
    prepend: { type: String, default: () => '' },
  },
  emits: ['update:value'],
  setup() {
    return { inputRef: ref<HTMLInputElement>() }
  },

  methods: {
    input(e: Event) {
      const target = e.target as HTMLInputElement
      this.$emit('update:value', target.value)
    },

    focus() {
      this.inputRef?.focus()
    },
  },
}
</script>
