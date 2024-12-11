<script setup lang="ts">
import { ShopOutlined } from '@ant-design/icons-vue'
import TopProductBestSelling from './TopProductBestSelling.vue'
import TopBatchExpiryDate from './TopBatchExpiryDate.vue'
import TopProductHighMoney from './TopProductHighMoney.vue'
import TotalProductMoney from './TotalProductMoney.vue'
</script>

<template>
  <div class="page-header">
    <div class="page-header-content">
      <div class="md:block">
        <ShopOutlined />
        <span class="ml-2"> Báo cáo kho </span>
      </div>
    </div>
  </div>

  <div class="page-main">
    <div class="p-4">
      <div class="flex flex-wrap gap-10">
        <div style="flex-basis: 520px">
          <TotalProductMoney />
        </div>
        <div style="flex: 1">
          <TopBatchExpiryDate />
        </div>
      </div>
      <div class="mt-10 flex flex-wrap items-stretch gap-20">
        <div style="flex: 1; min-height: 500px">
          <TopProductBestSelling />
        </div>
        <div style="flex: 1; min-height: 500px">
          <TopProductHighMoney />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
./TopProductHighMoney.vue