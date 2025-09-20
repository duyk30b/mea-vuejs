<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconDoubleRight } from '@/common/icon-antd'
import ImageUploadCloudinary from '@/common/image-upload/ImageUploadCloudinary.vue'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import type { Image } from '@/modules/image/image.model'
import { ProcedureService } from '@/modules/procedure'
import { TicketRegimen, TicketRegimenApi, TicketRegimenService } from '@/modules/ticket-regimen'
import { UserService } from '@/modules/user'
import { ESImage, ESTimer } from '@/utils'
import TicketProcedureStatusTag from '@/views/room/room-ticket-clinic/detail/procedure/TicketProcedureStatusTag.vue'
import ModalProcessTicketProcedureRegimen from '@/views/room/room-ticket-clinic/detail/procedure/ModalProcessTicketProcedure.vue'
import { onMounted, ref } from 'vue'

const modalProcessTicketProcedureRegimen =
  ref<InstanceType<typeof ModalProcessTicketProcedureRegimen>>()

const emit = defineEmits<{
  (e: 'success', value: { ticketRegimen: TicketRegimen }): void
}>()

const { userPermission, organization } = MeService

const userMap = UserService.userMap

const ticketRegimen = ref<TicketRegimen>(TicketRegimen.blank())

const showModal = ref(false)

onMounted(async () => {
  await UserService.getMap()
  await ProcedureService.getMap()
})

const openModal = async (data: { ticketRegimen: TicketRegimen }) => {
  showModal.value = true
  ticketRegimen.value = TicketRegimen.from(data.ticketRegimen)
  const ticketRegimenResponse = await TicketRegimenApi.detail(data.ticketRegimen.id, {
    relation: {
      ticketProcedureList: { imageList: true, ticketUserResultList: true },
    },
  })
  Object.assign(ticketRegimen.value, ticketRegimenResponse)
  await TicketRegimenService.refreshRelation(ticketRegimen.value)
}

const closeModal = () => {
  showModal.value = false
  ticketRegimen.value = TicketRegimen.blank()
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ ticketRegimen.regimen?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div class="px-4 gap-4 w-full">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Kết quả</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(ticketProcedure, tpIndex) in ticketRegimen.ticketProcedureList || []"
                :key="ticketProcedure.id"
              >
                <td>
                  <div class="flex flex-wrap gap-1 items-center">
                    <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                      ({{ ticketProcedure.id }})
                    </span>
                    <span style="font-weight: 500">Buổi {{ tpIndex + 1 }}:</span>
                    <span v-if="ticketProcedure.quantity != 1">
                      Số lượng: {{ ticketProcedure.quantity }}
                    </span>
                    <TicketProcedureStatusTag :status="ticketProcedure.status" />
                  </div>
                  <div>
                    <div v-for="tu in ticketProcedure.ticketUserResultList || []" :key="tu.id">
                      <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                        (R{{ tu.roleId }}-U{{ tu.userId }})
                      </span>
                      <span>{{ userMap[tu.userId]?.fullName }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="italic flex flex-wrap items-center gap-4">
                    <span>
                      {{ ESTimer.timeToText(ticketProcedure.completedAt, 'hh:mm DD/MM/YYYY') }}
                    </span>
                    <span>{{ ticketProcedure.result }}</span>
                  </div>
                  <div v-if="ticketProcedure.imageList.length">
                    <ImageUploadCloudinary
                      :height="100"
                      :oid="organization.id"
                      :editable="false"
                      :customerId="ticketProcedure.customerId"
                      :rootImageList="
                        (ticketProcedure.imageList || []).map((i: Image) => ({
                          thumbnail: ESImage.getImageLink(i, { size: 200 }),
                          enlarged: ESImage.getImageLink(i, { size: 1000 }),
                          id: i.id,
                        }))
                      "
                    />
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
