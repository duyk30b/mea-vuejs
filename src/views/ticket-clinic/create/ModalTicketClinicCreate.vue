<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconFileSearch, IconSetting } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import {
  InputCheckbox,
  InputDate,
  InputFilter,
  InputHint,
  InputNumber,
  InputText,
  VueSelect,
} from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { AddressInstance } from '../../../core/address.instance'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Appointment, AppointmentApi, AppointmentStatus } from '../../../modules/appointment'
import { InteractType } from '../../../modules/commission'
import { CustomerService } from '../../../modules/customer'
import { CustomerSource, CustomerSourceService } from '../../../modules/customer-source'
import { Customer } from '../../../modules/customer/customer.model'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Role, RoleService } from '../../../modules/role'
import { Ticket, TicketService, TicketStatus, TicketType } from '../../../modules/ticket'
import type {
  TicketAttributeKeyGeneralType,
  TicketAttributeMap,
} from '../../../modules/ticket-attribute'
import { TicketClinicApi } from '../../../modules/ticket-clinic'
import { TicketUser } from '../../../modules/ticket-user'
import { User, UserService } from '../../../modules/user'
import { UserRoleService } from '../../../modules/user-role'
import { DString, DTimer } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../../customer/upsert/ModalCustomerUpsert.vue'
import ModalTicketClinicCreateSetting from './ModalTicketClinicCreateSetting.vue'

const inputFilterCustomer = ref<InstanceType<typeof InputFilter>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()
const modalTicketClinicCreateSetting = ref<InstanceType<typeof ModalTicketClinicCreateSetting>>()

const ticketClinicCreateForm = ref<InstanceType<typeof HTMLFormElement>>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const customerSourceAll = ref<CustomerSource[]>([])
const customerOptions = ref<{ value: number; text: string; data: Customer }[]>([])
const appointmentOptions = ref<Appointment[]>([])

const customer = ref<Customer>(Customer.blank())
const ticket = ref<Ticket>(Ticket.blank())

const ticketUserList = ref<TicketUser[]>([])
const ticketAttributeMap = ref<TicketAttributeMap>({})

const fromAppointmentId = ref(0)
const roleMap = ref<Record<string, Role>>({})

const userRoleMapRoleIdOptions = ref<Record<string, { value: number; text: string; data: User }[]>>(
  {}
)

const showModal = ref(false)
const saveLoading = ref(false)

const provinceList = ref<string[]>([])
const districtList = ref<string[]>([])
const wardList = ref<string[]>([])

const openModal = async (ticketId?: number) => {
  showModal.value = true

  Promise.all([
    ticketId
      ? TicketService.detail(ticketId, {
          relation: { customer: true, ticketAttributeList: true, ticketUserList: {} },
        })
      : Ticket.blank(),
    RoleService.getMap(),
    UserService.getMap(),
    UserRoleService.list(),
  ])
    .then((result) => {
      if (!ticketId) {
        ticket.value.registeredAt = Date.now()
        customer.value = Customer.blank()
      } else {
        ticket.value = result[0]
        customer.value = Customer.from(result[0].customer || Customer.blank())
      }
      roleMap.value = result[1]
      const userMap = result[2]
      const userRoleList = result[3]

      userRoleList.forEach((i) => {
        const key = i.roleId
        if (!userRoleMapRoleIdOptions.value[key]) {
          userRoleMapRoleIdOptions.value[key] = []
        }
        userRoleMapRoleIdOptions.value[key].push({
          value: userMap[i.userId]?.id || 0,
          text: userMap[i.userId]?.fullName || '',
          data: userMap[i.userId],
        })
      })
      refreshTicketUserList()
    })
    .catch((e) => {
      console.log('🚀 ~ file: ModalTicketClinicCreate.vue ~ openModal 91 ~ e:', e)
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

const closeModal = () => {
  customerOptions.value = []
  appointmentOptions.value = []

  customer.value = Customer.blank()
  ticket.value = Ticket.blank()
  ticketUserList.value = []
  ticketAttributeMap.value = {}
  userRoleMapRoleIdOptions.value = {}

  fromAppointmentId.value = 0

  showModal.value = false
}

const selectCustomer = async (customerSelect: Customer) => {
  if (!customerSelect) {
    customer.value = Customer.blank()
    return
  }
  customer.value = Customer.from(customerSelect)
  try {
    ticket.value.customerSourceId = customerSelect.customerSourceId

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
    console.log('🚀 ~ file: ModalTicketClinicCreate.vue:167 ~ selectCustomer ~ error:', error)
  }
}

const searchingCustomer = async (text: string) => {
  customer.value = Customer.blank()
  if (text) {
    const customerList = await CustomerService.list({
      filter: {
        isActive: 1,
        searchText: text,
      },
      limit: 20,
    })
    customerOptions.value = customerList.map((i) => ({
      value: i.id,
      text: i.fullName,
      data: i,
    }))
  } else {
    customerOptions.value = []
  }
  appointmentOptions.value = []
}

const handleModalCustomerUpsertSuccess = (
  customerSelect: Customer,
  type: 'CREATE' | 'UPDATE' | 'DELETE'
) => {
  selectCustomer(customerSelect)
}

const handleChangeCheckboxAppointment = (e: Event, appointment: Appointment) => {
  if ((e.target as HTMLInputElement).checked) {
    fromAppointmentId.value = appointment.id
    ticketAttributeMap.value.reason = appointment.reason || ''
    ticket.value.customerSourceId = appointment.customerSourceId
  } else {
    fromAppointmentId.value = 0
    ticket.value.customerSourceId = 0
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

const updateDuKienSinh = (DuKienSinhAny: any) => {
  if (!DuKienSinhAny) {
    ticketAttributeMap.value.TuoiThai_Tuan = undefined
    ticketAttributeMap.value.TuoiThai_Ngay = undefined
    return
  }
  const toDay = new Date()
  toDay.setHours(0, 0, 0, 0)
  const DuKienSinh = new Date(DuKienSinhAny)
  DuKienSinh.setHours(0, 0, 0, 0)
  ticketAttributeMap.value.NgayDuKienSinh = DuKienSinh.toISOString()

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
  ticketAttributeMap.value.TuoiThai_Tuan = value
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
  ticketAttributeMap.value.TuoiThai_Ngay = value
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
  ticketAttributeMap.value.TuoiPhoi = TuoiPhoi
  if (!TuoiPhoi) return
  const NgayChuyenPhoiString = ticketAttributeMap.value.NgayChuyenPhoi
  if (!NgayChuyenPhoiString) return
  const NgayChuyenPhoi = new Date(NgayChuyenPhoiString)
  NgayChuyenPhoi.setHours(0, 0, 0, 0)

  const timeNgayThuThai = NgayChuyenPhoi.getTime() - (TuoiPhoi + 14) * 24 * 60 * 60 * 1000
  const timeDuKienSinh = timeNgayThuThai + 40 * 7 * 24 * 60 * 60 * 1000

  updateDuKienSinh(timeDuKienSinh)
}

const updateNgayChuyenPhoi = (NgayChuyenPhoiString: any) => {
  ticketAttributeMap.value.NgayChuyenPhoi = NgayChuyenPhoiString
  if (!NgayChuyenPhoiString) return
  const TuoiPhoi = Number(ticketAttributeMap.value.TuoiPhoi)
  if (!TuoiPhoi) return
  const NgayChuyenPhoi = new Date(NgayChuyenPhoiString)
  NgayChuyenPhoi.setHours(0, 0, 0, 0)

  const timeNgayThuThai = NgayChuyenPhoi.getTime() - (TuoiPhoi + 14) * 24 * 60 * 60 * 1000
  const timeDuKienSinh = timeNgayThuThai + 40 * 7 * 24 * 60 * 60 * 1000

  updateDuKienSinh(timeDuKienSinh)
}

const refreshTicketUserList = () => {
  const screenRoleIdList = settingStore.TICKET_CLINIC_CREATE.roleIdList
  ticketUserList.value = screenRoleIdList.map((roleId) => {
    let findExist = (ticket.value.ticketUserList || []).find((i) => {
      if (i.roleId !== roleId) return false
      if (i.interactType !== InteractType.Ticket) return false
      if (i.interactId !== 0) return false
      return true
    })
    let temp: TicketUser
    if (findExist) {
      temp = TicketUser.from(findExist)
    } else {
      temp = TicketUser.blank()
      temp.roleId = roleId
    }
    return temp
  })
}

const handleModalTicketClinicCreateSettingSuccess = () => {
  refreshTicketUserList()
}

const handleClickDestroy = async () => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa lượt khám này ?',
    content: 'Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    onOk: async () => {
      try {
        await TicketClinicApi.destroy(ticket.value.id)
        AlertStore.addSuccess('Xóa phiếu khám thành công')
        emit('success')
        closeModal()
      } catch (error) {
        console.log('🚀 ModalTicketClinicCreate.vue:356 ~ handleClickDestroy: ~ error:', error)
      }
    },
  })
}

const handleSubmitFormTicketClinic = async () => {
  saveLoading.value = true
  try {
    const ticketAttributeList = Object.entries(ticketAttributeMap.value).map(([key, value]) => ({
      key,
      value: value != null ? value : '',
    }))

    if (!ticket.value.id) {
      if (DTimer.timeToText(ticket.value.registeredAt) !== DTimer.timeToText(new Date())) {
        return AlertStore.addError(
          'Thời gian đăng ký khám không hợp lệ. Chỉ được đăng ký khám trong ngày'
        )
      }
      if (customer.value.healthHistory) {
        const key: TicketAttributeKeyGeneralType = 'healthHistory'
        ticketAttributeList.push({
          value: customer.value.healthHistory,
          key,
        })
      }
      await TicketClinicApi.create({
        customer: customer.value,
        ticketInformation: {
          ticketType: settingStore.TICKET_CLINIC_LIST.ticketType,
          ticketStatus: settingStore.TICKET_CLINIC_CREATE.ticketStatus,
          customType: ticket.value.customType,
          registeredAt: ticket.value.registeredAt,
          customerSourceId: ticket.value.customerSourceId,
          customerId: customer.value.id,
          fromAppointmentId: fromAppointmentId.value,
        },
        ticketAttributeList,
        ticketUserList: ticketUserList.value,
      })
      emit('success')
    }
    if (ticket.value.id) {
      await TicketClinicApi.update({
        ticketId: ticket.value.id,
        ticketInformation: {
          registeredAt: ticket.value.registeredAt,
          customType: ticket.value.customType,
          customerSourceId: ticket.value.customerSourceId,
        },
        ticketAttributeList,
        ticketUserList: ticketUserList.value,
      })
      emit('success')
    }

    closeModal()
  } catch (error) {
    console.log('🚀 ModalTicketClinicCreate.vue:369 ~ handleSubmitFormTicketClinic ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.modalStyle">
    <form
      ref="ticketClinicCreateForm"
      class="bg-white"
      @submit.prevent="handleSubmitFormTicketClinic">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          <span v-if="!ticket.customerId">Tiếp đón khách hàng mới</span>
          <span v-if="!!ticket.customerId">Sửa thông tin tiếp đón</span>
        </div>
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
                <a class="ml-1" @click="modalCustomerDetail?.openModal(customer.id)">
                  <IconFileSearch />
                </a>
              </span>
            </div>
            <a
              v-if="customer?.id && permissionIdMap[PermissionId.CUSTOMER_UPDATE]"
              @click="modalCustomerUpsert?.openModal(customer)">
              Sửa thông tin khách hàng
            </a>
          </div>
          <div style="height: 40px">
            <InputFilter
              ref="inputFilterCustomer"
              v-model:value="customer.id"
              v-model:text="customer.fullName"
              :options="customerOptions"
              :maxHeight="200"
              :disabled="!!ticket.customerId"
              placeholder="Tìm kiếm bằng tên hoặc SĐT"
              required
              noClearTextWhenNotSelected
              message-no-result="Khách hàng này chưa từng đến khám"
              @selectItem="({ data }: any) => selectCustomer(data)"
              @searching="searchingCustomer">
              <template #option="{ item: { data } }">
                <div>
                  <b>{{ data.fullName }}</b>
                  - {{ DString.formatPhone(data.phone) }} -
                  {{ DTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
                </div>
                <div>{{ DString.formatAddress(data) }}</div>
              </template>
            </InputFilter>
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
              @update:value="(e: string) => (customer.phone = e.replace(/ /g, ''))" />
          </div>
        </div>

        <template v-if="!ticket.customerId">
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
                  :logic-filter="
                    (item: string, text: string) => DString.customFilter(item, text)
                  " />
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
        </template>

        <div v-if="appointmentOptions.length" class="grow basis-[80%]">
          <div>Khách hàng đến theo hẹn ?</div>
          <div class="ml-4">
            <div v-for="(appointment, index) in appointmentOptions" :key="index">
              <InputCheckbox
                :checked="fromAppointmentId === appointment.id"
                @change="(e: Event) => handleChangeCheckboxAppointment(e, appointment)">
                <span>{{ DTimer.timeToText(appointment.registeredAt, 'DD/MM/YYYY hh:mm ') }}</span>
                <span>- Lý do: {{ appointment.reason }}</span>
              </InputCheckbox>
            </div>
          </div>
        </div>

        <div
          v-if="settingStore.TICKET_CLINIC_CREATE.customerSource"
          :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Nguồn khách hàng</div>
          <div>
            <VueSelect
              v-model:value="ticket.customerSourceId"
              :options="
                customerSourceAll.map((i: CustomerSource) => ({ text: i.name, value: i.id }))
              "></VueSelect>
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
                <div>
                  <InputText
                    :value="
                      ticketAttributeMap.PARA != null
                        ? ticketAttributeMap.PARA
                        : ticket.ticketAttributeMap.PARA || ''
                    "
                    @update:value="(v: string) => (ticketAttributeMap.PARA = v)" />
                </div>
              </div>
              <div style="flex-basis: 200px; flex-grow: 1">
                <div style="">Ngày đầu - KKC:</div>
                <div>
                  <InputDate
                    :value="
                      ticketAttributeMap.NgayDauKyKinhCuoi != null
                        ? ticketAttributeMap.NgayDauKyKinhCuoi
                        : ticket.ticketAttributeMap.NgayDauKyKinhCuoi || ''
                    "
                    typeParser="string"
                    @update:value="(v: any) => (ticketAttributeMap.NgayDauKyKinhCuoi = v)" />
                </div>
              </div>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2 justify-end">
              <div style="flex-basis: 60px">IVF:</div>
              <div style="flex-grow: 2">
                <div style="">Tuổi phôi (ngày)</div>
                <div>
                  <InputNumber
                    :value="
                      ticketAttributeMap.TuoiPhoi != null
                        ? ticketAttributeMap.TuoiPhoi
                        : ticket.ticketAttributeMap.TuoiPhoi || ''
                    "
                    @update:value="updateTuoiPhoi" />
                </div>
              </div>
              <div style="flex-basis: 200px; flex-grow: 1">
                <div style="">Ngày chuyển phôi</div>
                <div>
                  <InputDate
                    :value="
                      ticketAttributeMap.NgayChuyenPhoi != null
                        ? ticketAttributeMap.NgayChuyenPhoi
                        : ticket.ticketAttributeMap.NgayChuyenPhoi || ''
                    "
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
                    :value="
                      ticketAttributeMap.TuoiThai_Tuan != null
                        ? ticketAttributeMap.TuoiThai_Tuan
                        : ticket.ticketAttributeMap.TuoiThai_Tuan || ''
                    "
                    @update:value="updateTuoiThaiTuan" />
                </div>
              </div>
              <div style="flex-basis: 100px; flex-grow: 1">
                <div style="">Ngày</div>
                <div>
                  <InputNumber
                    :value="
                      ticketAttributeMap.TuoiThai_Ngay != null
                        ? ticketAttributeMap.TuoiThai_Ngay
                        : ticket.ticketAttributeMap.TuoiThai_Ngay || ''
                    "
                    @update:value="updateTuoiThaiNgay" />
                </div>
              </div>
              <div style="flex-basis: 200px; flex-grow: 1">
                <div style="">Dự kiến sinh</div>
                <div>
                  <InputDate
                    :value="
                      ticketAttributeMap.NgayDuKienSinh != null
                        ? ticketAttributeMap.NgayDuKienSinh
                        : ticket.ticketAttributeMap.NgayDuKienSinh || ''
                    "
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
                      <input
                        :value="
                          ticketAttributeMap.pulse != null
                            ? ticketAttributeMap.pulse
                            : ticket.ticketAttributeMap.pulse || ''
                        "
                        type="number"
                        @input="(e: any) => (ticketAttributeMap.pulse = e.target.value)" />
                    </td>
                    <td class="unit-vital-signs">l/p</td>
                  </tr>
                  <tr>
                    <td class="title-vital-signs">Huyết áp</td>
                    <td>:</td>
                    <td class="input-vital-signs">
                      <input
                        :value="
                          ticketAttributeMap.bloodPressure != null
                            ? ticketAttributeMap.bloodPressure
                            : ticket.ticketAttributeMap.bloodPressure || ''
                        "
                        @input="(e: any) => (ticketAttributeMap.bloodPressure = e.target.value)" />
                    </td>
                    <td class="unit-vital-signs">mmHg</td>
                  </tr>
                  <tr>
                    <td class="title-vital-signs">Chiều cao</td>
                    <td>:</td>
                    <td class="input-vital-signs">
                      <input
                        type="number"
                        :value="
                          ticketAttributeMap.height != null
                            ? ticketAttributeMap.height
                            : ticket.ticketAttributeMap.height || ''
                        "
                        @input="(e: any) => (ticketAttributeMap.height = e.target.value)" />
                    </td>
                    <td class="unit-vital-signs">cm</td>
                  </tr>
                  <tr>
                    <td class="title-vital-signs">Cân nặng</td>
                    <td>:</td>
                    <td class="input-vital-signs">
                      <input
                        type="number"
                        :value="
                          ticketAttributeMap.weight != null
                            ? ticketAttributeMap.weight
                            : ticket.ticketAttributeMap.weight || ''
                        "
                        @input="(e: any) => (ticketAttributeMap.weight = e.target.value)" />
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
              v-model:value="ticket.registeredAt"
              type-parser="number"
              class="w-full"
              show-time />
          </div>
        </div>

        <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Tủy chỉnh phân loại</div>
          <div>
            <VueSelect
              v-model:value="ticket.customType"
              :options="
                settingStore.TICKET_CLINIC_LIST.customTypeText.map((i, index) => ({
                  text: i,
                  value: index,
                }))
              "></VueSelect>
          </div>
        </div>

        <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Lý do khám</div>
          <div>
            <InputText
              :value="
                ticketAttributeMap.reason != null
                  ? ticketAttributeMap.reason
                  : ticket.ticketAttributeMap.reason || ''
              "
              @update:value="(v: string) => (ticketAttributeMap.reason = v)" />
          </div>
        </div>

        <div
          v-if="ticketUserList?.length"
          class="flex flex-wrap gap-2 mb-10"
          style="flex-basis: 90%; flex: 1; min-width: 700px">
          <div
            v-for="(ticketUser, index) in ticketUserList"
            :key="index"
            style="flex-basis: 45%; flex: 1; min-width: 300px">
            <div>
              {{
                roleMap[ticketUser.roleId]?.displayName || roleMap[ticketUser.roleId]?.name || ''
              }}
            </div>
            <div>
              <InputFilter
                v-model:value="ticketUserList[index].userId"
                :options="userRoleMapRoleIdOptions[ticketUser.roleId] || []"
                :maxHeight="200"
                placeholder="Tên của nhân viên">
                <template #option="{ item: { data } }">
                  <div>
                    <b>{{ data.fullName }}</b>
                    - {{ DString.formatPhone(data.phone) }} -
                  </div>
                </template>
              </InputFilter>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex flex-wrap gap-4">
          <VueButton
            v-if="
              ticket.id && [TicketStatus.Schedule, TicketStatus.Draft].includes(ticket.ticketStatus)
            "
            color="red"
            icon="trash"
            @click="handleClickDestroy">
            Xóa
          </VueButton>
          <VueButton class="ml-auto" icon="close" type="reset" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton class="btn btn-blue" icon="save" type="submit" :loading="saveLoading">
            <span v-if="!ticket.id">ĐĂNG KÝ KHÁM</span>
            <span v-else>CẬP NHẬT THÔNG TIN</span>
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalCustomerUpsert ref="modalCustomerUpsert" @success="handleModalCustomerUpsertSuccess" />
  <ModalTicketClinicCreateSetting
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalTicketClinicCreateSetting"
    @success="handleModalTicketClinicCreateSettingSuccess" />
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
