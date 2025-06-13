<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { IconSetting } from '../../common/icon-antd'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { InputDate, InputRadio, InputText } from '../../common/vue-form'
import { MeApi } from '../../modules/_me/me.api'
import { useSettingStore } from '../../modules/_me/setting.store'
import { User } from '../../modules/user'
import ModalChangePassword from './modal/ModalChangePassword.vue'
import { MeService } from '../../modules/_me/me.service'

const modalChangePassword = ref<InstanceType<typeof ModalChangePassword>>()

const settingStore = useSettingStore()
const { isMobile } = settingStore

const user = ref<User>(User.from(MeService.user.value || User.blank()))
const saveLoading = ref(false)

onBeforeMount(async () => {
  const apiResult = await MeApi.info()
  user.value = apiResult.user
})

const saveUser = async () => {
  try {
    saveLoading.value = true
    const userData = await MeApi.updateInfo(user.value)
    user.value = userData
    MeService.user.value = User.from(userData)
    AlertStore.addSuccess('Cập nhật thông tin cá nhân thành công')
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const disableButtonSave = computed(() => {
  return JSON.stringify(user.value) === JSON.stringify(MeService.user.value)
})
</script>

<template>
  <ModalChangePassword ref="modalChangePassword" />
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.2rem">
        <IconSetting style="margin-right: 1rem" />
        Thông tin cá nhân
      </div>
    </div>
  </div>
  <div class="mx-4 mt-4 px-4 pt-2 bg-white">
    <div style="max-width: 800px">
      <div class="flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Họ Tên</div>
        <InputText v-model:value="user.fullName" />
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Tên đăng nhập</div>
        <InputText disabled :value="user.username" />
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Mật khẩu</div>
        <div style="display: flex; width: 100%">
          <InputText value="********************" style="width: calc(100% - 120px)" />
          <VueButton
            color="blue"
            style="width: 120px"
            @click="modalChangePassword?.openModal(user)"
          >
            Đổi mật khẩu
          </VueButton>
        </div>
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Ngày sinh</div>
        <div style="flex: 1">
          <InputDate
            v-model:value="user.birthday"
            format="DD/MM/YYYY"
            type-parser="number"
            class="w-full"
          />
        </div>
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Giới tính</div>
        <div style="flex: 1">
          <InputRadio
            v-model:value="user.gender"
            :options="[
              { key: 1, label: 'Nam' },
              { key: 0, label: 'Nữ' },
            ]"
          />
        </div>
      </div>

      <div class="my-8 text-center flex justify-center">
        <VueButton color="blue" :disabled="disableButtonSave" icon="save" @click="saveUser">
          Lưu lại
        </VueButton>
      </div>
    </div>
  </div>
</template>
