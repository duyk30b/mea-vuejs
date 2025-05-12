<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import VueTag from '../../../../common/VueTag.vue'
import { IconFileSearch } from '../../../../common/icon-antd'
import { IconEditSquare } from '../../../../common/icon-google'
import { CONFIG } from '../../../../config'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { TicketStatus } from '../../../../modules/ticket'
import { ticketClinicRef } from '../../../../modules/ticket-clinic'
import { ESTimer } from '../../../../utils'
import ModalProductDetail from '../../../product/detail/ModalProductDetail.vue'
import TicketDeliveryStatusTooltip from '../../../ticket-base/TicketDeliveryStatusTooltip.vue'
import ModalTicketClinicConsumableUpdate from '../consumable/ModalTicketClinicConsumableUpdate.vue'
import ModalTicketLaboratoryUpdateMoney from '../laboratory/ModalTicketLaboratoryUpdateMoney.vue'
import ModalTicketClinicPrescriptionUpdate from '../prescription/ModalTicketClinicPrescriptionUpdate.vue'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalTicketClinicConsumableUpdate =
  ref<InstanceType<typeof ModalTicketClinicConsumableUpdate>>()
const modalTicketClinicPrescriptionUpdate =
  ref<InstanceType<typeof ModalTicketClinicPrescriptionUpdate>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap, organization } = meStore

onMounted(async () => {
  await ticketClinicRef.value.refreshProduct()
})

const consumableDiscount = computed(() => {
  return ticketClinicRef.value.ticketProductConsumableList?.reduce((acc, item) => {
    return acc + item.discountMoney * item.quantity
  }, 0)
})

const consumableMoney = computed(() => {
  return ticketClinicRef.value.ticketProductConsumableList?.reduce((acc, item) => {
    return acc + item.actualPrice * item.quantity
  }, 0)
})

const consumableCostAmount = computed(() => {
  return ticketClinicRef.value.ticketProductConsumableList?.reduce((acc, item) => {
    return acc + item.costAmount
  }, 0)
})

const prescriptionDiscount = computed(() => {
  return ticketClinicRef.value.ticketProductPrescriptionList?.reduce((acc, item) => {
    return acc + item.discountMoney * item.quantity
  }, 0)
})

const prescriptionMoney = computed(() => {
  return ticketClinicRef.value.ticketProductPrescriptionList?.reduce((acc, item) => {
    return acc + item.actualPrice * item.quantity
  }, 0)
})

const prescriptionCostAmount = computed(() => {
  return ticketClinicRef.value.ticketProductPrescriptionList?.reduce((acc, item) => {
    return acc + item.costAmount
  }, 0)
})
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalTicketLaboratoryUpdateMoney ref="modalTicketLaboratoryUpdateMoney" />
  <ModalTicketClinicConsumableUpdate ref="modalTicketClinicConsumableUpdate" />
  <ModalTicketClinicPrescriptionUpdate ref="modalTicketClinicPrescriptionUpdate" />
  <template v-if="ticketClinicRef.ticketProductPrescriptionList?.length">
    <thead>
      <tr>
        <th>#</th>
        <th style="width: 32px"></th>
        <th>THUỐC</th>
        <th>Đ.Vị</th>
        <th>SL kê</th>
        <th>SL mua</th>
        <th>Giá</th>
        <th>Chiết khấu</th>
        <th>Tổng tiền</th>
        <th></th>
        <th v-if="CONFIG.MODE === 'development'" class="text-right italic">Vốn</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(
          tpPrescription, tpPrescriptionIndex
        ) in ticketClinicRef.ticketProductPrescriptionList"
        :key="tpPrescription.id + '_' + tpPrescriptionIndex"
      >
        <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
          {{ tpPrescriptionIndex + 1 }}
        </td>
        <td class="text-center">
          <TicketDeliveryStatusTooltip :deliveryStatus="tpPrescription.deliveryStatus" />
        </td>
        <td>
          <div class="flex items-center gap-1" style="font-weight: 500">
            <span>{{ tpPrescription.product?.brandName }}</span>
            <a
              style="line-height: 0"
              @click="modalProductDetail?.openModal(tpPrescription.product!)"
            >
              <IconFileSearch />
            </a>
          </div>
          <div v-if="tpPrescription.product?.substance" class="text-xs italic">
            {{ tpPrescription.product.substance }}
          </div>
          <div v-for="tb in tpPrescription.ticketBatchList || []" :key="tb.id">
            <div
              v-if="tb.batchId && tb.batch?.batchCode && tb.batch?.expiryDate"
              class="text-xs italic"
            >
              Lô {{ tb.batch?.batchCode }} - HSD
              {{ ESTimer.timeToText(tb.batch?.expiryDate) }}
            </div>
          </div>
        </td>

        <td class="text-center">{{ tpPrescription.unitName }}</td>
        <td class="text-center">{{ tpPrescription.unitQuantityPrescription }}</td>
        <td class="text-center">{{ tpPrescription.unitQuantity }}</td>
        <td class="text-right whitespace-nowrap">
          <div v-if="tpPrescription.discountMoney" class="text-xs italic text-red-500">
            <del>{{ formatMoney(tpPrescription.unitExpectedPrice) }}</del>
          </div>
          <div>{{ formatMoney(tpPrescription.unitActualPrice) }}</div>
        </td>
        <td class="text-center" style="width: 40px">
          <div v-if="tpPrescription.discountMoney">
            <VueTag v-if="tpPrescription.discountType === 'VNĐ'" color="green">
              {{ formatMoney(tpPrescription.discountMoney * tpPrescription.unitRate) }}
            </VueTag>
            <VueTag v-if="tpPrescription.discountType === '%'" color="green">
              {{ tpPrescription.discountPercent || 0 }}%
            </VueTag>
          </div>
        </td>

        <td class="text-right whitespace-nowrap">
          <div v-if="tpPrescription.discountMoney" class="text-xs italic text-red-500">
            <del>
              {{ formatMoney(tpPrescription.unitExpectedPrice * tpPrescription.quantity) }}
            </del>
          </div>
          {{ formatMoney(tpPrescription.actualPrice * tpPrescription.quantity) }}
        </td>
        <td class="text-center">
          <a
            v-if="
              ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.status) &&
              permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PRODUCT_CONSUMABLE]
            "
            class="text-orange-500"
            @click="modalTicketClinicPrescriptionUpdate?.openModal(tpPrescription)"
          >
            <IconEditSquare width="20" height="20" />
          </a>
        </td>
        <td v-if="CONFIG.MODE === 'development'" class="text-right italic">
          {{ formatMoney(tpPrescription.costAmount) }}
        </td>
      </tr>
      <tr>
        <td class="text-right" colspan="8">
          <div class="flex items-center justify-end gap-2">
            <span class="uppercase">Tiền thuốc</span>
            <span v-if="prescriptionDiscount" class="italic" style="font-size: 13px">
              (CK: {{ formatMoney(prescriptionDiscount) }})
            </span>
          </div>
        </td>
        <td class="font-bold text-right whitespace-nowrap">
          {{ formatMoney(prescriptionMoney) }}
        </td>
        <td></td>
        <td v-if="CONFIG.MODE === 'development'" class="text-right italic">
          {{ formatMoney(prescriptionCostAmount) }}
        </td>
      </tr>
    </tbody>
  </template>
  <template v-if="ticketClinicRef.ticketProductConsumableList?.length">
    <thead>
      <tr>
        <th>#</th>
        <th style="width: 32px"></th>
        <th colspan="2">VẬT TƯ</th>
        <th>Đ.Vị</th>
        <th>SL</th>
        <th>Giá</th>
        <th>Chiết khấu</th>
        <th>Tổng tiền</th>
        <th></th>
        <th v-if="CONFIG.MODE === 'development'" class="text-right italic">Vốn</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(tpConsumable, tpConsumableIndex) in ticketClinicRef.ticketProductConsumableList"
        :key="tpConsumable.id + '_' + tpConsumableIndex"
      >
        <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
          {{ tpConsumableIndex + 1 }}
        </td>
        <td class="text-center">
          <TicketDeliveryStatusTooltip :deliveryStatus="tpConsumable.deliveryStatus" />
        </td>
        <td colspan="2">
          <div class="flex items-center gap-1" style="font-weight: 500">
            <span>{{ tpConsumable.product?.brandName }}</span>
            <a style="line-height: 0" @click="modalProductDetail?.openModal(tpConsumable.product!)">
              <IconFileSearch />
            </a>
          </div>
          <div v-if="tpConsumable.product?.substance" class="text-xs italic">
            {{ tpConsumable.product.substance }}
          </div>
          <div v-for="tb in tpConsumable.ticketBatchList || []" :key="tb.id">
            <div
              v-if="tb.batchId && tb.batch?.batchCode && tb.batch?.expiryDate"
              class="text-xs italic"
            >
              Lô {{ tb.batch?.batchCode }} - HSD
              {{ ESTimer.timeToText(tb.batch?.expiryDate) }}
            </div>
          </div>
        </td>
        <td class="text-center">{{ tpConsumable.unitName }}</td>
        <td class="text-center">{{ tpConsumable.unitQuantity }}</td>
        <td class="text-right whitespace-nowrap">
          <div v-if="tpConsumable.discountMoney" class="text-xs italic text-red-500">
            <del>{{ formatMoney(tpConsumable.unitExpectedPrice) }}</del>
          </div>
          <div>{{ formatMoney(tpConsumable.unitActualPrice) }}</div>
        </td>
        <td class="text-center" style="width: 40px">
          <div v-if="tpConsumable.discountMoney">
            <VueTag v-if="tpConsumable.discountType === 'VNĐ'" color="green">
              {{ formatMoney(tpConsumable.discountMoney * tpConsumable.unitRate) }}
            </VueTag>
            <VueTag v-if="tpConsumable.discountType === '%'" color="green">
              {{ tpConsumable.discountPercent || 0 }}%
            </VueTag>
          </div>
        </td>
        <td class="text-right whitespace-nowrap">
          <div v-if="tpConsumable.discountMoney" class="text-xs italic text-red-500">
            <del>
              {{ formatMoney(tpConsumable.unitExpectedPrice * tpConsumable.quantity) }}
            </del>
          </div>
          {{ formatMoney(tpConsumable.actualPrice * tpConsumable.quantity) }}
        </td>
        <td class="text-center">
          <a
            v-if="
              ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.status) &&
              permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PRODUCT_CONSUMABLE]
            "
            class="text-orange-500"
            @click="modalTicketClinicConsumableUpdate?.openModal(tpConsumable)"
          >
            <IconEditSquare width="20" height="20" />
          </a>
        </td>
        <td v-if="CONFIG.MODE === 'development'" class="text-right italic">
          {{ formatMoney(tpConsumable.costAmount) }}
        </td>
      </tr>
      <tr>
        <td class="text-right" colspan="8">
          <div class="flex items-center justify-end gap-2">
            <span class="uppercase">Tiền vật tư</span>
            <span v-if="consumableDiscount" class="italic" style="font-size: 13px">
              (CK: {{ formatMoney(consumableDiscount) }})
            </span>
          </div>
        </td>
        <td class="font-bold text-right whitespace-nowrap">
          {{ formatMoney(consumableMoney) }}
        </td>
        <td></td>
        <td v-if="CONFIG.MODE === 'development'" class="text-right italic">
          {{ formatMoney(consumableCostAmount) }}
        </td>
      </tr>
    </tbody>
  </template>
</template>
