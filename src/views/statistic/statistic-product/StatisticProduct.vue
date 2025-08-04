<script setup lang="ts">
import { VueTabMenu, VueTabPanel, VueTabs } from '@/common/vue-tabs'
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import { ref } from 'vue'
import TopBatchExpiryDate from './TopBatchExpiryDate.vue'
import TopProductHighMoney from './TopProductHighMoney.vue'
import TopTicketProduct from './TopTicketProduct.vue'
import TotalProductMoney from './TotalProductMoney.vue'

const TABS_KEY = {
  INVENTORY: 'INVENTORY',
  EXPIRY_DATE: 'EXPIRY_DATE',
  TICKET_PRODUCT: 'TICKET_PRODUCT',
}

const activeTab = ref<any>(TABS_KEY.INVENTORY)
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
        <VueTabMenu :tabKey="TABS_KEY.INVENTORY">Báo cáo tồn kho</VueTabMenu>
        <VueTabMenu :tabKey="TABS_KEY.EXPIRY_DATE">Báo cáo cận date</VueTabMenu>
        <VueTabMenu :tabKey="TABS_KEY.TICKET_PRODUCT">Báo cáo bán hàng</VueTabMenu>
      </template>
      <template #panel>
        <VueTabPanel :tabKey="TABS_KEY.INVENTORY">
          <div class="mt-4">
            <TotalProductMoney />
            <TopProductHighMoney />
          </div>
        </VueTabPanel>
        <VueTabPanel :tabKey="TABS_KEY.EXPIRY_DATE">
          <TopBatchExpiryDate />
        </VueTabPanel>
        <VueTabPanel :tabKey="TABS_KEY.TICKET_PRODUCT">
          <TopTicketProduct />
        </VueTabPanel>
      </template>
    </VueTabs>
  </div>
</template>

<style lang="scss" scoped></style>
