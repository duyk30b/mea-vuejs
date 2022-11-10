<template>
  <div :class="{ 'input-text': true, disabled: disabled }" v-click-outside="() => showOptions = false">
    <select :value="value" @change="handleChange" @focusin="handleFocusIn" @keydown="handleKeydown"
      :disabled="disabled">
      <option v-for="(option, index) in options" :key="index" :value="option.value">
        {{ option.text }}
      </option>
    </select>
    <div :class="{ 'wrap-select': true, 'active': showOptions }" @click="handleClickWrapSelect">
    </div>
    <label>{{ label }}</label>
    <div class="options" v-if="showOptions" :style="{ maxHeight: `${maxHeight}px` }" ref="optionsElement">
      <div v-for="(option, index) in options" :key="index"
        :class="{ 'item-search': true, 'active': index == indexFocus }" @click="handleClickItem(option.value)">
        <div class="item-json"> {{ option.text }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue'
import { ref } from 'vue'

export default {
  props: {
    label: { type: String, default: () => '' },
    value: { type: [Number, String] as PropType<number | string | null>, default: () => '' },
    options: { type: Array as PropType<{ value: string | number | null, text: string }[]>, default: () => [] },
    disabled: { type: Boolean, default: () => false },
    maxHeight: { type: Number, default: () => 300 },
  },
  setup() {
    return {
      indexFocus: ref<number>(-1),
      showOptions: ref<boolean>(false),
    }
  },
  watch: {
    value: {
      async handler(newValue) {
        this.indexFocus = this.options.findIndex((item) => {
          return item.value === newValue
        })
      },
      // immediate: true,
    },
  },
  methods: {
    handleChange(e: Event) {
      const target = e.target as HTMLSelectElement
      this.$emit('update:value', target.value)
    },

    handleFocusIn(e: Event) {
      this.showOptions = true
      this.setScrollOption('ArrowDown')
    },

    handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Tab' || e.key === 'Escape') {
        this.showOptions = false
        return
      }
      e.preventDefault()

      if (e.key === 'ArrowDown') {
        this.indexFocus += 1
        if (this.indexFocus >= this.options.length) this.indexFocus = 0
        this.$emit('update:value', this.options[this.indexFocus].value)
        this.setScrollOption('ArrowDown')
      }
      else if (e.key === 'ArrowUp') {
        this.indexFocus -= 1
        if (this.indexFocus < 0) this.indexFocus = this.options.length - 1
        this.$emit('update:value', this.options[this.indexFocus].value)
        this.setScrollOption('ArrowDown')
      }
      else if (e.key === 'Enter') {
        if (this.showOptions) {
          this.$emit('update:value', this.options[this.indexFocus].value)
        }
        this.showOptions = !this.showOptions
      }
    },

    handleClickWrapSelect(e: Event) {
      // e.stopPropagation() ==> không được dùng để tránh hủy sự kiện bên ngoài, như: v-click-outside
      if (this.disabled) return
      this.showOptions = !this.showOptions
    },

    handleClickItem(value: string | number | null) {
      this.showOptions = false
      this.$emit('update:value', value)
    },

    setScrollOption(type: 'ArrowUp' | 'ArrowDown') {
      this.$nextTick(() => {
        const optionsElement = this.$refs.optionsElement as HTMLElement
        const activeItem = optionsElement.querySelector('.item-search.active') as HTMLElement
        if (!activeItem) return

        const topItem = activeItem.offsetTop
        const bottomItem = activeItem.offsetTop + activeItem.offsetHeight

        // nếu item vẫn đang trong khoảng có thể hiển thị thì không scroll
        if (topItem > optionsElement.scrollTop && bottomItem < optionsElement.scrollTop + this.maxHeight) {
          return
        }
        if (type === 'ArrowUp') optionsElement.scrollTop = topItem - 20
        if (type === 'ArrowDown') optionsElement.scrollTop = bottomItem - this.maxHeight + 20
      })
    },
  },
}
</script>

<style lang="scss" scoped>

</style>
