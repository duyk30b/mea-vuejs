<script setup lang="ts">
import { ref } from 'vue'
import VueModal from '../../../../common/VueModal.vue'
import { IconClose } from '../../../../common/icon'
import { VisitRadiology, VisitRadiologyApi } from '../../../../modules/visit-radiology'
import { BasicEditor } from '../../../../ckeditor/class-editor'
import InputText from '../../../../common/vue-form/InputText.vue'
import VueButton from '../../../../common/VueButton.vue'
import { ImageHost } from '../../../../modules/image/image.model'
import ImageUpload from '../../../../common/ImageUpload.vue'
import dayjs, { Dayjs } from 'dayjs'
import { useMeStore } from '../../../../modules/_me/me.store'

const imageUploadRef = ref<InstanceType<typeof ImageUpload>>()

const meStore = useMeStore()

const showModal = ref(false)
const visitRadiology = ref<VisitRadiology>(VisitRadiology.blank())

const startedAt = ref<Dayjs>(dayjs())
const saveLoading = ref(false)

const openModal = async (instance: VisitRadiology) => {
  showModal.value = true
  visitRadiology.value = VisitRadiology.clone(instance)
  if (instance.startedAt == null) {
    visitRadiology.value.description = instance.radiology?.default || ''
    startedAt.value = dayjs(new Date())
  } else {
    startedAt.value = dayjs(new Date(instance.startedAt))
  }
}

const closeModal = () => {
  showModal.value = false
}

const startSave = async () => {
  try {
    saveLoading.value = true
    visitRadiology.value.startedAt = startedAt.value.valueOf()
    visitRadiology.value.doctorId = meStore.user?.id || 0

    const { filesPosition, imageIdsKeep, files } = imageUploadRef.value?.getData() || {
      filesPosition: [],
      imageIdsKeep: [],
      files: [],
    }

    if (!visitRadiology.value.id) {
      await VisitRadiologyApi.createOne({
        object: visitRadiology.value,
        files,
      })
    } else {
      await VisitRadiologyApi.updateOne({
        id: visitRadiology.value.id,
        imageIdsKeep,
        files,
        filesPosition,
        object: visitRadiology.value,
      })
    }
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalVisitRadiologyResult.vue:61 ~ startSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 800px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ visitRadiology.radiology?.name }}
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
              <InputText disabled :value="meStore.user?.fullName" />
            </div>
          </div>
        </div>
        <div class="mt-3">
          <div>Mô tả</div>
          <div class="description">
            <ckeditor v-model="visitRadiology.description" :editor="BasicEditor"></ckeditor>
          </div>
        </div>
        <div class="mt-3">
          <div>Hình ảnh</div>
          <ImageUpload
            ref="imageUploadRef"
            :height="100"
            :rootImageList="
              (visitRadiology.imageList || [])
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
            <InputText v-model:value="visitRadiology.result" />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Đóng lại</VueButton>
          <VueButton :loading="saveLoading" color="blue" type="submit" icon="save">
            {{ visitRadiology.id ? 'Cập nhật' : 'Lưu lại' }}
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
