<script lang="ts" setup>
import { InputOptionsValue } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputOptionsValue.vue'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Role, RoleService } from '@/modules/role'
import { ESString } from '@/utils'
import { onMounted, ref, watch } from 'vue'

const emit = defineEmits<{
  (e: 'selectRole', value: Role): void
  (e: 'update:roleId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    roleId: number
    disabled?: boolean
    required?: boolean
  }>(),
  {
    roleId: 0,
    disabled: false,
    required: false,
  },
)

const inputOptionsRole = ref<InstanceType<typeof InputOptionsValue>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const roleOptions = ref<{ value: number; text: string; data: Role }[]>([])

onMounted(async () => {
  const roleAll = await RoleService.getAll()
  roleOptions.value = roleAll.map((i) => ({ value: i.id, text: i.name, data: i }))
})

const handleUpdateValue = (v: any) => {
  emit('update:roleId', v)
}

const handleSelectItem = (item?: ItemOption) => {
  emit('selectRole', item?.data)
}

const logicFilter = (item: ItemOption, text: string) => {
  return ESString.customFilter(item.text, text)
}
</script>
<template>
  <div class="flex gap-1 flex-wrap">
    <span>Vai trò</span>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">({{ roleId }})</span>
  </div>

  <div>
    <InputOptionsValue
      ref="inputOptionsRole"
      :value="roleId"
      :disabled="disabled"
      :maxHeight="120"
      :options="roleOptions"
      placeholder="Tìm kiếm bằng tên vai trò"
      :required="required"
      @update:value="(v) => handleUpdateValue(v)"
      @selectItem="(item) => handleSelectItem(item)"
      :logicFilter="logicFilter"
    >
      <template #option="{ item: { data } }">
        <div>{{ data.name }}</div>
      </template>
    </InputOptionsValue>
  </div>
</template>

<style lang="scss" scoped></style>
