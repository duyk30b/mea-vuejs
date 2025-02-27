<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CKEditor5Collapse, CKEditor5Normal } from './CKEditor5'

const emit = defineEmits<{ (e: 'update:value', value: string): void }>()

const props = withDefaults(
  defineProps<{
    value: string
    menuType?: 'COLLAPSE' | 'NORMAL'
  }>(),
  {
    menuType: 'NORMAL',
  }
)

const randomId = computed(() => 'MEA_' + Math.random().toString(36).substring(2))

const ckeditorRef = ref<any>(null)

const setEditorHeight = () => {
  setTimeout(() => {
    const wrapperElement = ckeditorRef.value?.$el.parentNode
    if (!wrapperElement) return

    const ckElementReal = ckeditorRef.value?.$el.nextElementSibling
    const menuElement: HTMLElement = ckElementReal?.querySelector('.ck-editor__top')
    if (!menuElement) return

    let cssNode = document.createElement('style')
    const mainHeight = wrapperElement.offsetHeight - menuElement.offsetHeight
    const editHeight = mainHeight
    cssNode.innerHTML = ` 
                          .${randomId.value} .ck.ck-editor__main {
                              height: ${mainHeight}px;
                              overflow-y: scroll;
                          }
                          .${randomId.value} .ck.ck-content.ck-editor__editable,
                          .${randomId.value} .ck-source-editing-area {
                              min-height: ${editHeight}px !important
                          }
                        `
    wrapperElement.append(cssNode)
  }, 10)
}

onMounted(() => {
  setEditorHeight()
})

const handleEditorInput = (text: string) => {
  emit('update:value', text)
}
</script>

<template>
  <div :class="randomId" style="width: 100%; height: 100%">
    <ckeditor
      ref="ckeditorRef"
      :editor="menuType === 'COLLAPSE' ? CKEditor5Collapse : CKEditor5Normal"
      :model-value="value"
      @input="handleEditorInput"></ckeditor>
  </div>
</template>

<style lang="scss" scoped>
// :deep(.ck-editor__editable) {
//   height: 400px !important;
// }
</style>
