
<script setup lang="ts">
import { Customer, CustomerDebt } from '@/modules/customer'
import { formatNumber } from '@/utils'
import { ContainerOutlined, DeploymentUnitOutlined, DollarOutlined, OneToOneOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import ModalCustomerPayDebt from '../components/ModalCustomerPayDebt.vue'
import CustomerDebtsHistory from './CustomerDebtsHistory.vue'
import CustomerInfo from './CustomerInfo.vue'
import CustomerInvoicesHistory from './CustomerInvoicesHistory.vue'
import CustomerProcedureHistory from './CustomerProcedureHistory.vue'
import CustomerProductHistory from './CustomerProductHistory.vue'

const emit = defineEmits<{ (e: 'update_customer', value: Customer): void }>()

const modalCustomerPayDebt = ref<InstanceType<typeof ModalCustomerPayDebt>>()
const customerDebtsHistory = ref<InstanceType<typeof CustomerDebtsHistory>>()

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref('info')

const customer = ref<Customer>(Customer.blank())

const openModal = async (c: Customer) => {
  showModal.value = true
  customer.value = Customer.fromInstance(c)
}

const refreshModal = () => {
  showModal.value = false
  customer.value = Customer.blank()
}

const handleModalCustomerPayDebtSuccess = async (data: {
  customer: Customer,
  customerDebt: CustomerDebt
}) => {
  customer.value = data.customer
  customerDebtsHistory.value?.addCustomerDebt(data.customerDebt)
  emit('update_customer', data.customer)
}

defineExpose({ openModal })

</script>

<template>
  <ModalCustomerPayDebt ref="modalCustomerPayDebt" @success="handleModalCustomerPayDebtSuccess" />
  <a-modal v-model:visible="showModal" width="1200px" :title="'Khách hàng: ' + customer.fullNameVi"
    :confirm-loading="saveLoading" :afterClose="refreshModal">
    <template #footer>
      <div class="flex justify-end px-2">
        <div>
          <a-button @click="showModal = false">Đóng</a-button>
        </div>
      </div>
    </template>
    <div class="customer-detail">
      <a-tabs v-model:activeKey="activeTab" type="card" :tabBarGutter="10" :destroyInactiveTabPane="true">
        <a-tab-pane key="info">
          <template #tab>
            <span>
              <UserOutlined />Thông tin cá nhân
            </span>
          </template>
          <CustomerInfo :customer="customer" />
        </a-tab-pane>
        <a-tab-pane key="debts-history">
          <template #tab>
            <span>
              <DollarOutlined />Lịch sử nợ
            </span>
          </template>
          <div class="flex justify-between items-end">
            <div>
              Khách hàng: <b>{{ customer.fullNameVi }}</b> - Công nợ hiện tại: <b>{{ formatNumber(customer.debt) }}</b>
            </div>
            <div>
              <a-button type="primary" @click="modalCustomerPayDebt?.openModal(customer.id!, customer.debt)">
                <template #icon>
                  <PlusOutlined />
                </template>
                Trả nợ
              </a-button>
            </div>
          </div>
          <CustomerDebtsHistory ref="customerDebtsHistory" :customer="customer" />
        </a-tab-pane>
        <a-tab-pane key="invoices-history">
          <template #tab>
            <span>
              <DeploymentUnitOutlined />Hóa Đơn
            </span>
          </template>
          <CustomerInvoicesHistory :customer="customer" />
        </a-tab-pane>
        <a-tab-pane key="products-history">
          <template #tab>
            <span>
              <OneToOneOutlined />Sản phẩm
            </span>
          </template>
          <CustomerProductHistory :customer="customer" />
        </a-tab-pane>
        <a-tab-pane key="procedures-history">
          <template #tab>
            <span>
              <ContainerOutlined />Dịch vụ
            </span>
          </template>
          <CustomerProcedureHistory :customer="customer" />
        </a-tab-pane>
      </a-tabs>
    </div>
  </a-modal>
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
