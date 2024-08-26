<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { BasicEditor } from '../../../ckeditor/class-editor'
import ImageUpload from '../../../common/ImageUpload.vue'
import VueButton from '../../../common/VueButton.vue'
import { InputText } from '../../../common/vue-form'
import { ImageHost } from '../../../modules/image/image.model'
import { TicketClinicApi } from '../../../modules/ticket-clinic'
import { TicketDiagnosis } from '../../../modules/ticket-diagnosis'
import { ticketRef } from '../../../modules/ticket'

const imageUploadRef = ref<InstanceType<typeof ImageUpload>>()

const ticketDiagnosis = ref<TicketDiagnosis>(TicketDiagnosis.blank())
const vitalSigns = ref<{
  pulse?: number // Mạch
  temperature?: number // Nhiệt độ
  bloodPressure?: string // Huyết áp
  respiratoryRate?: number // Nhịp thở
  spO2?: number // sp02
  height?: number // Chiều cao
  weight?: number // Cân nặng
}>({})
const saveLoading = ref(false)
const hasChangeImage = ref(false)

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicDiagnosis.vue:28 ~ onMounted ~ onMounted:')
})

watch(
  () => ticketRef.value.ticketDiagnosis!.reason,
  (newValue, oldValue) => (ticketDiagnosis.value.reason = newValue || ''),
  { immediate: true }
)
watch(
  () => ticketRef.value.ticketDiagnosis!.healthHistory,
  (newValue, oldValue) => (ticketDiagnosis.value.healthHistory = newValue || ''),
  { immediate: true }
)
watch(
  () => ticketRef.value.ticketDiagnosis!.summary,
  (newValue, oldValue) => (ticketDiagnosis.value.summary = newValue || ''),
  { immediate: true }
)
watch(
  () => ticketRef.value.ticketDiagnosis!.diagnosis,
  (newValue, oldValue) => (ticketDiagnosis.value.diagnosis = newValue || ''),
  { immediate: true }
)
watch(
  () => ticketRef.value.ticketDiagnosis!.vitalSigns,
  (newValue, oldValue) => (vitalSigns.value = JSON.parse(newValue || JSON.stringify({}))),
  { immediate: true }
)
watch(
  () => ticketRef.value.ticketDiagnosis!.imageIds,
  (newValue, oldValue) => (hasChangeImage.value = false),
  { immediate: true }
)

const hasChangeData = computed(() => {
  if (ticketRef.value.ticketDiagnosis!.reason !== ticketDiagnosis.value.reason) {
    return true
  }
  if (ticketRef.value.ticketDiagnosis!.healthHistory !== ticketDiagnosis.value.healthHistory) {
    return true
  }
  if (ticketRef.value.ticketDiagnosis!.summary !== ticketDiagnosis.value.summary) {
    return true
  }
  if (ticketRef.value.ticketDiagnosis!.vitalSigns !== JSON.stringify(vitalSigns.value)) {
    return true
  }
  if (ticketRef.value.ticketDiagnosis!.diagnosis !== ticketDiagnosis.value.diagnosis) {
    return true
  }
  if (hasChangeImage.value) {
    return true
  }
  return false
})

const saveVisitDiagnosis = async () => {
  try {
    saveLoading.value = true
    ticketDiagnosis.value.vitalSigns = JSON.stringify(vitalSigns.value)

    const { filesPosition, imageIdsKeep, files } = imageUploadRef.value?.getData() || {
      filesPosition: [],
      imageIdsKeep: [],
      files: [],
    }

    await TicketClinicApi.updateDiagnosis({
      ticketId: ticketRef.value.id,
      imageIdsKeep,
      files,
      filesPosition,
      object: {
        ...ticketDiagnosis.value,
        customerId: ticketRef.value.customerId,
      },
    })
  } catch (error) {
    console.log('🚀 ~ file: VisitDiagnosis.vue:77 ~ saveVisitDiagnosis ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}
</script>
<template>
  <div class="mt-4">
    <div>
      <div>Lý do khám</div>
      <div>
        <InputText v-model:value="ticketDiagnosis.reason" />
      </div>
    </div>
    <div class="mt-4 flex flex-col md:flex-row flex-wrap gap-4">
      <div class="flex-1">
        <div>Tiền sử</div>
        <div class="healthHistory">
          <ckeditor v-model="ticketDiagnosis.healthHistory" :editor="BasicEditor"></ckeditor>
        </div>
        <div class="mt-4">Tóm tắt</div>
        <div class="summary">
          <ckeditor v-model="ticketDiagnosis.summary" :editor="BasicEditor"></ckeditor>
        </div>
      </div>
      <div class="md:w-[220px] w-full flex flex-col">
        <div>Chỉ số sinh tồn</div>
        <div class="grow pb-4" style="border: 1px solid #d1d5db">
          <table class="table-vital-signs">
            <tr>
              <td class="title-vital-signs">Mạch</td>
              <td>:</td>
              <td class="input-vital-signs">
                <input v-model="vitalSigns.pulse" type="number" />
              </td>
              <td class="unit-vital-signs">l/p</td>
            </tr>
            <tr>
              <td class="title-vital-signs">Nhiệt độ</td>
              <td>:</td>
              <td class="input-vital-signs">
                <input v-model="vitalSigns.temperature" type="number" />
              </td>
              <td class="unit-vital-signs">°C</td>
            </tr>
            <tr>
              <td class="title-vital-signs">Huyết áp</td>
              <td>:</td>
              <td class="input-vital-signs">
                <input v-model="vitalSigns.bloodPressure" />
              </td>
              <td class="unit-vital-signs">mmHg</td>
            </tr>
            <tr>
              <td class="title-vital-signs">TS Thở</td>
              <td>:</td>
              <td class="input-vital-signs">
                <input v-model="vitalSigns.respiratoryRate" type="number" />
              </td>
              <td class="unit-vital-signs">l/p</td>
            </tr>
            <tr>
              <td class="title-vital-signs">SpO2</td>
              <td>:</td>
              <td class="input-vital-signs">
                <input v-model="vitalSigns.spO2" type="number" />
              </td>
              <td class="unit-vital-signs">%</td>
            </tr>
            <tr>
              <td class="title-vital-signs">Chiều cao</td>
              <td>:</td>
              <td class="input-vital-signs">
                <input v-model="vitalSigns.height" type="number" />
              </td>
              <td class="unit-vital-signs">cm</td>
            </tr>
            <tr>
              <td class="title-vital-signs">Cân nặng</td>
              <td>:</td>
              <td class="input-vital-signs">
                <input v-model="vitalSigns.weight" type="number" />
              </td>
              <td class="unit-vital-signs">kg</td>
            </tr>
          </table>
        </div>
      </div>
    </div>
    <div class="mt-4"></div>
    <div class="mt-4">
      <div>Hình ảnh</div>
      <ImageUpload
        ref="imageUploadRef"
        :height="100"
        :rootImageList="
          (ticketRef.ticketDiagnosis?.imageList || [])
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
        color="blue"
        :disabled="!hasChangeData"
        :loading="saveLoading"
        icon="save"
        @click="saveVisitDiagnosis">
        Lưu lại
      </VueButton>
    </div>
  </div>
</template>
<style lang="scss" scoped>
:deep(.healthHistory .ck-editor__editable) {
  height: 120px !important;
}
:deep(.summary .ck-editor__editable) {
  height: 120px !important;
}
.table-vital-signs {
  width: 100%;
  td.title-vital-signs {
    padding: 4px 4px 4px 8px;
    white-space: nowrap;
  }
  td.unit-vital-signs {
    padding: 4px 8px 4px 8px;
    white-space: nowrap;
  }
  td.input-vital-signs {
    padding-left: 8px;
  }
  input {
    padding-left: 0.5rem;
    text-align: left;
    font-style: italic;
    width: 100%;
    border-top: none;
    border-left: none;
    border-right: none;
    border-bottom: 1px solid #cdcdcd;
    &:focus {
      outline: none;
    }
  }
}
</style>
