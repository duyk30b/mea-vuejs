<script setup lang="ts">
import { Radiology } from '../../../modules/radiology'
import { useSettingStore } from '../../../modules/_me/setting.store'

const props = withDefaults(defineProps<{ radiology: Radiology }>(), {
  radiology: () => Radiology.blank(),
})

const settingStore = useSettingStore()
const { formatMoney } = settingStore
</script>

<template>
  <div class="px-2">
    <div>
      <span class="inline-block w-40">Mã phiếu</span>
      <span>DV{{ radiology!.id }}</span>
    </div>
    <div class="mt-2">
      <span class="inline-block w-40">Tên phiếu</span>
      <b>{{ radiology!.name }}</b>
    </div>
    <div class="mt-2">
      <span class="inline-block w-40">Giá phiếu</span>
      <span>{{ formatMoney(radiology.price) }}</span>
    </div>
    <div class="mt-4">
      <div style="font-weight: 500">Mô tả mặc định</div>
      <div class="mt-2 ml-4" v-html="radiology.descriptionDefault"></div>
    </div>
    <div class="mt-4">
      <div style="font-weight: 500">Kết quả mặc định</div>
      <div class="mt-2 ml-4" v-html="radiology.resultDefault"></div>
    </div>
  </div>
</template>
