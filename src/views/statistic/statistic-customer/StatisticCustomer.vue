<script setup lang="ts">
import { VueTabMenu, VueTabPanel, VueTabs } from '@/common/vue-tabs'
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import { ref } from 'vue'
import TopCustomerBestTicket from './TopCustomerBestTicket.vue'
import TopCustomerDebt from './TopCustomerDebt.vue'

const TABS_KEY = {
  DEBT: 'DEBT',
  TICKET: 'TICKET',
}

const activeTab = ref<any>(TABS_KEY.DEBT)
</script>

<template>
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div class="ml-auto flex items-center gap-8"></div>
  </div>

  <div class="mt-4 md:mx-4 p-4 bg-white">
    <VueTabs v-model:tabShow="activeTab">
      <template #menu>
        <VueTabMenu :tabKey="TABS_KEY.DEBT">Báo cáo nợ</VueTabMenu>
        <VueTabMenu :tabKey="TABS_KEY.TICKET">Báo cáo mua hàng</VueTabMenu>
      </template>
      <template #panel>
        <VueTabPanel :tabKey="TABS_KEY.DEBT">
          <TopCustomerDebt :limit="20" />
        </VueTabPanel>
        <VueTabPanel :tabKey="TABS_KEY.TICKET">
          <TopCustomerBestTicket />
        </VueTabPanel>
      </template>
    </VueTabs>
  </div>
</template>

<style lang="scss" scoped></style>
