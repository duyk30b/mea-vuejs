<script lang="ts" setup>
import { IconBug } from '@/common/icon-antd'
import { IconEditSquare } from '@/common/icon-google'
import { VueTooltip } from '@/common/popover'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { LaboratoryService } from '@/modules/laboratory'
import { PermissionId } from '@/modules/permission/permission.enum'
import { CommissionCalculatorType, PositionType } from '@/modules/position'
import { ProcedureService } from '@/modules/procedure'
import { Product, ProductService } from '@/modules/product'
import { RadiologyService } from '@/modules/radiology'
import { RegimenService } from '@/modules/regimen'
import { ticketRoomRef } from '@/modules/room'
import type { TicketUser } from '@/modules/ticket-user'
import { arrayToKeyValue, ESTimer } from '@/utils'
import ModalTicketUserUpdateCommission from '@/views/room/room-user/ModalTicketUserUpdateCommission.vue'
import { onMounted, ref, watch } from 'vue'

const modalTicketUserUpdateCommission = ref<InstanceType<typeof ModalTicketUserUpdateCommission>>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission, organizationPermission } = MeService

const productMap = ref<Record<string, Product>>({})
const regimenMap = RegimenService.regimenMap
const procedureMap = ProcedureService.procedureMap
const laboratoryMap = LaboratoryService.laboratoryMap
const radiologyMap = RadiologyService.radiologyMap

onMounted(async () => {
  ticketRoomRef.value.refreshTicketUserRelationTicketItem()
})

watch(
  () => ticketRoomRef.value.ticketUserList,
  async (newValue, oldValue) => {
    ticketRoomRef.value.refreshTicketUserRelationTicketItem()
  },
  { immediate: true, deep: true },
)

const handleModalTicketUserUpdateCommissionSuccess = (
  data: TicketUser,
  type: 'CREATE' | 'UPDATE' | 'DESTROY',
) => {
  const findIndex = (ticketRoomRef.value.ticketUserList || []).findIndex((i) => {
    return i.id === data.id
  })

  if (type === 'DESTROY') {
    if (findIndex !== -1) {
      ticketRoomRef.value.ticketUserList!.splice(findIndex, 1)
    }
  }

  if (type === 'UPDATE') {
    if (findIndex !== -1) {
      Object.assign(ticketRoomRef.value.ticketUserList![findIndex], data)
    }
  }
}
</script>
<template>
  <ModalTicketUserUpdateCommission
    ref="modalTicketUserUpdateCommission"
    @success="handleModalTicketUserUpdateCommissionSuccess"
  />
  <div>
    <div class="mt-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>#</th>
            <th>Vai trò</th>
            <th>Nhân viên</th>
            <th>DV/SP/XN...</th>
            <th>T.Gian</th>
            <th>Giá</th>
            <th>SL</th>
            <th>Hoa hồng</th>
            <th>T.Tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!ticketRoomRef.ticketUserList?.length">
            <td colspan="100" class="text-center">Không có dữ liệu</td>
          </tr>
          <template v-else>
            <tr
              v-for="(ticketUser, index) in ticketRoomRef.ticketUserList || []"
              :key="ticketUser.id"
            >
              <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                <VueTooltip>
                  <template #trigger>
                    <IconBug width="1.2em" height="1.2em" />
                  </template>
                  <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
                    <pre>{{ JSON.stringify(ticketUser, null, 4) }}</pre>
                  </div>
                </VueTooltip>
              </td>
              <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
                {{ index + 1 }}
              </td>
              <td>{{ ticketUser.role?.name || '' }}</td>
              <td>{{ ticketUser.user?.fullName }}</td>
              <td>
                <template v-if="ticketUser.positionType === PositionType.Reception">
                  Phiếu khám
                </template>
                <template v-if="ticketUser.positionType === PositionType.ProductRequest">
                  {{ productMap[ticketUser.positionInteractId]?.brandName }}
                </template>
                <template v-if="ticketUser.positionType === PositionType.TicketPrescriptionRequest">
                  Kê Đơn thuốc
                </template>
                <template
                  v-if="
                    [PositionType.ProcedureRequest, PositionType.ProcedureResult].includes(
                      ticketUser.positionType,
                    )
                  "
                >
                  {{ procedureMap[ticketUser.positionInteractId]?.name }}
                </template>
                <template v-if="ticketUser.positionType === PositionType.RegimenRequest">
                  <span>{{ regimenMap[ticketUser.positionInteractId]?.name }}</span>
                </template>
                <template v-if="ticketUser.positionType === PositionType.LaboratoryRequest">
                  {{ laboratoryMap[ticketUser.positionInteractId]?.name }}
                </template>
                <template v-if="ticketUser.positionType === PositionType.RadiologyRequest">
                  {{ radiologyMap[ticketUser.positionInteractId]?.name }}
                </template>
                <template v-if="ticketUser.positionType === PositionType.RadiologyResult">
                  {{ radiologyMap[ticketUser.positionInteractId]?.name }}
                </template>
              </td>
              <td class="text-center">
                {{ ESTimer.timeToText(ticketUser.createdAt, 'hh:mm DD/MM/YYYY') }}
              </td>
              <td class="text-right">
                <template v-if="ticketUser.positionType !== PositionType.Reception">
                  <div
                    v-if="ticketUser.ticketItemExpectedPrice !== ticketUser.ticketItemActualPrice"
                    class="text-xs italic text-red-500"
                  >
                    <del>
                      {{ formatMoney(ticketUser.ticketItemExpectedPrice) }}
                    </del>
                  </div>
                  <div>
                    {{ formatMoney(ticketUser.ticketItemActualPrice) }}
                  </div>
                </template>
              </td>
              <td class="text-center">
                <template v-if="ticketUser.positionType !== PositionType.Reception">
                  {{ ticketUser.quantity }}
                </template>
              </td>
              <td class="text-right">
                <div v-if="ticketUser.commissionCalculatorType === CommissionCalculatorType.VND">
                  {{ formatMoney(ticketUser.commissionMoney) }}
                </div>
                <div
                  v-if="
                    ticketUser.commissionCalculatorType === CommissionCalculatorType.PercentExpected
                  "
                >
                  {{ ticketUser.commissionPercentExpected }} % Giá niêm yết
                </div>
                <div
                  v-if="
                    ticketUser.commissionCalculatorType === CommissionCalculatorType.PercentActual
                  "
                >
                  {{ ticketUser.commissionPercentActual }} % Giá sau chiết khấu
                </div>
              </td>
              <td class="text-right">
                {{ formatMoney(ticketUser.commissionMoney * ticketUser.quantity) }}
              </td>
              <td class="text-center">
                <a
                  v-if="userPermission[PermissionId.TICKET_CHANGE_USER_COMMISSION]"
                  class="text-orange-500"
                  @click="modalTicketUserUpdateCommission?.openModal(ticketUser)"
                >
                  <IconEditSquare width="20" height="20" />
                </a>
              </td>
            </tr>
            <tr>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td class="text-right" colspan="8">
                <span class="uppercase">Tổng tiền hoa hồng</span>
              </td>
              <td class="font-bold text-right whitespace-nowrap">
                {{ formatMoney(ticketRoomRef.commissionMoney) }}
              </td>
              <td></td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  opacity: 1;
}
</style>
