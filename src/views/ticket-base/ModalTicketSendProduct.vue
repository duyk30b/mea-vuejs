<script setup lang="ts">
import { DeliveryStatus } from '@/modules/enum'
import { TicketProduct } from '@/modules/ticket-product'
import { TicketProductService } from '@/modules/ticket-product/ticket-product.service'
import { ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { IconClose } from '../../common/icon-antd'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import VueModal from '../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../modules/_me/setting.store'
import { Ticket, TicketType } from '../../modules/ticket'
import { TicketClinicProductApi } from '../../modules/ticket-clinic'
import { TicketOrderApi } from '../../modules/ticket-order'
import { ESTimer } from '../../utils'

const ticket = ref<Ticket>(Ticket.blank())
const ticketProductList = ref<TicketProduct[]>([])
const ticketProductIdSelect = ref<Record<string, boolean>>({})
const checkedAll = ref(false)

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const showModal = ref(false)
const dataLoading = ref(false)
const sendLoading = ref(false)

const openModal = async (options: { ticket: Ticket; queryTicketProduct?: boolean }) => {
  showModal.value = true
  ticket.value = Ticket.from(options.ticket)

  try {
    dataLoading.value = true
    if (options.queryTicketProduct) {
      ticketProductList.value = await TicketProductService.list(
        { filter: { ticketId: ticket.value.id, deliveryStatus: DeliveryStatus.Pending } },
        { refresh: { product: true, batch: true } },
      )
    } else {
      ticketProductList.value = TicketProduct.fromList(options.ticket.ticketProductList || [])
    }

    ticketProductList.value.forEach((i) => {
      ticketProductIdSelect.value[i.id] = true
    })
    checkedAll.value = true
  } catch (error) {
    console.log('🚀 ~ ModalTicketSendProduct.vue:50 ~ openModal ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const handleChangeInput = (e: Event, tpId: number) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    ticketProductIdSelect.value[tpId] = true
  } else {
    ticketProductIdSelect.value[tpId] = false
  }
}

const handleChangeCheckedAll = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.checked) {
    checkedAll.value = true
    ticketProductList.value.forEach((i) => {
      ticketProductIdSelect.value[i.id] = true
    })
  } else {
    checkedAll.value = false
    ticketProductList.value.forEach((i) => {
      ticketProductIdSelect.value[i.id] = false
    })
  }
}

const setSelectAll = () => {
  checkedAll.value = true
  ticketProductList.value.forEach((i) => {
    ticketProductIdSelect.value[i.id] = true
  })
}

const closeModal = () => {
  showModal.value = false
  ticket.value = Ticket.blank()
  ticketProductList.value = []
  ticketProductIdSelect.value = {}
  checkedAll.value = false
}

const validateQuantity = () => {
  if (settingStore.PRODUCT_SETTING.allowNegativeQuantity) {
    return true
  }
  for (let i = 0; i < ticketProductList.value.length; i++) {
    const ticketProduct = ticketProductList.value[i]
    if (!ticketProductIdSelect.value[ticketProduct.id]) {
      continue
    }

    const { product, batch } = ticketProduct
    if (product?.warehouseIds === '[]') continue

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

  const ticketProductIdList = Object.entries(ticketProductIdSelect.value)
    .filter(([key, value]) => !!value)
    .map(([key, value]) => Number(key))

  if (!ticketProductIdList.length) {
    return AlertStore.addError('Cần chọn ít nhất 1 sản phẩm xuất hàng')
  }
  try {
    sendLoading.value = true
    if (ticket.value.ticketType === TicketType.Order) {
      await TicketOrderApi.sendProduct({
        ticketId: ticket.value.id,
        ticketProductIdList,
      })
    } else {
      await TicketClinicProductApi.sendProduct({
        ticketId: ticket.value.id,
        ticketProductIdList,
      })
    }
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalVisitReturn.vue:90 ~ startSendProduct ~ error:', error)
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
          <div>Danh sách sản phẩm</div>
          <div>
            <VueButton type="button" @click="setSelectAll">
              <span>Chọn tất cả</span>
            </VueButton>
          </div>
        </div>
        <div class="table-wrapper mt-2">
          <table>
            <thead>
              <tr>
                <th style="width: 100px">
                  <input
                    style="cursor: pointer"
                    :checked="checkedAll"
                    type="checkbox"
                    @change="(e) => handleChangeCheckedAll(e)"
                  />
                </th>
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
              <tr v-if="ticketProductList.length == 0">
                <td colspan="20" class="text-center">Chưa xuất thuốc</td>
              </tr>
              <tr v-for="ticketProduct in ticketProductList" :key="ticketProduct.id">
                <td class="text-center">
                  <input
                    style="cursor: pointer"
                    :checked="ticketProductIdSelect[ticketProduct.id]"
                    type="checkbox"
                    @change="(e) => handleChangeInput(e, ticketProduct.id)"
                  />
                </td>
                <td class="text-left">
                  <div style="font-weight: 500">{{ ticketProduct.product?.brandName }}</div>
                  <div class="text-xs italic">
                    {{ ticketProduct.product?.substance || '' }}
                  </div>
                  <div v-if="ticketProduct.batchId" class="text-xs italic">
                    <span v-if="ticketProduct.batch?.lotNumber">
                      Lô {{ ticketProduct.batch?.lotNumber }}
                    </span>
                    <span v-if="ticketProduct.batch?.expiryDate">
                      - HSD {{ ESTimer.timeToText(ticketProduct.batch?.expiryDate) }}
                    </span>
                  </div>
                </td>
                <td class="text-center">
                  <div>{{ ticketProduct.unitQuantity }}</div>
                </td>
                <td class="text-center">{{ ticketProduct.unitName }}</td>
                <td class="text-right">{{ formatMoney(ticketProduct.unitActualPrice) }}</td>
                <td class="text-right">
                  {{ formatMoney(ticketProduct.actualPrice * ticketProduct.quantity) }}
                </td>
              </tr>
            </tbody>
          </table>
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
