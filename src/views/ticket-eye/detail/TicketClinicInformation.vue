<script lang="ts" setup>
import { IdcardOutlined, PhoneOutlined, WarningOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClock, IconDollar, IconFileSearch, IconSend } from '../../../common/icon'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PaymentViewType } from '../../../modules/enum'
import { TicketStatus } from '../../../modules/ticket'
import { DTimer } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import TicketEyeDeliveryStatusTag from '../TicketEyeDeliveryStatusTag.vue'
import TicketEyeStatusTag from '../TicketEyeStatusTag.vue'
import ModalTicketClinicPayment from './modal/ModalTicketClinicPayment.vue'
import ModalTicketClinicRegisterAppointment from './modal/ModalTicketClinicRegisterAppointment.vue'
import { ticketClinic } from './ticket-clinic-detail.ref'
import { Appointment } from '../../../modules/appointment'

const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalTicketClinicRegisterAppointment =
  ref<InstanceType<typeof ModalTicketClinicRegisterAppointment>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const updateCustomer = () => {}

const handleClickModalRegisterAppointment = () => {
  let toAppointment
  if (ticketClinic.value.toAppointment) {
    toAppointment = Appointment.from(ticketClinic.value.toAppointment)
  } else {
    toAppointment = Appointment.blank()
    toAppointment.fromTicketId = ticketClinic.value.id
    toAppointment.customerId = ticketClinic.value.customerId

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
        <span class="ml-4">{{ ticketClinic.customer?.fullName }}</span>
        <a class="ml-2" @click="modalCustomerDetail?.openModal(ticketClinic.customer!)">
          <IconFileSearch />
        </a>
      </div>
      <div>
        {{ ticketClinic.customer?.gender === 0 ? 'Nữ' : ' ' }}
        {{ ticketClinic.customer?.gender === 1 ? 'Nam' : ' ' }}
        <span class="ml-2">
          {{ DTimer.timeToText(ticketClinic.customer?.birthday, 'DD/MM/YYYY') }}
        </span>
      </div>
    </div>
    <div class="mt-2 flex justify-between">
      <div class="">
        <PhoneOutlined />
        <span class="ml-4">{{ ticketClinic.customer?.phone }}</span>
      </div>
      <div>{{ ticketClinic.customer?.addressString }}</div>
    </div>
    <div class="mt-2">
      <WarningOutlined />
      <span class="ml-4">{{ ticketClinic.ticketDiagnosis?.diagnosis }}</span>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconClock />
        <div>{{ DTimer.timeToText(ticketClinic.startedAt, 'hh:mm DD/MM/YYYY') }}</div>
      </div>
      <div>
        <TicketEyeStatusTag :ticketStatus="ticketClinic.ticketStatus" />
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
              ].includes(ticketClinic.ticketStatus)
            "
            size="small"
            color="green"
            icon="dollar"
            @click="modalTicketClinicPayment?.openModal(PaymentViewType.Prepayment)">
            <span class="font-bold">TẠM ỨNG</span>
          </VueButton>
          <VueButton
            v-if="[TicketStatus.Debt].includes(ticketClinic.ticketStatus)"
            size="small"
            color="green"
            icon="dollar"
            @click="modalTicketClinicPayment?.openModal(PaymentViewType.PayDebt)">
            <span class="font-bold">TRẢ NỢ</span>
          </VueButton>
          <VueButton
            v-if="
              [TicketStatus.Completed, TicketStatus.Cancelled].includes(ticketClinic.ticketStatus)
            "
            size="small"
            color="green"
            icon="dollar"
            @click="modalTicketClinicPayment?.openModal(PaymentViewType.Success)">
            <span class="font-bold">THANH TOÁN</span>
          </VueButton>
        </div>
        <span class="ml-4">
          {{ formatMoney(ticketClinic.paid) }} / {{ formatMoney(ticketClinic.totalMoney) }}
        </span>
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconDollar />
        <div v-if="ticketClinic.totalMoney >= ticketClinic.paid">Còn thiếu :</div>
        <div v-else>Tiền thừa :</div>
      </div>
      <div
        class="text-lg"
        :class="ticketClinic.paid < ticketClinic.totalMoney ? 'text-red-500 font-bold' : ''">
        {{ formatMoney(Math.abs(ticketClinic.totalMoney - ticketClinic.paid)) }}
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconSend />
        <div>Lấy thuốc :</div>
      </div>
      <div>
        <TicketEyeDeliveryStatusTag :deliveryStatus="ticketClinic.deliveryStatus" />
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconClock />
        <div>Hẹn khám :</div>
      </div>
      <div v-if="!ticketClinic.toAppointment">
        <VueButton size="small" color="blue" @click="handleClickModalRegisterAppointment">
          Tạo lịch hẹn
        </VueButton>
      </div>
      <div v-else class="flex gap-2 items-center flex-wrap">
        <VueButton size="small" @click="handleClickModalRegisterAppointment">Sửa</VueButton>
        {{ DTimer.timeToText(ticketClinic.toAppointment.registeredAt, 'hh:mm DD/MM/YYYY') }}
      </div>
    </div>
  </div>
</template>
<script lang="scss" scope></script>
