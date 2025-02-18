<script lang="ts" setup>
import { FileSyncOutlined, MoreOutlined } from '@ant-design/icons-vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../../common/VueButton.vue'
import { IconDollar, IconFileSearch } from '../../../../common/icon'
import { IconDelete, IconEditSquare } from '../../../../common/icon-google'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputNumber } from '../../../../common/vue-form'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { DeliveryStatus, DiscountType, PaymentViewType } from '../../../../modules/enum'
import { Laboratory, LaboratoryService } from '../../../../modules/laboratory'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import {
  PrintHtml,
  printHtmlCompiledTemplate,
  PrintHtmlService,
} from '../../../../modules/print-html'
import { Procedure, ProcedureService } from '../../../../modules/procedure'
import { Radiology, RadiologyService } from '../../../../modules/radiology'
import { TicketStatus } from '../../../../modules/ticket'
import {
  TicketClinicApi,
  ticketClinicRef,
  ticketRefDeliveryStatus,
} from '../../../../modules/ticket-clinic'
import { TicketProduct } from '../../../../modules/ticket-product'
import { TicketRadiologyStatus } from '../../../../modules/ticket-radiology'
import { DDom, timeToText } from '../../../../utils'
import ModalProcedureDetail from '../../../master-data/procedure/detail/ModalProcedureDetail.vue'
import ModalRadiologyDetail from '../../../master-data/radiology/detail/ModalRadiologyDetail.vue'
import ModalProductDetail from '../../../product/detail/ModalProductDetail.vue'
import ModalTicketClinicConsumableUpdate from '../consumable/ModalTicketClinicConsumableUpdate.vue'
import ModalTicketLaboratoryUpdateMoney from '../laboratory/ModalTicketLaboratoryUpdateMoney.vue'
import ModalTicketClinicPayment from '../modal/ModalTicketClinicPayment.vue'
import ModalTicketClinicReturnProduct from '../modal/ModalTicketClinicReturnProduct.vue'
import ModalTicketProcedureUpdate from '../procedure/ModalTicketProcedureUpdate.vue'
import ModalTicketRadiologyUpdateMoney from '../radiology/ModalTicketRadiologyUpdateMoney.vue'

const modalTicketProcedureUpdate = ref<InstanceType<typeof ModalTicketProcedureUpdate>>()
const modalTicketLaboratoryUpdateMoney =
  ref<InstanceType<typeof ModalTicketLaboratoryUpdateMoney>>()
const modalTicketRadiologyUpdateMoney = ref<InstanceType<typeof ModalTicketRadiologyUpdateMoney>>()
const modalTicketClinicConsumableUpdate =
  ref<InstanceType<typeof ModalTicketClinicConsumableUpdate>>()

const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalTicketClinicReturnProduct = ref<InstanceType<typeof ModalTicketClinicReturnProduct>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalRadiologyDetail = ref<InstanceType<typeof ModalRadiologyDetail>>()

const route = useRoute()
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap, organization } = meStore

const procedureMap = ref<Record<string, Procedure>>({})
const laboratoryMap = ref<Record<string, Laboratory>>({})
const radiologyMap = ref<Record<string, Radiology>>({})

const ticketProductPrescriptionList = ref<TicketProduct[]>([])

const ticketDiscount = reactive({
  discountPercent: 0,
  discountMoney: 0,
  discountType: DiscountType.VND,
})

const sendProductLoading = ref(false)

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicSummary.vue:46 ~ onMounted')
  const fetchData = await Promise.all([
    ProcedureService.getMap(),
    LaboratoryService.getMap(),
    RadiologyService.getMap(),
  ])
  procedureMap.value = fetchData[0]
  laboratoryMap.value = fetchData[1]
  radiologyMap.value = fetchData[2]
})

const consumableDiscount = computed(() => {
  return ticketClinicRef.value.ticketProductConsumableList?.reduce((acc, item) => {
    return acc + item.discountMoney * item.quantity
  }, 0)
})

const consumableMoney = computed(() => {
  return ticketClinicRef.value.ticketProductConsumableList?.reduce((acc, item) => {
    return acc + item.actualPrice * item.quantity
  }, 0)
})

const prescriptionDiscount = computed(() => {
  return ticketClinicRef.value.ticketProductPrescriptionList?.reduce((acc, item) => {
    return acc + item.discountMoney * item.quantity
  }, 0)
})

const procedureDiscount = computed(() => {
  return ticketClinicRef.value.ticketProcedureList?.reduce((acc, item) => {
    return acc + item.discountMoney * item.quantity
  }, 0)
})

const laboratoryDiscount = computed(() => {
  return ticketClinicRef.value.ticketLaboratoryList?.reduce((acc, item) => {
    return acc + item.discountMoney
  }, 0)
})

const radiologyDiscount = computed(() => {
  return ticketClinicRef.value.ticketRadiologyList?.reduce((acc, item) => {
    return acc + item.discountMoney
  }, 0)
})

const prescriptionMoney = ref(0)
const itemsActualMoney = ref(0)
const itemsDiscount = ref(0)

const disableSendProduct = computed(() => {
  // chỉ được phép khi ở trạng thái đang khám (Executing)
  if (ticketClinicRef.value.ticketStatus !== TicketStatus.Executing) {
    return true
  }
  // chỉ được phép khi có hàng chưa gửi (Pending)
  if (ticketRefDeliveryStatus.value !== DeliveryStatus.Pending) {
    return true
  }

  return false
})

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

const handleChangeTicketDiscountMoney = (discountMoney: number) => {
  ticketDiscount.discountType = DiscountType.VND
  ticketDiscount.discountMoney = discountMoney
  ticketDiscount.discountPercent =
    itemsActualMoney.value == 0 ? 0 : Math.floor((discountMoney * 100) / itemsActualMoney.value)
}

const handleChangeTicketDiscountPercent = (discountPercent: number) => {
  ticketDiscount.discountType = DiscountType.Percent
  ticketDiscount.discountPercent = discountPercent
  ticketDiscount.discountMoney = Math.floor((discountPercent * itemsActualMoney.value) / 100)
}

const updateTicketProductPrescriptionQuantity = (index: number, unitQuantity: number) => {
  ticketProductPrescriptionList.value[index].unitQuantity = unitQuantity
}

const validateQuantity = () => {
  if (settingStore.SYSTEM_SETTING.allowNegativeQuantity) {
    return true
  }

  const ticketProductUnsentList = [
    ...(ticketClinicRef.value.ticketProductConsumableList || []),
    ...(ticketClinicRef.value.ticketProductPrescriptionList || []),
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

    if (ticketProductUnsent.quantity > (batch?.quantity || 0)) {
      AlertStore.addError(
        `Lô hàng ${timeToText(batch!.expiryDate)} của Sản phẩm ${product?.brandName} ` +
          `không đủ (tồn ${batch!.quantity} - lấy ${ticketProductUnsent.quantity})`
      )
      return false
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

const clickReopenTicket = () => {
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

const clickDestroyTicket = () => {
  if ([TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.value.ticketStatus)) {
    return ModalStore.alert({
      title: 'Phiếu khám đã đóng',
      content: ['- Bắt buộc MỞ LẠI hồ sơ trước khi HỦY phiếu khám'],
    })
  }

  if (ticketRefDeliveryStatus.value === DeliveryStatus.Delivered) {
    return ModalStore.alert({
      title: 'Đã xuất thuốc - vật tư',
      content: ['- Bắt buộc HOÀN TRẢ thuốc và vật tư trước khi HỦY phiếu khám'],
    })
  }
  if (
    (ticketClinicRef.value.ticketRadiologyList || []).find(
      (i) => i.status == TicketRadiologyStatus.Completed
    )
  ) {
    return ModalStore.alert({
      title: 'Phiếu chẩn đoán hình ảnh đã được thực hiện ?',
      content: 'Cần HỦY KẾT QUẢ phiếu CĐHA trước khi HỦY phiếu khám',
    })
  }

  if (ticketClinicRef.value.paid > 0) {
    return ModalStore.alert({
      title: 'Khách hàng còn tiền tạm ứng',
      content: 'Cần HOÀN TRẢ tất cả tiền đã thanh toán trước khi HỦY phiếu khám',
    })
  }

  return ModalStore.confirm({
    title: 'Bạn có chắc chắn HỦY phiếu khám này',
    content: ['- Phiếu khám khi đã xóa không thể phục hồi lại được.', `- Vẫn hủy phiếu khám.`],
    okText: 'Xác nhận HỦY phiếu',
    async onOk() {
      await TicketClinicApi.destroy(ticketClinicRef.value.id)
      router.push({ name: 'TicketClinicList' })
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
  if (menu.key === 'REFUND_OVERPAID') {
    modalTicketClinicPayment.value?.openModal(PaymentViewType.RefundOverpaid)
  }
  if (menu.key === 'REOPEN_TICKET') {
    clickReopenTicket()
  }
  if (menu.key === 'DESTROY_TICKET') {
    clickDestroyTicket()
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

    let printHtmlId = settingStore.TICKET_CLINIC_DETAIL.printHtmlIdSetting.invoice
    let printHtml: PrintHtml | undefined
    if (printHtmlId !== 0) {
      printHtml = await PrintHtmlService.detail(printHtmlId)
      if (!printHtml || !printHtml.content) {
        printHtmlId = 0
      }
    }
    if (printHtmlId === 0) {
      printHtmlId = meStore.rootSetting.printDefault.invoice
      printHtml = await PrintHtmlService.detail(printHtmlId)
    }

    if (!printHtml || !printHtml.content) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const textDom = printHtmlCompiledTemplate({
      organization,
      ticket: ticketClinicRef.value,
      masterData: { laboratoryMap: laboratoryMap.value },
      printHtml: printHtml!,
    })

    await DDom.startPrint('iframe-print', textDom)
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:421 ~ startPrint ~ error:', error)
  }
}
</script>
<template>
  <ModalTicketProcedureUpdate ref="modalTicketProcedureUpdate" />
  <ModalTicketLaboratoryUpdateMoney ref="modalTicketLaboratoryUpdateMoney" />
  <ModalTicketRadiologyUpdateMoney ref="modalTicketRadiologyUpdateMoney" />
  <ModalTicketClinicConsumableUpdate ref="modalTicketClinicConsumableUpdate" />
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
            <a-menu-item key="REFUND_OVERPAID">
              <span class="text-red-500">
                <IconDollar class="mr-2" />
                Hoàn trả tiền
              </span>
            </a-menu-item>
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
              key="REOPEN_TICKET">
              <span class="text-red-500">
                <FileSyncOutlined class="mr-2" />
                Mở lại phiếu khám
              </span>
            </a-menu-item>
            <a-menu-item key="DESTROY_TICKET">
              <span class="text-red-500">
                <IconDelete class="mr-2" />
                Xóa phiếu
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
                    <b>{{ formatMoney(tpPrescription.unitExpectedPrice) }}</b>
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
              <div v-if="tpPrescription.discountMoney" class="text-xs italic text-red-500">
                <del>
                  {{ formatMoney(tpPrescription.unitExpectedPrice * tpPrescription.quantity) }}
                </del>
              </div>
              {{ formatMoney(tpPrescription.actualPrice * tpPrescription.quantity) }}
            </td>
          </tr>
          <tr>
            <td class="text-right" colspan="7">
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
          </tr>
        </tbody>
      </template>
      <template v-if="ticketClinicRef.ticketProductConsumableList?.length">
        <thead>
          <tr>
            <th>#</th>
            <th colspan="2">VẬT TƯ</th>
            <th>Đ.Vị</th>
            <th>SL</th>
            <th>Giá</th>
            <th>Chiết khấu</th>
            <th>Tổng tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(tpConsumable, tpConsumableIndex) in ticketClinicRef.ticketProductConsumableList"
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
              <div
                v-if="
                  tpConsumable.batchId &&
                  tpConsumable.batch?.lotNumber &&
                  tpConsumable.batch?.expiryDate
                "
                class="text-xs italic">
                Lô {{ tpConsumable.batch?.lotNumber }} - HSD
                {{ timeToText(tpConsumable.batch?.expiryDate) }}
              </div>
            </td>
            <td class="text-center">{{ tpConsumable.unitName }}</td>
            <td class="text-center" style="width: 150px">
              <div class="text-center">
                {{ tpConsumable.unitQuantity }}
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              <div v-if="tpConsumable.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(tpConsumable.unitExpectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(tpConsumable.unitActualPrice) }}</div>
            </td>
            <td class="text-center" style="width: 40px">
              <div v-if="tpConsumable.discountMoney">
                <a-tag
                  v-if="tpConsumable.discountType === 'VNĐ'"
                  color="success"
                  style="cursor: pointer">
                  {{ formatMoney(tpConsumable.discountMoney) }}
                </a-tag>
                <a-tag
                  v-if="tpConsumable.discountType === '%'"
                  color="success"
                  style="cursor: pointer">
                  {{ tpConsumable.discountPercent || 0 }}%
                </a-tag>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              <div v-if="tpConsumable.discountMoney" class="text-xs italic text-red-500">
                <del>
                  {{ formatMoney(tpConsumable.unitExpectedPrice * tpConsumable.quantity) }}
                </del>
              </div>
              {{ formatMoney(tpConsumable.actualPrice * tpConsumable.quantity) }}
            </td>
            <td class="text-center">
              <a
                v-if="
                  ![TicketStatus.Debt, TicketStatus.Completed].includes(
                    ticketClinicRef.ticketStatus
                  ) && permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PRODUCT_CONSUMABLE]
                "
                class="text-orange-500"
                @click="modalTicketClinicConsumableUpdate?.openModal(tpConsumable)">
                <IconEditSquare width="20" height="20" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="text-right" colspan="7">
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
      <template v-if="ticketClinicRef.ticketProcedureList?.length">
        <thead>
          <tr>
            <th>#</th>
            <th colspan="3">DỊCH VỤ - THỦ THUẬT</th>
            <th>SL</th>
            <th>Giá</th>
            <th>Chiết khấu</th>
            <th>Tổng tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ticketProcedure, index) in ticketClinicRef.ticketProcedureList" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td colspan="3">
              <div class="flex items-center gap-1">
                <span>{{ procedureMap[ticketProcedure.procedureId]?.name }}</span>
                <a
                  style="line-height: 0"
                  @click="
                    modalProcedureDetail?.openModal(procedureMap[ticketProcedure.procedureId])
                  ">
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

            <td class="text-center">
              <div v-if="ticketProcedure.discountMoney">
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
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
            </td>
            <td class="text-center">
              <a
                v-if="
                  ![TicketStatus.Debt, TicketStatus.Completed].includes(
                    ticketClinicRef.ticketStatus
                  ) && permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PROCEDURE_LIST]
                "
                class="text-orange-500"
                @click="modalTicketProcedureUpdate?.openModal(ticketProcedure)">
                <IconEditSquare width="20" height="20" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="text-right" colspan="7">
              <div class="flex items-center justify-end gap-2">
                <span class="uppercase">Tiền dịch vụ</span>
                <span v-if="procedureDiscount" class="italic" style="font-size: 13px">
                  (CK: {{ formatMoney(procedureDiscount) }})
                </span>
              </div>
            </td>
            <td class="font-bold text-right whitespace-nowrap" colspan="1">
              {{ formatMoney(ticketClinicRef.procedureMoney) }}
            </td>
            <td></td>
          </tr>
        </tbody>
      </template>
      <template v-if="ticketClinicRef.ticketLaboratoryList?.length">
        <thead>
          <tr>
            <th>#</th>
            <th colspan="4" style="text-transform: uppercase">Xét nghiệm</th>
            <th>Giá</th>
            <th>Chiết khấu</th>
            <th>Tổng tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(ticketLaboratory, index) in ticketClinicRef.ticketLaboratoryList"
            :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td colspan="4">
              <div class="flex items-center gap-1">
                <span>{{ laboratoryMap[ticketLaboratory.laboratoryId]?.name }}</span>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              <div v-if="ticketLaboratory.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(ticketLaboratory.expectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(ticketLaboratory.actualPrice) }}</div>
            </td>
            <td class="text-center">
              <div v-if="ticketLaboratory.discountMoney">
                <a-tag
                  v-if="ticketLaboratory.discountType === 'VNĐ'"
                  color="success"
                  style="cursor: pointer">
                  {{ formatMoney(ticketLaboratory.discountMoney) }}
                </a-tag>
                <a-tag
                  v-if="ticketLaboratory.discountType === '%'"
                  color="success"
                  style="cursor: pointer">
                  {{ ticketLaboratory.discountPercent || 0 }}%
                </a-tag>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(ticketLaboratory.actualPrice) }}
            </td>
            <td class="text-center">
              <a
                v-if="
                  ![TicketStatus.Debt, TicketStatus.Completed].includes(
                    ticketClinicRef.ticketStatus
                  ) && permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_LABORATORY_LIST]
                "
                class="text-orange-500"
                @click="modalTicketLaboratoryUpdateMoney?.openModal(ticketLaboratory)">
                <IconEditSquare width="20" height="20" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="text-right" colspan="7">
              <div class="flex items-center justify-end gap-2">
                <span class="uppercase">Tiền xét nghiệm</span>
                <span v-if="laboratoryDiscount" class="italic" style="font-size: 13px">
                  (CK: {{ formatMoney(laboratoryDiscount) }})
                </span>
              </div>
            </td>
            <td class="font-bold text-right whitespace-nowrap">
              {{ formatMoney(ticketClinicRef.laboratoryMoney) }}
            </td>
            <td></td>
          </tr>
        </tbody>
      </template>
      <template v-if="ticketClinicRef.ticketRadiologyList?.length">
        <thead>
          <tr>
            <th>#</th>
            <th colspan="4">CHẨN ĐOÁN HÌNH ẢNH</th>
            <th>Giá</th>
            <th>Chiết khấu</th>
            <th>Tổng tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ticketRadiology, index) in ticketClinicRef.ticketRadiologyList" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td colspan="4">
              <div class="flex items-center gap-1">
                <span>{{ radiologyMap[ticketRadiology.radiologyId]?.name }}</span>
                <a
                  style="line-height: 0"
                  @click="
                    modalRadiologyDetail?.openModal(radiologyMap[ticketRadiology.radiologyId])
                  ">
                  <IconFileSearch />
                </a>
                <a-tag
                  v-if="ticketRadiology.status === TicketRadiologyStatus.Pending"
                  color="warning"
                  style="cursor: pointer">
                  Chưa trả kết quả
                </a-tag>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              <div v-if="ticketRadiology.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(ticketRadiology.expectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(ticketRadiology.actualPrice) }}</div>
            </td>
            <td class="text-center">
              <div v-if="ticketRadiology.discountMoney">
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
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(ticketRadiology.actualPrice) }}
            </td>
            <td class="text-center">
              <a
                v-if="
                  ![TicketStatus.Debt, TicketStatus.Completed].includes(
                    ticketClinicRef.ticketStatus
                  ) && permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_RADIOLOGY_LIST]
                "
                class="text-orange-500"
                @click="modalTicketRadiologyUpdateMoney?.openModal(ticketRadiology)">
                <IconEditSquare width="20" height="20" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="text-right" colspan="7">
              <div class="flex items-center justify-end gap-2">
                <span class="uppercase">Tiền CĐHA</span>
                <span v-if="radiologyDiscount" class="italic" style="font-size: 13px">
                  (CK: {{ formatMoney(radiologyDiscount) }})
                </span>
              </div>
            </td>
            <td class="font-bold text-right whitespace-nowrap">
              {{ formatMoney(ticketClinicRef.radiologyMoney) }}
            </td>
            <td></td>
          </tr>
        </tbody>
      </template>
      <tbody>
        <tr>
          <td class="text-right" colspan="7">
            <div class="flex items-center justify-end gap-2">
              <span>Tổng cộng</span>
              <span v-if="itemsDiscount" class="italic" style="font-size: 13px">
                (CK: {{ formatMoney(itemsDiscount) }})
              </span>
            </div>
          </td>
          <td class="font-bold text-right whitespace-nowrap">
            {{ formatMoney(ticketClinicRef.itemsActualMoney) }}
          </td>
          <td></td>
        </tr>
        <tr>
          <td class="text-right" colspan="7">Chiết khấu</td>
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
                  Chiết khấu (Tổng tiền hiện tại:
                  <b>{{ formatMoney(itemsActualMoney) }}</b>
                  )
                </div>
                <div class="mt-2">
                  <div>
                    <InputNumber
                      :value="ticketDiscount.discountMoney"
                      append="VNĐ"
                      :disabled="
                        [TicketStatus.Debt, TicketStatus.Completed].includes(
                          ticketClinicRef.ticketStatus
                        )
                      "
                      @update:value="handleChangeTicketDiscountMoney" />
                  </div>
                  <div class="mt-2">
                    <div class="w-full">
                      <InputNumber
                        :value="ticketDiscount.discountPercent"
                        append="%"
                        :disabled="
                          [TicketStatus.Debt, TicketStatus.Completed].includes(
                            ticketClinicRef.ticketStatus
                          )
                        "
                        @update:value="handleChangeTicketDiscountPercent" />
                    </div>
                  </div>
                </div>
              </template>
              <a-tag
                v-if="ticketDiscount.discountType === 'VNĐ'"
                color="success"
                style="cursor: pointer">
                {{ formatMoney(ticketDiscount.discountMoney) }}
              </a-tag>
              <a-tag
                v-if="ticketDiscount.discountType === '%'"
                color="success"
                style="cursor: pointer">
                {{ ticketDiscount.discountPercent || 0 }}%
              </a-tag>
            </a-popconfirm>
          </td>
        </tr>
        <tr>
          <td class="text-right" colspan="7">Chiết khấu</td>
          <td class="text-center" style="width: 40px">
            <a-tag
              v-if="ticketDiscount.discountType === 'VNĐ'"
              color="success"
              style="cursor: pointer">
              {{ formatMoney(ticketDiscount.discountMoney) }}
            </a-tag>
            <a-tag
              v-if="ticketDiscount.discountType === '%'"
              color="success"
              style="cursor: pointer">
              {{ ticketDiscount.discountPercent || 0 }}%
            </a-tag>
          </td>
          <td class="text-center">
            <a class="text-orange-500">
              <IconEditSquare width="20" height="20" />
            </a>
          </td>
        </tr>
        <tr>
          <td class="uppercase text-right font-bold" colspan="7">Tổng tiền</td>
          <td class="font-bold text-right whitespace-nowrap">
            {{ formatMoney(ticketClinicRef.totalMoney) }}
          </td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="mt-8 flex gap-4">
    <VueButton color="blue" icon="print" @click="startPrint">In hóa đơn</VueButton>
  </div>
</template>

<style lang="scss" scoped>
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  opacity: 1;
}
</style>
