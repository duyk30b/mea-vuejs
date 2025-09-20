<script lang="ts" setup>
import { InputOptionsValue, InputSearch } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputSearch.vue'
import { CONFIG } from '@/config'
import { CommissionCalculatorType, Position, PositionService } from '@/modules/position'
import { RoleService } from '@/modules/role'
import { User, UserService } from '@/modules/user'
import { UserRoleService } from '@/modules/user-role'
import { ESString } from '@/utils'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'selectUser', value: User | undefined): void
  (e: 'update:userId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    userId: number
    positionId?: number
    disabled?: boolean
    required?: boolean
  }>(),
  {
    userId: 0,
    positionId: 0,
    disabled: false,
    required: false,
  },
)

const inputOptionsUser = ref<InstanceType<typeof InputOptionsValue>>()

const userOptions = ref<ItemOption<User>[]>([])
const position = ref(Position.blank())

onMounted(async () => {
  await Promise.all([
    UserService.getAll(),
    UserRoleService.getAll(),
    PositionService.getAll(),
    RoleService.getAll(),
  ])
  if (!props.positionId) {
    const userAll = await UserService.getAll()
    userOptions.value = userAll.map((i) => ({ value: i.id, text: i.fullName, data: i }))
    position.value = Position.blank()
  } else {
    position.value = await PositionService.detail(props.positionId, { relation: { role: true } })
    const userMap = await UserService.getMap()
    const userRoleMapList = await UserRoleService.getMapList()
    userOptions.value = (userRoleMapList[position.value.roleId] || []).map((i) => {
      const currentUser = userMap[i.userId]
      return {
        value: i.userId,
        text: currentUser.fullName,
        data: currentUser,
      }
    })
  }
})

const handleUpdateValue = (v: any) => {
  emit('update:userId', v)
}

const handleSelectItem = (item?: ItemOption<User>) => {
  emit('selectUser', item?.data)
}

const logicFilter = (item: ItemOption<User>, text: string) => {
  return ESString.customFilter(item.text, text)
}
</script>
<template>
  <div class="flex gap-1 flex-wrap">
    <div>{{ position.role?.name || 'Nhân viên' }}</div>
    <div v-if="CONFIG.MODE === 'development'" style="color: violet">
      (P{{ positionId }} - R{{ position.roleId }} - U{{ userId }} -
      <span v-if="position.commissionCalculatorType === CommissionCalculatorType.VND">
        {{ position.commissionValue }}
      </span>
      <span v-if="position.commissionCalculatorType === CommissionCalculatorType.PercentActual">
        {{ position.commissionValue }}% TT
      </span>
      <span v-if="position.commissionCalculatorType === CommissionCalculatorType.PercentExpected">
        {{ position.commissionValue }}% NY
      </span>
      )
    </div>
  </div>
  <div>
    <InputSearch
      ref="inputOptionsUser"
      :value="userId"
      :disabled="disabled"
      :maxHeight="320"
      :options="userOptions"
      placeholder="Tìm kiếm bằng tên nhân viên"
      :required="required"
      @update:value="(v) => handleUpdateValue(v)"
      @selectItem="(item) => handleSelectItem(item)"
      :logicFilter="logicFilter"
    >
      <template #option="{ item: { data } }">
        <div>
          <b>{{ data.fullName }}</b>
        </div>
      </template>
    </InputSearch>
  </div>
</template>

<style lang="scss" scoped></style>
