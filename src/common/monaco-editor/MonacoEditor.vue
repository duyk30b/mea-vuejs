<template>
  <div ref="editorRef" class="monaco-editor"></div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { emmetHTML } from 'emmet-monaco-es'

// gán emmet vào monaco để tránh gọi nhiều lần
if (!(monaco.editor as any).__emmetInitialized) {
  emmetHTML(monaco, ['html'])
  ;(monaco.editor as any).__emmetInitialized = true
}
console.log('🚀 ~ MonacoEditor.vue:14 ~ monaco.editor:', monaco.editor)

const props = withDefaults(
  defineProps<{
    value: string
    language?: 'html' | 'css' | 'javascript' | 'typescript' | 'json'
    theme?: 'vs-dark' | 'vs-light'
    readOnly?: boolean
  }>(),
  {
    language: 'html',
    theme: 'vs-light',
  },
)

const emit = defineEmits<{
  (e: 'update:value', value: string): void
  (e: 'javascript-output', value: string): void
}>()

const editorRef = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(async () => {
  // const monaco = await import('monaco-editor')
  if (!editorRef.value) return

  editor = monaco.editor.create(editorRef.value!, {
    value: props.value,
    language: props.language || 'html',
    theme: props.theme || 'vs-light',
    readOnly: props.readOnly ?? false,
    automaticLayout: true,
    formatOnType: true, // Format code khi gõ
    minimap: { enabled: false }, // Tắt minimap nếu không cần thiết
    tabSize: 2,
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    padding: {
      top: 12,
      bottom: 12,
    },
  })

  editor.addAction({
    id: `format-monaco`,
    label: 'Format Document',
    keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
    run: function () {
      return editor!.getAction('editor.action.formatDocument')?.run()
    },
  })

  editor.addAction({
    id: 'duplicate-line',
    label: 'Duplicate Line',
    keybindings: [monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.DownArrow],
    run: function () {
      return editor!.getAction('editor.action.copyLinesDownAction')?.run()
    },
  })

  editor.getModel()?.onDidChangeContent(() => {
    const editorValue = editor!.getValue() || ''
    emit('update:value', editorValue)
  })

  monaco.languages.registerCompletionItemProvider('typescript', {
    provideCompletionItems: (model, position) => {
      const wordInfo = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endColumn: wordInfo.endColumn,
      }

      return {
        suggestions: [
          {
            label: 'clg',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'console.log($0);',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Console log',
            range,
          },
        ],
      }
    },
  })

  monaco.languages.registerCompletionItemProvider('typescript', {
    provideCompletionItems: (model, position) => {
      const wordInfo = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endColumn: wordInfo.endColumn,
      }
      return {
        suggestions: [
          {
            label: 'for',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              'for (let ${1:index} = 0; ${1} < ${2:array}.length; ${1}++) {',
              '\tconst ${3:element} = ${2:array}[${1}];',
              '\t$0',
              '}',
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'For loop snippet',
            range,
          },
        ],
      }
    },
  })
})

watch(
  () => props.value,
  (newValue) => {
    if (editor && editor.getValue() !== newValue) {
      editor.setValue(newValue)
    }
  },
)

onBeforeUnmount(() => {
  if (editor) editor.dispose()
})
</script>

<style lang="scss" scoped>
.monaco-editor {
  width: 100%;
  height: 100%;
}
</style>
