<script setup lang="ts">
import { ref } from 'vue'
import { IconSetting } from '../../../common/icon-antd'
import { VueTabPanel } from '../../../common/vue-tabs'
import VueTabMenu from '../../../common/vue-tabs/VueTabMenu.vue'
import VueTabs from '../../../common/vue-tabs/VueTabs.vue'
import SettingBasic from './SettingBasic.vue'
import SettingBatch from './SettingBatch.vue'

const TABS_KEY = {
  SYSTEM: 'SYSTEM',
  PRODUCT: 'PRODUCT',
}

const activeTab = ref(TABS_KEY.SYSTEM)
</script>

<template>
  <div class="page-header">
    <div class="page-header-content">
      <div class="flex items-center gap-2 flex-wrap">
        <IconSetting />
        Cài đặt
      </div>
    </div>
  </div>
  <div class="mt-4 md:mx-4">
    <VueTabs v-model:tabShow="activeTab">
      <template #menu>
        <VueTabMenu :tabKey="TABS_KEY.SYSTEM">Cài đặt chung</VueTabMenu>
        <VueTabMenu :tabKey="TABS_KEY.PRODUCT">Cài đặt sản phẩm</VueTabMenu>
      </template>
      <template #panel>
        <VueTabPanel :tabKey="TABS_KEY.SYSTEM">
          <SettingBasic />
        </VueTabPanel>
        <VueTabPanel :tabKey="TABS_KEY.PRODUCT">
          <SettingBatch />
        </VueTabPanel>
      </template>
    </VueTabs>
  </div>
</template>

<style lang="scss" scoped></style>
