<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DeliveryStatus, PickupStrategy } from '@/modules/enum'
import { Ticket, TicketActionApi } from '@/modules/ticket'
import { TicketProduct } from '@/modules/ticket-product'
import { TicketProductService } from '@/modules/ticket-product/ticket-product.service'
import { ESTimer } from '@/utils'
import TicketItemPaymentTypeTooltip from '@/views/room/room-ticket-base/TicketItemPaymentTypeTooltip.vue'
import TicketDeliveryStatusTooltip from '@/views/room/room-ticket-base/TicketDeliveryStatusTooltip.vue'
import { ref } from 'vue'

const ticket = ref<Ticket>(Ticket.blank())
const shipData = ref<
  {
    ticketProductId: string
    quantityExecute: number
    checked: boolean
    ticketProduct: TicketProduct
  }[]
>([])
const checkedAll = ref(false)

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const showModal = ref(false)
const dataLoading = ref(false)
const sendLoading = ref(false)

const openModal = async (options: { ticket: Ticket; refetch?: boolean }) => {
  showModal.value = true
  ticket.value = Ticket.from(options.ticket)

  try {
    dataLoading.value = true
    let ticketProductList: TicketProduct[] = []
    if (options.refetch) {
      ticketProductList = await TicketProductService.list(
        { filter: { ticketId: ticket.value.id } },
        { refresh: { product: true, batch: true } },
      )
    } else {
      ticketProductList = TicketProduct.fromList(options.ticket.ticketProductList || [])
    }
    ticketProductList.forEach((i) => {
      if (i.quantityCompleted >= i.quantity) {
        return
      }
      shipData.value.push({
        ticketProductId: i.id,
        quantityExecute: i.quantity - i.quantityCompleted,
        checked: true,
        ticketProduct: i,
      })
    })
    checkedAll.value = true
  } catch (error) {
    console.log('🚀 ~ ModalTicketSendProduct.vue:56 ~ openModal ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const handleChangeCheckedAll = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    checkedAll.value = true
    shipData.value.forEach((i) => {
      i.checked = true
    })
  } else {
    checkedAll.value = false
    shipData.value.forEach((i) => {
      i.checked = false
    })
  }
}

const closeModal = () => {
  showModal.value = false
  ticket.value = Ticket.blank()
  shipData.value = []
  checkedAll.value = false
}

const validateQuantity = () => {
  if (settingStore.PRODUCT_SETTING.allowNegativeQuantity) {
    return true
  }
  for (let i = 0; i < shipData.value.length; i++) {
    if (!shipData.value[i].checked) {
      continue
    }
    const ticketProduct = shipData.value[i].ticketProduct
    if (ticketProduct.pickupStrategy === PickupStrategy.NoImpact) {
      continue
    }
    if (ticketProduct.product?.warehouseIds === '[]') {
      continue
    }
    const { product, batch } = ticketProduct
    if (ticketProduct.quantity > (product?.quantity || 0)) {
      AlertStore.addError(
        `Sản phẩm ${product?.brandName} không đủ ` +
          `(tồn ${product?.quantity || 0} - lấy ${ticketProduct.quantity})`,
      )
      return false
    } else if (batch && ticketProduct.batchId && ticketProduct.quantity > batch!.quantity) {
      AlertStore.addError(
        `Lô hàng: ${product!.brandName} không đủ, còn ${batch!.quantity} lấy ${
          ticketProduct.quantity
        }`,
      )
      return false
    }
  }
  return true
}

const startSendProduct = async () => {
  if (!validateQuantity()) return

  const shipProductList = shipData.value
    .filter((i) => i.checked)
    .map((i) => ({
      ticketProductId: i.ticketProductId,
      quantityExecute: i.quantityExecute,
    }))

  if (!shipProductList.length) {
    return AlertStore.addError('Cần chọn ít nhất 1 sản phẩm xuất hàng')
  }
  try {
    sendLoading.value = true
    await TicketActionApi.shipProductList({
      ticketId: ticket.value.id,
      body: {
        shipProductList: shipProductList,
      },
    })

    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalTicketSendProduct.vue:145 ~ startSendProduct ~ error:', error)
  } finally {
    sendLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 800px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          Xuất thuốc - vật tư: {{ ticket.customer?.fullName || '' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="flex flex-wrap justify-between items-baseline">
          <span>Danh sách sản phẩm</span>
        </div>
        <div class="table-wrapper mt-2">
          <table>
            <thead>
              <tr>
                <th style="width: 50px">Chọn</th>
                <th></th>
                <th></th>
                <th>Tên sản phẩm</th>
                <th>SL mua</th>
                <th>Đ.Vị</th>
                <th>Giá</th>
                <th style="width: 150px">T.Tiền</th>
              </tr>
            </thead>
            <tbody v-if="dataLoading">
              <tr>
                <td colspan="100">
                  <div class="vue-skeleton-loading"></div>
                  <div class="vue-skeleton-loading mt-2"></div>
                </td>
              </tr>
              <tr>
                <td colspan="100">
                  <div class="vue-skeleton-loading"></div>
                  <div class="vue-skeleton-loading mt-2"></div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr v-if="shipData.length == 0">
                <td colspan="20" class="text-center">Không có sản phẩm cần xuất hàng</td>
              </tr>
              <tr v-for="shpDataItem in shipData" :key="shpDataItem.ticketProductId">
                <td class="text-center">
                  <input
                    style="cursor: pointer"
                    v-model="shpDataItem.checked"
                    type="checkbox"
                  />
                </td>
                <td>
                  <TicketItemPaymentTypeTooltip
                    :ticketItemPaymentType="shpDataItem.ticketProduct.ticketItemPaymentType"
                  />
                </td>
                <td>
                  <TicketDeliveryStatusTooltip
                    :deliveryStatus="shpDataItem.ticketProduct.deliveryStatusFix"
                  />
                </td>
                <td class="text-left">
                  <div style="font-weight: 500">
                    {{ shpDataItem.ticketProduct.product?.brandName }}
                  </div>
                  <div class="text-xs italic">
                    {{ shpDataItem.ticketProduct.product?.substance || '' }}
                  </div>
                  <div v-if="shpDataItem.ticketProduct.batchId" class="text-xs italic">
                    <span v-if="shpDataItem.ticketProduct.batch?.lotNumber">
                      Lô {{ shpDataItem.ticketProduct.batch?.lotNumber }}
                    </span>
                    <span v-if="shpDataItem.ticketProduct.batch?.expiryDate">
                      - HSD {{ ESTimer.timeToText(shpDataItem.ticketProduct.batch?.expiryDate) }}
                    </span>
                  </div>
                </td>
                <td class="text-center">
                  <div>{{ shpDataItem.quantityExecute / shpDataItem.ticketProduct.unitQuantity }}</div>
                </td>
                <td class="text-center">{{ shpDataItem.ticketProduct.unitName }}</td>
                <td class="text-right">
                  {{ formatMoney(shpDataItem.ticketProduct.unitActualPrice) }}
                </td>
                <td class="text-right">
                  {{
                    formatMoney(
                      shpDataItem.ticketProduct.actualPrice *
                        shpDataItem.quantityExecute,
                    )
                  }}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="mt-2 flex justify-center">
            <label class="flex items-center gap-2 cursor-pointer ml-8">
              <input
                style="cursor: pointer"
                :checked="checkedAll"
                type="checkbox"
                @change="(e) => handleChangeCheckedAll(e)"
              />
              <a>Chọn tất cả</a>
            </label>
          </div>
        </div>

        <div class="pb-4 pt-8 flex justify-center gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Đóng lại</VueButton>
          <VueButton
            color="blue"
            type="submit"
            icon="send"
            :loading="sendLoading"
            @click="startSendProduct"
          >
            <span>Xuất thuốc - vật tư</span>
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped>
input {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom: 1px solid #ccc;
}

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  opacity: 1;
}
</style>
