<script setup lang="ts">
import { nextTick, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconFileSearch } from '../../../common/icon'
import { InputDate, InputHint, InputOptions, InputText, VueSelect } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Appointment, AppointmentApi, AppointmentStatus } from '../../../modules/appointment'
import { Customer, useCustomerStore } from '../../../modules/customer'
import { CustomerSource, CustomerSourceService } from '../../../modules/customer-source'
import type { VoucherType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { DTimer, customFilter } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../../customer/upsert/ModalCustomerUpsert.vue'
import { useRouter } from 'vue-router'

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

const appointment = ref<Appointment>(Appointment.blank())

const customer = ref<Customer>(Customer.blank())
const customerListOptions = ref<{ value: number; text: string; data: Customer }[]>([])
const customerSourceAll = ref<CustomerSource[]>([])

const now = new Date()
now.setMinutes(0, 0)

const openModalForCreate = async (voucherType: VoucherType) => {
  showModal.value = true
  appointment.value = Appointment.blank()
  appointment.value.voucherType = voucherType

  const now = new Date()
  now.setMinutes(0, 0)
  now.setHours(now.getHours() + 1)
  appointment.value.registeredAt = now.getTime()
  customerSourceAll.value = await CustomerSourceService.getAll()
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
  customerSourceAll.value = await CustomerSourceService.getAll()
}

const closeModal = () => {
  appointment.value = Appointment.blank()
  customer.value = Customer.blank()
  customerListOptions.value = []
  showModal.value = false
}

const handleRegisterAppointmentClinic = async () => {
  saveLoading.value = true
  try {
    if (!appointment.value.id) {
      await AppointmentApi.createOne({
        fromTicketId: 0,
        customerId: appointment.value.customerId,
        registeredAt: appointment.value.registeredAt,
        reason: appointment.value.reason,
        customerSourceId: appointment.value.customerSourceId || 0,
        voucherType: appointment.value.voucherType,
        appointmentStatus: appointment.value.appointmentStatus,
      })
    } else {
      await AppointmentApi.updateOne(appointment.value.id, {
        customerId: appointment.value.customerId,
        registeredAt: appointment.value.registeredAt,
        reason: appointment.value.reason,
        customerSourceId: appointment.value.customerSourceId || 0,
        appointmentStatus: appointment.value.appointmentStatus,
        cancelReason:
          appointment.value.appointmentStatus === AppointmentStatus.Cancelled
            ? appointment.value.cancelReason
            : '',
      })
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

const selectCustomer = async (data?: Customer) => {
  if (data) {
    appointment.value.customerId = data.id
    appointment.value.customer = Customer.from(data)
  } else {
    appointment.value.customerId = 0
    appointment.value.customer = Customer.blank()
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
  }
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
      @submit.prevent="handleRegisterAppointmentClinic">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Tạo lịch hẹn mới</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 gap-4 flex flex-wrap">
        <div style="flex-basis: 80%; flex-grow: 1">
          <div class="flex justify-between">
            <span>
              Tên KH (nợ cũ:
              <b>{{ formatMoney(appointment.customer!.debt) }}</b>
              )
              <a
                v-if="appointment.customerId"
                class="ml-1"
                @click="modalCustomerDetail?.openModal(appointment.customer!)">
                <IconFileSearch />
              </a>
            </span>
            <span v-if="!appointment.id">
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
              :maxHeight="260"
              no-clear-text-when-not-selected
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

        <div style="flex-basis: 80%; flex-grow: 1">
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

        <div style="flex-basis: 300px; flex-grow: 1">
          <div>Thời gian hẹn</div>
          <div>
            <InputDate v-model:value="appointment.registeredAt" type-parser="number" show-time />
          </div>
        </div>

        <div style="flex-basis: 300px; flex-grow: 1">
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

        <div style="flex-basis: 80%; flex-grow: 1">
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
          style="flex-basis: 80%; flex-grow: 1">
          <div>Lý do hủy</div>
          <div>
            <InputHint
              v-model:value="appointment.cancelReason"
              :options="[]"
              :logic-filter="(item: string, text: string) => customFilter(item, text)" />
          </div>
        </div>
      </div>

      <div class="p-4 mt-4">
        <div class="flex flex-wrap gap-4">
          <VueButton class="mr-auto btn" type="reset" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton class="btn btn-blue" type="submit" icon="save" :loading="saveLoading">
            <span v-if="!appointment.id">TẠO LỊCH HẸN</span>
            <span v-else>CẬP NHẬT LỊCH HẸN</span>
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalCustomerUpsert ref="modalCustomerUpsert" @success="createCustomer" />
</template>

<style lang="scss"></style>
