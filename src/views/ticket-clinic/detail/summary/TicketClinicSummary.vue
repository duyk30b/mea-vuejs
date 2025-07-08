<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../../common/VueButton.vue'
import VueTag from '../../../../common/VueTag.vue'
import { IconFileSync, IconMore } from '../../../../common/icon-antd'
import { IconDelete, IconEditSquare } from '../../../../common/icon-google'
import VueDropdown from '../../../../common/popover/VueDropdown.vue'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { CONFIG } from '../../../../config'
import { MeService } from '../../../../modules/_me/me.service'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { DeliveryStatus, PaymentViewType } from '../../../../modules/enum'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { PrintHtmlService, compiledTemplatePrintHtml } from '../../../../modules/print-html'
import { TicketStatus } from '../../../../modules/ticket'
import {
  TicketClinicApi,
  TicketClinicProductApi,
  ticketClinicRef,
} from '../../../../modules/ticket-clinic'
import { TicketRadiologyStatus } from '../../../../modules/ticket-radiology'
import { ESDom } from '../../../../utils'
import ModalTicketReturnProduct from '../../../ticket-base/ModalTicketReturnProduct.vue'
import ModalTicketClinicPayment from '../modal/ModalTicketClinicPayment.vue'
import ModalTicketClinicChangeDiscount from './ModalTicketClinicChangeDiscount.vue'
import TicketClinicSummaryLaboratory from './TicketClinicSummaryLaboratory.vue'
import TicketClinicSummaryProcedure from './TicketClinicSummaryProcedure.vue'
import TicketClinicSummaryProduct from './TicketClinicSummaryProduct.vue'
import TicketClinicSummaryRadiology from './TicketClinicSummaryRadiology.vue'

const modalTicketClinicPayment = ref<InstanceType<typeof ModalTicketClinicPayment>>()
const modalTicketReturnProduct = ref<InstanceType<typeof ModalTicketReturnProduct>>()
const modalTicketClinicChangeDiscount = ref<InstanceType<typeof ModalTicketClinicChangeDiscount>>()

const route = useRoute()
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, organizationPermission, organization } = MeService

const sendProductLoading = ref(false)

const disableSendProduct = computed(() => {
  // chỉ được phép khi ở trạng thái đang khám (Executing)
  if (ticketClinicRef.value.status !== TicketStatus.Executing) {
    return true
  }
  // chỉ được phép khi có hàng chưa gửi (Pending)
  if (ticketClinicRef.value.deliveryStatus !== DeliveryStatus.Pending) {
    return true
  }

  return false
})

const validateQuantity = () => {
  if (settingStore.PRODUCT_SETTING.allowNegativeQuantity) {
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

    if (product?.warehouseIds === '[]') continue

    if (ticketProductUnsent.quantity > (product?.quantity || 0)) {
      AlertStore.addError(
        `Sản phẩm ${product?.brandName} không đủ ` +
          `(tồn ${product?.quantity || 0} - lấy ${ticketProductUnsent.quantity})`,
      )
      return false
    } else if (
      batch &&
      ticketProductUnsent.batchId &&
      ticketProductUnsent.quantity > batch!.quantity
    ) {
      AlertStore.addError(
        `Lô hàng: ${product!.brandName} không đủ, còn ${batch!.quantity} lấy ${
          ticketProductUnsent.quantity
        }`,
      )
    }
  }
  return true
}

const startSendProduct = async () => {
  sendProductLoading.value = true
  try {
    if (!validateQuantity()) return

    const ticketProductUnsentList = [
      ...(ticketClinicRef.value.ticketProductConsumableList || []),
      ...(ticketClinicRef.value.ticketProductPrescriptionList || []),
    ].filter((i) => {
      return i.deliveryStatus === DeliveryStatus.Pending
    })

    await TicketClinicProductApi.sendProduct({
      ticketId: ticketClinicRef.value.id,
      ticketProductIdList: ticketProductUnsentList.map((i) => i.id),
    })
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
  if ([TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.value.status)) {
    return ModalStore.alert({
      title: 'Phiếu khám đã đóng',
      content: ['- Bắt buộc MỞ LẠI hồ sơ trước khi HỦY phiếu khám'],
    })
  }

  if (ticketClinicRef.value.deliveryStatus === DeliveryStatus.Delivered) {
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

const clickRefundOverpaid = () => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.status)) {
    return ModalStore.alert({
      title: 'Trạng thái hồ sơ không hợp lệ ?',
      content: 'Cần mở lại hồ sơ trước khi hoàn trả tiền',
    })
  } else {
    modalTicketClinicPayment.value?.openModal(PaymentViewType.RefundOverpaid)
  }
}

const clickReturnProduct = () => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.status)) {
    return ModalStore.alert({
      title: 'Trạng thái hồ sơ không hợp lệ ?',
      content: 'Cần mở lại hồ sơ trước khi hoàn trả thuốc - vật tư',
    })
  } else {
    modalTicketReturnProduct.value?.openModal(ticketClinicRef.value)
  }
}

const startPrint = async () => {
  try {
    const printHtmlHeader = await PrintHtmlService.getPrintHtmlHeader()
    const printHtmlInvoice = await PrintHtmlService.getPrintHtmlInvoice()
    if (!printHtmlHeader || !printHtmlInvoice || !printHtmlInvoice.html) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const compiledHeader = compiledTemplatePrintHtml({
      organization: organization.value,
      ticket: ticketClinicRef.value,
      masterData: {
        customer: ticketClinicRef.value.customer!,
      },
      printHtml: printHtmlHeader,
    })
    const compiledContent = compiledTemplatePrintHtml({
      organization: organization.value,
      ticket: ticketClinicRef.value,
      masterData: {
        customer: ticketClinicRef.value.customer!,
      },
      printHtml: printHtmlInvoice,
      _LAYOUT: {
        HEADER: compiledHeader.html,
      },
    })
    if (!compiledContent.html) {
      AlertStore.addError('Mẫu in không hợp lệ')
      return
    }
    await ESDom.startPrint('iframe-print', {
      html: compiledContent.html,
      cssList: [compiledHeader.css, compiledContent.css],
    })
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:297 ~ startPrint ~ error:', error)
  }
}
</script>
<template>
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
        [TicketStatus.Deposited, TicketStatus.Executing].includes(ticketClinicRef.status) &&
        ticketClinicRef.paid > ticketClinicRef.totalMoney
      "
      icon="dollar"
      color="green"
      @click="clickRefundOverpaid"
    >
      <span>HOÀN TIỀN</span>
    </VueButton>
    <VueDropdown>
      <template #trigger>
        <div class="vue-circle">
          <IconMore style="font-size: 1.5rem; font-weight: bold" />
        </div>
      </template>
      <div class="vue-menu">
        <a @click="clickReturnProduct">
          <span class="text-red-500">
            <IconFileSync />
            Hoàn trả thuốc - vật tư
          </span>
        </a>
        <a
          v-if="[TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.status)"
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
      <TicketClinicSummaryProcedure v-if="organizationPermission[PermissionId.PROCEDURE]" />
      <TicketClinicSummaryLaboratory v-if="organizationPermission[PermissionId.LABORATORY]" />
      <TicketClinicSummaryRadiology v-if="organizationPermission[PermissionId.RADIOLOGY]" />
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
                ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.status) &&
                userPermission[PermissionId.TICKET_CLINIC_CHANGE_DISCOUNT]
              "
              class="text-orange-500"
              @click="modalTicketClinicChangeDiscount?.openModal()"
            >
              <IconEditSquare width="20" height="20" />
            </a>
          </td>
          <td v-if="CONFIG.MODE === 'development'" class="text-right italic"></td>
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
