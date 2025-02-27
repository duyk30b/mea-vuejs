<script setup lang="ts">
import { ContainerOutlined, DeploymentUnitOutlined, OneToOneOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconCalendar, IconClose, IconDollar, IconUser } from '../../../common/icon'
import { IconRadiology, IconStethoscope } from '../../../common/icon-google'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../common/vue-tabs'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer, CustomerService } from '../../../modules/customer'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { DString } from '../../../utils'
import CustomerAppointmentHistory from './CustomerAppointmentHistory.vue'
import CustomerInfo from './CustomerInfo.vue'
import CustomerPaymentHistory from './CustomerPaymentHistory.vue'
import CustomerProcedureHistory from './CustomerProcedureHistory.vue'
import CustomerProductHistory from './CustomerProductHistory.vue'
import CustomerRadiologyHistory from './CustomerRadiologyHistory.vue'
import CustomerTicketClinicHistory from './CustomerTicketClinicHistory.vue'
import CustomerTicketHistory from './CustomerTicketHistory.vue'

const TABS_KEY = {
  INFO: 'CUSTOMER_INFO',
  APPOINTMENT_HISTORY: 'APPOINTMENT_HISTORY',
  TICKET_HISTORY: 'TICKET_HISTORY',
  TICKET_CLINIC_HISTORY: 'TICKET_CLINIC_HISTORY',
  PAYMENT_HISTORY: 'PAYMENT_HISTORY',
  PRODUCT_HISTORY: 'PRODUCT_HISTORY',
  PROCEDURE_HISTORY: 'PROCEDURE_HISTORY',
  RADIOLOGY_HISTORY: 'RADIOLOGY_HISTORY',
}

const customerPaymentHistory = ref<InstanceType<typeof CustomerPaymentHistory>>()

const emit = defineEmits<{ (e: 'update_customer', value: Customer): void }>()

const meStore = useMeStore()
const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { permissionIdMap } = meStore

const showModal = ref(false)
const activeTab = ref(localStorage.getItem('MODAL_CUSTOMER_DETAIL_TAB_SHOW') || TABS_KEY.INFO)

const customer = ref<Customer>(Customer.blank())

const openModal = async (customerId: number) => {
  showModal.value = true
  customer.value = (await CustomerService.detail(customerId)) || Customer.blank()
}

const closeModal = () => {
  showModal.value = false
  customer.value = Customer.blank()
}

const handleUpdateTabShow = (value: any) => {
  localStorage.setItem('MODAL_CUSTOMER_DETAIL_TAB_SHOW', value)
}

defineExpose({ openModal })
</script>

<template>
  <VueModal
    v-model:show="showModal"
    style="width: 1200px; margin-top: 50px; max-height: calc(100vh - 100px)">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium flex flex-wrap gap-1" style="font-size: 16px">
          <span>{{ customer.fullName }} -</span>
          <a :href="'tel:' + customer.phone">{{ DString.formatPhone(customer.phone || '') }}</a>
          <span>
            - Nợ:
            <b>{{ formatMoney(customer.debt) }}</b>
          </span>
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <VueTabs v-model:tabShow="activeTab" @update:tabShow="handleUpdateTabShow">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.INFO" style="padding: 6px 6px">
              <IconUser />
              Thông tin
            </VueTabMenu>
            <VueTabMenu
              v-if="permissionIdMap[PermissionId.APPOINTMENT_READ]"
              style="padding: 6px 6px"
              :tabKey="TABS_KEY.APPOINTMENT_HISTORY">
              <IconCalendar />
              Lịch hẹn
            </VueTabMenu>
            <VueTabMenu
              v-if="
                permissionIdMap[PermissionId.TICKET_ORDER_READ] ||
                permissionIdMap[PermissionId.TICKET_CLINIC_READ]
              "
              style="padding: 6px 6px"
              :tabKey="TABS_KEY.TICKET_HISTORY">
              <ContainerOutlined />
              Tất cả Phiếu
            </VueTabMenu>
            <VueTabMenu
              v-if="permissionIdMap[PermissionId.TICKET_CLINIC_READ]"
              style="padding: 6px 6px"
              :tabKey="TABS_KEY.TICKET_CLINIC_HISTORY">
              <IconStethoscope />
              Phiếu khám
            </VueTabMenu>
            <VueTabMenu
              v-if="permissionIdMap[PermissionId.CUSTOMER_PAYMENT_READ]"
              style="padding: 6px 6px"
              :tabKey="TABS_KEY.PAYMENT_HISTORY">
              <IconDollar />
              Thanh toán
            </VueTabMenu>
            <VueTabMenu style="padding: 6px 6px" :tabKey="TABS_KEY.PRODUCT_HISTORY">
              <OneToOneOutlined />
              Sản phẩm
            </VueTabMenu>
            <VueTabMenu style="padding: 6px 6px" :tabKey="TABS_KEY.PROCEDURE_HISTORY">
              <DeploymentUnitOutlined />
              Dịch vụ
            </VueTabMenu>
            <VueTabMenu
              v-if="permissionIdMap[PermissionId.TICKET_CLINIC_READ]"
              style="padding: 6px 6px"
              :tabKey="TABS_KEY.RADIOLOGY_HISTORY">
              <IconRadiology />
              CĐHA
            </VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.INFO">
              <CustomerInfo :customer="customer" />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.APPOINTMENT_HISTORY">
              <CustomerAppointmentHistory :customerId="customer.id" />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.TICKET_HISTORY">
              <CustomerTicketHistory :customerId="customer.id" />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.TICKET_CLINIC_HISTORY">
              <CustomerTicketClinicHistory :customerId="customer.id" />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.PAYMENT_HISTORY">
              <CustomerPaymentHistory
                ref="customerPaymentHistory"
                :customerId="customer.id"
                @update_customer="(v) => emit('update_customer', v)" />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.PRODUCT_HISTORY">
              <CustomerProductHistory :customerId="customer.id" />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.PROCEDURE_HISTORY">
              <CustomerProcedureHistory :customerId="customer.id" />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.RADIOLOGY_HISTORY">
              <CustomerRadiologyHistory :customerId="customer.id" />
            </VueTabPanel>
          </template>
        </VueTabs>
      </div>
      <div class="p-4">
        <div class="flex justify-end gap-4">
          <VueButton icon="close" @click="closeModal">Đóng</VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss"></style>
