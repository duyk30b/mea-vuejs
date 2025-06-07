<script lang="ts" setup>
import { computed, ref } from 'vue'
import { IconCheckSquare, IconClockCircle } from '../../../../common/icon-antd'
import { IconEditSquare } from '../../../../common/icon-google'
import VueTag from '../../../../common/VueTag.vue'
import { CONFIG } from '../../../../config'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { TicketStatus } from '../../../../modules/ticket'
import { ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketLaboratoryStatus } from '../../../../modules/ticket-laboratory'
import ModalTicketLaboratoryUpdateMoney from '../laboratory/ModalTicketLaboratoryUpdateMoney.vue'
import VueTooltip from '../../../../common/popover/VueTooltip.vue'
import { onMounted } from 'vue'

const modalTicketLaboratoryUpdateMoney =
  ref<InstanceType<typeof ModalTicketLaboratoryUpdateMoney>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap, organization } = meStore

onMounted(async () => {
  await ticketClinicRef.value.refreshLaboratory()
})

const laboratoryDiscount = computed(() => {
  return ticketClinicRef.value.ticketLaboratoryList?.reduce((acc, item) => {
    return acc + item.discountMoney
  }, 0)
})
const laboratoryCostAmount = computed(() => {
  return ticketClinicRef.value.ticketLaboratoryList?.reduce((acc, item) => {
    return acc + item.costPrice
  }, 0)
})
</script>

<template>
  <ModalTicketLaboratoryUpdateMoney ref="modalTicketLaboratoryUpdateMoney" />
  <template v-if="ticketClinicRef.ticketLaboratoryGroupList?.length">
    <thead>
      <tr>
        <th>#</th>
        <th></th>
        <th colspan="4" style="text-transform: uppercase">Xét nghiệm</th>
        <th>Giá</th>
        <th>Chiết khấu</th>
        <th>Tổng tiền</th>
        <th></th>
        <th v-if="CONFIG.MODE === 'development'" class="text-right italic">Vốn</th>
      </tr>
    </thead>
    <tbody>
      <template v-for="tlg in ticketClinicRef.ticketLaboratoryGroupList || []" :key="tlg.id">
        <tr>
          <td colspan="11" class="font-bold">{{ tlg.laboratoryGroup?.name }}</td>
        </tr>
        <tr v-for="(tl, index) in tlg.ticketLaboratoryList" :key="tl.id">
          <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
            {{ index + 1 }}
          </td>
          <td>
            <div class="flex items-center justify-center">
              <VueTooltip v-if="tl.status === TicketLaboratoryStatus.Pending">
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
            </div>
          </td>
          <td colspan="4">
            <div class="flex items-center gap-1">
              <span>{{ tl.laboratory?.name }}</span>
            </div>
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
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(tl.actualPrice) }}
          </td>
          <td class="text-center">
            <a
              v-if="
                ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.status) &&
                permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_LABORATORY_LIST]
              "
              class="text-orange-500"
              @click="modalTicketLaboratoryUpdateMoney?.openModal(tl)"
            >
              <IconEditSquare width="20" height="20" />
            </a>
          </td>
          <td v-if="CONFIG.MODE === 'development'" class="text-right italic">
            {{ formatMoney(tl.costPrice) }}
          </td>
        </tr>
      </template>
      <tr>
        <td class="text-right" colspan="8">
          <div class="flex items-center justify-end gap-2">
            <span class="uppercase">Tiền xét nghiệm</span>
            <span v-if="laboratoryDiscount" class="italic" style="font-size: 13px">
              (CK: {{ formatMoney(laboratoryDiscount) }})
            </span>
          </div>
        </td>
        <td class="font-bold text-right whitespace-nowrap">
          {{ formatMoney(ticketClinicRef.laboratoryMoney) }}
        </td>
        <td></td>
        <td v-if="CONFIG.MODE === 'development'" class="text-right italic">
          {{ formatMoney(laboratoryCostAmount) }}
        </td>
      </tr>
    </tbody>
  </template>
</template>
