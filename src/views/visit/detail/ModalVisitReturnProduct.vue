<script setup lang="ts">
import { CloseOutlined, DollarOutlined } from '@ant-design/icons-vue'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VueModal from '../../../common/VueModal.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import type { Batch } from '../../../modules/batch'
import { VisitApi } from '../../../modules/visit/visit.api'
import type { Product } from '../../../modules/product'
import { arrayToKeyArray, timeToText } from '../../../utils'
import { visit } from './visit.ref'
import type { VisitProduct } from '../../../modules/visit-product'

const visitProductReturnList = ref<
  {
    visitProductId: number
    quantityReturn: number
    vpRoot: VisitProduct
  }[]
>([])

const visitBatchReturnListMap = ref<
  Record<
    string,
    {
      visitBatchId: number
      visitProductId: number
      quantityReturn: number
      quantity: number
      batch: Batch | undefined
    }[]
  >
>({})

const emit = defineEmits<{ (e: 'success'): void }>()

const screenStore = useScreenStore()
const { formatMoney } = screenStore

const showModal = ref(false)
const returnLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  visitProductReturnList.value = visit.value
    .visitProductList!.filter((i) => i.isSent)
    .map((i) => {
      return {
        visitProductId: i.id,
        quantityReturn: 0,
        vpRoot: i,
      }
    })
  const visitBatchReturnList = (visit.value.visitBatchList || []).map((i) => {
    return {
      visitBatchId: i.id,
      visitProductId: i.visitProductId,
      quantityReturn: 0,
      quantity: i.quantity,
      batch: i.batch,
    }
  })
  visitBatchReturnListMap.value = arrayToKeyArray(visitBatchReturnList, 'visitProductId')
}

const setReturnAllQuantity = () => {
  visitProductReturnList.value.forEach((i) => {
    i.quantityReturn = i.vpRoot.quantity
    visitBatchReturnListMap.value[i.visitProductId]?.forEach((j) => {
      j.quantityReturn = j.quantity
    })
  })
}

const updateVBatchReturnQuantity = (
  vProductReturnIndex: number,
  vBatchReturnIndex: number,
  quantityReturn: number
) => {
  const vProductReturn = visitProductReturnList.value[vProductReturnIndex]
  const vBatchReturnList = visitBatchReturnListMap.value[vProductReturn.visitProductId]

  vBatchReturnList[vBatchReturnIndex].quantityReturn = quantityReturn
  vProductReturn.quantityReturn = vBatchReturnList.reduce((a, b) => {
    return a + b.quantityReturn
  }, 0)
}

const updateVProductReturnQuantity = (vProductReturnIndex: number, quantityReturn: number) => {
  const vProductReturn = visitProductReturnList.value[vProductReturnIndex]
  vProductReturn.quantityReturn = quantityReturn

  let quantityRemain = quantityReturn
  visitBatchReturnListMap.value[vProductReturn.visitProductId]?.forEach((i) => {
    i.quantityReturn = Math.min(quantityRemain, i.quantity)
    quantityRemain = quantityRemain - i.quantityReturn
  })
}

const closeModal = () => {
  showModal.value = false
}

const validateQuantity = () => {
  for (let i = 0; i < visitProductReturnList.value.length; i++) {
    const vProductReturn = visitProductReturnList.value[i]
    const { product } = vProductReturn.vpRoot

    if (vProductReturn.quantityReturn > vProductReturn.vpRoot.quantity) {
      AlertStore.addError(`Sản phẩm ${product?.brandName} hoàn trả bị quá số lượng`)
      return false
    }

    const vBatchReturnList = visitBatchReturnListMap.value[vProductReturn.visitProductId]
    if (vBatchReturnList) {
      for (let j = 0; j < vBatchReturnList.length; j++) {
        const vBatchReturn = vBatchReturnList[j]
        const { batch } = vBatchReturn
        if (vBatchReturn.quantityReturn > vBatchReturn.quantity) {
          AlertStore.addError(
            `Sản phẩm ${product?.brandName}, ` +
              `lô hàng ${timeToText(batch?.expiryDate)} hoàn trả bị vượt quá số lượng`
          )
          return false
        }
      }
    }
  }
  return true
}

const startReturn = async () => {
  returnLoading.value = true
  try {
    if (!validateQuantity()) return

    await VisitApi.returnProductList({
      visitId: visit.value.id,
      visitProductReturnList: visitProductReturnList.value
        .filter((i) => i.quantityReturn > 0)
        .map((i) => {
          const costAmountReturn = Math.floor(
            (i.vpRoot.costAmount * i.quantityReturn) / (i.vpRoot.quantity || 1)
          )
          return {
            visitProductId: i.visitProductId,
            productId: i.vpRoot.productId,
            quantityReturn: i.quantityReturn,
            actualPrice: i.vpRoot.actualPrice,
            costAmountReturn,
            brandName: i.vpRoot.product?.brandName || '',
            hasManageQuantity: i.vpRoot.product!.hasManageQuantity,
            hasManageBatches: i.vpRoot.product!.hasManageBatches,
          }
        }),
      visitBatchReturnList: Object.values(visitBatchReturnListMap.value)
        .flat()
        .filter((i) => i.quantityReturn > 0)
        .map((i) => {
          return {
            visitBatchId: i.visitBatchId,
            visitProductId: i.visitProductId,
            productId: i.batch!.productId,
            batchId: i.batch!.id,
            quantityReturn: i.quantityReturn,
          }
        })
        .filter((j) => j.quantityReturn > 0),
    })
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalVisitReturn.vue:157 ~ startReturn ~ error:', error)
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
          Thông tin hoàn trả: {{ visit.customer?.fullName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <form class="p-4" @submit.prevent="startReturn">
        <div class="flex justify-between">
          <div></div>
          <div>
            <VueButton type="button" @click="setReturnAllQuantity">
              <span> Chọn tất cả số lượng </span>
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
              <tr v-if="visitProductReturnList?.length == 0">
                <td colspan="20" class="text-center">Chưa xuất thuốc</td>
              </tr>
              <tr
                v-for="(vProductReturn, vProductReturnIndex) in visitProductReturnList"
                :key="vProductReturn.visitProductId"
              >
                <td class="text-center">
                  {{ vProductReturnIndex + 1 }}
                </td>
                <td class="text-left">
                  <div style="font-weight: 500">{{ vProductReturn.vpRoot.product?.brandName }}</div>
                  <div v-if="vProductReturn.vpRoot.product?.substance" class="text-xs italic">
                    {{ vProductReturn.vpRoot.product.substance }}
                  </div>
                  <div v-if="visitBatchReturnListMap[vProductReturn.visitProductId]">
                    <div v-if="visitBatchReturnListMap[vProductReturn.visitProductId].length >= 2">
                      <a-popconfirm>
                        <template #cancelButton>
                          <div></div>
                        </template>
                        <template #okButton>
                          <div></div>
                        </template>
                        <template #title>
                          <div>
                            <span>
                              Chi tiết số lượng tính theo từng lô của sản phẩm
                              <span style="font-weight: 700">
                                {{ vProductReturn.vpRoot.product?.brandName }}
                              </span>
                            </span>
                          </div>
                          <div class="mt-2">
                            <table class="table-batch-select-quantity">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Số lô</th>
                                  <th>HSD</th>
                                  <th>Đ.Vị</th>
                                  <th>SL mua</th>
                                  <th>SL hoàn trả</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr
                                  v-for="(
                                    vBatchReturn, vBatchReturnIndex
                                  ) in visitBatchReturnListMap[vProductReturn.visitProductId]"
                                  :key="vBatchReturnIndex"
                                >
                                  <td class="text-center">{{ vBatchReturnIndex + 1 }}</td>
                                  <td>{{ vBatchReturn.batch?.lotNumber }}</td>
                                  <td>{{ timeToText(vBatchReturn.batch?.expiryDate) }}</td>
                                  <td>
                                    {{
                                      vProductReturn.vpRoot.product?.getUnitNameByRate(
                                        vProductReturn.vpRoot.unitRate
                                      )
                                    }}
                                  </td>
                                  <td
                                    class="text-center"
                                    :class="
                                      vBatchReturn.quantity < vBatchReturn.quantityReturn
                                        ? 'font-bold text-red-500'
                                        : ''
                                    "
                                  >
                                    {{ vBatchReturn!.quantity / vProductReturn.vpRoot.unitRate }}
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      :class="
                                        vBatchReturn.quantity < vBatchReturn.quantityReturn
                                          ? 'text-red-500'
                                          : ''
                                      "
                                      :value="
                                        vBatchReturn.quantityReturn / vProductReturn.vpRoot.unitRate
                                      "
                                      @input="
                                        (e) =>
                                          updateVBatchReturnQuantity(
                                            vProductReturnIndex,
                                            vBatchReturnIndex,
                                            Number((e.target as HTMLInputElement).value || 0) *
                                              vProductReturn.vpRoot.unitRate
                                          )
                                      "
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td colspan="5" class="text-right" style="font-weight: 500">
                                    Tổng hoàn trả
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      :value="
                                        vProductReturn.quantityReturn /
                                        vProductReturn.vpRoot.unitRate
                                      "
                                      @input="
                                        (e) =>
                                          updateVProductReturnQuantity(
                                            vProductReturnIndex,
                                            Number((e.target as HTMLInputElement)?.value || 0)
                                          )
                                      "
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </template>
                        <a class="text-xs italic underline">
                          {{ visitBatchReturnListMap[vProductReturn.visitProductId]?.length }} lô
                          hàng
                        </a>
                      </a-popconfirm>
                    </div>
                    <div
                      v-if="visitBatchReturnListMap[vProductReturn.visitProductId].length === 1"
                      class="text-xs italic"
                    >
                      Lô
                      {{
                        visitBatchReturnListMap[vProductReturn.visitProductId][0].batch?.lotNumber
                      }}
                      - HSD
                      {{
                        timeToText(
                          visitBatchReturnListMap[vProductReturn.visitProductId][0].batch
                            ?.expiryDate
                        )
                      }}
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  {{ vProductReturn.vpRoot.quantity / vProductReturn.vpRoot.unitRate }}
                </td>
                <td class="text-center">
                  {{ vProductReturn.vpRoot.product?.getUnitNameByRate(vProductReturn.vpRoot.unitRate) }}
                </td>
                <td class="text-center">
                  {{ formatMoney(vProductReturn.vpRoot.actualPrice * vProductReturn.vpRoot.unitRate) }}
                </td>
                <td class="text-right">
                  <input
                    type="number"
                    style="width: 120px"
                    :value="vProductReturn.quantityReturn / vProductReturn.vpRoot.unitRate"
                    min="0"
                    :max="vProductReturn.vpRoot.quantity / vProductReturn.vpRoot.unitRate"
                    @input="
                      (e) =>
                        updateVProductReturnQuantity(
                          vProductReturnIndex,
                          Number((e.target as HTMLInputElement).value || 0) *
                            vProductReturn.vpRoot.unitRate
                        )
                    "
                  />
                </td>
                <td class="text-right">
                  {{ formatMoney(vProductReturn.quantityReturn * vProductReturn.vpRoot.actualPrice) }}
                </td>
              </tr>
              <tr>
                <td colspan="6" class="text-right uppercase">Tổng tiền</td>
                <td class="text-right font-bold">
                  {{
                    formatMoney(
                      visitProductReturnList.reduce((acc, item) => {
                        return acc + item.quantityReturn * item.vpRoot.actualPrice
                      }, 0)
                    )
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pb-4 pt-8 flex justify-center gap-4">
          <button type="reset" class="btn" @click="closeModal"><CloseOutlined /> Đóng lại</button>
          <VueButton
            color="blue"
            type="submit"
            :loading="returnLoading"
            :disabled="visitProductReturnList.length === 0"
          >
            <DollarOutlined />
            <span> HOÀN TRẢ </span>
          </VueButton>
        </div>
      </form>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped>
table.table-batch-select-quantity {
  border: 1px solid #ccc;
  th {
    border: 1px solid #ccc;
    padding: 0.5rem;
  }
  td {
    border: 1px solid #ccc;
    padding: 0.5rem;
  }
}

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
