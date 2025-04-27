<script setup lang="ts">
import { IconClose, IconDollar, IconPlus, IconPrint, IconSave, IconTrash, IconSend } from './icon'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    disabled?: boolean
    color?: 'default' | 'green' | 'blue' | 'red'
    size?: 'small' | 'default' | 'large' | 'text'
    type?: 'reset' | 'submit' | 'button'
    icon?: Object | '' | 'save' | 'print' | 'plus' | 'close' | 'trash' | 'dollar' | 'send'
  }>(),
  {
    loading: false,
    disabled: false,
    color: 'default',
    size: 'default',
    type: 'button',
    icon: '',
  }
)
</script>

<template>
  <button
    :disabled="disabled || loading"
    :type="type"
    :class="`btn btn-${color} btn-size-${size} ${loading ? 'btn-loading' : ''}`">
    <span v-if="loading">
      <svg
        class="icon-spin"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
        viewBox="0 0 1024 1024">
        <path
          d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path>
      </svg>
    </span>
    <span v-else-if="typeof icon === 'object'">
      <component :is="icon" />
    </span>
    <span v-else-if="icon === 'close'" class="icon-close"><IconClose /></span>
    <span v-else-if="icon === 'save'" class="icon-save"><IconSave /></span>
    <span v-else-if="icon === 'print'" class="icon-print"><IconPrint /></span>
    <span v-else-if="icon === 'plus'" class="icon-plus"><IconPlus /></span>
    <span v-else-if="icon === 'trash'" class="icon-trash"><IconTrash /></span>
    <span v-else-if="icon === 'dollar'" class="icon-dollar"><IconDollar /></span>
    <span v-else-if="icon === 'send'" class="icon-send"><IconSend /></span>
    <slot v-else name="icon"></slot>
    <slot></slot>
  </button>
</template>

<style lang="scss" scoped>
.btn {
  position: relative;
  padding: 4px 16px;
  cursor: pointer;
  outline: 0;
  border-radius: 2px;
  white-space: nowrap;
  transition:
    background-color 0.2s,
    border-color 0.2s;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 0.5rem; // để những icon bên trong được cách xa ra 1 chút
  justify-content: center;
  border: 1px solid #cdcdcd;
  background-color: white;
  line-height: 24px;

  span {
    line-height: 0;
    &.icon-plus {
      svg {
        shape-rendering: optimizespeed; // bật thì đậm hơn
      }
    }
    &.icon-close {
      svg {
        // shape-rendering: optimizespeed; // tắt thì đậm hơn, thế mới hay
      }
    }
    &.icon-print {
      svg {
        // shape-rendering: optimizespeed; // bật màu sáng hơn nhưng thanh mảnh hơn
      }
    }
    &.icon-save {
      svg {
        shape-rendering: optimizespeed; // bật màu sáng hơn nhưng thanh mảnh hơn
      }
    }
    &.icon-trash {
      svg {
        // shape-rendering: optimizespeed; // thanh mảnh trông rất xấu
      }
    }
  }

  &:focus {
    border-color: #1890ff;
    color: #1890ff;
  }

  &:hover {
    border-color: #40a9ff;
    color: #40a9ff;
  }

  &:disabled {
    cursor: not-allowed;
    background-color: #f2f2f2 !important;
    color: #888 !important;
    border: 1px solid #ccc !important;
    opacity: 0.7;
  }

  &.btn-size-text {
    padding: 0 8px;
    border: none;
    color: #1890ff;
    background-color: inherit !important;
    &:hover {
      color: #40a9ff;
    }
    &.btn-blue {
      color: #1890ff;
      &:hover {
        color: #40a9ff;
      }
    }
  }

  &.btn-size-small {
    font-size: 13px;
    padding: 0 12px;
  }

  &.btn-size-large {
    padding: 8px 24px;
    font-size: 16px;
  }

  &.btn-blue {
    background-color: #3b6fba;
    border-color: #3b6fba;
    color: white;

    &:hover {
      background-color: #5886c5;
      border-color: #446797;
    }

    &:focus {
      background-color: #1890ff;
      border-color: #1890ff;
    }

    &:active {
      background-color: #5886c5;
      border-color: #446797;
    }

    &.btn-loading {
      &:disabled {
        background-color: #3b6fba !important;
        color: white !important;
      }
    }
  }

  &.btn-green {
    background-color: #6da34d;
    border-color: #6da34d;
    color: white;

    &:hover {
      background-color: #27ae60;
      border-color: #27ae60;
    }

    &:focus {
      background-color: #186a3b;
      border-color: #186a3b;
    }

    &:active {
      background-color: #186a3b;
      border-color: #186a3b;
    }

    &.btn-loading {
      &:disabled {
        background-color: #1e8449 !important;
        color: white !important;
      }
    }
  }

  &.btn-red {
    background-color: #fff;
    border-color: #ef4444;
    color: #ef4444;

    &:hover {
      background-color: #fff;
      border-color: #ef4444;
    }

    &:focus {
      background-color: #fff;
      border-color: #ef4444;
    }

    &:active {
      background-color: #fff;
      border-color: #ef4444;
    }

    &.btn-loading {
      &:disabled {
        background-color: #fff !important;
        color: #ef4444 !important;
      }
    }
  }

  // CSS for Ripple effect
  &:not(:disabled)::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    border-radius: 4px;
    border: 4px solid transparent;
    transform: translate(-50%, -50%);
    transition:
      transform 0.3s,
      opacity 0.3s,
      border-color 0.3s;
    pointer-events: none;
  }

  &:not(:disabled):active::after {
    transform: translate(-50%, -50%);
    border: 4px solid #3b6fba;
    opacity: 0;
  }
}
</style>
