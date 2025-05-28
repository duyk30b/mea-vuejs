<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconAudit, IconClose, IconInfoCircle } from '../../../../common/icon-antd'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import VueTabMenu from '../../../../common/vue-tabs/VueTabMenu.vue'
import VueTabPanel from '../../../../common/vue-tabs/VueTabPanel.vue'
import VueTabs from '../../../../common/vue-tabs/VueTabs.vue'
import { Laboratory } from '../../../../modules/laboratory'
import LaboratoryHistory from './LaboratoryHistory.vue'
import LaboratoryInfo from './LaboratoryInfo.vue'

const TABS_KEY = {
  INFO: 'INFO',
  LABORATORY_HISTORY: 'LABORATORY_HISTORY',
}

const emit = defineEmits<{ (e: 'success'): void }>()

const showModal = ref(false)
const saveLoading = ref(false)
const tabShow = ref(TABS_KEY.INFO)

const laboratory = ref<Laboratory>(Laboratory.blank())

const openModal = async (laboratoryProp: Laboratory) => {
  showModal.value = true
  laboratory.value = Laboratory.from(laboratoryProp)
}

const closeModal = () => {
  showModal.value = false
}

onMounted(() => {
})

defineExpose({ openModal })
</script>

<template>
  <VueModal
    v-model:show="showModal"
    style="width: 900px; margin-top: 50px; max-height: calc(100vh - 100px)"
  >
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Dịch vụ: {{ laboratory.name }}</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <VueTabs v-model:tabShow="tabShow">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.INFO">
              <IconInfoCircle />
              Thông tin
            </VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.LABORATORY_HISTORY">
              <IconAudit />
              Lịch sử hóa đơn
            </VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.INFO">
              <div class="mt-4">
                <LaboratoryInfo :laboratoryId="laboratory.id" />
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.LABORATORY_HISTORY">
              <div class="mt-4">
                <LaboratoryHistory :laboratory="laboratory" />
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
