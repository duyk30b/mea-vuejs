<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import ImageUploadCloudinary from '@/common/image-upload/ImageUploadCloudinary.vue'
import { InputDate, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { MeService } from '@/modules/_me/me.service'
import type { Image } from '@/modules/image/image.model'
import { PositionType } from '@/modules/position'
import { TicketChangeProcedureApi } from '@/modules/ticket'
import { TicketProcedure, TicketProcedureStatus } from '@/modules/ticket-procedure'
import { TicketProcedureItem } from '@/modules/ticket-procedure/ticket-procedure-item.model'
import { TicketUser } from '@/modules/ticket-user'
import { ESImage } from '@/utils'
import { computed, ref } from 'vue'
import TicketChangeTicketUserPosition from '../room-user/TicketChangeTicketUserPosition.vue'
import ModalCancelTicketProcedureItem from './ModalCancelTicketProcedureItem.vue'
import { ProcedureType } from '@/modules/procedure'

const appointmentRegisterSuccessForm = ref<InstanceType<typeof HTMLFormElement>>()
const imageUploadMultipleRef = ref<InstanceType<typeof ImageUploadCloudinary>>()
const modalCancelTicketProcedureItem = ref<InstanceType<typeof ModalCancelTicketProcedureItem>>()

const emit = defineEmits<{
  (e: 'success', value: { ticketProcedure: TicketProcedure }): void
}>()

const { userPermission, organization } = MeService

const ticketProcedure = ref<TicketProcedure>(TicketProcedure.blank())
const ticketProcedureItemOrigin = ref<TicketProcedureItem>(TicketProcedureItem.blank())
const ticketProcedureItem = ref<TicketProcedureItem>(TicketProcedureItem.blank())

const hasChangeImageList = ref(false)
const loadingImage = ref(false)
const saveLoading = ref(false)
const showModal = ref(false)

const openModal = async (data: {
  ticketProcedure: TicketProcedure
  ticketProcedureItem: TicketProcedureItem
}) => {
  ticketProcedure.value = TicketProcedure.from(data.ticketProcedure)

  ticketProcedureItemOrigin.value = data.ticketProcedureItem
  if (ticketProcedureItemOrigin.value.status !== TicketProcedureStatus.Completed) {
    ticketProcedureItemOrigin.value.completedAt = Date.now()
  }
  ticketProcedureItem.value = TicketProcedureItem.from(ticketProcedureItemOrigin.value)
  showModal.value = true
}

const closeModal = () => {
  ticketProcedure.value = TicketProcedure.blank()
  ticketProcedureItem.value = TicketProcedureItem.blank()
  showModal.value = false
}

const hasChangeTicketProcedureItem = computed(() => {
  const result = !TicketProcedureItem.equal(
    ticketProcedureItemOrigin.value,
    ticketProcedureItem.value,
  )
  return result
})

const hasChangeTicketUserList = computed(() => {
  const result = !TicketUser.equalList(
    ticketProcedureItemOrigin.value.ticketUserResultList || [],
    ticketProcedureItem.value.ticketUserResultList || [],
  )
  return result
})

const hasChangeData = computed(() => {
  const result = hasChangeTicketProcedureItem.value || hasChangeTicketUserList.value
  return result
})

const handleSave = async () => {
  try {
    saveLoading.value = true
    const { filesPosition, imageIdsKeep, files, imageUrls, imageIdsWait } =
      imageUploadMultipleRef.value?.getData() || {
        filesPosition: [],
        imageIdsWait: [],
        imageIdsKeep: [],
        files: [],
        imageUrls: [],
      }

    const ticketProcedureResponse = await TicketChangeProcedureApi.updateResultTicketProcedureItem({
      ticketId: ticketProcedure.value.ticketId,
      ticketProcedureItem: {
        completedAt: ticketProcedureItem.value.completedAt,
        ticketProcedureItemId: ticketProcedureItem.value.id,
        ticketProcedureId: ticketProcedureItem.value.ticketProcedureId,
        result: ticketProcedureItem.value.result,
      },
      imagesChange: hasChangeImageList.value
        ? { files, imageIdsWait, externalUrlList: imageUrls }
        : undefined,
      ticketUserResultList: hasChangeTicketUserList.value
        ? ticketProcedureItem.value.ticketUserResultList
        : undefined,
    })
    emit('success', { ticketProcedure: ticketProcedureResponse })
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalAppointmentClinicSuccess.vue:41  ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleModalCancelTicketProcedureItemSuccess = (data: TicketProcedure) => {
  emit('success', { ticketProcedure: data })
  closeModal()
}

const handleFixTicketUserResultList = (tuListData: TicketUser[]) => {
  ticketProcedureItemOrigin.value.ticketUserResultList = TicketUser.fromList(tuListData)
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px; width: 800px">
    <ModalCancelTicketProcedureItem
      ref="modalCancelTicketProcedureItem"
      @success="handleModalCancelTicketProcedureItemSuccess"
    />
    <form ref="appointmentRegisterSuccessForm" class="bg-white pb-2" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          <span>{{ ticketProcedure.procedure?.name }}</span>
          <span v-if="ticketProcedure.procedure?.procedureType === ProcedureType.Regimen">
            : buổi thứ{{ ticketProcedure.finishedSessions + 1 }}
          </span>
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4">
        <div
          v-if="ticketProcedure.procedureType === ProcedureType.Regimen"
          style="flex-basis: 300px; flex-grow: 1"
        >
          <div>Thời gian hẹn</div>
          <div>
            <InputDate
              v-model:value="ticketProcedureItem.registeredAt"
              class="w-full"
              show-time
              disabled
            />
          </div>
        </div>

        <div class="mt-4" style="flex-basis: 300px; flex-grow: 1">
          <div>Thời gian thực hiện</div>
          <div>
            <InputDate
              v-model:value="ticketProcedureItem.completedAt"
              type-parser="number"
              class="w-full"
              show-time
            />
          </div>
        </div>

        <div class="mt-4">
          <div>Kết luận</div>
          <div>
            <InputText v-model:value="ticketProcedureItem.result" />
          </div>
        </div>

        <div class="mt-4">
          <div>Hình ảnh</div>
          <ImageUploadCloudinary
            ref="imageUploadMultipleRef"
            :height="100"
            :oid="organization.id"
            :customerId="ticketProcedure.customerId"
            @changeImage="hasChangeImageList = true"
            @loading="(v) => (loadingImage = v)"
            :rootImageList="
              (ticketProcedureItem.imageList || []).map((i: Image) => ({
                thumbnail: ESImage.getImageLink(i, { size: 200 }),
                enlarged: ESImage.getImageLink(i, { size: 1000 }),
                id: i.id,
              }))
            "
          />
        </div>

        <div class="mt-4">
          <TicketChangeTicketUserPosition
            ref="ticketChangeTicketUserPosition"
            v-model:ticketUserList="ticketProcedureItem.ticketUserResultList"
            :positionType="PositionType.ProcedureResult"
            :positionInteractId="ticketProcedure.procedureId"
            @fix:ticketUserList="handleFixTicketUserResultList"
            title="Nhân viên thực hiện dịch vụ"
          />
        </div>
      </div>

      <div class="p-4 mt-4 flex flex-wrap gap-4 justify-between">
        <div>
          <VueButton
            v-if="ticketProcedureItem.status === TicketProcedureStatus.Pending"
            @click="
              modalCancelTicketProcedureItem?.openModal({ ticketProcedure, ticketProcedureItem })
            "
            icon="close"
            type="button"
            color="red"
            :loading="saveLoading"
          >
            <span>HỦY</span>
            <span v-if="ticketProcedure.procedureType === ProcedureType.Regimen">
              BUỔI {{ ticketProcedure.finishedSessions + 1 }}
            </span>
          </VueButton>
        </div>
        <VueButton
          color="blue"
          icon="save"
          type="submit"
          :loading="saveLoading"
          :disabled="!hasChangeData || loadingImage"
        >
          THỰC HIỆN
        </VueButton>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss"></style>
