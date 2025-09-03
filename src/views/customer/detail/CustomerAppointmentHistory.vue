<script setup lang="ts">
import VuePagination from '@/common/VuePagination.vue'
import { IconDelete } from '@/common/icon-antd'
import { InputSelect } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Appointment, AppointmentApi, AppointmentStatus } from '@/modules/appointment'
import { ESTimer } from '@/utils'
import AppointmentStatusTag from '@/views/room/appointment/AppointmentStatusTag.vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{ customerId: number }>(), {
  customerId: 0,
})
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const appointmentList = ref<Appointment[]>([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const paginationResponse = await AppointmentApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: { customerId: props.customerId },
      relation: { customer: false },
      sort: { registeredAt: 'DESC' },
    })
    appointmentList.value = paginationResponse.appointmentList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerInvoicesHistory.vue:43 ~ error:', error)
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
  }
  await startFetchData()
}

watch(
  () => props.customerId,
  async (newValue) => {
    if (newValue) await startFetchData()
    else appointmentList.value = []
  },
  { immediate: true },
)

const handleClickDeleteAppointment = async (appointmentId: number) => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa lịch hẹn này ?',
    content: 'Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    onOk: async () => {
      try {
        await AppointmentApi.delete(appointmentId)
        await startFetchData()
      } catch (error) {
        console.log('🚀 ~ file: AppointmentList.vue:168 ~ onOk: ~ error:', error)
      }
    },
  })
}
</script>

<template>
  <div class="mt-4">
    <div v-if="isMobile" class="mt-4 w-full table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Lý do</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="appointmentList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(appointment, index) in appointmentList" :key="index">
            <td>
              <div>HK{{ appointment.id }}</div>
              <div>
                <AppointmentStatusTag :status="appointment.status" />
              </div>
              <div style="white-space: nowrap; font-size: 0.9em">
                {{ ESTimer.timeToText(appointment.registeredAt, 'DD/MM/YYYY hh:mm') }}
              </div>
            </td>
            <td>{{ appointment.reason }}</td>
            <td class="text-center">
              <a
                v-if="
                  [
                    AppointmentStatus.Waiting,
                    AppointmentStatus.Confirm,
                    AppointmentStatus.Cancelled,
                  ].includes(appointment.status)
                "
                class="text-red-500"
                @click="handleClickDeleteAppointment(appointment.id)"
              >
                <IconDelete width="18" height="18" />
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!isMobile" class="mt-4 w-full table-wrapper">
      <table>
        <thead>
          <tr>
            <th style="width: 100px">#</th>
            <th>Trạng thái</th>
            <th>Thời gian</th>
            <th>Lý do</th>
            <th style="width: 100px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="appointmentList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(appointment, index) in appointmentList" :key="index">
            <td class="text-center">HK{{ appointment.id }}</td>
            <td style="width: 200px">
              <div class="flex justify-center">
                <div>
                  <AppointmentStatusTag :status="appointment.status" />
                </div>
              </div>
            </td>
            <td class="text-center" style="width: 200px">
              {{ ESTimer.timeToText(appointment.registeredAt, 'DD/MM/YYYY hh:mm') }}
            </td>
            <td>{{ appointment.reason }}</td>
            <td class="text-center">
              <a
                v-if="
                  [
                    AppointmentStatus.Waiting,
                    AppointmentStatus.Confirm,
                    AppointmentStatus.Cancelled,
                  ].includes(appointment.status)
                "
                class="text-red-500"
                @click="handleClickDeleteAppointment(appointment.id)"
              >
                <IconDelete width="18" height="18" />
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="p-4 flex flex-wrap justify-end gap-4">
      <VuePagination
        class="ml-auto"
        v-model:page="page"
        :total="total"
        :limit="limit"
        @update:page="(p: any) => changePagination({ page: p, limit })"
      />
      <InputSelect
        v-model:value="limit"
        @update:value="(l: any) => changePagination({ page, limit: l })"
        :options="[
          { value: 10, label: '10 / page' },
          { value: 20, label: '20 / page' },
          { value: 50, label: '50 / page' },
          { value: 100, label: '100 / page' },
        ]"
      />
    </div>
  </div>
</template>
