<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import {
  IconClockCircle,
  IconDollar,
  IconFileSearch,
  IconPhone,
  IconSend,
  IconWarning,
} from '../../../common/icon-antd'
import { InputOptions } from '../../../common/vue-form'
import type { ItemOption } from '../../../common/vue-form/InputOptions.vue'
import { VueDivider } from '../../../common/vue-layout'
import { CONFIG } from '../../../config'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Appointment } from '../../../modules/appointment'
import { Customer, CustomerService } from '../../../modules/customer'
import { PaymentViewType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { TicketStatus } from '../../../modules/ticket'
import { ESString, ESTimer } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../../customer/upsert/ModalCustomerUpsert.vue'
import TicketStatusTag from '../../ticket-base/TicketStatusTag.vue'
import TicketClinicDeliveryStatusTag from '../TicketClinicDeliveryStatusTag.vue'
import ModalTicketClinicPayment from '../../reception/reception-ticket/modal/ModalTicketClinicPayment.vue'
import ModalTicketClinicRegisterAppointment from './modal/ModalTicketClinicRegisterAppointment.vue'
import { MeService } from '../../../modules/_me/me.service'
import { ticketRoomRef } from '@/modules/room/room.ref'

const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()
const modalTicketClinicRegisterAppointment =
  ref<InstanceType<typeof ModalTicketClinicRegisterAppointment>>()
const inputOptionsCustomer = ref<InstanceType<typeof InputOptions>>()

const customerList = ref<Customer[]>([])
const customerOptions = ref<ItemOption[]>([])

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const updateCustomer = () => {}
const { userPermission } = MeService

onMounted(() => {
  inputOptionsCustomer.value?.setItem({
    value: ticketRoomRef.value.customer!.id,
    text: ticketRoomRef.value.customer!.fullName,
    data: ticketRoomRef.value.customer!,
  })
})

const handleFocusFirstSearchCustomer = async () => {
  await CustomerService.refreshDB()
}

const searchingCustomer = async (text: string) => {
  // ticketRoomRef.value.customer = Customer.blank()
  // ticketRoomRef.value.customerId = 0
  // if (text) {
  //   customerList.value = await CustomerService.search(text)
  // } else {
  //   customerList.value = []
  // }
}

const selectCustomer = (data?: Customer) => {
  // ticketRoomRef.value.customerId = data?.id || 0
  // ticketRoomRef.value.customer = Customer.from(data || Customer.blank())
  // ticketRoomRef.value.ticketAttributeMap!.healthHistory = data?.healthHistory || ''
}

const handleModalCustomerUpsertSuccess = (instance?: Customer) => {
  inputOptionsCustomer.value?.setItem({
    text: instance?.fullName || '',
    data: instance,
    value: instance?.id,
  })
  selectCustomer(instance)
}

const handleClickModalRegisterAppointment = () => {
  let toAppointment
  if (ticketRoomRef.value.toAppointment) {
    toAppointment = Appointment.from(ticketRoomRef.value.toAppointment)
  } else {
    toAppointment = Appointment.blank()
    toAppointment.fromTicketId = ticketRoomRef.value.id
    toAppointment.customerId = ticketRoomRef.value.customerId

    const time = new Date()
    time.setMinutes(0, 0)
    time.setDate(time.getDate() + 7)
    toAppointment.registeredAt = time.getTime()
  }

  modalTicketClinicRegisterAppointment.value?.openModal(toAppointment)
}
</script>
<template>
  <ModalCustomerUpsert ref="modalCustomerUpsert" @success="handleModalCustomerUpsertSuccess" />
  <ModalTicketClinicPayment ref="modalTicketClinicPayment" />
  <ModalTicketClinicRegisterAppointment ref="modalTicketClinicRegisterAppointment" />
  <ModalCustomerDetail ref="modalCustomerDetail" @update_customer="updateCustomer" />
  <div class="bg-white p-4">
    <div class="">
      <div class="flex flex-wrap justify-between">
        <div>
          <span>Tên KH</span>
          <span v-if="ticketRoomRef.customer!.id" class="ml-1">
            <a @click="modalCustomerDetail?.openModal(ticketRoomRef.customerId)">
              <IconFileSearch />
            </a>
          </span>
          <span v-if="ticketRoomRef.customer!.debt > 0">
            - Nợ:
            <b style="color: var(--text-red)">
              {{ formatMoney(ticketRoomRef.customer!.debt) }}
            </b>
          </span>
          <span v-if="ticketRoomRef.customer!.debt < 0">
            - Quỹ:
            <b style="color: var(--text-green)">
              {{ formatMoney(-ticketRoomRef.customer!.debt) }}
            </b>
          </span>
        </div>
        <a
          v-if="ticketRoomRef.customer!.id && userPermission[PermissionId.CUSTOMER_UPDATE]"
          @click="modalCustomerUpsert?.openModal(ticketRoomRef.customer!)"
        >
          Sửa thông tin KH
        </a>
      </div>
      <div style="height: 40px">
        <InputOptions
          ref="inputOptionsCustomer"
          :options="customerOptions"
          :maxHeight="320"
          placeholder="(F4) Tìm kiếm bằng Tên hoặc Số Điện Thoại"
          :disabled="!!ticketRoomRef.id"
          required
          @onFocusinFirst="handleFocusFirstSearchCustomer"
          @selectItem="({ data }) => selectCustomer(data)"
          @update:text="searchingCustomer"
        >
          <template #option="{ item: { data } }">
            <div>
              <b>{{ data.fullName }}</b>
              - {{ ESString.formatPhone(data.phone) }} -
              {{ ESTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
            </div>
            <div>{{ ESString.formatAddress(data) }}</div>
          </template>
        </InputOptions>
      </div>
    </div>

    <div class="mt-2 flex justify-between">
      <div class="">
        <IconPhone />
        <span class="ml-4">{{ ESString.formatPhone(ticketRoomRef.customer?.phone) }}</span>
      </div>
      <div>{{ ESString.formatAddress(ticketRoomRef.customer!) }}</div>
    </div>
    <div class="mt-2">
      <IconWarning />
      <span class="ml-4">{{ ticketRoomRef.note }}</span>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconClockCircle />
        <div>{{ ESTimer.timeToText(ticketRoomRef.registeredAt, 'hh:mm DD/MM/YYYY') }}</div>
      </div>
      <div>
        <TicketStatusTag :ticket="ticketRoomRef" />
      </div>
    </div>
    <VueDivider class="my-6"></VueDivider>
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
                TicketStatus.Deposited,
                TicketStatus.Executing,
              ].includes(ticketRoomRef.status)
            "
            size="small"
            color="green"
            icon="dollar"
            @click="
              modalTicketClinicPayment?.openModal({
                ticket: ticketRoomRef,
                paymentView: PaymentViewType.Prepayment,
              })
            "
          >
            <span class="font-bold">TẠM ỨNG</span>
          </VueButton>
          <VueButton
            v-if="[TicketStatus.Debt].includes(ticketRoomRef.status)"
            size="small"
            color="green"
            icon="dollar"
            @click="
              modalTicketClinicPayment?.openModal({
                ticket: ticketRoomRef,
                paymentView: PaymentViewType.PayDebt,
              })
            "
          >
            <span class="font-bold">TRẢ NỢ</span>
          </VueButton>
          <VueButton
            v-if="[TicketStatus.Completed, TicketStatus.Cancelled].includes(ticketRoomRef.status)"
            size="small"
            color="green"
            icon="dollar"
            @click="
              modalTicketClinicPayment?.openModal({
                ticket: ticketRoomRef,
                paymentView: PaymentViewType.Success,
              })
            "
          >
            <span class="font-bold">THANH TOÁN</span>
          </VueButton>
        </div>
        <span class="ml-4">
          {{ formatMoney(ticketRoomRef.paid) }} / {{ formatMoney(ticketRoomRef.totalMoney) }}
        </span>
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconDollar />
        <div v-if="ticketRoomRef.totalMoney >= ticketRoomRef.paid">Còn thiếu :</div>
        <div v-else>Tiền thừa :</div>
      </div>
      <div
        class="text-lg"
        :class="ticketRoomRef.paid < ticketRoomRef.totalMoney ? 'text-red-500 font-bold' : ''"
      >
        {{ formatMoney(Math.abs(ticketRoomRef.totalMoney - ticketRoomRef.paid)) }}
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconSend />
        <div>Lấy thuốc :</div>
      </div>
      <div>
        <TicketClinicDeliveryStatusTag :deliveryStatus="ticketRoomRef.deliveryStatus" />
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconClockCircle />
        <div>Hẹn khám :</div>
      </div>
      <div v-if="!ticketRoomRef.toAppointment">
        <VueButton size="small" color="blue" @click="handleClickModalRegisterAppointment">
          Tạo lịch hẹn
        </VueButton>
      </div>
      <div v-else class="flex gap-2 items-center flex-wrap">
        <VueButton size="small" @click="handleClickModalRegisterAppointment">Sửa</VueButton>
        {{ ESTimer.timeToText(ticketRoomRef.toAppointment.registeredAt, 'hh:mm DD/MM/YYYY') }}
      </div>
    </div>
    <template v-if="CONFIG.MODE === 'development'">
      <div class="table-wrapper mt-4">
        <table>
          <tbody>
            <tr>
              <td style="width: 150px">productMoney</td>
              <td>{{ formatMoney(ticketRoomRef.productMoney) }}</td>
            </tr>
            <tr>
              <td>procedureMoney</td>
              <td>{{ formatMoney(ticketRoomRef.procedureMoney) }}</td>
            </tr>
            <tr>
              <td>laboratoryMoney</td>
              <td>{{ formatMoney(ticketRoomRef.laboratoryMoney) }}</td>
            </tr>
            <tr>
              <td>radiologyMoney</td>
              <td>{{ formatMoney(ticketRoomRef.radiologyMoney) }}</td>
            </tr>
            <tr>
              <td>itemsActualMoney</td>
              <td>{{ formatMoney(ticketRoomRef.itemsActualMoney) }} ***</td>
            </tr>
            <tr>
              <td>discountMoney</td>
              <td>{{ formatMoney(ticketRoomRef.discountMoney) }}</td>
            </tr>
            <tr>
              <td>totalMoney</td>
              <td>{{ formatMoney(ticketRoomRef.totalMoney) }}</td>
            </tr>
            <tr>
              <td>itemsCostAmount</td>
              <td>{{ formatMoney(ticketRoomRef.itemsCostAmount) }}</td>
            </tr>
            <tr>
              <td>commissionMoney</td>
              <td>{{ formatMoney(ticketRoomRef.commissionMoney) }}</td>
            </tr>
            <tr>
              <td>profit</td>
              <td>{{ formatMoney(ticketRoomRef.profit) }}</td>
            </tr>
            <tr>
              <td>paid</td>
              <td>{{ formatMoney(ticketRoomRef.paid) }}</td>
            </tr>
            <tr>
              <td>debt</td>
              <td>{{ formatMoney(ticketRoomRef.debt) }}</td>
            </tr>
            <tr>
              <td>itemsDiscount</td>
              <td>{{ formatMoney(ticketRoomRef.itemsDiscount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
