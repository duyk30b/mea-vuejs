<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import VueAlertStore from './common/vue-alert/VueAlertStore.vue'
import VueModalStore from './common/vue-modal/VueModalStore.vue'

const router = useRouter()
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
