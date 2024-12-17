<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconFileSearch, IconSetting } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import {
  InputDate,
  InputHint,
  InputNumber,
  InputOptions,
  InputText,
  VueSelect,
} from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { AddressInstance } from '../../../core/address.instance'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Appointment, AppointmentApi, AppointmentStatus } from '../../../modules/appointment'
import { CustomerService } from '../../../modules/customer'
import { CustomerSource, CustomerSourceService } from '../../../modules/customer-source'
import { Customer } from '../../../modules/customer/customer.model'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Ticket, TicketStatus, TicketType } from '../../../modules/ticket'
import type { TicketAttributeMap } from '../../../modules/ticket-attribute'
import { TicketClinicApi } from '../../../modules/ticket-clinic'
import { DString, DTimer } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../../customer/upsert/ModalCustomerUpsert.vue'
import ModalTicketClinicCreateSetting from './ModalTicketClinicCreateSetting.vue'
import {
  RoleCommission,
  RoleCommissionService,
  RoleInteractType,
  RoleScreenType,
} from '../../../modules/role-commission'
import { Role, RoleService } from '../../../modules/role'
import { User, UserService } from '../../../modules/user'

const inputOptionsCustomer = ref<InstanceType<typeof InputOptions>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()
const modalTicketClinicCreateSetting = ref<InstanceType<typeof ModalTicketClinicCreateSetting>>()

const ticketClinicCreateForm = ref<InstanceType<typeof HTMLFormElement>>()

const emit = defineEmits<{
  (e: 'success', value: { ticket: Ticket }): void
}>()

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
const roleCommissionList = ref<RoleCommission[]>([])
const userList = ref<User[]>([])
const roleMap = ref<Record<string, Role>>({})

const showModal = ref(false)
const saveLoading = ref(false)

const provinceList = ref<string[]>([])
const districtList = ref<string[]>([])
const wardList = ref<string[]>([])

let firstLoad = true

const openModal = async (ticketStatus: TicketStatus) => {
  showModal.value = true
  ticketRegister.value.ticketStatus = ticketStatus
  ticketRegister.value.registeredAt = Date.now()

  if (firstLoad) {
    firstLoad = false
    CustomerService.refreshDB()
    RoleCommissionService.list({})
      .then((result) => (roleCommissionList.value = result))
      .catch((e) => {
        console.log('🚀 ~ file: ModalTicketClinicCreate.vue RoleCommissionService ~ e:', e)
      })

    RoleService.getMap()
      .then((result) => (roleMap.value = result))
      .catch((e) => {
        console.log('🚀 ~ file: ModalTicketClinicCreate.vue~ RoleService ~ e:', e)
      })

    UserService.list({})
      .then((result) => (userList.value = result))
      .catch((e) => {
        console.log('🚀 ~ file: ModalTicketClinicCreate.vue ~ UserService ~ e:', e)
      })

    if (settingStore.TICKET_CLINIC_CREATE.customerSource) {
      CustomerSourceService.list({})
        .then((result) => (customerSourceAll.value = result))
        .catch((e) => {
          console.log('🚀 ~ file: ModalTicketClinicCreate.vue ~ CustomerSourceService ~ e:', e)
        })
    }

    if (settingStore.TICKET_CLINIC_CREATE.addressFull) {
      AddressInstance.getAllProvinces()
        .then((result) => (provinceList.value = result))
        .catch((e) => {
          console.log('🚀 ~ file: ModalTicketClinicCreate.vue ~ AddressInstance ~ e:', e)
        })
    }
  }
}

const closeModal = () => {
  customerOptions.value = []
  appointmentOptions.value = []

  customer.value = Customer.blank()
  ticketRegister.value = Ticket.blank()

  fromAppointmentId.value = 0
  ticketAttributeMap.value = {}

  showModal.value = false
}

const handleFocusFirstSearchCustomer = async () => {}

const selectCustomer = async (customerSelect: Customer) => {
  if (!customerSelect) {
    return (customer.value = Customer.blank())
  }

  try {
    ticketRegister.value.customerSourceId = customerSelect.customerSourceId
    customer.value = Customer.from(customerSelect)

    const appointmentList = await AppointmentApi.list({
      filter: {
        appointmentStatus: { IN: [AppointmentStatus.Waiting, AppointmentStatus.Confirm] },
        customerId: customerSelect.id,
      },
    })

    appointmentOptions.value = appointmentList.sort((a, b) => {
      return a.registeredAt > b.registeredAt ? 1 : -1
    })
    appointmentOptions.value.forEach((i) => {
      if (DTimer.timeToText(i.registeredAt) === DTimer.timeToText(new Date())) {
        fromAppointmentId.value = i.id
      }
    })
  } catch (error) {
    console.log('🚀 ~ file: ModalTicketClinicCreate.vue:114 ~ selectCustomer ~ error:', error)
  }
}

const searchingCustomer = async (text: string) => {
  if (customer.value.id) {
    customer.value = Customer.blank()
  }
  customer.value.fullName = text
  if (text) {
    const customerList = await CustomerService.search(text)
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
    ticketAttributeMap.value.reason = appointment.reason || ''
    ticketRegister.value.customerSourceId = appointment.customerSourceId
  } else {
    fromAppointmentId.value = 0
    ticketRegister.value.customerSourceId = 0
  }
}

const handleRegisterTicketClinic = async () => {
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
        ticketType: settingStore.TICKET_CLINIC_LIST.ticketType,
        ticketStatus: settingStore.TICKET_CLINIC_LIST.ticketStatus,
        registeredAt: ticketRegister.value.registeredAt,
        customerSourceId: ticketRegister.value.customerSourceId,
      },
      ticketAttributeList: Object.entries(ticketAttributeMap.value)
        .map(([key, value]) => ({ key, value }))
        .filter((i) => !!i.value),
    })
    emit('success', { ticket: ticketResponse })
    closeModal()
  } catch (error) {
    console.log('🚀 ModalTicketClinicCreate.vue:184 ~ handleRegisterTicketClinic ~ error:', error)
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
  districtList.value = await AddressInstance.getDistrictsByProvince(province)
}

const handleChangeDistrict = async (district: string) => {
  if (!district) {
    wardList.value = []
    return
  }
  wardList.value = await AddressInstance.getWardsByProvinceAndDistrict(
    customer.value.addressProvince,
    district
  )
}

const updateDuKienSinh = (value: any) => {
  if (!value) {
    ticketAttributeMap.value.TuoiThai_Tuan = undefined
    ticketAttributeMap.value.TuoiThai_Ngay = undefined
    return
  }

  const toDay = new Date()
  toDay.setHours(0, 0, 0, 0)
  const DuKienSinh = new Date(value)
  DuKienSinh.setHours(0, 0, 0, 0)

  const timeDuKienSinh = DuKienSinh.getTime()
  const timeNgayThuThai = timeDuKienSinh - 40 * 7 * 24 * 60 * 60 * 1000

  const timeDistance = toDay.getTime() - timeNgayThuThai
  if (timeDistance < 0) {
    ticketAttributeMap.value.TuoiThai_Tuan = 0
    ticketAttributeMap.value.TuoiThai_Ngay = 0
    return
  }
  const dayTime = 24 * 60 * 60 * 1000
  const weekTime = 7 * dayTime
  ticketAttributeMap.value.TuoiThai_Tuan = Math.floor(timeDistance / weekTime)
  ticketAttributeMap.value.TuoiThai_Ngay = Math.floor(Math.floor(timeDistance % weekTime) / dayTime)
}

const updateTuoiThaiTuan = (value: number) => {
  const Tuan = value || 0
  const Ngay = ticketAttributeMap.value.TuoiThai_Ngay || 0
  const timeDistance = (Tuan * 7 + Ngay) * 24 * 60 * 60 * 1000

  const toDay = new Date()
  toDay.setHours(0, 0, 0, 0)
  const timeNgayThuThai = toDay.getTime() - timeDistance
  const timeDuKienSinh = timeNgayThuThai + 40 * 7 * 24 * 60 * 60 * 1000

  ticketAttributeMap.value.NgayDuKienSinh = new Date(timeDuKienSinh).toISOString()
}
const updateTuoiThaiNgay = (value: number) => {
  const Tuan = ticketAttributeMap.value.TuoiThai_Tuan || 0
  const Ngay = value || 0
  const timeDistance = (Tuan * 7 + Ngay) * 24 * 60 * 60 * 1000

  const toDay = new Date()
  toDay.setHours(0, 0, 0, 0)
  const timeNgayThuThai = toDay.getTime() - timeDistance
  const timeDuKienSinh = timeNgayThuThai + 40 * 7 * 24 * 60 * 60 * 1000

  ticketAttributeMap.value.NgayDuKienSinh = new Date(timeDuKienSinh).toISOString()
}

const updateTuoiPhoi = (TuoiPhoi: number) => {
  if (!TuoiPhoi) return
  const NgayChuyenPhoiString = ticketAttributeMap.value.NgayChuyenPhoi
  if (!NgayChuyenPhoiString) return
  const NgayChuyenPhoi = new Date(NgayChuyenPhoiString)
  NgayChuyenPhoi.setHours(0, 0, 0, 0)

  const timeNgayThuThai = NgayChuyenPhoi.getTime() - (TuoiPhoi + 14) * 24 * 60 * 60 * 1000
  const timeDuKienSinh = timeNgayThuThai + 40 * 7 * 24 * 60 * 60 * 1000

  ticketAttributeMap.value.NgayDuKienSinh = new Date(timeDuKienSinh).toISOString()
  updateDuKienSinh(timeDuKienSinh)
}

const updateNgayChuyenPhoi = (NgayChuyenPhoiString: any) => {
  if (!NgayChuyenPhoiString) return
  const TuoiPhoi = Number(ticketAttributeMap.value.TuoiPhoi)
  if (!TuoiPhoi) return
  const NgayChuyenPhoi = new Date(NgayChuyenPhoiString)
  NgayChuyenPhoi.setHours(0, 0, 0, 0)

  const timeNgayThuThai = NgayChuyenPhoi.getTime() - (TuoiPhoi + 14) * 24 * 60 * 60 * 1000
  const timeDuKienSinh = timeNgayThuThai + 40 * 7 * 24 * 60 * 60 * 1000

  ticketAttributeMap.value.NgayDuKienSinh = new Date(timeDuKienSinh).toISOString()
  updateDuKienSinh(timeDuKienSinh)
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.modalStyle">
    <form
      ref="ticketClinicCreateForm"
      class="bg-white"
      @submit.prevent="handleRegisterTicketClinic">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Tiếp đón khách hàng mới</div>
        <div
          v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalTicketClinicCreateSetting?.openModal()">
          <IconSetting />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 flex flex-wrap gap-2">
        <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
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

        <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
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
          v-if="settingStore.TICKET_CLINIC_CREATE.birthday"
          :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Ngày sinh</div>
          <div>
            <InputDate
              v-model:value="customer.birthday"
              v-model:year="customer.yearOfBirth"
              :disabled="!!customer.id"
              format="DD/MM/YYYY"
              type-parser="number"
              class="w-full" />
          </div>
        </div>

        <div
          v-if="settingStore.TICKET_CLINIC_CREATE.gender"
          :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Giới tính</div>
          <div>
            <a-radio-group v-model:value="customer.gender" :disabled="!!customer.id">
              <a-radio :value="1">Nam</a-radio>
              <a-radio :value="0">Nữ</a-radio>
            </a-radio-group>
          </div>
        </div>

        <div
          v-if="settingStore.TICKET_CLINIC_CREATE.addressFull"
          style="flex-basis: 80%; flex-grow: 1">
          <div>Địa chỉ</div>
          <div class="flex flex-wrap gap-x-2 gap-y-2">
            <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
              <InputHint
                v-model:value="customer.addressProvince"
                :options="provinceList"
                :disabled="!!customer.id"
                :maxHeight="180"
                placeholder="Thành Phố / Tỉnh"
                :logic-filter="(item: string, text: string) => DString.customFilter(item, text)"
                @update:value="handleChangeProvince" />
            </div>
            <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
              <InputHint
                v-model:value="customer.addressDistrict"
                :maxHeight="180"
                :disabled="!!customer.id"
                :options="districtList"
                :logic-filter="(item: string, text: string) => DString.customFilter(item, text)"
                placeholder="Quận / Huyện"
                @update:value="handleChangeDistrict" />
            </div>
            <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
              <InputHint
                v-model:value="customer.addressWard"
                :maxHeight="180"
                :disabled="!!customer.id"
                :options="wardList"
                placeholder="Phường / Xã"
                :logic-filter="(item: string, text: string) => DString.customFilter(item, text)" />
            </div>
            <div
              :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle"
              :disabled="!!customer.id">
              <InputText
                v-model:value="customer.addressStreet"
                :disabled="!!customer.id"
                placeholder="Số nhà / Tòa nhà / Ngõ / Đường" />
            </div>
          </div>
        </div>

        <div
          v-if="settingStore.TICKET_CLINIC_CREATE.addressBasic"
          :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Địa chỉ</div>
          <div style="flex: 1">
            <InputText
              v-model:value="customer.addressStreet"
              :disabled="!!customer.id"
              placeholder="" />
          </div>
        </div>

        <div
          v-if="settingStore.TICKET_CLINIC_CREATE.relative"
          :disabled="!!customer.id"
          :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Liên hệ khác</div>
          <div>
            <InputText
              v-model:value="customer.relative"
              :disabled="!!customer.id"
              placeholder="Tên người thân, số điện thoại" />
          </div>
        </div>

        <div
          v-if="settingStore.TICKET_CLINIC_CREATE.note"
          :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
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

        <div
          v-if="settingStore.TICKET_CLINIC_CREATE.customerSource"
          :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Nguồn khách hàng</div>
          <div>
            <VueSelect
              v-model:value="ticketRegister.customerSourceId"
              :options="customerSourceAll.map((i) => ({ text: i.name, value: i.id }))"></VueSelect>
          </div>
        </div>

        <div
          v-if="settingStore.TICKET_CLINIC_LIST.ticketType === TicketType.Obstetric"
          style="flex-basis: 80%; flex-grow: 1"
          class="flex gap-2">
          <div style="flex-basis: 400px; flex-grow: 4">
            <div class="flex flex-wrap items-center gap-2 justify-end">
              <div style="flex-basis: 60px">Cơ bản:</div>
              <div style="flex-grow: 2">
                <div style="">PARA</div>
                <div><InputText v-model:value="ticketAttributeMap.PARA" /></div>
              </div>
              <div style="flex-basis: 200px; flex-grow: 1">
                <div style="">Ngày đầu - KKC:</div>
                <div>
                  <InputDate
                    v-model:value="ticketAttributeMap.NgayDauKyKinhCuoi"
                    typeParser="string" />
                </div>
              </div>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2 justify-end">
              <div style="flex-basis: 60px">IVF:</div>
              <div style="flex-grow: 2">
                <div style="">Tuổi phôi (ngày)</div>
                <div>
                  <InputNumber
                    v-model:value="ticketAttributeMap.TuoiPhoi"
                    @update:value="updateTuoiPhoi" />
                </div>
              </div>
              <div style="flex-basis: 200px; flex-grow: 1">
                <div style="">Ngày chuyển phôi</div>
                <div>
                  <InputDate
                    v-model:value="ticketAttributeMap.NgayChuyenPhoi"
                    typeParser="string"
                    @update:value="updateNgayChuyenPhoi" />
                </div>
              </div>
            </div>

            <div class="mt-2 flex flex-wrap items-center gap-2 justify-end">
              <div style="flex-basis: 60px">Tuổi thai:</div>
              <div style="flex-basis: 100px; flex-grow: 1">
                <div style="">Tuần</div>
                <div>
                  <InputNumber
                    v-model:value="ticketAttributeMap.TuoiThai_Tuan"
                    @update:value="updateTuoiThaiTuan" />
                </div>
              </div>
              <div style="flex-basis: 100px; flex-grow: 1">
                <div style="">Ngày</div>
                <div>
                  <InputNumber
                    v-model:value="ticketAttributeMap.TuoiThai_Ngay"
                    @update:value="updateTuoiThaiNgay" />
                </div>
              </div>
              <div style="flex-basis: 200px; flex-grow: 1">
                <div style="">Dự kiến sinh</div>
                <div>
                  <InputDate
                    v-model:value="ticketAttributeMap.NgayDuKienSinh"
                    typeParser="string"
                    @update:value="updateDuKienSinh" />
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-col" style="flex-basis: 200px; flex-grow: 1">
            <div>Chỉ số sinh tồn</div>
            <div class="grow pb-4" style="border: 1px solid #d1d5db">
              <table class="table-vital-signs">
                <tbody>
                  <tr>
                    <td class="title-vital-signs">Mạch</td>
                    <td>:</td>
                    <td class="input-vital-signs">
                      <input v-model="ticketAttributeMap.pulse" type="number" />
                    </td>
                    <td class="unit-vital-signs">l/p</td>
                  </tr>
                  <tr>
                    <td class="title-vital-signs">Huyết áp</td>
                    <td>:</td>
                    <td class="input-vital-signs">
                      <input v-model="ticketAttributeMap.bloodPressure" />
                    </td>
                    <td class="unit-vital-signs">mmHg</td>
                  </tr>
                  <tr>
                    <td class="title-vital-signs">Chiều cao</td>
                    <td>:</td>
                    <td class="input-vital-signs">
                      <input v-model="ticketAttributeMap.height" type="number" />
                    </td>
                    <td class="unit-vital-signs">cm</td>
                  </tr>
                  <tr>
                    <td class="title-vital-signs">Cân nặng</td>
                    <td>:</td>
                    <td class="input-vital-signs">
                      <input v-model="ticketAttributeMap.weight" type="number" />
                    </td>
                    <td class="unit-vital-signs">kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Thời gian đăng ký khám</div>
          <div>
            <InputDate
              v-model:value="ticketRegister.registeredAt"
              type-parser="number"
              class="w-full"
              show-time />
          </div>
        </div>

        <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Lý do khám</div>
          <div>
            <InputText v-model:value="ticketAttributeMap.reason" />
          </div>
        </div>

        <div class="flex flex-wrap gap-2" style="flex-basis: 90%; flex: 1; min-width: 600px">
          <div
            v-for="(roleCommission, index) in roleCommissionList"
            :key="index"
            style="flex-basis: 45%; flex: 1; min-width: 300px">
            <div>{{ roleMap[roleCommission.roleId]?.displayName }}</div>
            <div>
              <InputText
                v-model:value="customer.phone"
                :disabled="!!customer.id"
                pattern="[0][356789][0-9]{8}"
                title="Định dạng số điện thoại không đúng"
                @update:value="(e) => (customer.phone = e.replace(/ /g, ''))" />
            </div>
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
  <ModalTicketClinicCreateSetting
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalTicketClinicCreateSetting" />
</template>

<style lang="scss" scoped>
.table-vital-signs {
  td.title-vital-signs {
    // font-size: 13px;
    padding: 4px 4px 4px 8px;
    white-space: nowrap;
  }
  td.unit-vital-signs {
    // font-size: 13px;
    padding: 4px 8px 4px 8px;
    white-space: nowrap;
  }
  td.input-vital-signs {
    padding-left: 8px;
  }
  input {
    padding-left: 0.5rem;
    text-align: left;
    font-style: italic;
    width: 100%;
    border-top: none;
    border-left: none;
    border-right: none;
    border-bottom: 1px solid #cdcdcd;
    &:focus {
      outline: none;
    }
  }
}
</style>
