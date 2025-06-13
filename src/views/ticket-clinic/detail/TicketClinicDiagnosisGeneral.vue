<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VueTinyMCE from '../../../common/VueTinyMCE.vue'
import ImageUploadMultiple from '../../../common/image-upload/ImageUploadMultiple.vue'
import { InputHint, InputOptions, InputOptionsText, InputText } from '../../../common/vue-form'
import { MeService } from '../../../modules/_me/me.service'
import { CustomerService } from '../../../modules/customer'
import { ImageHost } from '../../../modules/image/image.model'
import { PermissionId } from '../../../modules/permission/permission.enum'
import {
  TicketAttributeKeyGeneralList,
  type TicketAttributeKeyGeneralType,
} from '../../../modules/ticket-attribute'
import { TicketClinicApi } from '../../../modules/ticket-clinic'
import { ESImage, ESString } from '../../../utils'
import { useSettingStore } from '@/modules/_me/setting.store'
import { ICD, ICDService } from '@/modules/icd'
import type { ItemOption } from '@/common/vue-form/InputOptions.vue'
import { ticketRoomRef } from '@/modules/room'

const inputOptionsICD = ref<InstanceType<typeof InputOptions>>()

const { userPermission } = MeService
const settingStore = useSettingStore()

const note = ref<string>('')
const imageUploadMultipleRef = ref<InstanceType<typeof ImageUploadMultiple>>()

const ticketAttributeOriginMap: { [P in TicketAttributeKeyGeneralType]?: any } = {}
const ticketAttributeMap = ref<
  { [P in TicketAttributeKeyGeneralType]?: any } & { healthHistory: string; summary: string }
>({
  healthHistory: '',
  summary: '',
})

const icdOptions = ref<ItemOption[]>([])

const saveLoading = ref(false)
const hasChangeImage = ref(false)

onMounted(async () => {
  if (settingStore.TICKET_CLINIC_DETAIL.diagnosis.icd10) {
    await ICDService.fetchAll()
  }
})

watch(
  () => ticketRoomRef.value.note,
  (newValue, oldValue) => {
    note.value = newValue
  },
  { immediate: true, deep: true },
)

watch(
  () => ticketRoomRef.value.ticketAttributeList,
  (newValue, oldValue) => {
    if (!newValue) {
      return (ticketAttributeMap.value = { healthHistory: '', summary: '' })
    }
    newValue.forEach((i) => {
      if (!TicketAttributeKeyGeneralList.includes(i.key as any)) return
      const k = i.key as unknown as TicketAttributeKeyGeneralType
      if (i.value === ticketAttributeOriginMap[k]) return
      ticketAttributeOriginMap[k] = i.value
      ticketAttributeMap.value[k] = i.value
    })
  },
  { immediate: true, deep: true },
)

watch(
  () => ticketRoomRef.value!.imageIds,
  (newValue, oldValue) => (hasChangeImage.value = false),
  { immediate: true },
)

const hasChangeCustomer = computed(() => {
  const customerHealthHistory = ticketRoomRef.value.customer?.healthHistory || ''
  return customerHealthHistory != ticketAttributeMap.value.healthHistory
})

const hasChangeAttribute = computed(() => {
  let hasChange = false
  Object.entries(ticketAttributeMap.value).forEach(([key, value]) => {
    const k = key as unknown as TicketAttributeKeyGeneralType
    const rootValue = ticketRoomRef.value.ticketAttributeMap[k] || ''
    if (rootValue != value) {
      hasChange = true
    }
  })
  return hasChange
})

const hasChangeData = computed(() => {
  if (note.value != ticketRoomRef.value.note) return true
  if (hasChangeImage.value) return true
  if (hasChangeAttribute.value) return true
  if (hasChangeCustomer.value) return true

  return false
})

const saveTicketDiagnosis = async () => {
  try {
    saveLoading.value = true
    const { filesPosition, imageIdsKeep, files } = imageUploadMultipleRef.value?.getData() || {
      filesPosition: [],
      imageIdsKeep: [],
      files: [],
    }

    let ticketAttributeChangeList = undefined
    if (hasChangeAttribute.value) {
      ticketAttributeChangeList = Object.entries(ticketAttributeMap.value)
        .map(([key, value]) => ({ key, value }))
        .filter((i) => !!i.value)
    }

    await Promise.all([
      TicketClinicApi.updateDiagnosis({
        ticketId: ticketRoomRef.value.id,
        note: note.value,
        files,
        imagesChange: hasChangeImage.value ? { imageIdsKeep, filesPosition } : undefined,
        ticketAttributeChangeList,
        ticketAttributeKeyList: TicketAttributeKeyGeneralList as any,
      }),
      hasChangeCustomer.value
        ? CustomerService.updateOne(ticketRoomRef.value.customerId, {
            healthHistory: ticketAttributeMap.value.healthHistory,
          })
        : undefined,
    ])
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicDiagnosisGeneral.vue:137 ~:', error)
  } finally {
    saveLoading.value = false
  }
}

const getDataTicketDiagnosis = () => {
  return { ticketAttributeMap: ticketAttributeMap.value }
}

const searchingICD = async (text: string) => {
  if (!text) {
    icdOptions.value = []
  } else {
    const icdList = await ICDService.search(text, { limit: 20 })
    icdOptions.value = (icdList || []).map((i) => {
      return { value: i.id, text: `${i.code} - ${i.name}`, data: i }
    })
  }
}

const selectICD = async (options: { data: ICD; text: string }) => {
  note.value = options.data.name || ''
  ticketAttributeMap.value.icd10Name = options.data.name || ''
  ticketAttributeMap.value.icd10Code = options.data.code || ''
}

const updateTextICD = (text: string) => {
  if (!text) {
    ticketAttributeMap.value.icd10Code = ''
  }
}

defineExpose({ getDataTicketDiagnosis })
</script>
<template>
  <div class="mt-4">
    <div>
      <div>Lý do khám</div>
      <div>
        <InputText v-model:value="ticketAttributeMap.reason" />
      </div>
    </div>
    <div class="mt-4 flex flex-col md:flex-row flex-wrap gap-4">
      <div class="flex-1">
        <div>Tiền sử</div>
        <div class="healthHistory" style="height: 150px">
          <VueTinyMCE v-model="ticketAttributeMap.healthHistory" />
        </div>
        <div class="mt-4">Tóm tắt</div>
        <div class="summary" style="height: 150px">
          <VueTinyMCE v-model="ticketAttributeMap.summary" />
        </div>
      </div>
      <div class="md:w-[220px] w-full flex flex-col">
        <div>Chỉ số sinh tồn</div>
        <div class="grow pb-4" style="border: 1px solid #d1d5db">
          <table class="table-vital-signs">
            <tbody>
              <tr>
                <td class="title-vital-signs">Mạch</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input v-model="ticketAttributeMap.pulse" type="number" />
                </td>
                <td class="unit-vital-signs">l/p</td>
              </tr>
              <tr>
                <td class="title-vital-signs">Nhiệt độ</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input v-model="ticketAttributeMap.temperature" type="number" />
                </td>
                <td class="unit-vital-signs">°C</td>
              </tr>
              <tr>
                <td class="title-vital-signs">Huyết áp</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input v-model="ticketAttributeMap.bloodPressure" />
                </td>
                <td class="unit-vital-signs">mmHg</td>
              </tr>
              <tr>
                <td class="title-vital-signs">TS Thở</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input v-model="ticketAttributeMap.respiratoryRate" type="number" />
                </td>
                <td class="unit-vital-signs">l/p</td>
              </tr>
              <tr>
                <td class="title-vital-signs">SpO2</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input v-model="ticketAttributeMap.spO2" type="number" />
                </td>
                <td class="unit-vital-signs">%</td>
              </tr>
              <tr>
                <td class="title-vital-signs">Chiều cao</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input v-model="ticketAttributeMap.height" type="number" />
                </td>
                <td class="unit-vital-signs">cm</td>
              </tr>
              <tr>
                <td class="title-vital-signs">Cân nặng</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input v-model="ticketAttributeMap.weight" type="number" />
                </td>
                <td class="unit-vital-signs">kg</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="mt-4"></div>
    <div class="mt-4">
      <div>Hình ảnh</div>
      <ImageUploadMultiple
        ref="imageUploadMultipleRef"
        :editable="!!ticketRoomRef.id"
        :height="100"
        :rootImageList="
          (ticketRoomRef?.imageList || [])
            .filter((i) => i.hostType === ImageHost.GoogleDriver)
            .map((i) => ({
              thumbnail: ESImage.getImageLink(i, { size: 200 }),
              enlarged: ESImage.getImageLink(i, { size: 1000 }),
              id: i.id,
            }))
        "
        @changeImage="hasChangeImage = true"
      />
    </div>
    <div class="mt-4" v-if="settingStore.TICKET_CLINIC_DETAIL.diagnosis.icd10">
      <div>Chẩn đoán theo ICD10</div>
      <div>
        <InputOptionsText
          ref="inputOptionsICD"
          :prepend="ticketAttributeMap.icd10Code || '&nbsp;&nbsp;&nbsp;&nbsp;'"
          v-model:text="ticketAttributeMap.icd10Name"
          :max-height="260"
          :options="icdOptions"
          @selectItem="({ data, text }) => selectICD({ data, text })"
          @update:text="updateTextICD"
          @searching="searchingICD"
        />
      </div>
    </div>
    <div class="mt-4">
      <div>Chẩn đoán</div>
      <div>
        <InputText v-model:value="note" />
      </div>
    </div>
    <div class="mt-4 flex justify-between gap-4">
      <div></div>
      <VueButton
        v-if="
          ticketRoomRef.id && userPermission[PermissionId.TICKET_CLINIC_UPDATE_TICKET_ATTRIBUTE]
        "
        color="blue"
        :disabled="!hasChangeData"
        :loading="saveLoading"
        icon="save"
        @click="saveTicketDiagnosis"
      >
        Lưu lại
      </VueButton>
    </div>
  </div>
</template>
<style lang="scss" scoped>
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
