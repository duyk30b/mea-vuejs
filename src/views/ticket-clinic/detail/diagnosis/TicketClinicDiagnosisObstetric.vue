<script lang="ts" setup>
import ImageUploadCloudinary from '@/common/image-upload/ImageUploadCloudinary.vue'
import { ticketRoomRef } from '@/modules/room'
import { TicketClinicApi } from '@/modules/ticket-clinic/ticket-clinic.api'
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '@/common/VueButton.vue'
import VueTinyMCE from '@/common/VueTinyMCE.vue'
import { InputDate, InputNumber, InputText } from '@/common/vue-form'
import { MeService } from '@/modules/_me/me.service'
import { CustomerService } from '@/modules/customer'
import { PermissionId } from '@/modules/permission/permission.enum'
import {
  TicketAttributeKeyObstetricList,
  type TicketAttributeKeyObstetricType,
} from '@/modules/ticket-attribute'
import { ESImage } from '@/utils'

const { userPermission, organization } = MeService

const note = ref<string>('')
const imageUploadMultipleRef = ref<InstanceType<typeof ImageUploadCloudinary>>()

const ticketAttributeOriginMap: { [P in TicketAttributeKeyObstetricType]?: any } = {}
const ticketAttributeMap = ref<
  { [P in TicketAttributeKeyObstetricType]?: any } & { healthHistory: string; body: string }
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
      if (!TicketAttributeKeyObstetricList.includes(i.key as any)) return
      const k = i.key as unknown as TicketAttributeKeyObstetricType
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
    const k = key as unknown as TicketAttributeKeyObstetricType
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
    const { filesPosition, imageIdsKeep, files, imageUrls, imageIdsWait } =
      imageUploadMultipleRef.value?.getData() || {
        filesPosition: [],
        imageIdsWait: [],
        imageIdsKeep: [],
        files: [],
        imageUrls: [],
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
        imagesChange: hasChangeImage.value
          ? { files, imageIdsWait, externalUrlList: imageUrls }
          : undefined,
        ticketAttributeChangeList,
        ticketAttributeKeyList: TicketAttributeKeyObstetricList as any,
      }),
      hasChangeCustomer.value
        ? CustomerService.updateOne(ticketRoomRef.value.customerId, {
            healthHistory: ticketAttributeMap.value.healthHistory,
          })
        : undefined,
    ])
  } catch (error) {
    console.log('🚀 ~ TicketClinicDiagnosisObstetricBasic.vue:115 ~ saveTicketDiagnosis:', error)
  } finally {
    saveLoading.value = false
  }
}

const updateDuKienSinh = (value: any) => {
  if (!value) {
    ticketAttributeMap.value.TuoiThai_Tuan = undefined
    ticketAttributeMap.value.TuoiThai_Ngay = undefined
    return
  }

  const toDay = new Date()
  toDay.setHours(0, 0, 0, 0)
  const DuKienSinh = new Date(value)
  DuKienSinh.setHours(0, 0, 0, 0)

  const timeDuKienSinh = DuKienSinh.getTime()
  const timeNgayThuThai = timeDuKienSinh - 40 * 7 * 24 * 60 * 60 * 1000

  const timeDistance = toDay.getTime() - timeNgayThuThai
  if (timeDistance < 0) {
    ticketAttributeMap.value.TuoiThai_Tuan = 0
    ticketAttributeMap.value.TuoiThai_Ngay = 0
    return
  }
  const dayTime = 24 * 60 * 60 * 1000
  const weekTime = 7 * dayTime
  ticketAttributeMap.value.TuoiThai_Tuan = Math.floor(timeDistance / weekTime)
  ticketAttributeMap.value.TuoiThai_Ngay = Math.floor(Math.floor(timeDistance % weekTime) / dayTime)
}

const updateTuoiThaiTuan = (value: number) => {
  const Tuan = value || 0
  const Ngay = ticketAttributeMap.value.TuoiThai_Ngay || 0
  const timeDistance = (Tuan * 7 + Ngay) * 24 * 60 * 60 * 1000

  const toDay = new Date()
  toDay.setHours(0, 0, 0, 0)
  const timeNgayThuThai = toDay.getTime() - timeDistance
  const timeDuKienSinh = timeNgayThuThai + 40 * 7 * 24 * 60 * 60 * 1000

  ticketAttributeMap.value.NgayDuKienSinh = new Date(timeDuKienSinh).toISOString()
}
const updateTuoiThaiNgay = (value: number) => {
  const Tuan = ticketAttributeMap.value.TuoiThai_Tuan || 0
  const Ngay = value || 0
  const timeDistance = (Tuan * 7 + Ngay) * 24 * 60 * 60 * 1000

  const toDay = new Date()
  toDay.setHours(0, 0, 0, 0)
  const timeNgayThuThai = toDay.getTime() - timeDistance
  const timeDuKienSinh = timeNgayThuThai + 40 * 7 * 24 * 60 * 60 * 1000

  ticketAttributeMap.value.NgayDuKienSinh = new Date(timeDuKienSinh).toISOString()
}

const updateTuoiPhoi = (TuoiPhoi: number) => {
  if (!TuoiPhoi) return
  const NgayChuyenPhoiString = ticketAttributeMap.value.NgayChuyenPhoi
  if (!NgayChuyenPhoiString) return
  const NgayChuyenPhoi = new Date(NgayChuyenPhoiString)
  NgayChuyenPhoi.setHours(0, 0, 0, 0)

  const timeNgayThuThai = NgayChuyenPhoi.getTime() - (TuoiPhoi + 14) * 24 * 60 * 60 * 1000
  const timeDuKienSinh = timeNgayThuThai + 40 * 7 * 24 * 60 * 60 * 1000

  ticketAttributeMap.value.NgayDuKienSinh = new Date(timeDuKienSinh).toISOString()
  updateDuKienSinh(timeDuKienSinh)
}

const updateNgayChuyenPhoi = (NgayChuyenPhoiString: any) => {
  if (!NgayChuyenPhoiString) return
  const TuoiPhoi = Number(ticketAttributeMap.value.TuoiPhoi)
  if (!TuoiPhoi) return
  const NgayChuyenPhoi = new Date(NgayChuyenPhoiString)
  NgayChuyenPhoi.setHours(0, 0, 0, 0)

  const timeNgayThuThai = NgayChuyenPhoi.getTime() - (TuoiPhoi + 14) * 24 * 60 * 60 * 1000
  const timeDuKienSinh = timeNgayThuThai + 40 * 7 * 24 * 60 * 60 * 1000

  ticketAttributeMap.value.NgayDuKienSinh = new Date(timeDuKienSinh).toISOString()
  updateDuKienSinh(timeDuKienSinh)
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
      <div style="flex: 1 1 300px; min-width: 300px">
        <div>Tiền sử</div>
        <div style="height: 150px">
          <VueTinyMCE v-model="ticketAttributeMap.healthHistory" />
        </div>
      </div>
      <div class="" style="flex: 1 1 300px; min-width: 300px">
        <div>Toàn thân</div>
        <div style="height: 150px">
          <VueTinyMCE v-model="ticketAttributeMap.body" />
        </div>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-4">
      <div style="flex-basis: 400px; flex-grow: 4">
        <div class="flex flex-wrap items-center gap-4 justify-end">
          <div style="flex-basis: 60px">Cơ bản:</div>
          <div style="flex-grow: 2">
            <div style="">PARA</div>
            <div><InputText v-model:value="ticketAttributeMap.PARA" /></div>
          </div>
          <div style="flex-basis: 200px; flex-grow: 1">
            <div style="">Ngày đầu - KKC:</div>
            <div>
              <InputDate v-model:value="ticketAttributeMap.NgayDauKyKinhCuoi" typeParser="string" />
            </div>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-4 justify-end">
          <div style="flex-basis: 60px">IVF:</div>
          <div style="flex-grow: 2">
            <div style="">Tuổi phôi (ngày)</div>
            <div>
              <InputNumber
                v-model:value="ticketAttributeMap.TuoiPhoi"
                @update:value="updateTuoiPhoi"
              />
            </div>
          </div>
          <div style="flex-basis: 200px; flex-grow: 1">
            <div style="">Ngày chuyển phôi</div>
            <div>
              <InputDate
                v-model:value="ticketAttributeMap.NgayChuyenPhoi"
                typeParser="string"
                @update:value="updateNgayChuyenPhoi"
              />
            </div>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-4 justify-end">
          <div style="flex-basis: 60px">Tuổi thai:</div>
          <div style="flex-basis: 100px; flex-grow: 1">
            <div style="">Tuần</div>
            <div>
              <InputNumber
                v-model:value="ticketAttributeMap.TuoiThai_Tuan"
                @update:value="updateTuoiThaiTuan"
              />
            </div>
          </div>
          <div style="flex-basis: 100px; flex-grow: 1">
            <div style="">Ngày</div>
            <div>
              <InputNumber
                v-model:value="ticketAttributeMap.TuoiThai_Ngay"
                @update:value="updateTuoiThaiNgay"
              />
            </div>
          </div>
          <div style="flex-basis: 200px; flex-grow: 1">
            <div style="">Dự kiến sinh</div>
            <div>
              <InputDate
                v-model:value="ticketAttributeMap.NgayDuKienSinh"
                typeParser="string"
                @update:value="updateDuKienSinh"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="flex flex-col" style="flex-basis: 200px; flex-grow: 1">
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
    <div v-if="ticketRoomRef.id" class="mt-4">
      <div>Hình ảnh</div>
      <ImageUploadCloudinary
        ref="imageUploadMultipleRef"
        :oid="organization.id"
        :customerId="ticketRoomRef.customerId"
        :height="100"
        :rootImageList="
          (ticketRoomRef?.imageList || []).map((i) => ({
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
.table-vital-signs {
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
