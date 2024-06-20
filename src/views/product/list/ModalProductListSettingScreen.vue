<script setup lang="ts">
import { FileSearchOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import { OrganizationService } from '../../../modules/organization'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { ScreenSettingKey } from '../../../modules/_me/store.variable'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useScreenStore()
const settingDisplay = ref<typeof store.SCREEN_PRODUCT_LIST>(
  JSON.parse(JSON.stringify(store.SCREEN_PRODUCT_LIST))
)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_PRODUCT_LIST))
}

const refreshModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(ScreenSettingKey.SCREEN_PRODUCT_LIST, settingData)
    message.success('Cập nhật cài đặt thành công')
    store.SCREEN_PRODUCT_LIST = JSON.parse(settingData)

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
            <th>Màn hình danh sách hàng hóa</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.detail">
                Hiển thị nút xem chi tiết ( <FileSearchOutlined /> )
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.substance">
                Hiển thị hoạt chất
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.group"> Hiển thị nhóm </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.unit"> Hiển thị đơn vị </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.costPrice">
                Hiển thị giá nhập
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.isActive">
                Hiển thị trạng thái
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.action"> Hiển thị nút sửa </a-checkbox>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </a-modal>
</template>
