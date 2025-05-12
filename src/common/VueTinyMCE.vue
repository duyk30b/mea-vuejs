<template>
  <textarea ref="editorEl"></textarea>
</template>

<script lang="ts" setup>
import tinymce from 'tinymce'
import 'tinymce/icons/default/icons.min.js'
import 'tinymce/models/dom/model.min.js'
import 'tinymce/plugins/advlist'
import 'tinymce/plugins/code'
import 'tinymce/plugins/emoticons'
import 'tinymce/plugins/emoticons/js/emojis'
import 'tinymce/plugins/image'
import 'tinymce/plugins/link'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/table'
import 'tinymce/skins/content/default/content.js'
import 'tinymce/skins/ui/oxide/content.js'
import 'tinymce/skins/ui/oxide/skin.js'
import 'tinymce/themes/silver/theme.min.js'
import { defineEmits, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  menuBar?: boolean
  readonly?: boolean
  statusBar?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorEl = ref<HTMLTextAreaElement | null>(null)
let editorInstance: any = null

let currentContent = props.modelValue || ''

onMounted(async () => {
  await tinymce.init({
    license_key: 'gpl',
    target: editorEl.value!,
    height: '100%',
    menubar: !!props.menuBar,
    readonly: !!props.readonly,
    statusbar: !!props.statusBar,
    plugins: 'code link image table lists',
    content_style: `
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 16px;
        margin: 0 0.5rem 0 0.5rem;
      }
    `,
    toolbar:
      'undo redo removeformat code | table styles bold italic  | forecolor backcolor | bullist numlist outdent indent',
    setup(editor: any) {
      editorInstance = editor
      editor.on('Change KeyUp', () => {
        currentContent = editor.getContent()
        if (currentContent !== props.modelValue) {
          emit('update:modelValue', currentContent)
        }
      })
    },
    init_instance_callback(editor: any) {
      editor.setContent(props.modelValue || '')
    },
  })

  watch(
    () => props.modelValue,
    (newVal) => {
      if (editorInstance && newVal !== currentContent) {
        editorInstance.setContent(newVal || '')
      }
    },
  )
})

onBeforeUnmount(() => {
  if (editorInstance) {
    editorInstance.remove()
    editorInstance = null
  }
})
</script>

<style lang="scss">
.tox-tinymce {
  border: 1px solid #d9d9d9 !important;
  border-radius: 2px !important;
}
.tox-editor-header {
  box-shadow: none !important;
  border-bottom: 1px solid #d9d9d9 !important;
  padding: 0 !important;

  .tox-promotion {
    display: none !important;
  }
  .tox-menubar {
    .tox-mbtn {
      margin-bottom: 0 !important;
    }
  }
}

.tox .tox-edit-area::before {
  border: 1px solid #40a9ff !important;
  border-radius: 0 !important;
  box-shadow: 0 0 0 2px #1890ff33;
}
.tox .tox-toolbar__group {
  padding: 0 8px !important;
  .tox-tbtn {
  }
}

.tox-statusbar__branding {
  display: none !important;
}
</style>
