<script lang="ts" setup>
import VueTag from '@/common/VueTag.vue'
import { IconBug, IconFileSearch } from '@/common/icon-antd'
import { IconEditSquare } from '@/common/icon-google'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType, TicketItemPaymentType } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import TicketItemPaymentTypeTooltip from '@/views/room/room-ticket-base/TicketItemPaymentTypeTooltip.vue'
import ModalRadiologyDetail from '@/views/master-data/radiology/detail/ModalRadiologyDetail.vue'
import TicketRadiologyStatusTooltip from '@/views/room/room-radiology/TicketRadiologyStatusTooltip.vue'
import { computed, onMounted, ref } from 'vue'
import ModalTicketRadiologyUpdate from '../radiology/ModalTicketRadiologyUpdate.vue'
import { TicketRadiologyService } from '@/modules/ticket-radiology'
import { VueTooltip } from '@/common/popover'
import { ticketRef } from '@/store/room.store'
import { TicketStatus } from '@/modules/ticket/ticket.type'

const modalRadiologyDetail = ref<InstanceType<typeof ModalRadiologyDetail>>()
const modalTicketRadiologyUpdate = ref<InstanceType<typeof ModalTicketRadiologyUpdate>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

onMounted(async () => {
  await TicketRadiologyService.refreshRelation(ticketRef.value.ticketRadiologyList)
  ticketRef.value.refreshTicketRadiology()
})

const radiologyDiscount = computed(() => {
  return ticketRef.value.ticketRadiologyList?.reduce((acc, item) => {
    return acc + item.discountMoney
  }, 0)
})
</script>

<template>
  <ModalRadiologyDetail ref="modalRadiologyDetail" />
  <ModalTicketRadiologyUpdate ref="modalTicketRadiologyUpdate" />
  <template v-if="ticketRef.ticketRadiologyList?.length">
    <thead>
      <tr>
        <th v-if="CONFIG.MODE === 'development'"></th>
        <th>#</th>
        <th v-if="ticketRef.isPaymentEachItem || CONFIG.MODE === 'development'"></th>
        <th></th>
        <th colspan="1">CHẨN ĐOÁN HÌNH ẢNH</th>
        <th></th>
        <th></th>
        <th></th>
        <th>Đơn Giá</th>
        <th>Chiết khấu</th>
        <th>Thanh Toán</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(ticketRadiology, index) in ticketRef.ticketRadiologyList" :key="index">
        <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
          <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
            <template #trigger>
              <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
            </template>
            <pre>{{ JSON.stringify(ticketRadiology, null, 4) }}</pre>
          </VueTooltip>
        </td>
        <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
          {{ index + 1 }}
        </td>
        <td v-if="ticketRef.isPaymentEachItem || CONFIG.MODE === 'development'">
          <TicketItemPaymentTypeTooltip :ticketItemPaymentType="ticketRadiology.ticketItemPaymentType" />
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
              ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.status) &&
              [TicketItemPaymentType.TicketPaid, TicketItemPaymentType.PendingPayment].includes(
                ticketRadiology.ticketItemPaymentType,
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
        <td v-if="ticketRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
        <td class="text-right" colspan="8">
          <div class="flex items-center justify-end gap-2">
            <span class="uppercase">Tiền CĐHA</span>
            <span v-if="radiologyDiscount" class="italic" style="font-size: 13px">
              (CK: {{ formatMoney(radiologyDiscount) }})
            </span>
          </div>
        </td>
        <td class="font-bold text-right whitespace-nowrap">
          {{ formatMoney(ticketRef.radiologyMoney) }}
        </td>
        <td></td>
      </tr>
    </tbody>
  </template>
</template>
