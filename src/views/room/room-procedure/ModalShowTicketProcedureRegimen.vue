<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconDoubleRight } from '@/common/icon-antd'
import { IconEditSquare } from '@/common/icon-google'
import ImageUploadCloudinary from '@/common/image-upload/ImageUploadCloudinary.vue'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import type { Image } from '@/modules/image/image.model'
import { ProcedureService, ProcedureType } from '@/modules/procedure'
import {
  TicketProcedure,
  TicketProcedureApi,
  TicketProcedureStatus,
} from '@/modules/ticket-procedure'
import type { TicketUser } from '@/modules/ticket-user'
import { ESImage, ESTimer } from '@/utils'
import { onMounted, ref } from 'vue'
import ModalProcessTicketProcedureRegimen from './ModalProcessTicketProcedureRegimen.vue'
import TicketProcedureStatusTag from './TicketProcedureStatusTag.vue'
import { UserService } from '@/modules/user'

const modalProcessTicketProcedureRegimen =
  ref<InstanceType<typeof ModalProcessTicketProcedureRegimen>>()

const emit = defineEmits<{
  (e: 'success', value: { ticketProcedure: TicketProcedure }): void
}>()

const { userPermission, organization } = MeService

const userMap = UserService.userMap
const procedureMap = ProcedureService.procedureMap

const ticketProcedure = ref<TicketProcedure>(TicketProcedure.blank())

const showModal = ref(false)

onMounted(async () => {
  await UserService.getMap()
  await ProcedureService.getMap()
})

const openModal = async (data: { ticketProcedure: TicketProcedure }) => {
  showModal.value = true
  ticketProcedure.value = TicketProcedure.from(data.ticketProcedure)
}

const closeModal = () => {
  showModal.value = false
  ticketProcedure.value = TicketProcedure.blank()
}

const handleModalProcessTicketProcedureRegimenSuccess = (data: {
  ticketProcedure: TicketProcedure
}) => {
  ticketProcedure.value = TicketProcedure.from(data.ticketProcedure)
  emit('success', { ticketProcedure: TicketProcedure.from(data.ticketProcedure) })
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 50px">
    <ModalProcessTicketProcedureRegimen
      ref="modalProcessTicketProcedureRegimen"
      @success="handleModalProcessTicketProcedureRegimenSuccess"
    />
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ procedureMap[ticketProcedure.procedureId]?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div
        v-if="procedureMap[ticketProcedure.procedureId]?.procedureType === ProcedureType.Regimen"
        class="p-4 gap-4 w-full"
      >
        <div
          class="font-bold flex gap-2 flex-wrap items-center"
          style="flex-basis: 90%; flex-grow: 1; min-width: 300px"
        >
          <IconDoubleRight />
          <span>Tổng {{ ticketProcedure.ticketProcedureItemList?.length }} buổi</span>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Kết quả</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="tpItem in ticketProcedure.ticketProcedureItemList || []"
                :key="tpItem._localId"
              >
                <td>
                  <div class="flex flex-wrap gap-1 items-center">
                    <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                      ({{ tpItem.id }})
                    </span>
                    <span style="font-weight: 500">Buổi {{ tpItem.indexSession + 1 }} :</span>
                    <TicketProcedureStatusTag :status="tpItem.status" />
                  </div>
                  <div class="italic whitespace-nowrap">
                    {{ ESTimer.timeToText(tpItem.completedAt, 'hh:mm DD/MM/YYYY') }}
                  </div>
                  <div>
                    <div v-for="tu in tpItem.ticketUserResultList || []" :key="tu.id">
                      <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                        (R{{ tu.roleId }}-U{{ tu.userId }})
                      </span>
                      <span>{{ userMap[tu.userId]?.fullName }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="italic">
                    {{ tpItem.result }}
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
                </td>
                <td>
                  <a
                    v-if="
                      [TicketProcedureStatus.Completed, TicketProcedureStatus.Cancelled].includes(
                        tpItem.status,
                      )
                    "
                    @click="
                      modalProcessTicketProcedureRegimen?.openModal({
                        ticketProcedureItem: tpItem,
                        ticketProcedure: ticketProcedure,
                      })
                    "
                    class="flex justify-center cursor-pointer"
                    style="font-size: 20px; color: var(--text-orange)"
                  >
                    <IconEditSquare />
                  </a>

                  <div
                    v-if="
                      [TicketProcedureStatus.Pending].includes(tpItem.status) &&
                      tpItem.indexSession === ticketProcedure.finishedSessions
                    "
                    class="flex items-center justify-center"
                  >
                    <VueButton
                      @click="
                        modalProcessTicketProcedureRegimen?.openModal({
                          ticketProcedureItem: tpItem,
                          ticketProcedure: ticketProcedure,
                        })
                      "
                      size="small"
                    >
                      Thực hiện
                    </VueButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
