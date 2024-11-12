<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Paraclinical, ParaclinicalApi } from '../../../../modules/paraclinical'

const props = withDefaults(defineProps<{ paraclinicalId: number }>(), {
  paraclinicalId: 0,
})

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const paraclinical = ref<Paraclinical>(Paraclinical.blank())

const startFetchData = async () => {
  if (!props.paraclinicalId) return

  try {
    const paraclinicalFetch = await ParaclinicalApi.detail(props.paraclinicalId, {
      relation: { paraclinicalGroup: true },
    })
    paraclinical.value = paraclinicalFetch
  } catch (error) {
    console.log('🚀 ~ file: ParaclinicalInfo.vue:24 ~ startFetchData ~ error:', error)
  }
}

watch(
  () => props.paraclinicalId,
  async (newValue) => {
    await startFetchData()
  },
  { immediate: true }
)
</script>

<template>
  <div class="px-2">
    <div>
      <span class="inline-block w-40">Mã phiếu</span>
      <span>DV{{ paraclinical!.id }}</span>
    </div>
    <div class="mt-2">
      <span class="inline-block w-40">Tên phiếu</span>
      <b>{{ paraclinical!.name }}</b>
    </div>
    <div class="mt-2">
      <span class="inline-block w-40">Nhóm</span>
      <span>{{ paraclinical!.paraclinicalGroup?.name }}</span>
    </div>
    <div class="mt-2">
      <span class="inline-block w-40">Giá phiếu</span>
      <span>{{ formatMoney(paraclinical.price) }}</span>
    </div>
  </div>
</template>
