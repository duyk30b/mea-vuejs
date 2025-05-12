<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { MeApi } from '../../../modules/_me/me.api'
import { AuthService } from '../../../modules/auth/auth.service'
import { User } from '../../../modules/user'

const showModal = ref(false)
const user = ref(User.blank())
const saveLoading = ref(false)
const router = useRouter()

const oldPassword = ref<string>('')
const newPassword = ref<string>('')
const newPasswordRepeat = ref<string>('')

const openModal = async (userValue: User) => {
  showModal.value = true
  user.value = userValue
}

const closeModal = () => {
  user.value = User.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (newPassword.value !== newPasswordRepeat.value) {
      return AlertStore.addError('Điền mật khẩu lần 2 không chính xác')
    }
    await MeApi.changePassword(oldPassword.value, newPassword.value)
    AlertStore.addSuccess('Đổi mật khẩu thành công')
    AuthService.logout()
  } catch (error) {
    console.log('🚀 ~ file: ChangePassword.vue:38 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">
          {{ user.id ? 'Cập nhật thông tin người dùng' : 'Tạo người dùng mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div class="mt-4 px-4">
        <div class="flex items-center mb-3">
          <div style="width: 100px; flex: none">Tên đăng nhập</div>
          <a-input disabled :value="user.username" class="flex-auto" />
        </div>

        <div class="flex items-center mb-3">
          <div style="width: 100px; flex: none">Mật khẩu cũ</div>
          <a-input-password v-model:value="oldPassword" class="flex-auto" />
        </div>

        <div class="flex items-center mb-3">
          <div style="width: 100px; flex: none">Mật khẩu mới</div>
          <a-input-password v-model:value="newPassword" class="flex-auto" />
        </div>

        <div class="flex items-center mb-3">
          <div style="width: 100px; flex: none">Mật khẩu mới</div>
          <a-input-password v-model:value="newPasswordRepeat" class="flex-auto" />
        </div>
      </div>
      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton icon="close" style="margin-left:auto" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton icon="save" color="blue" :loading="saveLoading" @click="handleSave">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>
