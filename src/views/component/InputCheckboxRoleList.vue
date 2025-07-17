<script setup lang="ts">
import { InputCheckboxList } from '@/common/vue-form'
import type { CheckboxOptionType } from '@/common/vue-form/InputCheckboxList.vue'
import { CONFIG } from '@/config'
import { RoleService } from '@/modules/role'
import { onBeforeMount, ref, watch } from 'vue'

const emit = defineEmits<{
  (e: 'update:roleIdList', value: number[]): void
}>()

const props = withDefaults(
  defineProps<{
    roleIdList: number[]
    disabled?: boolean
    checkboxAll?: boolean
  }>(),
  {
    disabled: false,
    checkboxAll: true,
  },
)

let roleIdListStringify = ''

const roleIdChecked = ref<Record<string, boolean>>({})
const roleIdCheckedOptions = ref<CheckboxOptionType[]>([])

watch(
  () => props.roleIdList,
  (newValue: number[]) => {
    const roleIdListStringifyNew = JSON.stringify(newValue)
    if (roleIdListStringify === roleIdListStringifyNew) return

    roleIdListStringify = roleIdListStringifyNew

    const checkedNew: Record<string, boolean> = {}
    newValue.forEach((i) => (checkedNew[i] = true))
    roleIdChecked.value = checkedNew
  },
  { immediate: true },
)

onBeforeMount(async () => {
  try {
    const roleList = await RoleService.list({ sort: { id: 'ASC' } }, { refetch: true })
    roleIdCheckedOptions.value = roleList.map((i) => {
      return { key: i.id, label: i.name }
    })
  } catch (error) {}
})

const handleUpdateUserIdChecked = (data: Record<string, boolean>) => {
  const roleIdListChecked = Object.keys(data)
    .filter((id) => data[id])
    .map((i) => Number(i))
    .sort((a, b) => (a > b ? 1 : -1))

  emit('update:roleIdList', roleIdListChecked)
}
</script>

<template>
  <div>
    <InputCheckboxList
      v-model:value="roleIdChecked"
      @update:value="handleUpdateUserIdChecked"
      :options="roleIdCheckedOptions"
      :checkboxAll="checkboxAll"
    />
    <div v-if="CONFIG.MODE === 'development'" style="color: violet">
      {{ JSON.stringify(roleIdChecked) }}
    </div>
  </div>
</template>

<style></style>
