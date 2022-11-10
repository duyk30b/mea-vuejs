
<script setup lang="ts">
import { Distributor, DistributorDebt } from '@/modules/distributor'
import { formatNumber } from '@/utils'
import { DeploymentUnitOutlined, DollarOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import ModalDistributorPayDebt from '../components/ModalDistributorPayDebt.vue'
import DistributorDebtsHistory from './DistributorDebtsHistory.vue'
import DistributorInfo from './DistributorInfo.vue'
import DistributorReceiptHistory from './DistributorReceiptHistory.vue'

const emit = defineEmits<{ (e: 'update_distributor', value: Distributor): void }>()

const modalDistributorPayDebt = ref<InstanceType<typeof ModalDistributorPayDebt>>()
const distributorDebtsHistory = ref<InstanceType<typeof DistributorDebtsHistory>>()

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref('info')

const distributor = ref<Distributor>(Distributor.blank())

const openModal = async (d: Distributor) => {
  showModal.value = true
  distributor.value = Distributor.fromInstance(d)
}

const refreshModal = () => {
  showModal.value = false
  distributor.value = Distributor.blank()
}

const handleModalDistributorPayDebtSuccess = async (data: {
  distributor: Distributor,
  distributorDebt: DistributorDebt
}) => {
  distributor.value = data.distributor
  distributorDebtsHistory.value?.addCustomerDebt(data.distributorDebt)
  emit('update_distributor', data.distributor)
}

defineExpose({ openModal })

</script>

<template>
  <ModalDistributorPayDebt ref="modalDistributorPayDebt" @success="handleModalDistributorPayDebtSuccess" />
  <a-modal v-model:visible="showModal" width="1200px" :title="'Nhà cung cấp: ' + distributor.fullNameVi"
    :confirm-loading="saveLoading" :afterClose="refreshModal">
    <template #footer>
      <div class="flex justify-end px-2">
        <div>
          <a-button @click="showModal = false">Đóng</a-button>
        </div>
      </div>
    </template>
    <div class="distributor-detail">
      <a-tabs v-model:activeKey="activeTab" type="card" :tabBarGutter="10" :destroyInactiveTabPane="true">
        <a-tab-pane key="info">
          <template #tab>
            <span>
              <UserOutlined />Thông tin cá nhân
            </span>
          </template>
          <DistributorInfo :distributor="distributor" />
        </a-tab-pane>
        <a-tab-pane key="debts-history">
          <template #tab>
            <span>
              <DollarOutlined />Lịch sử nợ
            </span>
          </template>
          <div class="flex justify-between items-end">
            <div>
              Khách hàng: <b>{{ distributor.fullNameVi }}</b> - Công nợ hiện tại: <b>{{ formatNumber(distributor.debt)
              }}</b>
            </div>
            <div>
              <a-button type="primary" @click="modalDistributorPayDebt?.openModal(distributor.id!, distributor.debt)">
                <template #icon>
                  <PlusOutlined />
                </template>
                Trả nợ
              </a-button>
            </div>
          </div>
          <DistributorDebtsHistory ref="distributorDebtsHistory" :distributor="distributor" />
        </a-tab-pane>
        <a-tab-pane key="receipts-history">
          <template #tab>
            <span>
              <DeploymentUnitOutlined />Lịch sử nhập hàng
            </span>
          </template>
          <DistributorReceiptHistory :distributor="distributor" />
        </a-tab-pane>
      </a-tabs>
    </div>
  </a-modal>
</template>

<style lang="scss">
.distributor-detail {
  .ant-tabs-tab {
    border-top: 5px solid #d6d6d6 !important;

    &.ant-tabs-tab-active {
      border-top-color: #1890ff !important;
    }
  }
}
</style>
