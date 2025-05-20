<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../../common/VueButton.vue'
import VueDropdown from '../../../../common/popover/VueDropdown.vue'
import VueTag from '../../../../common/VueTag.vue'
import { IconDollar, IconFileSearch, IconFileSync, IconMore } from '../../../../common/icon-antd'
import { IconDelete, IconEditSquare } from '../../../../common/icon-google'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { CONFIG } from '../../../../config'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { DeliveryStatus, PaymentViewType } from '../../../../modules/enum'
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
  TicketClinicProductApi,
  ticketClinicRef,
  ticketRefDeliveryStatus,
} from '../../../../modules/ticket-clinic'
import { TicketRadiologyStatus } from '../../../../modules/ticket-radiology'
import { ESDom } from '../../../../utils'
import ModalProcedureDetail from '../../../master-data/procedure/detail/ModalProcedureDetail.vue'
import ModalTicketReturnProduct from '../../../ticket-base/ModalTicketReturnProduct.vue'
import ModalTicketClinicPayment from '../modal/ModalTicketClinicPayment.vue'
import ModalTicketProcedureUpdate from '../procedure/ModalTicketProcedureUpdate.vue'
import ModalTicketClinicChangeDiscount from './ModalTicketClinicChangeDiscount.vue'
import TicketClinicSummaryLaboratory from './TicketClinicSummaryLaboratory.vue'
import TicketClinicSummaryProduct from './TicketClinicSummaryProduct.vue'
import TicketClinicSummaryRadiology from './TicketClinicSummaryRadiology.vue'

const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalTicketProcedureUpdate = ref<InstanceType<typeof ModalTicketProcedureUpdate>>()

const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalTicketReturnProduct = ref<InstanceType<typeof ModalTicketReturnProduct>>()
const modalTicketClinicChangeDiscount = ref<InstanceType<typeof ModalTicketClinicChangeDiscount>>()

const route = useRoute()
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap, organization } = meStore

const procedureMap = ref<Record<string, Procedure>>({})
const radiologyMap = ref<Record<string, Radiology>>({})

const sendProductLoading = ref(false)

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicSummary.vue:46 ~ onMounted')
  const fetchData = await Promise.all([ProcedureService.getMap(), RadiologyService.getMap()])
  procedureMap.value = fetchData[0]
  radiologyMap.value = fetchData[1]
})

const procedureDiscount = computed(() => {
  return ticketClinicRef.value.ticketProcedureList?.reduce((acc, item) => {
    return acc + item.discountMoney * item.quantity
  }, 0)
})

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
    const { product } = ticketProductUnsent

    if (!product?.hasManageQuantity) continue

    if (ticketProductUnsent.quantity > (product?.quantity || 0)) {
      AlertStore.addError(
        `Sản phẩm ${product?.brandName} không đủ ` +
          `(tồn ${product?.quantity || 0} - lấy ${ticketProductUnsent.quantity})`,
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
    await TicketClinicProductApi.sendProduct({ ticketId: ticketClinicRef.value.id })
  } catch (error) {
    console.log('🚀 ~ TicketClinicSummary.vue:184 ~ startSendProduct ~ error:', error)
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
      (i) => i.status == TicketRadiologyStatus.Completed,
    )
  ) {
    return ModalStore.alert({
      title: 'Phiếu chẩn đoán hình ảnh đã được thực hiện ?',
      content: 'Cần XÓA tất phiếu CĐHA đã hoàn thành trước khi HỦY phiếu khám',
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
    okText: 'Xác nhận XÓA phiếu',
    async onOk() {
      await TicketClinicApi.destroy(ticketClinicRef.value.id)
      router.push({ name: 'TicketClinicList' })
    },
  })
}

const clickRefundMoney = () => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)) {
    return ModalStore.alert({
      title: 'Trạng thái hồ sơ không hợp lệ ?',
      content: 'Cần mở lại hồ sơ trước khi hoàn trả tiền',
    })
  } else {
    modalTicketClinicPayment.value?.openModal(PaymentViewType.RefundOverpaid)
  }
}

const clickReturnProduct = () => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)) {
    return ModalStore.alert({
      title: 'Trạng thái hồ sơ không hợp lệ ?',
      content: 'Cần mở lại hồ sơ trước khi hoàn trả thuốc - vật tư',
    })
  } else {
    modalTicketReturnProduct.value?.openModal(ticketClinicRef.value)
  }
}

const handleMenuActionClick = (menu: { key: string }) => {
  if (menu.key === 'RETURN_PRODUCT_LIST') {
    if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)) {
      return ModalStore.alert({
        title: 'Trạng thái hồ sơ không hợp lệ ?',
        content: 'Cần mở lại hồ sơ trước khi hoàn trả',
      })
    } else {
      modalTicketReturnProduct.value?.openModal(ticketClinicRef.value)
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
      printHtml: printHtml!,
    })

    await ESDom.startPrint('iframe-print', textDom)
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:297 ~ startPrint ~ error:', error)
  }
}
</script>
<template>
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalTicketProcedureUpdate ref="modalTicketProcedureUpdate" />
  <ModalTicketClinicChangeDiscount ref="modalTicketClinicChangeDiscount" />
  <ModalTicketClinicPayment ref="modalTicketClinicPayment" />
  <ModalTicketReturnProduct ref="modalTicketReturnProduct" />

  <div class="mt-4 flex items-center gap-4">
    <VueButton
      style="margin-left: auto"
      color="green"
      :disabled="disableSendProduct"
      :loading="sendProductLoading"
      icon="send"
      @click="startSendProduct"
    >
      <span class="font-bold">XUẤT THUỐC - VẬT TƯ</span>
    </VueButton>
    <VueButton
      v-if="
        [TicketStatus.Prepayment, TicketStatus.Executing].includes(ticketClinicRef.ticketStatus) &&
        ticketClinicRef.paid > ticketClinicRef.totalMoney
      "
      icon="dollar"
      size="small"
      color="green"
      @click="modalTicketClinicPayment?.openModal(PaymentViewType.RefundOverpaid)"
    >
      <span class="font-bold">HOÀN TIỀN</span>
    </VueButton>
    <VueDropdown>
      <template #trigger>
        <div class="vue-circle">
          <IconMore style="font-size: 1.5rem; font-weight: bold" />
        </div>
      </template>
      <div class="vue-menu">
        <a @click="clickRefundMoney">
          <span class="text-red-500">
            <IconDollar />
            Hoàn trả tiền
          </span>
        </a>
        <a @click="clickReturnProduct">
          <span class="text-red-500">
            <IconFileSync />
            Hoàn trả thuốc - vật tư
          </span>
        </a>
        <a
          v-if="[TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.ticketStatus)"
          @click="clickReopenTicket"
        >
          <span class="text-red-500">
            <IconFileSync />
            Mở lại phiếu khám
          </span>
        </a>
        <a @click="clickDestroyTicket">
          <span class="text-red-500">
            <IconDelete />
            Xóa phiếu
          </span>
        </a>
      </div>
    </VueDropdown>
  </div>
  <div class="mt-4 table-wrapper">
    <table>
      <TicketClinicSummaryProduct />
      <template v-if="ticketClinicRef.ticketProcedureList?.length">
        <thead>
          <tr>
            <th>#</th>
            <th></th>
            <th colspan="3">DỊCH VỤ - THỦ THUẬT</th>
            <th>SL</th>
            <th>Giá</th>
            <th>Chiết khấu</th>
            <th>Tổng tiền</th>
            <th></th>
            <th v-if="CONFIG.MODE === 'development'" class="text-right italic">Vốn</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ticketProcedure, index) in ticketClinicRef.ticketProcedureList" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              {{ index + 1 }}
            </td>
            <td></td>
            <td colspan="3">
              <div class="flex items-center gap-1">
                <span>{{ procedureMap[ticketProcedure.procedureId]?.name }}</span>
                <a
                  style="line-height: 0"
                  @click="
                    modalProcedureDetail?.openModal(procedureMap[ticketProcedure.procedureId])
                  "
                >
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
                <VueTag v-if="ticketProcedure.discountType === 'VNĐ'" color="green">
                  {{ formatMoney(ticketProcedure.discountMoney) }}
                </VueTag>
                <VueTag v-if="ticketProcedure.discountType === '%'" color="green">
                  {{ ticketProcedure.discountPercent || 0 }}%
                </VueTag>
              </div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
            </td>
            <td class="text-center">
              <a
                v-if="
                  ![TicketStatus.Debt, TicketStatus.Completed].includes(
                    ticketClinicRef.ticketStatus,
                  ) && permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PROCEDURE_LIST]
                "
                class="text-orange-500"
                @click="modalTicketProcedureUpdate?.openModal(ticketProcedure)"
              >
                <IconEditSquare width="20" height="20" />
              </a>
            </td>
            <td v-if="CONFIG.MODE === 'development'" class="text-right italic"></td>
          </tr>
          <tr>
            <td class="text-right" colspan="8">
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
            <td v-if="CONFIG.MODE === 'development'" class="text-right italic"></td>
          </tr>
        </tbody>
      </template>
      <TicketClinicSummaryLaboratory />
      <TicketClinicSummaryRadiology />
      <tbody>
        <tr>
          <td class="text-right" colspan="8">
            <div class="flex items-center justify-end gap-2">
              <span>Tổng thành phần</span>
              <span v-if="ticketClinicRef.itemsDiscount" class="italic" style="font-size: 13px">
                (CK: {{ formatMoney(ticketClinicRef.itemsDiscount) }})
              </span>
            </div>
          </td>
          <td class="font-bold text-right whitespace-nowrap">
            {{ formatMoney(ticketClinicRef.itemsActualMoney) }}
          </td>
          <td></td>
          <td v-if="CONFIG.MODE === 'development'" class="text-right italic">
            {{ formatMoney(ticketClinicRef.itemsCostAmount) }}
          </td>
        </tr>
        <tr>
          <td class="text-right" colspan="8">Chiết khấu</td>
          <td class="text-center" style="width: 40px">
            <VueTag v-if="ticketClinicRef.discountType === 'VNĐ'" color="green">
              {{ formatMoney(ticketClinicRef.discountMoney) }}
            </VueTag>
            <VueTag v-if="ticketClinicRef.discountType === '%'" color="green">
              {{ ticketClinicRef.discountPercent || 0 }}%
            </VueTag>
          </td>
          <td class="text-center">
            <a
              v-if="
                ![TicketStatus.Debt, TicketStatus.Completed].includes(
                  ticketClinicRef.ticketStatus,
                ) && permissionIdMap[PermissionId.TICKET_CLINIC_CHANGE_DISCOUNT]
              "
              class="text-orange-500"
              @click="modalTicketClinicChangeDiscount?.openModal()"
            >
              <IconEditSquare width="20" height="20" />
            </a>
          </td>
        </tr>
        <tr>
          <td class="uppercase text-right font-bold" colspan="8">Tổng tiền</td>
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
