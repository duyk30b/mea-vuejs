<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { RouterView } from 'vue-router'
import { MeaDatabase } from '../core/indexed-db/database'
import { LocalStorageService } from '../core/local-storage.service'
import { MeService } from '../modules/_me/me.service'
import { AuthService } from '../modules/auth/auth.service'
import VueLayout from './layout/VueLayout.vue'
import { ProductService } from '../modules/product'
import { BatchService } from '../modules/batch'

const loaded = ref(false)

onBeforeMount(async () => {
  loaded.value = false
  try {
    if (
      !LocalStorageService.getRefreshToken ||
      LocalStorageService.getRefreshExp() - 60 * 1000 < Date.now()
    ) {
      await AuthService.logout()
    } else {
      await MeaDatabase.runMigration()
      await MeService.initData()
      await Promise.all([ProductService.refreshDB(), BatchService.refreshDB()])
    }
  } catch (error) {
    console.log('🚀 ~ file: AppContainer.vue:26 ~ onBeforeMount ~ error:', error)
    await AuthService.logout()
  } finally {
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
