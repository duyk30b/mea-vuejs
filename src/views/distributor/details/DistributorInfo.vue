<script setup lang="ts">
import { Distributor } from '@/modules/distributor'
import { formatNumber, timeToText } from '@/utils'

const props = withDefaults(
  defineProps<{ distributor: Distributor }>(),
  { distributor: () => Distributor.blank() }
)
</script>

<template>
  <div>
    <p>
      <span class="inline-block w-40">Họ và tên</span>
      <b>{{ distributor.fullNameVi }}</b>
    </p>
    <p>
      <span class="inline-block w-40">Mã NCC</span>
      <span>DT{{ distributor.id }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Số điện thoại</span>
      <span>{{ distributor.phone }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Địa chỉ</span>
      <span>{{ distributor.addressProvince }} - {{ distributor.addressDistrict }} - {{ distributor.addressWard }} . {{
          distributor.addressStreet
      }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Công nợ</span>
      <span><b>{{ formatNumber(distributor.debt) }}</b></span>
    </p>
  </div>
</template>
