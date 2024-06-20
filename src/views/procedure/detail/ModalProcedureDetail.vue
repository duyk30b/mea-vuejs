<script setup lang="ts">
import { CloseOutlined, DeploymentUnitOutlined, DiffOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueModal from '../../../common/VueModal.vue'
import { Procedure, useProcedureStore } from '../../../modules/procedure'
import ProcedureInfo from './ProcedureInfo.vue'
import ProcedureInvoice from './ProcedureInvoice.vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const procedureStore = useProcedureStore()

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref('procedure-info')

const procedure = ref<Procedure>(Procedure.blank())

const openModal = async (procedureId: number) => {
  showModal.value = true
  const response = await procedureStore.getOne(procedureId)
  procedure.value = response || Procedure.blank()
}

const refreshModal = () => {
  showModal.value = false
  procedure.value = Procedure.blank()
}

const closeModal = () => {
  showModal.value = false
  procedure.value = Procedure.blank()
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
        <div class="flex-1 font-medium" style="font-size: 16px">Dịch vụ: {{ procedure.name }}</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4 procedure-detail">
        <a-tabs
          v-model:activeKey="activeTab"
          type="card"
          :tabBarGutter="10"
          :destroyInactiveTabPane="true"
        >
          <a-tab-pane key="procedure-info">
            <template #tab>
              <span> <DeploymentUnitOutlined />Thông tin </span>
            </template>
            <ProcedureInfo :procedure="procedure" />
          </a-tab-pane>
          <a-tab-pane key="procedure-invoice">
            <template #tab>
              <span> <DiffOutlined />Lịch sử hóa đơn </span>
            </template>
            <ProcedureInvoice :procedure="procedure" />
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
</template>

<style lang="scss">
.procedure-detail {
  .ant-tabs-tab {
    border-top: 5px solid #d6d6d6 !important;

    &.ant-tabs-tab-active {
      border-top-color: #1890ff !important;
    }
  }
}
</style>
