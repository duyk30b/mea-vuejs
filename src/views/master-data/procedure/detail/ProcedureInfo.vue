<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { IconDoubleRight } from '../../../../common/icon-antd'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import {
  Commission,
  CommissionCalculatorType,
  CommissionService,
  InteractType,
} from '../../../../modules/commission'
import { Procedure, ProcedureApi } from '../../../../modules/procedure'
import { Role, RoleService } from '../../../../modules/role'

const props = withDefaults(defineProps<{ procedureId: number }>(), {
  procedureId: 0,
})

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const procedure = ref<Procedure>(Procedure.blank())
const commissionList = ref<Commission[]>([])
const roleMap = ref<Record<string, Role>>({})

const startFetchData = async () => {
  if (!props.procedureId) return

  try {
    const fetchPromise = await Promise.all([
      ProcedureApi.detail(props.procedureId, {
        relation: { procedureGroup: true },
      }),
      CommissionService.list({
        filter: { interactType: InteractType.Procedure, interactId: props.procedureId },
      }),
      RoleService.getMap(),
    ])
    procedure.value = fetchPromise[0]
    commissionList.value = fetchPromise[1]
    roleMap.value = fetchPromise[2]
  } catch (error) {
    console.log('🚀 ~ file: ProcedureInfo.vue:23 ~ startFetchData ~ error:', error)
  }
}

watch(
  () => props.procedureId,
  async (newValue) => {
    console.log('🚀 ~ file: ProcedureInfo.vue:32 ~ newValue:', newValue)
    await startFetchData()
  },
  { immediate: true },
)

onMounted(() => {
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
          <tr v-for="commission in commissionList" :key="commission.id">
            <td>{{ roleMap[commission.roleId]?.name || '' }}</td>
            <template
              v-if="
                commission.commissionCalculatorType === CommissionCalculatorType.PercentExpected
              "
            >
              <td class="text-right">{{ commission.commissionValue }}%</td>
              <td>Giá niêm yết</td>
            </template>
            <template
              v-if="commission.commissionCalculatorType === CommissionCalculatorType.PercentActual"
            >
              <td class="text-right">{{ commission.commissionValue }}%</td>
              <td>Giá sau chiết khấu</td>
            </template>
            <template v-if="commission.commissionCalculatorType === CommissionCalculatorType.VND">
              <td class="text-right">{{ formatMoney(commission.commissionValue) }}</td>
              <td>VNĐ</td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
