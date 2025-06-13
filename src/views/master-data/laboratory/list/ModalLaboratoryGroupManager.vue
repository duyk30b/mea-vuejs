<script lang="ts" setup>
import { ref } from 'vue'
import { IconClose, IconDelete } from '../../../../common/icon-antd'
import { InputText, VueSelect } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import VueButton from '../../../../common/VueButton.vue'
import { LaboratoryGroup, LaboratoryGroupService } from '../../../../modules/laboratory-group'
import { PrintHtmlService } from '../../../../modules/print-html'
import { RoomInteractType, RoomService } from '@/modules/room'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const showModal = ref(false)
const laboratoryGroupList = ref<LaboratoryGroup[]>([])
const printHtmlOptions = ref<{ value: number; text: string }[]>([])
const roomOptions = ref<{ value: number; text: string }[]>([])
const saveLoading = ref(false)

const startFetchPrintHtml = async () => {
  const printHtmlAll = await PrintHtmlService.list({ sort: { priority: 'ASC' } })
  printHtmlOptions.value = [
    { value: 0, text: 'Mặc định' },
    ...printHtmlAll.map((i) => ({ value: i.id, text: i.name })),
  ]
}

const startFetchRoom = async () => {
  const romList = await RoomService.list({
    filter: { roomInteractType: RoomInteractType.Laboratory },
    sort: { id: 'ASC' },
  })
  roomOptions.value = [
    { value: 0, text: '--' },
    ...romList.map((i) => ({ value: i.id, text: i.name })),
  ]
}

const startFetchData = async () => {
  try {
    laboratoryGroupList.value = await LaboratoryGroupService.list({ sort: { id: 'ASC' } })
    await Promise.all([startFetchPrintHtml(), startFetchRoom()])
  } catch (error) {
    console.log('🚀 ~ file: ModalLaboratoryGroupManager.vue:30 ~ startFetchData ~ error:', error)
  }
}

const openModal = async () => {
  showModal.value = true
  await startFetchData()
}

const closeModal = () => {
  showModal.value = false
}

const handleClickAddLaboratoryGroup = () => {
  laboratoryGroupList.value.push(LaboratoryGroup.blank())
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    await LaboratoryGroupService.replaceAll(laboratoryGroupList.value)
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 100px; width: 1000px">
    <form class="bg-white" @submit.prevent="(e) => handleSave()">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Quản lý nhóm xét nghiệm</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 modal-data-product-tabs">
        <div class="mt-4 pb-20 table-wrapper" style="overflow-x: visible">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên Phiếu</th>
                <th>Phòng thực hiện</th>
                <th style="width: 300px">Mẫu In</th>
                <th>#</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="laboratoryGroupList.length === 0">
                <td colspan="20" class="text-center">Không có dữ liệu</td>
              </tr>
              <tr v-for="(laboratoryGroup, index) in laboratoryGroupList" :key="laboratoryGroup.id">
                <td class="text-center">
                  <span v-if="!!laboratoryGroup.id">GR{{ laboratoryGroup.id }}</span>
                  <span v-if="!laboratoryGroup.id"></span>
                </td>
                <td>
                  <InputText
                    v-model:value="laboratoryGroup.name"
                    required
                    placeholder="Điền tên nhóm xét nghiệm ở đây"
                  />
                </td>
                <td>
                  <VueSelect
                    v-model:value="laboratoryGroupList[index].roomId"
                    :options="roomOptions"
                  />
                </td>
                <td>
                  <VueSelect
                    v-model:value="laboratoryGroupList[index].printHtmlId"
                    :options="printHtmlOptions"
                  />
                </td>
                <td class="text-center">
                  <a style="color: var(--text-red)" @click="laboratoryGroupList.splice(index, 1)">
                    <IconDelete />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="mt-2">
            <VueButton icon="plus" @click="handleClickAddLaboratoryGroup">Thêm mới</VueButton>
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton icon="close" style="margin-left: auto" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton icon="save" type="submit" color="blue" :loading="saveLoading">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss" scoped></style>
