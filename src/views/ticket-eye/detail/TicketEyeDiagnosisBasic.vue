<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { BasicEditor } from '../../../ckeditor/class-editor'
import ImageUpload from '../../../common/ImageUpload.vue'
import VueButton from '../../../common/VueButton.vue'
import { InputText } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { ImageHost } from '../../../modules/image/image.model'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { TicketDiagnosis } from '../../../modules/ticket-diagnosis'
import { TicketEyeApi, ticketEyeRef } from '../../../modules/ticket-eye'

const meStore = useMeStore()
const { permissionIdMap } = meStore

const imageUploadRef = ref<InstanceType<typeof ImageUpload>>()

const ticketDiagnosis = ref<TicketDiagnosis>(TicketDiagnosis.blank())
const general = ref<{
  pulse?: number // Mạch
  temperature?: number // Nhiệt độ
  bloodPressure?: string // Huyết áp
  respiratoryRate?: number // Nhịp thở
  spO2?: number // sp02
  height?: number // Chiều cao
  weight?: number // Cân nặng
  body?: string
}>({})

const regional = ref<{
  ThiLuc_MP?: string
  NhanAp_MP?: string
  MiMatKetMac_MP?: string
  GiacMac_MP?: string
  TienPhongMongMat_MP?: string
  ThuyTinhThe_MP?: string
  DayMat_MP?: string

  ThiLuc_MT?: string
  NhanAp_MT?: string
  MiMatKetMac_MT?: string
  GiacMac_MT?: string
  TienPhongMongMat_MT?: string
  ThuyTinhThe_MT?: string
  DayMat_MT?: string
}>({})
const saveLoading = ref(false)
const hasChangeImage = ref(false)

onMounted(async () => {
  console.log('🚀 ~ file: TicketEyeDiagnosisBasic.vue:51 ~ onMounted')
})

watch(
  () => ticketEyeRef.value.ticketDiagnosis!.reason,
  (newValue, oldValue) => (ticketDiagnosis.value.reason = newValue || ''),
  { immediate: true }
)
watch(
  () => ticketEyeRef.value.ticketDiagnosis!.healthHistory,
  (newValue, oldValue) => (ticketDiagnosis.value.healthHistory = newValue || ''),
  { immediate: true }
)
watch(
  () => ticketEyeRef.value.ticketDiagnosis!.general,
  (newValue, oldValue) => (general.value = JSON.parse(newValue || JSON.stringify({}))),
  { immediate: true }
)
watch(
  () => ticketEyeRef.value.ticketDiagnosis!.diagnosis,
  (newValue, oldValue) => (ticketDiagnosis.value.diagnosis = newValue || ''),
  { immediate: true }
)
watch(
  () => ticketEyeRef.value.ticketDiagnosis!.regional,
  (newValue, oldValue) => (regional.value = JSON.parse(newValue || JSON.stringify({}))),
  { immediate: true }
)
watch(
  () => ticketEyeRef.value.ticketDiagnosis!.imageIds,
  (newValue, oldValue) => (hasChangeImage.value = false),
  { immediate: true }
)

const hasChangeData = computed(() => {
  if (ticketEyeRef.value.ticketDiagnosis!.reason !== ticketDiagnosis.value.reason) {
    return true
  }
  if (ticketEyeRef.value.ticketDiagnosis!.healthHistory !== ticketDiagnosis.value.healthHistory) {
    return true
  }
  if (ticketEyeRef.value.ticketDiagnosis!.summary !== ticketDiagnosis.value.summary) {
    return true
  }
  if (ticketEyeRef.value.ticketDiagnosis!.diagnosis !== ticketDiagnosis.value.diagnosis) {
    return true
  }
  if (hasChangeImage.value) {
    return true
  }

  const generalValue = JSON.parse(JSON.stringify(general.value))
  Object.keys(generalValue).forEach((key) => {
    if (!generalValue[key]) delete generalValue[key]
  })
  if (ticketEyeRef.value.ticketDiagnosis!.general !== JSON.stringify(generalValue)) {
    return true
  }

  const regionalValue = JSON.parse(JSON.stringify(regional.value))
  Object.keys(regionalValue).forEach((key) => {
    if (!regionalValue[key]) delete regionalValue[key]
  })
  if (ticketEyeRef.value.ticketDiagnosis!.regional !== JSON.stringify(regionalValue)) {
    return true
  }
  return false
})

const saveTicketDiagnosis = async () => {
  try {
    saveLoading.value = true

    const generalValue = JSON.parse(JSON.stringify(general.value))
    Object.keys(generalValue).forEach((key) => {
      if (!generalValue[key]) delete generalValue[key]
    })
    ticketDiagnosis.value.general = JSON.stringify(generalValue)

    const regionalValue = JSON.parse(JSON.stringify(regional.value))
    Object.keys(regionalValue).forEach((key) => {
      if (!regionalValue[key]) delete regionalValue[key]
    })
    ticketDiagnosis.value.regional = JSON.stringify(regionalValue)

    const { filesPosition, imageIdsKeep, files } = imageUploadRef.value?.getData() || {
      filesPosition: [],
      imageIdsKeep: [],
      files: [],
    }

    await TicketEyeApi.updateDiagnosisBasic({
      ticketId: ticketEyeRef.value.id,
      imageIdsKeep,
      files,
      filesPosition,
      customerId: ticketEyeRef.value.customerId,
      object: {
        ...ticketDiagnosis.value,
      },
    })
  } catch (error) {
    console.log('🚀 ~ file: TicketEyeDiagnosisBasic.vue:153 ~ saveTicketDiagnosis ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleFocus = (e: Event) => {
  const target = e.target as HTMLElement
  const range = document.createRange()
  const selection = window.getSelection()
  if (target?.childNodes?.[0]) {
    range.selectNodeContents(target) // Chọn toàn bộ nội dung của div
    range.collapse(false) // focus thì xuống cuối câu
    selection?.removeAllRanges() // Xóa tất cả các range hiện tại
    selection?.addRange(range) // Thêm range mới để bôi đen toàn bộ nội dung
  }
}
</script>
<template>
  <div>
    <div class="mt-4">
      <div>Lý do khám</div>
      <div>
        <InputText v-model:value="ticketDiagnosis.reason" />
      </div>
    </div>
    <div class="mt-4 flex flex-wrap gap-4">
      <div style="flex-basis: 300px; flex-grow: 1">
        <div>Tiền sử</div>
        <div class="healthHistory">
          <ckeditor v-model="ticketDiagnosis.healthHistory" :editor="BasicEditor"></ckeditor>
        </div>
      </div>
      <div style="flex-basis: 300px; flex-grow: 1">
        <div>Toàn thân</div>
        <div class="general">
          <ckeditor v-model="general.body" :editor="BasicEditor"></ckeditor>
        </div>
      </div>
    </div>

    <div class="mt-4 w-full" style="overflow-x: scroll">
      <div>Khám mắt</div>
      <div class="w-full" style="min-width: 600px">
        <table>
          <thead>
            <tr>
              <th style="width: 160px"></th>
              <th>Mắt Phải</th>
              <th>Mắt Trái</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="title">Thị lực</td>
              <td><input v-model="regional.ThiLuc_MP" /></td>
              <td><input v-model="regional.ThiLuc_MT" /></td>
            </tr>
            <tr>
              <td class="title">Nhãn áp</td>
              <td><input v-model="regional.NhanAp_MP" /></td>
              <td><input v-model="regional.NhanAp_MT" /></td>
            </tr>
            <tr>
              <td class="title">Mi mắt - kết mạc</td>
              <td><input v-model="regional.MiMatKetMac_MP" /></td>
              <td><input v-model="regional.MiMatKetMac_MT" /></td>
            </tr>
            <tr>
              <td class="title">Giác mạc</td>
              <td><input v-model="regional.GiacMac_MP" /></td>
              <td><input v-model="regional.GiacMac_MT" /></td>
            </tr>
            <tr>
              <td class="title">Tiền phòng, mống mắt</td>
              <td><input v-model="regional.TienPhongMongMat_MP" /></td>
              <td><input v-model="regional.TienPhongMongMat_MT" /></td>
            </tr>
            <tr>
              <td class="title">Thủy tinh thể</td>
              <td><input v-model="regional.ThuyTinhThe_MP" /></td>
              <td><input v-model="regional.ThuyTinhThe_MT" /></td>
            </tr>
            <tr>
              <td class="title">Đáy mắt</td>
              <td><input v-model="regional.DayMat_MP" /></td>
              <td><input v-model="regional.DayMat_MT" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-4">
      <div>Hình ảnh</div>
      <ImageUpload
        ref="imageUploadRef"
        :height="100"
        :rootImageList="
          (ticketEyeRef.ticketDiagnosis?.imageList || [])
            .filter((i) => i.hostType === ImageHost.GoogleDriver)
            .map((i) => ({
              thumbnail: `https://drive.google.com/thumbnail?id=${i.hostId}&amp;sz=w200`,
              enlarged: `https://drive.google.com/thumbnail?id=${i.hostId}&amp;sz=w1000`,
              id: i.id,
            }))
        "
        @changeImage="hasChangeImage = true" />
    </div>
    <div class="mt-4">
      <div>Chẩn đoán</div>
      <div>
        <InputText v-model:value="ticketDiagnosis.diagnosis" />
      </div>
    </div>
    <div class="mt-4 flex justify-between gap-4">
      <div></div>
      <VueButton
        v-if="permissionIdMap[PermissionId.TICKET_EYE_UPDATE_DIAGNOSIS_BASIC]"
        color="blue"
        :disabled="!hasChangeData"
        :loading="saveLoading"
        icon="save"
        @click="saveTicketDiagnosis">
        Lưu lại
      </VueButton>
    </div>
  </div>
</template>
<style lang="scss" scoped>
:deep(.healthHistory .ck-editor__editable) {
  height: 100px !important;
}
:deep(.general .ck-editor__editable) {
  height: 100px !important;
}
table {
  border-collapse: collapse;
  width: 100%;
  table-layout: fixed;

  th {
    white-space: normal;
    padding: 6px;
    border: 1px solid #cdcdcd;
  }

  td {
    &.title {
      padding: 0 6px;
    }
    border: 1px solid #cdcdcd;
    input {
      width: 100%;
      height: 100%;
      border: none;
      padding: 6px;
      border-radius: 2px;
      &:focus {
        outline: 2px solid #40a9ff;
      }
    }
  }
}
</style>
