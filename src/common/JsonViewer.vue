<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    text: string
    theme: 'light' | 'dark'
  }>(),
  {
    text: '',
    theme: 'light',
  }
)

const jsonTokenRegex =
  /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?\b|\btrue\b|\bfalse\b|\bnull\b)/g

const syntaxHighlight = (objString: string) => {
  return objString
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(jsonTokenRegex, (match) => {
      let cls = 'number'
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'key' : 'string'
      } else if (/^(true|false)$/.test(match)) {
        cls = 'boolean'
      } else if (match === 'null') {
        cls = 'null'
      }

      return `<span class="${cls}">${match}</span>`
    })
}

const htmlString = computed(() => {
  const result = syntaxHighlight(props.text || '')
  return result
})

const viewerThemeClass = computed(() => `json-viewer--${props.theme}`)
</script>

<template>
  <div class="json-viewer" :class="viewerThemeClass" v-html="htmlString"></div>
</template>

<style lang="scss">
.json-viewer {
  --json-bg: #f7f8fa;
  --json-border: #d9dce3;
  --json-text: #1f2937;
  --json-key: #1c7c54;
  --json-string: #005cc5;
  --json-number: #b42318;
  --json-boolean: #c26b00;
  --json-null: #6b7280;

  width: 100%;
  height: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--json-border);
  // background-color: var(--json-bg);
  color: var(--json-text);
  font-family: monospace;
  white-space: pre;
  overflow: auto;

  &.json-viewer--dark {
    --json-bg: #11182760;
    --json-border: #374151;
    --json-text: #e5e7eb;
    --json-key: #6ee7b7;
    --json-string: #93c5fd;
    --json-number: #fca5a5;
    --json-boolean: #fcd34d;
    --json-null: #9ca3af;
  }

  .string {
    color: var(--json-string);
  }

  .number {
    color: var(--json-number);
  }

  .boolean {
    color: var(--json-boolean);
  }

  .null {
    color: var(--json-null);
  }

  .key {
    color: var(--json-key);
  }
}
</style>
