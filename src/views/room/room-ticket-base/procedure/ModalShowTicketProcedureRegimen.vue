<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconDoubleRight } from '@/common/icon-antd'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { ProcedureType } from '@/modules/procedure'
import { TicketProcedure } from '@/modules/ticket-procedure'
import { ESImage, ESTimer } from '@/utils'
import { ref } from 'vue'
import TicketProcedureStatusTag from '../../room-procedure/TicketProcedureStatusTag.vue'
import ImageUploadCloudinary from '@/common/image-upload/ImageUploadCloudinary.vue'
import { MeService } from '@/modules/_me/me.service'
import type { Image } from '@/modules/image/image.model'

const emit = defineEmits<{
  (e: 'success', value: TicketProcedure, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const settingStore = useSettingStore()

const { userPermission, organization } = MeService

const ticketProcedure = ref<TicketProcedure>(TicketProcedure.blank())

const showModal = ref(false)

const openModal = async (ticketProcedureProp: TicketProcedure) => {
  showModal.value = true
  ticketProcedure.value = TicketProcedure.from(ticketProcedureProp)
}

const closeModal = () => {
  showModal.value = false
  ticketProcedure.value = TicketProcedure.blank()
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ ticketProcedure.procedure?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div
        v-if="ticketProcedure.procedure?.procedureType === ProcedureType.Regimen"
        class="p-4 gap-4 w-full"
      >
        <div
          class="font-bold flex gap-2 flex-wrap items-center"
          style="flex-basis: 90%; flex-grow: 1; min-width: 300px"
        >
          <IconDoubleRight />
          <span>Tổng {{ ticketProcedure.ticketProcedureItemList?.length }} buổi</span>
        </div>
        <div class="mt-2 w-full table table-wrapper">
          <div
            v-for="(tpItem, index) in ticketProcedure.ticketProcedureItemList || []"
            :key="tpItem._localId"
          >
            <div class="mt-2 flex gap-2">
              <span v-if="CONFIG.MODE === 'development'" class="text-center" style="color: violet">
                {{ tpItem.id }}
              </span>
              <span style="font-weight: 500">Buổi {{ index + 1 }} :</span>
              <TicketProcedureStatusTag :status="tpItem.status" />
              <span class="italic">
                {{ ESTimer.timeToText(tpItem.completedAt, 'hh:mm DD/MM/YYYY') }}
              </span>
            </div>
            <div v-if="tpItem.imageList.length">
              <ImageUploadCloudinary
                :height="100"
                :oid="organization.id"
                :editable="false"
                :customerId="ticketProcedure.customerId"
                :rootImageList="
                  (tpItem.imageList || []).map((i: Image) => ({
                    thumbnail: ESImage.getImageLink(i, { size: 200 }),
                    enlarged: ESImage.getImageLink(i, { size: 1000 }),
                    id: i.id,
                  }))
                "
              />
            </div>
          </div>
        </div>
      </div>

      <div style="flex-grow: 1; flex-basis: 80%" class="mt-6 p-4 flex gap-4">
        <VueButton style="margin-left: auto" type="reset" icon="close" @click="closeModal">
          Đóng lại
        </VueButton>
      </div>
    </div>
  </VueModal>
</template>
<style lang="scss" scope></style>
