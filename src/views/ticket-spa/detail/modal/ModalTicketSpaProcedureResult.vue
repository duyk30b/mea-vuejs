<script setup lang="ts">
import { ref } from 'vue'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { IconClose } from '../../../../common/icon'
import { BasicEditor } from '../../../../ckeditor/class-editor'
import InputText from '../../../../common/vue-form/InputText.vue'
import VueButton from '../../../../common/VueButton.vue'
import { Image, ImageHost } from '../../../../modules/image/image.model'
import ImageUpload from '../../../../common/ImageUpload.vue'
import dayjs, { Dayjs } from 'dayjs'
import { useMeStore } from '../../../../modules/_me/me.store'
import { TicketClinicApi } from '../../../../modules/ticket-clinic'
import { User } from '../../../../modules/user'
import { TicketProcedure } from '../../../../modules/ticket-procedure'

const imageUploadRef = ref<InstanceType<typeof ImageUpload>>()

const meStore = useMeStore()

const showModal = ref(false)
const ticketRadiology = ref<TicketProcedure>(TicketProcedure.blank())

const startedAt = ref<Dayjs>(dayjs())
const saveLoading = ref(false)

const openModal = async (instance: TicketProcedure) => {
  showModal.value = true
  ticketRadiology.value = TicketProcedure.from(instance)
}

const openModalById = async (ticketProcedureId: number) => {
  showModal.value = true
  ticketRadiology.value = await TicketProcedureApi.detail(ticketProcedureId, {
    relation: { imageList: true, radiology: true, doctor: true },
  })
  startedAt.value = dayjs(new Date(ticketRadiology.value.startedAt))
  disabled.value = true
}

const closeModal = () => {
  showModal.value = false
}

const startSave = async () => {
  try {
    saveLoading.value = true
    ticketRadiology.value.startedAt = startedAt.value.valueOf()
    ticketRadiology.value.doctorId = meStore.user?.id || 0

    const { filesPosition, imageIdsKeep, files } = imageUploadRef.value?.getData() || {
      filesPosition: [],
      imageIdsKeep: [],
      files: [],
    }

    if (!ticketRadiology.value.id) {
      await TicketClinicApi.createTicketProcedureCompleted({
        ticketRadiology: ticketRadiology.value,
        files,
      })
    } else {
      await TicketClinicApi.updateTicketProcedure({
        ticketRadiology: ticketRadiology.value,
        imageIdsKeep,
        files,
        filesPosition,
      })
    }
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalTicketProcedureResult.vue:61 ~ startSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal, openModalById })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 800px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ ticketRadiology.radiology?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4" @submit.prevent="startSave">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1">
            <div>Thời gian</div>
            <a-date-picker
              v-model:value="startedAt"
              style="width: 100%"
              show-time
              placeholder="DD/MM/YYYY hh:mm:ss"
              :format="'DD/MM/YYYY HH:mm:ss'" />
          </div>
          <div class="flex-1">
            <div>BS thực hiện</div>
            <div>
              <InputText disabled :value="ticketRadiology.doctor?.fullName" />
            </div>
          </div>
        </div>
        <div class="mt-3">
          <div>Mô tả</div>
          <div class="description">
            <ckeditor v-model="ticketRadiology.description" :editor="BasicEditor"></ckeditor>
          </div>
        </div>
        <div class="mt-3">
          <div>Hình ảnh</div>
          <ImageUpload
            ref="imageUploadRef"
            :height="100"
            :rootImageList="
              (ticketRadiology.imageList || [])
                .filter((i: Image) => i.hostType === ImageHost.GoogleDriver)
                .map((i: Image) => ({
                  thumbnail: `https://drive.google.com/thumbnail?id=${i.hostId}&amp;sz=w200`,
                  enlarged: `https://drive.google.com/thumbnail?id=${i.hostId}&amp;sz=w1000`,
                  id: i.id,
                }))
            " />
        </div>
        <div class="mt-3">
          <div>Kết luận</div>
          <div>
            <InputText v-model:value="ticketRadiology.result" />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Đóng lại</VueButton>
          <VueButton
            :disabled="disabled"
            :loading="saveLoading"
            color="blue"
            type="submit"
            icon="save">
            {{ ticketRadiology.id ? 'Cập nhật' : 'Lưu lại' }}
          </VueButton>
        </div>
      </form>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped>
:deep(.description .ck-editor__editable) {
  height: 400px !important;
}
</style>
