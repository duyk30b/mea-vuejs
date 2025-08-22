<script lang="ts" setup>
import VueTag from '@/common/VueTag.vue'
import { IconFileSearch } from '@/common/icon-antd'
import { IconEditSquare } from '@/common/icon-google'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PaymentMoneyStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ProcedureType } from '@/modules/procedure'
import { ticketRoomRef } from '@/modules/room'
import { TicketStatus } from '@/modules/ticket'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import ModalTicketProcedureUpdate from '@/views/room/room-ticket-base/procedure/ModalTicketProcedureUpdate.vue'
import { computed, onMounted, ref } from 'vue'

const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalTicketProcedureUpdate = ref<InstanceType<typeof ModalTicketProcedureUpdate>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

onMounted(async () => {
  await ticketRoomRef.value.refreshProcedure()
})

const procedureDiscount = computed(() => {
  return ticketRoomRef.value.ticketProcedureList?.reduce((acc, item) => {
    return acc + item.discountMoney * item.quantity
  }, 0)
})
</script>

<template>
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalTicketProcedureUpdate ref="modalTicketProcedureUpdate" />
  <template v-if="ticketRoomRef.ticketProcedureList?.length">
    <thead>
      <tr>
        <th v-if="CONFIG.MODE === 'development'">ID</th>
        <th>#</th>
        <th></th>
        <th></th>
        <th colspan="1">DỊCH VỤ - THỦ THUẬT</th>
        <th></th>
        <th></th>
        <th>SL</th>
        <th>Giá</th>
        <th>Chiết khấu</th>
        <th v-if="CONFIG.MODE === 'development'">Vốn</th>
        <th>Tổng tiền</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(ticketProcedure, index) in ticketRoomRef.ticketProcedureList" :key="index">
        <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
          {{ ticketProcedure.id }}
        </td>
        <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
          {{ index + 1 }}
        </td>
        <td>
          <PaymentMoneyStatusTooltip :paymentMoneyStatus="ticketProcedure.paymentMoneyStatus" />
        </td>
        <td></td>
        <td :colspan="ticketProcedure.procedure?.procedureType !== ProcedureType.Basic ? 4 : 3">
          <div class="flex items-center gap-1">
            <span>{{ ticketProcedure.procedure?.name }}</span>
            <a
              style="line-height: 0"
              @click="modalProcedureDetail?.openModal(ticketProcedure.procedureId)"
            >
              <IconFileSearch />
            </a>
            <span
              v-if="ticketProcedure.procedure?.procedureType === ProcedureType.Regimen"
              class="font-bold"
            >
              ({{ ticketProcedure.totalSessions }} buổi)
            </span>
          </div>
        </td>
        <td
          v-if="ticketProcedure.procedure?.procedureType !== ProcedureType.Regimen"
          class="text-center"
        >
          {{ ticketProcedure.quantity }}
        </td>

        <td class="text-right whitespace-nowrap">
          <div v-if="ticketProcedure.discountMoney" class="text-xs italic text-red-500">
            <del>{{ formatMoney(ticketProcedure.expectedPrice) }}</del>
          </div>
          <div>{{ formatMoney(ticketProcedure.actualPrice) }}</div>
        </td>

        <td class="text-center">
          <div v-if="ticketProcedure.discountMoney">
            <VueTag v-if="ticketProcedure.discountType === 'VNĐ'" color="green">
              {{ formatMoney(ticketProcedure.discountMoney) }}
            </VueTag>
            <VueTag v-if="ticketProcedure.discountType === '%'" color="green">
              {{ ticketProcedure.discountPercent || 0 }}%
            </VueTag>
          </div>
        </td>
        <td v-if="CONFIG.MODE === 'development'" style="color: violet"></td>
        <td class="text-right whitespace-nowrap">
          {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
        </td>
        <td class="text-center">
          <a
            v-if="
              ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
              [PaymentMoneyStatus.NoEffect, PaymentMoneyStatus.Pending].includes(
                ticketProcedure.paymentMoneyStatus,
              ) &&
              userPermission[PermissionId.TICKET_CHANGE_PROCEDURE]
            "
            class="text-orange-500"
            @click="modalTicketProcedureUpdate?.openModal(ticketProcedure)"
          >
            <IconEditSquare width="20" height="20" />
          </a>
        </td>
      </tr>
      <tr>
        <td v-if="CONFIG.MODE === 'development'"></td>
        <td class="text-right" colspan="9">
          <div class="flex items-center justify-end gap-2">
            <span class="uppercase">Tiền dịch vụ</span>
            <span v-if="procedureDiscount" class="italic" style="font-size: 13px">
              (CK: {{ formatMoney(procedureDiscount) }})
            </span>
          </div>
        </td>
        <td v-if="CONFIG.MODE === 'development'"></td>
        <td class="font-bold text-right whitespace-nowrap" colspan="1">
          {{ formatMoney(ticketRoomRef.procedureMoney) }}
        </td>
        <td></td>
      </tr>
    </tbody>
  </template>
</template>
