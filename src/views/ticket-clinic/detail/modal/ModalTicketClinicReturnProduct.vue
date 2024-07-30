<script setup lang="ts">
import { CloseOutlined, DollarOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { DeliveryStatus } from '../../../../modules/enum'
import { TicketClinicApi, ticketClinicRef } from '../../../../modules/ticket-clinic'
import type { TicketProduct } from '../../../../modules/ticket-product'
import { timeToText } from '../../../../utils'

const ticketProductReturnList = ref<
  {
    ticketProductId: number
    quantityReturn: number
    tpRoot: TicketProduct
  }[]
>([])

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const showModal = ref(false)
const returnLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  ticketProductReturnList.value = [
    ...(ticketClinicRef.value.ticketProductPrescriptionList || []),
    ...(ticketClinicRef.value.ticketProductConsumableList || []),
  ]
    .filter((i) => i.deliveryStatus === DeliveryStatus.Delivered)
    .map((i) => {
      return {
        ticketProductId: i.id,
        quantityReturn: 0,
        tpRoot: i,
      }
    })
}

const setReturnAllQuantity = () => {
  ticketProductReturnList.value.forEach((i) => {
    i.quantityReturn = i.tpRoot.quantity
  })
}

const handleChangeInputQuantityReturn = (e: Event, index: number) => {
  const quantityReturn = Number((e.target as HTMLInputElement).value || 0)
  ticketProductReturnList.value[index].quantityReturn = quantityReturn
}

const closeModal = () => {
  showModal.value = false
}

const validateQuantity = () => {
  for (let i = 0; i < ticketProductReturnList.value.length; i++) {
    const tpReturn = ticketProductReturnList.value[i]
    const { product } = tpReturn.tpRoot

    if (tpReturn.quantityReturn > tpReturn.tpRoot.quantity) {
      AlertStore.addError(`Sản phẩm ${product?.brandName} hoàn trả bị quá số lượng đã mua`)
      return false
    }
  }
  return true
}

const startReturnProduct = async () => {
  returnLoading.value = true
  try {
    if (!validateQuantity()) return

    await TicketClinicApi.returnProduct({
      ticketId: ticketClinicRef.value.id,
      returnList: ticketProductReturnList.value
        .filter((i) => i.quantityReturn > 0)
        .map((i) => {
          let itemCostAmount = 0
          if (i.tpRoot.batchId) {
            itemCostAmount = i.quantityReturn * i.tpRoot.batch!.costPrice
          } else {
            itemCostAmount = (i.tpRoot!.costAmount * i.quantityReturn) / (i.tpRoot!.quantity || 1)
          }
          const itemCostAmountFix = Math.floor(itemCostAmount / 10) * 10

          return {
            ticketProductId: i.ticketProductId,
            quantityReturn: i.quantityReturn,
            actualPrice: i.tpRoot.actualPrice,
            costAmountReturn: itemCostAmountFix,
          }
        }),
    })
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalVisitReturn.vue:98 ~ startReturnProduct ~ error:', error)
  } finally {
    returnLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 800px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          Thông tin hoàn trả: {{ ticketClinicRef.customer?.fullName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <form class="p-4" @submit.prevent="startReturnProduct">
        <div class="flex justify-between">
          <div></div>
          <div>
            <VueButton type="button" @click="setReturnAllQuantity">
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
                <th style="width: 150px">SL hoàn trả</th>
                <th style="width: 150px">T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="ticketProductReturnList?.length == 0">
                <td colspan="20" class="text-center">Chưa xuất thuốc</td>
              </tr>
              <tr
                v-for="(tpReturn, index) in ticketProductReturnList"
                :key="tpReturn.ticketProductId">
                <td class="text-center">{{ index + 1 }}</td>
                <td class="text-left">
                  <div style="font-weight: 500">{{ tpReturn.tpRoot.product?.brandName }}</div>
                  <div class="text-xs italic">{{ tpReturn.tpRoot.product?.substance || '' }}</div>
                  <div v-if="tpReturn.tpRoot.batchId" class="text-xs italic">
                    Lô {{ tpReturn.tpRoot.batch?.lotNumber }} - HSD
                    {{ timeToText(tpReturn.tpRoot.batch?.expiryDate) }}
                  </div>
                </td>
                <td class="text-center">
                  <div>{{ tpReturn.tpRoot.unitQuantity }}</div>
                  <div
                    v-if="tpReturn.tpRoot.quantityReturn"
                    style="font-size: 0.9em; font-style: italic">
                    Hoàn trả: {{ tpReturn.tpRoot.unitQuantityReturn }}
                  </div>
                </td>
                <td class="text-center">{{ tpReturn.tpRoot.unitName }}</td>
                <td class="text-right">{{ formatMoney(tpReturn.tpRoot.unitActualPrice) }}</td>
                <td class="text-right">
                  <input
                    type="number"
                    style="width: 120px"
                    :value="tpReturn.quantityReturn / tpReturn.tpRoot.unitRate"
                    min="0"
                    :max="tpReturn.tpRoot.quantity / tpReturn.tpRoot.unitRate"
                    @input="(e) => handleChangeInputQuantityReturn(e, index)" />
                </td>
                <td class="text-right">
                  {{ formatMoney(tpReturn.quantityReturn * tpReturn.tpRoot.actualPrice) }}
                </td>
              </tr>
              <tr>
                <td colspan="6" class="text-right uppercase">Tổng tiền</td>
                <td class="text-right font-bold">
                  {{
                    formatMoney(
                      ticketProductReturnList.reduce((acc, item) => {
                        return acc + item.quantityReturn * item.tpRoot.actualPrice
                      }, 0)
                    )
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pb-4 pt-8 flex justify-center gap-4">
          <VueButton type="reset" @click="closeModal">
            <CloseOutlined />
            Đóng lại
          </VueButton>
          <VueButton
            color="blue"
            type="submit"
            :loading="returnLoading"
            :disabled="ticketProductReturnList.length === 0">
            <DollarOutlined />
            <span>HOÀN TRẢ</span>
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
