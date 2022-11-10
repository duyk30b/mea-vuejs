
<script setup lang="ts">
import { OrganizationService } from '@/modules/organization'
import { useOrganizationStore } from '@/store/organization.store'
import { OrganizationSettingsType } from '@/store/store.variable'
import { FileSearchOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useOrganizationStore()
const settingDisplay = ref<typeof store.SCREEN_DISTRIBUTOR_LIST>(JSON.parse(JSON.stringify(store.SCREEN_DISTRIBUTOR_LIST)))
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_DISTRIBUTOR_LIST))
}

const refreshModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(OrganizationSettingsType.SCREEN_DISTRIBUTOR_LIST, settingData)
    message.success('Cập nhật cài đặt thành công')
    store.SCREEN_DISTRIBUTOR_LIST = JSON.parse(settingData)

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
  <a-modal v-model:visible="showModal" width="900px" title="Cài đặt hiển thị" :confirm-loading="saveLoading"
    :afterClose="refreshModal" @ok="handleSave">
    <div class="table-wrapper">
      <table class="screen-setting">
        <thead>
          <tr>
            <th>Màn hình danh sách nhà cung cấp</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.table.detail">Hiển thị nút xem chi tiết nhà cung cấp (
                <FileSearchOutlined /> )
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.table.phone">Hiển thị số điện thoại</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.table.address">Hiển thị địa chỉ</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.table.note">Hiển thị ghi chú</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.table.isActive">Hiển thị trạng thái</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.table.action">Hiển thị nút sửa</a-checkbox></td>
          </tr>
        </tbody>
      </table>

      <table class="mt-4 screen-setting">
        <thead>
          <tr>
            <th>Màn hình thêm/sửa nhà cung cấp</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.upsert.address">Hiển thị địa chỉ</a-checkbox></td>
          </tr>
        </tbody>
      </table>
    </div>
  </a-modal>
</template>

<style lang="scss" scoped></style>
