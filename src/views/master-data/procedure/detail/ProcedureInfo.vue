<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Procedure, ProcedureApi } from '../../../../modules/procedure'

const props = withDefaults(defineProps<{ procedureId: number }>(), {
  procedureId: 0,
})

const procedure = ref<Procedure>(Procedure.blank())

const startFetchData = async () => {
  if (!props.procedureId) return

  try {
    procedure.value = await ProcedureApi.detail(props.procedureId, {
      relation: { procedureGroup: true },
    })
  } catch (error) {
    console.log('🚀 ~ file: ProcedureInfo.vue:23 ~ startFetchData ~ error:', error)
  }
}

const settingStore = useSettingStore()
const { formatMoney } = settingStore

watch(
  () => props.procedureId,
  async (newValue) => {
    console.log('🚀 ~ file: ProcedureInfo.vue:32 ~ newValue:', newValue)
    await startFetchData()
  },
  { immediate: true }
)

onMounted(() => {
  console.log('🚀 ~ file: ProcedureInfo.vue:39 ~ onMounted ~ onMounted:')
})
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
      <span>{{ procedure.procedureGroup?.name }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Giá dịch vụ</span>
      <span>{{ formatMoney(procedure.price) }}</span>
    </p>
  </div>
</template>
