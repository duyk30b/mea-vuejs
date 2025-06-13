<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import {
  IconAudit,
  IconClose,
  IconDollar,
  IconOneToOne,
  IconReconciliation,
  IconSchedule,
  IconUser,
} from '../../../common/icon-antd'
import { IconRadiology } from '../../../common/icon-google'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../common/vue-tabs'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer, CustomerService } from '../../../modules/customer'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { ESString } from '../../../utils'
import CustomerAppointmentHistory from './CustomerAppointmentHistory.vue'
import CustomerInfo from './CustomerInfo.vue'
import CustomerPaymentHistory from './CustomerPaymentHistory.vue'
import CustomerProcedureHistory from './CustomerProcedureHistory.vue'
import CustomerProductHistory from './CustomerProductHistory.vue'
import CustomerRadiologyHistory from './CustomerRadiologyHistory.vue'
import CustomerTicketHistory from './CustomerTicketHistory.vue'
import { MeService } from '../../../modules/_me/me.service'

const TABS_KEY = {
  INFO: 'CUSTOMER_INFO',
  APPOINTMENT_HISTORY: 'APPOINTMENT_HISTORY',
  TICKET_HISTORY: 'TICKET_HISTORY',
  PAYMENT_HISTORY: 'PAYMENT_HISTORY',
  PRODUCT_HISTORY: 'PRODUCT_HISTORY',
  PROCEDURE_HISTORY: 'PROCEDURE_HISTORY',
  RADIOLOGY_HISTORY: 'RADIOLOGY_HISTORY',
}

const customerPaymentHistory = ref<InstanceType<typeof CustomerPaymentHistory>>()

const emit = defineEmits<{ (e: 'update_customer', value: Customer): void }>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission, organizationPermission } = MeService

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
    style="width: 1200px; margin-top: 50px; max-height: calc(100vh - 100px)"
  >
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium flex flex-wrap gap-1" style="font-size: 16px">
          <div>{{ customer.fullName }} -</div>
          <a :href="'tel:' + customer.phone">{{ ESString.formatPhone(customer.phone || '') }}</a>
          <div>
            <span v-if="customer.debt > 0">
              - Nợ:
              <b style="color: var(--text-red)">{{ formatMoney(customer.debt) }}</b>
            </span>
            <span v-if="customer.debt < 0">
              - Quỹ:
              <b style="color: var(--text-green)">{{ formatMoney(-customer.debt) }}</b>
            </span>
          </div>
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
              v-if="organizationPermission[PermissionId.APPOINTMENT]"
              style="padding: 6px 6px"
              :tabKey="TABS_KEY.APPOINTMENT_HISTORY"
            >
              <IconSchedule />
              Lịch hẹn
            </VueTabMenu>
            <VueTabMenu
              v-if="
                organizationPermission[PermissionId.TICKET_ORDER] ||
                organizationPermission[PermissionId.TICKET_CLINIC]
              "
              style="padding: 6px 6px"
              :tabKey="TABS_KEY.TICKET_HISTORY"
            >
              <IconAudit />
              Tiếp đón
            </VueTabMenu>
            <VueTabMenu
              v-if="organizationPermission[PermissionId.PAYMENT]"
              style="padding: 6px 6px"
              :tabKey="TABS_KEY.PAYMENT_HISTORY"
            >
              <IconDollar />
              Thanh toán
            </VueTabMenu>
            <VueTabMenu
              v-if="organizationPermission[PermissionId.PRODUCT]"
              style="padding: 6px 6px"
              :tabKey="TABS_KEY.PRODUCT_HISTORY"
            >
              <IconOneToOne />
              Sản phẩm
            </VueTabMenu>
            <VueTabMenu
              v-if="organizationPermission[PermissionId.PROCEDURE]"
              style="padding: 6px 6px"
              :tabKey="TABS_KEY.PROCEDURE_HISTORY"
            >
              <IconReconciliation />
              Dịch vụ
            </VueTabMenu>
            <VueTabMenu
              v-if="organizationPermission[PermissionId.RADIOLOGY]"
              style="padding: 6px 6px"
              :tabKey="TABS_KEY.RADIOLOGY_HISTORY"
            >
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
            <VueTabPanel :tabKey="TABS_KEY.PAYMENT_HISTORY">
              <CustomerPaymentHistory
                ref="customerPaymentHistory"
                :customerId="customer.id"
                @update_customer="(v) => emit('update_customer', v)"
              />
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
