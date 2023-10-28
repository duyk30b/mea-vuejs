<script setup lang="ts">
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
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

const refreshModal = () => {
  user.value = User.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (newPassword.value !== newPasswordRepeat.value) {
      return message.error('Điền mật khẩu lần 2 không chính xác')
    }
    await MeApi.changePassword(oldPassword.value, newPassword.value)
    message.success('Đổi mật khẩu thành công')
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
  <a-modal
    v-model:visible="showModal"
    width="900px"
    :title="user.id ? 'Cập nhật thông tin người dùng' : 'Tạo người dùng mới'"
    :confirm-loading="saveLoading"
    :afterClose="refreshModal"
    @ok="handleSave"
  >
    <div>
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
  </a-modal>
</template>
