<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import VueAlert from './common/vue-alert/VueAlert.vue'
import { useUserStore } from './store/user.store'

const userStore = useUserStore()
const router = useRouter()

userStore.$subscribe((mutation, state) => {
  if (state.userInfo == null) {
    router.push({ name: 'Login' })
  }
})
</script>
<template>
  <Suspense>
    <RouterView />
  </Suspense>
  <VueAlert />
  <iframe id="iframe-print" style="display: none" />
</template>
<style scoped></style>
