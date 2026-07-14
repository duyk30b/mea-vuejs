<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import ImageUploadCloudinary from '@/common/image-upload/ImageUploadCloudinary.vue'
import { InputArea, InputOptionsText, InputText } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputOptions.vue'
import { MeService } from '@/modules/_me/me.service'
import { CustomerService } from '@/modules/customer'
import { ICD, ICDService } from '@/modules/icd'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ticketRoomRef } from '@/modules/room'
import { TemplateHtmlAction } from '@/modules/template-html'
import { TicketChangeAttributeApi } from '@/modules/ticket'
import { useTicketClinicDetailStore } from '@/store/ticket-clinic-detail.store'
import { ESImage } from '@/utils'
import { computed, onBeforeMount, ref, watch } from 'vue'

const ticketClinicDetailStore = useTicketClinicDetailStore()
const { userPermission, organization, user } = MeService

const note = ref<string>('')
const imageUploadMultipleRef = ref<InstanceType<typeof ImageUploadCloudinary>>()

const ticketAttributeKeyList = [
  'reason',
  'healthHistory',
  'summary',

  'pulse',
  'bloodPressure',
  'temperature',
  'respiratoryRate',
  'spO2',
  'height',
  'weight',

  'icd10Name',
  'icd10Code',
] as const
type TicketAttributeKeyType = (typeof ticketAttributeKeyList)[number]
type TicketAttributeMap = {
  [P in TicketAttributeKeyType]?: any
}

const ticketAttributeOriginMap: TicketAttributeMap = {}
const ticketAttributeMap = ref<TicketAttributeMap>({})

const icdOptions = ref<ItemOption[]>([])
const hasChangeAttribute = ref(false)
const saveLoading = ref(false)
const hasChangeImage = ref(false)
const loadingImage = ref(false)

onBeforeMount(async () => {
  if (ticketClinicDetailStore.roomRef.roomSettingObj.diagnosis.icd10) {
    ICDService.fetchAll()
      .then(() => {})
      .catch((error) => {
        console.log('🚀 ~ file: TicketClinicDiagnosis.vue:90 ~ ICDService.fetchAll ~ error:', error)
      })
  }
})

watch(
  () => ticketRoomRef.value.note,
  (newValue, oldValue) => {
    note.value = newValue
  },
  { immediate: true, deep: true },
)

const checkHasChangeAttribute = () => {
  let hasChange = false
  for (const key of ticketAttributeKeyList) {
    if (ticketAttributeOriginMap[key] !== ticketAttributeMap.value[key]) {
      hasChange = true
      break
    }
  }
  hasChangeAttribute.value = hasChange
}

watch(
  () => ticketRoomRef.value.ticketAttributeMap,
  (newValue, oldValue) => {
    ticketAttributeKeyList.forEach((k) => {
      const value = newValue[k]
      if (ticketAttributeOriginMap[k] === value) return
      ticketAttributeOriginMap[k] = value
      ticketAttributeMap.value[k] = value
    })
    checkHasChangeAttribute()
  },
  { immediate: true, deep: true },
)

watch(
  () => ticketAttributeMap.value,
  (newValue, oldValue) => {
    checkHasChangeAttribute()
  },
  { deep: true },
)

watch(
  () => ticketRoomRef.value!.imageDiagnosisIds,
  (newValue, oldValue) => {
    try {
      const imageDiagnosisIdList: number[] = JSON.parse(newValue)
      ticketRoomRef.value!.imageDiagnosisList = imageDiagnosisIdList
        .map((i) => ticketRoomRef.value!.imageMap[i])
        .filter((i) => !!i)
    } catch (error) {
      ticketRoomRef.value!.imageDiagnosisList = []
    }
    hasChangeImage.value = false
  },
  { immediate: true },
)

const hasChangeCustomer = computed(() => {
  return ticketRoomRef.value.customer?.healthHistory != ticketAttributeMap.value.healthHistory
})

const hasChangeData = computed(() => {
  if (note.value != ticketRoomRef.value.note) {
    return true
  }
  if (hasChangeImage.value) {
    return true
  }
  if (hasChangeAttribute.value) {
    return true
  }
  if (hasChangeCustomer.value) {
    return true
  }

  return false
})

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

const saveTicketDiagnosis = async () => {
  try {
    saveLoading.value = true
    const imgData = imageUploadMultipleRef.value?.getData() || {
      filesPosition: [],
      imageIdListKeep: [],
      files: [],
      imageUrls: [],
      imageIdWaitList: [],
    }

    let ticketAttributeChangeList = undefined
    if (hasChangeAttribute.value) {
      ticketAttributeChangeList = ticketAttributeKeyList.map((key) => ({
        key,
        value: ticketAttributeMap.value[key] || '',
      }))
    }

    await Promise.all([
      TicketChangeAttributeApi.updateDiagnosis({
        ticketId: ticketRoomRef.value.id,
        note: note.value !== ticketRoomRef.value.note ? note.value : undefined,
        imagesChange: hasChangeImage.value
          ? {
              files: imgData.files,
              imageIdWaitList: imgData.imageIdWaitList,
              externalUrlList: imgData.imageUrls,
            }
          : undefined,
        ticketAttributeChangeList,
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

const startPrintTicketClinicDiagnosis = async () => {
  await TemplateHtmlAction.startPrintTicketClinicDiagnosis({
    ticket: ticketRoomRef.value,
    customer: ticketRoomRef.value.customer!,
  })
}
</script>
<template>
  <div class="mt-2">
    <div>
      <div>Lý do khám</div>
      <div>
        <InputText v-model:value="ticketAttributeMap.reason" />
      </div>
    </div>
    <div class="mt-4 flex flex-wrap gap-4">
      <div class="flex flex-col" style="flex-grow: 3; flex-basis: 200px; min-height: 200px">
        <div>Tiền sử</div>
        <div class="flex-1 healthHistory">
          <InputArea v-model:value="ticketAttributeMap.healthHistory" />
        </div>
      </div>
      <div class="flex flex-col" style="flex-grow: 3; flex-basis: 200px; min-height: 200px">
        <div>Tóm tắt</div>
        <div class="flex-1 summary">
          <InputArea v-model:value="ticketAttributeMap.summary" />
        </div>
      </div>
      <div style="flex-grow: 1; flex-basis: 200px">
        <div>Chỉ số sinh tồn</div>
        <div class="grow pb-4 pt-2" style="border: 1px solid #d1d5db">
          <table class="w-full table-vital-signs">
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
                <td class="title-vital-signs">Huyết áp</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input v-model="ticketAttributeMap.bloodPressure" />
                </td>
                <td class="unit-vital-signs">mmHg</td>
              </tr>
              <tr>
                <td class="title-vital-signs">Nhiệt độ</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input v-model="ticketAttributeMap.temperature" />
                </td>
                <td class="unit-vital-signs">°C</td>
              </tr>
              <tr>
                <td class="title-vital-signs">Chiều cao</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input type="number" v-model="ticketAttributeMap.height" />
                </td>
                <td class="unit-vital-signs">cm</td>
              </tr>
              <tr>
                <td class="title-vital-signs">Cân nặng</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input type="number" v-model="ticketAttributeMap.weight" />
                </td>
                <td class="unit-vital-signs">kg</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <!-- <pre>{{ JSON.stringify(ticketRoomRef?.imageDiagnosisList, null, 4) }}</pre> -->
    <div class="mt-4">
      <div>Hình ảnh</div>
      <ImageUploadCloudinary
        ref="imageUploadMultipleRef"
        :oid="organization.id"
        :customerId="ticketRoomRef.customerId"
        :editable="!!ticketRoomRef.id"
        :height="100"
        :rootImageList="
          (ticketRoomRef?.imageDiagnosisList || []).map((i) => ({
            thumbnail: ESImage.getImageLink(i, { size: 200 }),
            enlarged: ESImage.getImageLink(i, { size: 1000 }),
            id: i.id,
          }))
        "
        @changeImage="hasChangeImage = true"
        @loading="(v) => (loadingImage = v)"
      />
    </div>
    <div class="mt-4" v-if="ticketClinicDetailStore.roomRef.roomSettingObj.diagnosis.icd10">
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
      <div>
        <VueButton color="blue" icon="print" @click="startPrintTicketClinicDiagnosis">
          In phiếu khám
        </VueButton>
      </div>
      <VueButton
        v-if="ticketRoomRef.id && userPermission[PermissionId.TICKET_CHANGE_ATTRIBUTE]"
        color="blue"
        :disabled="!hasChangeData || loadingImage"
        :loading="saveLoading"
        icon="save"
        @click="saveTicketDiagnosis"
      >
        Lưu lại
      </VueButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.diagnosis_menu {
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #f0f0f0;
  }
  &.active {
    background-color: #1890ff;
    color: white;
  }
}

.table-vital-signs {
  td.title-vital-signs {
    // font-size: 13px;
    padding: 4px 4px 4px 8px;
    white-space: nowrap;
  }
  td.unit-vital-signs {
    // font-size: 13px;
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
