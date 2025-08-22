<script lang="ts" setup>
import VueTag from '@/common/VueTag.vue'
import { IconEditSquare } from '@/common/icon-google'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PaymentMoneyStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ticketRoomRef } from '@/modules/room'
import { TicketStatus } from '@/modules/ticket'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import TicketLaboratoryStatusTooltip from '@/views/room/room-laboratory/TicketLaboratoryStatusTooltip.vue'
import { computed, onMounted, ref } from 'vue'
import ModalTicketLaboratoryUpdateMoney from '../laboratory/ModalTicketLaboratoryUpdateMoney.vue'

const modalTicketLaboratoryUpdateMoney =
  ref<InstanceType<typeof ModalTicketLaboratoryUpdateMoney>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, organization } = MeService

onMounted(async () => {
  await ticketRoomRef.value.refreshLaboratory()
})

const laboratoryDiscount = computed(() => {
  return ticketRoomRef.value.ticketLaboratoryList?.reduce((acc, item) => {
    return acc + item.discountMoney
  }, 0)
})
const laboratoryCostAmount = computed(() => {
  return ticketRoomRef.value.ticketLaboratoryList?.reduce((acc, item) => {
    return acc + item.costPrice
  }, 0)
})
</script>

<template>
  <ModalTicketLaboratoryUpdateMoney ref="modalTicketLaboratoryUpdateMoney" />
  <template v-if="ticketRoomRef.ticketLaboratoryGroupList?.length">
    <thead>
      <tr>
        <th v-if="CONFIG.MODE === 'development'">ID</th>
        <th>#</th>
        <th></th>
        <th></th>
        <th colspan="1" style="text-transform: uppercase">Xét nghiệm</th>
        <th></th>
        <th></th>
        <th></th>
        <th>Giá</th>
        <th>Chiết khấu</th>
        <th v-if="CONFIG.MODE === 'development'">Vốn</th>
        <th>Tổng tiền</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <template v-for="tlg in ticketRoomRef.ticketLaboratoryGroupList || []" :key="tlg.id">
        <tr>
          <td colspan="100" class="font-bold">{{ tlg.laboratoryGroup?.name }}</td>
        </tr>
        <tr v-for="(tl, index) in tlg.ticketLaboratoryList" :key="tl.id">
          <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
            {{ tl.id }}
          </td>
          <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
            {{ index + 1 }}
          </td>
          <td>
            <PaymentMoneyStatusTooltip :paymentMoneyStatus="tl.paymentMoneyStatus" />
          </td>
          <td class="text-center">
            <TicketLaboratoryStatusTooltip :status="tl.status" />
          </td>
          <td colspan="4">
            <span>{{ tl.laboratory?.name }}</span>
          </td>

          <td class="text-right whitespace-nowrap">
            <div v-if="tl.discountMoney" class="text-xs italic text-red-500">
              <del>{{ formatMoney(tl.expectedPrice) }}</del>
            </div>
            <div>{{ formatMoney(tl.actualPrice) }}</div>
          </td>
          <td class="text-center">
            <div v-if="tl.discountMoney">
              <VueTag v-if="tl.discountType === 'VNĐ'" color="green">
                {{ formatMoney(tl.discountMoney) }}
              </VueTag>
              <VueTag v-if="tl.discountType === '%'" color="green">
                {{ tl.discountPercent || 0 }}%
              </VueTag>
            </div>
          </td>
          <td v-if="CONFIG.MODE === 'development'" class="text-right" style="color: violet">
            {{ formatMoney(tl.costPrice) }}
          </td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(tl.actualPrice) }}
          </td>
          <td class="text-center">
            <a
              v-if="
                ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                [PaymentMoneyStatus.NoEffect, PaymentMoneyStatus.Pending].includes(
                  tl.paymentMoneyStatus,
                ) &&
                userPermission[PermissionId.TICKET_CHANGE_LABORATORY]
              "
              class="text-orange-500"
              @click="modalTicketLaboratoryUpdateMoney?.openModal(tl)"
            >
              <IconEditSquare width="20" height="20" />
            </a>
          </td>
        </tr>
      </template>
      <tr>
        <td v-if="CONFIG.MODE === 'development'" class="text-right" style="color: violet"></td>
        <td class="text-right" colspan="9">
          <div class="flex items-center justify-end gap-2">
            <span class="uppercase">Tiền xét nghiệm</span>
            <span v-if="laboratoryDiscount" class="italic" style="font-size: 13px">
              (CK: {{ formatMoney(laboratoryDiscount) }})
            </span>
          </div>
        </td>
        <td v-if="CONFIG.MODE === 'development'" class="text-right" style="color: violet">
          {{ formatMoney(laboratoryCostAmount) }}
        </td>
        <td class="font-bold text-right whitespace-nowrap">
          {{ formatMoney(ticketRoomRef.laboratoryMoney) }}
        </td>
        <td></td>
      </tr>
    </tbody>
  </template>
</template>
