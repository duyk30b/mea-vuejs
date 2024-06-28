<script setup lang="ts">
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import { OrganizationService } from '../../../modules/organization'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const settingDisplay = ref<typeof store.SCREEN_INVOICE_LIST>(
  JSON.parse(JSON.stringify(store.SCREEN_INVOICE_LIST))
)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_INVOICE_LIST))
}

const refreshModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(
      SettingKey.SCREEN_INVOICE_LIST,
      settingData
    )
    message.success('Cập nhật cài đặt thành công')
    store.SCREEN_INVOICE_LIST = JSON.parse(settingData)

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
            <th>Chưa có nội dung</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </a-modal>
</template>