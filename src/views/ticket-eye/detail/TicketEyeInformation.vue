<script lang="ts" setup>
import { IdcardOutlined, PhoneOutlined, WarningOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClock, IconDollar, IconFileSearch, IconSend } from '../../../common/icon'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Appointment } from '../../../modules/appointment'
import { PaymentViewType } from '../../../modules/enum'
import { TicketStatus } from '../../../modules/ticket'
import { ticketEyeRef } from '../../../modules/ticket-eye'
import { DTimer } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import TicketEyeDeliveryStatusTag from '../TicketEyeDeliveryStatusTag.vue'
import TicketEyeStatusTag from '../TicketEyeStatusTag.vue'
import ModalTicketEyePayment from './modal/ModalTicketEyePayment.vue'
import ModalTicketEyeRegisterAppointment from './modal/ModalTicketEyeRegisterAppointment.vue'

const modalTicketEyePayment = ref<InstanceType<typeof ModalTicketEyePayment>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalTicketEyeRegisterAppointment =
  ref<InstanceType<typeof ModalTicketEyeRegisterAppointment>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const updateCustomer = () => {}

const handleClickModalRegisterAppointment = () => {
  let toAppointment
  if (ticketEyeRef.value.toAppointment) {
    toAppointment = Appointment.from(ticketEyeRef.value.toAppointment)
  } else {
    toAppointment = Appointment.blank()
    toAppointment.fromTicketId = ticketEyeRef.value.id
    toAppointment.customerId = ticketEyeRef.value.customerId

    const time = new Date()
    time.setMinutes(0, 0)
    time.setDate(time.getDate() + 7)
    toAppointment.registeredAt = time.getTime()
  }

  modalTicketEyeRegisterAppointment.value?.openModal(toAppointment)
}
</script>
<template>
  <ModalTicketEyePayment ref="modalTicketEyePayment" />
  <ModalTicketEyeRegisterAppointment ref="modalTicketEyeRegisterAppointment" />
  <ModalCustomerDetail ref="modalCustomerDetail" @update_customer="updateCustomer" />
  <div class="bg-white p-4">
    <div class="flex justify-between">
      <div class="uppercase font-medium">
        <IdcardOutlined />
        <span class="ml-4">{{ ticketEyeRef.customer?.fullName }}</span>
        <a class="ml-2" @click="modalCustomerDetail?.openModal(ticketEyeRef.customer!)">
          <IconFileSearch />
        </a>
      </div>
      <div>
        {{ ticketEyeRef.customer?.gender === 0 ? 'Nữ' : ' ' }}
        {{ ticketEyeRef.customer?.gender === 1 ? 'Nam' : ' ' }}
        <span class="ml-2">
          {{ DTimer.timeToText(ticketEyeRef.customer?.birthday, 'DD/MM/YYYY') }}
        </span>
      </div>
    </div>
    <div class="mt-2 flex justify-between">
      <div class="">
        <PhoneOutlined />
        <span class="ml-4">{{ ticketEyeRef.customer?.phone }}</span>
      </div>
      <div>{{ ticketEyeRef.customer?.addressString }}</div>
    </div>
    <div class="mt-2">
      <WarningOutlined />
      <span class="ml-4">{{ ticketEyeRef.ticketDiagnosis?.diagnosis }}</span>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconClock />
        <div>{{ DTimer.timeToText(ticketEyeRef.startedAt, 'hh:mm DD/MM/YYYY') }}</div>
      </div>
      <div>
        <TicketEyeStatusTag :ticketStatus="ticketEyeRef.ticketStatus" />
      </div>
    </div>
    <a-divider />
    <div class="mt-2 flex gap-4 items-center justify-between">
      <div class="flex items-center gap-4 whitespace-nowrap">
        <IconDollar />
        <div>Thanh toán :</div>
      </div>
      <div class="flex flex-wrap items-center justify-end">
        <div>
          <VueButton
            v-if="
              [
                TicketStatus.Schedule,
                TicketStatus.Draft,
                TicketStatus.Approved,
                TicketStatus.Executing,
              ].includes(ticketEyeRef.ticketStatus)
            "
            size="small"
            color="green"
            icon="dollar"
            @click="modalTicketEyePayment?.openModal(PaymentViewType.Prepayment)">
            <span class="font-bold">TẠM ỨNG</span>
          </VueButton>
          <VueButton
            v-if="[TicketStatus.Debt].includes(ticketEyeRef.ticketStatus)"
            size="small"
            color="green"
            icon="dollar"
            @click="modalTicketEyePayment?.openModal(PaymentViewType.PayDebt)">
            <span class="font-bold">TRẢ NỢ</span>
          </VueButton>
          <VueButton
            v-if="
              [TicketStatus.Completed, TicketStatus.Cancelled].includes(ticketEyeRef.ticketStatus)
            "
            size="small"
            color="green"
            icon="dollar"
            @click="modalTicketEyePayment?.openModal(PaymentViewType.Success)">
            <span class="font-bold">THANH TOÁN</span>
          </VueButton>
        </div>
        <span class="ml-4">
          {{ formatMoney(ticketEyeRef.paid) }} / {{ formatMoney(ticketEyeRef.totalMoney) }}
        </span>
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconDollar />
        <div v-if="ticketEyeRef.totalMoney >= ticketEyeRef.paid">Còn thiếu :</div>
        <div v-else>Tiền thừa :</div>
      </div>
      <div
        class="text-lg"
        :class="ticketEyeRef.paid < ticketEyeRef.totalMoney ? 'text-red-500 font-bold' : ''">
        {{ formatMoney(Math.abs(ticketEyeRef.totalMoney - ticketEyeRef.paid)) }}
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconSend />
        <div>Lấy thuốc :</div>
      </div>
      <div>
        <TicketEyeDeliveryStatusTag :deliveryStatus="ticketEyeRef.deliveryStatus" />
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconClock />
        <div>Hẹn khám :</div>
      </div>
      <div v-if="!ticketEyeRef.toAppointment">
        <VueButton size="small" color="blue" @click="handleClickModalRegisterAppointment">
          Tạo lịch hẹn
        </VueButton>
      </div>
      <div v-else class="flex gap-2 items-center flex-wrap">
        <VueButton size="small" @click="handleClickModalRegisterAppointment">Sửa</VueButton>
        {{ DTimer.timeToText(ticketEyeRef.toAppointment.registeredAt, 'hh:mm DD/MM/YYYY') }}
      </div>
    </div>
  </div>
</template>
