<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { InputDate } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Appointment, AppointmentApi } from '@/modules/appointment'
import { RoomInteractType, RoomService } from '@/modules/room'
import InputSelectRoom from '@/views/component/InputSelectRoom.vue'
import { ref } from 'vue'

const appointmentRegisterSuccessForm = ref<InstanceType<typeof HTMLFormElement>>()

const emit = defineEmits<{
  (e: 'success'): void
}>()
const settingStore = useSettingStore()
const registeredAt = ref<number>(Date.now())
const roomId = ref(0)
const saveLoading = ref(false)
const showModal = ref(false)

const appointment = ref<Appointment>(Appointment.blank())

const openModal = async (appointmentProp: Appointment) => {
  showModal.value = true
  appointment.value = Appointment.from(appointmentProp)
  registeredAt.value = Date.now()

  const roomList = await RoomService.list({ filter: { roomInteractType: RoomInteractType.Ticket } })
  roomId.value = roomList[0].id
}

const closeModal = () => {
  appointment.value = Appointment.blank()
  registeredAt.value = Date.now()
  showModal.value = false
}

const handleRegisterTicketClinic = async () => {
  saveLoading.value = true
  try {
    await AppointmentApi.registerTicketClinic(appointment.value.id, {
      registeredAt: registeredAt.value,
      roomId: roomId.value,
    })
    emit('success')
    saveLoading.value = false
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalAppointmentClinicSuccess.vue:41  ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 200px; width: 600px">
    <form
      ref="appointmentRegisterSuccessForm"
      class="bg-white pb-2"
      @submit.prevent="handleRegisterTicketClinic"
    >
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Khách hàng đã đến theo hẹn</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 gap-4 flex flex-wrap">
        <div style="flex-basis: 300px; flex-grow: 1">
          <div>Thời gian đăng ký</div>
          <div>
            <InputDate v-model:value="registeredAt" type-parser="number" class="w-full" show-time />
          </div>
        </div>

        <div style="flex-basis: 300px; flex-grow: 1">
          <InputSelectRoom
            label="Chọn phòng tiếp đón"
            v-model:roomId="roomId"
            :roomInteractType="RoomInteractType.Ticket"
          />
        </div>
      </div>

      <div class="p-4 mt-4">
        <div class="flex flex-wrap gap-4 justify-end">
          <VueButton class="btn btn-blue" icon="save" type="submit" :loading="saveLoading">
            ĐĂNG KÝ KHÁM
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss"></style>
