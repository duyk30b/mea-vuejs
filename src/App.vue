<script setup lang="ts">
import VueAlert from '@/common/vue-alert/VueAlert.vue'
import { RouterView, useRouter } from 'vue-router'
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
  <iframe id="iframe-print" style="display: none;"></iframe>
</template>
<style scoped></style>
