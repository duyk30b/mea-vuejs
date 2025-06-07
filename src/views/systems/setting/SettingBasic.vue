<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputCheckbox, InputRadio } from '../../../common/vue-form'
import VueButton from '../../../common/VueButton.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { OrganizationService } from '../../../modules/organization'
import { SettingApi } from '../../../modules/setting/setting.api'

const settingStore = useSettingStore()

const settingDisplay = ref<typeof settingStore.SYSTEM_SETTING>(
  JSON.parse(JSON.stringify(settingStore.SYSTEM_SETTING)),
)

const unsubscribe = settingStore.$subscribe((mutation, state) => {
  settingDisplay.value = JSON.parse(JSON.stringify(settingStore.SYSTEM_SETTING))
})

onUnmounted(() => unsubscribe())

const saveLoading = ref(false)

const saveSystemSetting = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.SYSTEM_SETTING, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    settingStore.SYSTEM_SETTING = JSON.parse(settingData)
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const loginGoogleDriver = async () => {
  const { url } = await SettingApi.loginGGDriver()
  window.open(url, '_blank', 'width=1000,height=700')
}

const logoutGoogleDriver = async () => {
  await SettingApi.logoutGGDriver()
  settingStore.GOOGLE_DRIVER = { email: '' }
}
</script>

<template>
  <div class="p-4">
    <div style="max-width: 1000px">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Cài đặt chung</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="flex items-center gap-4 justify-between">
                  <div>
                    <div>Tài khoản GOOGLE DRIVER</div>
                    <div style="font-weight: 500; font-style: italic">
                      {{ settingStore.GOOGLE_DRIVER.email }}
                    </div>
                  </div>
                  <div>
                    <VueButton
                      v-if="!settingStore.GOOGLE_DRIVER.email"
                      color="blue"
                      @click="loginGoogleDriver()"
                    >
                      Login Google Driver
                    </VueButton>

                    <VueButton
                      v-if="settingStore.GOOGLE_DRIVER.email"
                      color="blue"
                      @click="logoutGoogleDriver()"
                    >
                      Logout
                    </VueButton>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div>Hiển thị tiền</div>
                <div>
                  <InputRadio
                    v-model:value="settingDisplay.moneyDivisionFormat"
                    :options="[
                      { key: 1, label: 'Hiển thị cơ bản: VD: Một triệu hai trăm ba mươi nghìn năm trăm đồng: 1,230,500' },
                      { key: 1000, label: 'Hiển thị rút gọn: VD: Một triệu hai trăm ba mươi nghìn năm trăm đồng: 1,230.5' },
                    ]"
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div>Sản phẩm</div>
                <div style="line-height: 32px">
                  <InputCheckbox v-model:checked="settingDisplay.wholesalePrice">
                    Sử dụng giá bán sỉ
                  </InputCheckbox>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="my-4 flex justify-end">
        <VueButton color="blue" icon="save" @click="saveSystemSetting">Lưu lại</VueButton>
      </div>
    </div>
  </div>
</template>
