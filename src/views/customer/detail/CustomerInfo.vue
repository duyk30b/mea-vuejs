<script setup lang="ts">
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer } from '../../../modules/customer'
import { formatPhone, timeToText } from '../../../utils'

const props = withDefaults(defineProps<{ customer: Customer }>(), {
  customer: () => Customer.blank(),
})
const settingStore = useSettingStore()
const { formatMoney } = settingStore
</script>

<template>
  <div class="mt-4">
    <table class="w-full">
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Họ và tên</td>
        <td class="px-2 font-medium">
          {{ customer!.fullName }}
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Mã KH</td>
        <td class="px-2">KH{{ customer.id }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Số điện thoại</td>
        <td class="px-2 font-medium">
          <a :href="'tel:' + customer.phone">
            {{ formatPhone(customer.phone || '') }}
          </a>
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Ngày sinh</td>
        <td class="px-2">
          {{ timeToText(customer.birthday, 'DD/MM/YYYY') }}
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Giới tính</td>
        <td v-if="customer.gender === 1" class="px-2">Nam</td>
        <td v-if="customer.gender === 0" class="px-2">Nữ</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Số căn cước</td>
        <td class="px-2">
          {{ customer.identityCard }}
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap align-top">Địa chỉ</td>
        <td class="px-2 text-justify">
          {{ customer.addressString }}
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Người thân</td>
        <td class="px-2">
          {{ customer.relative }}
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Công nợ</td>
        <td class="px-2 font-medium">
          {{ formatMoney(customer.debt) }}
        </td>
      </tr>
    </table>
  </div>
</template>
