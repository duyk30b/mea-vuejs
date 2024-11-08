<script setup lang="ts">
import { CloseOutlined } from '@ant-design/icons-vue'
import { computed, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputMoney } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { TicketStatus } from '../../../modules/ticket'
import { ticket } from './ticket-order-detail.ref'
import { TicketOrderApi } from '../../../modules/ticket-order'

const emit = defineEmits<{ (e: 'success'): any }>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const tpMapReturn = ref<
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
const discountMoneyUpdate = ref<number>(0)
const surchargeUpdate = ref<number>(0)

const showModal = ref(false)
const returnLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  ticket.value.ticketProductList = ticket.value.ticketProductList || []
  ticket.value.ticketProductList.forEach((i) => {
    tpMapReturn.value[i.id] = {
      ticketProductId: i.id,
      quantityReturn: 0,
      costAmountReturn: 0,
      actualPrice: i.actualPrice,
    }
  })
  discountMoneyUpdate.value = ticket.value.discountMoney
  surchargeUpdate.value = ticket.value.surcharge
}

const productsMoneyReturn = computed(() => {
  return Object.values(tpMapReturn.value).reduce((acc, item) => {
    return acc + item.quantityReturn * item.actualPrice
  }, 0)
})

const totalMoneyUpdate = computed(() => {
  return (
    ticket.value.totalMoney -
    productsMoneyReturn.value +
    ticket.value.discountMoney -
    ticket.value.surcharge -
    discountMoneyUpdate.value +
    surchargeUpdate.value
  )
})

const totalMoneyReturn = computed(() => {
  return ticket.value.totalMoney - totalMoneyUpdate.value
})

const debtReturn = computed(() => {
  return Math.min(totalMoneyReturn.value, ticket.value.debt)
})

const paidReturn = computed(() => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticket.value.ticketStatus)) {
    return totalMoneyReturn.value - debtReturn.value
  }
  return 0
})

const disableButton = computed(() => {
  return Object.values(tpMapReturn.value).every((i) => i.quantityReturn <= 0)
})

const setSelectAllQuantity = () => {
  ticket.value.ticketProductList!.forEach((i) => {
    tpMapReturn.value[i.id] = {
      ticketProductId: i.id,
      quantityReturn: i.quantity,
      costAmountReturn: i.costAmount,
      actualPrice: i.actualPrice,
    }
  })
}

const closeModal = () => {
  showModal.value = false
}

const reCalculatorAndValidateQuantity = () => {
  let result = true
  ticket.value.ticketProductList!.forEach((i) => {
    if (tpMapReturn.value[i.id]!.quantityReturn < 0) {
      result = false
      AlertStore.addError(`Số lượng của sản phẩm ${i.product?.brandName} không hợp lệ`)
    }
    if (tpMapReturn.value[i.id]!.quantityReturn > i.quantity) {
      result = false
      AlertStore.addError(`Sản phẩm ${i.product?.brandName} hoàn trả vượt quá số lượng mua`)
    }
    const costAmountReturn = Math.floor(
      (i.costAmount * tpMapReturn.value[i.id]!.quantityReturn) / (i.quantity || 1)
    )
    tpMapReturn.value[i.id]!.costAmountReturn = costAmountReturn
  })
  return result
}

const startReturnProduct = async () => {
  returnLoading.value = true
  try {
    if (!reCalculatorAndValidateQuantity()) return
    await TicketOrderApi.returnProduct({
      ticketId: ticket.value.id,
      returnList: Object.values(tpMapReturn.value).filter((i) => i.quantityReturn > 0),
      discountMoneyReturn: ticket.value.discountMoney - discountMoneyUpdate.value,
      surchargeReturn: ticket.value.surcharge - surchargeUpdate.value,
      debtReturn: debtReturn.value,
      paidReturn: paidReturn.value,
    })
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalVisitReturn.vue:157 ~ clickReturnProduct ~ error:', error)
  } finally {
    returnLoading.value = false
  }
}

const clickReturnProduct = async () => {
  if (totalMoneyUpdate.value < 0) {
    return AlertStore.addError('Số tiền trong đơn không được phép nhỏ hơn 0')
  }

  ModalStore.confirm({
    title: 'Bạn có chắc chắn mở lại hồ sơ của phiếu khám này ?',
    content: [
      '- Kho hàng sẽ nhập lại những sản phẩm trong danh sách trả',
      ...(debtReturn.value > 0 ? [`- Trừ nợ khách hàng: ${formatMoney(debtReturn.value)}`] : []),
      ...(paidReturn.value > 0
        ? [`- Khách hàng nhận lại số tiền đã thanh toán là: ${formatMoney(paidReturn.value)}`]
        : []),
    ],
    async onOk() {
      await startReturnProduct()
    },
    okText: 'Xác nhận TRẢ HÀNG',
  })
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
              <tr v-if="(ticket.ticketProductList || []).length == 0">
                <td colspan="20" class="text-center">Chưa xuất thuốc</td>
              </tr>
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
                <td class="text-right">{{ formatMoney(ticketProduct.unitActualPrice) }}</td>
                <td class="text-right">
                  <input
                    type="number"
                    style="width: 120px"
                    :value="tpMapReturn[ticketProduct.id].quantityReturn / ticketProduct.unitRate"
                    min="0"
                    :max="ticketProduct.quantity / ticketProduct.unitRate"
                    @input="
                      (e) =>
                        (tpMapReturn[ticketProduct.id].quantityReturn =
                          Number((e.target as HTMLInputElement).value || 0) *
                          ticketProduct.unitRate)
                    " />
                </td>
                <td class="text-right" style="padding-right: 20px">
                  {{
                    formatMoney(
                      tpMapReturn[ticketProduct.id].quantityReturn * ticketProduct.actualPrice
                    )
                  }}
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
                  {{ formatMoney(ticket.productsMoney) }}
                </td>
                <td class="text-right">
                  {{ formatMoney(productsMoneyReturn) }}
                </td>
                <td class="text-right">
                  {{ formatMoney(ticket.productsMoney - productsMoneyReturn) }}
                </td>
              </tr>
              <tr v-if="ticket.proceduresMoney > 0">
                <td colspan="4" class="text-right">Tiền dịch vụ</td>
                <td class="text-right">
                  {{ formatMoney(ticket.proceduresMoney) }}
                </td>
                <td></td>
                <td class="text-right">
                  {{ formatMoney(ticket.proceduresMoney) }}
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
                    <InputMoney v-model:value="discountMoneyUpdate" textAlign="right" />
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
                    <InputMoney v-model:value="surchargeUpdate" textAlign="right" />
                  </div>
                </td>
              </tr>

              <tr>
                <td colspan="4" class="text-right">Tổng tiền</td>
                <td class="text-right">
                  {{ formatMoney(ticket.totalMoney) }}
                </td>
                <td class="text-right">
                  {{ formatMoney(totalMoneyReturn) }}
                </td>
                <td class="text-right">
                  {{ formatMoney(totalMoneyUpdate) }}
                </td>
              </tr>
              <tr v-if="ticket.debt > 0">
                <td colspan="4" class="text-right">
                  <span class="uppercase">Nợ</span>
                </td>
                <td class="text-right">
                  {{ formatMoney(ticket.debt) }}
                </td>
                <td class="text-right font-bold">
                  {{ formatMoney(debtReturn) }}
                </td>
                <td class="text-right">
                  {{ formatMoney(ticket.debt - debtReturn) }}
                </td>
              </tr>
              <tr v-if="ticket.debt > 0">
                <td colspan="4" class="text-right">
                  <span class="uppercase">Tiền thanh toán</span>
                </td>
                <td class="text-right">
                  {{ formatMoney(ticket.paid) }}
                </td>
                <td class="text-right font-bold">
                  {{ formatMoney(paidReturn) }}
                </td>
                <td class="text-right">
                  {{ formatMoney(ticket.paid - paidReturn) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pb-4 pt-8 flex justify-center gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Đóng lại</VueButton>
          <VueButton
            :disabled="disableButton"
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
