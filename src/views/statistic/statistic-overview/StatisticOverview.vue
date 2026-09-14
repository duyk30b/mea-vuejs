<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconSetting } from '@/common/icon-antd'
import { IconDownload } from '@/common/icon-google'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { VueSelect } from '@/common/vue-form'
import { VueTabMenu, VueTabPanel, VueTabs } from '@/common/vue-tabs'
import { PermissionId } from '@/modules/permission/permission.enum'
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import InputSelectRoom from '@/views/component/InputSelectRoom.vue'
import { ref } from 'vue'
import { Bar } from 'vue-chartjs'
import StatisticOverviewTicket from './StatisticOverviewTicket.vue'
import StatisticOverviewChargeItem from './StatisticOverviewChargeItem.vue'

const TABS_KEY = {
  OVERVIEW_TICKET: 'OVERVIEW_TICKET',
  OVERVIEW_CHARGE_ITEM: 'OVERVIEW_CHARGE_ITEM',
}

const activeTab = ref<any>(TABS_KEY.OVERVIEW_TICKET)
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
        <VueTabMenu :tabKey="TABS_KEY.OVERVIEW_TICKET">Phiếu tiếp đón</VueTabMenu>
        <VueTabMenu :tabKey="TABS_KEY.OVERVIEW_CHARGE_ITEM">Doanh thu</VueTabMenu>
      </template>
      <template #panel>
        <VueTabPanel :tabKey="TABS_KEY.OVERVIEW_TICKET">
          <StatisticOverviewTicket />
        </VueTabPanel>
        <VueTabPanel :tabKey="TABS_KEY.OVERVIEW_CHARGE_ITEM">
          <StatisticOverviewChargeItem />
        </VueTabPanel>
      </template>
    </VueTabs>
  </div>
</template>

<style lang="scss" scoped></style>
