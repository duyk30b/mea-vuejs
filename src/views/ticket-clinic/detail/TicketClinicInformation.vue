<script lang="ts" setup>
import { PhoneOutlined, WarningOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClock, IconDollar, IconFileSearch, IconSend } from '../../../common/icon'
import { InputOptions } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Appointment } from '../../../modules/appointment'
import { Customer, CustomerService } from '../../../modules/customer'
import { PaymentViewType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { TicketStatus } from '../../../modules/ticket'
import { ticketClinicRef, ticketRefDeliveryStatus } from '../../../modules/ticket-clinic'
import { DString, DTimer } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../../customer/upsert/ModalCustomerUpsert.vue'
import TicketClinicDeliveryStatusTag from '../TicketClinicDeliveryStatusTag.vue'
import TicketClinicStatusTag from '../TicketClinicStatusTag.vue'
import ModalTicketClinicPayment from './modal/ModalTicketClinicPayment.vue'
import ModalTicketClinicRegisterAppointment from './modal/ModalTicketClinicRegisterAppointment.vue'

const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()
const modalTicketClinicRegisterAppointment =
  ref<InstanceType<typeof ModalTicketClinicRegisterAppointment>>()
const inputOptionsCustomer = ref<InstanceType<typeof InputOptions>>()

const customerList = ref<Customer[]>([])

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const updateCustomer = () => {}
const meStore = useMeStore()
const { permissionIdMap } = meStore

watch(
  () => ticketClinicRef.value.id,
  (newValue) => {
    if (newValue) {
      inputOptionsCustomer.value?.setItem({
        value: ticketClinicRef.value.customer!.id,
        text: ticketClinicRef.value.customer!.fullName,
        data: ticketClinicRef.value.customer!,
      })
    }
  }
)

const handleFocusFirstSearchCustomer = async () => {
  await CustomerService.refreshDB()
}

const searchingCustomer = async (text: string) => {
  ticketClinicRef.value.customer = Customer.blank()
  ticketClinicRef.value.customerId = 0
  if (text) {
    customerList.value = await CustomerService.search(text)
  } else {
    customerList.value = []
  }
}

const selectCustomer = (data?: Customer) => {
  ticketClinicRef.value.customerId = data?.id || 0
  ticketClinicRef.value.customer = Customer.from(data || Customer.blank())
  ticketClinicRef.value.ticketAttributeMap!.healthHistory = data?.healthHistory || ''
}

const createCustomer = (instance?: Customer) => {
  inputOptionsCustomer.value?.setItem({
    text: instance?.fullName,
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
  <ModalCustomerUpsert ref="modalCustomerUpsert" @success="createCustomer" />
  <ModalTicketClinicPayment ref="modalTicketClinicPayment" />
  <ModalTicketClinicRegisterAppointment ref="modalTicketClinicRegisterAppointment" />
  <ModalCustomerDetail ref="modalCustomerDetail" @update_customer="updateCustomer" />
  <div class="bg-white p-4">
    <div class="">
      <div class="flex justify-between">
        <span>
          Tên KH (nợ cũ:
          <b>{{ formatMoney(ticketClinicRef.customer?.debt || 0) }}</b>
          )
          <a
            v-if="ticketClinicRef.customerId"
            class="ml-1"
            @click="modalCustomerDetail?.openModal(ticketClinicRef.customer!)">
            <IconFileSearch />
          </a>
        </span>
        <span>
          <a
            v-if="!ticketClinicRef.id && permissionIdMap[PermissionId.CUSTOMER_CREATE]"
            @click="modalCustomerUpsert?.openModal()">
            Thêm KH mới
          </a>
        </span>
      </div>
      <div style="height: 40px">
        <InputOptions
          ref="inputOptionsCustomer"
          :options="customerList.map((i) => ({ value: i.id, text: i.fullName, data: i }))"
          :maxHeight="320"
          placeholder="(F4) Tìm kiếm bằng Tên hoặc Số Điện Thoại"
          :disabled="!!ticketClinicRef.id"
          required
          @onFocusinFirst="handleFocusFirstSearchCustomer"
          @selectItem="({ data }) => selectCustomer(data)"
          @update:text="searchingCustomer">
          <template #option="{ item: { data } }">
            <div>
              <b>{{ data.fullName }}</b>
              - {{ DString.formatPhone(data.phone) }} -
              {{ DTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
            </div>
            <div>{{ DString.formatAddress(data) }}</div>
          </template>
        </InputOptions>
      </div>
    </div>

    <div class="mt-2 flex justify-between">
      <div class="">
        <PhoneOutlined />
        <span class="ml-4">{{ DString.formatPhone(ticketClinicRef.customer?.phone) }}</span>
      </div>
      <div>{{ DString.formatAddress(ticketClinicRef.customer!) }}</div>
    </div>
    <div class="mt-2">
      <WarningOutlined />
      <span class="ml-4">{{ ticketClinicRef.ticketAttributeMap?.diagnosis }}</span>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconClock />
        <div>{{ DTimer.timeToText(ticketClinicRef.registeredAt, 'hh:mm DD/MM/YYYY') }}</div>
      </div>
      <div>
        <TicketClinicStatusTag :ticketStatus="ticketClinicRef.ticketStatus" />
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
              ].includes(ticketClinicRef.ticketStatus)
            "
            size="small"
            color="green"
            icon="dollar"
            @click="modalTicketClinicPayment?.openModal(PaymentViewType.Prepayment)">
            <span class="font-bold">TẠM ỨNG</span>
          </VueButton>
          <VueButton
            v-if="[TicketStatus.Debt].includes(ticketClinicRef.ticketStatus)"
            size="small"
            color="green"
            icon="dollar"
            @click="modalTicketClinicPayment?.openModal(PaymentViewType.PayDebt)">
            <span class="font-bold">TRẢ NỢ</span>
          </VueButton>
          <VueButton
            v-if="
              [TicketStatus.Completed, TicketStatus.Cancelled].includes(
                ticketClinicRef.ticketStatus
              )
            "
            size="small"
            color="green"
            icon="dollar"
            @click="modalTicketClinicPayment?.openModal(PaymentViewType.Success)">
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
        :class="ticketClinicRef.paid < ticketClinicRef.totalMoney ? 'text-red-500 font-bold' : ''">
        {{ formatMoney(Math.abs(ticketClinicRef.totalMoney - ticketClinicRef.paid)) }}
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconSend />
        <div>Lấy thuốc :</div>
      </div>
      <div>
        <TicketClinicDeliveryStatusTag :deliveryStatus="ticketRefDeliveryStatus" />
      </div>
    </div>
    <div class="mt-2 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <IconClock />
        <div>Hẹn khám :</div>
      </div>
      <div v-if="!ticketClinicRef.toAppointment">
        <VueButton size="small" color="blue" @click="handleClickModalRegisterAppointment">
          Tạo lịch hẹn
        </VueButton>
      </div>
      <div v-else class="flex gap-2 items-center flex-wrap">
        <VueButton size="small" @click="handleClickModalRegisterAppointment">Sửa</VueButton>
        {{ DTimer.timeToText(ticketClinicRef.toAppointment.registeredAt, 'hh:mm DD/MM/YYYY') }}
      </div>
    </div>
  </div>
</template>
