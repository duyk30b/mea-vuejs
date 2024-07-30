<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { OrganizationService } from '../../../modules/organization'
import { IconClose } from '../../../common/icon'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const settingDisplay = ref<typeof store.SCREEN_TICKET_ORDER_LIST>(
  JSON.parse(JSON.stringify(store.SCREEN_TICKET_ORDER_LIST))
)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_TICKET_ORDER_LIST))
}

const handleClose = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.SCREEN_TICKET_ORDER_LIST, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    store.SCREEN_TICKET_ORDER_LIST = JSON.parse(settingData)

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
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Cài đặt hiển thị</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="handleClose">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Màn hình danh sách đơn hàng</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <a-checkbox v-model:checked="settingDisplay.profit">Hiển thị tiền lãi</a-checkbox>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="p-4">
        <div class="flex justify-end gap-4">
          <VueButton icon="close" @click="handleClose">Hủy bỏ</VueButton>
          <VueButton color="blue" type="button" icon="save" @click="handleSave">Lưu lại</VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>
