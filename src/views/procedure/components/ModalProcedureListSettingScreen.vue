<script setup lang="ts">
import { FileSearchOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { ScreenSettingKey } from '../../../modules/_me/store.variable'
import { OrganizationService } from '../../../modules/organization'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useScreenStore()
const settingDisplay = ref<typeof store.SCREEN_PROCEDURE_LIST>(
  JSON.parse(JSON.stringify(store.SCREEN_PROCEDURE_LIST))
)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_PROCEDURE_LIST))
}

const refreshModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(ScreenSettingKey.SCREEN_PROCEDURE_LIST, settingData)
    message.success('Cập nhật cài đặt thành công')
    store.SCREEN_PROCEDURE_LIST = JSON.parse(settingData)

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
  <a-modal
    v-model:visible="showModal"
    width="900px"
    title="Cài đặt hiển thị"
    :confirm-loading="saveLoading"
    :afterClose="refreshModal"
    @ok="handleSave"
  >
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Màn hình danh sách dịch vụ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.table.detail">
                Hiển thị nút xem chi tiết ( <FileSearchOutlined /> )
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.table.group"> Hiển thị nhóm </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.table.status">
                Hiển thị trạng thái
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.table.action">
                Hiển thị nút sửa
              </a-checkbox>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </a-modal>
</template>
