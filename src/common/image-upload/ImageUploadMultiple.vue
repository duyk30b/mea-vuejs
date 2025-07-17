<script setup lang="ts">
import { watch } from 'vue'
import { nextTick } from 'vue'
import { ref } from 'vue'
import Compressor from 'compressorjs'
import { CONFIG } from '@/config'
import { ESString } from '../../utils/helpers/string.helper'

const imageListContainerRef = ref<HTMLElement>()

const emit = defineEmits<{
  (e: 'changeImage'): void
}>()

const props = withDefaults(
  defineProps<{
    height?: number
    rootImageList?: { thumbnail: string; id: number; enlarged: string }[]
    editable?: boolean
    quality?: number
  }>(),
  {
    height: 150,
    rootImageList: () => [],
    editable: true,
    quality: 0.6,
  },
)

const imageDataList = ref<{ thumbnail: string; enlarged: string; file: any; id: number }[]>([])

const showModal = ref(false)
const indexPreview = ref(0)

const rootImageListString = ref<string>('[]')

const imageSrcLoaded = ref<Record<string, boolean>>({})

watch(
  () => props.rootImageList,
  (newVal) => {
    rootImageListString.value = JSON.stringify(newVal)
  },
  { immediate: true },
)

watch(
  () => rootImageListString.value,
  (newVal) => {
    const newValObj = JSON.parse(newVal) as { thumbnail: string; id: number; enlarged: string }[]
    imageDataList.value = newValObj.map((i) => ({
      thumbnail: i.thumbnail,
      enlarged: i.enlarged,
      file: null,
      id: i.id,
    }))
  },
  { immediate: true },
)

const handleAddImage = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files) return

  let loadCount = 0
  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    new Compressor(file, {
      quality: props.quality,
      maxWidth: 1024,
      success(result) {
        const reader = new FileReader()
        reader.readAsDataURL(result)
        reader.onload = function (e) {
          if (e.target?.result) {
            imageDataList.value.push({
              thumbnail: e.target.result as string,
              enlarged: e.target.result as string,
              file: result,
              id: 0,
            })
          }
          loadCount++
          if (loadCount === files.length) {
            nextTick(() => {
              imageListContainerRef.value!.scrollLeft = imageListContainerRef.value!.scrollWidth
            })
          }
        }
      },
      error(err) {
        console.error('Compression error:', err)
        loadCount++
      },
    })
  }
  emit('changeImage')
}

const scrollImages = (direction: number) => {
  const containerWidth = imageListContainerRef.value!.offsetWidth
  imageListContainerRef.value!.scrollLeft += direction * containerWidth * 0.8
}

const clickChangeImage = (e: Event) => {
  const target = e.target as HTMLButtonElement
  const fileInput = target.nextElementSibling as HTMLInputElement
  fileInput.click()
}

const clickAddImage = (e: Event) => {
  const target = e.target as HTMLElement
  const fileInput = target.firstElementChild as HTMLInputElement | null
  if (fileInput) {
    fileInput.click()
  }
}

const handleChangeImage = (e: Event, index: number) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files || !files.length) return

  const file = files[0]
  const reader = new FileReader()
  reader.onload = function (e) {
    if (e.target?.result) {
      imageDataList.value[index] = {
        thumbnail: e.target?.result as string,
        enlarged: e.target?.result as string,
        file,
        id: 0,
      }
    }
  }
  reader.readAsDataURL(file)
  emit('changeImage')
}

const handleRemoveImage = (index: number) => {
  imageDataList.value.splice(index, 1)
  emit('changeImage')
}

const openModal = (index: number) => {
  showModal.value = true
  indexPreview.value = index
}

const closeModal = () => {
  showModal.value = false
}

const handleChangeIndexPreview = (index: number) => {
  indexPreview.value += index
  if (indexPreview.value > imageDataList.value.length - 1) {
    indexPreview.value = imageDataList.value.length - 1
  }
  if (indexPreview.value < 0) {
    indexPreview.value = 0
  }
}

const clickOutsideModal = () => {
  showModal.value = false
}

const handleLoadImage = (src: string) => {
  if (!src.startsWith('data:')) {
    imageSrcLoaded.value[src] = true
  }
}

const getData = () => {
  const filesPosition: number[] = []
  const imageIdsKeep: number[] = []
  const files: File[] = []

  imageDataList.value.forEach((imageData, index) => {
    if (imageData.id === 0) {
      filesPosition.push(index)
      files.push(imageData.file)
    } else {
      imageIdsKeep.push(imageData.id)
    }
  })

  return { files, imageIdsKeep, filesPosition }
}

defineExpose({ imageDataList, getData })
</script>

<template>
  <div class="image-list-wrapper">
    <button type="button" class="scroll-button scroll-left" @click="scrollImages(-1)">
      &#10094;
    </button>
    <div ref="imageListContainerRef" class="image-list-container">
      <div
        v-for="(imageData, index) in imageDataList"
        :key="index"
        class="image-wrapper image-thumbnail"
      >
        <img
          :src="imageData.thumbnail"
          :style="
            imageData.thumbnail.startsWith('data:image') || imageSrcLoaded[imageData.thumbnail]
              ? { opacity: 1, objectFit: 'contain', height: height + 'px', width: 'auto' }
              : { opacity: 0, objectFit: 'cover', height: height + 'px', width: height + 'px' }
          "
          @load="(e) => handleLoadImage(imageData.thumbnail)"
          @click="openModal(index)"
        />
        <button v-if="editable" type="button" class="btn-change-image" @click="clickChangeImage">
          Change
        </button>
        <input
          type="file"
          accept="image/*"
          style="display: none"
          @change="(e) => handleChangeImage(e, index)"
        />
        <button
          v-if="editable"
          type="button"
          class="btn-remove-image"
          @click="handleRemoveImage(index)"
        >
          &times;
        </button>
        <div v-if="CONFIG.MODE === 'development'" class="size-text-thumbnail">
          {{ ESString.formatNumber({ number: imageData.file.size, fixed: 0 }) }}
        </div>
      </div>
      <div
        v-if="editable"
        :style="{ height: height + 'px', width: height + 'px' }"
        class="image-wrapper image-add"
        @click="clickAddImage"
      >
        <input type="file" accept="image/*" multiple @change="handleAddImage" />
        +
      </div>
    </div>
    <button type="button" class="scroll-button scroll-right" @click="scrollImages(1)">
      &#10095;
    </button>
  </div>

  <div
    class="modal-preview"
    :style="{ display: showModal ? 'flex' : 'none' }"
    @click.self="clickOutsideModal"
  >
    <button type="button" class="close-preview" @click="closeModal()">&times;</button>
    <button
      :disabled="indexPreview <= 0"
      type="button"
      class="prev-preview"
      @click="handleChangeIndexPreview(-1)"
    >
      &#10094;
    </button>
    <div class="image-preview">
      <img
        :style="
          imageDataList[indexPreview]?.enlarged.startsWith('data:image') ||
          imageSrcLoaded[imageDataList[indexPreview]?.enlarged]
            ? { opacity: 1, objectFit: 'contain' }
            : { opacity: 0, objectFit: 'cover', aspectRatio: '1 / 1' }
        "
        :src="imageDataList[indexPreview]?.enlarged"
        @load="(e) => handleLoadImage(imageDataList[indexPreview]?.enlarged)"
      />
    </div>
    <button
      :disabled="indexPreview >= imageDataList.length - 1"
      type="button"
      class="next-preview"
      @click="handleChangeIndexPreview(1)"
    >
      &#10095;
    </button>
    <div v-if="CONFIG.MODE === 'development'" class="size-text-preview">
      {{ ESString.formatNumber({ number: imageDataList[indexPreview]?.file?.size, fixed: 0 }) }} KB
    </div>
  </div>
</template>

<style lang="scss" scoped>
.image-list-wrapper {
  position: relative;
  .scroll-button {
    position: absolute;
    top: calc(50% - 10px);
    transform: translateY(-50%);
    background-color: rgba(255, 255, 255, 0.7);
    border: none;
    cursor: pointer;
    padding: 10px 6px;
    border: 1px solid #cdcdcd;
    font-size: 18px;
    z-index: 1;
    &.scroll-left {
      left: 2px;
    }

    &.scroll-right {
      right: 2px;
    }
  }
  .image-list-container {
    display: flex;
    overflow-x: scroll;
    margin-bottom: 20px;
    scroll-behavior: smooth;
    .image-wrapper {
      position: relative;
      border: 1px solid #ccc;
      border-radius: 5px;
      overflow: hidden;
      margin-right: 10px;
      flex: 0 0 auto;
      &.image-thumbnail {
        background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }
      &.image-add {
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 36px;
        cursor: pointer;
      }
      input {
        display: none;
      }
      img {
        transition: opacity 0.5s ease-in-out;
      }
      .btn-change-image {
        position: absolute;
        padding: 0 6px;
        bottom: 5px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(255, 255, 255, 0.7);
        border: none;
        cursor: pointer;
      }
      .btn-remove-image {
        position: absolute;
        padding: 0 8px;
        top: 5px;
        right: 5px;
        background-color: rgba(255, 255, 255, 0.7);
        border: none;
        border-radius: 50%;
        cursor: pointer;
      }
      .size-text-thumbnail {
        position: absolute;
        top: 0;
        left: 50%;
        background-color: rgba(255, 255, 255, 0.9);
        color: violet;
        font-weight: bold;
        padding: 0 3px;
        font-size: 0.8em;
        transform: translateX(-50%);
      }
    }
  }
}

.modal-preview {
  display: flex;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.8);
  justify-content: center;
  align-items: center;

  .image-preview {
    background-color: #fff;
    padding: 10px;
    border-radius: 10px;
    text-align: center;
    background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    img {
      // transition: opacity 0.5s ease-in-out;
      @media only screen and (orientation: landscape) {
        height: 600px;
        max-height: 80vh;
        max-width: 90vw;
      }
      @media only screen and (orientation: portrait) {
        width: 90vw;
        height: 100%;
        max-height: 85vh;
      }
    }
  }
  .close-preview,
  .prev-preview,
  .next-preview {
    position: absolute;
    transform: translateY(-50%);
    background-color: rgba(255, 255, 255, 0.8);
    border: none;
    cursor: pointer;
    border: 1px solid #ccc;
    font-size: 18px;
    &:disabled {
      color: rgba(0, 0, 0, 0.1);
      cursor: not-allowed;
    }
  }

  .close-preview {
    right: 12px;
    top: 12px;
    padding: 0 14px;
    font-size: 26px;
    transform: none;
    border-radius: 50%;
  }

  .prev-preview {
    top: 50%;
    left: 12px;
    padding: 10px;
  }

  .next-preview {
    top: 50%;
    right: 12px;
    padding: 10px;
  }

  .size-text-preview {
    position: absolute;
    top: 10px;
    left: 50%;
    background-color: rgba(255, 255, 255, 0.9);
    color: violet;
    font-weight: bold;
    padding: 0 8px;
    font-size: 1.2em;
    transform: translateX(-50%);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
