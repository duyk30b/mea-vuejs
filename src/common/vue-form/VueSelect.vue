<template>
  <div :class="{ 'vue-select': true, disabled: disabled }" v-click-outside="() => showOptions = false">
    <select :value="value" @change="handleChange" @focusin="handleFocusIn" @keydown="handleKeydown" :disabled="disabled">
      <option v-for="(option, index) in options" :key="index" :value="option.value">
        {{ option.text }}
      </option>
    </select>
    <div :class="{ 'wrap-select': true, 'active': showOptions }" @click="handleClickWrapSelect">
    </div>
    <div class="options" v-if="showOptions" :style="{ maxHeight: `${maxHeight}px` }" ref="optionsElement">
      <div v-for="(option, index) in options" :key="index" :class="{ 'item-search': true, 'active': index == indexFocus }"
        @click="handleClickItem(option.value)">
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
.vue-select {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  display: flex;
  align-items: stretch;

  &:focus-within {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px #1890ff33;
  }

  &:hover {
    border-color: #40a9ff;
  }

  &.disabled {
    background-color: #eeeeee;

    label {
      border: 1px solid #eee;
    }

    .wrap-select {
      cursor: not-allowed;
    }
  }

  select {
    width: 100%;
    outline: none;
    border: none;
    background-color: white;
    -webkit-appearance: none;
    -moz-appearance: none;
    text-indent: 1px;
    text-overflow: '';

    &::placeholder {
      opacity: 0.4;
    }

    &:disabled {
      cursor: not-allowed;
      background-color: #eeeeee;
      opacity: 0.8;
    }
  }

  select::-ms-expand {
    display: none;
  }

  .options {
    position: absolute;
    z-index: 9;
    background-color: #fff;
    top: 100%;
    left: -1px;
    right: -1px;
    border: 1px solid #d4d4d4;
    box-shadow: 5px 5px 4px #aaaaaa;
    overflow-y: auto;

    .item-search {
      position: relative;
      padding: 0.5rem;
      cursor: pointer;
      user-select: none;
      border-bottom: 1px solid #d4d4d4;

      &.active {
        background-color: dodgerblue !important;
        color: #fff;
      }

      &:hover {
        background-color: #e9e9e9;
      }

      .item-json {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
    }
  }

  .wrap-select {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    cursor: pointer;

    &:after {
      --border-width: 6px;
      position: absolute;
      content: "";
      top: calc(50% - var(--border-width) * 0.5);
      right: 12px;
      width: 0;
      height: 0;
      border: var(--border-width) solid transparent;
      border-color: gray transparent transparent transparent;
    }

    &.active::after {
      top: calc(50% - var(--border-width) * 1.5);
      border-color: transparent transparent gray transparent;
    }
  }
}
</style>
