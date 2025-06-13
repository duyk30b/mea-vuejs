<script setup lang="ts">
import { DiscountInteractType } from '@/modules/discount'
import { ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconAudit, IconClose, IconDollar, IconInfoCircle } from '../../../../common/icon-antd'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import VueTabMenu from '../../../../common/vue-tabs/VueTabMenu.vue'
import VueTabPanel from '../../../../common/vue-tabs/VueTabPanel.vue'
import VueTabs from '../../../../common/vue-tabs/VueTabs.vue'
import { Radiology, RadiologyService } from '../../../../modules/radiology'
import DiscountTableAction from '../../discount/common/DiscountTableAction.vue'
import RadiologyHistory from './RadiologyHistory.vue'
import RadiologyInfo from './RadiologyInfo.vue'

const TABS_KEY = {
  INFO: 'INFO',
  DISCOUNT: 'DISCOUNT',
  HISTORY: 'HISTORY',
}

const emit = defineEmits<{ (e: 'success'): void }>()

const showModal = ref(false)
const saveLoading = ref(false)
const tabShow = ref(TABS_KEY.HISTORY)

const radiology = ref<Radiology>(Radiology.blank())

const openModal = async (radiologyId: number) => {
  showModal.value = true
  radiology.value = await RadiologyService.detail(
    radiologyId,
    {
      relation: {
        discountList: true,
        positionList: true,
        printHtml: true,
        radiologyGroup: true,
      },
    },
    { query: true },
  )
}

const closeModal = () => {
  showModal.value = false
  radiology.value = Radiology.blank()
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
        <div class="flex-1 font-medium" style="font-size: 16px">Phiếu: {{ radiology.name }}</div>
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
            <VueTabMenu :tabKey="TABS_KEY.DISCOUNT">
              <IconDollar />
              Khuyến mại
            </VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.HISTORY">
              <IconAudit />
              Lịch sử hóa đơn
            </VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.INFO">
              <div class="mt-4">
                <RadiologyInfo :radiologyId="radiology.id" />
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.DISCOUNT">
              <div class="mt-4">
                <DiscountTableAction
                  v-model:discountList="radiology.discountList!"
                  :discountInteractId="radiology.id"
                  :discountInteractType="DiscountInteractType.Radiology"
                  :discountListExtra="radiology.discountListExtra || []"
                  :editable="false"
                />
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.HISTORY">
              <div class="mt-4">
                <RadiologyHistory :radiology="radiology" />
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
