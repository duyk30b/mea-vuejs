<script setup lang="ts">
import { ShopOutlined } from '@ant-design/icons-vue'
import TopInvoiceProcedureBestSelling from './TopInvoiceProcedureBestSelling.vue'
import TopVisitProcedureBestSelling from './TopVisitProcedureBestSelling.vue'
</script>

<template>
  <div class="page-header">
    <div class="page-header-content">
      <div class="md:block">
        <ShopOutlined />
        <span class="ml-2"> Báo cáo dịch vụ </span>
      </div>
    </div>
  </div>

  <div class="page-main">
    <div class="p-4">
      <div class="flex flex-wrap items-stretch gap-20">
        <div style="flex: 1; min-height: 500px">
          <TopInvoiceProcedureBestSelling />
        </div>
        <div style="flex: 1; min-height: 500px">
          <TopVisitProcedureBestSelling />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
