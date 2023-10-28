<template>
  <div v-click-outside="handleClickOutside" :class="{ 'input-options': true, disabled }">
    <div class="input-area">
      <input
        ref="inputRef"
        :value="searchText"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        @input="handleInput"
        @keydown="handleKeydown"
        @focusin="showOptions = true"
      />
      <div class="clear" @click="handleClear">
        <div class="btn-clear">&times;</div>
      </div>
    </div>
    <div
      v-if="showOptions"
      ref="optionsElement"
      class="options"
      :style="{ maxHeight: `${maxHeight}px` }"
    >
      <div
        v-for="(item, index) in options"
        :key="index"
        :class="{ 'item-search': true, 'active': index == indexFocus }"
        @click="handleSelectItem(index)"
      >
        <slot name="each" :item="item" :index="index">
          <div class="item-json">{{ index }} - {{ JSON.stringify(item) }}</div>
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
    placeholder: { type: String, default: () => '' },
    maxHeight: { type: Number, default: () => 300 },
    required: { type: Boolean, default: () => false },
  },

  emits: ['update:searchText', 'selectItem'],

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
      } else if (e.key === 'ArrowDown') {
        this.indexFocus += 1
        if (this.indexFocus >= this.options.length) this.indexFocus = 0
        this.setScrollOption('ArrowDown')
      } else if (e.key === 'ArrowUp') {
        this.indexFocus -= 1
        if (this.indexFocus < 0) this.indexFocus = this.options.length - 1
        this.setScrollOption('ArrowUp')
      } else if (e.key === 'Enter') {
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

    handleClear() {
      if (this.disabled) return
      this.indexFocus = -1
      this.showOptions = false
      this.$emit('update:searchText', '')
      this.$emit('selectItem', null)
    },

    setScrollOption(type: 'ArrowUp' | 'ArrowDown') {
      this.$nextTick(() => {
        const optionsElement = this.$refs.optionsElement as HTMLElement
        const activeItem = optionsElement.querySelector('.item-search.active') as HTMLElement
        if (!activeItem) return

        const topItem = activeItem.offsetTop
        const bottomItem = activeItem.offsetTop + activeItem.offsetHeight

        // nếu item vẫn đang trong khoảng có thể hiển thị thì không scroll
        if (
          topItem > optionsElement.scrollTop &&
          bottomItem < optionsElement.scrollTop + this.maxHeight
        ) {
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
  align-items: center;

  &:focus-within {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px #1890ff33;
  }

  &:hover {
    border-color: #40a9ff;
    .clear {
      .btn-clear {
        border: 1px solid #ccc;
        border-radius: 50%;
        background-color: #9e9e9e;
        color: white;
      }
    }
  }

  &.disabled {
    background-color: #eeeeee;
    border-color: #d9d9d9;

    &:hover {
      border-color: #bbb;
    }

    .append {
      opacity: 0.8;
    }

    .prepend {
      opacity: 0.8;
    }

    .clear {
      cursor: not-allowed !important;
    }
  }

  .input-area {
    flex: 1;

    input {
      width: 100%;
      padding: 3px 12px;
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

    input::placeholder {
      font-size: 14px;
    }

    .clear {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 30px;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0.5;

      .btn-clear {
        width: 14px;
        height: 14px;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      &:hover {
        opacity: 1;
        cursor: pointer;
      }
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
      padding: 6px 12px;
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
