<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: string | null
    prepend?: string
    append?: string
    disabled?: boolean
    required?: boolean
    textAlign?: 'left' | 'right'
    maxlength?: number
    placeholder?: string
    pattern?: string
    title?: string
  }>(),
  {
    value: '',
    prepend: undefined,
    append: undefined,
    disabled: false,
    required: false,
    textAlign: undefined,
    maxlength: undefined,
    placeholder: undefined,
    pattern: undefined,
    title: undefined,
  }
)
const emit = defineEmits<{ (e: 'update:value', value: string): void }>()

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:value', target.value)
}
</script>

<template>
  <div :class="{ 'input-text': true, 'disabled': disabled }">
    <div v-if="prepend" class="prepend">{{ prepend }}</div>
    <div class="input">
      <input
        ref="inputRef"
        :value="value"
        :style="{ textAlign }"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :maxlength="maxlength"
        :pattern="pattern"
        :title="title"
        @input="handleInput"
      />
    </div>
    <div v-if="append" class="append">{{ append }}</div>
  </div>
</template>

<style lang="scss" scoped>
.input-text {
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
  }

  .input {
    flex: 1;

    input {
      width: 100%;
      padding: 4px 12px;
      outline: none;
      border: none;

      &::placeholder {
        opacity: 0.4;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.8;
      }
      // &:invalid {
      //   color: red
      // }
    }
  }

  .append {
    padding: 0 12px;
    border-left: 1px solid #d9d9d9;
    white-space: nowrap;
    display: flex;
    align-items: center;
    background-color: #eee;
    color: #777;
    font-size: 0.8em;
  }

  .prepend {
    padding: 0 12px;
    border-right: 1px solid #d9d9d9;
    white-space: nowrap;
    display: flex;
    align-items: center;
    background-color: #eee;
    color: #777;
    font-size: 0.8em;
  }
}
</style>
