<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconFileSearch } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputDate, InputOptions, InputText, VueSelect } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Appointment, AppointmentApi, AppointmentStatus } from '../../../modules/appointment'
import { useCustomerStore } from '../../../modules/customer'
import { CustomerSource, CustomerSourceService } from '../../../modules/customer-source'
import { Customer } from '../../../modules/customer/customer.model'
import { VoucherType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import type { Ticket } from '../../../modules/ticket'
import { TicketClinicApi } from '../../../modules/ticket-clinic'
import { DTimer } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../../customer/upsert/ModalCustomerUpsert.vue'

const inputOptionsCustomer = ref<InstanceType<typeof InputOptions>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()

const ticketClinicCreateForm = ref<InstanceType<typeof HTMLFormElement>>()

const emit = defineEmits<{
  (e: 'success', value: { ticket: Ticket }): void
}>()

const router = useRouter()

const customerStore = useCustomerStore()
const settingStore = useSettingStore()
const { formatMoney } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const registeredAt = ref<number>(Date.now())
const reason = ref('')
const customerSourceId = ref(0)
const customerSourceAll = ref<CustomerSource[]>([])

const customer = ref<Customer>(Customer.blank())
const customerListOptions = ref<{ value: number; text: string; data: Customer }[]>([])

const appointmentList = ref<Appointment[]>([])
const appointmentOptions = ref<Appointment[]>([])

const showModal = ref(false)
const saveLoading = ref(false)
const fromAppointmentId = ref(0)

const openModal = async () => {
  showModal.value = true
  customerSourceAll.value = await CustomerSourceService.getAll()
}

const closeModal = () => {
  customer.value = Customer.blank()
  customerListOptions.value = []
  appointmentOptions.value = []
  fromAppointmentId.value = 0
  customerSourceId.value = 0
  showModal.value = false
}

const selectCustomer = async (customerSelect: Customer) => {
  if (customerSelect) {
    try {
      appointmentList.value = await AppointmentApi.list({
        filter: {
          appointmentStatus: { IN: [AppointmentStatus.Waiting, AppointmentStatus.Confirm] },
          customerId: customerSelect.id,
        },
      })

      customer.value = Customer.from(customerSelect)
      appointmentOptions.value = appointmentList.value.sort((a, b) => (a > b ? 1 : -1))
    } catch (error) {
      console.log('🚀 ~ file: ModalTicketClinicRegister.vue:81 ~ selectCustomer ~ error:', error)
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
    customerSourceId.value = appointment.customerSourceId
  } else {
    fromAppointmentId.value = 0
    reason.value = ''
    customerSourceId.value = 0
  }
}

const handleRegisterVisit = async () => {
  if (DTimer.timeToText(registeredAt.value) !== DTimer.timeToText(new Date())) {
    return AlertStore.addError(
      'Thời gian đăng ký khám không hợp lệ. Chỉ được đăng ký khám trong ngày'
    )
  }
  saveLoading.value = true
  try {
    const ticketResponse = await TicketClinicApi.register({
      customerId: customer.value.id,
      ticketType: useMeStore().getTicketTypeDefault(),
      registeredAt: registeredAt.value,
      reason: reason.value,
      customerSourceId: customerSourceId.value,
      fromAppointmentId: fromAppointmentId.value,
    })
    emit('success', { ticket: ticketResponse })
    closeModal()
  } catch (error) {
    console.log(
      '🚀 ~ file: ModalTicketClinicRegister.vue:144 ~ handleRegisterVisit ~ error:',
      error
    )
  } finally {
    saveLoading.value = false
  }
}

const openBlankCustomerSourceList = async () => {
  let route = router.resolve({
    name: 'CustomerSourceList',
  })
  window.open(route.href, '_blank')
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

        <div style="flex-basis: 80%; flex-grow: 1">
          <div>Nguồn khách hàng</div>
          <div>
            <VueSelect
              v-model:value="customerSourceId"
              :options="customerSourceAll.map((i) => ({ text: i.name, value: i.id }))"
              :add-other="!customerSourceAll.length">
              <template #addOther>
                <div class="flex items-center gap-4" style="font-style: italic">
                  <span>Chưa có dữ liệu phù hợp.</span>
                  <a @click="openBlankCustomerSourceList">Quản lý danh sách nguồn khách hàng</a>
                </div>
              </template>
            </VueSelect>
          </div>
        </div>

        <div style="flex-basis: 300px; flex-grow: 1">
          <div>Thời gian đăng ký</div>
          <div>
            <InputDate v-model:value="registeredAt" type-parser="number" class="w-full" show-time />
          </div>
        </div>

        <div class="grow basis-[80%]">
          <div>Lý do khám</div>
          <div>
            <InputText v-model:value="reason" />
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

<style lang="scss"></style>
