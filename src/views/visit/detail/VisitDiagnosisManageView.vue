<script lang="ts" setup>
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { Table } from '@ckeditor/ckeditor5-table'
import { computed, ref, watch } from 'vue'
import { BasicEditor } from '../../../ckeditor/class-editor'
import ImageUpload from '../../../common/ImageUpload.vue'
import { InputText } from '../../../common/vue-form'
import { VisitApi } from '../../../modules/visit'
import { VisitDiagnosis, VisitDiagnosisApi } from '../../../modules/visit-diagnosis'
import { visit } from './visit.ref'
import { ImageHost } from '../../../modules/image/image.model'
import VueButton from '../../../common/VueButton.vue'

const imageUploadRef = ref<InstanceType<typeof ImageUpload>>()

const visitDiagnosis = ref<VisitDiagnosis>(VisitDiagnosis.blank())
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

watch(
  () => visit.value.visitDiagnosis!.reason,
  (newValue, oldValue) => (visitDiagnosis.value.reason = newValue || ''),
  { immediate: true }
)
watch(
  () => visit.value.visitDiagnosis!.healthHistory,
  (newValue, oldValue) => (visitDiagnosis.value.healthHistory = newValue || ''),
  { immediate: true }
)
watch(
  () => visit.value.visitDiagnosis!.summary,
  (newValue, oldValue) => (visitDiagnosis.value.summary = newValue || ''),
  { immediate: true }
)
watch(
  () => visit.value.visitDiagnosis!.diagnosis,
  (newValue, oldValue) => (visitDiagnosis.value.diagnosis = newValue || ''),
  { immediate: true }
)
watch(
  () => visit.value.visitDiagnosis!.vitalSigns,
  (newValue, oldValue) => (vitalSigns.value = JSON.parse(newValue || JSON.stringify({}))),
  { immediate: true }
)

const disabledButton = computed(() => {
  return false
  // return (
  //   visit.value.visitDiagnosis!.reason === visitDiagnosis.value.reason &&
  //   visit.value.visitDiagnosis!.healthHistory === visitDiagnosis.value.healthHistory &&
  //   visit.value.visitDiagnosis!.summary === visitDiagnosis.value.summary &&
  //   visit.value.visitDiagnosis!.vitalSigns === JSON.stringify(vitalSigns.value) &&
  //   visit.value.visitDiagnosis!.diagnosis === visitDiagnosis.value.diagnosis
  // )
})

const saveVisitDiagnosis = async () => {
  try {
    saveLoading.value = true
    visitDiagnosis.value.vitalSigns = JSON.stringify(vitalSigns.value)

    const { filesPosition, imageIdsKeep, files } = imageUploadRef.value?.getData() || {
      filesPosition: [],
      imageIdsKeep: [],
      files: [],
    }

    await VisitDiagnosisApi.updateOne({
      id: visit.value.visitDiagnosis!.id,
      imageIdsKeep,
      files,
      filesPosition,
      object: {
        ...visitDiagnosis.value,
        customerId: visit.value.customerId,
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
        <InputText v-model:value="visitDiagnosis.reason" />
      </div>
    </div>
    <div class="mt-4 flex flex-col md:flex-row flex-wrap gap-4">
      <div class="flex-1">
        <div>Tiền sử</div>
        <div class="healthHistory">
          <ckeditor v-model="visitDiagnosis.healthHistory" :editor="BasicEditor"></ckeditor>
        </div>
        <div class="mt-4">Tóm tắt</div>
        <div class="summary">
          <ckeditor v-model="visitDiagnosis.summary" :editor="BasicEditor"></ckeditor>
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
          (visit.visitDiagnosis?.imageList || [])
            .filter((i) => i.hostType === ImageHost.GoogleDriver)
            .map((i) => ({
              thumbnail: `https://drive.google.com/thumbnail?id=${i.hostId}&amp;sz=w200`,
              enlarged: `https://drive.google.com/thumbnail?id=${i.hostId}&amp;sz=w1000`,
              id: i.id,
            }))
        " />
    </div>
    <div class="mt-4">
      <div>Chẩn đoán</div>
      <div>
        <InputText v-model:value="visitDiagnosis.diagnosis" />
      </div>
    </div>
    <div class="mt-4 flex justify-between gap-4">
      <div></div>
      <VueButton
        color="blue"
        :disabled="disabledButton"
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
