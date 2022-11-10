<template>
  <div :class="{ 'input-options': true, disabled }" v-click-outside="handleClickOutside">
    <input ref="inputRef" :value="searchText" @input="handleInput" @keydown="handleKeydown" type="text"
      @focusin="showOptions = true" :placeholder="placeholder" :disabled="disabled" />
    <div class="options" v-if="showOptions" :style="{ maxHeight: `${maxHeight}px` }" ref="optionsElement">
      <div v-for="(item, index) in options" :key="index" :class="{ 'active': index == indexFocus, 'item-search': true }"
        @click="handleSelectItem(index)">
        <slot name="each" :item="item" :index="index">
          <div class="item-json">{{ index }} - {{ JSON.stringify(item) }} </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue'

export default {
  props: {
    searchText: { type: String, default: () => '' },
    options: { type: Array, default: () => [] },
    disabled: { type: Boolean, default: () => false },
    placeholder: String,
    maxHeight: { type: Number, default: () => 300 },
  },

  setup() {
    return {
      indexFocus: ref<number>(-1),
      showOptions: ref<boolean>(false),
      inputRef: ref<HTMLInputElement>(),
    }
  },

  methods: {
    handleInput(e: Event) {
      const target = e.target as HTMLInputElement
      this.indexFocus = -1
      this.showOptions = true
      this.$emit('update:searchText', target.value)
    },

    handleClickOutside() {
      this.showOptions = false
    },

    handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Tab' || e.key === 'Escape') {
        this.showOptions = false
      }
      else if (e.key === 'ArrowDown') {
        this.indexFocus += 1
        if (this.indexFocus >= this.options.length) this.indexFocus = 0
        this.setScrollOption('ArrowDown')
      }
      else if (e.key === 'ArrowUp') {
        this.indexFocus -= 1
        if (this.indexFocus < 0) this.indexFocus = this.options.length - 1
        this.setScrollOption('ArrowUp')
      }
      else if (e.key === 'Enter') {
        this.showOptions = !this.showOptions
        if (this.indexFocus !== -1) {
          this.handleSelectItem(this.indexFocus)
        }
      }
    },
    handleSelectItem(index: number) {
      this.indexFocus = -1
      this.showOptions = false
      this.$emit('selectItem', this.options[index])
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

    focus() {
      this.inputRef?.focus()
    },
  },
}
</script>

<style lang="scss" scoped>
.input-options {
  position: relative;
  width: 100%;
  height: 100%;
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
  }

  input {
    padding: 0.5rem 0.8rem;
    width: 100%;
    outline: none;
    border: none;

    &::placeholder {
      opacity: 0.4;
    }

    &:disabled {
      cursor: not-allowed;
      background-color: #eeeeee;
      opacity: 0.8;
    }
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
}
</style>
