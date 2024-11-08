<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { BasicEditor } from '../../../ckeditor/class-editor'
import ImageUpload from '../../../common/ImageUpload.vue'
import VueButton from '../../../common/VueButton.vue'
import { InputText } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { ImageHost } from '../../../modules/image/image.model'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { TicketClinicApi, ticketClinicRef } from '../../../modules/ticket-clinic'
import { TicketDiagnosis } from '../../../modules/ticket-diagnosis'

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
const saveLoading = ref(false)
const hasChangeImage = ref(false)

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicDiagnosisBase.vue:28 ~ onMounted')
})

watch(
  () => ticketClinicRef.value.ticketDiagnosis!.reason,
  (newValue, oldValue) => (ticketDiagnosis.value.reason = newValue || ''),
  { immediate: true }
)
watch(
  () => ticketClinicRef.value.ticketDiagnosis!.healthHistory,
  (newValue, oldValue) => (ticketDiagnosis.value.healthHistory = newValue || ''),
  { immediate: true }
)
watch(
  () => ticketClinicRef.value.ticketDiagnosis!.general,
  (newValue, oldValue) => {
    try {
      general.value = JSON.parse(newValue || JSON.stringify({}))
    } catch (error) {
      console.log('🚀 ~ file: TicketClinicDiagnosisBase.vue:47 ~ newValue:', newValue)
      console.log('🚀 ~ file: TicketClinicDiagnosisBase.vue:47 ~ error:', error)
      general.value = {}
    }
  },
  { immediate: true }
)
watch(
  () => ticketClinicRef.value.ticketDiagnosis!.summary,
  (newValue, oldValue) => (ticketDiagnosis.value.summary = newValue || ''),
  { immediate: true }
)
watch(
  () => ticketClinicRef.value.ticketDiagnosis!.diagnosis,
  (newValue, oldValue) => (ticketDiagnosis.value.diagnosis = newValue || ''),
  { immediate: true }
)

watch(
  () => ticketClinicRef.value.ticketDiagnosis!.imageIds,
  (newValue, oldValue) => (hasChangeImage.value = false),
  { immediate: true }
)

const hasChangeData = computed(() => {
  if (ticketClinicRef.value.ticketDiagnosis!.reason !== ticketDiagnosis.value.reason) {
    return true
  }
  if (
    ticketClinicRef.value.ticketDiagnosis!.healthHistory !== ticketDiagnosis.value.healthHistory
  ) {
    return true
  }
  if (ticketClinicRef.value.ticketDiagnosis!.summary !== ticketDiagnosis.value.summary) {
    return true
  }

  if (ticketClinicRef.value.ticketDiagnosis!.diagnosis !== ticketDiagnosis.value.diagnosis) {
    return true
  }
  if (hasChangeImage.value) {
    return true
  }

  const generalValue = JSON.parse(JSON.stringify(general.value))
  Object.keys(generalValue).forEach((key) => {
    if (!generalValue[key]) delete generalValue[key]
  })
  if (ticketClinicRef.value.ticketDiagnosis!.general !== JSON.stringify(generalValue)) {
    return true
  }

  return false
})

const saveVisitDiagnosis = async () => {
  try {
    saveLoading.value = true

    const generalValue = JSON.parse(JSON.stringify(general.value))
    Object.keys(generalValue).forEach((key) => {
      if (!generalValue[key]) delete generalValue[key]
    })
    ticketDiagnosis.value.general = JSON.stringify(generalValue)

    const { filesPosition, imageIdsKeep, files } = imageUploadRef.value?.getData() || {
      filesPosition: [],
      imageIdsKeep: [],
      files: [],
    }

    await TicketClinicApi.updateDiagnosisBase({
      ticketId: ticketClinicRef.value.id,
      imageIdsKeep,
      files,
      filesPosition,
      customerId: ticketClinicRef.value.customerId,
      object: {
        ...ticketDiagnosis.value,
      },
    })
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicDiagnosisBase.vue:129 ~ saveVisitDiagnosis ~ error:', error)
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
                <input v-model="general.pulse" type="number" />
              </td>
              <td class="unit-vital-signs">l/p</td>
            </tr>
            <tr>
              <td class="title-vital-signs">Nhiệt độ</td>
              <td>:</td>
              <td class="input-vital-signs">
                <input v-model="general.temperature" type="number" />
              </td>
              <td class="unit-vital-signs">°C</td>
            </tr>
            <tr>
              <td class="title-vital-signs">Huyết áp</td>
              <td>:</td>
              <td class="input-vital-signs">
                <input v-model="general.bloodPressure" />
              </td>
              <td class="unit-vital-signs">mmHg</td>
            </tr>
            <tr>
              <td class="title-vital-signs">TS Thở</td>
              <td>:</td>
              <td class="input-vital-signs">
                <input v-model="general.respiratoryRate" type="number" />
              </td>
              <td class="unit-vital-signs">l/p</td>
            </tr>
            <tr>
              <td class="title-vital-signs">SpO2</td>
              <td>:</td>
              <td class="input-vital-signs">
                <input v-model="general.spO2" type="number" />
              </td>
              <td class="unit-vital-signs">%</td>
            </tr>
            <tr>
              <td class="title-vital-signs">Chiều cao</td>
              <td>:</td>
              <td class="input-vital-signs">
                <input v-model="general.height" type="number" />
              </td>
              <td class="unit-vital-signs">cm</td>
            </tr>
            <tr>
              <td class="title-vital-signs">Cân nặng</td>
              <td>:</td>
              <td class="input-vital-signs">
                <input v-model="general.weight" type="number" />
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
          (ticketClinicRef.ticketDiagnosis?.imageList || [])
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
        v-if="permissionIdMap[PermissionId.TICKET_CLINIC_BASE_UPDATE_DIAGNOSIS]"
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
