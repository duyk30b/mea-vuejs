<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../common/vue-tabs'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { OrganizationService } from '../../../modules/organization'

const TABS_KEY = {
  GROUP: 'GROUP',
}

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const GROUP = ref<typeof store.PROCEDURE_GROUP>(JSON.parse(JSON.stringify(store.PROCEDURE_GROUP)))

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref(TABS_KEY.GROUP)

const openModal = async () => {
  showModal.value = true
  GROUP.value = JSON.parse(JSON.stringify(store.PROCEDURE_GROUP))
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (activeTab.value === TABS_KEY.GROUP) {
      Object.keys(GROUP.value).forEach((key) => {
        if (!GROUP.value[key]) delete GROUP.value[key]
      })
      const data = JSON.stringify(GROUP.value)
      await OrganizationService.saveSettings(SettingKey.PROCEDURE_GROUP, data)
      store.PROCEDURE_GROUP = JSON.parse(data)
    } else {
      return AlertStore.addError('Cập nhật thất bại')
    }

    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalDataProcedure.vue:43 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const closeModal = () => {
  showModal.value = false
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Cài đặt dữ liệu</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div class="px-4 mt-4">
        <VueTabs :tabShow="activeTab">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.GROUP">Nhóm dịch vụ</VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.GROUP">
              <div class="w-full mt-4">
                <div class="text-center text-lg uppercase" style="font-weight: 500">
                  Danh sách nhóm dịch vụ
                </div>
                <div v-for="(r, key) in GROUP" :key="key">
                  <div class="py-2 flex items-center gap-4">
                    <InputText v-model:value="GROUP[key]" :prepend="key" style="flex: 1" />
                    <a style="color: var(--text-red)" @click="delete GROUP[key]">Xóa</a>
                  </div>
                </div>
              </div>
              <div class="py-2 flex justify-center">
                <VueButton color="blue" icon="plus" @click="GROUP[Date.now().toString(36)] = ''">
                  Thêm mới
                </VueButton>
              </div>
            </VueTabPanel>
          </template>
        </VueTabs>
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

<style lang="scss"></style>
