<script lang="ts" setup>
import {
  ClockCircleOutlined,
  DollarOutlined,
  FileSearchOutlined,
  IdcardOutlined,
  PhoneOutlined,
  SendOutlined,
  WarningOutlined,
} from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PaymentViewType } from '../../../modules/enum'
import { TicketStatus } from '../../../modules/ticket'
import { timeToText } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import TicketClinicDeliveryStatusTag from '../TicketClinicDeliveryStatusTag.vue'
import TicketClinicStatusTag from '../TicketClinicStatusTag.vue'
import ModalTicketClinicPayment from './modal/ModalTicketClinicPayment.vue'
import { ticketClinic } from './ticket-clinic-detail.ref'
import { IconFileSearch } from '../../../common/icon'

const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const updateCustomer = () => {}
</script>
<template>
  <ModalTicketClinicPayment ref="modalTicketClinicPayment" />
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
        <span class="ml-2">{{ timeToText(ticketClinic.customer?.birthday, 'DD/MM/YYYY') }}</span>
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
        <ClockCircleOutlined />
        <div>{{ timeToText(ticketClinic.startedAt, 'hh:mm DD/MM/YYYY') }}</div>
      </div>
      <div>
        <TicketClinicStatusTag :ticketStatus="ticketClinic.ticketStatus" />
      </div>
    </div>
    <a-divider />
    <div class="mt-2 flex gap-4 items-center justify-between">
      <div class="flex items-center gap-4 whitespace-nowrap">
        <DollarOutlined />
        <div>Thanh toán :</div>
      </div>
      <div class="flex flex-wrap items-center justify-end">
        <div>
          <VueButton
            v-if="
              [TicketStatus.Draft, TicketStatus.Approved, TicketStatus.Executing].includes(
                ticketClinic.ticketStatus
              )
            "
            size="small"
            color="green"
            @click="modalTicketClinicPayment?.openModal(PaymentViewType.Prepayment)">
            <DollarOutlined />
            <span class="font-bold">TẠM ỨNG</span>
          </VueButton>
          <VueButton
            v-if="[TicketStatus.Debt].includes(ticketClinic.ticketStatus)"
            size="small"
            color="green"
            @click="modalTicketClinicPayment?.openModal(PaymentViewType.PayDebt)">
            <DollarOutlined />
            <span class="font-bold">TRẢ NỢ</span>
          </VueButton>
          <VueButton
            v-if="
              [TicketStatus.Completed, TicketStatus.Cancelled].includes(ticketClinic.ticketStatus)
            "
            size="small"
            color="green"
            @click="modalTicketClinicPayment?.openModal(PaymentViewType.Success)">
            <DollarOutlined />
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
        <DollarOutlined />
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
        <SendOutlined />
        <div>Lấy thuốc :</div>
      </div>
      <div>
        <TicketClinicDeliveryStatusTag :deliveryStatus="ticketClinic.deliveryStatus" />
      </div>
    </div>
  </div>
</template>
<script lang="scss" scope></script>
