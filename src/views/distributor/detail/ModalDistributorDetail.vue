<script setup lang="ts">
import {
  CloseOutlined,
  DeploymentUnitOutlined,
  DollarOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueModal from '../../../common/VueModal.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { Distributor } from '../../../modules/distributor'
import ModalDistributorPayDebt from '../ModalDistributorPayDebt.vue'
import DistributorInfo from './DistributorInfo.vue'
import DistributorPaymentHistory from './DistributorPaymentHistory.vue'
import DistributorReceiptHistory from './DistributorReceiptHistory.vue'
import { PermissionId } from '../../../modules/permission/permission.enum'

const emit = defineEmits<{ (e: 'update_distributor', value: Distributor): void }>()

const modalDistributorPayDebt = ref<InstanceType<typeof ModalDistributorPayDebt>>()
const distributorPaymentHistory = ref<InstanceType<typeof DistributorPaymentHistory>>()

const screenStore = useScreenStore()
const { formatMoney } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref('info')

const distributor = ref<Distributor>(Distributor.blank())

const openModal = async (d: Distributor) => {
  showModal.value = true
  distributor.value = Distributor.fromInstance(d)
}

const closeModal = () => {
  showModal.value = false
  distributor.value = Distributor.blank()
}

const handleModalDistributorPayDebtSuccess = async (data: { distributor: Distributor }) => {
  distributor.value = data.distributor
  distributorPaymentHistory.value?.startFetchData()
  emit('update_distributor', data.distributor)
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
        <div class="flex-1 font-medium" style="font-size: 16px">
          NCC: {{ distributor.fullName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4 distributor-detail">
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
            <DistributorInfo :distributor="distributor" />
          </a-tab-pane>
          <a-tab-pane
            v-if="permissionIdMap[PermissionId.DISTRIBUTOR_PAYMENT_READ]"
            key="debts-history"
          >
            <template #tab>
              <span> <DollarOutlined />Thanh toán </span>
            </template>
            <div class="flex justify-between items-end">
              <div>
                Khách hàng: <b>{{ distributor.fullName }}</b> - Công nợ hiện tại:
                <b> {{ formatMoney(distributor.debt) }} </b>
              </div>
              <div>
                <a-button
                  v-if="
                    permissionIdMap[PermissionId.DISTRIBUTOR_PAYMENT_PAY_DEBT] &&
                    distributor.debt != 0
                  "
                  type="primary"
                  @click="modalDistributorPayDebt?.openModal(distributor.id!, distributor.debt)"
                >
                  <template #icon>
                    <PlusOutlined />
                  </template>
                  Trả nợ
                </a-button>
              </div>
            </div>
            <DistributorPaymentHistory ref="distributorPaymentHistory" :distributor="distributor" />
          </a-tab-pane>
          <a-tab-pane v-if="permissionIdMap[PermissionId.RECEIPT_READ]" key="receipts-history">
            <template #tab>
              <span> <DeploymentUnitOutlined />Lịch sử nhập hàng </span>
            </template>
            <DistributorReceiptHistory :distributor="distributor" />
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
  <ModalDistributorPayDebt
    ref="modalDistributorPayDebt"
    @success="handleModalDistributorPayDebtSuccess"
  />
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
