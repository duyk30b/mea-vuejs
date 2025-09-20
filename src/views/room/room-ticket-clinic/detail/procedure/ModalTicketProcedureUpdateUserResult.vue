<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { PositionType } from '@/modules/position'
import { TicketProcedure, TicketProcedureStatus } from '@/modules/ticket-procedure'
import { TicketUser } from '@/modules/ticket-user'
import { TicketChangeProcedureApi } from '@/modules/ticket/api/ticket-change-procedure.api'
import TicketChangeTicketUserPosition from '@/views/room/room-user/TicketChangeTicketUserPosition.vue'
import { computed, ref } from 'vue'

const ticketChangeTicketUserPosition = ref<InstanceType<typeof TicketChangeTicketUserPosition>>()

const emit = defineEmits<{
  (e: 'success', data: TicketProcedure): void
}>()

let ticketProcedureOrigin = TicketProcedure.blank()
const ticketProcedure = ref<TicketProcedure>(TicketProcedure.blank())

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (data: { ticketProcedure: TicketProcedure }) => {
  ticketProcedureOrigin = data.ticketProcedure
  ticketProcedure.value = TicketProcedure.from(data.ticketProcedure)

  showModal.value = true
}

const hasChangeData = computed(() => {
  return !TicketUser.equalList(
    ticketProcedureOrigin.ticketUserResultList || [],
    ticketProcedure.value.ticketUserResultList || [],
  )
})

const closeModal = () => {
  showModal.value = false
  ticketProcedure.value = TicketProcedure.blank()
  ticketProcedureOrigin = TicketProcedure.blank()
}

const handleSave = async () => {
  if (!ticketProcedure.value.ticketId) {
    AlertStore.addError('Lỗi: Cần thực hiện dịch vụ trước')
    return
  }

  try {
    if (ticketProcedure.value.id) {
      const ticketProcedureResponse =
        await TicketChangeProcedureApi.updateUserResultTicketProcedure({
          ticketId: ticketProcedure.value.ticketId,
          ticketProcedureId: ticketProcedure.value.id,
          ticketUserResultList: ticketProcedure.value.ticketUserResultList || [],
        })
      Object.assign(ticketProcedure.value, ticketProcedureResponse)
    }
    emit('success', ticketProcedure.value)
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalTicketProcedureUpdateUser.vue:58 ~ handleSave ~ error:', error)
  }
}

const handleFixTicketUserResultList = (tuListData: TicketUser[]) => {
  ticketProcedureOrigin.ticketUserResultList = TicketUser.fromList(tuListData)
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ ticketProcedure.procedure?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 gap-4" @submit.prevent="(e) => handleSave()">
        <div>
          <TicketChangeTicketUserPosition
            ref="ticketChangeTicketUserPosition"
            v-model:ticketUserList="ticketProcedure.ticketUserResultList!"
            :positionType="PositionType.ProcedureResult"
            :positionInteractId="ticketProcedure.procedureId"
            @fix:ticketUserList="handleFixTicketUserResultList"
            title="Nhân viên thực hiện dịch vụ"
          />
        </div>

        <div style="flex-grow: 1; flex-basis: 80%" class="mt-6 flex gap-4">
          <VueButton style="margin-left: auto" type="reset" icon="close" @click="closeModal">
            Đóng lại
          </VueButton>
          <VueButton
            :disabled="!hasChangeData"
            :loading="saveLoading"
            color="blue"
            type="submit"
            icon="save"
          >
            Cập nhật
          </VueButton>
        </div>
      </form>
    </div>
  </VueModal>
</template>
<style lang="scss" scope></style>
