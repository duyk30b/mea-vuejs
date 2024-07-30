<template>
  <div ref="editorContainer" class="editor"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import type monaco from 'monaco-editor'

const props = withDefaults(
  defineProps<{
    value: string
    language?: 'html' | 'css' | 'javascript' | 'json'
  }>(),
  {
    language: 'html',
  }
)

const emit = defineEmits(['update:value'])

const editorContainer = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor

onMounted(async () => {
  const monaco = await import('monaco-editor')
  editor = monaco.editor.create(editorContainer.value!, {
    value: props.value,
    language: props.language,
    theme: 'vs',
    automaticLayout: true,
    formatOnType: true, // Format code khi gõ
    minimap: { enabled: false }, // Tắt minimap nếu không cần thiết
    tabSize: 2,
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
  })

  editor.getModel()?.onDidChangeContent(() => {
    emit('update:value', editor.getValue())
  })
})

watch(
  () => props.value,
  (newValue) => {
    if (editor && editor.getValue() !== newValue) {
      editor.setValue(newValue)
    }
  }
)

onUnmounted(() => {
  if (editor) editor.dispose()
})
</script>

<style lang="scss" scoped>
.editor {
  width: 100%;
  height: 100%;
}
</style>
