<script setup lang="ts">
import { Customer } from '@/modules/customer'
import { formatNumber, timeToText } from '@/utils'

const props = withDefaults(
  defineProps<{ customer: Customer }>(),
  { customer: () => Customer.blank() }
)
</script>

<template>
  <div>
    <p>
      <span class="inline-block w-40">Họ và tên</span>
      <b>{{ customer!.fullNameVi }}</b>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Mã KH</span>
      <span>CM{{ customer.id }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Số điện thoại</span>
      <span>{{ customer.phone }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Ngày sinh</span>
      <span>{{ timeToText(customer.birthday, 'DD/MM/YYYY') }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Giới tính</span>
      <span>{{ customer.gender === 1 ? 'Nam' : 'Nữ' }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Số căn cước</span>
      <span>{{ customer.identityCard }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Địa chỉ</span>
      <span>{{ customer.addressProvince }} - {{ customer.addressDistrict }} - {{ customer.addressWard }} . {{
          customer.addressStreet
      }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Người thân</span>
      <span>{{ customer.relative }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Công nợ</span>
      <span><b>{{ formatNumber(customer.debt) }}</b></span>
    </p>
  </div>
</template>
