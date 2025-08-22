<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Ticket, TicketActionApi } from '@/modules/ticket'
import { TicketBatch, TicketBatchApi } from '@/modules/ticket-batch'
import { ESTimer } from '@/utils'
import { ref } from 'vue'

const ticket = ref<Ticket>(Ticket.blank())

const tbReturnList = ref<
  {
    ticketBatchId: number
    quantityReturn: number
    tbRoot: TicketBatch
  }[]
>([])

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const showModal = ref(false)
const dataLoading = ref(false)
const returnLoading = ref(false)

const openModal = async (ticketProp: Ticket) => {
  showModal.value = true
  ticket.value = Ticket.from(ticketProp)

  try {
    dataLoading.value = true
    const ticketBatchOriginList = await TicketBatchApi.list({
      filter: { ticketId: ticketProp.id },
      relation: { batch: true, product: true },
      sort: { ticketProductId: 'ASC' },
    })
    tbReturnList.value = ticketBatchOriginList.map((i) => {
      return {
        ticketBatchId: i.id,
        quantityReturn: 0,
        tbRoot: i,
      }
    })
  } catch (error) {
    console.log('🚀 ~ ModalTicketReturnProduct.vue:51 ~ openModal ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const setReturnAllQuantity = () => {
  tbReturnList.value.forEach((i) => {
    i.quantityReturn = i.tbRoot.quantity
  })
}

const handleChangeInputQuantityReturn = (e: Event, index: number) => {
  const quantityReturn = Number((e.target as HTMLInputElement).value || 0)
  tbReturnList.value[index].quantityReturn = quantityReturn
}

const closeModal = () => {
  showModal.value = false
  tbReturnList.value = []
  ticket.value = Ticket.blank()
}

const validateQuantity = () => {
  for (let i = 0; i < tbReturnList.value.length; i++) {
    const tbReturn = tbReturnList.value[i]
    const { product } = tbReturn.tbRoot

    if (tbReturn.quantityReturn > tbReturn.tbRoot.quantity) {
      AlertStore.addError(`Lỗi: Sản phẩm ${product?.brandName} hoàn trả bị quá số lượng đã mua`)
      return false
    }
  }
  return true
}

const startReturnProduct = async () => {
  returnLoading.value = true
  if (!validateQuantity()) return
  if (!tbReturnList.value.filter((i) => i.quantityReturn > 0).length) {
    returnLoading.value = false
    return AlertStore.addError('Chưa chọn số lượng hoàn trả')
  }
  try {
    const tbReturnListConvert = tbReturnList.value
      .filter((i) => i.quantityReturn > 0)
      .map((i) => {
        return {
          ticketBatchId: i.ticketBatchId,
          quantityReturn: i.quantityReturn,
        }
      })

    await TicketActionApi.returnProduct({
      ticketId: ticket.value.id,
      returnList: tbReturnListConvert,
    })

    emit('success')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalVisitReturn.vue:90 ~ startReturnProduct ~ error:', error)
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
          Thông tin hoàn trả: {{ ticket.customer?.fullName || '' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
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
              <tr v-if="tbReturnList?.length == 0">
                <td colspan="20" class="text-center">Chưa xuất thuốc</td>
              </tr>
              <tr v-for="(tbReturn, index) in tbReturnList" :key="tbReturn.ticketBatchId">
                <td class="text-center">{{ index + 1 }}</td>
                <td class="text-left">
                  <div style="font-weight: 500">{{ tbReturn.tbRoot.product?.brandName }}</div>
                  <div class="text-xs italic">{{ tbReturn.tbRoot.product?.substance || '' }}</div>
                  <div v-if="tbReturn.tbRoot.batchId" class="text-xs italic">
                    <span v-if="tbReturn.tbRoot.batch?.lotNumber">
                      Lô {{ tbReturn.tbRoot.batch?.lotNumber }}
                    </span>
                    <span v-if="tbReturn.tbRoot.batch?.expiryDate">
                      - HSD {{ ESTimer.timeToText(tbReturn.tbRoot.batch?.expiryDate) }}
                    </span>
                  </div>
                </td>
                <td class="text-center">
                  <div>{{ tbReturn.tbRoot.unitQuantity }}</div>
                </td>
                <td class="text-center">{{ tbReturn.tbRoot.unitName }}</td>
                <td class="text-right">{{ formatMoney(tbReturn.tbRoot.unitActualPrice) }}</td>
                <td class="text-right">
                  <input
                    type="number"
                    style="width: 120px"
                    :value="tbReturn.quantityReturn / tbReturn.tbRoot.unitRate"
                    min="0"
                    :max="tbReturn.tbRoot.quantity / tbReturn.tbRoot.unitRate"
                    @input="(e) => handleChangeInputQuantityReturn(e, index)"
                  />
                </td>
                <td class="text-right">
                  {{ formatMoney(tbReturn.quantityReturn * tbReturn.tbRoot.actualPrice) }}
                </td>
              </tr>
              <tr>
                <td colspan="6" class="text-right uppercase">Tổng tiền</td>
                <td class="text-right font-bold">
                  {{
                    formatMoney(
                      tbReturnList.reduce((acc, item) => {
                        return acc + item.quantityReturn * item.tbRoot.actualPrice
                      }, 0),
                    )
                  }}
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
            icon="dollar"
            :loading="returnLoading"
            :disabled="tbReturnList.length === 0"
          >
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
