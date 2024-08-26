<script setup lang="ts">
import dayjs, { Dayjs } from 'dayjs'
import { ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon'
import { InputHint } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { Appointment, AppointmentApi } from '../../../../modules/appointment'
import { VoucherType } from '../../../../modules/enum'
import { customFilter } from '../../../../utils'
import { ticketClinic } from '../ticket-clinic-detail.ref'

const appointmentRegisterForm = ref<InstanceType<typeof HTMLFormElement>>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const showModal = ref(false)
const saveLoading = ref(false)

const appointment = ref<Appointment>(Appointment.blank())

const now = new Date()
now.setMinutes(0, 0)
now.setDate(now.getDate() + 7)
const time = ref<Dayjs>(dayjs())

const openModal = async (appointmentProp: Appointment) => {
  showModal.value = true

  appointment.value = Appointment.from(appointmentProp)
  time.value = dayjs(new Date(appointmentProp.registeredAt))
}

const closeModal = () => {
  appointment.value = Appointment.blank()
  const now = new Date()
  now.setMinutes(0, 0)
  time.value = dayjs(now)
  showModal.value = false
}

const handleRegisterVisit = async () => {
  saveLoading.value = true
  appointment.value.registeredAt = time.value.valueOf()
  try {
    if (!appointment.value.id) {
      ticketClinic.value.toAppointment = await AppointmentApi.createOne({
        fromTicketId: appointment.value.fromTicketId,
        customerId: appointment.value.customerId,
        registeredAt: appointment.value.registeredAt,
        reason: appointment.value.reason,
        appointmentType: VoucherType.Clinic,
        appointmentStatus: appointment.value.appointmentStatus,
      })
    } else {
      ticketClinic.value.toAppointment = await AppointmentApi.updateOne(appointment.value.id, {
        customerId: appointment.value.customerId,
        registeredAt: appointment.value.registeredAt,
        reason: appointment.value.reason,
        appointmentStatus: appointment.value.appointmentStatus,
        cancelReason: '',
      })
    }
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:75 ~ handleRegisterVisit ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form ref="appointmentRegisterForm" class="bg-white pb-2" @submit.prevent="handleRegisterVisit">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Tạo lịch hẹn mới</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 gap-4 flex flex-wrap">
        <div style="flex-basis: 300px; flex-grow: 1">
          <div>Thời gian hẹn</div>
          <div>
            <a-date-picker
              v-model:value="time"
              class="w-full"
              show-time
              placeholder="Select Time"
              format="DD-MM-YYYY HH:mm" />
          </div>
        </div>

        <div style="flex-basis: 80%; flex-grow: 1">
          <div>Lý do hẹn</div>
          <div>
            <InputHint
              v-model:value="appointment.reason"
              :options="['Khám lại']"
              :logic-filter="(item: string, text: string) => customFilter(item, text)" />
          </div>
        </div>
      </div>

      <div class="p-4 mt-4">
        <div class="flex flex-wrap gap-4">
          <VueButton class="mr-auto btn" type="reset" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton class="btn btn-blue" type="submit" icon="save" :loading="saveLoading">
            <span v-if="!appointment.id">TẠO LỊCH HẸN</span>
            <span v-else>CẬP NHẬT LỊCH HẸN</span>
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss"></style>
