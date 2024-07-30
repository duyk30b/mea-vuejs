<script setup lang="ts">
import {
  CloseOutlined,
  DeploymentUnitOutlined,
  DollarOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Distributor, useDistributorStore } from '../../../modules/distributor'
import ModalDistributorPayDebt from '../ModalDistributorPayDebt.vue'
import DistributorInfo from './DistributorInfo.vue'
import DistributorPaymentHistory from './DistributorPaymentHistory.vue'
import DistributorReceiptHistory from './DistributorReceiptHistory.vue'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../common/vue-tabs'
import VueButton from '../../../common/VueButton.vue'

const emit = defineEmits<{ (e: 'update_distributor', value: Distributor): void }>()

const modalDistributorPayDebt = ref<InstanceType<typeof ModalDistributorPayDebt>>()
const distributorPaymentHistory = ref<InstanceType<typeof DistributorPaymentHistory>>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore
const distributorStore = useDistributorStore()

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref('info')

const distributor = ref<Distributor>(Distributor.blank())

const openModal = async (distributorId: number) => {
  showModal.value = true
  const response = await distributorStore.getOne(distributorId)
  distributor.value = response || Distributor.blank()
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
  <ModalDistributorPayDebt
    ref="modalDistributorPayDebt"
    @success="handleModalDistributorPayDebtSuccess" />
  <VueModal
    v-model:show="showModal"
    style="width: 1200px; margin-top: 50px; max-height: calc(100vh - 100px)">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">
          NCC: {{ distributor.fullName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4">
        <VueTabs v-model:tabShow="activeTab">
          <template #menu>
            <VueTabMenu tabKey="info">
              <UserOutlined />
              Thông tin cá nhân
            </VueTabMenu>
            <VueTabMenu
              v-if="permissionIdMap[PermissionId.DISTRIBUTOR_PAYMENT_READ]"
              tabKey="debts-history">
              <DollarOutlined />
              Thanh toán
            </VueTabMenu>
            <VueTabMenu v-if="permissionIdMap[PermissionId.RECEIPT_READ]" tabKey="receipts-history">
              <DeploymentUnitOutlined />
              Lịch sử nhập hàng
            </VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel tabKey="info">
              <div class="mt-4">
                <DistributorInfo :distributor="distributor" />
              </div>
            </VueTabPanel>
            <VueTabPanel tabKey="debts-history">
              <div class="mt-4 flex justify-between items-end">
                <div>
                  Khách hàng:
                  <b>{{ distributor.fullName }}</b>
                  - Công nợ hiện tại:
                  <b>{{ formatMoney(distributor.debt) }}</b>
                </div>
                <div>
                  <VueButton
                    v-if="
                      permissionIdMap[PermissionId.DISTRIBUTOR_PAYMENT_PAY_DEBT] &&
                      distributor.debt != 0
                    "
                    color="blue"
                    icon="plus"
                    @click="modalDistributorPayDebt?.openModal(distributor.id!, distributor.debt)">
                    Trả nợ
                  </VueButton>
                </div>
              </div>
              <DistributorPaymentHistory
                ref="distributorPaymentHistory"
                :distributor="distributor" />
            </VueTabPanel>
            <VueTabPanel tabKey="receipts-history">
              <DistributorReceiptHistory :distributor="distributor" />
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

<style lang="scss" scoped></style>
