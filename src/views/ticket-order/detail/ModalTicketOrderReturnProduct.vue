<script setup lang="ts">
import { CloseOutlined } from '@ant-design/icons-vue'
import { computed, ref, watch, watchEffect } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputMoney } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DiscountType } from '../../../modules/enum'
import { Ticket } from '../../../modules/ticket'
import { TicketOrderApi } from '../../../modules/ticket-order'
import { ticket } from './ticket-order-detail.ref'

const emit = defineEmits<{ (e: 'success'): any }>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const ticketUpdate = ref(Ticket.blank())
const ticketProductMapReturn = ref<
  Record<
    string,
    {
      quantityReturn: number
      costAmountReturn: number
      actualPrice: number
      ticketProductId: number
    }
  >
>({})
const ticketProcedureMapReturn = ref<
  Record<
    string,
    {
      quantityReturn: number
      actualPrice: number
      ticketProcedureId: number
    }
  >
>({})
const discountMoneyUpdate = ref<number>(0)
const surchargeUpdate = ref<number>(0)

const showModal = ref(false)
const returnLoading = ref(false)

watch(
  () => ticketProductMapReturn.value,
  (newValue) => {
    Object.keys(newValue).forEach((i) => {
      const ticketProduct = ticket.value.ticketProductList?.find((j) => {
        return j.id === Number(i)
      })
      const ticketUpdateProduct = ticketUpdate.value.ticketProductList?.find((j) => {
        return j.id === Number(i)
      })
      ticketUpdateProduct!.quantity = ticketProduct!.quantity - newValue[i].quantityReturn
    })
  },
  { deep: true }
)

watch(
  () => ticketProcedureMapReturn.value,
  (newValue) => {
    Object.keys(newValue).forEach((i) => {
      const ticketProcedure = ticket.value.ticketProcedureList?.find((j) => {
        return j.id === Number(i)
      })
      const ticketUpdateProcedure = ticketUpdate.value.ticketProcedureList?.find((j) => {
        return j.id === Number(i)
      })
      ticketUpdateProcedure!.quantity = ticketProcedure!.quantity - newValue[i].quantityReturn
    })
  },
  { deep: true }
)

watchEffect(() => {
  let totalCostAmount = 0
  let productMoney = 0
  let procedureMoney = 0
  let itemsActualMoney = 0
  let itemsDiscountProduct = 0
  let itemsDiscountProcedure = 0
  let itemsDiscount = 0

  ticketUpdate.value.ticketProductList?.forEach((item) => {
    totalCostAmount += item.costAmount
    productMoney += item.actualPrice * item.quantity
    itemsDiscountProduct += item.discountMoney * item.quantity
  })
  ticketUpdate.value.ticketProcedureList?.forEach((item) => {
    procedureMoney += item.actualPrice * item.quantity
    itemsDiscountProcedure += item.discountMoney * item.quantity
  })

  itemsDiscount = itemsDiscountProduct + itemsDiscountProcedure
  itemsActualMoney = productMoney + procedureMoney

  const discountType: DiscountType = DiscountType.VND
  const discountMoney = ticketUpdate.value.discountMoney || 0
  const discountPercent =
    itemsActualMoney == 0 ? 0 : Math.floor((discountMoney * 100) / itemsActualMoney)

  const surcharge = ticketUpdate.value.surcharge || 0
  const expense = ticketUpdate.value.expense || 0
  const totalMoney = itemsActualMoney - discountMoney + surcharge
  const profit = totalMoney - totalCostAmount - expense

  ticketUpdate.value.totalCostAmount = totalCostAmount
  ticketUpdate.value.productMoney = productMoney
  ticketUpdate.value.procedureMoney = procedureMoney
  ticketUpdate.value.itemsActualMoney = itemsActualMoney
  ticketUpdate.value.itemsDiscountProcedure = itemsDiscountProcedure
  ticketUpdate.value.itemsDiscountProduct = itemsDiscountProduct
  ticketUpdate.value.itemsDiscount = itemsDiscount

  ticketUpdate.value.discountMoney = discountMoney
  ticketUpdate.value.discountPercent = discountPercent
  ticketUpdate.value.discountType = discountType
  ticketUpdate.value.totalMoney = totalMoney
  ticketUpdate.value.profit = profit
})

watch(
  () => ticketUpdate.value.totalMoney,
  (newValue) => {
    const totalMoneyReturn = ticket.value.totalMoney - newValue
    const debtReturn = Math.min(ticket.value.debt, totalMoneyReturn)
    const paidReturn = totalMoneyReturn - debtReturn
    ticketUpdate.value.debt = ticket.value.debt - debtReturn
    ticketUpdate.value.paid = ticket.value.paid - paidReturn
  }
)

const openModal = async () => {
  showModal.value = true
  ticketUpdate.value = Ticket.from(ticket.value)

  ticket.value.ticketProductList = ticket.value.ticketProductList || []
  ticket.value.ticketProcedureList = ticket.value.ticketProcedureList || []

  ticket.value.ticketProductList.forEach((i) => {
    ticketProductMapReturn.value[i.id] = {
      ticketProductId: i.id,
      quantityReturn: 0,
      costAmountReturn: 0,
      actualPrice: i.actualPrice,
    }
  })
  ticket.value.ticketProcedureList.forEach((i) => {
    ticketProcedureMapReturn.value[i.id] = {
      ticketProcedureId: i.id,
      quantityReturn: 0,
      actualPrice: i.actualPrice,
    }
  })
  discountMoneyUpdate.value = ticket.value.discountMoney
  surchargeUpdate.value = ticket.value.surcharge
}

const hasChangeData = computed(() => {
  if (Object.values(ticketProductMapReturn.value).some((i) => i.quantityReturn != 0)) {
    return true
  }
  if (Object.values(ticketProcedureMapReturn.value).some((i) => i.quantityReturn != 0)) {
    return true
  }
  if (!Ticket.equal(ticket.value, ticketUpdate.value)) {
    return true
  }
  return false
})

const setSelectAllQuantity = () => {
  ticket.value.ticketProductList!.forEach((i) => {
    ticketProductMapReturn.value[i.id] = {
      ticketProductId: i.id,
      quantityReturn: i.quantity,
      costAmountReturn: i.costAmount,
      actualPrice: i.actualPrice,
    }
  })

  ticket.value.ticketProcedureList!.forEach((i) => {
    ticketProcedureMapReturn.value[i.id] = {
      ticketProcedureId: i.id,
      quantityReturn: i.quantity,
      actualPrice: i.actualPrice,
    }
  })
}

const closeModal = () => {
  showModal.value = false
  ticketUpdate.value = Ticket.blank()
}

const reCalculatorAndValidateQuantity = () => {
  let result = true
  ticket.value.ticketProductList!.forEach((i) => {
    if (ticketProductMapReturn.value[i.id]!.quantityReturn < 0) {
      result = false
      AlertStore.addError(`Số lượng của sản phẩm ${i.product?.brandName} không hợp lệ`)
    }
    if (ticketProductMapReturn.value[i.id]!.quantityReturn > i.quantity) {
      result = false
      AlertStore.addError(`Sản phẩm ${i.product?.brandName} hoàn trả vượt quá số lượng mua`)
    }
    const costAmountReturn = Math.floor(
      (i.costAmount * ticketProductMapReturn.value[i.id]!.quantityReturn) / (i.quantity || 1)
    )
    ticketProductMapReturn.value[i.id]!.costAmountReturn = costAmountReturn
  })
  return result
}

const startReturnProduct = async () => {
  returnLoading.value = true
  try {
    if (!reCalculatorAndValidateQuantity()) return
    await TicketOrderApi.returnProduct({
      ticketId: ticket.value.id,
      ticketProductReturnList: Object.values(ticketProductMapReturn.value).filter((i) => {
        return i.quantityReturn > 0
      }),
      ticketProcedureReturnList: Object.values(ticketProcedureMapReturn.value).filter((i) => {
        return i.quantityReturn > 0
      }),
      totalCostAmountUpdate: ticketUpdate.value.totalCostAmount,
      productMoneyUpdate: ticketUpdate.value.productMoney,
      procedureMoneyUpdate: ticketUpdate.value.procedureMoney,
      itemsActualMoneyUpdate: ticketUpdate.value.itemsActualMoney,
      itemsDiscountUpdate: ticketUpdate.value.itemsDiscount,

      discountMoneyUpdate: ticketUpdate.value.discountMoney,
      discountPercentUpdate: ticketUpdate.value.discountPercent,
      surchargeUpdate: ticketUpdate.value.surcharge,
      expenseUpdate: ticketUpdate.value.expense,

      totalMoneyUpdate: ticketUpdate.value.totalMoney,
      profitUpdate: ticketUpdate.value.profit,
      paidUpdate: ticketUpdate.value.paid,
      debtUpdate: ticketUpdate.value.debt,
    })
    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ModalTicketOrderReturnProduct.vue:249 ~ startReturnProduct ~ error:', error)
  } finally {
    returnLoading.value = false
  }
}

const paidReturn = computed(() => {
  return ticket.value.paid - ticketUpdate.value.paid
})

const clickReturnProduct = async () => {
  if (ticket.value.totalMoney < 0) {
    return AlertStore.addError('Số tiền trong đơn không được phép nhỏ hơn 0')
  }

  ModalStore.confirm({
    title: 'Bạn có chắc chắn mở lại hồ sơ của phiếu khám này ?',
    content: [
      '- Kho hàng sẽ nhập lại những sản phẩm trong danh sách trả (nếu có)',
      ...(ticket.value.totalMoney > ticketUpdate.value.totalMoney
        ? [
            `- Đơn hàng giảm số tiền: ${formatMoney(
              ticket.value.totalMoney - ticketUpdate.value.totalMoney
            )}`,
          ]
        : []),
      ...(ticket.value.totalMoney < ticketUpdate.value.totalMoney
        ? [
            `- Đơn hàng cần thanh toán thêm: ${formatMoney(
              -ticket.value.totalMoney + ticketUpdate.value.totalMoney
            )}`,
          ]
        : []),
      ...(ticket.value.debt > ticketUpdate.value.debt
        ? [`- Trừ nợ khách hàng: ${formatMoney(ticket.value.debt - ticketUpdate.value.debt)}`]
        : []),
      ...(ticket.value.debt < ticketUpdate.value.debt
        ? [`- Khách hàng nợ thêm: ${formatMoney(-ticket.value.debt + ticketUpdate.value.debt)}`]
        : []),
      ...(ticket.value.paid > ticketUpdate.value.paid
        ? [
            `- Khách hàng nhận lại số tiền là: ${formatMoney(
              ticket.value.paid - ticketUpdate.value.paid
            )}`,
          ]
        : []),
      ...(ticket.value.paid < ticketUpdate.value.paid
        ? [
            `- Khách hàng phải thanh toán thêm: ${formatMoney(
              -ticket.value.paid + ticketUpdate.value.paid
            )}`,
          ]
        : []),
    ],
    async onOk() {
      await startReturnProduct()
    },
    okText: 'Xác nhận TRẢ HÀNG',
  })
}

const handleUpdateTicketDebt = (v: number) => {
  ticketUpdate.value.paid = ticketUpdate.value.totalMoney - v
}

const handleUpdateTicketPaid = (v: number) => {
  ticketUpdate.value.debt = ticketUpdate.value.totalMoney - v
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 800px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          Thông tin hoàn trả: {{ ticket.customer?.fullName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <form class="p-4" @submit.prevent="clickReturnProduct">
        <div class="flex justify-between">
          <div></div>
          <div>
            <VueButton type="button" @click="setSelectAllQuantity">
              <span>Chọn tất cả số lượng</span>
            </VueButton>
          </div>
        </div>
        <div class="table-wrapper mt-2">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Thuốc</th>
                <th>SL mua</th>
                <th>Đ.Vị</th>
                <th>Giá</th>
                <th style="width: 150px">SL H.Trả</th>
                <th style="width: 150px">Tiền H.Trả</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(ticketProduct, index) in ticket.ticketProductList"
                :key="ticketProduct.id">
                <td class="text-center">{{ index + 1 }}</td>
                <td>
                  <div style="font-weight: 500">{{ ticketProduct.product?.brandName }}</div>
                  <div v-if="ticketProduct.product?.substance" class="text-xs italic">
                    {{ ticketProduct.product.substance }}
                  </div>
                </td>
                <td class="text-center">
                  <div>{{ ticketProduct.unitQuantity }}</div>
                  <div
                    v-if="ticketProduct.quantityReturn"
                    style="font-size: 0.9em; font-style: italic">
                    Hoàn trả: {{ ticketProduct.quantityReturn / ticketProduct.unitRate }}
                  </div>
                </td>
                <td class="text-center">{{ ticketProduct.unitName }}</td>
                <td class="text-right">
                  <div
                    v-if="ticketProduct.unitExpectedPrice != ticketProduct.unitActualPrice"
                    style="font-size: 13px; font-style: italic"
                    class="line-through">
                    {{ formatMoney(ticketProduct.unitExpectedPrice) }}
                  </div>
                  <div>{{ formatMoney(ticketProduct.unitActualPrice) }}</div>
                </td>
                <td class="text-right">
                  <input
                    type="number"
                    style="width: 120px"
                    :value="
                      ticketProductMapReturn[ticketProduct.id].quantityReturn /
                      ticketProduct.unitRate
                    "
                    min="0"
                    :max="ticketProduct.quantity / ticketProduct.unitRate"
                    @input="
                      (e) =>
                        (ticketProductMapReturn[ticketProduct.id].quantityReturn =
                          Number((e.target as HTMLInputElement).value || 0) *
                          ticketProduct.unitRate)
                    " />
                </td>
                <td class="text-right" style="padding-right: 20px">
                  <div
                    v-if="ticketProduct.unitExpectedPrice != ticketProduct.unitActualPrice"
                    style="font-size: 13px; font-style: italic"
                    class="line-through">
                    {{
                      formatMoney(
                        ticketProductMapReturn[ticketProduct.id].quantityReturn *
                          ticketProduct.expectedPrice
                      )
                    }}
                  </div>
                  <div>
                    {{
                      formatMoney(
                        ticketProductMapReturn[ticketProduct.id].quantityReturn *
                          ticketProduct.actualPrice
                      )
                    }}
                  </div>
                </td>
              </tr>
              <tr
                v-for="(ticketProcedure, index) in ticket.ticketProcedureList"
                :key="ticketProcedure.id">
                <td class="text-center">{{ index + 1 }}</td>
                <td>
                  <div style="font-weight: 500">{{ ticketProcedure.procedure?.name }}</div>
                </td>
                <td class="text-center">
                  <div>{{ ticketProcedure.quantity }}</div>
                </td>
                <td class="text-center"></td>
                <td class="text-right">
                  <div
                    v-if="ticketProcedure.expectedPrice != ticketProcedure.actualPrice"
                    style="font-size: 13px; font-style: italic"
                    class="line-through">
                    {{ formatMoney(ticketProcedure.expectedPrice) }}
                  </div>
                  <div>{{ formatMoney(ticketProcedure.actualPrice) }}</div>
                </td>
                <td class="text-right">
                  <input
                    type="number"
                    style="width: 120px"
                    :value="ticketProcedureMapReturn[ticketProcedure.id].quantityReturn"
                    min="0"
                    :max="ticketProcedure.quantity"
                    @input="
                      (e) =>
                        (ticketProcedureMapReturn[ticketProcedure.id].quantityReturn = Number(
                          (e.target as HTMLInputElement).value || 0
                        ))
                    " />
                </td>
                <td class="text-right" style="padding-right: 20px">
                  <div
                    v-if="ticketProcedure.expectedPrice != ticketProcedure.actualPrice"
                    style="font-size: 13px; font-style: italic"
                    class="line-through">
                    {{
                      formatMoney(
                        ticketProcedureMapReturn[ticketProcedure.id].quantityReturn *
                          ticketProcedure.expectedPrice
                      )
                    }}
                  </div>
                  <div>
                    {{
                      formatMoney(
                        ticketProcedureMapReturn[ticketProcedure.id].quantityReturn *
                          ticketProcedure.actualPrice
                      )
                    }}
                  </div>
                </td>
              </tr>
              ---
              <tr>
                <td colspan="4"></td>
                <td class="text-center font-bold">Ban Đầu</td>
                <td class="text-center font-bold">Hoàn trả</td>
                <td class="text-center font-bold">Sau Hoàn trả</td>
              </tr>
              <tr>
                <td colspan="4" class="text-right">Tiền sản phẩm</td>
                <td class="text-right">
                  <div
                    v-if="ticket.itemsDiscountProduct"
                    style="font-size: 13px; font-style: italic">
                    CK: {{ formatMoney(ticket.itemsDiscountProduct) }}
                  </div>
                  <div>
                    {{ formatMoney(ticket.productMoney) }}
                  </div>
                </td>
                <td class="text-right">
                  {{ formatMoney(ticket.productMoney - ticketUpdate.productMoney) }}
                </td>
                <td class="text-right">
                  <div
                    v-if="ticketUpdate.itemsDiscountProduct"
                    style="font-size: 13px; font-style: italic">
                    CK: {{ formatMoney(ticketUpdate.itemsDiscountProduct) }}
                  </div>
                  {{ formatMoney(ticketUpdate.productMoney) }}
                </td>
              </tr>
              <tr v-if="ticket.procedureMoney > 0">
                <td colspan="4" class="text-right">Tiền dịch vụ</td>
                <td class="text-right">
                  <div
                    v-if="ticket.itemsDiscountProcedure"
                    style="font-size: 13px; font-style: italic">
                    CK: {{ formatMoney(ticket.itemsDiscountProcedure) }}
                  </div>
                  <div>
                    {{ formatMoney(ticket.procedureMoney) }}
                  </div>
                </td>
                <td class="text-right">
                  {{ formatMoney(ticket.procedureMoney - ticketUpdate.procedureMoney) }}
                </td>
                <td class="text-right">
                  <div
                    v-if="ticketUpdate.itemsDiscountProcedure"
                    style="font-size: 13px; font-style: italic">
                    CK: {{ formatMoney(ticketUpdate.itemsDiscountProcedure) }}
                  </div>
                  {{ formatMoney(ticketUpdate.procedureMoney) }}
                </td>
              </tr>
              <tr v-if="ticket.discountMoney > 0">
                <td colspan="4" class="text-right">Tiền chiết khấu</td>
                <td class="text-right">
                  {{ formatMoney(ticket.discountMoney) }}
                </td>
                <td></td>
                <td class="text-right">
                  <div class="flex">
                    <InputMoney v-model:value="ticketUpdate.discountMoney" textAlign="right" />
                  </div>
                </td>
              </tr>

              <tr v-if="ticket.surcharge > 0">
                <td colspan="4" class="text-right">Tiền phụ phí</td>
                <td class="text-right">
                  {{ formatMoney(ticket.surcharge) }}
                </td>
                <td></td>
                <td class="text-right">
                  <div class="flex">
                    <InputMoney v-model:value="ticketUpdate.surcharge" textAlign="right" />
                  </div>
                </td>
              </tr>

              <tr>
                <td colspan="4" class="text-right">Tổng tiền</td>
                <td class="text-right">
                  {{ formatMoney(ticket.totalMoney) }}
                </td>
                <td class="text-right">
                  {{ formatMoney(ticket.totalMoney - ticketUpdate.totalMoney) }}
                </td>
                <td class="text-right">
                  {{ formatMoney(ticketUpdate.totalMoney) }}
                </td>
              </tr>
              <tr>
                <td colspan="4" class="text-right">
                  <span class="uppercase">Nợ</span>
                </td>
                <td class="text-right">
                  {{ formatMoney(ticket.debt) }}
                </td>
                <td class="text-right font-bold">
                  {{ formatMoney(ticket.debt - ticketUpdate.debt) }}
                </td>
                <td class="text-right">
                  <div class="flex">
                    <InputMoney
                      v-model:value="ticketUpdate.debt"
                      textAlign="right"
                      @update:value="handleUpdateTicketDebt" />
                  </div>
                </td>
              </tr>
              <tr>
                <td colspan="4" class="text-right">
                  <span class="uppercase">Tiền thanh toán</span>
                </td>
                <td class="text-right">
                  {{ formatMoney(ticket.paid) }}
                </td>
                <td class="text-right font-bold">
                  {{ formatMoney(ticket.paid - ticketUpdate.paid) }}
                </td>
                <td class="text-right">
                  <div class="flex">
                    <InputMoney
                      v-model:value="ticketUpdate.paid"
                      textAlign="right"
                      @update:value="handleUpdateTicketPaid" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pb-4 pt-8 flex justify-center gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Đóng lại</VueButton>
          <VueButton
            :disabled="!hasChangeData"
            color="blue"
            type="submit"
            :loading="returnLoading"
            icon="dollar">
            TRẢ HÀNG
          </VueButton>
        </div>
      </form>
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
