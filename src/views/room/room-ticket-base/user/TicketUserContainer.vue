<script lang="ts" setup>
import { IconEditSquare } from '@/common/icon-google'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { LaboratoryService } from '@/modules/laboratory'
import { PermissionId } from '@/modules/permission/permission.enum'
import { CommissionCalculatorType, PositionType } from '@/modules/position'
import { ProcedureService } from '@/modules/procedure'
import { Product, ProductService } from '@/modules/product'
import { RadiologyService } from '@/modules/radiology'
import { ticketRoomRef } from '@/modules/room'
import type { TicketUser } from '@/modules/ticket-user'
import { arrayToKeyValue } from '@/utils'
import { onMounted, ref, watch } from 'vue'
import ModalTicketUserUpdateCommission from '../../room-user/ModalTicketUserUpdateCommission.vue'

const modalTicketUserUpdateCommission = ref<InstanceType<typeof ModalTicketUserUpdateCommission>>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission, organizationPermission } = MeService

const productMap = ref<Record<string, Product>>({})
const procedureMap = ProcedureService.procedureMap
const laboratoryMap = LaboratoryService.laboratoryMap
const radiologyMap = RadiologyService.radiologyMap

onMounted(async () => {
  await Promise.all([
    ProcedureService.getMap(),
    LaboratoryService.getMap(),
    RadiologyService.getMap(),
    ticketRoomRef.value.refreshUserAndRole(),
  ])
})

watch(
  () => ticketRoomRef.value.ticketUserList,
  async (newValue, oldValue) => {
    ticketRoomRef.value.refreshTicketUserRelationTicketItem()

    const productIdList = (newValue || [])
      .filter((i) => i.positionType === PositionType.ProductRequest)
      .map((i) => i.positionInteractId)
    let productMapLocal: Record<string, Product> = {}
    if (productIdList.length) {
      const productList = await ProductService.list({
        filter: {
          id: { IN: productIdList },
        },
      })
      productMapLocal = arrayToKeyValue(productList, 'id')
    }
    productMap.value = productMapLocal
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
            <th>#</th>
            <th v-if="CONFIG.MODE === 'development'">ID-PositionId-PositionType</th>
            <th>Vai trò</th>
            <th>Nhân viên</th>
            <th>
              <div v-if="CONFIG.MODE === 'development'">
                (ticketItemId - ticketItemChildId - positionInteractId)
              </div>
              <div>DV/SP/XN...</div>
            </th>
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
              <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
                {{ index + 1 }}
              </td>
              <td
                v-if="CONFIG.MODE === 'development'"
                class="text-center whitespace-nowrap"
                style="color: violet"
              >
                {{ ticketUser.id }} - {{ ticketUser.positionId }} - {{ ticketUser.positionType }}
              </td>
              <td style="">
                <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                  ({{ ticketUser.roleId }})
                </span>
                <span>{{ ticketUser.role?.name || '' }}</span>
              </td>
              <td>
                <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                  ({{ ticketUser.userId }})
                </span>
                <span>{{ ticketUser.user?.fullName }}</span>
              </td>
              <td>
                <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                  ({{ ticketUser.ticketItemId }} - {{ ticketUser.ticketItemChildId }} -
                  {{ ticketUser.positionInteractId }})
                </span>
                <template v-if="ticketUser.positionType === PositionType.Ticket">
                  Phiếu khám
                </template>
                <template v-if="ticketUser.positionType === PositionType.TicketPrescriptionRequest">
                  Kê Đơn thuốc
                </template>
                <template v-if="ticketUser.positionType === PositionType.ProductRequest">
                  {{ productMap[ticketUser.positionInteractId]?.brandName }}
                </template>
                <template v-if="ticketUser.positionType === PositionType.ProcedureRequest">
                  {{ procedureMap[ticketUser.positionInteractId]?.name }}
                </template>
                <template v-if="ticketUser.positionType === PositionType.ProcedureResult">
                  <span>{{ procedureMap[ticketUser.positionInteractId]?.name }}</span>
                  -
                  <span class="italic font-bold">
                    Buổi {{ (ticketUser.ticketProcedureItem?.indexSession || 0) + 1 }}
                  </span>
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

              <td class="text-right">
                <template v-if="ticketUser.positionType !== PositionType.Ticket">
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
                <template v-if="ticketUser.positionType !== PositionType.Ticket">
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
              <td class="text-right" colspan="7">
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
