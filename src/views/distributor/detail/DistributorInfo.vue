<script setup lang="ts">
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Distributor } from '../../../modules/distributor'
import { formatPhone } from '../../../utils'

const props = withDefaults(defineProps<{ distributor: Distributor }>(), {
  distributor: () => Distributor.blank(),
})

const settingStore = useSettingStore()
const { formatMoney } = settingStore
</script>

<template>
  <table class="w-full">
    <tr>
      <td class="px-2 py-1 whitespace-nowrap">Họ và tên</td>
      <td class="px-2 font-medium">
        {{ distributor!.fullName }}
      </td>
    </tr>
    <tr>
      <td class="px-2 py-1 whitespace-nowrap">Mã NCC</td>
      <td class="px-2">KH{{ distributor.id }}</td>
    </tr>
    <tr>
      <td class="px-2 py-1 whitespace-nowrap">Số điện thoại</td>
      <td class="px-2 font-medium">
        <a :href="'tel:' + distributor.phone">
          {{ formatPhone(distributor.phone || '') }}
        </a>
      </td>
    </tr>
    <tr>
      <td class="px-2 py-1 whitespace-nowrap align-top">Địa chỉ</td>
      <td class="px-2 text-justify">
        {{ distributor.addressProvince }}
        - {{ distributor.addressDistrict }} - {{ distributor.addressWard }} -
        {{ distributor.addressStreet }}
      </td>
    </tr>
    <tr>
      <td class="px-2 py-1 whitespace-nowrap">Công nợ</td>
      <td class="px-2 font-medium">
        {{ formatMoney(distributor.debt) }}
      </td>
    </tr>
  </table>
</template>
