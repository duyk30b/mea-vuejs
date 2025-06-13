<script lang="ts" setup>
import { IconEditSquare } from '@/common/icon-google'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Laboratory, LaboratoryService } from '@/modules/laboratory'
import { PermissionId } from '@/modules/permission/permission.enum'
import { CommissionCalculatorType, PositionInteractType } from '@/modules/position'
import { Procedure, ProcedureService } from '@/modules/procedure'
import { Product, ProductService } from '@/modules/product'
import { Radiology, RadiologyService } from '@/modules/radiology'
import { arrayToKeyValue } from '@/utils'
import { onMounted, ref, watch } from 'vue'
import ModalTicketUserUpdate from './ModalTicketUserUpdate.vue'
import { ticketRoomRef } from '@/modules/room'

const modalTicketUserUpdate = ref<InstanceType<typeof ModalTicketUserUpdate>>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission, organizationPermission } = MeService

const productMap = ref<Record<string, Product>>({})
const procedureMap = ref<Record<string, Procedure>>({})
const laboratoryMap = ref<Record<string, Laboratory>>({})
const radiologyMap = ref<Record<string, Radiology>>({})

onMounted(async () => {
  const fetchData = await Promise.all([
    organizationPermission.value[PermissionId.PROCEDURE] ? ProcedureService.getMap() : {},
    organizationPermission.value[PermissionId.LABORATORY] ? LaboratoryService.getMap() : {},
    organizationPermission.value[PermissionId.RADIOLOGY] ? RadiologyService.getMap() : {},
  ])
  procedureMap.value = fetchData[0]
  laboratoryMap.value = fetchData[1]
  radiologyMap.value = fetchData[2]
})

watch(
  () => ticketRoomRef.value.ticketUserList,
  async (newValue, oldValue) => {
    const productIdList = (newValue || [])
      .filter((i) => i.positionType === PositionInteractType.Product)
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
</script>
<template>
  <ModalTicketUserUpdate ref="modalTicketUserUpdate" />
  <div>
    <div class="mt-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th v-if="CONFIG.MODE === 'development'">ID</th>
            <th>Vai trò</th>
            <th>Nhân viên</th>
            <th>Phiếu</th>
            <th>Giá DV</th>
            <th>SL</th>
            <th>Hoa hồng</th>
            <th>T.Tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ticketUser, index) in ticketRoomRef.ticketUserList || []" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td class="text-center whitespace-nowrap" v-if="CONFIG.MODE === 'development'">
              {{ ticketUser.id }}
            </td>
            <td style="">{{ ticketUser.role?.name || '' }}</td>
            <td>
              <div class="flex gap-1">
                <span>{{ ticketUser.user?.fullName }}</span>
              </div>
            </td>
            <td>
              <div style="min-width: 100px">
                <template v-if="ticketUser.positionType === PositionInteractType.Ticket">
                  Phiếu khám
                </template>
                <template v-if="ticketUser.positionType === PositionInteractType.PrescriptionList">
                  Đơn thuốc
                </template>
                <template v-if="ticketUser.positionType === PositionInteractType.ConsumableList">
                  Vật tư
                </template>
                <template v-if="ticketUser.positionType === PositionInteractType.Product">
                  {{ productMap[ticketUser.positionInteractId]?.brandName }}
                </template>
                <template v-if="ticketUser.positionType === PositionInteractType.Procedure">
                  {{ procedureMap[ticketUser.positionInteractId]?.name }}
                </template>
                <template v-if="ticketUser.positionType === PositionInteractType.Laboratory">
                  {{ laboratoryMap[ticketUser.positionInteractId]?.name }}
                </template>
                <template v-if="ticketUser.positionType === PositionInteractType.Radiology">
                  {{ radiologyMap[ticketUser.positionInteractId]?.name }}
                </template>
              </div>
            </td>
            <td class="text-right">
              <template v-if="ticketUser.positionType !== PositionInteractType.Ticket">
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
              <template v-if="ticketUser.positionType !== PositionInteractType.Ticket">
                {{ ticketUser.quantity }}
              </template>
            </td>
            <td>
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
                v-if="userPermission[PermissionId.TICKET_CLINIC_USER_UPDATE_POSITION]"
                class="text-orange-500"
                @click="modalTicketUserUpdate?.openModal(ticketUser)"
              >
                <IconEditSquare width="20" height="20" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="text-right" colspan="7">
              <span class="uppercase">Tổng tiền hoa hồng</span>
            </td>
            <td class="font-bold text-right whitespace-nowrap">
              {{ formatMoney(ticketRoomRef.commissionMoney) }}
            </td>
            <td></td>
          </tr>
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
