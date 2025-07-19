<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../common/VueButton.vue'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { InputPassword } from '../../common/vue-form'
import InputText from '../../common/vue-form/InputText.vue'
import { AuthApi } from '../../modules/auth/auth.api'
import { VueDivider } from '../../common/vue-layout'

const router = useRouter()
const route = useRoute()

const formState = reactive({
  organizationCode: (route.query?.organizationCode || '') as string,
  username: (route.query?.username || '') as string,
  password: '',
  passwordRepeat: '',
})

const loading = ref(false)

const startResetPassword = async () => {
  try {
    loading.value = true
    if (formState.passwordRepeat !== formState.password) {
      return AlertStore.addError('Điền mật khẩu lần 2 không chính xác')
    }
    await AuthApi.resetPassword({
      organizationCode: formState.organizationCode,
      username: formState.username,
      password: formState.password,
      token: route.query?.token as string,
      updatedAt: Number(route.query?.updatedAt),
    })
    AlertStore.addSuccess('Thay đổi mật khẩu thành công. Vui lòng đăng nhập lại để vào ứng dụng')
    router.push({ name: 'Login' })
  } catch (error: any) {
    const message = error?.response?.data?.message || error.message || error?.config.signal?.reason
    AlertStore.addError(message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="wrapper">
    <div class="form-card pt-4 pb-10 px-4">
      <VueDivider class="mt-4" border-width="1px">
        <div class="mx-4 text-2xl font-medium">ĐỔI MẬT KHẨU</div>
      </VueDivider>
      <form @submit.prevent="startResetPassword">
        <div class="mt-4">
          <div>ID cơ cở</div>
          <div>
            <InputText
              v-model:value="formState.organizationCode"
              name="organization_code"
              autocomplete="on"
              required
            />
          </div>
        </div>
        <div class="mt-4">
          <div>Tài khoản</div>
          <div><InputText v-model:value="formState.username" name="username" required /></div>
        </div>
        <div class="mt-4">
          <div>Mật khẩu</div>
          <div>
            <InputPassword v-model:value="formState.password" name="password" required />
          </div>
        </div>
        <div class="mt-4">
          <div>Điền lại mật khẩu</div>
          <div>
            <InputPassword v-model:value="formState.passwordRepeat" name="password" required />
          </div>
        </div>

        <div class="mt-8 flex justify-center">
          <VueButton color="blue" type="submit" :loading="loading">Cập nhật mật khẩu mới</VueButton>
        </div>
      </form>
    </div>
    <div class="company-text">
      <p>Công ty TNHH Công nghệ và TM MEDIHOME</p>
      <p>
        HOTLINE:
        <a href="tel:0376899866" class="hotline">0376.899.866</a>
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wrapper {
  width: 100vw;
  height: 100vh;
  // background-image: url('@/assets/image/background-login.jpg');
  background-position: center;
  background-color: #3b6fba;
  background-repeat: no-repeat;
  background-size: cover;
  padding-top: 10%;

  .form-card {
    max-width: 600px;
    width: 90%;
    margin: 0 auto;
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
