<script setup lang="ts">
import { VueButton } from '@/common'
import {
  IconContacts,
  IconDelete,
  IconDisconnect,
  IconDollar,
  IconFileSearch,
  IconFileSync,
  IconLogin,
  IconMore,
  IconOneToOne,
  IconPicCenter,
  IconSetting,
  IconUser,
} from '@/common/icon-antd'
import {
  IconEyeGlasses,
  IconFluidMed,
  IconLabPanel,
  IconRadiology,
  IconStethoscope,
} from '@/common/icon-google'
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
import { Room, RoomService, RoomTicketStyle, ticketRoomRef } from '@/modules/room'
import { Ticket, TicketActionApi, TicketService, TicketStatus } from '@/modules/ticket'
import { TicketRadiologyStatus } from '@/modules/ticket-radiology'
import ModalCustomerDetail from '@/views/customer/detail/ModalCustomerDetail.vue'
import { computed, onBeforeMount, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalTicketPayment from '../../room-ticket-base/ModalTicketPayment.vue'
import ModalTicketReturnProduct from '../../room-ticket-base/ModalTicketReturnProduct.vue'
import ModalTicketClinicHistory from '../history/ModalTicketClinicHistory.vue'
import TicketClinicConsumableContainer from './consumable/TicketClinicConsumableContainer.vue'
import TicketClinicDiagnosis from './diagnosis/TicketClinicDiagnosis.vue'
import TicketClinicDiagnosisEyeSpecial from './diagnosis/TicketClinicDiagnosisEyeSpecial.vue'
import TicketClinicLaboratoryContainer from './laboratory/TicketClinicLaboratoryContainer.vue'
import ModalTicketClinicDetailSetting from './modal/ModalTicketClinicDetailSetting.vue'
import TicketClinicPrescriptionContainer from './prescription/TicketClinicPrescriptionContainer.vue'
import TicketClinicProcedureContainer from './procedure/TicketClinicProcedureContainer.vue'
import TicketClinicRadiologyContainer from './radiology/TicketClinicRadiologyContainer.vue'
import TicketClinicSummaryContainer from './summary/TicketClinicSummaryContainer.vue'
import TicketClinicUserContainer from './user/TicketClinicUserContainer.vue'
import { TicketUserService } from '@/modules/ticket-user'

const modalTicketClinicDetailSetting = ref<InstanceType<typeof ModalTicketClinicDetailSetting>>()
const modalTicketClinicHistory = ref<InstanceType<typeof ModalTicketClinicHistory>>()
const modalTicketPayment = ref<InstanceType<typeof ModalTicketPayment>>()
const modalTicketReturnProduct = ref<InstanceType<typeof ModalTicketReturnProduct>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()

const route = useRoute()
const router = useRouter()
const settingStore = useSettingStore()
const { userPermission, organizationPermission } = MeService
const { formatMoney } = settingStore

const roomMap = RoomService.roomMap
const currentRoom = ref<Room>(Room.blank())

const ticketLoaded = ref(false)

const sendProductLoading = ref(false)

watch(
  () => route.params.roomId,
  async (newValue) => {
    const roomId = Number(newValue) || 0
    await RoomService.getMap()
    currentRoom.value = roomMap.value[roomId]
    if (!currentRoom.value) {
      currentRoom.value = Room.blank()
      AlertStore.addError('Phòng khám không hợp lệ')
    }
    startFetchData()
  },
  { immediate: true },
)

onBeforeMount(async () => {
  const ticketId = route.params.ticketId as string
  await startFetchData(ticketId)

  ticketLoaded.value = true
})

onUnmounted(async () => {
  ticketRoomRef.value = Ticket.blank()
  ticketLoaded.value = false
})

const startFetchData = async (ticketId?: string) => {
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
        ticketProductList: true,
        ticketBatchList: CONFIG.MODE === 'development' ? { batch: true } : undefined,
        ticketProcedureList: true,
        ticketRegimenList: true,
        ticketRegimenItemList: true,
        ticketLaboratoryList: true,
        ticketLaboratoryGroupList: true,
        ticketLaboratoryResultList: true,
        ticketRadiologyList: true,
        ticketUserList: true,
        toAppointment: organizationPermission.value[PermissionId.APPOINTMENT] ? true : undefined,
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
          id: '',
          ticketId: ticketData.id,
        },
      ]
      ticketData.ticketAttributeMap = { healthHistory }
    }
    ticketRoomRef.value = ticketData
    await TicketUserService.refreshRelation(ticketData.ticketUserList || [])
    ticketData.refreshTreeData()
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
  // if (
  //   (ticketRoomRef.value.ticketLaboratoryList || []).find(
  //     (i) => i.status === TicketLaboratoryStatus.Pending
  //   )
  // ) {
  //   return ModalStore.alert({
  //     title: 'Phiếu xét nghiệm vẫn chưa được thực hiện ?',
  //     content: 'Cần trả kết quả xét nghiệm trước khi đóng phiếu khám',
  //   })
  // }
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
        : ['- Hồ sơ này sẽ quay lại trạng thái: "Đang điều trị"']),
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
      router.push({ name: 'RoomTicketClinic', params: { roomId: route.params.roomId } })
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
  <ModalTicketClinicDetailSetting ref="modalTicketClinicDetailSetting" />
  <ModalTicketPayment ref="modalTicketPayment" />
  <ModalTicketReturnProduct ref="modalTicketReturnProduct" />
  <ModalTicketClinicHistory ref="modalTicketClinicHistory" />
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
        <VueButton
          size="small"
          @click="modalTicketClinicHistory?.openModal(ticketRoomRef.customer!)"
        >
          Lịch sử khám
        </VueButton>
      </div>
      <div class="flex items-center gap-2 flex-wrap"></div>
    </div>

    <div class="mr-2 flex flex-wrap items-center gap-4">
      <div>
        <span>{{ formatMoney(ticketRoomRef.paid) }}</span>
        /
        <span>{{ formatMoney(ticketRoomRef.totalMoney) }}</span>
      </div>
      <div v-if="CONFIG.MODE === 'development'" style="color: violet">
        Cost {{ formatMoney(ticketRoomRef.itemsCostAmount) }} - Commission
        {{ formatMoney(ticketRoomRef.commissionMoney) }}
      </div>
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
            @click="modalTicketClinicDetailSetting?.openModal()"
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
          :tabKey="TicketClinicDiagnosis.__name!"
          style="padding: 6px 12px"
          @active="router.push({ name: TicketClinicDiagnosis.__name })"
        >
          <IconStethoscope />
          Khám
        </VueTabMenu>
        <template
          v-if="
            [TicketStatus.Executing, TicketStatus.Debt, TicketStatus.Completed].includes(
              ticketRoomRef.status,
            )
          "
        >
          <VueTabMenu
            v-if="currentRoom.roomStyle === RoomTicketStyle.TicketClinicEye"
            style="padding: 6px 12px"
            :tabKey="TicketClinicDiagnosisEyeSpecial.__name!"
            @active="router.push({ name: TicketClinicDiagnosisEyeSpecial.__name })"
          >
            <IconEyeGlasses />
            Đo thị lực
          </VueTabMenu>
        </template>
        <VueTabMenu
          :tabKey="TicketClinicProcedureContainer.__name!"
          style="padding: 6px 12px"
          @active="router.push({ name: TicketClinicProcedureContainer.__name })"
        >
          <IconFluidMed />
          Dịch vụ
        </VueTabMenu>
        <template
          v-if="
            [TicketStatus.Executing, TicketStatus.Debt, TicketStatus.Completed].includes(
              ticketRoomRef.status,
            )
          "
        >
          <VueTabMenu
            style="padding: 6px 12px"
            :tabKey="TicketClinicConsumableContainer.__name!"
            @active="router.push({ name: TicketClinicConsumableContainer.__name })"
          >
            <IconOneToOne />
            Vật tư
          </VueTabMenu>
          <VueTabMenu
            style="padding: 6px 12px"
            :tabKey="TicketClinicLaboratoryContainer.__name!"
            @active="router.push({ name: TicketClinicLaboratoryContainer.__name })"
          >
            <IconLabPanel />
            Xét nghiệm
          </VueTabMenu>
          <VueTabMenu
            style="padding: 6px 12px"
            :tabKey="TicketClinicRadiologyContainer.__name!"
            @active="router.push({ name: TicketClinicRadiologyContainer.__name })"
          >
            <IconRadiology />
            CĐHA
          </VueTabMenu>
          <VueTabMenu
            style="padding: 6px 12px"
            :tabKey="TicketClinicPrescriptionContainer.__name!"
            @active="router.push({ name: TicketClinicPrescriptionContainer.__name })"
          >
            <IconDisconnect />
            Đơn thuốc
          </VueTabMenu>
          <VueTabMenu
            style="padding: 6px 12px"
            :tabKey="TicketClinicUserContainer.__name!"
            @active="router.push({ name: TicketClinicUserContainer.__name })"
          >
            <IconUser />
            Nhân Viên
          </VueTabMenu>
          <VueTabMenu
            style="padding: 6px 12px"
            :tabKey="TicketClinicSummaryContainer.__name!"
            @active="router.push({ name: TicketClinicSummaryContainer.__name })"
          >
            <IconPicCenter />
            Tổng kết
          </VueTabMenu>
        </template>
      </template>
    </VueTabs>
    <RouterView v-slot="{ Component }">
      <KeepAlive
        :include="
          [
            TicketClinicDiagnosis.__name,
            TicketClinicDiagnosisEyeSpecial.__name,
            TicketClinicProcedureContainer.__name,
            TicketClinicConsumableContainer.__name,
            TicketClinicLaboratoryContainer.__name,
            TicketClinicRadiologyContainer.__name,
            TicketClinicPrescriptionContainer.__name,
          ].join(',')
        "
      >
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </div>
</template>

<style lang="scss" scoped></style>
