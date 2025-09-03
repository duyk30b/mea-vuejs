<script setup lang="ts">
import { IconClose } from '@/common/icon-antd'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { RadiologyService } from '@/modules/radiology'
import { TicketRadiology, TicketRadiologyApi } from '@/modules/ticket-radiology'
import { ref } from 'vue'
import TicketRadiologyFormResult from './detail/TicketRadiologyFormResult.vue'
import TicketRadiologyStatusTag from './TicketRadiologyStatusTag.vue'

const showModal = ref(false)

const ticketRadiology = ref<TicketRadiology>(TicketRadiology.blank())

const radiologyMap = RadiologyService.radiologyMap

const editable = ref(true)

const openModal = async (ticketRadiologyId: number, options?: { noEdit: boolean }) => {
  showModal.value = true
  ticketRadiology.value = await TicketRadiologyApi.detail(ticketRadiologyId, {
    relation: { imageList: true, ticketUserRequestList: true, ticket: true, customer: true },
  })
  editable.value = !options?.noEdit
}

const openModalByData = async (data: { ticketRadiology: TicketRadiology; noEdit?: boolean }) => {
  showModal.value = true
  ticketRadiology.value = TicketRadiology.from(data.ticketRadiology)
  editable.value = !data.noEdit
}

const closeModal = () => {
  showModal.value = false
  ticketRadiology.value = TicketRadiology.blank()
}

const cancelResultSuccess = (data: TicketRadiology) => {
  Object.assign(ticketRadiology.value, data)
}

const updateResultSuccess = () => {
  closeModal()
}

defineExpose({ openModal, openModalByData })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 1200px" @close="closeModal">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium flex items-center gap-2">
          {{ ticketRadiology.customer?.fullName }} -
          {{ radiologyMap[ticketRadiology.radiologyId]?.name }}
          <TicketRadiologyStatusTag :status="ticketRadiology.status" />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <TicketRadiologyFormResult
        :ticketRadiologyProp="ticketRadiology"
        :editable="editable"
        @cancelResultSuccess="cancelResultSuccess"
        @updateResultSuccess="updateResultSuccess"
      />
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
