<script setup lang="ts">
import dayjs, { Dayjs } from 'dayjs'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconFileSearch } from '../../../common/icon'
import { InputOptions, InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { useCustomerStore } from '../../../modules/customer'
import { Customer } from '../../../modules/customer/customer.model'
import { TicketClinicApi } from '../../../modules/ticket-clinic'
import { DTimer } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../../customer/upsert/ModalCustomerUpsert.vue'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { useMeStore } from '../../../modules/_me/me.store'
import { Appointment, AppointmentApi, AppointmentStatus } from '../../../modules/appointment'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { VoucherType } from '../../../modules/enum'

const inputOptionsCustomer = ref<InstanceType<typeof InputOptions>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()

const ticketClinicCreateForm = ref<InstanceType<typeof HTMLFormElement>>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const customerStore = useCustomerStore()
const settingStore = useSettingStore()
const { formatMoney } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const time = ref<Dayjs>(dayjs())
const reason = ref('')

const customer = ref<Customer>(Customer.blank())
const customerListOptions = ref<{ value: number; text: string; data: Customer }[]>([])

const appointmentList = ref<Appointment[]>([])
const appointmentOptions = ref<Appointment[]>([])
let loadAppointment = false

const showModal = ref(false)
const saveLoading = ref(false)
const fromAppointmentId = ref(0)

const openModal = async () => {
  showModal.value = true
}

const closeModal = () => {
  customer.value = Customer.blank()
  customerListOptions.value = []
  appointmentOptions.value = []
  fromAppointmentId.value = 0
  showModal.value = false
}

const selectCustomer = async (customerSelect: Customer) => {
  if (customerSelect) {
    try {
      if (!loadAppointment) {
        appointmentList.value = await AppointmentApi.list({
          filter: {
            appointmentStatus: { IN: [AppointmentStatus.Waiting, AppointmentStatus.Confirm] },
            appointmentType: VoucherType.Clinic,
          },
        })
        loadAppointment = true
      }
      customer.value = Customer.from(customerSelect)
      appointmentOptions.value = appointmentList.value
        .filter((i) => i.customerId === customerSelect.id)
        .sort((a, b) => (a > b ? 1 : -1))
    } catch (error) {
      console.log('🚀 ~ file: ModalTicketClinicRegister.vue:96 ~ selectCustomer ~ error:', error)
    }
  } else {
    customer.value = Customer.blank()
  }
}

const searchingCustomer = async (text: string) => {
  customer.value = Customer.blank()
  customer.value.fullName = text
  if (text) {
    const customerList = await customerStore.search(text)
    customerListOptions.value = customerList.map((i) => ({
      value: i.id,
      text: i.fullName,
      data: i,
    }))
  } else {
    customerListOptions.value = []
    appointmentOptions.value = []
  }
}

const createCustomer = (customerSelect: Customer) => {
  inputOptionsCustomer.value?.setItem({
    text: customerSelect?.fullName,
    data: customerSelect,
    value: customerSelect?.id,
  })
  selectCustomer(customerSelect)
}

const handleChangeCheckboxAppointment = (e: any, appointment: Appointment) => {
  if (e.target.checked) {
    fromAppointmentId.value = appointment.id
    reason.value = appointment.reason
    time.value = dayjs(appointment.registeredAt)
  } else {
    fromAppointmentId.value = 0
    reason.value = ''
    time.value = dayjs()
  }
}

const handleRegisterVisit = async () => {
  const registeredAt = time.value.valueOf()
  if (DTimer.timeToText(registeredAt) !== DTimer.timeToText(new Date())) {
    return AlertStore.addError(
      'Thời gian đăng ký khám không hợp lệ. Chỉ được đăng ký khám trong ngày'
    )
  }
  saveLoading.value = true
  try {
    await TicketClinicApi.registerWithExistCustomer({
      customerId: customer.value.id,
      registeredAt,
      reason: reason.value,
      fromAppointmentId: fromAppointmentId.value,
    })
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:75 ~ handleRegisterVisit ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form ref="ticketClinicCreateForm" class="bg-white" @submit.prevent="handleRegisterVisit">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Thêm phiếu khám mới</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 gap-4 flex flex-wrap">
        <div style="flex-basis: 80%; flex-grow: 1">
          <div class="flex justify-between">
            <span>
              Tên KH (nợ cũ:
              <b>{{ formatMoney(customer.debt) }}</b>
              )
              <a v-if="customer.id" class="ml-1" @click="modalCustomerDetail?.openModal(customer!)">
                <IconFileSearch />
              </a>
            </span>
            <span>
              <a
                v-if="permissionIdMap[PermissionId.CUSTOMER_CREATE]"
                @click="modalCustomerUpsert?.openModal()">
                Thêm KH mới
              </a>
            </span>
          </div>
          <div style="height: 40px">
            <InputOptions
              ref="inputOptionsCustomer"
              :options="customerListOptions"
              :maxHeight="200"
              placeholder="Tìm kiếm bằng tên hoặc SĐT"
              required
              @selectItem="({ data }) => selectCustomer(data)"
              @update:text="searchingCustomer">
              <template #option="{ item: { data } }">
                <div>
                  <b>{{ data.fullName }}</b>
                  - {{ data.phone }} -
                  {{ DTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
                </div>
                <div>{{ data.addressString }}</div>
              </template>
            </InputOptions>
          </div>
        </div>

        <div v-if="appointmentOptions.length" class="grow basis-[80%]">
          <div>Khách hàng đến theo hẹn ?</div>
          <div class="ml-4">
            <div v-for="(appointment, index) in appointmentOptions" :key="index">
              <a-checkbox
                :checked="fromAppointmentId === appointment.id"
                @change="(e: any) => handleChangeCheckboxAppointment(e, appointment)">
                <span>{{ DTimer.timeToText(appointment.registeredAt, 'DD/MM/YYYY hh:mm ') }}</span>
                <span>- Lý do: {{ appointment.reason }}</span>
              </a-checkbox>
            </div>
          </div>
        </div>

        <div class="grow basis-[80%]">
          <div>Lý do khám</div>
          <div>
            <InputText v-model:value="reason" />
          </div>
        </div>

        <div style="flex-basis: 300px; flex-grow: 1">
          <div>Thời gian đăng ký</div>
          <div>
            <a-date-picker
              v-model:value="time"
              class="w-full"
              show-time
              placeholder="Select Time"
              format="DD-MM-YYYY HH:mm" />
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex flex-wrap gap-4">
          <VueButton class="mr-auto btn" icon="close" type="reset" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton
            class="btn btn-blue"
            icon="save"
            type="submit"
            :loading="saveLoading"
            :disabled="!customer.id">
            ĐĂNG KÝ KHÁM
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalCustomerUpsert ref="modalCustomerUpsert" @success="createCustomer" />
</template>

<style lang="scss">
.ant-btn-primary[disabled] {
  color: rgba(255, 255, 255, 0.25);
  opacity: 0.7;
}
</style>
