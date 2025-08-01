<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import VueTag from '../../../../common/VueTag.vue'
import { IconCheckSquare, IconClockCircle, IconFileSearch } from '../../../../common/icon-antd'
import { IconEditSquare } from '../../../../common/icon-google'
import VueTooltip from '../../../../common/popover/VueTooltip.vue'
import { CONFIG } from '../../../../config'
import { MeService } from '../../../../modules/_me/me.service'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { TicketStatus } from '../../../../modules/ticket'
import { TicketRadiologyStatus } from '../../../../modules/ticket-radiology'
import ModalRadiologyDetail from '../../../master-data/radiology/detail/ModalRadiologyDetail.vue'
import ModalTicketRadiologyUpdateMoney from '../radiology/ModalTicketRadiologyUpdateMoney.vue'
import { Discount } from '@/modules/discount'
import { DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import { ticketRoomRef } from '@/modules/room'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import TicketRadiologyStatusTooltip from '@/views/room/room-radiology/TicketRadiologyStatusTooltip.vue'

const modalRadiologyDetail = ref<InstanceType<typeof ModalRadiologyDetail>>()
const modalTicketRadiologyUpdateMoney = ref<InstanceType<typeof ModalTicketRadiologyUpdateMoney>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

onMounted(async () => {
  await ticketRoomRef.value.refreshRadiology()
})

const radiologyDiscount = computed(() => {
  return ticketRoomRef.value.ticketRadiologyList?.reduce((acc, item) => {
    return acc + item.discountMoney
  }, 0)
})

const radiologyCostAmount = computed(() => {
  return ticketRoomRef.value.ticketRadiologyList?.reduce((acc, item) => {
    return acc + item.costPrice
  }, 0)
})
</script>

<template>
  <ModalRadiologyDetail ref="modalRadiologyDetail" />
  <ModalTicketRadiologyUpdateMoney ref="modalTicketRadiologyUpdateMoney" />
  <template v-if="ticketRoomRef.ticketRadiologyList?.length">
    <thead>
      <tr>
        <th v-if="CONFIG.MODE === 'development'">ID</th>
        <th>#</th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th colspan="1">CHẨN ĐOÁN HÌNH ẢNH</th>
        <th>Giá</th>
        <th>Chiết khấu</th>
        <th v-if="CONFIG.MODE === 'development'">Vốn</th>
        <th>Tổng tiền</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(ticketRadiology, index) in ticketRoomRef.ticketRadiologyList" :key="index">
        <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
          {{ ticketRadiology.id }}
        </td>
        <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
          {{ index + 1 }}
        </td>
        <td>
          <PaymentMoneyStatusTooltip :paymentMoneyStatus="ticketRadiology.paymentMoneyStatus" />
        </td>
        <td class="text-center">
          <TicketRadiologyStatusTooltip :status="ticketRadiology.status" />
        </td>
        <td colspan="4">
          <div class="flex items-center gap-1">
            <span>{{ ticketRadiology.radiology?.name }}</span>
            <a
              style="line-height: 0"
              @click="modalRadiologyDetail?.openModal(ticketRadiology.radiologyId)"
            >
              <IconFileSearch />
            </a>
          </div>
        </td>
        <td class="text-right whitespace-nowrap">
          <div v-if="ticketRadiology.discountMoney" class="text-xs italic text-red-500">
            <del>{{ formatMoney(ticketRadiology.expectedPrice) }}</del>
          </div>
          <div>{{ formatMoney(ticketRadiology.actualPrice) }}</div>
        </td>
        <td class="text-center">
          <div v-if="ticketRadiology.discountMoney">
            <VueTag v-if="ticketRadiology.discountType === DiscountType.VND" color="green">
              {{ formatMoney(ticketRadiology.discountMoney) }}
            </VueTag>
            <VueTag v-if="ticketRadiology.discountType === DiscountType.Percent" color="green">
              {{ ticketRadiology.discountPercent || 0 }}%
            </VueTag>
          </div>
        </td>
        <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: right">
          {{ formatMoney(ticketRadiology.costPrice) }}
        </td>
        <td class="text-right whitespace-nowrap">
          <div v-if="ticketRadiology.discountMoney" class="text-xs italic text-red-500">
            <del>
              {{ formatMoney(ticketRadiology.expectedPrice) }}
            </del>
          </div>
          {{ formatMoney(ticketRadiology.actualPrice) }}
        </td>
        <td class="text-center">
          <a
            v-if="
              ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
              [PaymentMoneyStatus.NoEffect, PaymentMoneyStatus.Pending].includes(
                ticketRadiology.paymentMoneyStatus,
              ) &&
              userPermission[PermissionId.TICKET_CLINIC_UPDATE_TICKET_RADIOLOGY_LIST]
            "
            class="text-orange-500"
            @click="modalTicketRadiologyUpdateMoney?.openModal(ticketRadiology)"
          >
            <IconEditSquare width="20" height="20" />
          </a>
        </td>
      </tr>
      <tr>
        <td v-if="CONFIG.MODE === 'development'" class="text-right" style="color: violet"></td>
        <td class="text-right" colspan="9">
          <div class="flex items-center justify-end gap-2">
            <span class="uppercase">Tiền CĐHA</span>
            <span v-if="radiologyDiscount" class="italic" style="font-size: 13px">
              (CK: {{ formatMoney(radiologyDiscount) }})
            </span>
          </div>
        </td>
        <td v-if="CONFIG.MODE === 'development'" class="text-right" style="color: violet;">
          {{ formatMoney(radiologyCostAmount) }}
        </td>
        <td class="font-bold text-right whitespace-nowrap">
          {{ formatMoney(ticketRoomRef.radiologyMoney) }}
        </td>
        <td></td>
      </tr>
    </tbody>
  </template>
</template>
