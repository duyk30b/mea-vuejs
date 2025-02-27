<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer } from '../../../modules/customer'
import { DString, DTimer, formatPhone } from '../../../utils'
import { CustomerSource, CustomerSourceService } from '../../../modules/customer-source'

const props = withDefaults(defineProps<{ customer: Customer }>(), {
  customer: () => Customer.blank(),
})

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const customerSourceMap = ref<Record<string, CustomerSource>>({})

onMounted(async () => {
  customerSourceMap.value = await CustomerSourceService.getMap()
})
</script>

<template>
  <div class="mt-4 flex flex-wrap">
    <div style="flex-basis: 45%; flex: 1; min-width: 300px">
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Mã KH</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0" class="font-medium">
          KH{{ customer.id }}
        </div>
      </div>
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Họ tên</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0" class="font-medium">
          {{ customer!.fullName }}
        </div>
      </div>
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Số điện thoại</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">
          <a :href="'tel:' + customer.phone">
            {{ formatPhone(customer.phone || '') }}
          </a>
        </div>
      </div>
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Ngày sinh</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">
          {{ DTimer.timeToText(customer.birthday, 'DD/MM/YYYY') || customer.yearOfBirth || '' }}
        </div>
      </div>
    </div>
    <div style="flex-basis: 45%; flex: 1; min-width: 300px">
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Giới tính</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">
          <span v-if="customer.gender === 1" class="px-2">Nam</span>
          <span v-if="customer.gender === 0" class="px-2">Nữ</span>
        </div>
      </div>
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Địa chỉ</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">
          {{ DString.formatAddress(customer) }}
        </div>
      </div>
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Liên hệ khác</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">
          {{ customer.relative }}
        </div>
      </div>
      <div class="my-2 flex gap-4">
        <div style="width: 100px; flex-shrink: 0">Nguồn KH</div>
        <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0">
          {{ customerSourceMap[customer.customerSourceId]?.name }}
        </div>
      </div>
    </div>
    <div style="flex-basis: 90%; flex: 1; min-width: 90%" class="my-2 flex gap-4 items-center">
      <div style="width: 100px; flex-shrink: 0">Công nợ</div>
      <div style="flex-shrink: 1; flex-grow: 1; flex-basis: 0" class="font-medium; text-xl">
        {{ formatMoney(customer.debt) }}
      </div>
    </div>
  </div>
</template>
