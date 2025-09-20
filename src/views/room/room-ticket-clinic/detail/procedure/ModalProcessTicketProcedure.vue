<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import ImageUploadCloudinary from '@/common/image-upload/ImageUploadCloudinary.vue'
import { InputDate, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { MeService } from '@/modules/_me/me.service'
import type { Image } from '@/modules/image/image.model'
import { TicketChangeProcedureApi } from '@/modules/ticket'
import { TicketProcedure, TicketProcedureStatus } from '@/modules/ticket-procedure'
import { ESImage } from '@/utils'
import { computed, ref } from 'vue'

const imageUploadMultipleRef = ref<InstanceType<typeof ImageUploadCloudinary>>()

const emit = defineEmits<{
  (e: 'success', value: { ticketProcedure: TicketProcedure }): void
}>()

const { userPermission, organization } = MeService

let ticketProcedureOrigin = TicketProcedure.blank()
const ticketProcedure = ref<TicketProcedure>(TicketProcedure.blank())

const hasChangeImageList = ref(false)
const loadingImage = ref(false)
const saveLoading = ref(false)
const showModal = ref(false)

let ticketIdAction = 0

const openModal = async (data: { ticketProcedure: TicketProcedure; ticketId: number }) => {
  ticketProcedureOrigin = data.ticketProcedure
  ticketIdAction = data.ticketId

  ticketProcedure.value = TicketProcedure.from(ticketProcedureOrigin)
  if (ticketProcedure.value.status !== TicketProcedureStatus.Completed) {
    ticketProcedure.value.completedAt = Date.now()
  }
  showModal.value = true
}

const closeModal = () => {
  ticketProcedure.value = TicketProcedure.blank()
  showModal.value = false
}

const hasChangeTicketProcedure = computed(() => {
  const result = !TicketProcedure.equal(ticketProcedureOrigin, ticketProcedure.value)
  return result
})

const hasChangeData = computed(() => {
  const result = hasChangeTicketProcedure.value || hasChangeImageList.value
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

    const ticketProcedureResponse = await TicketChangeProcedureApi.updateResultTicketProcedure({
      ticketId: ticketIdAction,
      ticketProcedureId: ticketProcedure.value.id,
      ticketProcedure: {
        completedAt: ticketProcedure.value.completedAt,
        result: ticketProcedure.value.result,
      },
      imagesChange: hasChangeImageList.value
        ? { files, imageIdsWait, externalUrlList: imageUrls }
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

const handleClickCancelResult = async () => {
  try {
    saveLoading.value = true

    const ticketProcedureResponse = await TicketChangeProcedureApi.cancelResultTicketProcedure({
      ticketId: ticketIdAction,
      ticketProcedureId: ticketProcedure.value.id,
    })
    emit('success', { ticketProcedure: ticketProcedureResponse })
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalAppointmentClinicSuccess.vue:41  ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px; width: 800px">
    <form class="bg-white pb-2" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          <span>{{ ticketProcedure.procedure?.name }}</span>
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4">
        <div class="mt-4" style="flex-basis: 300px; flex-grow: 1">
          <div>Thời gian thực hiện</div>
          <div>
            <InputDate
              v-model:value="ticketProcedure.completedAt"
              type-parser="number"
              class="w-full"
              show-time
            />
          </div>
        </div>

        <div class="mt-4">
          <div>Kết luận</div>
          <div>
            <InputText v-model:value="ticketProcedure.result" />
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
              (ticketProcedure.imageList || []).map((i: Image) => ({
                thumbnail: ESImage.getImageLink(i, { size: 200 }),
                enlarged: ESImage.getImageLink(i, { size: 1000 }),
                id: i.id,
              }))
            "
          />
        </div>
      </div>

      <div class="p-4 mt-4 flex flex-wrap gap-4 justify-between">
        <div>
          <VueButton
            v-if="ticketProcedure.status === TicketProcedureStatus.Completed"
            icon="close"
            color="red"
            :loading="saveLoading"
            @click="handleClickCancelResult"
          >
            Hủy kết quả
          </VueButton>
        </div>
        <div>
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
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss"></style>
