<script lang="ts" setup>
import VueTag from '@/common/VueTag.vue'
import { IconBug, IconFileSearch } from '@/common/icon-antd'
import { IconEditSquare } from '@/common/icon-google'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PaymentMoneyStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ticketRoomRef } from '@/modules/room'
import { TicketStatus } from '@/modules/ticket'
import { ESTimer } from '@/utils'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import TicketDeliveryStatusTooltip from '@/views/room/room-ticket-base/TicketDeliveryStatusTooltip.vue'
import { computed, onMounted, ref } from 'vue'
import ModalTicketClinicConsumableUpdate from '../consumable/ModalTicketConsumableUpdate.vue'
import ModalTicketPrescriptionUpdate from '../prescription/ModalTicketPrescriptionUpdate.vue'
import { TicketProductService } from '@/modules/ticket-product'
import { VueTooltip } from '@/common/popover'

const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalTicketClinicConsumableUpdate =
  ref<InstanceType<typeof ModalTicketClinicConsumableUpdate>>()
const modalTicketClinicPrescriptionUpdate =
  ref<InstanceType<typeof ModalTicketPrescriptionUpdate>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, organization } = MeService

onMounted(async () => {
  await TicketProductService.refreshRelation(ticketRoomRef.value.ticketProductList || [])
  ticketRoomRef.value.refreshTicketProduct()
})

const consumableDiscount = computed(() => {
  return ticketRoomRef.value.ticketProductConsumableList?.reduce((acc, item) => {
    return acc + item.unitDiscountMoney * item.unitQuantity
  }, 0)
})

const consumableMoney = computed(() => {
  return ticketRoomRef.value.ticketProductConsumableList?.reduce((acc, item) => {
    return acc + item.unitActualPrice * item.unitQuantity
  }, 0)
})

const prescriptionDiscount = computed(() => {
  return ticketRoomRef.value.ticketProductPrescriptionList?.reduce((acc, item) => {
    return acc + item.unitDiscountMoney * item.unitQuantity
  }, 0)
})

const prescriptionMoney = computed(() => {
  return ticketRoomRef.value.ticketProductPrescriptionList?.reduce((acc, item) => {
    return acc + item.unitActualPrice * item.unitQuantity
  }, 0)
})
</script>

<template>
  <ModalProductDetail ref="modalProductDetail" />
  <ModalTicketClinicConsumableUpdate ref="modalTicketClinicConsumableUpdate" />
  <ModalTicketPrescriptionUpdate ref="modalTicketClinicPrescriptionUpdate" />

  <template v-if="ticketRoomRef.ticketProductConsumableList?.length">
    <thead>
      <tr>
        <th v-if="CONFIG.MODE === 'development'"></th>
        <th>#</th>
        <th v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></th>
        <th style="width: 32px"></th>
        <th colspan="1">VẬT TƯ</th>
        <th></th>
        <th>Đ.Vị</th>
        <th>SL</th>
        <th>Đơn Giá</th>
        <th>Chiết khấu</th>
        <th>Thanh Toán</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(tpConsumable, tpConsumableIndex) in ticketRoomRef.ticketProductConsumableList"
        :key="tpConsumable.id + '_' + tpConsumableIndex"
      >
        <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
          <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
            <template #trigger>
              <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
            </template>
            <pre>{{ JSON.stringify(tpConsumable, null, 4) }}</pre>
          </VueTooltip>
        </td>
        <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
          {{ tpConsumableIndex + 1 }}
        </td>
        <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'">
          <PaymentMoneyStatusTooltip :paymentMoneyStatus="tpConsumable.paymentMoneyStatus" />
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
              v-if="tb.batchId && tb.batch?.lotNumber && tb.batch?.expiryDate"
              class="text-xs italic"
            >
              Lô {{ tb.batch?.lotNumber }} - HSD
              {{ ESTimer.timeToText(tb.batch?.expiryDate) }}
            </div>
          </div>
        </td>
        <td class="text-center">{{ tpConsumable.unitName }}</td>
        <td class="text-center">{{ tpConsumable.unitQuantity }}</td>

        <td class="text-right whitespace-nowrap">
          <div v-if="tpConsumable.unitDiscountMoney" class="text-xs italic text-red-500">
            <del>{{ formatMoney(tpConsumable.unitExpectedPrice) }}</del>
          </div>
          <div>{{ formatMoney(tpConsumable.unitActualPrice) }}</div>
        </td>
        <td class="text-center" style="width: 40px">
          <div v-if="tpConsumable.unitDiscountMoney">
            <VueTag v-if="tpConsumable.discountType === 'VNĐ'" color="green">
              {{ formatMoney(tpConsumable.unitDiscountMoney) }}
            </VueTag>
            <VueTag v-if="tpConsumable.discountType === '%'" color="green">
              {{ tpConsumable.discountPercent || 0 }}%
            </VueTag>
          </div>
        </td>
        <td class="text-right whitespace-nowrap">
          <div v-if="tpConsumable.unitDiscountMoney" class="text-xs italic text-red-500">
            <del>
              {{ formatMoney(tpConsumable.unitExpectedPrice * tpConsumable.unitQuantity) }}
            </del>
          </div>
          {{ formatMoney(tpConsumable.unitActualPrice * tpConsumable.unitQuantity) }}
        </td>
        <td class="text-center">
          <a
            v-if="
              ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
              [PaymentMoneyStatus.TicketPaid, PaymentMoneyStatus.PendingPayment].includes(
                tpConsumable.paymentMoneyStatus,
              ) &&
              userPermission[PermissionId.TICKET_CHANGE_PRODUCT_CONSUMABLE]
            "
            class="text-orange-500"
            @click="modalTicketClinicConsumableUpdate?.openModal(tpConsumable)"
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
      </tr>
    </tbody>
  </template>
  <template v-if="ticketRoomRef.ticketProductPrescriptionList?.length">
    <thead>
      <tr>
        <th v-if="CONFIG.MODE === 'development'"></th>
        <th>#</th>
        <th v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></th>
        <th style="width: 32px"></th>
        <th>THUỐC</th>
        <th>Đ.Vị</th>
        <th>SL kê</th>
        <th>SL mua</th>
        <th>Đơn Giá</th>
        <th>Chiết khấu</th>
        <th>Thanh Toán</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(tpPrescription, tpPrescriptionIndex) in ticketRoomRef.ticketProductPrescriptionList"
        :key="tpPrescription.id + '_' + tpPrescriptionIndex"
      >
        <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
          <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
            <template #trigger>
              <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
            </template>
            <pre>{{ JSON.stringify(tpPrescription, null, 4) }}</pre>
          </VueTooltip>
        </td>
        <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
          {{ tpPrescriptionIndex + 1 }}
        </td>
        <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'">
          <PaymentMoneyStatusTooltip :paymentMoneyStatus="tpPrescription.paymentMoneyStatus" />
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
              v-if="tb.batchId && tb.batch?.lotNumber && tb.batch?.expiryDate"
              class="text-xs italic"
            >
              Lô {{ tb.batch?.lotNumber }} - HSD
              {{ ESTimer.timeToText(tb.batch?.expiryDate) }}
            </div>
          </div>
        </td>

        <td class="text-center">{{ tpPrescription.unitName }}</td>
        <td class="text-center">{{ tpPrescription.unitQuantityPrescription }}</td>
        <td class="text-center">{{ tpPrescription.unitQuantity }}</td>
        <td class="text-right whitespace-nowrap">
          <div v-if="tpPrescription.unitDiscountMoney" class="text-xs italic text-red-500">
            <del>{{ formatMoney(tpPrescription.unitExpectedPrice) }}</del>
          </div>
          <div>{{ formatMoney(tpPrescription.unitActualPrice) }}</div>
        </td>
        <td class="text-center" style="width: 40px">
          <div v-if="tpPrescription.unitDiscountMoney">
            <VueTag v-if="tpPrescription.discountType === 'VNĐ'" color="green">
              {{ formatMoney(tpPrescription.unitDiscountMoney) }}
            </VueTag>
            <VueTag v-if="tpPrescription.discountType === '%'" color="green">
              {{ tpPrescription.discountPercent || 0 }}%
            </VueTag>
          </div>
        </td>
        <td class="text-right whitespace-nowrap">
          <div v-if="tpPrescription.unitDiscountMoney" class="text-xs italic text-red-500">
            <del>
              {{ formatMoney(tpPrescription.unitExpectedPrice * tpPrescription.unitQuantity) }}
            </del>
          </div>
          {{ formatMoney(tpPrescription.unitActualPrice * tpPrescription.unitQuantity) }}
        </td>
        <td class="text-center">
          <a
            v-if="
              ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
              [PaymentMoneyStatus.TicketPaid, PaymentMoneyStatus.PendingPayment].includes(
                tpPrescription.paymentMoneyStatus,
              ) &&
              userPermission[PermissionId.TICKET_CHANGE_PRODUCT_PRESCRIPTION]
            "
            class="text-orange-500"
            @click="modalTicketClinicPrescriptionUpdate?.openModal(tpPrescription)"
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
      </tr>
    </tbody>
  </template>
</template>
