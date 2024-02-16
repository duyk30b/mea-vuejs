<script setup lang="ts">
import {
  CloseOutlined,
  ContainerOutlined,
  DeploymentUnitOutlined,
  DollarOutlined,
  OneToOneOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueModal from '../../../common/VueModal.vue'
import { Customer } from '../../../modules/customer'
import { useScreenStore } from '../../../modules/_me/screen.store'
import ModalCustomerPayDebt from '../ModalCustomerPayDebt.vue'
import CustomerInfo from './CustomerInfo.vue'
import CustomerInvoiceHistory from './CustomerInvoiceHistory.vue'
import CustomerPaymentHistory from './CustomerPaymentHistory.vue'
import CustomerProcedureHistory from './CustomerProcedureHistory.vue'
import CustomerProductHistory from './CustomerProductHistory.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { PermissionId } from '../../../modules/permission/permission.enum'

const emit = defineEmits<{ (e: 'update_customer', value: Customer): void }>()

const modalCustomerPayDebt = ref<InstanceType<typeof ModalCustomerPayDebt>>()
const customerPaymentHistory = ref<InstanceType<typeof CustomerPaymentHistory>>()

const screenStore = useScreenStore()
const { formatMoney } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref('info')

const customer = ref<Customer>(Customer.blank())

const openModal = async (c: Customer) => {
  showModal.value = true
  customer.value = Customer.fromInstance(c)
}

const closeModal = () => {
  showModal.value = false
  customer.value = Customer.blank()
}

const handleModalCustomerPayDebtSuccess = async (data: { customer: Customer }) => {
  customer.value = data.customer
  customerPaymentHistory.value?.startFetchData()
  emit('update_customer', data.customer)
}

defineExpose({ openModal })
</script>

<template>
  <VueModal
    v-model:show="showModal"
    style="width: 900px; margin-top: 50px; max-height: calc(100vh - 100px)"
  >
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">
          Khách hàng: {{ customer.fullName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4 customer-detail">
        <a-tabs
          v-model:activeKey="activeTab"
          type="card"
          :tabBarGutter="10"
          :destroyInactiveTabPane="true"
        >
          <a-tab-pane key="info">
            <template #tab>
              <span> <UserOutlined />Thông tin cá nhân </span>
            </template>
            <CustomerInfo :customer="customer" />
          </a-tab-pane>
          <a-tab-pane
            v-if="permissionIdMap[PermissionId.CUSTOMER_PAYMENT_READ]"
            key="debts-history"
          >
            <template #tab>
              <span> <DollarOutlined />Thanh toán </span>
            </template>
            <div class="flex justify-between items-center">
              <div class="flex flex-wrap">
                <span class="mr-4">
                  KH: <b>{{ customer.fullName }} </b>
                </span>
                <span>
                  Công nợ hiện tại: <b>{{ formatMoney(customer.debt) }}</b>
                </span>
              </div>
              <div>
                <a-button
                  v-if="permissionIdMap[PermissionId.CUSTOMER_PAYMENT_PAY_DEBT]"
                  type="primary"
                  @click="modalCustomerPayDebt?.openModal(customer.id!, customer.debt)"
                >
                  <template #icon>
                    <PlusOutlined />
                  </template>
                  Trả nợ
                </a-button>
              </div>
            </div>
            <CustomerPaymentHistory ref="customerPaymentHistory" :customer="customer" />
          </a-tab-pane>
          <a-tab-pane v-if="permissionIdMap[PermissionId.INVOICE_READ]" key="invoices-history">
            <template #tab>
              <span> <DeploymentUnitOutlined />Hóa Đơn </span>
            </template>
            <div class="flex justify-between items-center">
              <div class="flex flex-wrap">
                <span class="mr-4">
                  KH: <b>{{ customer.fullName }} </b>
                </span>
                <span>
                  Công nợ hiện tại: <b>{{ formatMoney(customer.debt) }}</b>
                </span>
              </div>
              <div>
                <a-button
                  v-if="permissionIdMap[PermissionId.CUSTOMER_PAYMENT_PAY_DEBT]"
                  type="primary"
                  @click="modalCustomerPayDebt?.openModal(customer.id!, customer.debt)"
                >
                  <template #icon>
                    <PlusOutlined />
                  </template>
                  Trả nợ
                </a-button>
              </div>
            </div>
            <CustomerInvoiceHistory :customer="customer" />
          </a-tab-pane>
          <a-tab-pane
            v-if="
              permissionIdMap[PermissionId.INVOICE_READ] &&
              permissionIdMap[PermissionId.PRODUCT_READ]
            "
            key="products-history"
          >
            <template #tab>
              <span> <OneToOneOutlined />Sản phẩm </span>
            </template>
            <CustomerProductHistory :customer="customer" />
          </a-tab-pane>
          <a-tab-pane
            v-if="
              permissionIdMap[PermissionId.INVOICE_READ] &&
              permissionIdMap[PermissionId.PROCEDURE_READ]
            "
            key="procedures-history"
          >
            <template #tab>
              <span> <ContainerOutlined />Dịch vụ </span>
            </template>
            <CustomerProcedureHistory :customer="customer" />
          </a-tab-pane>
        </a-tabs>
      </div>

      <div class="p-4">
        <div class="flex justify-end gap-4">
          <a-button @click="closeModal">
            <template #icon>
              <CloseOutlined />
            </template>
            Đóng
          </a-button>
        </div>
      </div>
    </div>
  </VueModal>
  <ModalCustomerPayDebt ref="modalCustomerPayDebt" @success="handleModalCustomerPayDebtSuccess" />
</template>

<style lang="scss">
.customer-detail {
  .ant-tabs-tab {
    border-top: 5px solid #d6d6d6 !important;

    &.ant-tabs-tab-active {
      border-top-color: #1890ff !important;
    }
  }
}
</style>

