<script setup lang="ts">
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import StatisticTicketRadiology from './StatisticTicketRadiology.vue'
</script>

<template>
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div class="ml-auto flex items-center gap-8"></div>
  </div>

  <div class="page-main">
    <div class="p-4">
      <div class="flex flex-wrap items-stretch gap-20">
        <div style="flex: 1; min-height: 500px">
          <StatisticTicketRadiology />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
