<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import VueAlertStore from './common/vue-alert/VueAlertStore.vue'
import VueModalStore from './common/vue-modal/VueModalStore.vue'
import { useMeStore } from './modules/_me/me.store'

const meStore = useMeStore()
const router = useRouter()

// meStore.$subscribe((mutation, state) => {
//   if (state.user == null) {
//     router.push({ name: 'Login' })
//   }
// })
</script>
<template>
  <Suspense>
    <RouterView />
  </Suspense>
  <VueAlertStore />
  <VueModalStore />
  <iframe id="iframe-print" style="display: none" />
</template>
<style></style>
