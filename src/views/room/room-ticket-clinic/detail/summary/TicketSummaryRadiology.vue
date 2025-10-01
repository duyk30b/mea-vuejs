<script lang="ts" setup>
import VueTag from '@/common/VueTag.vue'
import { IconFileSearch } from '@/common/icon-antd'
import { IconEditSquare } from '@/common/icon-google'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ticketRoomRef } from '@/modules/room'
import { TicketStatus } from '@/modules/ticket'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import ModalRadiologyDetail from '@/views/master-data/radiology/detail/ModalRadiologyDetail.vue'
import TicketRadiologyStatusTooltip from '@/views/room/room-radiology/TicketRadiologyStatusTooltip.vue'
import { computed, onMounted, ref } from 'vue'
import ModalTicketRadiologyUpdate from '../radiology/ModalTicketRadiologyUpdate.vue'
import { TicketRadiologyService } from '@/modules/ticket-radiology'

const modalRadiologyDetail = ref<InstanceType<typeof ModalRadiologyDetail>>()
const modalTicketRadiologyUpdate = ref<InstanceType<typeof ModalTicketRadiologyUpdate>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

onMounted(async () => {
  await TicketRadiologyService.refreshRelation(ticketRoomRef.value.ticketRadiologyList)
  ticketRoomRef.value.refreshTicketRadiology()
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
  <ModalTicketRadiologyUpdate ref="modalTicketRadiologyUpdate" />
  <template v-if="ticketRoomRef.ticketRadiologyList?.length">
    <thead>
      <tr>
        <th v-if="CONFIG.MODE === 'development'">ID</th>
        <th>#</th>
        <th v-if="ticketRoomRef.isPaymentEachItem"></th>
        <th></th>
        <th colspan="1">CHẨN ĐOÁN HÌNH ẢNH</th>
        <th></th>
        <th></th>
        <th></th>
        <th>Giá</th>
        <th>Chiết khấu</th>
        <th v-if="CONFIG.MODE === 'development'">Vốn</th>
        <th v-if="CONFIG.MODE === 'development'">H.Hồng</th>
        <th>Phải trả</th>
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
        <td v-if="ticketRoomRef.isPaymentEachItem">
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
        <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: right"></td>
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
              [PaymentMoneyStatus.TicketPaid, PaymentMoneyStatus.PendingPayment].includes(
                ticketRadiology.paymentMoneyStatus,
              ) &&
              userPermission[PermissionId.TICKET_CHANGE_RADIOLOGY_REQUEST]
            "
            class="text-orange-500"
            @click="modalTicketRadiologyUpdate?.openModal({ ticketRadiology })"
          >
            <IconEditSquare width="20" height="20" />
          </a>
        </td>
      </tr>
      <tr>
        <td v-if="CONFIG.MODE === 'development'" class="text-right" style="color: violet"></td>
        <td v-if="ticketRoomRef.isPaymentEachItem"></td>
        <td class="text-right" colspan="8">
          <div class="flex items-center justify-end gap-2">
            <span class="uppercase">Tiền CĐHA</span>
            <span v-if="radiologyDiscount" class="italic" style="font-size: 13px">
              (CK: {{ formatMoney(radiologyDiscount) }})
            </span>
          </div>
        </td>
        <td v-if="CONFIG.MODE === 'development'" class="text-right" style="color: violet">
          {{ formatMoney(radiologyCostAmount) }}
        </td>
        <td v-if="CONFIG.MODE === 'development'" class="text-right" style="color: violet"></td>
        <td class="font-bold text-right whitespace-nowrap">
          {{ formatMoney(ticketRoomRef.radiologyMoney) }}
        </td>
        <td></td>
      </tr>
    </tbody>
  </template>
</template>
