<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VueTinyMCE from '../../../common/VueTinyMCE.vue'
import ImageUploadMultiple from '../../../common/image-upload/ImageUploadMultiple.vue'
import { InputText } from '../../../common/vue-form'
import { MeService } from '../../../modules/_me/me.service'
import { CustomerService } from '../../../modules/customer'
import { ImageHost } from '../../../modules/image/image.model'
import { PermissionId } from '../../../modules/permission/permission.enum'
import {
  TicketAttributeKeyEyeList,
  type TicketAttributeKeyEyeType,
} from '../../../modules/ticket-attribute'
import { ESImage } from '../../../utils'
import { ticketRoomRef } from '@/modules/room'
import { TicketClinicApi } from '@/modules/ticket-clinic/ticket-clinic.api'

const { userPermission } = MeService

const note = ref<string>('')
const imageUploadMultipleRef = ref<InstanceType<typeof ImageUploadMultiple>>()
const ticketAttributeOriginMap: { [P in TicketAttributeKeyEyeType]?: any } = {}
const ticketAttributeMap = ref<
  { [P in TicketAttributeKeyEyeType]?: any } & { healthHistory: string; body: string }
>({
  healthHistory: '',
  body: '',
})

const saveLoading = ref(false)
const hasChangeImage = ref(false)

onMounted(async () => {})

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
      return (ticketAttributeMap.value = { healthHistory: '', body: '' })
    }
    newValue.forEach((i) => {
      if (!TicketAttributeKeyEyeList.includes(i.key as any)) return
      const k = i.key as unknown as TicketAttributeKeyEyeType
      if (i.value === ticketAttributeOriginMap[k]) return
      ticketAttributeOriginMap[k] = i.value
      ticketAttributeMap.value[k] = i.value
    })
  },
  { immediate: true, deep: true },
)

watch(
  () => ticketRoomRef.value.imageIds,
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
    const k = key as unknown as TicketAttributeKeyEyeType
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
        ticketAttributeKeyList: TicketAttributeKeyEyeList as any,
      }),
      hasChangeCustomer.value
        ? CustomerService.updateOne(ticketRoomRef.value.customerId, {
            healthHistory: ticketAttributeMap.value.healthHistory,
          })
        : undefined,
    ])
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicDiagnosisEyeBasic.vue:115 ~ saveTicketDiagnosis:', error)
  } finally {
    saveLoading.value = false
  }
}

const getDataTicketDiagnosis = () => {
  return { ticketAttributeMap: ticketAttributeMap.value }
}

defineExpose({ getDataTicketDiagnosis })
</script>
<template>
  <div>
    <div class="mt-4">
      <div>Lý do khám</div>
      <div>
        <InputText v-model:value="ticketAttributeMap.reason" />
      </div>
    </div>
    <div class="mt-4 flex flex-wrap gap-4">
      <div style="flex-basis: 300px; flex-grow: 1">
        <div>Tiền sử</div>
        <div style="height: 150px">
          <VueTinyMCE v-model="ticketAttributeMap.healthHistory" />
        </div>
      </div>
      <div style="flex-basis: 300px; flex-grow: 1">
        <div>Toàn thân</div>
        <div style="height: 150px">
          <VueTinyMCE v-model="ticketAttributeMap.body" />
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
              <td><input v-model="ticketAttributeMap.ThiLuc_MP" /></td>
              <td><input v-model="ticketAttributeMap.ThiLuc_MT" /></td>
            </tr>
            <tr>
              <td class="title">Nhãn áp</td>
              <td><input v-model="ticketAttributeMap.NhanAp_MP" /></td>
              <td><input v-model="ticketAttributeMap.NhanAp_MT" /></td>
            </tr>
            <tr>
              <td class="title">Mi mắt - kết mạc</td>
              <td><input v-model="ticketAttributeMap.MiMatKetMac_MP" /></td>
              <td><input v-model="ticketAttributeMap.MiMatKetMac_MT" /></td>
            </tr>
            <tr>
              <td class="title">Giác mạc</td>
              <td><input v-model="ticketAttributeMap.GiacMac_MP" /></td>
              <td><input v-model="ticketAttributeMap.GiacMac_MT" /></td>
            </tr>
            <tr>
              <td class="title">Tiền phòng, mống mắt</td>
              <td><input v-model="ticketAttributeMap.TienPhongMongMat_MP" /></td>
              <td><input v-model="ticketAttributeMap.TienPhongMongMat_MT" /></td>
            </tr>
            <tr>
              <td class="title">Thủy tinh thể</td>
              <td><input v-model="ticketAttributeMap.ThuyTinhThe_MP" /></td>
              <td><input v-model="ticketAttributeMap.ThuyTinhThe_MT" /></td>
            </tr>
            <tr>
              <td class="title">Đáy mắt</td>
              <td><input v-model="ticketAttributeMap.DayMat_MP" /></td>
              <td><input v-model="ticketAttributeMap.DayMat_MT" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-4">
      <div>Hình ảnh</div>
      <ImageUploadMultiple
        ref="imageUploadMultipleRef"
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
