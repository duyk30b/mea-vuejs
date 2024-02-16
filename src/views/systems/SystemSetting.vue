<script setup lang="ts">
import { SaveOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { onUnmounted, ref } from 'vue'
import { useScreenStore } from '../../modules/_me/screen.store'
import { ScreenSettingKey } from '../../modules/_me/store.variable'
import { OrganizationService } from '../../modules/organization'

const screenStore = useScreenStore()

const settingDisplay = ref<typeof screenStore.SYSTEM_SETTING>(
  JSON.parse(JSON.stringify(screenStore.SYSTEM_SETTING))
)

const unsubscribe = screenStore.$subscribe((mutation, state) => {
  settingDisplay.value = JSON.parse(JSON.stringify(screenStore.SYSTEM_SETTING))
})

onUnmounted(() => unsubscribe())

const saveLoading = ref(false)

const saveSystemSetting = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(ScreenSettingKey.SYSTEM_SETTING, settingData)
    message.success('Cập nhật cài đặt thành công')
    screenStore.SYSTEM_SETTING = JSON.parse(settingData)
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
      <div class="font-medium" style="font-size: 1.2rem">
        <SettingOutlined style="margin-right: 1rem" />Cài đặt hệ thống
      </div>
    </div>
  </div>

  <div class="mx-4 mt-4 p-4 bg-white">
    <div style="max-width: 800px">
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
                  <a-radio style="display: flex; line-height: 36px" :value="1">
                    Hiển thị cơ bản: VD: Một triệu hai trăm ba mươi nghìn năm trăm đồng: 1,230,500
                  </a-radio>
                  <a-radio style="display: flex; line-height: 36px" :value="1000">
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
../../modules/_me/organization.store../../store/store.variable
