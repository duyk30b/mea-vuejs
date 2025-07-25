<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { IconCloudUpload, IconDownload, IconUpload } from '@/common/icon-google'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { FileLaboratoryApi } from '@/modules/file-excel/file-laboratory.api'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const elementUploadRef = ref<HTMLElement | null>(null)
const inputFileRef = ref<HTMLInputElement | null>(null)

const fileSelect = ref<File>()
const dragover = ref(false)

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const showModal = ref(false)
const saveLoading = ref(false)

const startSelectFile = (file: File | undefined) => {
  if (!file) return
  if (file.size > MAX_SIZE) {
    alert('File quá lớn, chỉ được phép tối đa 5MB')
    return
  }
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/wps-office.xlsx', // WPS
  ]
  const validExtensions = ['.xlsx', '.xls']
  const isValidType = validTypes.includes(file.type)
  const isValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

  if (!isValidType && !isValidExt) {
    alert('Chỉ chấp nhận file Excel (.xlsx, .xls)')
    return
  }
  fileSelect.value = file
}

const handleChangeInputFile = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  startSelectFile(file)
}

const openModal = async () => {
  showModal.value = true
}

const handleUpload = async () => {
  saveLoading.value = true
  if (!fileSelect.value) return

  try {
    await FileLaboratoryApi.uploadExcelLaboratoryList(fileSelect.value)
    AlertStore.addSuccess('Cập nhật danh sách xét nghiệm từ excel thành công !')
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalUploadLaboratory.vue:43 ~ handleUpload ~ error:', error)
    removeFile()
  } finally {
    saveLoading.value = false
  }
}

const downloadExcelFileExample = async () => {
  try {
    await FileLaboratoryApi.downloadExcelFileExample()
  } catch (error) {
    console.log('🚀 ~ ModalUploadLaboratory.vue:73 ~ downloadExcelFileExample ~ error:', error)
  }
}

const closeModal = () => {
  removeFile()
  dragover.value = false
  showModal.value = false
}

const handleDrop = (e: DragEvent) => {
  dragover.value = false
  const file = e.dataTransfer?.files[0]
  startSelectFile(file)
}

const removeFile = () => {
  inputFileRef.value!.value = ''
  fileSelect.value = undefined
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer; opacity-0">
          <IconClose />
        </div>
        <div class="flex-1 font-medium" style="font-size: 16px; text-align: center">
          Upload danh sách xét nghiệm từ Excel
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4">
        <div
          class="drop-area p-4 pb-8"
          :class="dragover ? 'dragover' : ''"
          style="border: 2px dashed #3b82f6; border-radius: 10px"
          @dragover.prevent="dragover = true"
          @dragleave.prevent="dragover = false"
          @drop.prevent="handleDrop"
          ref="elementUploadRef"
        >
          <div class="flex justify-center" style="font-size: 80px; color: #3b6fba">
            <IconCloudUpload />
          </div>
          <div class="mt-4 flex justify-center">Drag & Drop your files here</div>
          <div class="mt-4 flex justify-center">
            <div v-if="!fileSelect">OR</div>
            <div v-else class="flex justify-center items-center gap-4">
              <div style="font-style: italic; color: #3b82f6">
                {{ fileSelect.name }} ({{ (fileSelect.size / 1024 / 1024).toFixed(2) }}MB)
              </div>
              <div
                style="font-size: 12px; color: var(--text-red); cursor: pointer"
                @click="removeFile"
              >
                <IconClose />
              </div>
            </div>
          </div>
          <div class="mt-4 flex justify-center">
            <label for="fileElem" class="btn custom-file-upload">Browse Files</label>
          </div>
          <input
            ref="inputFileRef"
            style="display: none"
            type="file"
            id="fileElem"
            @change="handleChangeInputFile"
            accept=".xlsx,.xls"
          />
          <div class="progress-bar" id="progressBar">
            <div class="progress-fill" id="progressFill"></div>
          </div>
          <div class="file-info" id="fileInfo"></div>
        </div>
        <div class="mt-2 flex justify-between text-xs" style="color: #666; font-style: italic">
          <div class="flex gap-1">
            <span>Supported formats:</span>
            <span style="font-weight: 700">xls, xlsx</span>
          </div>
          <div class="flex gap-1">
            <span>Maximum size:</span>
            <span style="font-weight: 700">5MB</span>
          </div>
        </div>
        <div class="mt-2 flex justify-between text-xs" style="color: #666">
          <div class="flex gap-1">
            <a @click="downloadExcelFileExample" class="flex items-center gap-1">
              <IconDownload />
              Tải file mẫu tại đây
            </a>
          </div>
        </div>
        <div class="mt-2 flex justify-between text-xs" style="color: #666; font-style: italic">
          <div class="flex gap-2">
            <div style="font-weight: 700">Lưu ý:</div>
            <div>
              <div>
                1.
                <strong>Mã xét nghiệm</strong>
                là duy nhất trên hệ thống và không thể trùng lặp
              </div>
              <div>
                2. Mã xét nghiệm đã có trên hệ thống sẽ bị ghi đè bởi thông tin trong excel: bao gồm
                tên xét nghiệm, nhóm, giá ...
              </div>
              <div>3. Mã xét nghiệm chưa có trên hệ thống sẽ được tạo mới</div>
              <div>
                4. Nếu có thông tin về nhóm xét nghiệm, cần phải tạo nhóm xét nghiệm trên hệ thống trước
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4 justify-center">
          <VueButton icon="close" style="" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton
            :icon="IconUpload"
            color="blue"
            :loading="saveLoading"
            @click="handleUpload"
            :disabled="!fileSelect"
          >
            Start Upload
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss">
.drop-area {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell,
    'Helvetica Neue', sans-serif;
  background-color: #edf4ff;
  color: #666;
  font-weight: 500;
}

.dragover {
  background-color: #bed6fc;
}
</style>
