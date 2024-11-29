<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { CKEditor5Collapse, CKEditor5Normal } from './CKEditor5'
import { ClassicEditor, Essentials, Bold, Italic, Font, Paragraph, wait } from 'ckeditor5'

const emit = defineEmits<{ (e: 'update:value', value: string): void }>()
let editor: ClassicEditor

const props = withDefaults(
  defineProps<{
    value: string
    menuType?: 'COLLAPSE' | 'NORMAL'
  }>(),
  {
    menuType: 'NORMAL',
  }
)

watch(
  () => props.value,
  (newValue, oldValue) => {
    if (!editor) return
    const oldData = editor.getData()
    if (oldData !== newValue) {
      editor.setData(newValue)
    }
  },
  { immediate: true }
)

const randomId = computed(() => 'MEA_' + Math.random().toString(36).substring(2))

const ckeditorRef = ref<any>(null)

// const setEditorHeight = () => {
//   setTimeout(() => {
//     const wrapperElement = ckeditorRef.value?.$el.parentNode
//     if (!wrapperElement) return

//     const ckElementReal = ckeditorRef.value?.$el.nextElementSibling
//     const menuElement: HTMLElement = ckElementReal?.querySelector('.ck-editor__top')
//     if (!menuElement) return

//     let cssNode = document.createElement('style')
//     const height = wrapperElement.offsetHeight - menuElement.offsetHeight
//     cssNode.innerHTML = ` .${randomId.value} .ck.ck-content.ck-editor__editable,
//                           .${randomId.value} .ck-source-editing-area {
//                               min-height: ${height}px !important
//                           }`
//     wrapperElement.append(cssNode)
//   }, 10)
// }

onMounted(async () => {
  // setEditorHeight()
  try {
    const element: HTMLElement | null = document.querySelector('.' + randomId.value)
    if (!element) return
    editor = await ClassicEditor.create(element, {
      plugins: [Essentials, Bold, Italic, Font, Paragraph],
      toolbar: [
        'undo',
        'redo',
        '|',
        'bold',
        'italic',
        '|',
        'fontSize',
        'fontFamily',
        'fontColor',
        'fontBackgroundColor',
      ],
    })
    editor.model.document.on('change:data', () => {
      const data = editor.getData() // Lấy nội dung hiện tại của editor
      emit('update:value', data)
    })
  } catch (error) {
    console.log('🚀 ~ file: WysiwygEditor.vue:62 ~ onMounted ~ error:', error)
  }
})
</script>

<template>
  <div style="width: 100%; height: 100%">
    <textarea ref="ckeditorRef" :class="randomId" placeholder="Type the content here!"></textarea>

    <!-- <ckeditor
      :editor="menuType === 'COLLAPSE' ? CKEditor5Collapse : CKEditor5Normal"
      :model-value="value"
      @input="handleEditorInput"></ckeditor> -->
  </div>
</template>

<style lang="scss" scoped>
// :deep(.ck-editor__editable) {
//   height: 400px !important;
// }
</style>
