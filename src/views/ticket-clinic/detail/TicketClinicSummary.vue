<script lang="ts" setup>
import { FileSyncOutlined, MoreOutlined } from '@ant-design/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconFileSearch } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputNumber } from '../../../common/vue-form'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DeliveryStatus, DiscountType, PaymentViewType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { PrintHtmlService } from '../../../modules/print-html'
import {
  ticketClinicPrintInvoice,
  ticketClinicPrintInvoiceTemplate,
} from '../../../modules/print-html/print-content/ticket-clinic-print-invoice'
import { TicketStatus } from '../../../modules/ticket'
import { TicketClinicApi, ticketClinicRef } from '../../../modules/ticket-clinic'
import { TicketProcedure } from '../../../modules/ticket-procedure'
import { TicketProduct } from '../../../modules/ticket-product'
import { TicketRadiology } from '../../../modules/ticket-radiology'
import { timeToText } from '../../../utils'
import ModalProcedureDetail from '../../procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import ModalRadiologyDetail from '../../radiology/detail/ModalRadiologyDetail.vue'
import ModalTicketClinicPayment from './modal/ModalTicketClinicPayment.vue'
import ModalTicketClinicReturnProduct from './modal/ModalTicketClinicReturnProduct.vue'

const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalTicketClinicReturnProduct = ref<InstanceType<typeof ModalTicketClinicReturnProduct>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalRadiologyDetail = ref<InstanceType<typeof ModalRadiologyDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const ticketProductConsumableList = ref<TicketProduct[]>([])
const ticketProductPrescriptionList = ref<TicketProduct[]>([])
const ticketProcedureList = ref<TicketProcedure[]>([])
const ticketRadiologyList = ref<TicketRadiology[]>([])

const saveLoading = ref(false)
const sendProductLoading = ref(false)

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicSummary.vue:46 ~ onMounted')
})

watch(
  () => ticketClinicRef.value.ticketProductConsumableList,
  (newValue, oldValue) => {
    ticketProductConsumableList.value = TicketProduct.fromList(newValue || [])
  },
  { immediate: true }
)

watch(
  () => ticketClinicRef.value.ticketProductPrescriptionList,
  (newValue, oldValue) => {
    ticketProductPrescriptionList.value = TicketProduct.fromList(newValue || [])
  },
  { immediate: true }
)
watch(
  () => ticketClinicRef.value.ticketProcedureList,
  (newValue, oldValue) => {
    ticketProcedureList.value = TicketProcedure.fromList(newValue || [])
  },
  { immediate: true }
)
watch(
  () => ticketClinicRef.value.ticketRadiologyList,
  (newValue, oldValue) => {
    ticketRadiologyList.value = TicketRadiology.fromList(newValue || [])
  },
  { immediate: true }
)

const prescriptionMoney = computed(() => {
  return ticketProductPrescriptionList.value.reduce((acc, item) => {
    return acc + item.actualPrice * item.quantity
  }, 0)
})

const consumableMoney = computed(() => {
  return ticketProductConsumableList.value.reduce((acc, item) => {
    return acc + item.actualPrice * item.quantity
  }, 0)
})

const proceduresMoney = computed(() => {
  return ticketProcedureList.value.reduce((acc, item) => {
    return acc + item.actualPrice * item.quantity
  }, 0)
})

const radiologyMoney = computed(() => {
  return ticketRadiologyList.value.reduce((acc, item) => {
    return acc + item.actualPrice
  }, 0)
})

const disabledSave = computed(() => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)) {
    return true
  }
  if (
    !TicketProduct.equalList(
      ticketProductPrescriptionList.value,
      ticketClinicRef.value.ticketProductPrescriptionList || []
    )
  ) {
    return false
  }
  if (
    !TicketProduct.equalList(
      ticketProductConsumableList.value,
      ticketClinicRef.value.ticketProductConsumableList || []
    )
  ) {
    return false
  }
  if (
    !TicketProcedure.equalList(
      ticketProcedureList.value,
      ticketClinicRef.value.ticketProcedureList || []
    )
  ) {
    return false
  }
  if (
    !TicketRadiology.equalList(
      ticketRadiologyList.value,
      ticketClinicRef.value.ticketRadiologyList || []
    )
  ) {
    return false
  }

  return true
})

const disableSendProduct = computed(() => {
  if (ticketClinicRef.value.ticketStatus !== TicketStatus.Executing) {
    return true
  }
  if (ticketClinicRef.value.deliveryStatus !== DeliveryStatus.Pending) {
    return true
  }
  if (
    !TicketProduct.equalList(
      ticketProductPrescriptionList.value,
      ticketClinicRef.value.ticketProductPrescriptionList || []
    )
  ) {
    return true
  }
  if (
    !TicketProduct.equalList(
      ticketProductConsumableList.value,
      ticketClinicRef.value.ticketProductConsumableList || []
    )
  ) {
    return true
  }
  return false
})

const handleChangeTicketProcedureDiscountMoney = (discountMoney: number, index: number) => {
  const expectedPrice = ticketProcedureList.value[index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  ticketProcedureList.value[index].discountMoney = discountMoney
  ticketProcedureList.value[index].discountPercent = discountPercent
  ticketProcedureList.value[index].actualPrice = actualPrice
  ticketProcedureList.value[index].discountType = DiscountType.VND
}

const handleChangeTicketProcedureDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = ticketProcedureList.value[index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  ticketProcedureList.value[index].discountPercent = discountPercent
  ticketProcedureList.value[index].discountMoney = discountMoney
  ticketProcedureList.value[index].actualPrice = actualPrice
  ticketProcedureList.value[index].discountType = DiscountType.Percent
}

const handleChangeTicketProductPrescriptionDiscountMoney = (data: number, index: number) => {
  const expectedPrice = ticketProductPrescriptionList.value[index].expectedPrice || 0
  const discountMoney = data / ticketProductPrescriptionList.value[index].unitRate
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  ticketProductPrescriptionList.value[index].discountMoney = discountMoney
  ticketProductPrescriptionList.value[index].discountPercent = discountPercent
  ticketProductPrescriptionList.value[index].actualPrice = actualPrice
  ticketProductPrescriptionList.value[index].discountType = DiscountType.VND
}

const handleChangeTicketProductPrescriptionDiscountPercent = (
  discountPercent: number,
  index: number
) => {
  const expectedPrice = ticketProductPrescriptionList.value[index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  ticketProductPrescriptionList.value[index].discountPercent = discountPercent
  ticketProductPrescriptionList.value[index].discountMoney = discountMoney
  ticketProductPrescriptionList.value[index].actualPrice = actualPrice
  ticketProductPrescriptionList.value[index].discountType = DiscountType.Percent
}

const handleChangeTicketProductConsumableDiscountMoney = (data: number, index: number) => {
  const expectedPrice = ticketProductConsumableList.value[index].expectedPrice || 0
  const discountMoney = data / ticketProductConsumableList.value[index].unitRate
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  ticketProductConsumableList.value[index].discountMoney = discountMoney
  ticketProductConsumableList.value[index].discountPercent = discountPercent
  ticketProductConsumableList.value[index].actualPrice = actualPrice
  ticketProductConsumableList.value[index].discountType = DiscountType.VND
}

const handleChangeTicketProductConsumableDiscountPercent = (
  discountPercent: number,
  index: number
) => {
  const expectedPrice = ticketProductConsumableList.value[index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  ticketProductConsumableList.value[index].discountPercent = discountPercent
  ticketProductConsumableList.value[index].discountMoney = discountMoney
  ticketProductConsumableList.value[index].actualPrice = actualPrice
  ticketProductConsumableList.value[index].discountType = DiscountType.Percent
}

const handleChangeTicketRadiologyDiscountMoney = (discountMoney: number, index: number) => {
  const expectedPrice = ticketRadiologyList.value[index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  ticketRadiologyList.value[index].discountMoney = discountMoney
  ticketRadiologyList.value[index].discountPercent = discountPercent
  ticketRadiologyList.value[index].actualPrice = actualPrice
  ticketRadiologyList.value[index].discountType = DiscountType.VND
}

const handleChangeTicketRadiologyDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = ticketRadiologyList.value[index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  ticketRadiologyList.value[index].discountPercent = discountPercent
  ticketRadiologyList.value[index].discountMoney = discountMoney
  ticketRadiologyList.value[index].actualPrice = actualPrice
  ticketRadiologyList.value[index].discountType = DiscountType.Percent
}

const updateTicketProductConsumableQuantity = (index: number, unitQuantity: number) => {
  const ticketProductCurrent = ticketProductConsumableList.value[index]

  ticketProductCurrent.unitQuantity = unitQuantity

  // tính costAmount
  let itemCostAmount = 0
  if (ticketProductCurrent.batchId) {
    itemCostAmount = ticketProductCurrent.quantity * ticketProductCurrent.batch!.costPrice
  } else if (ticketProductCurrent.product!.quantity <= 0) {
    itemCostAmount = (ticketProductCurrent.product?.costPrice || 0) * ticketProductCurrent.quantity
  } else {
    itemCostAmount =
      (ticketProductCurrent.product!.costAmount * ticketProductCurrent.quantity) /
      ticketProductCurrent.product!.quantity
  }
  const itemCostAmountFix = Math.floor(itemCostAmount / 10) * 10

  ticketProductCurrent.costAmount = itemCostAmountFix
}

const updateTicketProductPrescriptionQuantity = (index: number, unitQuantity: number) => {
  const ticketProductCurrent = ticketProductPrescriptionList.value[index]

  ticketProductCurrent.unitQuantity = unitQuantity

  // tính costAmount
  let itemCostAmount = 0
  if (ticketProductCurrent.batchId) {
    itemCostAmount = ticketProductCurrent.quantity * ticketProductCurrent.batch!.costPrice
  } else if (ticketProductCurrent.product!.quantity <= 0) {
    itemCostAmount = (ticketProductCurrent.product?.costPrice || 0) * ticketProductCurrent.quantity
  } else {
    itemCostAmount =
      (ticketProductCurrent.product!.costAmount * ticketProductCurrent.quantity) /
      ticketProductCurrent.product!.quantity
  }
  const itemCostAmountFix = Math.floor(itemCostAmount / 10) * 10

  ticketProductCurrent.costAmount = itemCostAmountFix
}

const saveTicketItemsMoney = async () => {
  saveLoading.value = true
  try {
    const prescriptionChangeList = ticketProductPrescriptionList.value.filter((item, index) => {
      return !TicketProduct.equal(item, ticketClinicRef.value.ticketProductPrescriptionList![index])
    })
    const consumableChangeList = ticketProductConsumableList.value.filter((item, index) => {
      return !TicketProduct.equal(item, ticketClinicRef.value.ticketProductConsumableList![index])
    })

    await TicketClinicApi.updateItemsMoney({
      ticketId: ticketClinicRef.value.id,
      ticketProductList: [...prescriptionChangeList, ...consumableChangeList],
      ticketProcedureList: ticketProcedureList.value.filter((item, index) => {
        return !TicketProcedure.equal(item, ticketClinicRef.value.ticketProcedureList![index])
      }),
      ticketRadiologyList: ticketRadiologyList.value.filter((item, index) => {
        return !TicketRadiology.equal(item, ticketClinicRef.value.ticketRadiologyList![index])
      }),
    })
  } catch (e) {
    console.log('🚀 ~ file: TicketClinicSummary.vue:321 ~ saveTicketItemsMoney ~ e:', e)
  } finally {
    saveLoading.value = false
  }
}

const validateQuantity = () => {
  if (settingStore.SYSTEM_SETTING.allowNegativeQuantity) {
    return true
  }

  const ticketProductUnsentList = [
    ...ticketProductConsumableList.value,
    ...ticketProductPrescriptionList.value,
  ].filter((i) => {
    return i.deliveryStatus === DeliveryStatus.Pending
  })

  for (let i = 0; i < ticketProductUnsentList.length; i++) {
    const ticketProductUnsent = ticketProductUnsentList[i]
    const { product, batch } = ticketProductUnsent

    if (!product?.hasManageQuantity) continue

    if (ticketProductUnsent.quantity > (product?.quantity || 0)) {
      AlertStore.addError(
        `Sản phẩm ${product?.brandName} không đủ ` +
          `(tồn ${product?.quantity || 0} - lấy ${ticketProductUnsent.quantity})`
      )
      return false
    }

    if (product?.hasManageBatches) {
      if (ticketProductUnsent.quantity > (batch?.quantity || 0)) {
        AlertStore.addError(
          `Lô hàng ${timeToText(batch!.expiryDate)} của Sản phẩm ${product?.brandName} ` +
            `không đủ (tồn ${batch!.quantity} - lấy ${ticketProductUnsent.quantity})`
        )
        return false
      }
    }
  }
  return true
}

const startSendProduct = async () => {
  sendProductLoading.value = true
  try {
    if (!validateQuantity()) return
    await TicketClinicApi.sendProduct({ ticketId: ticketClinicRef.value.id })
  } catch (error) {
    console.log('🚀 ~ file: VisitPayment.vue:301 ~ startSendProduct ~ error:', error)
  } finally {
    sendProductLoading.value = false
  }
}

const startReopenVisit = async () => {
  await TicketClinicApi.reopen(ticketClinicRef.value.id)
}

const clickReopenVisit = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn mở lại hồ sơ của phiếu khám này ?',
    content: [
      ...(ticketClinicRef.value.debt > 0
        ? [
            `- Số tiền nợ sẽ được hoàn trả, khi đóng hồ sơ lại sẽ ghi nợ trở lại`,
            `- Trừ nợ khách hàng: ${formatMoney(ticketClinicRef.value.debt)}`,
          ]
        : ['- Hồ sơ này sẽ quay lại trạng thái: "Đang khám"']),
    ],
    async onOk() {
      await startReopenVisit()
    },
  })
}

const handleMenuActionClick = (menu: { key: string }) => {
  if (menu.key === 'RETURN_PRODUCT_LIST') {
    if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)) {
      return ModalStore.alert({
        title: 'Trạng thái hồ sơ không hợp lệ ?',
        content: 'Cần mở lại hồ sơ trước khi hoàn trả',
      })
    } else {
      modalTicketClinicReturnProduct.value?.openModal()
    }
  }
  if (menu.key === 'REOPEN_VISIT') {
    clickReopenVisit()
  }
}

const startPrint = async () => {
  try {
    // const response = await fetch('/template/visit-invoice.hbs')
    // const templateHtml = await response.text()

    // const templateCompile = Handlebars.compile(templateHtml)
    // const content = templateCompile({
    //   organization: meStore.organization,
    //   visit: ticketClinicRef.value,
    // })

    const printHtml = await PrintHtmlService.getOneByKey('INVOICE')
    let content = ''
    if (printHtml) {
      content = ticketClinicPrintInvoiceTemplate(ticketClinicRef.value, printHtml.content)
    } else {
      content = ticketClinicPrintInvoice(ticketClinicRef.value)
    }

    const iframePrint = document.getElementById('iframe-print') as HTMLIFrameElement
    const pri = iframePrint.contentWindow as Window
    pri.document.open()
    pri.document.write(content)
    pri.document.close()
    pri.focus()
    pri.print()
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:421 ~ startPrint ~ error:', error)
  }
}
</script>
<template>
  <ModalTicketClinicPayment ref="modalTicketClinicPayment" />
  <ModalTicketClinicReturnProduct ref="modalTicketClinicReturnProduct" />
  <ModalProductDetail ref="modalProductDetail" />
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalRadiologyDetail ref="modalRadiologyDetail" />
  <div class="mt-4 flex gap-4">
    <VueButton
      class="ml-auto"
      color="green"
      :disabled="disableSendProduct"
      :loading="sendProductLoading"
      icon="send"
      @click="startSendProduct">
      <span class="font-bold">XUẤT THUỐC - VẬT TƯ</span>
    </VueButton>
    <VueButton
      v-if="
        [TicketStatus.Approved, TicketStatus.Executing].includes(ticketClinicRef.ticketStatus) &&
        ticketClinicRef.paid > ticketClinicRef.totalMoney
      "
      icon="dollar"
      size="small"
      color="green"
      @click="modalTicketClinicPayment?.openModal(PaymentViewType.RefundOverpaid)">
      <span class="font-bold">HOÀN TIỀN</span>
    </VueButton>
    <div class="flex items-center">
      <a-dropdown>
        <template #overlay>
          <a-menu @click="handleMenuActionClick">
            <a-menu-item key="RETURN_PRODUCT_LIST">
              <span class="text-red-500">
                <FileSyncOutlined class="mr-2" />
                Hoàn trả thuốc - vật tư
              </span>
            </a-menu-item>
            <a-menu-item
              v-if="
                [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.ticketStatus)
              "
              key="REOPEN_VISIT">
              <span class="text-red-500">
                <FileSyncOutlined class="mr-2" />
                Mở lại phiếu khám
              </span>
            </a-menu-item>
          </a-menu>
        </template>
        <a-button shape="circle">
          <template #icon>
            <MoreOutlined style="font-size: 1.2rem; font-weight: bold" />
          </template>
        </a-button>
      </a-dropdown>
    </div>
  </div>
  <div class="mt-4 table-wrapper">
    <table>
      <template v-if="ticketProductPrescriptionList.length">
        <thead>
          <tr>
            <th>#</th>
            <th>THUỐC</th>
            <th>Đ.Vị</th>
            <th>SL kê</th>
            <th>SL mua</th>
            <th>Giá</th>
            <th>Chiết khấu</th>
            <th>Tổng tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(tpPrescription, tpPrescriptionIndex) in ticketProductPrescriptionList"
            :key="tpPrescription.id + '_' + tpPrescriptionIndex">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ tpPrescriptionIndex + 1 }}
            </td>
            <td>
              <div class="flex items-center gap-1" style="font-weight: 500">
                <span>{{ tpPrescription.product?.brandName }}</span>
                <a
                  style="line-height: 0"
                  @click="modalProductDetail?.openModal(tpPrescription.product!)">
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="tpPrescription.product?.substance" class="text-xs italic">
                {{ tpPrescription.product.substance }}
              </div>
              <div v-if="tpPrescription.batchId" class="text-xs italic">
                Lô {{ tpPrescription.batch?.lotNumber }} - HSD
                {{ timeToText(tpPrescription.batch?.expiryDate) }}
              </div>
            </td>
            <td class="text-center">{{ tpPrescription.unitName }}</td>
            <td class="text-center">{{ tpPrescription.unitQuantityPrescription }}</td>
            <td class="text-center" style="width: 150px">
              <div
                v-if="
                  tpPrescription.deliveryStatus === DeliveryStatus.Delivered ||
                  [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.ticketStatus)
                "
                class="text-center">
                {{ tpPrescription.unitQuantity }}
              </div>
              <div v-else class="flex items-center justify-between">
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="tpPrescription.quantity <= 0"
                  @click="
                    updateTicketProductPrescriptionQuantity(
                      tpPrescriptionIndex,
                      tpPrescription.unitQuantity - 1
                    )
                  ">
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber
                    :value="tpPrescription.unitQuantity"
                    textAlign="right"
                    @update:value="
                      (value) => updateTicketProductPrescriptionQuantity(tpPrescriptionIndex, value)
                    " />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  @click="
                    updateTicketProductPrescriptionQuantity(
                      tpPrescriptionIndex,
                      tpPrescription.unitQuantity + 1
                    )
                  ">
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </button>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              <div v-if="tpPrescription.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(tpPrescription.unitExpectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(tpPrescription.unitActualPrice) }}</div>
            </td>
            <td class="text-center" style="width: 40px">
              <a-popconfirm>
                <template #cancelButton>
                  <div></div>
                </template>
                <template #okButton>
                  <div></div>
                </template>
                <template #title>
                  <div>
                    Chiết khấu (Tiền hàng:
                    <b>
                      {{ formatMoney(tpPrescription.unitExpectedPrice) }}
                    </b>
                    )
                  </div>
                  <div class="mt-2">
                    <div>
                      <InputNumber
                        :value="tpPrescription.unitDiscountMoney"
                        :disabled="
                          tpPrescription.deliveryStatus === DeliveryStatus.Delivered ||
                          [TicketStatus.Debt, TicketStatus.Completed].includes(
                            ticketClinicRef.ticketStatus
                          )
                        "
                        append="VNĐ"
                        @update:value="
                          (e: number) =>
                            handleChangeTicketProductPrescriptionDiscountMoney(
                              e,
                              tpPrescriptionIndex
                            )
                        " />
                    </div>
                    <div class="mt-2">
                      <div class="w-full">
                        <InputNumber
                          :value="tpPrescription.discountPercent"
                          append="%"
                          :disabled="
                            tpPrescription.deliveryStatus === DeliveryStatus.Delivered ||
                            [TicketStatus.Debt, TicketStatus.Completed].includes(
                              ticketClinicRef.ticketStatus
                            )
                          "
                          @update:value="
                            (e: number) =>
                              handleChangeTicketProductPrescriptionDiscountPercent(
                                e,
                                tpPrescriptionIndex
                              )
                          " />
                      </div>
                    </div>
                  </div>
                </template>
                <a-tag
                  v-if="tpPrescription.discountType === 'VNĐ'"
                  color="success"
                  style="cursor: pointer">
                  {{ formatMoney(tpPrescription.unitDiscountMoney) }}
                </a-tag>
                <a-tag
                  v-if="tpPrescription.discountType === '%'"
                  color="success"
                  style="cursor: pointer">
                  {{ tpPrescription.discountPercent || 0 }}%
                </a-tag>
              </a-popconfirm>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(tpPrescription.actualPrice * tpPrescription.quantity) }}
            </td>
          </tr>
          <tr>
            <td class="uppercase text-right" colspan="7">Tiền thuốc</td>
            <td class="font-bold text-right whitespace-nowrap">
              {{ formatMoney(prescriptionMoney) }}
            </td>
          </tr>
        </tbody>
      </template>
      <template v-if="ticketProductConsumableList.length">
        <thead>
          <tr>
            <th>#</th>
            <th colspan="2">VẬT TƯ</th>
            <th>Đ.Vị</th>
            <th>SL</th>
            <th>Giá</th>
            <th>Chiết khấu</th>
            <th>Tổng tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(tpConsumable, tpConsumableIndex) in ticketProductConsumableList"
            :key="tpConsumable.id + '_' + tpConsumableIndex">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ tpConsumableIndex + 1 }}
            </td>
            <td colspan="2">
              <div class="flex items-center gap-1" style="font-weight: 500">
                <span>{{ tpConsumable.product?.brandName }}</span>
                <a
                  style="line-height: 0"
                  @click="modalProductDetail?.openModal(tpConsumable.product!)">
                  <IconFileSearch />
                </a>
              </div>
              <div v-if="tpConsumable.product?.substance" class="text-xs italic">
                {{ tpConsumable.product.substance }}
              </div>
              <div v-if="tpConsumable.batchId" class="text-xs italic">
                Lô {{ tpConsumable.batch?.lotNumber }} - HSD
                {{ timeToText(tpConsumable.batch?.expiryDate) }}
              </div>
            </td>
            <td class="text-center">{{ tpConsumable.unitName }}</td>
            <td class="text-center" style="width: 150px">
              <div
                v-if="
                  tpConsumable.deliveryStatus === DeliveryStatus.Delivered ||
                  [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.ticketStatus)
                "
                class="text-center">
                {{ tpConsumable.unitQuantity }}
              </div>
              <div v-else class="flex items-center justify-between">
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="tpConsumable.quantity <= 0"
                  @click="
                    updateTicketProductConsumableQuantity(
                      tpConsumableIndex,
                      tpConsumable.unitQuantity - 1
                    )
                  ">
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber
                    :value="tpConsumable.unitQuantity"
                    textAlign="right"
                    @update:value="
                      (value) => updateTicketProductConsumableQuantity(tpConsumableIndex, value)
                    " />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  @click="
                    updateTicketProductConsumableQuantity(
                      tpConsumableIndex,
                      tpConsumable.unitQuantity + 1
                    )
                  ">
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </button>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              <div v-if="tpConsumable.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(tpConsumable.unitExpectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(tpConsumable.unitActualPrice) }}</div>
            </td>
            <td class="text-center" style="width: 40px">
              <a-popconfirm>
                <template #cancelButton>
                  <div></div>
                </template>
                <template #okButton>
                  <div></div>
                </template>
                <template #title>
                  <div>
                    Chiết khấu (Tiền hàng:
                    <b>
                      {{ formatMoney(tpConsumable.unitExpectedPrice) }}
                    </b>
                    )
                  </div>
                  <div class="mt-2">
                    <div>
                      <InputNumber
                        :value="tpConsumable.unitDiscountMoney"
                        :disabled="
                          tpConsumable.deliveryStatus === DeliveryStatus.Delivered ||
                          [TicketStatus.Debt, TicketStatus.Completed].includes(
                            ticketClinicRef.ticketStatus
                          )
                        "
                        append="VNĐ"
                        @update:value="
                          (e: number) =>
                            handleChangeTicketProductConsumableDiscountMoney(e, tpConsumableIndex)
                        " />
                    </div>
                    <div class="mt-2">
                      <div class="w-full">
                        <InputNumber
                          :value="tpConsumable.discountPercent"
                          append="%"
                          :disabled="
                            tpConsumable.deliveryStatus === DeliveryStatus.Delivered ||
                            [TicketStatus.Debt, TicketStatus.Completed].includes(
                              ticketClinicRef.ticketStatus
                            )
                          "
                          @update:value="
                            (e: number) =>
                              handleChangeTicketProductConsumableDiscountPercent(
                                e,
                                tpConsumableIndex
                              )
                          " />
                      </div>
                    </div>
                  </div>
                </template>
                <a-tag
                  v-if="tpConsumable.discountType === 'VNĐ'"
                  color="success"
                  style="cursor: pointer">
                  {{ formatMoney(tpConsumable.unitDiscountMoney) }}
                </a-tag>
                <a-tag
                  v-if="tpConsumable.discountType === '%'"
                  color="success"
                  style="cursor: pointer">
                  {{ tpConsumable.discountPercent || 0 }}%
                </a-tag>
              </a-popconfirm>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(tpConsumable.actualPrice * tpConsumable.quantity) }}
            </td>
          </tr>
          <tr>
            <td class="uppercase text-right" colspan="7">Tiền vật tư</td>
            <td class="font-bold text-right whitespace-nowrap">
              {{ formatMoney(consumableMoney) }}
            </td>
          </tr>
        </tbody>
      </template>
      <template v-if="ticketProcedureList.length">
        <thead>
          <tr>
            <th>#</th>
            <th colspan="3">DỊCH VỤ - THỦ THUẬT</th>
            <th>SL</th>
            <th>Giá</th>
            <th>Chiết khấu</th>
            <th>Tổng tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ticketProcedure, index) in ticketProcedureList || []" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td colspan="3">
              <div class="flex items-center gap-1">
                <span>{{ ticketProcedure.procedure?.name }}</span>
                <a
                  style="line-height: 0"
                  @click="modalProcedureDetail?.openModal(ticketProcedure.procedure!)">
                  <IconFileSearch />
                </a>
              </div>
            </td>
            <td class="text-center">{{ ticketProcedure.quantity }}</td>
            <td class="text-right whitespace-nowrap">
              <div v-if="ticketProcedure.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(ticketProcedure.expectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(ticketProcedure.actualPrice) }}</div>
            </td>

            <td class="text-center" style="width: 40px">
              <a-popconfirm>
                <template #cancelButton>
                  <div></div>
                </template>
                <template #okButton>
                  <div></div>
                </template>
                <template #title>
                  <div>
                    Chiết khấu (Tiền hàng:
                    <b>
                      {{ formatMoney(ticketProcedure.expectedPrice) }}
                    </b>
                    )
                  </div>
                  <div class="mt-2">
                    <div>
                      <InputNumber
                        :value="ticketProcedure.discountMoney"
                        append="VNĐ"
                        :disabled="
                          [TicketStatus.Debt, TicketStatus.Completed].includes(
                            ticketClinicRef.ticketStatus
                          )
                        "
                        @update:value="
                          (e: number) => handleChangeTicketProcedureDiscountMoney(e, index)
                        " />
                    </div>
                    <div class="mt-2">
                      <div class="w-full">
                        <InputNumber
                          :value="ticketProcedure.discountPercent"
                          append="%"
                          :disabled="
                            [TicketStatus.Debt, TicketStatus.Completed].includes(
                              ticketClinicRef.ticketStatus
                            )
                          "
                          @update:value="
                            (e: number) => handleChangeTicketProcedureDiscountPercent(e, index)
                          " />
                      </div>
                    </div>
                  </div>
                </template>
                <a-tag
                  v-if="ticketProcedure.discountType === 'VNĐ'"
                  color="success"
                  style="cursor: pointer">
                  {{ formatMoney(ticketProcedure.discountMoney) }}
                </a-tag>
                <a-tag
                  v-if="ticketProcedure.discountType === '%'"
                  color="success"
                  style="cursor: pointer">
                  {{ ticketProcedure.discountPercent || 0 }}%
                </a-tag>
              </a-popconfirm>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
            </td>
          </tr>
          <tr>
            <td class="uppercase text-right" colspan="7">Tiền dịch vụ thủ thuật</td>
            <td class="font-bold text-right whitespace-nowrap">
              {{ formatMoney(proceduresMoney) }}
            </td>
          </tr>
        </tbody>
      </template>
      <template v-if="ticketRadiologyList.length">
        <thead>
          <tr>
            <th>#</th>
            <th colspan="4">CHẨN ĐOÁN HÌNH ẢNH</th>
            <th>Giá</th>
            <th>Chiết khấu</th>
            <th>Tổng tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ticketRadiology, index) in ticketRadiologyList || []" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td colspan="4">
              <div class="flex items-center gap-1">
                <span>{{ ticketRadiology.radiology?.name }}</span>
                <a
                  style="line-height: 0"
                  @click="modalRadiologyDetail?.openModal(ticketRadiology.radiology!)">
                  <IconFileSearch />
                </a>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              <div v-if="ticketRadiology.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(ticketRadiology.expectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(ticketRadiology.actualPrice) }}</div>
            </td>

            <td class="text-center" style="width: 40px">
              <a-popconfirm>
                <template #cancelButton>
                  <div></div>
                </template>
                <template #okButton>
                  <div></div>
                </template>
                <template #title>
                  <div>
                    Chiết khấu (Tiền hàng:
                    <b>
                      {{ formatMoney(ticketRadiology.expectedPrice) }}
                    </b>
                    )
                  </div>
                  <div class="mt-2">
                    <div>
                      <InputNumber
                        :value="ticketRadiology.discountMoney"
                        append="VNĐ"
                        :disabled="
                          [TicketStatus.Debt, TicketStatus.Completed].includes(
                            ticketClinicRef.ticketStatus
                          )
                        "
                        @update:value="
                          (e: number) => handleChangeTicketRadiologyDiscountMoney(e, index)
                        " />
                    </div>
                    <div class="mt-2">
                      <div class="w-full">
                        <InputNumber
                          :value="ticketRadiology.discountPercent"
                          append="%"
                          :disabled="
                            [TicketStatus.Debt, TicketStatus.Completed].includes(
                              ticketClinicRef.ticketStatus
                            )
                          "
                          @update:value="
                            (e: number) => handleChangeTicketRadiologyDiscountPercent(e, index)
                          " />
                      </div>
                    </div>
                  </div>
                </template>
                <a-tag
                  v-if="ticketRadiology.discountType === 'VNĐ'"
                  color="success"
                  style="cursor: pointer">
                  {{ formatMoney(ticketRadiology.discountMoney) }}
                </a-tag>
                <a-tag
                  v-if="ticketRadiology.discountType === '%'"
                  color="success"
                  style="cursor: pointer">
                  {{ ticketRadiology.discountPercent || 0 }}%
                </a-tag>
              </a-popconfirm>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(ticketRadiology.actualPrice) }}
            </td>
          </tr>
          <tr>
            <td class="uppercase text-right" colspan="7">Tiền CHẨN ĐOÁN HÌNH ẢNH</td>
            <td class="font-bold text-right whitespace-nowrap">
              {{ formatMoney(radiologyMoney) }}
            </td>
          </tr>
        </tbody>
      </template>
      <tbody>
        <tr>
          <td class="uppercase text-right font-bold" colspan="7">Tổng tiền</td>
          <td class="font-bold text-right whitespace-nowrap">
            {{
              formatMoney(consumableMoney + prescriptionMoney + proceduresMoney + radiologyMoney)
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="mt-8 flex gap-4">
    <VueButton color="blue" icon="print" @click="startPrint">In hóa đơn</VueButton>
    <VueButton
      v-if="permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_ITEMS_MONEY]"
      class="ml-auto"
      color="blue"
      :disabled="disabledSave"
      :loading="saveLoading"
      icon="save"
      @click="saveTicketItemsMoney">
      Lưu lại
    </VueButton>
  </div>
</template>

<style lang="scss" scoped>
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  opacity: 1;
}
</style>
