<script lang="ts" setup>
import { IdcardOutlined, PhoneOutlined, WarningOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClock, IconDollar, IconFileSearch, IconSend } from '../../../common/icon'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Appointment } from '../../../modules/appointment'
import { PaymentViewType } from '../../../modules/enum'
import { TicketStatus, ticketRef } from '../../../modules/ticket'
import { DTimer } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import TicketClinicDeliveryStatusTag from '../TicketSpaDeliveryStatusTag.vue'
import TicketSpaStatusTag from '../TicketSpaStatusTag.vue'
import ModalTicketClinicPayment from './modal/ModalTicketSpaPayment.vue'
import ModalTicketClinicRegisterAppointment from './modal/ModalTicketSpaRegisterAppointment.vue'

const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalTicketClinicRegisterAppointment =
  ref<InstanceType<typeof ModalTicketClinicRegisterAppointment>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const updateCustomer = () => {}

const handleClickModalRegisterAppointment = () => {
  let toAppointment
  if (ticketRef.value.toAppointment) {
    toAppointment = Appointment.from(ticketRef.value.toAppointment)
  } else {
    toAppointment = Appointment.blank()
    toAppointment.fromTicketId = ticketRef.value.id
    toAppointment.customerId = ticketRef.value.customerId

    const time = new Date()
    time.setMinutes(0, 0)
    time.setDate(time.getDate() + 7)
    toAppointment.registeredAt = time.getTime()
  }

  modalTicketClinicRegisterAppointment.value?.openModal(toAppointment)
}
</script>
<template>
  <ModalTicketClinicPayment ref="modalTicketClinicPayment" />
  <ModalTicketClinicRegisterAppointment ref="modalTicketClinicRegisterAppointment" />
  <ModalCustomerDetail ref="modalCustomerDetail" @update_customer="updateCustomer" />
  <div class="bg-white p-4">
    <div class="flex justify-between">
      <div class="uppercase font-medium">
        <IdcardOutlined />
        <span class="ml-4">{{ ticketRef.customer?.fullName }}</span>
        <a class="ml-2" @click="modalCustomerDetail?.openModal(ticketRef.customer!)">
          <IconFileSearch />
        </a>
      </div>
      <div>
        {{ ticketRef.customer?.gender === 0 ? 'Nữ' : ' ' }}
        {{ ticketRef.customer?.gender === 1 ? 'Nam' : ' ' }}
        <span class="ml-2">
          {{ DTimer.timeToText(ticketRef.customer?.birthday, 'DD/MM/YYYY') }}
        </span>
      </div>
    </div>
    <div class="mt-2 flex justify-between">
      <div class="">
        <PhoneOutlined />
        <span class="ml-4">{{ ticketRef.customer?.phone }}</span>
      </div>
      <div>{{ ticketRef.customer?.addressString }}</div>
    </div>
    <div class="mt-2">
      <WarningOutlined />
      <span class="ml-4">{{ ticketRef.ticketDiagnosis?.diagnosis }}</span>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconClock />
        <div>{{ DTimer.timeToText(ticketRef.startedAt, 'hh:mm DD/MM/YYYY') }}</div>
      </div>
      <div>
        <TicketSpaStatusTag :ticketStatus="ticketRef.ticketStatus" />
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
              ].includes(ticketRef.ticketStatus)
            "
            size="small"
            color="green"
            icon="dollar"
            @click="modalTicketClinicPayment?.openModal(PaymentViewType.Prepayment)">
            <span class="font-bold">TẠM ỨNG</span>
          </VueButton>
          <VueButton
            v-if="[TicketStatus.Debt].includes(ticketRef.ticketStatus)"
            size="small"
            color="green"
            icon="dollar"
            @click="modalTicketClinicPayment?.openModal(PaymentViewType.PayDebt)">
            <span class="font-bold">TRẢ NỢ</span>
          </VueButton>
          <VueButton
            v-if="
              [TicketStatus.Completed, TicketStatus.Cancelled].includes(ticketRef.ticketStatus)
            "
            size="small"
            color="green"
            icon="dollar"
            @click="modalTicketClinicPayment?.openModal(PaymentViewType.Success)">
            <span class="font-bold">THANH TOÁN</span>
          </VueButton>
        </div>
        <span class="ml-4">
          {{ formatMoney(ticketRef.paid) }} / {{ formatMoney(ticketRef.totalMoney) }}
        </span>
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconDollar />
        <div v-if="ticketRef.totalMoney >= ticketRef.paid">Còn thiếu :</div>
        <div v-else>Tiền thừa :</div>
      </div>
      <div
        class="text-lg"
        :class="ticketRef.paid < ticketRef.totalMoney ? 'text-red-500 font-bold' : ''">
        {{ formatMoney(Math.abs(ticketRef.totalMoney - ticketRef.paid)) }}
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconSend />
        <div>Lấy thuốc :</div>
      </div>
      <div>
        <TicketClinicDeliveryStatusTag :deliveryStatus="ticketRef.deliveryStatus" />
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconClock />
        <div>Lịch hẹn:</div>
      </div>
      <div v-if="!ticketRef.toAppointment">
        <VueButton size="small" color="blue" @click="handleClickModalRegisterAppointment">
          Tạo lịch hẹn
        </VueButton>
      </div>
      <div v-else class="flex gap-2 items-center flex-wrap">
        <VueButton size="small" @click="handleClickModalRegisterAppointment">Sửa</VueButton>
        {{ DTimer.timeToText(ticketRef.toAppointment.registeredAt, 'hh:mm DD/MM/YYYY') }}
      </div>
    </div>
  </div>
</template>
<script lang="scss" scope></script>
