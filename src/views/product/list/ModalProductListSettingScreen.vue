<script setup lang="ts">
import { FileSearchOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { IconClose } from '../../../common/icon'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { OrganizationService } from '../../../modules/organization'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const settingDisplay = ref<typeof store.SCREEN_PRODUCT_LIST>(
  JSON.parse(JSON.stringify(store.SCREEN_PRODUCT_LIST))
)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_PRODUCT_LIST))
}

const closeModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.SCREEN_PRODUCT_LIST, settingData)
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
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Cài đặt hiển thị</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div class="mt-4 px-4 table-wrapper">
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
                  Hiển thị nút xem chi tiết (
                  <FileSearchOutlined />
                  )
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
                <a-checkbox v-model:checked="settingDisplay.group">Hiển thị nhóm</a-checkbox>
              </td>
            </tr>
            <tr>
              <td>
                <a-checkbox v-model:checked="settingDisplay.unit">Hiển thị đơn vị</a-checkbox>
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
                <a-checkbox v-model:checked="settingDisplay.action">Hiển thị nút sửa</a-checkbox>
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
