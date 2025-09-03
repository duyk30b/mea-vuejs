<script setup lang="ts">
import { IconDelete } from '@/common/icon-antd'
import { IconEditSquare } from '@/common/icon-google'
import { useSettingStore } from '@/modules/_me/setting.store'
import {
  CommissionCalculatorType,
  CommissionCalculatorTypeText,
  Position,
  PositionType,
} from '@/modules/position'
import { RoleService } from '@/modules/role'
import { ESNumber } from '@/utils'
import { onMounted, ref } from 'vue'
import ModalPositionUpsert from '../upsert/ModalPositionUpsert.vue'
import { CONFIG } from '@/config'

const modalPositionUpsert = ref<InstanceType<typeof ModalPositionUpsert>>()

const emit = defineEmits<{ (e: 'update:positionList', value: Position[]): void }>()

const props = withDefaults(
  defineProps<{
    positionListCommon: Position[]
    positionList: Position[]
    positionType: PositionType
    positionInteractId: number
    editable?: boolean
  }>(),
  {
    positionListCommon: () => [],
    positionList: () => [],
    positionType: PositionType.ProcedureResult,
    positionInteractId: 0,
    editable: true,
  },
)

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const roleMap = RoleService.roleMap

onMounted(async () => {
  RoleService.getMap()
})

const handleModalPositionUpsertSuccess = async (
  mode: 'CREATE' | 'UPDATE' | 'DESTROY',
  positionData: Position,
) => {
  const positionListAction = [...props.positionList]
  if (mode === 'CREATE') {
    positionListAction.push(positionData)
  }
  if (mode === 'UPDATE') {
    const findIndex = positionListAction.findIndex((i) => {
      return i._localId === positionData._localId
    })
    positionListAction[findIndex] = positionData
  }
  emit('update:positionList', positionListAction)
}

const clickRemovePosition = (_localId: string) => {
  const positionListAction = [...props.positionList]
  const findIndex = positionListAction.findIndex((i) => {
    return i._localId === _localId
  })
  positionListAction.splice(findIndex, 1)
  emit('update:positionList', positionListAction)
}

const clickUpsertPosition = (options: { position?: Position; mode: 'CREATE' | 'UPDATE' }) => {
  const position = options.position || Position.blank()
  modalPositionUpsert.value?.openModal({
    position,
    requiredInteract: {
      positionType: props.positionType,
      positionInteractId: props.positionInteractId,
    },
    mode: options.mode,
  })
}
</script>

<template>
  <ModalPositionUpsert ref="modalPositionUpsert" @success="handleModalPositionUpsertSuccess" />
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th v-if="CONFIG.MODE === 'development'">ID-LocalId</th>
          <th style="width: 30px">Độ ưu tiên</th>
          <th>Vai trò</th>
          <th>Hoa hồng</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="position in positionListCommon" :key="position._localId">
          <td class="text-center" v-if="CONFIG.MODE === 'development'" style="color: violet">
            {{ position.id }} - {{ position._localId }}
          </td>
          <td class="text-center">{{ position.priority }}</td>
          <td>{{ roleMap[position.roleId]?.name }}</td>
          <td class="text-center">
            <template v-if="position.commissionCalculatorType === CommissionCalculatorType.VND">
              {{ formatMoney(position.commissionValue) }}
            </template>
            <template v-else>
              {{ ESNumber.format({ number: position.commissionValue }) }}
            </template>
            {{ CommissionCalculatorTypeText[position.commissionCalculatorType] }}
          </td>
          <td colspan="2">
            <span>Áp dụng chung</span>
          </td>
        </tr>
        <tr v-for="(position, index) in positionList" :key="index">
          <td class="text-center" v-if="CONFIG.MODE === 'development'" style="color: violet">
            {{ position.id }} - {{ position._localId }}
          </td>
          <td class="text-center">{{ position.priority }}</td>
          <td>{{ roleMap[position.roleId]?.name }}</td>
          <td class="text-center">
            <template v-if="position.commissionCalculatorType === CommissionCalculatorType.VND">
              {{ formatMoney(position.commissionValue) }}
            </template>
            <template v-else>
              {{ ESNumber.format({ number: position.commissionValue }) }}
            </template>
            {{ CommissionCalculatorTypeText[position.commissionCalculatorType] }}
          </td>
          <td class="text-center">
            <a
              v-if="editable"
              style="color: #eca52b"
              class="text-xl"
              @click="clickUpsertPosition({ position, mode: 'UPDATE' })"
            >
              <IconEditSquare />
            </a>
          </td>
          <td class="text-center">
            <a
              v-if="editable"
              style="color: var(--text-red)"
              class="text-xl"
              @click="clickRemovePosition(position._localId)"
            >
              <IconDelete width="18" height="18" />
            </a>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="mt-2">
      <a v-if="editable" @click="clickUpsertPosition({ mode: 'CREATE' })">✚ Thêm vai trò mới</a>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
