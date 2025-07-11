<script lang="ts" setup>
import { InputOptionsValue } from '@/common/vue-form'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Role, RoleService } from '@/modules/role'
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
const role = ref(Role.blank())

watch(
  () => props.roleId,
  async (newValue) => {
    if (newValue && newValue != role.value.id) {
      const roleData = await RoleService.detail(newValue)
      if (roleData) {
        setRoleFromParent(roleData)
      }
    }
  },
  { immediate: true },
)

onMounted(async () => {
  await searchingRole('')
})

const searchingRole = async (text: string) => {
  // if (!text) {
  //   roleOptions.value = []
  //   return
  // }
  const roleList = await RoleService.list({
    filter: { isActive: 1, name: { LIKE: text || '' } },
  })
  roleOptions.value = roleList.map((i) => ({ value: i.id, text: i.name, data: i }))
}

const setRoleFromChild = async (roleData: Role) => {
  role.value = Role.from(roleData)
  emit('selectRole', roleData)
  emit('update:roleId', roleData.id)
}

const setRoleFromCurrent = async (roleData: Role) => {
  role.value = Role.from(roleData)
  roleOptions.value = [{ value: roleData.id, text: roleData.name, data: roleData }]
  emit('selectRole', roleData)
  emit('update:roleId', roleData.id)
}

const setRoleFromParent = async (roleData: Role) => {
  role.value = Role.from(roleData)
  roleOptions.value = [{ value: roleData.id, text: roleData.name, data: roleData }]
}
</script>
<template>
  <InputOptionsValue
    ref="inputOptionsRole"
    :value="role.id"
    :disabled="disabled"
    :maxHeight="120"
    :options="roleOptions"
    placeholder="Tìm kiếm bằng mã, tên dịch vụ"
    :required="required"
    @selectItem="({ data }) => setRoleFromChild(data)"
    @searching="searchingRole"
  >
    <template #option="{ item: { data } }">
      <div>{{ data.name }}</div>
    </template>
  </InputOptionsValue>
</template>

<style lang="scss" scoped></style>
