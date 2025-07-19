<script setup lang="ts">
import { InputCheckboxList } from '@/common/vue-form'
import type { CheckboxOptionType } from '@/common/vue-form/InputCheckboxList.vue'
import { CONFIG } from '@/config'
import { UserService, type User } from '@/modules/user'
import { computed, onBeforeMount, ref, watch } from 'vue'

const emit = defineEmits<{
  (e: 'update:userIdList', value: number[]): void
}>()

const props = withDefaults(
  defineProps<{
    userIdList: number[]
    disabled?: boolean
    checkboxAll?: boolean
  }>(),
  {
    disabled: false,
    checkboxAll: true,
  },
)

let userIdListStringify = ''

const userIdChecked = ref<Record<string, boolean>>({})
const userIdCheckedOptions = ref<CheckboxOptionType[]>([])

watch(
  () => props.userIdList,
  (newValue: number[]) => {
    const userIdListStringifyNew = JSON.stringify(newValue)
    if (userIdListStringify === userIdListStringifyNew) return

    userIdListStringify = userIdListStringifyNew

    const checkedNew: Record<string, boolean> = {}
    newValue.forEach((i) => (checkedNew[i] = true))
    userIdChecked.value = checkedNew
  },
  { immediate: true },
)

onBeforeMount(async () => {
  try {
    const userList = await UserService.list({ sort: { id: 'ASC' } }, { refetch: true })
    userIdCheckedOptions.value = userList.map((i) => {
      return { key: i.id, label: i.fullName }
    })
  } catch (error) {
    console.log('🚀 ~ InputCheckboxUserList.vue:40 ~ onBeforeMount ~ error:', error)
  }
})

const handleUpdateUserIdChecked = (data: Record<string, boolean>) => {
  const userIdListChecked = Object.keys(data)
    .filter((id) => data[id])
    .map((i) => Number(i))
    .sort((a, b) => (a > b ? 1 : -1))

  emit('update:userIdList', userIdListChecked)
}
</script>

<template>
  <div>
    <InputCheckboxList
      v-model:value="userIdChecked"
      @update:value="handleUpdateUserIdChecked"
      :options="userIdCheckedOptions"
      :checkboxAll="checkboxAll"
    />
    <div v-if="CONFIG.MODE === 'development'" style="color: violet">
      {{ JSON.stringify(userIdChecked) }}
    </div>
  </div>
</template>

<style></style>
