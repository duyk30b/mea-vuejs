<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Laboratory, LaboratoryApi } from '../../../../modules/laboratory'

const props = withDefaults(defineProps<{ laboratoryId: number }>(), {
  laboratoryId: 0,
})

const laboratory = ref<Laboratory>(Laboratory.blank())

const startFetchData = async () => {
  if (!props.laboratoryId) return

  try {
    laboratory.value = await LaboratoryApi.detail(props.laboratoryId, {
      relation: { laboratoryGroup: true },
    })
  } catch (error) {
    console.log('🚀 ~ file: LaboratoryInfo.vue:23 ~ startFetchData ~ error:', error)
  }
}

const settingStore = useSettingStore()
const { formatMoney } = settingStore

watch(
  () => props.laboratoryId,
  async (newValue, oldValue) => {
    await startFetchData()
  },
  { immediate: true }
)

onMounted(() => {
  console.log('🚀 ~ file: LaboratoryInfo.vue:39 ~ onMounted ~ onMounted:')
})
</script>

<template>
  <div>
    <p>
      <span class="inline-block w-40">Mã dịch vụ</span>
      <span>DV{{ laboratory!.id }}</span>
    </p>
    <p>
      <span class="inline-block w-40">Tên dịch vụ</span>
      <b>{{ laboratory!.name }}</b>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Nhóm</span>
      <span>{{ laboratory.laboratoryGroup?.name }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Giá dịch vụ</span>
      <span>{{ formatMoney(laboratory.price) }}</span>
    </p>
  </div>
</template>
