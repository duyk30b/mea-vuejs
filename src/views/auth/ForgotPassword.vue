<script setup lang="ts">
import { reactive, ref } from 'vue'
import { LocalStorageService } from '../../core/local-storage.service'
import { AuthService } from '../../modules/auth/auth.service'
import { InputText } from '../../common/vue-form'
import VueButton from '../../common/VueButton.vue'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { AuthApi } from '../../modules/auth/auth.api'

const btnDisable = ref<boolean>(false)

const formState = reactive({
  organizationPhone: LocalStorageService.getOrgPhone(),
  organizationEmail: '',
  username: '',
})

const loading = ref(false)

const startSendEmail = async () => {
  try {
    loading.value = true
    await AuthApi.forgotPassword({
      organizationPhone: formState.organizationPhone,
      organizationEmail: formState.organizationEmail,
      username: formState.username,
    })
    AlertStore.addSuccess('Gửi email kích hoạt thành công, vui lòng kiểm tra email !')
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
      <a-divider style="font-size: 1.5rem">QUÊN MẬT KHẨU</a-divider>
      <form @submit.prevent="startSendEmail">
        <div class="mt-4">
          <div>ID cơ cở</div>
          <div>
            <InputText
              v-model:value="formState.organizationPhone"
              name="organization_phone"
              autocomplete="on"
              required
              pattern="[0][356789][0-9]{8}" />
          </div>
        </div>
        <div class="mt-4">
          <div>Gmail cơ sở</div>
          <div>
            <InputText
              v-model:value="formState.organizationEmail"
              name="email"
              type="email"
              autocomplete="on"
              required />
          </div>
        </div>
        <div class="mt-4">
          <div>Tài khoản</div>
          <div><InputText v-model:value="formState.username" name="username" required /></div>
        </div>
        <div class="flex justify-end mt-4">
          <a @click="$router.push({ name: 'Login' })">Đăng nhập</a>
        </div>
        <div class="flex justify-center">
          <VueButton color="blue" type="submit" :loading="loading" :disabled="btnDisable">
            Gửi Email
          </VueButton>
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
