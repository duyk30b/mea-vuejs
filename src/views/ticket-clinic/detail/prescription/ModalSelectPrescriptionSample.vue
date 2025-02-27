<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose, IconTrash } from '../../../../common/icon'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import {
  PrescriptionSample,
  PrescriptionSampleService,
} from '../../../../modules/prescription-sample'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'

const prescriptionSampleList = ref<PrescriptionSample[]>([])

const emit = defineEmits<{ (e: 'success'): void }>()

const showModal = ref(false)
const returnLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  prescriptionSampleList.value = await PrescriptionSampleService.list({})
}

const closeModal = () => {
  showModal.value = false
}

const destroyPrescriptionSample = async (prescriptionSampleId: number) => {
  ModalStore.confirm({
    title: 'Xác nhận xóa đơn mẫu ?',
    content: [
      '- Hệ thống sẽ xóa đơn mẫu này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await PrescriptionSampleService.destroyOne(prescriptionSampleId)

        const indexDestroy = prescriptionSampleList.value.findIndex((i) => {
          return i.id === prescriptionSampleId
        })
        if (indexDestroy !== -1) {
          prescriptionSampleList.value.splice(indexDestroy, 1)
        }
      } catch (error) {
        console.log('🚀 ~ destroyPrescriptionSample: ~ error:', error)
      }
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 100px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Danh sách đơn thuốc mẫu</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="table-wrapper p-4">
        <table>
          <thead>
            <tr>
              <th style="width: 30px">#</th>
              <th style="width: 60px"></th>
              <th>Tên</th>
              <th style="width: 40px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="prescriptionSampleList?.length == 0">
              <td colspan="20" class="text-center">Chưa có đơn mẫu nào</td>
            </tr>
            <tr
              v-for="(prescriptionSample, index) in prescriptionSampleList"
              :key="prescriptionSample.id">
              <td class="text-center">{{ index + 1 }}</td>
              <td>
                <div>
                  <VueButton size="small">Chọn</VueButton>
                </div>
              </td>
              <td class="text-left">
                {{ prescriptionSample.name }}
              </td>
              <td class="text-center">
                <a class="text-red-500" @click="destroyPrescriptionSample(prescriptionSample.id)">
                  <IconTrash width="16" height="16" />
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pb-4 flex justify-center gap-4">
        <VueButton type="reset" icon="close" @click="closeModal">Đóng lại</VueButton>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
