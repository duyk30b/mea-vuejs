<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { InputPassword, InputText } from '../../common/vue-form'
import InputNumber from '../../common/vue-form/InputNumber.vue'
import { VueDivider } from '../../common/vue-layout'
import VueButton from '../../common/VueButton.vue'
import { LocalStorageService } from '../../core/local-storage.service'
import { AuthService } from '../../modules/auth/auth.service'

const router = useRouter()

const formState = reactive({
  organizationCode: LocalStorageService.getOrganizationCode(),
  username: '',
  password: '',
  oid: 1,
  uid: 0,
})

const loading = ref(false)

const isRootLogin = computed(() => {
  return formState.organizationCode === '0986021190' && formState.username === 'ROOT'
})

const startLogin = async () => {
  loading.value = true
  if (!isRootLogin.value) {
    const result = await AuthService.login({
      organizationCode: formState.organizationCode.trim(),
      username: formState.username.trim(),
      password: formState.password.trim(),
    })
    if (result) {
      router.push({ name: 'AppHome' })
    }
  } else if (isRootLogin.value) {
    const result = await AuthService.loginRoot({
      organizationCode: formState.organizationCode.trim(),
      username: formState.username.trim(),
      password: formState.password.trim(),
      oid: formState.oid,
      uid: formState.uid,
    })
    if (result) {
      router.push({ name: 'AppHome' })
    }
  }
  loading.value = false
}

const startLoginDemo = async () => {
  loading.value = true
  const result = await AuthService.loginDemo()
  loading.value = false
  if (result) {
    router.push({ name: 'AppHome' })
  }
}
</script>

<template>
  <div class="wrapper">
    <div class="form-card p-4">
      <VueDivider class="mt-4" border-width="1px">
        <div class="mx-4 text-2xl font-medium">ĐĂNG NHẬP</div>
      </VueDivider>
      <form @submit.prevent="startLogin">
        <div class="mt-4">
          <div>ID cơ sở</div>
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

        <div v-if="isRootLogin" class="mt-4">
          <div>Oid</div>
          <div>
            <InputNumber v-model:value="formState.oid" />
          </div>
        </div>

        <div v-if="isRootLogin" class="mt-4">
          <div>Uid</div>
          <div>
            <InputNumber v-model:value="formState.uid" />
          </div>
        </div>

        <div class="mt-4 flex justify-end">
          <a @click="$router.push({ name: 'ForgotPassword' })">Quên Mật Khẩu</a>
        </div>
        <div class="flex justify-end">
          <a @click="startLoginDemo">Dùng thử</a>
        </div>
        <div class="flex justify-center">
          <VueButton color="blue" type="submit">Đăng nhập</VueButton>
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
