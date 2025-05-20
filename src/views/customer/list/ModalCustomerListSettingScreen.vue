<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconFileSearch } from '../../../common/icon-antd'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputCheckbox } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { OrganizationService } from '../../../modules/organization'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const settingDisplay = ref<typeof store.SCREEN_CUSTOMER_LIST>(
  JSON.parse(JSON.stringify(store.SCREEN_CUSTOMER_LIST)),
)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_CUSTOMER_LIST))
}

const closeModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.SCREEN_CUSTOMER_LIST, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    store.SCREEN_CUSTOMER_LIST = JSON.parse(settingData)

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
      <div class="table-wrapper mt-4 px-4">
        <table>
          <thead>
            <tr>
              <th>Màn hình danh sách khách hàng</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <InputCheckbox v-model:value="settingDisplay.detail">
                  Hiển thị nút xem chi tiết khách hàng (
                  <IconFileSearch />
                  )
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox
                  v-model:value="settingDisplay.phone"
                  label="Hiển thị số điện thoại"
                />
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox v-model:value="settingDisplay.gender" label="Hiển thị giới tính" />
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox v-model:value="settingDisplay.birthday" label="Hiển thị ngày sinh" />
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox v-model:value="settingDisplay.address" label="Hiển thị địa chỉ" />
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox v-model:value="settingDisplay.note" label="Hiển thị ghi chú" />
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox
                  v-model:value="settingDisplay.isActive"
                  label="Hiển thị trạng thái"
                />
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox v-model:value="settingDisplay.action" label="Hiển thị nút sửa" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton icon="close" style="margin-left: auto" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton icon="save" color="blue" :loading="saveLoading" @click="handleSave">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
