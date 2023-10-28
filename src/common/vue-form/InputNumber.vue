<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: number
    prepend?: string
    append?: string
    textAlign?: 'left' | 'right'
    disabled?: boolean
    placeholder?: string
    required?: boolean
  }>(),
  {
    value: 0,
    prepend: '',
    append: '',
    textAlign: 'left',
    disabled: false,
    placeholder: '',
    required: false,
  }
)
const emit = defineEmits<{ (e: 'update:value', value: number): void }>()

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const number = Number(target.value.replace(/,/g, '')) || 0
  emit('update:value', number)
}

const handleFocus = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.value) {
    target.select()
  }
}
</script>

<template>
  <div :class="{ 'input-money': true, 'disabled': disabled }">
    <div v-if="prepend" class="prepend">
      {{ prepend }}
    </div>
    <div class="input-area">
      <input
        ref="inputMoney"
        :style="{ textAlign }"
        :value="value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''"
        :placeholder="placeholder || '0'"
        :disabled="disabled"
        :required="required"
        inputmode="decimal"
        @input="handleInput"
        @focus="handleFocus"
      />
    </div>
    <div v-if="append" class="append">
      {{ append }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.input-money {
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

  .input-area {
    flex: 1;

    input {
      width: 100%;
      padding: 2px 12px;
      outline: none;
      border: none;

      &::placeholder {
        opacity: 0.4;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.8;
      }
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
