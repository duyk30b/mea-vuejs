<script setup lang="ts">
import { InputCheckboxList } from '@/common/vue-form'
import type { CheckboxOptionType } from '@/common/vue-form/InputCheckboxList.vue'
import { CONFIG } from '@/config'
import { RoomService } from '@/modules/room'
import { onBeforeMount, ref, watch } from 'vue'

const emit = defineEmits<{
  (e: 'update:roomIdList', value: number[]): void
}>()

const props = withDefaults(
  defineProps<{
    roomIdList: number[]
    disabled?: boolean
    checkboxAll?: boolean
  }>(),
  {
    disabled: false,
    checkboxAll: true,
  },
)

let roomIdListStringify = ''

const roomIdChecked = ref<Record<string, boolean>>({})
const roomIdCheckedOptions = ref<CheckboxOptionType[]>([])

watch(
  () => props.roomIdList,
  (newValue: number[]) => {
    const roomIdListStringifyNew = JSON.stringify(newValue)
    if (roomIdListStringify === roomIdListStringifyNew) return

    roomIdListStringify = roomIdListStringifyNew

    const checkedNew: Record<string, boolean> = {}
    newValue.forEach((i) => (checkedNew[i] = true))
    roomIdChecked.value = checkedNew
  },
  { immediate: true },
)

onBeforeMount(async () => {
  try {
    const userList = await RoomService.list({ sort: { id: 'ASC' } }, { refetch: true })
    roomIdCheckedOptions.value = userList.map((i) => {
      return { key: i.id, label: i.name }
    })
  } catch (error) {}
})

const handleUpdateUserIdChecked = (data: Record<string, boolean>) => {
  const roomIdListChecked = Object.keys(data)
    .filter((id) => data[id])
    .map((i) => Number(i))
    .sort((a, b) => (a > b ? 1 : -1))

  emit('update:roomIdList', roomIdListChecked)
}
</script>

<template>
  <div>
    <InputCheckboxList
      v-model:value="roomIdChecked"
      @update:value="handleUpdateUserIdChecked"
      :options="roomIdCheckedOptions"
      :checkboxAll="checkboxAll"
      :customStyle="{
        checkboxItem:
          'display: flex; gap: 0.5em; align-items: center; flex-basis: 200px; flex-grow: 1',
      }"
    />
    <div v-if="CONFIG.MODE === 'development'" style="color: violet">
      {{ JSON.stringify(roomIdChecked) }}
    </div>
  </div>
</template>

<style></style>
