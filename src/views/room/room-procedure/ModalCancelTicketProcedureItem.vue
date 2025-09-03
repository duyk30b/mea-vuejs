<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { TicketChangeProcedureApi } from '@/modules/ticket'
import { TicketProcedure } from '@/modules/ticket-procedure'
import { TicketProcedureItem } from '@/modules/ticket-procedure/ticket-procedure-item.model'
import { ref } from 'vue'

const appointmentRegisterSuccessForm = ref<InstanceType<typeof HTMLFormElement>>()

const emit = defineEmits<{
  (e: 'success', value: TicketProcedure): void
}>()

const ticketProcedure = ref<TicketProcedure>(TicketProcedure.blank())
const ticketProcedureItem = ref<TicketProcedureItem>(TicketProcedureItem.blank())

const cancelReason = ref('')

const saveLoading = ref(false)
const showModal = ref(false)

const openModal = async (data: {
  ticketProcedure: TicketProcedure
  ticketProcedureItem: TicketProcedureItem
}) => {
  showModal.value = true
  ticketProcedure.value = TicketProcedure.from(data.ticketProcedure)
  ticketProcedureItem.value = TicketProcedureItem.from(data.ticketProcedureItem)
}

const closeModal = () => {
  cancelReason.value = ''
  showModal.value = false
}

const handleSubmit = async () => {
  try {
    saveLoading.value = true
    const ticketProcedureResponse = await TicketChangeProcedureApi.cancelTicketProcedureItem({
      ticketId: ticketProcedure.value.ticketId,
      ticketProcedureId: ticketProcedure.value.id,
      ticketProcedureItemId: ticketProcedureItem.value.id,
      cancelReason: cancelReason.value,
    })
    emit('success', ticketProcedureResponse)
    saveLoading.value = false
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalCancelTicketProcedureItem.vue:59 ~ handleSubmit ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 200px; width: 600px">
    <form ref="appointmentRegisterSuccessForm" class="bg-white pb-2" @submit.prevent="handleSubmit">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Khách hàng KHÔNG đến theo hẹn ?</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 gap-4">
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Lý do hủy</div>
          <div>
            <InputText v-model:value="cancelReason" />
          </div>
        </div>
      </div>

      <div class="p-4 mt-4">
        <div class="flex flex-wrap gap-4 justify-end">
          <VueButton class="btn btn-blue" icon="save" type="submit" :loading="saveLoading">
            XÁC NHẬN HỦY HẸN
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss"></style>
