<script lang="ts" setup>
import VueTag from '@/common/VueTag.vue'
import { IconBug, IconFileSearch } from '@/common/icon-antd'
import { IconEditSquare } from '@/common/icon-google'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ticketRoomRef } from '@/modules/room'
import { TicketStatus } from '@/modules/ticket'
import { TicketProcedureService, TicketProcedureType } from '@/modules/ticket-procedure'
import { TicketRegimenService } from '@/modules/ticket-regimen'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import ModalRegimenDetail from '@/views/master-data/regimen/detail/ModalRegimenDetail.vue'
import ModalTicketProcedureUpdate from '@/views/room/room-ticket-clinic/detail/procedure/ModalTicketProcedureUpdateMoney.vue'
import { computed, onMounted, ref } from 'vue'
import TicketProcedureStatusTooltip from '../procedure/TicketProcedureStatusTooltip.vue'
import TicketRegimenStatusTooltip from '../procedure/TicketRegimenStatusTooltip.vue'
import { VueTooltip } from '@/common/popover'

const modalRegimenDetail = ref<InstanceType<typeof ModalRegimenDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalTicketProcedureUpdate = ref<InstanceType<typeof ModalTicketProcedureUpdate>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

onMounted(async () => {
  try {
    await Promise.all([
      TicketProcedureService.refreshRelation(ticketRoomRef.value.ticketProcedureList || []),
      TicketRegimenService.refreshRelation(ticketRoomRef.value.ticketRegimenList || []),
      TicketRegimenService.refreshRelationItem(ticketRoomRef.value.ticketRegimenItemList || []),
    ])
    ticketRoomRef.value.refreshTicketProcedureAndRegimen()
  } catch (error: any) {
    console.log('🚀 ~ TicketClinicProcedureContainer.vue:84 ~ error:', error)
  }
})

const procedureDiscount = computed(() => {
  return ticketRoomRef.value.ticketProcedureList?.reduce((acc, item) => {
    return acc + item.discountMoney * item.quantity
  }, 0)
})
</script>

<template>
  <ModalRegimenDetail ref="modalRegimenDetail" />
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalTicketProcedureUpdate ref="modalTicketProcedureUpdate" />
  <template
    v-if="ticketRoomRef.ticketProcedureList?.length || ticketRoomRef.ticketRegimenList?.length"
  >
    <thead>
      <tr>
        <th v-if="CONFIG.MODE === 'development'"></th>
        <th>#</th>
        <th v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></th>
        <th></th>
        <th colspan="1">DỊCH VỤ - THỦ THUẬT</th>
        <th></th>
        <th></th>
        <th>SL</th>
        <th>Đơn Giá</th>
        <th>Chiết khấu</th>
        <th>T.Tiền</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <template
        v-for="(ticketRegimen, trIndex) in ticketRoomRef.ticketRegimenList"
        :key="ticketRegimen.id"
      >
        <tr>
          <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
            <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
              <template #trigger>
                <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
              </template>
              <pre>{{ JSON.stringify(ticketRegimen, null, 4) }}</pre>
            </VueTooltip>
          </td>
          <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
            {{ trIndex + 1 }}
          </td>
          <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
          <td class="text-center">
            <TicketRegimenStatusTooltip :status="ticketRegimen.status" />
          </td>
          <td :colspan="6">
            <div class="flex justify-between">
              <div class="flex flex-wrap items-center gap-1">
                <span style="font-weight: 500">{{ ticketRegimen.regimen?.name }}</span>
                <a
                  style="line-height: 0"
                  @click="modalRegimenDetail?.openModal(ticketRegimen.regimenId)"
                >
                  <IconFileSearch />
                </a>
              </div>
              <div class="text-right">
                <div>Giá tiền</div>
                <div v-if="ticketRegimen.discountMoney" class="text-xs italic text-red-500">
                  <del>{{ formatMoney(ticketRegimen.expectedPrice) }}</del>
                </div>
                <div
                  class="flex items-center gap-1"
                  style="font-weight: bold; color: var(--text-green)"
                >
                  <span>{{ formatMoney(ticketRegimen.actualPrice) }}</span>
                </div>
              </div>
              <div v-if="ticketRoomRef.isPaymentEachItem" class="text-right">
                <div>Đã thanh toán</div>
                <div style="font-weight: bold; color: var(--text-green)">
                  {{ formatMoney(ticketRegimen.paid + ticketRegimen.paidItem) }}
                </div>
              </div>
            </div>
          </td>
          <td class="text-right">{{ formatMoney(ticketRegimen.moneyAmountActual) }}</td>
          <td></td>
        </tr>
        <tr v-for="(tri, triIndex) in ticketRegimen.ticketRegimenItemList" :key="tri.id">
          <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
            <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
              <template #trigger>
                <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
              </template>
              <pre>{{ JSON.stringify(tri, null, 4) }}</pre>
            </VueTooltip>
          </td>
          <td></td>
          <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
          <td class="text-center"></td>
          <td colspan="3">
            <div class="flex gap-2">
              <span>{{ trIndex + 1 }}.{{ triIndex + 1 }}. {{ tri.procedure?.name }}</span>
              <span style="font-weight: 500">
                ({{ tri.quantityUsed }} / {{ tri.quantityRegular }})
              </span>
            </div>
          </td>
          <td style="font-weight: 700; text-align: center">
            <span></span>
            <span></span>
            {{ tri.quantityActual }}
          </td>
          <td class="text-right whitespace-nowrap">
            <div v-if="tri.discountMoneyAmount" class="text-xs italic text-red-500">
              <del>
                {{ formatMoney(Math.round(tri.moneyAmountRegular / tri.quantityRegular)) }}
              </del>
            </div>
            <div>{{ formatMoney(Math.round(tri.moneyAmountSale / tri.quantityRegular)) }}</div>
          </td>
          <td class="text-center">
            <div v-if="tri.discountMoneyAmount">
              <VueTag v-if="tri.discountType === DiscountType.VND" color="green">
                {{ formatMoney(tri.discountMoneyAmount / tri.quantityRegular) }}
              </VueTag>
              <VueTag v-if="tri.discountType === DiscountType.Percent" color="green">
                {{ tri.discountPercent || 0 }}%
              </VueTag>
            </div>
          </td>
          <td class="text-right whitespace-nowrap">
            <span>
              {{ formatMoney(tri.moneyAmountActual) }}
            </span>
          </td>
          <td></td>
        </tr>
      </template>

      <tr
        v-for="(ticketProcedure, index) in ticketRoomRef.ticketProcedureNormalList"
        :key="ticketProcedure.id"
      >
        <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
          <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
            <template #trigger>
              <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
            </template>
            <pre>{{ JSON.stringify(ticketProcedure, null, 4) }}</pre>
          </VueTooltip>
        </td>
        <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
          {{ index + (ticketRoomRef.ticketRegimenList?.length || 0) + 1 }}
        </td>
        <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'">
          <PaymentMoneyStatusTooltip :paymentMoneyStatus="ticketProcedure.paymentMoneyStatus" />
        </td>
        <td class="text-center">
          <TicketProcedureStatusTooltip :status="ticketProcedure.status" />
        </td>
        <td :colspan="3">
          <div class="flex items-center gap-1">
            <span>{{ ticketProcedure.procedure?.name }}</span>
            <span
              style="font-weight: 500"
              v-if="ticketProcedure.ticketProcedureType === TicketProcedureType.InRegimen"
            >
              ({{ ticketProcedure.indexSession }})
            </span>
            <a
              style="line-height: 0"
              @click="modalProcedureDetail?.openModal(ticketProcedure.procedureId)"
            >
              <IconFileSearch />
            </a>
          </div>
        </td>
        <td class="text-center">
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
        <td class="text-right whitespace-nowrap">
          {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
        </td>
        <td class="text-center">
          <a
            v-if="
              ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
              [PaymentMoneyStatus.TicketPaid, PaymentMoneyStatus.PendingPayment].includes(
                ticketProcedure.paymentMoneyStatus,
              ) &&
              userPermission[PermissionId.TICKET_CHANGE_PROCEDURE_REQUEST]
            "
            class="text-orange-500"
            @click="
              modalTicketProcedureUpdate?.openModal({
                ticketProcedure: ticketProcedure,
              })
            "
          >
            <IconEditSquare width="20" height="20" />
          </a>
        </td>
      </tr>
      <tr>
        <td v-if="CONFIG.MODE === 'development'"></td>
        <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
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
      </tr>
    </tbody>
  </template>
</template>
