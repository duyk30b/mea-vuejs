<!-- <script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { CKEditor5Collapse, CKEditor5Normal } from './CKEditor5'

const ckeditorRef = ref<InstanceType<typeof HTMLElement>>()
const ckeditorParenRef = ref<InstanceType<typeof HTMLElement>>()

let editor: any
let currentValue = ''

const props = withDefaults(
  defineProps<{
    value: string
    menuType?: 'COLLAPSE' | 'NORMAL'
  }>(),
  {
    menuType: 'NORMAL',
  },
)
const emit = defineEmits<{ (e: 'update:value', value: string): void }>()

const setEditorHeight = () => {
  const wrapperElement = ckeditorRef.value?.parentNode as HTMLElement
  if (!wrapperElement) return
  const ckElementReal = ckeditorRef.value?.nextElementSibling
  const menuElement = ckElementReal?.querySelector('.ck-editor__top')
  if (!menuElement) return

  const mainElement = ckElementReal?.querySelector('.ck.ck-editor__main') as HTMLElement
  const mainHeight = wrapperElement.clientHeight - menuElement.clientHeight
  if (mainElement) {
    mainElement.style.height = mainHeight + 'px'
    mainElement.style.overflowY = 'scroll'
  }

  const editableElement = ckElementReal?.querySelector(
    '.ck.ck-content.ck-editor__editable',
  ) as HTMLElement
  if (editableElement) {
    const editableHeight = wrapperElement.clientHeight - menuElement.clientHeight
    editableElement.style.height = editableHeight + 'px'
  }
}

onMounted(async () => {
  try {
    if (props.menuType === 'NORMAL') {
      editor = await CKEditor5Normal.create(ckeditorRef.value!)
    } else {
      editor = await CKEditor5Collapse.create(ckeditorRef.value!)
    }
    if (!editor) return
    editor.setData(props.value)
    editor.model.document.on('change:data', () => {
      const data = editor!.getData()
      currentValue = data
      emit('update:value', data)
    })
    setEditorHeight()
  } catch (error) {
    console.log('🚀 ~ CKEditor5Vue.vue:58 ~ onMounted ~ error:', error)
  }
})

watch(
  () => props.value,
  (newValue, oldValue) => {
    if (editor && newValue !== currentValue) {
      currentValue = newValue
      editor.setData(newValue)
    }
  },
  { immediate: true },
)
</script>

<template>
  <div ref="ckeditorParenRef" style="width: 100%; height: 100%">
    <div ref="ckeditorRef"></div>
  </div>
</template>

<style lang="scss">
// :deep(.ck-editor__editable) {
//   height: 400px !important;
// }

.ck-editor__editable_inline {
  height: 100% !important;
  min-height: 0 !important;
  overflow: auto;
  p {
    margin-bottom: 0 !important;
  }
}
</style> -->
