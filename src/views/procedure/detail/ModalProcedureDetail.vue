<script setup lang="ts">
import { DeploymentUnitOutlined, DiffOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { IconClose } from '../../../common/icon'
import VueTabMenu from '../../../common/vue-tabs/VueTabMenu.vue'
import VueTabPanel from '../../../common/vue-tabs/VueTabPanel.vue'
import VueTabs from '../../../common/vue-tabs/VueTabs.vue'
import { Procedure, useProcedureStore } from '../../../modules/procedure'
import ProcedureInfo from './ProcedureInfo.vue'
import ProcedureHistory from './ProcedureHistory.vue'

const TABS_KEY = {
  INFO: 'INFO',
  PROCEDURE_HISTORY: 'PROCEDURE_HISTORY',
}

const emit = defineEmits<{ (e: 'success'): void }>()

const procedureStore = useProcedureStore()

const showModal = ref(false)
const saveLoading = ref(false)
const tabShow = ref(TABS_KEY.INFO)

const procedure = ref<Procedure>(Procedure.blank())

const openModal = async (procedureProp: Procedure) => {
  showModal.value = true
  procedure.value = Procedure.from(procedureProp)
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
    style="width: 900px; margin-top: 50px; max-height: calc(100vh - 100px)">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Dịch vụ: {{ procedure.name }}</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <VueTabs v-model:tabShow="tabShow">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.INFO">
              <span>
                <DeploymentUnitOutlined />
                Thông tin
              </span>
            </VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.PROCEDURE_HISTORY">
              <span>
                <DiffOutlined />
                Lịch sử hóa đơn
              </span>
            </VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.INFO">
              <div class="mt-4">
                <ProcedureInfo :procedure="procedure" />
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.PROCEDURE_HISTORY">
              <div class="mt-4">
                <ProcedureHistory :procedure="procedure" />
              </div>
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
