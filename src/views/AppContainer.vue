<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { MeaDatabase } from '../core/indexed-db/database'
import { LocalStorageService } from '../core/local-storage.service'
import { MeService } from '../modules/_me/me.service'
import { useMeStore } from '../modules/_me/me.store'
import { useScreenStore } from '../modules/_me/screen.store'
import VueLayout from './layout/VueLayout.vue'

const screenStore = useScreenStore()
const loaded = ref(false)

onBeforeMount(async () => {
  if (
    !LocalStorageService.getRefreshToken ||
    LocalStorageService.getRefreshExp() - 60 * 1000 < Date.now()
  ) {
    LocalStorageService.removeToken()
    useMeStore().user = null
    useRouter().push({ name: 'Login' })
  } else {
    await MeService.initData()
    await MeaDatabase.runMigration()
    loaded.value = true
  }
})
</script>

<template>
  <VueLayout v-if="loaded">
    <RouterView />
  </VueLayout>
</template>

<style></style>
