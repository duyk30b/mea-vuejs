<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IconTrash } from '../../../common/icon'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { Appointment, AppointmentApi, AppointmentStatus } from '../../../modules/appointment'
import { Customer } from '../../../modules/customer'
import { DTimer, formatPhone } from '../../../utils'
import AppointmentStatusTag from '../../appointment/AppointmentStatusTag.vue'

const props = withDefaults(defineProps<{ customer: Customer }>(), {
  customer: () => Customer.blank(),
})
const router = useRouter()

const meStore = useMeStore()
const { permissionIdMap } = meStore

const appointmentList = ref<Appointment[]>([])
const page = ref(1)
const limit = ref(
  Number(localStorage.getItem('CUSTOMER_APPOINTMENT_HISTORY_PAGINATION_LIMIT')) || 10
)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await AppointmentApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: { customerId: props.customer.id! },
      relation: { customer: false },
      sort: { registeredAt: 'DESC' },
    })
    appointmentList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerInvoicesHistory.vue:43 ~ error:', error)
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('CUSTOMER_APPOINTMENT_HISTORY_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

watch(
  () => props.customer.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else appointmentList.value = []
  },
  { immediate: true }
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
    <div class="flex flex-wrap items-center gap-2">
      <span>
        KH:
        <b>{{ customer.fullName }}</b>
      </span>
      <span>
        <a :href="'tel:' + customer.phone">{{ formatPhone(customer.phone || '') }}</a>
      </span>
    </div>
    <div class="mt-4 w-full table-wrapper">
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
                  <AppointmentStatusTag :appointmentStatus="appointment.appointmentStatus" />
                </div>
              </div>
            </td>
            <td class="text-center" style="width: 200px">
              {{ DTimer.timeToText(appointment.registeredAt, 'DD/MM/YYYY hh:mm') }}
            </td>
            <td>{{ appointment.reason }}</td>
            <td class="text-center">
              <a
                v-if="
                  [
                    AppointmentStatus.Waiting,
                    AppointmentStatus.Confirm,
                    AppointmentStatus.Cancelled,
                  ].includes(appointment.appointmentStatus)
                "
                class="text-red-500"
                @click="handleClickDeleteAppointment(appointment.id)">
                <IconTrash width="18" height="18" />
              </a>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 float-right mb-2">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          :total="total"
          show-size-changer
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
    </div>
  </div>
</template>
