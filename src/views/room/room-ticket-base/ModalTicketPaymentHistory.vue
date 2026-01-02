<!-- eslint-disable vue/no-mutating-props -->
<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { PaymentApi, PaymentService, PaymentVoucherType } from '@/modules/payment'
import { Ticket } from '@/modules/ticket'
import TicketPaymentList from '@/views/room/room-ticket-base/TicketPaymentList.vue'
import { ref } from 'vue'

const ticket = ref(Ticket.blank())

const showModal = ref(false)

const openModal = async (options: { ticket: Ticket; refetch?: boolean }) => {
  showModal.value = true
  ticket.value = Ticket.from(options.ticket)
  if (options.refetch) {
    const paymentList = await PaymentApi.list({
      filter: {
        voucherId: ticket.value.id,
        voucherType: PaymentVoucherType.Ticket,
      },
      relation: { paymentTicketItemList: true },
      sort: { id: 'ASC' },
    })
    await PaymentService.refreshRelation(paymentList)
    ticket.value.paymentList = paymentList
  }
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
        <TicketPaymentList :ticket="ticket" />
      </div>

      <div class="mt-4 pb-4 flex justify-center gap-4">
        <VueButton type="button" @click="closeModal" icon="close">Đóng lại</VueButton>
      </div>
    </div>
  </VueModal>
</template>
