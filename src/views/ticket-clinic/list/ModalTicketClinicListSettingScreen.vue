<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { OrganizationService } from '../../../modules/organization'
import { TicketType } from '../../../modules/ticket'
import { VueSelect } from '../../../common/vue-form'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const settingDisplay = ref<typeof store.SCREEN_TICKET_CLINIC_LIST>(
  JSON.parse(JSON.stringify(store.SCREEN_TICKET_CLINIC_LIST))
)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_TICKET_CLINIC_LIST))
}

const closeModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.SCREEN_TICKET_CLINIC_LIST, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    store.SCREEN_TICKET_CLINIC_LIST = JSON.parse(settingData)

    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Cài đặt phòng khám</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div class="mt-4 pb-20 px-4 table-wrapper">
        <table>
          <thead>
            <tr>
              <th colspan="2">Cài đặt chung</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Loại phòng khám</td>
              <td>
                <div>
                  <VueSelect
                    v-model:value="settingDisplay.ticketType"
                    :options="[
                      { value: TicketType.Clinic, text: 'Phòng khám cơ bản' },
                      { value: TicketType.Eye, text: 'Phòng khám mắt' },
                      {
                        value: TicketType.Obstetric,
                        text: 'Phòng khám sản phụ khoa',
                      },
                    ]" />
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <a-checkbox v-model:checked="settingDisplay.buttonRegisterDraft">
                  Hiển thị nút Tiếp đón
                </a-checkbox>
              </td>
            </tr>
            <tr>
              <td colspan="2">
                <a-checkbox v-model:checked="settingDisplay.buttonRegisterExecuting">
                  Hiển thị nút khám mới
                </a-checkbox>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton icon="close" class="ml-auto" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton icon="save" color="blue" :loading="saveLoading" @click="handleSave">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>
