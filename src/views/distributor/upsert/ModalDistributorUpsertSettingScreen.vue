<script setup lang="ts">
import { CloseOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import VueModal from '../../../common/VueModal.vue'
import { OrganizationService } from '../../../modules/organization'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const settingDisplay = ref<typeof store.SCREEN_DISTRIBUTOR_UPSERT>(
  JSON.parse(JSON.stringify(store.SCREEN_DISTRIBUTOR_UPSERT))
)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_DISTRIBUTOR_UPSERT))
}

const handleClose = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.SCREEN_DISTRIBUTOR_UPSERT, settingData)
    message.success('Cập nhật cài đặt thành công')
    store.SCREEN_DISTRIBUTOR_UPSERT = JSON.parse(settingData)

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
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4">
        <table>
          <thead>
            <tr>
              <th>Màn hình thêm/sửa nhà cung cấp</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a-checkbox v-model:checked="settingDisplay.address">
                  Hiển thị điền thông tin địa chỉ
                </a-checkbox>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="p-4">
        <div class="flex justify-end gap-4">
          <a-button @click="handleClose">
            <template #icon>
              <PlusOutlined />
            </template>
            Hủy bỏ
          </a-button>
          <a-button type="primary" @click="handleSave">
            <template #icon>
              <PlusOutlined />
            </template>
            Lưu lại
          </a-button>
        </div>
      </div>
    </div>
  </VueModal>
</template>
