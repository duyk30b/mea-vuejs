<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { InputDate, InputHint } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { Appointment, AppointmentApi } from '@/modules/appointment'
import { customFilter } from '@/utils'
import { ticketRoomRef } from '@/modules/room'

const appointmentRegisterForm = ref<InstanceType<typeof HTMLFormElement>>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const showModal = ref(false)
const saveLoading = ref(false)

const appointment = ref<Appointment>(Appointment.blank())

const openModal = async (appointmentProp: Appointment) => {
  showModal.value = true
  appointment.value = Appointment.from(appointmentProp)
}

const closeModal = () => {
  showModal.value = false
  appointment.value = Appointment.blank()
}

const handleRegisterVisit = async () => {
  saveLoading.value = true
  appointment.value.customerSourceId = 0
  try {
    if (!appointment.value.id) {
      ticketRoomRef.value.toAppointment = await AppointmentApi.createOne({
        appointment: appointment.value,
      })
    } else {
      ticketRoomRef.value.toAppointment = await AppointmentApi.updateOne(appointment.value.id, {
        appointment: appointment.value,
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
            <InputDate v-model:value="appointment.registeredAt" show-time type-parser="number" />
          </div>
        </div>

        <div style="flex-basis: 80%; flex-grow: 1">
          <div>Lý do hẹn</div>
          <div>
            <InputHint
              v-model:value="appointment.reason"
              :options="['Khám lại']"
              :logic-filter="(item: string, text: string) => customFilter(item, text)"
            />
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
