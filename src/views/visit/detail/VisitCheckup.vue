<script lang="ts" setup>
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { Table } from '@ckeditor/ckeditor5-table'
import { computed, ref, watch } from 'vue'
import { BasicEditor } from '../../../ckeditor/class-editor'
import { InputText } from '../../../common/vue-form'
import { VisitApi } from '../../../modules/visit'
import { VisitDiagnosis } from '../../../modules/visit-diagnosis'
import { visit } from './visit.ref'

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
  return (
    visit.value.visitDiagnosis!.reason === visitDiagnosis.value.reason &&
    visit.value.visitDiagnosis!.healthHistory === visitDiagnosis.value.healthHistory &&
    visit.value.visitDiagnosis!.summary === visitDiagnosis.value.summary &&
    visit.value.visitDiagnosis!.vitalSigns === JSON.stringify(vitalSigns.value) &&
    visit.value.visitDiagnosis!.diagnosis === visitDiagnosis.value.diagnosis
  )
})

const saveVisitDiagnosis = async () => {
  try {
    saveLoading.value = true
    visitDiagnosis.value.vitalSigns = JSON.stringify(vitalSigns.value)
    await VisitApi.updateVisitDiagnosis({
      visitId: visit.value.id,
      customerId: visit.value.customerId!,
      visitDiagnosis: visitDiagnosis.value,
      visitDiagnosisId: visit.value.visitDiagnosis!.id,
    })
  } catch (error) {
    console.log('🚀 ~ file: VisitDiagnosis.vue:37 ~ saveVisitDiagnosis ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const resetVisitDiagnosis = () => {
  visitDiagnosis.value = VisitDiagnosis.clone(visit.value.visitDiagnosis!)
}
</script>
<template>
  <div>
    <div>
      <div>Lý do khám</div>
      <div>
        <InputText v-model:value="visitDiagnosis.reason" />
      </div>
    </div>
    <div class="mt-4 flex flex-col md:flex-row flex-wrap gap-4">
      <div class="flex-1">
        <div>Tiền sử</div>
        <div>
          <ckeditor v-model="visitDiagnosis.healthHistory" :editor="BasicEditor"></ckeditor>
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
    <div class="mt-4">
      <div>Tóm tắt bệnh án</div>
      <div>
        <ckeditor v-model="visitDiagnosis.summary" :editor="BasicEditor"></ckeditor>
      </div>
    </div>
    <div class="mt-4">
      <div>Chẩn đoán</div>
      <div>
        <InputText v-model:value="visitDiagnosis.diagnosis" />
      </div>
    </div>
    <div class="mt-4 flex justify-between gap-4">
      <div>
        <!-- <button class="btn" @click="resetVisitDiagnosis">
          <UndoOutlined />
          Tải lại
        </button> -->
      </div>
      <button class="btn btn-blue" :disabled="disabledButton" @click="saveVisitDiagnosis">
        <LoadingOutlined v-if="saveLoading" />
        <SaveOutlined v-if="!saveLoading" /> Lưu lại
      </button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
:deep(.ck-editor__editable) {
  height: 200px !important;
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
