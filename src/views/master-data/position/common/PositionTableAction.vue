<script setup lang="ts">
import { IconDelete } from '@/common/icon-antd'
import { InputNumber, VueSelect } from '@/common/vue-form'
import { CommissionCalculatorType, Position, PositionInteractType } from '@/modules/position'
import InputSearchRole from '@/views/component/InputSearchRole.vue'
import { ref, watch } from 'vue'

const emit = defineEmits<{ (e: 'update:positionList', value: Position[]): void }>()

const props = withDefaults(
  defineProps<{
    positionList: Position[]
    positionType: PositionInteractType
    positionInteractId: number
    editable?: boolean
  }>(),
  {
    positionList: () => [],
    positionType: PositionInteractType.Product,
    positionInteractId: 0,
    editable: true,
  },
)

const currentPositionList = ref<Position[]>([])

watch(
  () => props.positionList,
  (newValue) => {
    if (!Position.equalList(currentPositionList.value, newValue)) {
      currentPositionList.value = Position.fromList(newValue)
    }
  },
  { immediate: true },
)

const startEmit = () => {
  const positionListEmit = Position.fromList(currentPositionList.value)
  emit('update:positionList', positionListEmit)
}

const handleUpdateRoleId = (index: number, roleId: number) => {
  currentPositionList.value[index].roleId = roleId
  startEmit()
}

const handleUpdateCommissionValue = (index: number, commissionValue: number) => {
  currentPositionList.value[index].commissionValue = commissionValue
  startEmit()
}

const handleUpdateCommissionCalculatorType = (index: number, commissionCalculatorType: number) => {
  currentPositionList.value[index].commissionCalculatorType = commissionCalculatorType
  startEmit()
}

const handleRemovePosition = (index: number) => {
  currentPositionList.value.splice(index, 1)
  startEmit()
}

const handleAddPosition = () => {
  const commissionBlank = Position.blank()
  commissionBlank.positionType = props.positionType
  commissionBlank.positionInteractId = props.positionInteractId
  currentPositionList.value.push(commissionBlank)
  startEmit()
}
</script>

<template>
  <div class="mt-4">
    <div
      v-for="(position, index) in currentPositionList"
      :key="index"
      class="mt-4 flex flex-wrap gap-2"
    >
      <div style="flex-grow: 1; flex-basis: 250px">
        <InputSearchRole
          :roleId="position.roleId"
          @update:roleId="(v) => handleUpdateRoleId(index, v)"
        />
      </div>
      <div style="flex-grow: 1; flex-basis: 100px">
        <div>Hoa hồng</div>
        <div>
          <InputNumber
            :value="position.commissionValue"
            @update:value="(v: number) => handleUpdateCommissionValue(index, v)"
          />
        </div>
      </div>
      <div style="flex-grow: 1; flex-basis: 150px">
        <div>Công thức</div>
        <div>
          <VueSelect
            :value="position.commissionCalculatorType"
            :options="[
              { value: CommissionCalculatorType.VND, text: 'VNĐ' },
              {
                value: CommissionCalculatorType.PercentExpected,
                text: '% Giá niêm yết',
              },
              {
                value: CommissionCalculatorType.PercentActual,
                text: '% Giá sau chiết khấu',
              },
            ]"
            @update:value="(v: number) => handleUpdateCommissionCalculatorType(index, v)"
          />
        </div>
      </div>
      <div style="width: 30px">
        <div>&nbsp;</div>
        <div class="pt-2 flex justify-center">
          <a style="color: var(--text-red)" @click="handleRemovePosition(index)">
            <IconDelete width="18" height="18" />
          </a>
        </div>
      </div>
    </div>

    <div class="mt-2">
      <a @click="handleAddPosition">✚ Thêm vai trò</a>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
