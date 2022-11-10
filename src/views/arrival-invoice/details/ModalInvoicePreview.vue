<script setup lang="ts">
import type { Invoice } from '@/modules/invoice'
import { DownloadOutlined } from '@ant-design/icons-vue'
import { nextTick, ref } from 'vue'
import { invoiceHtmlContent } from './invoice-html-content'

const showModal = ref(false)

const height = ref<number>(500)
const width = ref<number>(500)

const svgDivHtml = ref<string>()

const openModal = async (value: Invoice) => {
  showModal.value = true
  svgDivHtml.value = invoiceHtmlContent(value)

  nextTick(() => {
    const svgDemoContentDiv = document.getElementById('svg-demo-content-div') as HTMLElement
    const svgDemo = document.getElementById('svg-demo') as HTMLElement
    const imgDemo = document.getElementById('img-demo') as HTMLImageElement

    width.value = svgDemoContentDiv.scrollWidth + 20
    height.value = svgDemoContentDiv.scrollHeight + 10

    nextTick(() => {
      const xmlSerializer = new XMLSerializer()
      const svgString = xmlSerializer.serializeToString(svgDemo)
      // const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      // const DomURL = window.URL || window.webkitURL || window
      // const svgUrl = DomURL.createObjectURL(svgBlob)
      const svgUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)))

      imgDemo.src = svgUrl
      imgDemo.width = svgDemoContentDiv.scrollWidth
    })
  })
}

const startDownloadImage = async () => {
  const imgDemo = document.getElementById('img-demo') as HTMLImageElement
  const canvas = document.createElement('canvas') as HTMLCanvasElement
  canvas.width = width.value
  canvas.height = height.value
  const ctx = canvas.getContext('2d')
  ctx!.drawImage(imgDemo, 0, 0)
  const src = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = src
  a.download = 'img.png'
  a.click()
}

const refreshModal = () => {
  showModal.value = false
}

defineExpose({ openModal })
</script>

<template>
  <a-modal v-model:visible="showModal" width="820px" title="Ảnh hóa đơn" :afterClose="refreshModal">
    <template #footer>
      <div class="flex justify-between px-2">
        <a-button type="primary" @click="startDownloadImage">
          <template #icon>
            <DownloadOutlined />
          </template>
          Tải ảnh
        </a-button>

        <div>
          <a-button @click="showModal = false">Đóng</a-button>
        </div>
      </div>
    </template>
    <div style="width: 1000px; position: fixed; top: 0; left: 200vw">
      <svg xmlns="http://www.w3.org/2000/svg" id="svg-demo" :width="width" :height="height">
        <foreignObject width="100%" height="100%">
          <div id="svg-demo-content-div" v-html="svgDivHtml" xmlns="http://www.w3.org/1999/xhtml"
            style="height: 100%; overflow: auto"></div>
        </foreignObject>
      </svg>
    </div>
    <div style="display: flex; justify-content: center;">
      <img id="img-demo" style="object-fit: contain" />
    </div>
  </a-modal>
</template>
../details/invoice-html-content
