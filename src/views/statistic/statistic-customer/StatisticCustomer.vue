<script setup lang="ts">
import { IconBarChart } from '../../../common/icon-antd'
import TopCustomerBestInvoice from './TopCustomerBestTicket.vue'
import TopCustomerDebt from './TopCustomerDebt.vue'
</script>

<template>
  <div class="page-header">
    <div class="page-header-content">
      <div class="md:block">
        <IconBarChart />
        <span class="ml-2">Báo cáo khách hàng</span>
      </div>
    </div>
  </div>

  <div class="page-main">
    <div class="p-4">
      <div class="flex flex-wrap gap-20">
        <div style="flex: 1">
          <TopCustomerDebt />
        </div>
      </div>
      <div class="mt-10 flex flex-wrap items-stretch gap-20">
        <div style="flex: 1; min-height: 500px">
          <TopCustomerBestInvoice />
        </div>
        <div style="flex: 1; min-height: 500px"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
