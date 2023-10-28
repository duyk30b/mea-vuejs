<script setup lang="ts">
import { OrganizationService } from '@/modules/organization'
import { useOrganizationStore } from '@/store/organization.store'
import { OrganizationSettingsType } from '@/store/store.variable'
import { SaveOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { onMounted, onUnmounted, ref } from 'vue'

const organizationStore = useOrganizationStore()

const settingDisplay = ref<typeof organizationStore.SYSTEM_SETTING>(JSON.parse(JSON.stringify(organizationStore.SYSTEM_SETTING)))

const unsubscribe = organizationStore.$subscribe((mutation, state) => {
  settingDisplay.value = JSON.parse(JSON.stringify(organizationStore.SYSTEM_SETTING))
})

onUnmounted(() => unsubscribe())

const saveLoading = ref(false)

const saveSystemSetting = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(OrganizationSettingsType.SYSTEM_SETTING, settingData)
    message.success('Cập nhật cài đặt thành công')
    organizationStore.SYSTEM_SETTING = JSON.parse(settingData)
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

</script>

<template>
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.2rem;">
        <SettingOutlined style="margin-right: 1rem" />Cài đặt hệ thống
      </div>
    </div>
  </div>

  <div class="mx-4 mt-4 p-4 bg-white">
    <div style="max-width: 800px;">
      <div class="table-wrapper">
        <table class="screen-setting">
          <thead>
            <tr>
              <th>Hiển thị tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a-radio-group v-model:value="settingDisplay.moneyDivisionFormat">
                  <a-radio style="display:flex; line-height: 36px" :value="1">
                    Hiển thị cơ bản: VD: Một triệu hai trăm ba mươi nghìn năm trăm đồng: 1,230,500
                  </a-radio>
                  <a-radio style="display:flex; line-height: 36px;" :value="1000">
                    Hiển thị rút gọn: VD: Một triệu hai trăm ba mươi nghìn năm trăm đồng: 1,230.5
                  </a-radio>
                </a-radio-group>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="my-4 text-center">
        <a-button type="primary" @click="saveSystemSetting">
          <template #icon>
            <SaveOutlined />
          </template>
          Lưu lại
        </a-button>
      </div>
    </div>
  </div>
</template>
