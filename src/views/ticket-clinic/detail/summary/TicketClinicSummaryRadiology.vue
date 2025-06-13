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
import { DiscountType } from '@/modules/enum'
import { ticketRoomRef } from '@/modules/room'

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
        <th>#</th>
        <th style="width: 32px"></th>
        <th colspan="4">CHẨN ĐOÁN HÌNH ẢNH</th>
        <th>Giá</th>
        <th>Chiết khấu</th>
        <th>Tổng tiền</th>
        <th></th>
        <th v-if="CONFIG.MODE === 'development'" class="text-right italic">Vốn</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(ticketRadiology, index) in ticketRoomRef.ticketRadiologyList" :key="index">
        <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
          {{ index + 1 }}
        </td>
        <td class="text-center">
          <VueTooltip v-if="ticketRadiology.status === TicketRadiologyStatus.Pending">
            <template #trigger>
              <IconClockCircle style="font-size: 18px; color: orange; cursor: not-allowed" />
            </template>
            <div>Chưa có kết quả</div>
          </VueTooltip>

          <VueTooltip v-else>
            <template #trigger>
              <IconCheckSquare style="color: #52c41a; font-size: 18px; cursor: not-allowed" />
            </template>
            <div>Đã hoàn thành</div>
          </VueTooltip>
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
          <div v-if="CONFIG.MODE === 'development'" class="text-xs italic">
            Vốn: {{ formatMoney(ticketRadiology.costPrice) }}
          </div>
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
              ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
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
        <td class="text-right" colspan="8">
          <div class="flex items-center justify-end gap-2">
            <span class="uppercase">Tiền CĐHA</span>
            <span v-if="radiologyDiscount" class="italic" style="font-size: 13px">
              (CK: {{ formatMoney(radiologyDiscount) }})
            </span>
          </div>
        </td>
        <td class="font-bold text-right whitespace-nowrap">
          {{ formatMoney(ticketRoomRef.radiologyMoney) }}
        </td>
        <td></td>
        <td v-if="CONFIG.MODE === 'development'" class="text-right italic">
          {{ formatMoney(radiologyCostAmount) }}
        </td>
      </tr>
    </tbody>
  </template>
</template>
