<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { IconDoubleRight } from '../../../../common/icon-antd'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import {
  CommissionCalculatorType,
  Position,
  PositionService,
  PositionType,
} from '../../../../modules/position'
import { Regimen, RegimenApi } from '../../../../modules/regimen'
import { Role, RoleService } from '../../../../modules/role'

const props = withDefaults(defineProps<{ regimenId: number }>(), {
  regimenId: 0,
})

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const regimen = ref<Regimen>(Regimen.blank())
const positionList = ref<Position[]>([])
const roleMap = ref<Record<string, Role>>({})

const startFetchData = async () => {
  if (!props.regimenId) return

  try {
    const fetchPromise = await Promise.all([
      RegimenApi.detail(props.regimenId, {
        relation: { regimenItemList: {} },
      }),
      PositionService.list({
        filter: {
          positionType: { IN: [PositionType.RegimenRequest] },
          positionInteractId: props.regimenId,
        },
      }),
      RoleService.getMap(),
    ])
    regimen.value = fetchPromise[0]
    positionList.value = fetchPromise[1]
    roleMap.value = fetchPromise[2]
  } catch (error) {
    console.log('🚀 ~ file: RegimenInfo.vue:23 ~ startFetchData ~ error:', error)
  }
}

watch(
  () => props.regimenId,
  async (newValue) => {
    console.log('🚀 ~ file: RegimenInfo.vue:32 ~ newValue:', newValue)
    await startFetchData()
  },
  { immediate: true },
)

onMounted(() => {})
</script>

<template>
  <div>
    <p>
      <span class="inline-block w-40">Mã liệu trình</span>
      <span>DV{{ regimen!.id }}</span>
    </p>
    <p>
      <span class="inline-block w-40">Tên liệu trình</span>
      <b>{{ regimen!.name }}</b>
    </p>
  </div>

  <div class="mt-10">
    <div class="font-bold">
      <IconDoubleRight />
      Vai trò và hoa hồng
    </div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Vai trò</th>
            <th>Công thức tính</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="position in positionList" :key="position.id">
            <td>{{ roleMap[position.roleId]?.name || '' }}</td>
            <template
              v-if="position.commissionCalculatorType === CommissionCalculatorType.PercentExpected"
            >
              <td class="text-right">{{ position.commissionValue }}%</td>
              <td>Giá niêm yết</td>
            </template>
            <template
              v-if="position.commissionCalculatorType === CommissionCalculatorType.PercentActual"
            >
              <td class="text-right">{{ position.commissionValue }}%</td>
              <td>Giá sau chiết khấu</td>
            </template>
            <template v-if="position.commissionCalculatorType === CommissionCalculatorType.VND">
              <td class="text-right">{{ formatMoney(position.commissionValue) }}</td>
              <td>VNĐ</td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
