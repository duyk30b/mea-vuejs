<script setup lang="ts">
import { ref } from 'vue'
import {
  IconClose,
  IconDollar,
  IconHistory,
  IconOneToOne,
  IconUser,
} from '../../../common/icon-antd'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../common/vue-tabs'
import VueButton from '../../../common/VueButton.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Distributor, DistributorService } from '../../../modules/distributor'
import { PermissionId } from '../../../modules/permission/permission.enum'
import ModalDistributorPayDebt from '../ModalDistributorPayDebt.vue'
import DistributorInfo from './DistributorInfo.vue'
import DistributorPaymentHistory from './DistributorPaymentHistory.vue'
import DistributorProductHistory from './DistributorProductHistory.vue'
import DistributorReceiptHistory from './DistributorReceiptHistory.vue'
import { MeService } from '../../../modules/_me/me.service'

const TABS_KEY = {
  INFO: 'INFO',
  PAYMENT_HISTORY: 'PAYMENT_HISTORY',
  RECEIPT_HISTORY: 'RECEIPT_HISTORY',
  PRODUCT_HISTORY: 'PRODUCT_HISTORY',
}

const emit = defineEmits<{ (e: 'update_distributor', value: Distributor): void }>()

const modalDistributorPayDebt = ref<InstanceType<typeof ModalDistributorPayDebt>>()
const distributorPaymentHistory = ref<InstanceType<typeof DistributorPaymentHistory>>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission, organizationPermission } = MeService

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref(TABS_KEY.INFO)

const distributor = ref<Distributor>(Distributor.blank())

const openModal = async (distributorId: number) => {
  showModal.value = true
  distributor.value = await DistributorService.detail(distributorId)
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
        <div class="flex-1 font-medium flex flex-wrap gap-1" style="font-size: 16px">
          <span>NCC: {{ distributor.fullName }}</span>
          <div>
            <span v-if="distributor.debt > 0">
              - Nợ:
              <b style="color: var(--text-red)">{{ formatMoney(distributor.debt) }}</b>
            </span>
            <span v-if="distributor.debt < 0">
              - Quỹ:
              <b style="color: var(--text-green)">{{ formatMoney(-distributor.debt) }}</b>
            </span>
          </div>
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <VueTabs v-model:tabShow="activeTab">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.INFO">
              <IconUser />
              Thông tin cá nhân
            </VueTabMenu>
            <VueTabMenu
              v-if="organizationPermission[PermissionId.PAYMENT]"
              :tabKey="TABS_KEY.PAYMENT_HISTORY"
            >
              <IconDollar />
              Thanh toán
            </VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.RECEIPT_HISTORY">
              <IconHistory />
              Lịch sử nhập hàng
            </VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.PRODUCT_HISTORY">
              <IconOneToOne />
              Sản phẩm
            </VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.INFO">
              <div class="mt-4">
                <DistributorInfo :distributor="distributor" />
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.PAYMENT_HISTORY">
              <div class="mt-4 flex justify-between items-end">
                <div>
                  NCC:
                  <b>{{ distributor.fullName }}</b>
                </div>
                <div>
                  <VueButton
                    v-if="
                      userPermission[PermissionId.PAYMENT_DISTRIBUTOR_MONEY_OUT] &&
                      distributor.debt != 0
                    "
                    color="blue"
                    icon="dollar"
                    @click="modalDistributorPayDebt?.openModal(distributor.id)"
                  >
                    Trả nợ
                  </VueButton>
                </div>
              </div>
              <DistributorPaymentHistory
                ref="distributorPaymentHistory"
                :distributorId="distributor.id"
              />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.RECEIPT_HISTORY">
              <DistributorReceiptHistory :distributor="distributor" />
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.PRODUCT_HISTORY">
              <DistributorProductHistory :distributor="distributor" />
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
  <ModalDistributorPayDebt
    ref="modalDistributorPayDebt"
    @success="handleModalDistributorPayDebtSuccess"
  />
</template>

<style lang="scss" scoped></style>
