<script setup lang="ts">
import { LocalStorageService, REFRESH_EXP, REFRESH_TOKEN } from '@/core/local-storage.service'
import { useOrganizationStore } from '@/store/organization.store'
import { useUserStore } from '@/store/user.store'
import { onBeforeMount, ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import VueLayout from './layout/VueLayout.vue'
import { MeaDatabase } from '@/core/indexed-db/database'

const organizationStore = useOrganizationStore()
const loaded = ref(false)

onBeforeMount(async () => {
  if (
    !localStorage.getItem(REFRESH_TOKEN) ||
    Number(localStorage.getItem(REFRESH_EXP)) - 60 * 1000 < Date.now()
  ) {
    LocalStorageService.removeAuth()
    useUserStore().userInfo = null
    useRouter().push({ name: 'Login' })
  } else {
    await organizationStore.initData()
    await MeaDatabase.openConnection()
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
