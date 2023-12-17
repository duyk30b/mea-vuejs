<script setup lang="ts">
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { ORG_PHONE } from '@/core/local-storage.service'
import { AuthService } from '@/modules/auth'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const result = ref<string>('')
const btnDisable = ref<boolean>(false)

const formState = reactive({
  orgPhone: localStorage.getItem(ORG_PHONE) || '',
  email: '',
  username: '',
})

const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo)
}

const loading = ref(false)

const startSendEmail = async () => {
  try {
    loading.value = true
    const data = await AuthService.forgotPassword({
      orgPhone: formState.orgPhone,
      email: formState.email,
      username: formState.username,
    })
    if (data.success) {
      result.value = 'Gửi email thành công, vui lòng kiểm tra email'
      btnDisable.value = true
    }
    AlertStore.add({ type: 'success', message: 'Thông tin tài khoản đã được gửi về email.' })
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: 'Thông tin tài khoản không đúng' })
    console.log('🚀 ~ file: ForgotPassword.vue:34 ~ startSendEmail ~ error:', error)
    result.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="wrapper">
    <div class="login-card">
      <a-divider style="font-size: 1.5rem"> QUÊN MẬT KHẨU </a-divider>
      <br />
      <a-form
        :model="formState"
        name="basic"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 20 }"
        autocomplete="off"
        @finish="startSendEmail"
        @finishFailed="onFinishFailed"
      >
        <a-form-item
          label="ID Cơ sở"
          name="orgPhone"
          :rules="[{ required: true, message: 'Cần nhập SĐT cơ sở!' }]"
        >
          <a-input v-model:value="formState.orgPhone" />
        </a-form-item>

        <a-form-item
          label="Gmail Cơ sở"
          name="email"
          :rules="[{ required: true, message: 'Email không được để trống!' }]"
        >
          <a-input v-model:value="formState.email" />
        </a-form-item>

        <a-form-item
          label="Tài khoản"
          name="username"
          :rules="[{ required: true, message: 'Tên tài khoản không được để trống!' }]"
        >
          <a-input v-model:value="formState.username" />
        </a-form-item>

        <div class="flex justify-end">
          <a @click="$router.push({ name: 'Login' })">Đăng nhập</a>
        </div>

        <div>{{ result }}</div>
        <a-form-item :wrapper-col="{ offset: 10, span: 4 }">
          <a-button type="primary" html-type="submit" :loading="loading" :disabled="btnDisable">
            Gửi Email
          </a-button>
        </a-form-item>
      </a-form>
    </div>
    <div class="company-text">
      <p>Công ty TNHH Công nghệ và TM MEDIHOME</p>
      <p>HOTLINE: <a href="tel:0376899866" class="hotline">0376.899.866</a></p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wrapper {
  width: 100vw;
  height: 100vh;
  background-image: url('@/assets/image/background-login.jpg');
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  padding-top: 10%;

  .login-card {
    max-width: 600px;
    width: 90%;
    margin: 0 auto;
    padding: 20px;
    border-radius: 10px;
    box-shadow:
      0px 3px 5px rgba(0, 0, 0, 0.02),
      0px 0px 2px rgba(0, 0, 0, 0.05),
      0px 1px 4px rgba(0, 0, 0, 0.08);
    background-color: #fff;
  }

  .company-text {
    position: fixed;
    bottom: 10px;
    right: 10px;
    text-transform: uppercase;
    font-weight: bold;
    color: #fff;

    .hotline {
      color: #fff;
    }
  }
}
</style>
