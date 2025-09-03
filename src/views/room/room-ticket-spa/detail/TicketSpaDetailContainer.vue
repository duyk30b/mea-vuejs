<script setup lang="ts">
import {
  IconContacts,
  IconDelete,
  IconDollar,
  IconFileSearch,
  IconFileSync,
  IconLogin,
  IconMore,
  IconOneToOne,
  IconPicCenter,
  IconSave,
  IconSetting,
} from '@/common/icon-antd'
import { IconFluidMed, IconStethoscope } from '@/common/icon-google'
import VueDropdown from '@/common/popover/VueDropdown.vue'
import { AlertStore } from '@/common/vue-alert'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import VueTabMenu from '@/common/vue-tabs/VueTabMenu.vue'
import VueTabs from '@/common/vue-tabs/VueTabs.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Customer } from '@/modules/customer'
import { DeliveryStatus, PaymentViewType, PickupStrategy } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ticketRoomRef } from '@/modules/room'
import { Ticket, TicketActionApi, TicketService, TicketStatus } from '@/modules/ticket'
import { TicketRadiologyStatus } from '@/modules/ticket-radiology'
import { UserRoleService } from '@/modules/user-role'
import { computed, onBeforeMount, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalTicketPayment from '../../room-ticket-base/ModalTicketPayment.vue'
import TicketSpaDiagnosis from './TicketSpaDiagnosis.vue'
import TicketSpaProcedure from './TicketSpaProcedure.vue'
import TicketSpaProduct from './TicketSpaProduct.vue'
import TicketSpaSummary from './TicketSpaSummary.vue'
import ModalTicketSpaDetailSetting from './modal/ModalTicketSpaDetailSetting.vue'
import { VueButton } from '@/common'
import ModalTicketReturnProduct from '../../room-ticket-base/ModalTicketReturnProduct.vue'
import ModalCustomerDetail from '@/views/customer/detail/ModalCustomerDetail.vue'

const modalTicketSpaDetailSetting = ref<InstanceType<typeof ModalTicketSpaDetailSetting>>()
const modalTicketPayment = ref<InstanceType<typeof ModalTicketPayment>>()
const modalTicketReturnProduct = ref<InstanceType<typeof ModalTicketReturnProduct>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()

const route = useRoute()
const router = useRouter()
const settingStore = useSettingStore()
const { userPermission, organizationPermission } = MeService
const { formatMoney } = settingStore

const ticketLoaded = ref(false)

const sendProductLoading = ref(false)

onBeforeMount(async () => {
  const ticketId = Number(route.params.ticketId)
  await startFetchData(ticketId)

  ticketLoaded.value = true
  await Promise.all([UserRoleService.getMapList(), ticketRoomRef.value.refreshUserAndRole()])
})

onUnmounted(async () => {
  ticketRoomRef.value = Ticket.blank()
  ticketLoaded.value = false
})

const startFetchData = async (ticketId?: number) => {
  if (!ticketId) {
    ticketRoomRef.value = Ticket.blank()
    ticketRoomRef.value.customer = Customer.init()
    return
  }

  try {
    const ticketData = await TicketService.detail(ticketId, {
      relation: {
        customer: true,
        paymentList: false, // query khi bật modal thanh toán

        ticketAttributeList: true,
        ticketProductList: {},
        // ticketProductConsumableList: {},
        // ticketProductPrescriptionList: {},
        ticketBatchList: CONFIG.MODE === 'development' ? { batch: true } : undefined,
        ticketProcedureList: organizationPermission.value[PermissionId.PROCEDURE]
          ? { relation: { ticketProcedureItemList: { imageList: true } } }
          : undefined,
        ticketLaboratoryList: organizationPermission.value[PermissionId.LABORATORY]
          ? {}
          : undefined,
        ticketLaboratoryGroupList: organizationPermission.value[PermissionId.LABORATORY]
          ? {}
          : undefined,
        ticketLaboratoryResultList: organizationPermission.value[PermissionId.LABORATORY]
          ? true
          : false,
        ticketRadiologyList: organizationPermission.value[PermissionId.RADIOLOGY] ? {} : undefined,
        ticketUserList: organizationPermission.value[PermissionId.MASTER_DATA_POSITION]
          ? {}
          : undefined,
        toAppointment: organizationPermission.value[PermissionId.APPOINTMENT] ? true : false,
        imageList: true,
      },
    })
    if (!ticketData.ticketProcedureList) ticketData.ticketProcedureList = []
    if (!ticketData.ticketProductList) ticketData.ticketProductList = []
    if (!ticketData.ticketLaboratoryList) ticketData.ticketLaboratoryList = []
    if (!ticketData.ticketRadiologyList) ticketData.ticketRadiologyList = []

    if (!ticketData.ticketAttributeList) {
      const healthHistory = ticketData.customer?.healthHistory || ''
      ticketData.ticketAttributeList = [
        {
          key: 'healthHistory',
          value: ticketData.customer?.healthHistory || '',
          id: 0,
          ticketId: ticketData.id,
        },
      ]
      ticketData.ticketAttributeMap = { healthHistory }
    }
    ticketRoomRef.value = ticketData
  } catch (error) {
    console.log('🚀 ~ file: InvoiceDetails.vue:51 ~ error:', error)
  }
}

const handleChangeTabs = (activeKey: any) => {}

const startExecuting = async () => {
  const response = await TicketActionApi.startExecuting({ ticketId: ticketRoomRef.value.id })
  Object.assign(ticketRoomRef.value.id, response.ticket)
}

const startCloseTicket = async () => {
  await TicketActionApi.close({ ticketId: ticketRoomRef.value.id })
}

const clickCloseTicket = () => {
  if (ticketRoomRef.value.deliveryStatus === DeliveryStatus.Pending) {
    return ModalStore.alert({
      title: 'Thuốc vẫn chưa xuất hết ?',
      content: [
        '- Cần xuất thuốc và vật tư trước khi đóng phiếu khám',
        '- Khách hàng không lấy thuốc có thể chọn số lượng mua = 0',
      ],
    })
  }
  if (
    (ticketRoomRef.value.ticketRadiologyList || []).find(
      (i) => i.status == TicketRadiologyStatus.Pending,
    )
  ) {
    return ModalStore.alert({
      title: 'Phiếu chẩn đoán hình ảnh vẫn chưa thực hiện ?',
      content: 'Cần thực hiện phiếu CĐHA trước khi đóng phiếu khám',
    })
  }
  if (ticketRoomRef.value.paid > ticketRoomRef.value.totalMoney) {
    return ModalStore.alert({
      title: 'Khách hàng còn thừa tiền tạm ứng',
      content: 'Cần hoàn trả tiền thừa trước khi đóng hồ sơ',
    })
  }
  if (ticketRoomRef.value.debt > 0) {
    return ModalStore.confirm({
      title: 'Đóng phiếu khám khi khách hàng chưa thanh toán đủ ?',
      content: [
        '- Vẫn đóng phiếu khám.',
        `- Ghi nợ khách hàng: ${formatMoney(ticketRoomRef.value?.debt || 0)}.`,
      ],
      okText: 'Xác nhận Đóng phiếu',
      async onOk() {
        await startCloseTicket()
      },
    })
  }

  startCloseTicket()
}

const disableSendProduct = computed(() => {
  // chỉ được phép khi ở trạng thái đang khám (Executing)
  if (ticketRoomRef.value.status !== TicketStatus.Executing) {
    return true
  }
  // chỉ được phép khi có hàng chưa gửi (Pending)
  if (ticketRoomRef.value.deliveryStatus !== DeliveryStatus.Pending) {
    return true
  }

  return false
})

const validateQuantity = () => {
  if (settingStore.PRODUCT_SETTING.allowNegativeQuantity) {
    return true
  }

  const ticketProductUnsentList = [
    ...(ticketRoomRef.value.ticketProductConsumableList || []),
    ...(ticketRoomRef.value.ticketProductPrescriptionList || []),
  ].filter((i) => {
    return i.deliveryStatus === DeliveryStatus.Pending
  })

  for (let i = 0; i < ticketProductUnsentList.length; i++) {
    const ticketProductUnsent = ticketProductUnsentList[i]
    const { product, batch } = ticketProductUnsent

    if (product?.warehouseIds === '[]') continue
    if (ticketProductUnsent.pickupStrategy === PickupStrategy.NoImpact) {
      continue
    }

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
      return false
    }
  }
  return true
}

const startSendProduct = async () => {
  sendProductLoading.value = true
  try {
    if (!validateQuantity()) return

    const ticketProductUnsentList = [
      ...(ticketRoomRef.value.ticketProductList || []),
      ...(ticketRoomRef.value.ticketProductConsumableList || []),
      ...(ticketRoomRef.value.ticketProductPrescriptionList || []),
    ].filter((i) => {
      return i.deliveryStatus === DeliveryStatus.Pending
    })

    await TicketActionApi.sendProduct({
      ticketId: ticketRoomRef.value.id,
      ticketProductIdList: ticketProductUnsentList.map((i) => i.id),
    })
  } catch (error) {
    console.log('🚀 ~ TicketClinicSummary.vue:184 ~ startSendProduct ~ error:', error)
  } finally {
    sendProductLoading.value = false
  }
}

const startReopenVisit = async () => {
  await TicketActionApi.reopen({ ticketId: ticketRoomRef.value.id })
}

const clickReopenTicket = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn mở lại hồ sơ của phiếu khám này ?',
    content: [
      ...(ticketRoomRef.value.debt > 0
        ? [
            `- Số tiền nợ sẽ được hoàn trả, khi đóng hồ sơ lại sẽ ghi nợ trở lại`,
            `- Trừ nợ khách hàng: ${formatMoney(ticketRoomRef.value.debt)}`,
          ]
        : ['- Hồ sơ này sẽ quay lại trạng thái: "Đang khám"']),
    ],
    async onOk() {
      await startReopenVisit()
    },
  })
}

const clickDestroyTicket = () => {
  if ([TicketStatus.Completed, TicketStatus.Debt].includes(ticketRoomRef.value.status)) {
    return ModalStore.alert({
      title: 'Phiếu khám đã đóng',
      content: ['- Bắt buộc MỞ LẠI hồ sơ trước khi HỦY phiếu khám'],
    })
  }

  if (ticketRoomRef.value.deliveryStatus === DeliveryStatus.Delivered) {
    return ModalStore.alert({
      title: 'Đã xuất thuốc - vật tư',
      content: ['- Bắt buộc HOÀN TRẢ thuốc và vật tư trước khi HỦY phiếu khám'],
    })
  }
  if (
    (ticketRoomRef.value.ticketRadiologyList || []).find(
      (i) => i.status == TicketRadiologyStatus.Completed,
    )
  ) {
    return ModalStore.alert({
      title: 'Phiếu chẩn đoán hình ảnh đã được thực hiện ?',
      content: 'Cần XÓA tất phiếu CĐHA đã hoàn thành trước khi HỦY phiếu khám',
    })
  }

  if (ticketRoomRef.value.paid > 0) {
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
      await TicketActionApi.destroy(ticketRoomRef.value.id)
      router.push({ name: 'RoomTicket', params: { roomId: route.params.roomId } })
    },
  })
}

const clickRefundOverpaid = () => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.value.status)) {
    return ModalStore.alert({
      title: 'Trạng thái hồ sơ không hợp lệ ?',
      content: 'Cần mở lại hồ sơ trước khi hoàn trả tiền',
    })
  } else {
    modalTicketPayment.value?.openModal({
      ticket: ticketRoomRef.value,
      paymentView: PaymentViewType.RefundOverpaid,
    })
  }
}

const clickReturnProduct = () => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.value.status)) {
    return ModalStore.alert({
      title: 'Trạng thái hồ sơ không hợp lệ ?',
      content: 'Cần mở lại hồ sơ trước khi hoàn trả thuốc - vật tư',
    })
  } else {
    modalTicketReturnProduct.value?.openModal(ticketRoomRef.value)
  }
}
</script>

<template>
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalTicketSpaDetailSetting ref="modalTicketSpaDetailSetting" />
  <ModalTicketPayment ref="modalTicketPayment" />
  <ModalTicketReturnProduct ref="modalTicketReturnProduct" />
  <div class="mx-4 mt-4 gap-4 flex flex-wrap items-center justify-between">
    <div class="flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2 text-xl font-medium">
        <IconContacts />
        <span>
          {{ ticketRoomRef.customer?.fullName }}
        </span>
        <span v-if="ticketRoomRef.customer!.id">
          <a @click="modalCustomerDetail?.openModal(ticketRoomRef.customerId)">
            <IconFileSearch />
          </a>
        </span>
      </div>
      <div class="flex items-center gap-2 flex-wrap"></div>
    </div>

    <div class="mr-2 flex flex-wrap items-center gap-4">
      <VueButton
        v-if="
          [TicketStatus.Schedule, TicketStatus.Draft, TicketStatus.Deposited].includes(
            ticketRoomRef.status,
          ) &&
          userPermission[PermissionId.TICKET_START_EXECUTING] &&
          !!ticketRoomRef.id
        "
        color="blue"
        size="default"
        style="margin-left: -4px; margin-right: -4px"
        @click="startExecuting"
      >
        <IconLogin />
        VÀO PHÒNG
      </VueButton>
      <VueButton
        v-if="
          [
            TicketStatus.Schedule,
            TicketStatus.Draft,
            TicketStatus.Deposited,
            TicketStatus.Executing,
          ].includes(ticketRoomRef.status)
        "
        color="green"
        icon="dollar"
        @click="
          modalTicketPayment?.openModal({
            ticket: ticketRoomRef,
            paymentView: PaymentViewType.Prepayment,
          })
        "
      >
        <span class="font-bold">TẠM ỨNG</span>
      </VueButton>
      <VueButton
        v-if="[TicketStatus.Debt].includes(ticketRoomRef.status)"
        color="green"
        icon="dollar"
        @click="
          modalTicketPayment?.openModal({
            ticket: ticketRoomRef,
            paymentView: PaymentViewType.PayDebt,
          })
        "
      >
        <span class="font-bold">TRẢ NỢ</span>
      </VueButton>
      <VueButton
        v-if="
          [TicketStatus.Completed, TicketStatus.Cancelled].includes(ticketRoomRef.status) &&
          ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status)
        "
        color="green"
        icon="dollar"
        @click="
          modalTicketPayment?.openModal({
            ticket: ticketRoomRef,
            paymentView: PaymentViewType.Success,
          })
        "
      >
        <span class="font-bold">THANH TOÁN</span>
      </VueButton>
      <VueButton
        v-if="
          [TicketStatus.Deposited, TicketStatus.Executing].includes(ticketRoomRef.status) &&
          ticketRoomRef.paid > ticketRoomRef.totalMoney &&
          userPermission[PermissionId.TICKET_REFUND_MONEY]
        "
        icon="dollar"
        color="green"
        @click="clickRefundOverpaid"
      >
        <span class="font-bold">HOÀN TIỀN</span>
      </VueButton>
      <VueButton
        v-if="
          userPermission[PermissionId.TICKET_CHANGE_PRODUCT_SEND_PRODUCT] &&
          ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status)
        "
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
        v-if="userPermission[PermissionId.TICKET_CLOSE]"
        color="blue"
        size="default"
        icon="save"
        style="margin-left: -4px; margin-right: -4px"
        :disabled="![TicketStatus.Executing].includes(ticketRoomRef.status)"
        @click="clickCloseTicket"
      >
        <span class="font-bold">KẾT THÚC</span>
      </VueButton>
      <VueDropdown>
        <template #trigger>
          <div class="vue-circle">
            <IconMore style="font-size: 1.5rem; font-weight: bold" />
          </div>
        </template>
        <div class="vue-menu">
          <a
            @click="clickRefundOverpaid"
            v-if="
              [TicketStatus.Deposited, TicketStatus.Executing].includes(ticketRoomRef.status) &&
              ticketRoomRef.paid <= ticketRoomRef.totalMoney &&
              userPermission[PermissionId.TICKET_REFUND_MONEY]
            "
          >
            <span class="text-red-500">
              <IconDollar />
              Hoàn tiền
            </span>
          </a>
          <a
            @click="clickReturnProduct"
            v-if="userPermission[PermissionId.TICKET_CHANGE_PRODUCT_RETURN_PRODUCT]"
          >
            <span class="text-red-500">
              <IconFileSync />
              Hoàn trả thuốc - vật tư
            </span>
          </a>
          <a
            v-if="
              [TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
              userPermission[PermissionId.TICKET_REOPEN]
            "
            @click="clickReopenTicket"
          >
            <span class="text-red-500">
              <IconFileSync />
              Mở lại phiếu
            </span>
          </a>
          <a @click="clickDestroyTicket" v-if="userPermission[PermissionId.TICKET_DESTROY]">
            <span class="text-red-500">
              <IconDelete />
              Xóa phiếu
            </span>
          </a>
        </div>
      </VueDropdown>
      <VueDropdown>
        <template #trigger>
          <span style="font-size: 1.4rem; cursor: pointer">
            <IconSetting />
          </span>
        </template>
        <div class="vue-menu">
          <a
            v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
            @click="modalTicketSpaDetailSetting?.openModal()"
          >
            Cài đặt dữ liệu
          </a>
        </div>
      </VueDropdown>
    </div>
  </div>
  <div v-if="!ticketLoaded" class="mt-4 md:mx-4 flex flex-wrap gap-4">
    <div class="vue-skeleton-loading mt-2"></div>
    <div class="vue-skeleton-loading mt-2"></div>
    <div class="vue-skeleton-loading mt-2"></div>
    <div class="vue-skeleton-loading mt-2"></div>
    <div class="vue-skeleton-loading mt-2"></div>
    <div class="vue-skeleton-loading mt-2"></div>
    <div class="vue-skeleton-loading mt-2"></div>
    <div class="vue-skeleton-loading mt-2"></div>
    <div class="vue-skeleton-loading mt-2"></div>
    <div class="vue-skeleton-loading mt-2"></div>
  </div>
  <div v-if="ticketLoaded" class="mt-4 md:mx-4 p-4 bg-white">
    <VueTabs :tabShow="String(route.name)" @update:tabShow="handleChangeTabs">
      <template #menu>
        <VueTabMenu
          :tabKey="TicketSpaDiagnosis.__name!"
          style="padding: 6px 12px"
          @active="router.push({ name: TicketSpaDiagnosis.__name })"
        >
          <IconStethoscope />
          Khám
        </VueTabMenu>
        <VueTabMenu
          v-if="organizationPermission[PermissionId.PROCEDURE]"
          :tabKey="TicketSpaProcedure.__name!"
          style="padding: 6px 12px"
          @active="router.push({ name: TicketSpaProcedure.__name })"
        >
          <IconFluidMed />
          Dịch vụ
        </VueTabMenu>
        <VueTabMenu
          style="padding: 6px 12px"
          :tabKey="TicketSpaProduct.__name!"
          @active="router.push({ name: TicketSpaProduct.__name })"
        >
          <IconOneToOne />
          Sản phẩm
        </VueTabMenu>
        <VueTabMenu
          style="padding: 6px 12px"
          :tabKey="TicketSpaSummary.__name!"
          @active="router.push({ name: TicketSpaSummary.__name })"
        >
          <IconPicCenter />
          Tổng kết
        </VueTabMenu>
      </template>
    </VueTabs>
    <RouterView v-slot="{ Component }">
      <KeepAlive
        :include="
          [TicketSpaDiagnosis.__name, TicketSpaProcedure.__name, TicketSpaProduct.__name].join(',')
        "
      >
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </div>
</template>

<style lang="scss" scoped></style>
