<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import VueTag from '../../../../common/VueTag.vue'
import { IconFileSearch } from '../../../../common/icon-antd'
import { IconEditSquare } from '../../../../common/icon-google'
import { CONFIG } from '../../../../config'
import { MeService } from '../../../../modules/_me/me.service'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { TicketStatus } from '../../../../modules/ticket'
import ModalProcedureDetail from '../../../master-data/procedure/detail/ModalProcedureDetail.vue'
import ModalTicketProcedureUpdate from '../procedure/ModalTicketProcedureUpdate.vue'
import { ticketRoomRef } from '@/modules/room'

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
        <th>#</th>
        <th></th>
        <th colspan="3">DỊCH VỤ - THỦ THUẬT</th>
        <th>SL</th>
        <th>Giá</th>
        <th>Chiết khấu</th>
        <th>Tổng tiền</th>
        <th></th>
        <th v-if="CONFIG.MODE === 'development'" class="text-right italic">Vốn</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(ticketProcedure, index) in ticketRoomRef.ticketProcedureList" :key="index">
        <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
          {{ index + 1 }}
        </td>
        <td></td>
        <td colspan="3">
          <div class="flex items-center gap-1">
            <span>{{ ticketProcedure.procedure?.name }}</span>
            <a
              style="line-height: 0"
              @click="modalProcedureDetail?.openModal(ticketProcedure.procedureId)"
            >
              <IconFileSearch />
            </a>
          </div>
        </td>
        <td class="text-center">{{ ticketProcedure.quantity }}</td>
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
        <td class="text-right whitespace-nowrap">
          {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
        </td>
        <td class="text-center">
          <a
            v-if="
              ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
              userPermission[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PROCEDURE_LIST]
            "
            class="text-orange-500"
            @click="modalTicketProcedureUpdate?.openModal(ticketProcedure)"
          >
            <IconEditSquare width="20" height="20" />
          </a>
        </td>
        <td v-if="CONFIG.MODE === 'development'" class="text-right italic"></td>
      </tr>
      <tr>
        <td class="text-right" colspan="8">
          <div class="flex items-center justify-end gap-2">
            <span class="uppercase">Tiền dịch vụ</span>
            <span v-if="procedureDiscount" class="italic" style="font-size: 13px">
              (CK: {{ formatMoney(procedureDiscount) }})
            </span>
          </div>
        </td>
        <td class="font-bold text-right whitespace-nowrap" colspan="1">
          {{ formatMoney(ticketRoomRef.procedureMoney) }}
        </td>
        <td></td>
        <td v-if="CONFIG.MODE === 'development'" class="text-right italic"></td>
      </tr>
    </tbody>
  </template>
</template>
