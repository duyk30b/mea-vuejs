<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Radiology, RadiologyApi } from '../../../../modules/radiology'

const props = withDefaults(defineProps<{ radiologyId: number }>(), {
  radiologyId: 0,
})

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const radiology = ref<Radiology>(Radiology.blank())

const startFetchData = async () => {
  if (!props.radiologyId) return

  try {
    const radiologyFetch = await RadiologyApi.detail(props.radiologyId, {
      relation: { radiologyGroup: true },
    })
    radiology.value = radiologyFetch
  } catch (error) {
    console.log('🚀 ~ file: RadiologyInfo.vue:24 ~ startFetchData ~ error:', error)
  }
}

watch(
  () => props.radiologyId,
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
      <span>DV{{ radiology!.id }}</span>
    </div>
    <div class="mt-2">
      <span class="inline-block w-40">Tên phiếu</span>
      <b>{{ radiology!.name }}</b>
    </div>
    <div class="mt-2">
      <span class="inline-block w-40">Nhóm</span>
      <span>{{ radiology!.radiologyGroup?.name }}</span>
    </div>
    <div class="mt-2">
      <span class="inline-block w-40">Giá phiếu</span>
      <span>{{ formatMoney(radiology.price) }}</span>
    </div>
  </div>
</template>
