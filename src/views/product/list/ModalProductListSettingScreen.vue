<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconFileSearch } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { OrganizationService } from '../../../modules/organization'
import { InputCheckbox } from '../../../common/vue-form'

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
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
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
                <InputCheckbox v-model:checked="settingDisplay.detail">
                  Hiển thị nút xem chi tiết (
                  <IconFileSearch />
                  )
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox v-model:checked="settingDisplay.substance">
                  Hiển thị hoạt chất
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox v-model:checked="settingDisplay.group">Hiển thị nhóm</InputCheckbox>
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox v-model:checked="settingDisplay.unit">Hiển thị đơn vị</InputCheckbox>
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox v-model:checked="settingDisplay.warehouse">Hiển thị kho</InputCheckbox>
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox v-model:checked="settingDisplay.distributor">Hiển thị nhà cung cấp</InputCheckbox>
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox v-model:checked="settingDisplay.lotNumber">Hiển thị số lô</InputCheckbox>
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox v-model:checked="settingDisplay.expiryDate">Hiển thị HSD</InputCheckbox>
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox v-model:checked="settingDisplay.costPrice">
                  Hiển thị giá nhập
                </InputCheckbox>
              </td>
            </tr>

            <tr>
              <td>
                <InputCheckbox v-model:checked="settingDisplay.action">Hiển thị nút sửa</InputCheckbox>
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
