<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconFileSearch } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputDate, InputHint, InputOptions, InputText, VueSelect } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { AddressInstance } from '../../../core/address.instance'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Appointment, AppointmentApi, AppointmentStatus } from '../../../modules/appointment'
import { useCustomerStore } from '../../../modules/customer'
import { CustomerSource, CustomerSourceService } from '../../../modules/customer-source'
import { Customer } from '../../../modules/customer/customer.model'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Ticket, TicketStatus } from '../../../modules/ticket'
import type { TicketAttributeMap } from '../../../modules/ticket-attribute'
import { TicketClinicApi } from '../../../modules/ticket-clinic'
import { customFilter, DTimer } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../../customer/upsert/ModalCustomerUpsert.vue'

const inputOptionsCustomer = ref<InstanceType<typeof InputOptions>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()

const ticketClinicCreateForm = ref<InstanceType<typeof HTMLFormElement>>()

const emit = defineEmits<{
  (e: 'success', value: { ticket: Ticket }): void
}>()

const customerStore = useCustomerStore()
const settingStore = useSettingStore()
const { formatMoney } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const customerSourceAll = ref<CustomerSource[]>([])
const customerOptions = ref<{ value: number; text: string; data: Customer }[]>([])
const appointmentOptions = ref<Appointment[]>([])

const customer = ref<Customer>(Customer.blank())
const ticketRegister = ref<Ticket>(Ticket.blank())
const fromAppointmentId = ref(0)
const ticketAttributeMap = ref<TicketAttributeMap>({})

const showModal = ref(false)
const saveLoading = ref(false)

const provinceList = ref<string[]>([])
const districtList = ref<string[]>([])
const wardList = ref<string[]>([])

const openModal = async (ticketStatus: TicketStatus) => {
  showModal.value = true
  ticketRegister.value.ticketStatus = ticketStatus
  ticketRegister.value.registeredAt = Date.now()
  customerSourceAll.value = await CustomerSourceService.getAll()
  provinceList.value = await AddressInstance.getAllProvinces()
}

const closeModal = () => {
  customerSourceAll.value = []
  customerOptions.value = []
  appointmentOptions.value = []

  customer.value = Customer.blank()
  ticketRegister.value = Ticket.blank()

  fromAppointmentId.value = 0
  ticketAttributeMap.value = {}

  showModal.value = false
}

const selectCustomer = async (customerSelect: Customer) => {
  if (customerSelect) {
    try {
      const appointmentList = await AppointmentApi.list({
        filter: {
          appointmentStatus: { IN: [AppointmentStatus.Waiting, AppointmentStatus.Confirm] },
          customerId: customerSelect.id,
        },
      })

      customer.value = Customer.from(customerSelect)
      appointmentOptions.value = appointmentList.sort((a, b) => (a > b ? 1 : -1))
      ticketRegister.value.customerSourceId = customerSelect.customerSourceId
    } catch (error) {
      console.log('🚀 ~ file: ModalTicketClinicRegister.vue:81 ~ selectCustomer ~ error:', error)
    }
  } else {
    customer.value = Customer.blank()
  }
}

const searchingCustomer = async (text: string) => {
  if (customer.value.id) {
    customer.value = Customer.blank()
  }
  customer.value.fullName = text
  if (text) {
    const customerList = await customerStore.search(text)
    customerOptions.value = customerList.map((i) => ({
      value: i.id,
      text: i.fullName,
      data: i,
    }))
  } else {
    customerOptions.value = []
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
    ticketAttributeMap.value.reason = appointment.reason
    ticketRegister.value.customerSourceId = appointment.customerSourceId
  } else {
    fromAppointmentId.value = 0
    ticketRegister.value.customerSourceId = 0
  }
}

const handleRegisterVisit = async () => {
  if (DTimer.timeToText(ticketRegister.value.registeredAt) !== DTimer.timeToText(new Date())) {
    return AlertStore.addError(
      'Thời gian đăng ký khám không hợp lệ. Chỉ được đăng ký khám trong ngày'
    )
  }
  saveLoading.value = true
  if (!customer.value.id) {
    customer.value.customerSourceId = ticketRegister.value.customerSourceId || 0
  }
  try {
    const ticketResponse = await TicketClinicApi.create({
      customerId: customer.value.id,
      fromAppointmentId: fromAppointmentId.value,
      customer: customer.value,
      ticket: {
        ticketType: settingStore.SCREEN_TICKET_CLINIC_LIST.ticketType,
        ticketStatus: ticketRegister.value.ticketStatus,
        registeredAt: ticketRegister.value.registeredAt,
        customerSourceId: ticketRegister.value.customerSourceId,
      },
      ticketAttributeList: Object.entries(ticketAttributeMap.value).map(([key, value]) => ({
        key,
        value,
      })),
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

const handleChangeProvince = async (province: string) => {
  if (!province) {
    districtList.value = []
    wardList.value = []
    return
  }
  try {
    districtList.value = await AddressInstance.getDistrictsByProvince(province)
  } catch (error) {
    console.log('🚀 ~ handleChangeProvince ~ error:', error)
  }
}

const handleChangeDistrict = async (district: string) => {
  if (!district) {
    wardList.value = []
    return
  }
  try {
    wardList.value = await AddressInstance.getWardsByProvinceAndDistrict(
      customer.value.addressProvince,
      district
    )
  } catch (error) {
    console.log('🚀 ~ handleChangeDistrict ~ error:', error)
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 100px; width: 800px">
    <form ref="ticketClinicCreateForm" class="bg-white" @submit.prevent="handleRegisterVisit">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Tiếp đón khách hàng mới</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 gap-4 flex flex-wrap">
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div class="flex justify-between">
            <div>
              <span>Tên KH</span>
              <span v-if="customer.id">
                (nợ cũ:
                <b>{{ formatMoney(customer.debt) }}</b>
                )
                <a class="ml-1" @click="modalCustomerDetail?.openModal(customer!)">
                  <IconFileSearch />
                </a>
              </span>
            </div>
            <a
              v-if="customer.id && permissionIdMap[PermissionId.CUSTOMER_UPDATE]"
              @click="modalCustomerUpsert?.openModal(customer)">
              Sửa thông tin khách hàng
            </a>
          </div>
          <div style="height: 40px">
            <InputOptions
              ref="inputOptionsCustomer"
              :options="customerOptions"
              :maxHeight="200"
              placeholder="Tìm kiếm bằng tên hoặc SĐT"
              required
              noClearTextWhenNotSelected
              message-no-result="Khách hàng này chưa từng đến khám"
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

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Số điện thoại</div>
          <div style="height: 40px">
            <InputText
              v-model:value="customer.phone"
              :disabled="!!customer.id"
              pattern="[0][356789][0-9]{8}"
              title="Định dạng số điện thoại không đúng"
              @update:value="(e) => (customer.phone = e.replace(/ /g, ''))" />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.birthday"
          style="flex-basis: 40%; flex-grow: 1; min-width: 200px">
          <div>Ngày sinh</div>
          <div>
            <InputDate
              v-model:value="customer.birthday"
              :disabled="!!customer.id"
              format="DD/MM/YYYY"
              type-parser="number"
              class="w-full" />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.gender"
          style="flex-basis: 40%; flex-grow: 1; min-width: 200px">
          <div>Giới tính</div>
          <div>
            <a-radio-group v-model:value="customer.gender" :disabled="!!customer.id">
              <a-radio :value="1">Nam</a-radio>
              <a-radio :value="0">Nữ</a-radio>
            </a-radio-group>
          </div>
        </div>

        <div
          v-if="
            settingStore.SCREEN_CUSTOMER_UPSERT.addressProvince ||
            settingStore.SCREEN_CUSTOMER_UPSERT.addressDistrict ||
            settingStore.SCREEN_CUSTOMER_UPSERT.addressWard ||
            settingStore.SCREEN_CUSTOMER_UPSERT.addressStreet
          "
          style="flex-basis: 80%; flex-grow: 1">
          <div>Địa chỉ</div>
          <div class="flex flex-wrap gap-4">
            <div
              v-if="settingStore.SCREEN_CUSTOMER_UPSERT.addressProvince"
              style="flex-basis: 30%; flex-grow: 1; min-width: 200px"
              class="mb-2">
              <InputHint
                v-model:value="customer.addressProvince"
                :options="provinceList"
                :disabled="!!customer.id"
                :maxHeight="180"
                placeholder="Thành Phố / Tỉnh"
                :logic-filter="(item: string, text: string) => customFilter(item, text)"
                @update:value="handleChangeProvince" />
            </div>
            <div
              v-if="settingStore.SCREEN_CUSTOMER_UPSERT.addressDistrict"
              style="flex-basis: 30%; flex-grow: 1; min-width: 200px"
              class="mb-2">
              <InputHint
                v-model:value="customer.addressDistrict"
                :maxHeight="180"
                :disabled="!!customer.id"
                :options="districtList"
                :logic-filter="(item: string, text: string) => customFilter(item, text)"
                placeholder="Quận / Huyện"
                @update:value="handleChangeDistrict" />
            </div>
            <div
              v-if="settingStore.SCREEN_CUSTOMER_UPSERT.addressWard"
              style="flex-basis: 30%; flex-grow: 1; min-width: 200px"
              class="mb-2">
              <InputHint
                v-model:value="customer.addressWard"
                :maxHeight="180"
                :disabled="!!customer.id"
                :options="wardList"
                placeholder="Phường / Xã"
                :logic-filter="(item: string, text: string) => customFilter(item, text)" />
            </div>
          </div>
          <div
            v-if="settingStore.SCREEN_CUSTOMER_UPSERT.addressStreet"
            style="flex-basis: 300px; flex-grow: 1"
            :disabled="!!customer.id">
            <InputText
              v-model:value="customer.addressStreet"
              :disabled="!!customer.id"
              placeholder="Số nhà / Tòa nhà / Ngõ / Đường" />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.relative"
          :disabled="!!customer.id"
          style="flex-basis: 45%; flex-grow: 1; min-width: 200px">
          <div>Liên hệ khác</div>
          <div>
            <InputText
              v-model:value="customer.relative"
              :disabled="!!customer.id"
              placeholder="Tên người thân, số điện thoại" />
          </div>
        </div>

        <div style="flex-basis: 45%; flex-grow: 1; min-width: 200px">
          <div>Ghi chú</div>
          <div style="flex: 1">
            <InputText v-model:value="customer.note" :disabled="!!customer.id" />
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

        <div style="flex-basis: 45%; flex-grow: 1; min-width: 200px">
          <div>Thời gian đăng ký</div>
          <div>
            <InputDate
              v-model:value="ticketRegister.registeredAt"
              type-parser="number"
              class="w-full"
              show-time />
          </div>
        </div>

        <div style="flex-basis: 45%; flex-grow: 1; min-width: 200px">
          <div>Nguồn khách hàng</div>
          <div>
            <VueSelect
              v-model:value="ticketRegister.customerSourceId"
              :options="customerSourceAll.map((i) => ({ text: i.name, value: i.id }))"></VueSelect>
          </div>
        </div>

        <div style="flex-basis: 90%; flex-grow: 1; min-width: 200px">
          <div>Lý do khám</div>
          <div>
            <InputText v-model:value="ticketAttributeMap.reason" />
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex flex-wrap gap-4">
          <VueButton class="mr-auto btn" icon="close" type="reset" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton class="btn btn-blue" icon="save" type="submit" :loading="saveLoading">
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
