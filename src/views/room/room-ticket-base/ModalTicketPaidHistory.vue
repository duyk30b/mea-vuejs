<!-- eslint-disable vue/no-mutating-props -->
<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { Ticket } from '@/modules/ticket'
import { nextTick, ref } from 'vue'
import TableTicketPaidHistory from './TableTicketPaidHistory.vue'
import { ESFunction } from '@/utils'

const tableTicketPaidHistory = ref<InstanceType<typeof TableTicketPaidHistory>>()

const ticket = ref(Ticket.blank())

const showModal = ref(false)

const openModal = async (options: { ticket: Ticket }) => {
  showModal.value = true
  ticket.value = Ticket.basic(options.ticket)

  nextTick(async () => {
    await tableTicketPaidHistory.value?.startFetchData()
  })
}

const closeModal = () => {
  showModal.value = false
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 800px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Thông tin thanh toán</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <TableTicketPaidHistory ref="tableTicketPaidHistory" :ticket="ticket" />
      </div>

      <div class="mt-4 pb-4 flex justify-center gap-4">
        <VueButton type="button" @click="closeModal" icon="close">Đóng lại</VueButton>
      </div>
    </div>
  </VueModal>
</template>
