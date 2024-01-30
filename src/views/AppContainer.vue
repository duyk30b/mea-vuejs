<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { MeaDatabase } from '../core/indexed-db/database'
import { LocalStorageService, REFRESH_EXP, REFRESH_TOKEN } from '../core/local-storage.service'
import { useOrganizationStore } from '../store/organization.store'
import VueLayout from './layout/VueLayout.vue'
import { useUserStore } from '../modules/user/user.store'

const organizationStore = useOrganizationStore()
const loaded = ref(false)

onBeforeMount(async () => {
  if (
    !LocalStorageService.getRefreshToken ||
    LocalStorageService.getRefreshExp() - 60 * 1000 < Date.now()
  ) {
    LocalStorageService.removeAuth()
    useUserStore().userInfo = null
    useRouter().push({ name: 'Login' })
  } else {
    await organizationStore.initData()
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
../modules/user/user.store
