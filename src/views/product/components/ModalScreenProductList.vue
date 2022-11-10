
<script setup lang="ts">
import { OrganizationService } from '@/modules/organization'
import { useOrganizationStore } from '@/store/organization.store'
import { OrganizationSettingsType } from '@/store/store.variable'
import { FileSearchOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useOrganizationStore()
const settingDisplay = ref<typeof store.SCREEN_PRODUCT_LIST>(JSON.parse(JSON.stringify(store.SCREEN_PRODUCT_LIST)))
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
    await OrganizationService.saveSettings(OrganizationSettingsType.SCREEN_PRODUCT_LIST, settingData)
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
  <a-modal v-model:visible="showModal" width="900px" title="Cài đặt hiển thị" :confirm-loading="saveLoading"
    :afterClose="refreshModal" @ok="handleSave">
    <div class="table-wrapper">
      <table class="screen-setting">
        <thead>
          <tr>
            <th>Màn hình danh sách hàng hóa</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td> <a-checkbox v-model:checked="settingDisplay.table.detail">Hiển thị nút xem chi tiết (
                <FileSearchOutlined /> )
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td> <a-checkbox v-model:checked="settingDisplay.table.substance">Hiển thị hoạt chất</a-checkbox>
            </td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.table.group">Hiển thị nhóm</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.table.unit">Hiển thị đơn vị</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.table.batch">Hiển thị lô hàng</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.table.expiryDate">Hiển thị hạn sử dụng</a-checkbox>
            </td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.table.costPrice">Hiển thị giá nhập</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.table.wholesalePrice">Hiển thị giá bán sỉ</a-checkbox>
            </td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.table.retailPrice">Hiển thị giá bán lẻ</a-checkbox>
            </td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.table.isActive">Hiển thị trạng thái</a-checkbox>
            </td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.table.action">Hiển thị nút sửa</a-checkbox>
            </td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th>Màn hình thêm/sửa hàng hóa</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td> <a-checkbox v-model:checked="settingDisplay.upsert.substance">Hiển thị hoạt chất</a-checkbox>
            </td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.upsert.group">Hiển thị nhóm</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.upsert.unit">Hiển thị đơn vị</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.upsert.route">Hiển thị đường dùng</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.upsert.source">Hiển thị nguồn gốc</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.upsert.hintUsage">Hiển thị cách sử dụng</a-checkbox></td>
          </tr>
        </tbody>
      </table>
    </div>
  </a-modal>
</template>
