<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { IconClose } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { OrganizationService } from '../../../modules/organization'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const settingDisplay = ref<typeof store.SCREEN_CUSTOMER_UPSERT>(
  JSON.parse(JSON.stringify(store.SCREEN_CUSTOMER_UPSERT))
)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_CUSTOMER_UPSERT))
}

const handleClose = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.SCREEN_CUSTOMER_UPSERT, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    store.SCREEN_CUSTOMER_UPSERT = JSON.parse(settingData)

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

      <div class="p-4 table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Màn hình thêm/sửa khách hàng</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a-checkbox v-model:checked="settingDisplay.phone">
                  Hiển thị số điện thoại
                </a-checkbox>
              </td>
            </tr>
            <tr>
              <td>
                <a-checkbox v-model:checked="settingDisplay.birthday">
                  Hiển thị ngày sinh
                </a-checkbox>
              </td>
            </tr>
            <tr>
              <td>
                <a-checkbox v-model:checked="settingDisplay.gender">Hiển thị giới tính</a-checkbox>
              </td>
            </tr>
            <tr>
              <td>
                <a-checkbox v-model:checked="settingDisplay.identityCard">
                  Hiển thị căn cước công dân
                </a-checkbox>
              </td>
            </tr>
            <tr>
              <td>
                <a-checkbox v-model:checked="settingDisplay.address">
                  Hiển thị điền thông tin địa chỉ
                </a-checkbox>
              </td>
            </tr>
            <tr>
              <td>
                <a-checkbox v-model:checked="settingDisplay.relative">
                  Hiển thị điền thông tin liên hệ khác
                </a-checkbox>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="p-4">
        <div class="flex justify-end gap-4">
          <VueButton icon="close" @click="handleClose">Hủy bỏ</VueButton>
          <VueButton color="blue" type="button" icon="plus" @click="handleSave">Lưu lại</VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>
