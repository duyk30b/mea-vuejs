
<script setup lang="ts">
import { OrganizationService } from '@/modules/organization'
import { useOrganizationStore } from '@/store/organization.store'
import { OrganizationSettingsType } from '@/store/store.variable'
import { message } from 'ant-design-vue'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useOrganizationStore()
const GROUP = ref<typeof store.PROCEDURE_GROUP>(JSON.parse(JSON.stringify(store.PROCEDURE_GROUP)))

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref('1')

const openModal = async () => {
  showModal.value = true
  GROUP.value = JSON.parse(JSON.stringify(store.PROCEDURE_GROUP))
}

const refreshModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (activeTab.value === '1') {
      Object.keys(GROUP.value).forEach((key) => {
        if (!GROUP.value[key]) delete GROUP.value[key]
      })
      const data = JSON.stringify(GROUP.value)
      await OrganizationService.saveSettings(OrganizationSettingsType.PROCEDURE_GROUP, data)
      store.PROCEDURE_GROUP = JSON.parse(data)
    }

    message.success('Cập nhật cài đặt thành công')
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalSettingDataProduct.vue:74 ~ handleSaveRoute ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}
const handleReload = () => {
  GROUP.value = JSON.parse(JSON.stringify(store.PROCEDURE_GROUP))
}

defineExpose({ openModal })
</script>

<template>
  <a-modal v-model:visible="showModal" width="900px" title="Cài đặt dữ liệu" :confirm-loading="saveLoading"
    :afterClose="refreshModal">
    <template #footer>
      <div class="flex justify-between px-2">
        <div>
          <a-button @click="handleReload">Tải lại</a-button>
        </div>
        <div>
          <a-button @click="showModal = false">Hủy</a-button>
          <a-button type="primary" @click="handleSave" :loading="saveLoading">Lưu lại</a-button>
        </div>
      </div>
    </template>
    <div class="modal-data-procedure-tabs">
      <a-tabs v-model:activeKey="activeTab" type="card" :tabBarGutter="10">
        <a-tab-pane key="1" tab="Nhóm dịch vụ">
          <div class="w-full">
            <div class="text-center font-bold">Danh sách nhóm dịch vụ</div>
            <div v-for="(r, key, i) in GROUP" :key="key">
              <div class="py-2 flex">
                <a-input :addon-before="i + 1" v-model:value="GROUP[key]" style="flex: 1" />
                <a-button type="text" @click="delete GROUP[key]" danger>Xóa</a-button>
              </div>
            </div>
          </div>
          <div class="py-2 flex justify-center">
            <a-button type="primary" @click="GROUP[Date.now().toString(36)] = ''">Thêm mới</a-button>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </a-modal>
</template>

<style lang="scss">
.modal-data-procedure-tabs {
  .ant-tabs-tab {
    border-top: 5px solid #d6d6d6 !important;

    &.ant-tabs-tab-active {
      border-top-color: #1890ff !important;
    }
  }
}
</style>
