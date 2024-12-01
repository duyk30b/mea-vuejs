<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconFileSearch, IconSetting } from '../../../common/icon'
import { InputDate, InputHint, InputOptions, InputText, VueSelect } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { AddressInstance } from '../../../core/address.instance'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Appointment, AppointmentApi, AppointmentStatus } from '../../../modules/appointment'
import { Customer, useCustomerStore } from '../../../modules/customer'
import { CustomerSource, CustomerSourceService } from '../../../modules/customer-source'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { DString, DTimer } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../../customer/upsert/ModalCustomerUpsert.vue'
import ModalAppointmentUpsertSetting from './ModalAppointmentUpsertSetting.vue'

const modalAppointmentUpsertSetting = ref<InstanceType<typeof HTMLFormElement>>()
const appointmentRegisterForm = ref<InstanceType<typeof HTMLFormElement>>()
const inputOptionsCustomer = ref<InstanceType<typeof InputOptions>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const router = useRouter()

const customerStore = useCustomerStore()
const settingStore = useSettingStore()
const { formatMoney } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const saveLoading = ref(false)

const customerOptions = ref<{ value: number; text: string; data: Customer }[]>([])
const customerSourceAll = ref<CustomerSource[]>([])

const appointment = ref<Appointment>(Appointment.blank())

const provinceList = ref<string[]>([])
const districtList = ref<string[]>([])
const wardList = ref<string[]>([])

const now = new Date()
now.setMinutes(0, 0)

const openModalForCreate = async () => {
  showModal.value = true
  appointment.value = Appointment.blank()

  const now = new Date()
  now.setMinutes(0, 0)
  now.setHours(now.getHours() + 1)
  appointment.value.registeredAt = now.getTime()
  customerSourceAll.value = await CustomerSourceService.list({})
  if (settingStore.APPOINTMENT_UPSERT.customerSource) {
    customerSourceAll.value = await CustomerSourceService.list({})
  }
  if (settingStore.APPOINTMENT_UPSERT.addressFull) {
    provinceList.value = await AddressInstance.getAllProvinces()
  }
}

const openModalForUpdate = async (appointmentProp: Appointment) => {
  showModal.value = true
  appointment.value = Appointment.from(appointmentProp)
  nextTick(() => {
    inputOptionsCustomer.value?.setItem({
      text: appointment.value.customer?.fullName,
      data: appointment.value.customer,
      value: appointment.value.customer?.id,
    })
  })
  if (settingStore.APPOINTMENT_UPSERT.customerSource) {
    customerSourceAll.value = await CustomerSourceService.list({})
  }
}

const closeModal = () => {
  customerOptions.value = []

  appointment.value = Appointment.blank()

  showModal.value = false
}

const handleUpsertAppointment = async () => {
  saveLoading.value = true

  if (appointment.value.appointmentStatus !== AppointmentStatus.Cancelled) {
    appointment.value.cancelReason = ''
  }

  try {
    if (!appointment.value.id) {
      appointment.value.fromTicketId = 0
      await AppointmentApi.createOne(appointment.value)
    } else {
      await AppointmentApi.updateOne(appointment.value.id, appointment.value)
    }
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:106 ~  ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const createCustomer = (instance?: Customer) => {
  inputOptionsCustomer.value?.setItem({
    text: instance?.fullName,
    data: instance,
    value: instance?.id,
  })
  selectCustomer(instance)
}

const selectCustomer = async (customerSelect?: Customer) => {
  if (customerSelect) {
    appointment.value.customerId = customerSelect.id
    appointment.value.customerSourceId = customerSelect.customerSourceId
    appointment.value.customer = Customer.from(customerSelect)
  } else {
    appointment.value.customerId = 0
    appointment.value.customerSourceId = 0
    appointment.value.customer = Customer.blank()
  }
}

const searchingCustomer = async (text: string) => {
  appointment.value.customer = Customer.blank()
  appointment.value.customerId = 0
  appointment.value.customer.fullName = text
  if (text) {
    const customerList = await customerStore.search(text)
    customerOptions.value = customerList.map((i) => ({
      value: i.id,
      text: i.fullName,
      data: i,
    }))
  } else {
    customerOptions.value = []
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
    appointment.value.customer!.addressProvince,
    district
  )
}

const openBlankCustomerSourceList = async () => {
  let route = router.resolve({
    name: 'CustomerSourceList',
  })
  window.open(route.href, '_blank')
}

defineExpose({ openModalForCreate, openModalForUpdate })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form
      ref="appointmentRegisterForm"
      class="bg-white pb-2"
      @submit.prevent="handleUpsertAppointment">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ appointment.id ? 'Cập nhật lịch hẹn' : 'Tạo lịch hẹn mới' }}
        </div>
        <div
          v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalAppointmentUpsertSetting?.openModal()">
          <IconSetting />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 gap-4 flex flex-wrap">
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div class="flex justify-between">
            <div>
              <span>Tên KH</span>
              <span v-if="appointment.customer!.id">
                (nợ cũ:
                <b>{{ formatMoney(appointment.customer!.debt) }}</b>
                )
                <a class="ml-1" @click="modalCustomerDetail?.openModal(appointment.customer!)">
                  <IconFileSearch />
                </a>
              </span>
            </div>
            <a
              v-if="appointment.customer!.id && permissionIdMap[PermissionId.CUSTOMER_UPDATE]"
              @click="modalCustomerUpsert?.openModal(appointment.customer!)">
              Sửa thông tin khách hàng
            </a>
          </div>
          <div style="height: 40px">
            <InputOptions
              ref="inputOptionsCustomer"
              :disabled="!!appointment.id"
              :options="customerOptions"
              :maxHeight="260"
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
                <div>{{ DString.formatAddress(data) }}</div>
              </template>
            </InputOptions>
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Số điện thoại</div>
          <div style="height: 40px">
            <InputText
              v-model:value="appointment.customer!.phone"
              :disabled="!!appointment.customer!.id"
              pattern="[0][356789][0-9]{8}"
              title="Định dạng số điện thoại không đúng"
              @update:value="(e) => (appointment.customer!.phone = e.replace(/ /g, ''))" />
          </div>
        </div>

        <div
          v-if="settingStore.APPOINTMENT_UPSERT.birthday"
          style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Ngày sinh</div>
          <div>
            <InputDate
              v-model:value="appointment.customer!.birthday"
              v-model:year="appointment.customer!.yearOfBirth"
              :disabled="!!appointment.customer!.id"
              format="DD/MM/YYYY"
              type-parser="number"
              class="w-full" />
          </div>
        </div>

        <div
          v-if="settingStore.APPOINTMENT_UPSERT.gender"
          style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Giới tính</div>
          <div>
            <a-radio-group
              v-model:value="appointment.customer!.gender"
              :disabled="!!appointment.customer!.id">
              <a-radio :value="1">Nam</a-radio>
              <a-radio :value="0">Nữ</a-radio>
            </a-radio-group>
          </div>
        </div>

        <div
          v-if="settingStore.APPOINTMENT_UPSERT.addressFull"
          style="flex-basis: 80%; flex-grow: 1">
          <div>Địa chỉ</div>
          <div class="flex flex-wrap gap-x-4 gap-y-2">
            <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
              <InputHint
                v-model:value="appointment.customer!.addressProvince"
                :options="provinceList"
                :disabled="!!appointment.customer!.id"
                :maxHeight="180"
                placeholder="Thành Phố / Tỉnh"
                :logic-filter="(item: string, text: string) => DString.customFilter(item, text)"
                @update:value="handleChangeProvince" />
            </div>
            <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
              <InputHint
                v-model:value="appointment.customer!.addressDistrict"
                :maxHeight="180"
                :disabled="!!appointment.customer!.id"
                :options="districtList"
                :logic-filter="(item: string, text: string) => DString.customFilter(item, text)"
                placeholder="Quận / Huyện"
                @update:value="handleChangeDistrict" />
            </div>
            <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
              <InputHint
                v-model:value="appointment.customer!.addressWard"
                :maxHeight="180"
                :disabled="!!appointment.customer!.id"
                :options="wardList"
                placeholder="Phường / Xã"
                :logic-filter="(item: string, text: string) => DString.customFilter(item, text)" />
            </div>
            <div
              style="flex-basis: 40%; flex-grow: 1; min-width: 300px"
              :disabled="!!appointment.customer!.id">
              <InputText
                v-model:value="appointment.customer!.addressStreet"
                :disabled="!!appointment.customer!.id"
                placeholder="Số nhà / Tòa nhà / Ngõ / Đường" />
            </div>
          </div>
        </div>

        <div
          v-if="settingStore.APPOINTMENT_UPSERT.addressBasic"
          style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Địa chỉ</div>
          <div style="flex: 1">
            <InputText
              v-model:value="appointment.customer!.addressStreet"
              :disabled="!!appointment.customer!.id"
              placeholder="" />
          </div>
        </div>

        <div
          v-if="settingStore.APPOINTMENT_UPSERT.relative"
          :disabled="!!appointment.customer!.id"
          style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Liên hệ khác</div>
          <div>
            <InputText
              v-model:value="appointment.customer!.relative"
              :disabled="!!appointment.customer!.id"
              placeholder="Tên người thân, số điện thoại" />
          </div>
        </div>

        <div
          v-if="settingStore.APPOINTMENT_UPSERT.note"
          style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Ghi chú</div>
          <div style="flex: 1">
            <InputText
              v-model:value="appointment.customer!.note"
              :disabled="!!appointment.customer!.id" />
          </div>
        </div>

        <div
          v-if="settingStore.APPOINTMENT_UPSERT.customerSource"
          style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Nguồn khách hàng</div>
          <div>
            <VueSelect
              v-model:value="appointment.customerSourceId"
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

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Thời gian hẹn</div>
          <div>
            <InputDate v-model:value="appointment.registeredAt" type-parser="number" show-time />
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Xác nhận</div>
          <div v-if="appointment.appointmentStatus !== AppointmentStatus.Completed">
            <VueSelect
              v-model:value="appointment.appointmentStatus"
              :options="[
                { text: 'Chờ KH xác nhận', value: AppointmentStatus.Waiting },
                { text: 'KH đã xác nhận', value: AppointmentStatus.Confirm },
                ...(appointment.id
                  ? [{ text: 'Hủy hẹn', value: AppointmentStatus.Cancelled }]
                  : []),
              ]" />
          </div>
          <div v-if="appointment.appointmentStatus === AppointmentStatus.Completed">
            <VueSelect
              :value="appointment.appointmentStatus"
              disabled
              :options="[
                { text: 'KH đã đến khám', value: AppointmentStatus.Completed, disabled: true },
              ]" />
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Lý do hẹn</div>
          <div>
            <InputText v-model:value="appointment.reason" />
            <!-- <InputHint
              v-model:value="appointment.reason"
              :options="[]"
              :logic-filter="(item: string, text: string) => customFilter(item, text)" /> -->
          </div>
        </div>

        <div
          v-if="appointment.appointmentStatus == AppointmentStatus.Cancelled"
          style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Lý do hủy</div>
          <div>
            <InputHint
              v-model:value="appointment.cancelReason"
              :options="[]"
              :logic-filter="(item: string, text: string) => DString.customFilter(item, text)" />
          </div>
        </div>
      </div>

      <div class="p-4 mt-4">
        <div class="flex flex-wrap gap-4">
          <VueButton class="mr-auto btn" type="reset" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton
            class="btn btn-blue"
            type="submit"
            icon="save"
            :loading="saveLoading"
            :disabled="appointment.appointmentStatus === AppointmentStatus.Completed">
            <span v-if="!appointment.id">TẠO LỊCH HẸN</span>
            <span v-else>CẬP NHẬT LỊCH HẸN</span>
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalCustomerUpsert ref="modalCustomerUpsert" @success="createCustomer" />
  <ModalAppointmentUpsertSetting
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalAppointmentUpsertSetting" />
</template>

<style lang="scss"></style>
