<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import VueTinyMCE from '@/common/VueTinyMCE.vue'
import ImageUploadCloudinary from '@/common/image-upload/ImageUploadCloudinary.vue'
import { InputArea, InputOptions, InputOptionsText, InputText } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputOptions.vue'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { CustomerService } from '@/modules/customer'
import { ICD, ICDService } from '@/modules/icd'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Room, RoomService, RoomTicketStyle, RoomType, ticketRoomRef } from '@/modules/room'
import { TicketChangeAttributeApi } from '@/modules/ticket'
import {
  TicketAttributeKeyGeneralList,
  type TicketAttributeKeyGeneralType,
  type TicketAttributeKeyType,
} from '@/modules/ticket-attribute'
import { ESImage } from '@/utils'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DiagnosisEye from './DiagnosisEye.vue'
import DiagnosisObstetric from './DiagnosisObstetric.vue'
import DiagnosisVitalSigns from './DiagnosisVitalSigns.vue'

const inputOptionsICD = ref<InstanceType<typeof InputOptions>>()

const router = useRouter()
const route = useRoute()

const roomMap = RoomService.roomMap
const currentRoom = ref<Room>(Room.blank())

watch(
  () => route.params.roomId,
  async (newValue) => {
    const roomId = Number(newValue) || 0
    await RoomService.getMap()
    currentRoom.value = roomMap.value[roomId]
    if (!currentRoom.value) {
      currentRoom.value = Room.blank()
      currentRoom.value.isCommon = 1
      currentRoom.value.roomType = RoomType.Ticket
    }
  },
  { immediate: true },
)

const { userPermission, organization, user } = MeService
const settingStore = useSettingStore()

const note = ref<string>('')
const imageUploadMultipleRef = ref<InstanceType<typeof ImageUploadCloudinary>>()

const ticketAttributeOriginMap: { [P in TicketAttributeKeyGeneralType]?: any } = {}
const ticketAttributeMap = ref<{ [P in TicketAttributeKeyType]?: any }>({
  healthHistory: '',
  summary: '',
})

const icdOptions = ref<ItemOption[]>([])

const saveLoading = ref(false)
const hasChangeImage = ref(false)
const loadingImage = ref(false)

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
      // if (!TicketAttributeKeyList.includes(i.key as any)) return
      const k = i.key as unknown as TicketAttributeKeyGeneralType
      if (i.value === ticketAttributeOriginMap[k]) return
      ticketAttributeOriginMap[k] = i.value
      ticketAttributeMap.value[k] = i.value
    })
  },
  { immediate: true, deep: true },
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
  const customerHealthHistory = ticketRoomRef.value.customer?.healthHistory || ''
  const hasChange = customerHealthHistory != ticketAttributeMap.value.healthHistory
  return hasChange
})

const hasChangeAttribute = computed(() => {
  let hasChange = false
  Object.entries(ticketAttributeMap.value).forEach(([key, value]) => {
    const k = key as unknown as TicketAttributeKeyType
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
    const imgData = imageUploadMultipleRef.value?.getData() || {
      filesPosition: [],
      imageIdListKeep: [],
      files: [],
      imageUrls: [],
      imageIdWaitList: [],
    }

    let ticketAttributeChangeList = undefined
    if (hasChangeAttribute.value) {
      ticketAttributeChangeList = Object.entries(ticketAttributeMap.value)
        .map(([key, value]) => ({ key, value }))
        .filter((i) => !!i.value)
    }

    await Promise.all([
      TicketChangeAttributeApi.updateDiagnosis({
        ticketId: ticketRoomRef.value.id,
        note: note.value,
        imagesChange: hasChangeImage.value
          ? {
              files: imgData.files,
              imageIdWaitList: imgData.imageIdWaitList,
              externalUrlList: imgData.imageUrls,
            }
          : undefined,
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
        <DiagnosisVitalSigns :ticketAttributeMap="ticketAttributeMap" />
      </div>
    </div>
    <div v-if="currentRoom.roomStyle === RoomTicketStyle.TicketClinicObstetric" class="mt-4">
      <DiagnosisObstetric :ticketAttributeMap="ticketAttributeMap" />
    </div>

    <div v-if="currentRoom.roomStyle === RoomTicketStyle.TicketClinicEye" class="mt-4">
      <DiagnosisEye :ticketAttributeMap="ticketAttributeMap" />
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
