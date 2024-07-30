<script setup lang="ts">
import { ref } from 'vue'
import { IconClose } from '../../../../common/icon'
import ImageUploadMultiple from '../../../../common/image-upload/ImageUploadMultiple.vue'
import { InputDate } from '../../../../common/vue-form'
import InputText from '../../../../common/vue-form/InputText.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import VueButton from '../../../../common/VueButton.vue'
import WysiwygEditor from '../../../../common/wysiwyg-editor/WysiwygEditor.vue'
import { useMeStore } from '../../../../modules/_me/me.store'
import { ImageHost } from '../../../../modules/image/image.model'
import { TicketRadiology, TicketRadiologyApi } from '../../../../modules/ticket-radiology'

const imageUploadMultipleRef = ref<InstanceType<typeof ImageUploadMultiple>>()

const meStore = useMeStore()

const showModal = ref(false)
const ticketRadiology = ref<TicketRadiology>(TicketRadiology.blank())

const saveLoading = ref(false)

const disabled = ref(true)
const editable = ref(true)

const openModalByInstance = async (instance: TicketRadiology, options: { editable: boolean }) => {
  showModal.value = true
  ticketRadiology.value = TicketRadiology.from(instance)
  if (instance.startedAt == null) {
    ticketRadiology.value.description = instance.radiology?.descriptionDefault || ''
    ticketRadiology.value.result = instance.radiology?.resultDefault || ''
  }
  ticketRadiology.value.startedAt = Date.now()

  // if (editable && !ticketRadiology.value.doctor) {
  //   ticketRadiology.value.doctor = meStore.user || User.blank()
  // }
  disabled.value = !options.editable
  editable.value = options.editable
}

const openModalById = async (radiologyId: number) => {
  showModal.value = true
  ticketRadiology.value = await TicketRadiologyApi.detail(radiologyId, {
    relation: { imageList: true, radiology: {} },
  })
  disabled.value = true
}

const closeModal = () => {
  showModal.value = false
  ticketRadiology.value = TicketRadiology.blank()
}

const startSave = async () => {
  try {
    saveLoading.value = true
    const { filesPosition, imageIdsKeep, files } = imageUploadMultipleRef.value?.getData() || {
      filesPosition: [],
      imageIdsKeep: [],
      files: [],
    }

    if (!ticketRadiology.value.id) {
      await TicketRadiologyApi.createCompleted({
        ticketRadiology: ticketRadiology.value,
        files,
      })
    } else {
      await TicketRadiologyApi.updateResult({
        ticketRadiology: ticketRadiology.value,
        imageIdsKeep,
        files,
        filesPosition,
      })
    }
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalTicketRadiologyResult.vue:61 ~ startSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const cancelResult = async () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn hủy kết quả piếu CĐHA này',
    content: [''],
    async onOk() {
      await TicketRadiologyApi.cancelResult(ticketRadiology.value.id)
      closeModal()
    },
  })
}

defineExpose({ openModalByInstance, openModalById })
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
            <div>Thời gian thực hiện</div>
            <div>
              <InputDate
                v-model:value="ticketRadiology.startedAt"
                :disabled="!editable"
                defaultType="date"
                showTime
                typeParser="number" />
            </div>
          </div>
          <!-- <div class="flex-1">
            <div>BS thực hiện</div>
            <div>
              <InputText disabled :value="ticketRadiology.doctor?.fullName" />
            </div>
          </div> -->
        </div>
        <div class="mt-3">
          <div>Mô tả</div>
          <div style="height: 400px">
            <WysiwygEditor v-model:value="ticketRadiology.description" />
          </div>
        </div>
        <div class="mt-3">
          <div>Hình ảnh</div>
          <ImageUploadMultiple
            ref="imageUploadMultipleRef"
            :height="100"
            :editable="editable"
            :rootImageList="
              (ticketRadiology.imageList || [])
                .filter((i) => i.hostType === ImageHost.GoogleDriver)
                .map((i) => ({
                  thumbnail: `https://drive.google.com/thumbnail?id=${i.hostId}&amp;sz=w200`,
                  enlarged: `https://drive.google.com/thumbnail?id=${i.hostId}&amp;sz=w1000`,
                  id: i.id,
                }))
            " />
        </div>
        <div class="mt-3">
          <div>Kết luận</div>
          <div>
            <InputText v-model:value="ticketRadiology.result" :disabled="!editable" />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-4">
          <VueButton
            v-if="editable && ticketRadiology.id"
            color="red"
            type="button"
            icon="close"
            @click="cancelResult">
            Hủy kết quả
          </VueButton>
          <VueButton class="ml-auto" type="reset" icon="close" @click="closeModal">
            Đóng lại
          </VueButton>
          <VueButton
            v-if="editable"
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

<style lang="scss" scoped></style>
