<script setup lang="ts">
import { Procedure } from '../../../modules/procedure'
import { useSettingStore } from '../../../modules/_me/setting.store'

const props = withDefaults(defineProps<{ procedure: Procedure }>(), {
  procedure: () => Procedure.blank(),
})

const settingStore = useSettingStore()
const { formatMoney } = settingStore
</script>

<template>
  <div>
    <p>
      <span class="inline-block w-40">Mã dịch vụ</span>
      <span>DV{{ procedure!.id }}</span>
    </p>
    <p>
      <span class="inline-block w-40">Tên dịch vụ</span>
      <b>{{ procedure!.name }}</b>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Nhóm</span>
      <span>{{ settingStore.PROCEDURE_GROUP[procedure.group || 0] }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Giá dịch vụ</span>
      <span>{{ formatMoney(procedure.price) }}</span>
    </p>
  </div>
</template>