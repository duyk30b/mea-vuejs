
<script setup lang="ts">
import { Procedure } from '@/modules/procedure'
import { DeploymentUnitOutlined, DiffOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ProcedureInfo from './ProcedureInfo.vue'
import ProcedureInvoice from './ProcedureInvoice.vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const router = useRouter()

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref('procedure-info')

const procedure = ref<Procedure>(Procedure.blank())

const openModal = async (p: Procedure) => {
  showModal.value = true
  procedure.value = Procedure.fromInstance(p)
}

const refreshModal = () => {
  showModal.value = false
  procedure.value = Procedure.blank()
}

defineExpose({ openModal })
</script>

<template>
  <a-modal v-model:visible="showModal" width="1200px" title="Thông tin dịch vụ" :confirm-loading="saveLoading"
    :afterClose="refreshModal">
    <template #footer>
      <div class="flex justify-end px-2">
        <div>
          <a-button @click="showModal = false">Đóng</a-button>
        </div>
      </div>
    </template>
    <div class="procedure-detail">
      <a-tabs v-model:activeKey="activeTab" type="card" :tabBarGutter="10" :destroyInactiveTabPane="true">
        <a-tab-pane key="procedure-info">
          <template #tab>
            <span>
              <DeploymentUnitOutlined />Thông tin
            </span>
          </template>
          <ProcedureInfo :procedure="procedure" />
        </a-tab-pane>
        <a-tab-pane key="procedure-invoice">
          <template #tab>
            <span>
              <DiffOutlined />Lịch sử hóa đơn
            </span>
          </template>
          <ProcedureInvoice :procedure="procedure" />
        </a-tab-pane>
      </a-tabs>

    </div>
  </a-modal>
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
