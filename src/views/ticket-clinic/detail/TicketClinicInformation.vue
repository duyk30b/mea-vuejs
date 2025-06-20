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
import { ticketClinicRef } from '../../../modules/ticket-clinic'
import { DString, ESTimer } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../../customer/upsert/ModalCustomerUpsert.vue'
import TicketStatusTag from '../../ticket-base/TicketStatusTag.vue'
import TicketClinicDeliveryStatusTag from '../TicketClinicDeliveryStatusTag.vue'
import ModalTicketClinicPayment from './modal/ModalTicketClinicPayment.vue'
import ModalTicketClinicRegisterAppointment from './modal/ModalTicketClinicRegisterAppointment.vue'
import { MeService } from '../../../modules/_me/me.service'

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
    value: ticketClinicRef.value.customer!.id,
    text: ticketClinicRef.value.customer!.fullName,
    data: ticketClinicRef.value.customer!,
  })
})

const handleFocusFirstSearchCustomer = async () => {
  await CustomerService.refreshDB()
}

const searchingCustomer = async (text: string) => {
  // ticketClinicRef.value.customer = Customer.blank()
  // ticketClinicRef.value.customerId = 0
  // if (text) {
  //   customerList.value = await CustomerService.search(text)
  // } else {
  //   customerList.value = []
  // }
}

const selectCustomer = (data?: Customer) => {
  // ticketClinicRef.value.customerId = data?.id || 0
  // ticketClinicRef.value.customer = Customer.from(data || Customer.blank())
  // ticketClinicRef.value.ticketAttributeMap!.healthHistory = data?.healthHistory || ''
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
  if (ticketClinicRef.value.toAppointment) {
    toAppointment = Appointment.from(ticketClinicRef.value.toAppointment)
  } else {
    toAppointment = Appointment.blank()
    toAppointment.fromTicketId = ticketClinicRef.value.id
    toAppointment.customerId = ticketClinicRef.value.customerId

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
          <span v-if="ticketClinicRef.customer!.id" class="ml-1">
            <a @click="modalCustomerDetail?.openModal(ticketClinicRef.customerId)">
              <IconFileSearch />
            </a>
            (nợ cũ:
            <b>{{ formatMoney(ticketClinicRef.customer?.debt || 0) }}</b>
            )
          </span>
        </div>
        <a
          v-if="ticketClinicRef.customer!.id && userPermission[PermissionId.CUSTOMER_UPDATE]"
          @click="modalCustomerUpsert?.openModal(ticketClinicRef.customer!)"
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
          :disabled="!!ticketClinicRef.id"
          required
          @onFocusinFirst="handleFocusFirstSearchCustomer"
          @selectItem="({ data }) => selectCustomer(data)"
          @update:text="searchingCustomer"
        >
          <template #option="{ item: { data } }">
            <div>
              <b>{{ data.fullName }}</b>
              - {{ DString.formatPhone(data.phone) }} -
              {{ ESTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
            </div>
            <div>{{ DString.formatAddress(data) }}</div>
          </template>
        </InputOptions>
      </div>
    </div>

    <div class="mt-2 flex justify-between">
      <div class="">
        <IconPhone />
        <span class="ml-4">{{ DString.formatPhone(ticketClinicRef.customer?.phone) }}</span>
      </div>
      <div>{{ DString.formatAddress(ticketClinicRef.customer!) }}</div>
    </div>
    <div class="mt-2">
      <IconWarning />
      <span class="ml-4">{{ ticketClinicRef.note }}</span>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconClockCircle />
        <div>{{ ESTimer.timeToText(ticketClinicRef.registeredAt, 'hh:mm DD/MM/YYYY') }}</div>
      </div>
      <div>
        <TicketStatusTag :ticket="ticketClinicRef" />
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
              ].includes(ticketClinicRef.status)
            "
            size="small"
            color="green"
            icon="dollar"
            @click="modalTicketClinicPayment?.openModal(PaymentViewType.Prepayment)"
          >
            <span class="font-bold">TẠM ỨNG</span>
          </VueButton>
          <VueButton
            v-if="[TicketStatus.Debt].includes(ticketClinicRef.status)"
            size="small"
            color="green"
            icon="dollar"
            @click="modalTicketClinicPayment?.openModal(PaymentViewType.PayDebt)"
          >
            <span class="font-bold">TRẢ NỢ</span>
          </VueButton>
          <VueButton
            v-if="[TicketStatus.Completed, TicketStatus.Cancelled].includes(ticketClinicRef.status)"
            size="small"
            color="green"
            icon="dollar"
            @click="modalTicketClinicPayment?.openModal(PaymentViewType.Success)"
          >
            <span class="font-bold">THANH TOÁN</span>
          </VueButton>
        </div>
        <span class="ml-4">
          {{ formatMoney(ticketClinicRef.paid) }} / {{ formatMoney(ticketClinicRef.totalMoney) }}
        </span>
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconDollar />
        <div v-if="ticketClinicRef.totalMoney >= ticketClinicRef.paid">Còn thiếu :</div>
        <div v-else>Tiền thừa :</div>
      </div>
      <div
        class="text-lg"
        :class="ticketClinicRef.paid < ticketClinicRef.totalMoney ? 'text-red-500 font-bold' : ''"
      >
        {{ formatMoney(Math.abs(ticketClinicRef.totalMoney - ticketClinicRef.paid)) }}
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconSend />
        <div>Lấy thuốc :</div>
      </div>
      <div>
        <TicketClinicDeliveryStatusTag :deliveryStatus="ticketClinicRef.deliveryStatus" />
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconClockCircle />
        <div>Hẹn khám :</div>
      </div>
      <div v-if="!ticketClinicRef.toAppointment">
        <VueButton size="small" color="blue" @click="handleClickModalRegisterAppointment">
          Tạo lịch hẹn
        </VueButton>
      </div>
      <div v-else class="flex gap-2 items-center flex-wrap">
        <VueButton size="small" @click="handleClickModalRegisterAppointment">Sửa</VueButton>
        {{ ESTimer.timeToText(ticketClinicRef.toAppointment.registeredAt, 'hh:mm DD/MM/YYYY') }}
      </div>
    </div>
    <template v-if="CONFIG.MODE === 'development'">
      <div class="table-wrapper mt-4">
        <table>
          <tbody>
            <tr>
              <td style="width: 150px">productMoney</td>
              <td>{{ formatMoney(ticketClinicRef.productMoney) }}</td>
            </tr>
            <tr>
              <td>procedureMoney</td>
              <td>{{ formatMoney(ticketClinicRef.procedureMoney) }}</td>
            </tr>
            <tr>
              <td>laboratoryMoney</td>
              <td>{{ formatMoney(ticketClinicRef.laboratoryMoney) }}</td>
            </tr>
            <tr>
              <td>radiologyMoney</td>
              <td>{{ formatMoney(ticketClinicRef.radiologyMoney) }}</td>
            </tr>
            <tr>
              <td>itemsActualMoney</td>
              <td>{{ formatMoney(ticketClinicRef.itemsActualMoney) }} ***</td>
            </tr>
            <tr>
              <td>discountMoney</td>
              <td>{{ formatMoney(ticketClinicRef.discountMoney) }}</td>
            </tr>
            <tr>
              <td>totalMoney</td>
              <td>{{ formatMoney(ticketClinicRef.totalMoney) }}</td>
            </tr>
            <tr>
              <td>itemsCostAmount</td>
              <td>{{ formatMoney(ticketClinicRef.itemsCostAmount) }}</td>
            </tr>
            <tr>
              <td>commissionMoney</td>
              <td>{{ formatMoney(ticketClinicRef.commissionMoney) }}</td>
            </tr>
            <tr>
              <td>profit</td>
              <td>{{ formatMoney(ticketClinicRef.profit) }}</td>
            </tr>
            <tr>
              <td>paid</td>
              <td>{{ formatMoney(ticketClinicRef.paid) }}</td>
            </tr>
            <tr>
              <td>debt</td>
              <td>{{ formatMoney(ticketClinicRef.debt) }}</td>
            </tr>
            <tr>
              <td>itemsDiscount</td>
              <td>{{ formatMoney(ticketClinicRef.itemsDiscount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
