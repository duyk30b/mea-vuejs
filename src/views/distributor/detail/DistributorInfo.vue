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
    <tbody>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Họ và tên</td>
        <td class="px-2 font-medium">
          {{ distributor!.fullName }}
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Mã NCC</td>
        <td class="px-2">CC{{ distributor.id }}</td>
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
          {{ distributor.addressStreet }}
          - {{ distributor.addressWard }} - {{ distributor.addressProvince }}
        </td>
      </tr>
      <tr v-if="distributor.debt >= 0">
        <td class="px-2 py-1 whitespace-nowrap">Công nợ</td>
        <td class="px-2 font-bold text-xl" style="color: var(--text-red)">
          {{ formatMoney(distributor.debt) }}
        </td>
      </tr>
      <tr v-if="distributor.debt < 0">
        <td class="px-2 py-1 whitespace-nowrap">Quỹ</td>
        <td class="px-2 font-bold text-xl" style="color: var(--text-green)">
          {{ formatMoney(-distributor.debt) }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped lang="scss">
td {
  padding: 10px 6px;
}
</style>
