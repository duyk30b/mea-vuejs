<script setup lang="ts">
import { ImageApi } from '@/modules/image/image.api'
import Compressor from 'compressorjs'
import { ref, watch } from 'vue'

const emit = defineEmits<{ (e: 'changeImage'): void }>()

const props = withDefaults(
  defineProps<{
    height?: number
    rootImage?: { src?: string; id?: number }
    quality?: number
    oid: number
    customerId: number
  }>(),
  {
    height: 150,
    rootImage: () => ({}),
    quality: 0.6,
    oid: 0,
    customerId: 0,
  },
)

const imageData = ref<{ src?: string; file?: any; id?: number }>({})
const rootImageString = ref<string>('{}')
const imageLoaded = ref<boolean>(false)

watch(
  () => props.rootImage,
  (newVal) => (rootImageString.value = JSON.stringify(newVal)),
  { immediate: true },
)

watch(
  () => rootImageString.value,
  (newVal) => (imageData.value = JSON.parse(newVal) as { src: string; id: number }),
  { immediate: true },
)

const clickChangeImage = (e: Event) => {
  const target = e.target as HTMLButtonElement
  const fileInput = target.nextElementSibling as HTMLInputElement
  fileInput.click()
}

const handleChangeImage = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files || !files.length) return
  const file = files[0]

  imageData.value = {
    src: '',
    file: null,
    id: 0,
  }

  new Compressor(file, {
    quality: props.quality,
    maxWidth: 1024,
    success(result) {
      const reader = new FileReader()
      reader.readAsDataURL(result)
      reader.onload = async function (e) {
        if (e.target?.result) {
          const urlCloudinary = await ImageApi.uploadCloudinary({
            file: result as any,
            oid: props.oid,
            customerId: props.customerId,
          })

          imageData.value = {
            src: urlCloudinary,
            file,
            id: 0,
          }
        }
      }
    },
    error(err) {
      console.error('Compression error:', err)
    },
  })

  emit('changeImage')
}

defineExpose({ imageData })
</script>

<template>
  <div class="image-wrapper">
    <div class="image-preview">
      <img
        :src="imageData.src"
        :style="
          imageData.src?.startsWith('data:image') || imageLoaded
            ? { opacity: 1, objectFit: 'contain', height: height + 'px', width: 'auto' }
            : { opacity: 0, objectFit: 'cover', height: height + 'px', width: height + 'px' }
        "
        @load="(e) => (imageLoaded = true)"
      />
    </div>
    <button type="button" class="btn-change-image" @click="clickChangeImage">Thay đổi ảnh</button>
    <input
      type="file"
      accept="image/*"
      style="display: none"
      @change="(e) => handleChangeImage(e)"
    />
  </div>
</template>

<style lang="scss" scoped>
.image-wrapper {
  .image-preview {
    border: 1px solid #ccc;
    border-radius: 5px;
    background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  input {
    display: none;
  }
  img {
    transition: opacity 0.5s ease-in-out;
  }
  .btn-change-image {
    padding: 0 6px;
    // background-color: rgba(255, 255, 255, 0.7);
    // border: none;
    cursor: pointer;
  }
}
</style>
