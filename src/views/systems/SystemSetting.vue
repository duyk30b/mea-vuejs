<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { IconSetting } from '../../common/icon'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { useSettingStore } from '../../modules/_me/setting.store'
import { SettingKey } from '../../modules/_me/store.variable'
import { OrganizationService } from '../../modules/organization'
import { SettingApi } from '../../modules/setting/setting.api'

const settingStore = useSettingStore()

const settingDisplay = ref<typeof settingStore.SYSTEM_SETTING>(
  JSON.parse(JSON.stringify(settingStore.SYSTEM_SETTING))
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
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.2rem">
        <IconSetting style="margin-right: 1rem" />
        Cài đặt
      </div>
    </div>
  </div>

  <div class="mx-4 mt-4 p-4 bg-white">
    <div style="max-width: 800px">
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
                      @click="loginGoogleDriver()">
                      Login Google Driver
                    </VueButton>

                    <VueButton
                      v-if="settingStore.GOOGLE_DRIVER.email"
                      color="blue"
                      @click="logoutGoogleDriver()">
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
                  <a-radio-group v-model:value="settingDisplay.moneyDivisionFormat">
                    <a-radio style="display: flex; line-height: 32px" :value="1">
                      Hiển thị cơ bản: VD: Một triệu hai trăm ba mươi nghìn năm trăm đồng: 1,230,500
                    </a-radio>
                    <a-radio style="display: flex; line-height: 32px" :value="1000">
                      Hiển thị rút gọn: VD: Một triệu hai trăm ba mươi nghìn năm trăm đồng: 1,230.5
                    </a-radio>
                  </a-radio-group>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div>Sản phẩm</div>
                <div style="line-height: 32px">
                  <a-checkbox v-model:checked="settingDisplay.retailPrice">
                    Sử dụng giá bán lẻ
                  </a-checkbox>
                </div>
                <div style="line-height: 32px">
                  <a-checkbox v-model:checked="settingDisplay.wholesalePrice">
                    Sử dụng giá bán sỉ
                  </a-checkbox>
                </div>
                <div style="line-height: 32px">
                  <a-checkbox v-model:checked="settingDisplay.allowNegativeQuantity">
                    Cho phép tồn kho có số lượng âm (xuất kho được phép nhiều hơn số lượng tồn)
                  </a-checkbox>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="my-4 text-center">
        <VueButton color="blue" icon="save" @click="saveSystemSetting">Lưu lại</VueButton>
      </div>
    </div>
  </div>
</template>
