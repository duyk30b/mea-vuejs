<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { IconApartment, IconCloudUpload, IconLogout } from '../../common/icon-antd'
import { InputNumber, InputText } from '../../common/vue-form'
import VueButton from '../../common/VueButton.vue'
import { useMeStore } from '../../modules/_me/me.store'
import { useSettingStore } from '../../modules/_me/setting.store'
import { OrganizationService } from '../../modules/organization'
import { PermissionApi } from '../../modules/permission/permission.api'
import { RootDataApi } from '../../modules/root-data/root-data.api'
import { SettingApi } from '../../modules/setting/setting.api'

const settingStore = useSettingStore()
const meStore = useMeStore()

const keyMigration = ref<string>('')

const googleDriverAccounts = ref<any[]>([])
onMounted(async () => {
  await loadGoogleDriverAccounts()
})

const loadGoogleDriverAccounts = async () => {
  googleDriverAccounts.value = await SettingApi.getAllAccountsGGDriver()
}

const resetPermissionData = async () => {
  await PermissionApi.initData()
}

const loginGoogleDriver = async () => {
  const { url } = await SettingApi.loginGGDriver()
  window.open(url, '_blank', 'width=1000,height=700')
}

const logoutGoogleDriver = async () => {
  await SettingApi.logoutGGDriver()
  settingStore.GOOGLE_DRIVER = { email: '' }
  await loadGoogleDriverAccounts()
}

const uploadPostgresToGoogleDriver = async () => {
  try {
    await RootDataApi.uploadPostgresToGoogleDriver()
  } catch (error) {
    console.log('🚀 ~ RootData.vue:46 ~ uploadPostgresToGoogleDriver ~ error:', error)
  }
}

const saveRootSetting = async () => {
  await OrganizationService.saveSettings('ROOT_SETTING' as any, JSON.stringify(meStore.rootSetting))
}

const startMigration = async () => {
  try {
    await RootDataApi.migration({ key: keyMigration.value })
  } catch (error) {
    console.log('🚀 ~ file: RootData.vue:51 ~ startMigration ~ error:', error)
  }
}
</script>

<template>
  <div class="mx-4 mt-4">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2 font-medium text-xl">
        <IconApartment />
        Dữ liệu hệ thống
      </div>
    </div>
  </div>

  <div class="mx-4 mt-4 p-4 bg-white">
    <div style="max-width: 800px">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th colspan="2">Data</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center">1</td>
              <td>Permission</td>
              <td>
                <VueButton color="blue" @click="resetPermissionData()">
                  Reset Permission Data
                </VueButton>
              </td>
            </tr>
            <tr>
              <td class="text-center">2</td>
              <td>
                <div>Google Driver Account</div>
                <div>
                  <table class="bg-white">
                    <tr v-for="(acc, index) in googleDriverAccounts" :key="index">
                      <td>{{ acc.oid }}</td>
                      <td class="px-2">{{ acc.email }}</td>
                      <td>{{ acc.refreshToken.slice(0, 20) + '...' }}</td>
                    </tr>
                  </table>
                </div>
              </td>
              <td>
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
                  <IconLogout />
                  Logout
                </VueButton>
              </td>
            </tr>
            <tr>
              <td class="text-center">3</td>
              <td>Migration</td>
              <td>
                <form class="flex items-center" @submit.prevent="startMigration">
                  <InputText
                    v-model:value="keyMigration"
                    placeholder="input key migration"
                    required
                  />
                  <VueButton color="blue" type="submit">RUN</VueButton>
                </form>
              </td>
            </tr>
            <tr>
              <td class="text-center">4</td>
              <td>Upload postgres to GoogleDriver</td>
              <td>
                <VueButton color="blue" @click="uploadPostgresToGoogleDriver">
                  <IconCloudUpload />
                  Start Upload
                </VueButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-wrapper mt-8">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th colspan="2">Setting</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowspan="6" class="text-center">1</td>
              <td colspan="2" style="" class="italic underline">Mẫu in mặc định</td>
            </tr>
            <tr>
              <td>Hoá đơn</td>
              <td>
                <InputNumber v-model:value="meStore.rootSetting.printDefault.invoice" />
              </td>
            </tr>
            <tr>
              <td>Đơn thuốc</td>
              <td>
                <InputNumber v-model:value="meStore.rootSetting.printDefault.prescription" />
              </td>
            </tr>
            <tr>
              <td>Xét nghiệm</td>
              <td>
                <InputNumber v-model:value="meStore.rootSetting.printDefault.laboratory" />
              </td>
            </tr>
            <tr>
              <td>CĐHA</td>
              <td>
                <InputNumber v-model:value="meStore.rootSetting.printDefault.radiology" />
              </td>
            </tr>
            <tr>
              <td>Đo thị lực</td>
              <td>
                <InputNumber v-model:value="meStore.rootSetting.printDefault.optometry" />
              </td>
            </tr>

            <tr>
              <td colspan="3">
                <div class="mt-2">
                  <VueButton color="blue" @click="saveRootSetting()">Lưu lại</VueButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
