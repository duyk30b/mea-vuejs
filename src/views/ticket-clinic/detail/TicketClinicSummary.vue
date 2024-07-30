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
import { TicketStatus } from '../../../modules/ticket'
import { TicketClinicApi } from '../../../modules/ticket-clinic'
import { TicketProcedure } from '../../../modules/ticket-procedure'
import { TicketProduct } from '../../../modules/ticket-product'
import { TicketRadiology } from '../../../modules/ticket-radiology'
import { timeToText } from '../../../utils'
import ModalProcedureDetail from '../../procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '../../product/detail/ModalProductDetail.vue'
import ModalRadiologyDetail from '../../radiology/detail/ModalRadiologyDetail.vue'
import ModalTicketClinicPayment from './modal/ModalTicketClinicPayment.vue'
import ModalTicketClinicReturnProduct from './modal/ModalTicketClinicReturnProduct.vue'
import { ticketClinicInvoiceHtmlContent } from './print-content/ticket-clinic-invoice-html-print-content'
import { ticketClinic } from './ticket-clinic-detail.ref'

const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalTicketClinicReturnProduct = ref<InstanceType<typeof ModalTicketClinicReturnProduct>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalRadiologyDetail = ref<InstanceType<typeof ModalRadiologyDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()

const ticketProductList = ref<TicketProduct[]>([])
const ticketProcedureList = ref<TicketProcedure[]>([])
const ticketRadiologyList = ref<TicketRadiology[]>([])

const saveLoading = ref(false)
const sendProductLoading = ref(false)

onMounted(async () => {
  console.log('🚀 ~ file: ClinicSummary.vue: ~ onMounted')
})

watch(
  () => ticketClinic.value.ticketProductList,
  async (newValue, oldValue) => {
    ticketProductList.value = TicketProduct.fromList(newValue || [])
  },
  { immediate: true }
)
watch(
  () => ticketClinic.value.ticketProcedureList,
  (newValue, oldValue) => {
    ticketProcedureList.value = TicketProcedure.fromList(newValue || [])
  },
  { immediate: true }
)
watch(
  () => ticketClinic.value.ticketRadiologyList,
  (newValue, oldValue) => {
    ticketRadiologyList.value = TicketRadiology.fromList(newValue || [])
  },
  { immediate: true }
)

const productsMoney = computed(() => {
  return ticketProductList.value.reduce((acc, item) => {
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
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinic.value.ticketStatus)) {
    return true
  }
  if (
    TicketProduct.equalList(ticketProductList.value, ticketClinic.value.ticketProductList || []) &&
    TicketProcedure.equalList(
      ticketProcedureList.value,
      ticketClinic.value.ticketProcedureList || []
    ) &&
    TicketRadiology.equalList(
      ticketRadiologyList.value,
      ticketClinic.value.ticketRadiologyList || []
    )
  ) {
    return true
  }

  return false
})

const disableSendProduct = computed(() => {
  if (ticketClinic.value.ticketStatus !== TicketStatus.Executing) {
    return true
  }
  if (ticketClinic.value.deliveryStatus !== DeliveryStatus.Pending) {
    return true
  }
  if (
    !TicketProduct.equalList(ticketProductList.value, ticketClinic.value.ticketProductList || [])
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

const handleChangeTicketProductDiscountMoney = (data: number, index: number) => {
  const expectedPrice = ticketProductList.value[index].expectedPrice || 0
  const discountMoney = data / ticketProductList.value[index].unitRate
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  ticketProductList.value[index].discountMoney = discountMoney
  ticketProductList.value[index].discountPercent = discountPercent
  ticketProductList.value[index].actualPrice = actualPrice
  ticketProductList.value[index].discountType = DiscountType.VND
}

const handleChangeTicketProductDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = ticketProductList.value[index].expectedPrice || 0
  const discountMoney = Math.floor((discountPercent * expectedPrice) / 100)
  const actualPrice = expectedPrice - discountMoney
  ticketProductList.value[index].discountPercent = discountPercent
  ticketProductList.value[index].discountMoney = discountMoney
  ticketProductList.value[index].actualPrice = actualPrice
  ticketProductList.value[index].discountType = DiscountType.Percent
}

const saveTicketItemsMoney = async () => {
  saveLoading.value = true
  try {
    await TicketClinicApi.changeItemsMoney({
      ticketId: ticketClinic.value.id,
      ticketProductList: ticketProductList.value.filter((item, index) => {
        return !TicketProduct.equal(item, ticketClinic.value.ticketProductList![index])
      }),
      ticketProcedureList: ticketProcedureList.value.filter((item, index) => {
        return !TicketProcedure.equal(item, ticketClinic.value.ticketProcedureList![index])
      }),
      ticketRadiologyList: ticketRadiologyList.value.filter((item, index) => {
        return !TicketRadiology.equal(item, ticketClinic.value.ticketRadiologyList![index])
      }),
    })
  } catch (e) {
    console.log('🚀 ~ file: VisitPayment.vue:137 ~ saveTicketItemsMoney ~ e:', e)
  } finally {
    saveLoading.value = false
  }
}

const validateQuantity = () => {
  if (settingStore.SYSTEM_SETTING.allowNegativeQuantity) {
    return true
  }

  const ticketProductUnsentList = ticketProductList.value.filter((i) => {
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
    await TicketClinicApi.sendProduct({ ticketId: ticketClinic.value.id })
  } catch (error) {
    console.log('🚀 ~ file: VisitPayment.vue:301 ~ startSendProduct ~ error:', error)
  } finally {
    sendProductLoading.value = false
  }
}

const updateTicketProductQuantity = (ticketProductIndex: number, unitQuantity: number) => {
  const ticketProductCurrent = ticketProductList.value[ticketProductIndex]

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

const startPrint = async () => {
  try {
    // const response = await fetch('/template/visit-invoice.hbs')
    // const templateHtml = await response.text()

    // const templateCompile = Handlebars.compile(templateHtml)
    // const content = templateCompile({
    //   organization: meStore.organization,
    //   visit: ticketClinic.value,
    // })

    const content = ticketClinicInvoiceHtmlContent(ticketClinic.value)
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

const startReopenVisit = async () => {
  await TicketClinicApi.reopen(ticketClinic.value.id)
}

const clickReopenVisit = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn mở lại hồ sơ của phiếu khám này ?',
    content: [
      ...(ticketClinic.value.paid > 0
        ? [
            `- Số tiền nợ sẽ được hoàn trả, khi đóng hồ sơ lại sẽ ghi nợ trở lại`,
            `- Trừ nợ khách hàng: ${formatMoney(ticketClinic.value.debt)}`,
          ]
        : ['- Thời gian kết thúc hồ sơ sẽ bị thay đổi']),
    ],
    async onOk() {
      await startReopenVisit()
    },
  })
}

const handleMenuActionClick = (menu: { key: string }) => {
  if (menu.key === 'RETURN_PRODUCT_LIST') {
    if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinic.value.ticketStatus)) {
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
      <span class="font-bold">XUẤT THUỐC</span>
    </VueButton>
    <VueButton
      v-if="
        [TicketStatus.Approved, TicketStatus.Executing].includes(ticketClinic.ticketStatus) &&
        ticketClinic.paid > ticketClinic.totalMoney
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
                Hoàn trả thuốc
              </span>
            </a-menu-item>
            <a-menu-item
              v-if="[TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinic.ticketStatus)"
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
      <thead>
        <tr>
          <th>#</th>
          <th>THUỐC - VẬT TƯ</th>
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
          v-for="(ticketProduct, ticketProductIndex) in ticketProductList || []"
          :key="ticketProduct.id + '_' + ticketProductIndex">
          <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
            {{ ticketProductIndex + 1 }}
          </td>
          <td>
            <div class="flex items-center gap-1" style="font-weight: 500">
              <span>{{ ticketProduct.product?.brandName }}</span>
              <a
                style="line-height: 0"
                @click="modalProductDetail?.openModal(ticketProduct.product!)">
                <IconFileSearch />
              </a>
            </div>
            <div v-if="ticketProduct.product?.substance" class="text-xs italic">
              {{ ticketProduct.product.substance }}
            </div>
            <div v-if="ticketProduct.batchId" class="text-xs italic">
              Lô {{ ticketProduct.batch?.lotNumber }} - HSD
              {{ timeToText(ticketProduct.batch?.expiryDate) }}
            </div>
          </td>
          <td class="text-center">{{ ticketProduct.unitName }}</td>
          <td class="text-center">{{ ticketProduct.unitQuantityPrescription }}</td>
          <td class="text-center" style="width: 150px">
            <div
              v-if="
                ticketProduct.deliveryStatus === DeliveryStatus.Delivered ||
                [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinic.ticketStatus)
              "
              class="text-center">
              {{ ticketProduct.unitQuantity }}
            </div>
            <div v-else class="flex items-center justify-between">
              <button
                style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                :disabled="ticketProduct.quantity <= 0"
                @click="
                  updateTicketProductQuantity(ticketProductIndex, ticketProduct.unitQuantity - 1)
                ">
                <font-awesome-icon :icon="['fas', 'minus']" />
              </button>
              <div style="width: calc(100% - 60px); min-width: 50px">
                <InputNumber
                  :value="ticketProduct.unitQuantity"
                  textAlign="right"
                  @update:value="
                    (value) => updateTicketProductQuantity(ticketProductIndex, value)
                  " />
              </div>
              <button
                style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                @click="
                  updateTicketProductQuantity(ticketProductIndex, ticketProduct.unitQuantity + 1)
                ">
                <font-awesome-icon :icon="['fas', 'plus']" />
              </button>
            </div>
          </td>
          <td class="text-right whitespace-nowrap">
            <div v-if="ticketProduct.discountMoney" class="text-xs italic text-red-500">
              <del>{{ formatMoney(ticketProduct.unitExpectedPrice) }}</del>
            </div>
            <div>{{ formatMoney(ticketProduct.unitActualPrice) }}</div>
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
                    {{ formatMoney(ticketProduct.unitExpectedPrice) }}
                  </b>
                  )
                </div>
                <div class="mt-2">
                  <div>
                    <InputNumber
                      :value="ticketProduct.unitDiscountMoney"
                      :disabled="
                        ticketProduct.deliveryStatus === DeliveryStatus.Delivered ||
                        [TicketStatus.Debt, TicketStatus.Completed].includes(
                          ticketClinic.ticketStatus
                        )
                      "
                      append="VNĐ"
                      @update:value="
                        (e: number) => handleChangeTicketProductDiscountMoney(e, ticketProductIndex)
                      " />
                  </div>
                  <div class="mt-2">
                    <div class="w-full">
                      <InputNumber
                        :value="ticketProduct.discountPercent"
                        append="%"
                        :disabled="
                          ticketProduct.deliveryStatus === DeliveryStatus.Delivered ||
                          [TicketStatus.Debt, TicketStatus.Completed].includes(
                            ticketClinic.ticketStatus
                          )
                        "
                        @update:value="
                          (e: number) =>
                            handleChangeTicketProductDiscountPercent(e, ticketProductIndex)
                        " />
                    </div>
                  </div>
                </div>
              </template>
              <a-tag
                v-if="ticketProduct.discountType === 'VNĐ'"
                color="success"
                style="cursor: pointer">
                {{ formatMoney(ticketProduct.unitDiscountMoney) }}
              </a-tag>
              <a-tag
                v-if="ticketProduct.discountType === '%'"
                color="success"
                style="cursor: pointer">
                {{ ticketProduct.discountPercent || 0 }}%
              </a-tag>
            </a-popconfirm>
          </td>
          <td class="text-right whitespace-nowrap">
            {{ formatMoney(ticketProduct.actualPrice * ticketProduct.quantity) }}
          </td>
        </tr>
        <tr>
          <td class="uppercase text-right" colspan="7">Tiền thuốc</td>
          <td class="font-bold text-right whitespace-nowrap">
            {{ formatMoney(productsMoney) }}
          </td>
        </tr>
      </tbody>
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
                          ticketClinic.ticketStatus
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
                            ticketClinic.ticketStatus
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
                          ticketClinic.ticketStatus
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
                            ticketClinic.ticketStatus
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
      <tbody>
        <tr>
          <td class="uppercase text-right font-bold" colspan="7">Tổng tiền</td>
          <td class="font-bold text-right whitespace-nowrap">
            {{ formatMoney(productsMoney + proceduresMoney + radiologyMoney) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="mt-8 flex gap-4">
    <VueButton color="blue" icon="print" @click="startPrint">In hóa đơn</VueButton>
    <VueButton
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
