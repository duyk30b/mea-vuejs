<script setup lang="ts">
import {
  ContainerOutlined,
  DeploymentUnitOutlined,
  DollarOutlined,
  OneToOneOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon'
import { IconRadiology, IconStethoscope } from '../../../common/icon-google'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../common/vue-tabs'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer } from '../../../modules/customer'
import { PermissionId } from '../../../modules/permission/permission.enum'
import ModalCustomerPayDebt from '../ModalCustomerPayDebt.vue'
import CustomerInfo from './CustomerInfo.vue'
import CustomerPaymentHistory from './CustomerPaymentHistory.vue'
import CustomerProcedureHistory from './CustomerProcedureHistory.vue'
import CustomerProductHistory from './CustomerProductHistory.vue'
import CustomerRadiologyHistory from './CustomerRadiologyHistory.vue'
import CustomerTicketClinicHistory from './CustomerTicketClinicHistory.vue'
import CustomerTicketHistory from './CustomerTicketHistory.vue'

const TABS_KEY = {
  INFO: 'CUSTOMER_INFO',
  TICKET_HISTORY: 'TICKET_HISTORY',
  TICKET_CLINIC_HISTORY: 'TICKET_CLINIC_HISTORY',
  PAYMENT_HISTORY: 'PAYMENT_HISTORY',
  PRODUCT_HISTORY: 'PRODUCT_HISTORY',
  PROCEDURE_HISTORY: 'PROCEDURE_HISTORY',
  RADIOLOGY_HISTORY: 'RADIOLOGY_HISTORY',
}

const modalCustomerPayDebt = ref<InstanceType<typeof ModalCustomerPayDebt>>()
const customerPaymentHistory = ref<InstanceType<typeof CustomerPaymentHistory>>()

const emit = defineEmits<{ (e: 'update_customer', value: Customer): void }>()
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const activeTab = ref(localStorage.getItem('MODAL_CUSTOMER_DETAIL_TAB_SHOW') || TABS_KEY.INFO)

const customer = ref<Customer>(Customer.blank())

const openModal = async (customerProp: Customer) => {
  showModal.value = true
  customer.value = Customer.from(customerProp)
}

const closeModal = () => {
  showModal.value = false
  customer.value = Customer.blank()
}

const handleUpdateTabShow = (value: any) => {
  localStorage.setItem('MODAL_CUSTOMER_DETAIL_TAB_SHOW', value)
}

const handleModalCustomerPayDebtSuccess = async (data: { customer: Customer }) => {
  customer.value = data.customer
  customerPaymentHistory.value?.startFetchData()
  emit('update_customer', data.customer)
}

const openBlankTicketOrderUpsert = (customerId: number) => {
  let route = router.resolve({
    name: 'TicketOrderUpsert',
    query: { customer_id: customerId, mode: 'CREATE' },
  })
  window.open(route.href, '_blank')
}

defineExpose({ openModal })
</script>

<template>
  <VueModal
    v-model:show="showModal"
    style="width: 1200px; margin-top: 50px; max-height: calc(100vh - 100px)">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">
          Khách hàng: {{ customer.fullName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <VueTabs v-model:tabShow="activeTab" @update:tabShow="handleUpdateTabShow">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.INFO">
              <UserOutlined />
              Thông tin
            </VueTabMenu>
            <VueTabMenu
              v-if="
                permissionIdMap[PermissionId.TICKET_ORDER_READ] ||
                permissionIdMap[PermissionId.TICKET_CLINIC_READ]
              "
              :tabKey="TABS_KEY.TICKET_HISTORY">
              <ContainerOutlined />
              Tất cả Phiếu
            </VueTabMenu>
            <VueTabMenu
              v-if="permissionIdMap[PermissionId.TICKET_CLINIC_READ]"
              :tabKey="TABS_KEY.TICKET_CLINIC_HISTORY">
              <IconStethoscope />
              Phiếu khám
            </VueTabMenu>
            <VueTabMenu
              v-if="permissionIdMap[PermissionId.CUSTOMER_PAYMENT_READ]"
              :tabKey="TABS_KEY.PAYMENT_HISTORY">
              <DollarOutlined />
              Thanh toán
            </VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.PRODUCT_HISTORY">
              <OneToOneOutlined />
              Sản phẩm
            </VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.PROCEDURE_HISTORY">
              <DeploymentUnitOutlined />
              Dịch vụ
            </VueTabMenu>
            <VueTabMenu
              v-if="permissionIdMap[PermissionId.TICKET_CLINIC_READ]"
              :tabKey="TABS_KEY.RADIOLOGY_HISTORY">
              <IconRadiology />
              CĐHA
            </VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.INFO">
              <CustomerInfo :customer="customer" />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.TICKET_HISTORY">
              <div class="mt-4 flex flex-wrap justify-between items-center gap-2">
                <div class="flex flex-wrap">
                  <span class="mr-4">
                    KH:
                    <b>{{ customer.fullName }}</b>
                  </span>
                  <span>
                    Công nợ hiện tại:
                    <b>{{ formatMoney(customer.debt) }}</b>
                  </span>
                </div>
                <div class="flex gap-4">
                  <VueButton
                    v-if="permissionIdMap[PermissionId.TICKET_ORDER_CREATE_DRAFT]"
                    color="blue"
                    icon="plus"
                    @click="openBlankTicketOrderUpsert(customer.id!)">
                    Bán hàng mới
                  </VueButton>
                  <VueButton
                    v-if="permissionIdMap[PermissionId.CUSTOMER_PAY_DEBT]"
                    color="blue"
                    icon="dollar"
                    @click="modalCustomerPayDebt?.openModal(customer)">
                    Trả nợ
                  </VueButton>
                </div>
              </div>
              <CustomerTicketHistory :customer="customer" />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.TICKET_CLINIC_HISTORY">
              <div class="mt-4 flex flex-wrap justify-between items-center">
                <div class="flex flex-wrap gap-4">
                  <span>
                    KH:
                    <b>{{ customer.fullName }}</b>
                  </span>
                  <span>- {{ customer.phone }}</span>
                  <span>- {{ customer.addressString }}</span>
                  <span>
                    - Công nợ hiện tại:
                    <b>{{ formatMoney(customer.debt) }}</b>
                  </span>
                </div>
                <div class="flex gap-4">
                  <VueButton
                    v-if="permissionIdMap[PermissionId.CUSTOMER_PAY_DEBT]"
                    color="blue"
                    icon="dollar"
                    @click="modalCustomerPayDebt?.openModal(customer)">
                    Trả nợ
                  </VueButton>
                </div>
              </div>
              <CustomerTicketClinicHistory :customer="customer" />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.PAYMENT_HISTORY">
              <div class="mt-4 flex justify-between items-center">
                <div class="flex flex-wrap">
                  <span class="mr-4">
                    KH:
                    <b>{{ customer.fullName }}</b>
                  </span>
                  <span>
                    Công nợ hiện tại:
                    <b>{{ formatMoney(customer.debt) }}</b>
                  </span>
                </div>
                <div>
                  <VueButton
                    v-if="permissionIdMap[PermissionId.CUSTOMER_PAY_DEBT]"
                    color="blue"
                    icon="dollar"
                    @click="modalCustomerPayDebt?.openModal(customer)">
                    Trả nợ
                  </VueButton>
                </div>
              </div>
              <CustomerPaymentHistory ref="customerPaymentHistory" :customer="customer" />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.PRODUCT_HISTORY">
              <CustomerProductHistory :customer="customer" />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.PROCEDURE_HISTORY">
              <CustomerProcedureHistory :customer="customer" />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.RADIOLOGY_HISTORY">
              <CustomerRadiologyHistory :customer="customer" />
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
  <ModalCustomerPayDebt ref="modalCustomerPayDebt" @success="handleModalCustomerPayDebtSuccess" />
</template>

<style lang="scss"></style>
