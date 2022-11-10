
<script setup lang="ts">
import { LocalStorageService, REFRESH_EXP, REFRESH_TOKEN } from '@/core/local-storage.service'
import { OrganizationService } from '@/modules/organization'
import { useOrganizationStore } from '@/store/organization.store'
import { OrganizationSettingsType } from '@/store/store.variable'
import { useUserStore } from '@/store/user.store'
import { objectUpdatePropertyByObject } from '@/utils'
import { RouterView, useRouter } from 'vue-router'
import VueLayout from './layout/VueLayout.vue'

const organizationStore = useOrganizationStore()

if (!localStorage.getItem(REFRESH_TOKEN) || Number(localStorage.getItem(REFRESH_EXP)) - 60 * 1000 < Date.now()) {
  LocalStorageService.removeAuth()
  useUserStore().userInfo = null
  useRouter().push({ name: 'Login' })
} else {
  try {
    const [settings, orgInfo] = await Promise.all([
      OrganizationService.getAllSettings(),
      OrganizationService.detail(),
    ])
    organizationStore.organizationInfo = orgInfo
    settings.forEach((i) => {
      if (i.type === OrganizationSettingsType.PRODUCT_GROUP || OrganizationSettingsType.PROCEDURE_GROUP) {
        organizationStore[i.type] = JSON.parse(i.data)
      } else {
        organizationStore[i.type] = objectUpdatePropertyByObject(organizationStore[i.type], JSON.parse(i.data))
      }
    })
  } catch (error) {
    console.log('🚀 ~ file: AppContainer.vue:27 ~ error:', error)
  }
}
</script>

<template>
  <VueLayout>
    <RouterView />
  </VueLayout>
</template>

<style></style>
