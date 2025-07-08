<script setup lang="ts">
import { UserRoleService } from '@/modules/user-role'
import { onBeforeMount, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import {
  IconContacts,
  IconDisconnect,
  IconLogin,
  IconOneToOne,
  IconPicCenter,
  IconSave,
  IconSetting,
  IconUser,
} from '../../../common/icon-antd'
import {
  IconEyeGlasses,
  IconFluidMed,
  IconLabPanel,
  IconRadiology,
  IconStethoscope,
} from '../../../common/icon-google'
import VueDropdown from '../../../common/popover/VueDropdown.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import VueTabMenu from '../../../common/vue-tabs/VueTabMenu.vue'
import VueTabs from '../../../common/vue-tabs/VueTabs.vue'
import { CONFIG } from '../../../config'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer } from '../../../modules/customer'
import { DeliveryStatus } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Ticket, TicketService, TicketStatus, TicketType } from '../../../modules/ticket'
import { TicketClinicApi, ticketClinicRef } from '../../../modules/ticket-clinic'
import { TicketRadiologyStatus } from '../../../modules/ticket-radiology'
import ModalTicketClinicHistory from '../history/ModalTicketClinicHistory.vue'
import TicketClinicDiagnosisEyeBasic from './TicketClinicDiagnosisEyeBasic.vue'
import TicketClinicDiagnosisEyeSpecial from './TicketClinicDiagnosisEyeSpecial.vue'
import TicketClinicDiagnosisGeneral from './TicketClinicDiagnosisGeneral.vue'
import TicketClinicDiagnosisObstetric from './TicketClinicDiagnosisObstetric.vue'
import TicketClinicInformation from './TicketClinicInformation.vue'
import TicketClinicUserList from './TicketClinicUserList.vue'
import TicketClinicConsumable from './consumable/TicketClinicConsumable.vue'
import TicketClinicLaboratory from './laboratory/TicketClinicLaboratory.vue'
import ModalTicketClinicDetailSetting from './modal/ModalTicketClinicDetailSetting.vue'
import TicketClinicPrescription from './prescription/TicketClinicPrescription.vue'
import TicketClinicProcedure from './procedure/TicketClinicProcedure.vue'
import TicketClinicRadiology from './radiology/TicketClinicRadiology.vue'
import TicketClinicSummary from './summary/TicketClinicSummary.vue'
import TicketClinicUser from './user/TicketClinicUser.vue'

const modalTicketClinicHistory = ref<InstanceType<typeof ModalTicketClinicHistory>>()
const modalTicketClinicDetailSetting = ref<InstanceType<typeof ModalTicketClinicDetailSetting>>()

const route = useRoute()
const router = useRouter()
const settingStore = useSettingStore()
const { userPermission, organizationPermission } = MeService
const { formatMoney } = settingStore
const childComponent = ref<any>(null)

const ticketLoaded = ref(false)

onBeforeMount(async () => {
  const ticketId = Number(route.params.id)
  await startFetchData(ticketId)

  ticketLoaded.value = true
  await Promise.all([UserRoleService.reloadMap(), ticketClinicRef.value.refreshUserAndRole()])
})

onUnmounted(async () => {
  ticketClinicRef.value = Ticket.blank()
  ticketLoaded.value = false
})

const startFetchData = async (ticketId?: number) => {
  if (!ticketId) {
    ticketClinicRef.value = Ticket.blank()
    ticketClinicRef.value.ticketType = settingStore.TICKET_CLINIC_LIST.ticketType
    ticketClinicRef.value.customer = Customer.init()
    return
  }

  try {
    const ticketData = await TicketService.detail(ticketId, {
      relation: {
        customer: true,
        paymentList: false, // query khi bật modal thanh toán

        ticketAttributeList: true,
        // ticketProductList: true,
        ticketProductConsumableList: {},
        ticketProductPrescriptionList: {},
        ticketBatchList: CONFIG.MODE === 'development' ? { batch: true } : undefined,
        ticketProcedureList: organizationPermission.value[PermissionId.PROCEDURE] ? {} : false,
        ticketLaboratoryList: organizationPermission.value[PermissionId.LABORATORY] ? {} : false,
        ticketLaboratoryGroupList: organizationPermission.value[PermissionId.LABORATORY]
          ? {}
          : false,
        ticketLaboratoryResultList: organizationPermission.value[PermissionId.LABORATORY]
          ? true
          : false,
        ticketRadiologyList: organizationPermission.value[PermissionId.RADIOLOGY] ? {} : false,
        ticketUserList: organizationPermission.value[PermissionId.POSITION] ? {} : false,
        toAppointment: organizationPermission.value[PermissionId.APPOINTMENT] ? true : false,
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
    ticketClinicRef.value = ticketData
  } catch (error) {
    console.log('🚀 ~ file: InvoiceDetails.vue:51 ~ error:', error)
  }
}

const handleChangeTabs = (activeKey: any) => {}

const startCheckup = async () => {
  await TicketClinicApi.startCheckup({ ticketId: ticketClinicRef.value.id })
}

const startRegisterExecuting = async () => {
  // if (childComponent.value?.getDataTicketDiagnosis) {
  //   const data = childComponent.value.getDataTicketDiagnosis()
  //   ticketDiagnosis = data.ticketDiagnosis || TicketDiagnosis.blank()
  // }

  // ticketClinicRef.value = await TicketClinicApi.registerExecuting({
  //   customerId: ticketClinicRef.value.customerId,
  //   ticketType: ticketClinicRef.value.ticketType,
  //   registeredAt: Date.now(),
  //   diagnosisBasic: {
  //     reason: ticketDiagnosis?.reason || '',
  //     healthHistory: ticketDiagnosis?.healthHistory || '',
  //     general: ticketDiagnosis?.general || '',
  //     regional: ticketDiagnosis?.regional || '',
  //     summary: ticketDiagnosis?.summary || '',
  //     diagnosis: ticketDiagnosis?.diagnosis || '',
  //   },
  // })
  router.replace({
    path: route.path.replace(/\/detail\/\d+/, `/detail/${ticketClinicRef.value.id}`),
  })
}

const startCloseVisit = async () => {
  await TicketClinicApi.close(ticketClinicRef.value.id)
}

const clickCloseVisit = () => {
  if (ticketClinicRef.value.deliveryStatus === DeliveryStatus.Pending) {
    return ModalStore.alert({
      title: 'Thuốc vẫn chưa xuất hết ?',
      content: [
        '- Cần xuất thuốc và vật tư trước khi đóng phiếu khám',
        '- Khách hàng không lấy thuốc có thể chọn số lượng mua = 0',
      ],
    })
  }
  if (
    (ticketClinicRef.value.ticketRadiologyList || []).find(
      (i) => i.status == TicketRadiologyStatus.Pending,
    )
  ) {
    return ModalStore.alert({
      title: 'Phiếu chẩn đoán hình ảnh vẫn chưa thực hiện ?',
      content: 'Cần thực hiện phiếu CĐHA trước khi đóng phiếu khám',
    })
  }
  // if (
  //   (ticketClinicRef.value.ticketLaboratoryList || []).find(
  //     (i) => i.status === TicketLaboratoryStatus.Pending
  //   )
  // ) {
  //   return ModalStore.alert({
  //     title: 'Phiếu xét nghiệm vẫn chưa được thực hiện ?',
  //     content: 'Cần trả kết quả xét nghiệm trước khi đóng phiếu khám',
  //   })
  // }
  if (ticketClinicRef.value.paid > ticketClinicRef.value.totalMoney) {
    return ModalStore.alert({
      title: 'Khách hàng còn thừa tiền tạm ứng',
      content: 'Cần hoàn trả tiền thừa trước khi đóng hồ sơ',
    })
  }

  if (ticketClinicRef.value.debt) {
    return ModalStore.confirm({
      title: 'Đóng phiếu khám khi khách hàng chưa thanh toán đủ ?',
      content: [
        '- Vẫn đóng phiếu khám.',
        `- Ghi nợ khách hàng: ${formatMoney(ticketClinicRef.value?.debt || 0)}.`,
      ],
      okText: 'Xác nhận Đóng phiếu',
      async onOk() {
        await startCloseVisit()
      },
    })
  }

  startCloseVisit()
}
</script>

<template>
  <ModalTicketClinicDetailSetting ref="modalTicketClinicDetailSetting" />
  <ModalTicketClinicHistory ref="modalTicketClinicHistory" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="flex items-center gap-2 flex-wrap">
        <IconContacts />
        {{ ticketClinicRef.customer?.fullName }}
        <VueButton
          size="small"
          @click="modalTicketClinicHistory?.openModal(ticketClinicRef.customer!)"
        >
          Lịch sử khám
        </VueButton>
      </div>
    </div>
    <div class="mr-2 flex items-center gap-8">
      <VueDropdown>
        <template #trigger>
          <span style="font-size: 1.2rem; cursor: pointer">
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
  <div v-if="ticketLoaded" class="mt-4 md:mx-4 flex flex-wrap gap-4">
    <div style="flex-basis: 600px; flex-grow: 3; max-width: 100%" class="px-4 pt-2 pb-4 bg-white">
      <VueTabs :tabShow="String(route.name)" @update:tabShow="handleChangeTabs">
        <template #menu>
          <VueTabMenu
            v-if="ticketClinicRef.ticketType === TicketType.Clinic"
            :tabKey="TicketClinicDiagnosisGeneral.__name!"
            style="padding: 6px 12px"
            @active="router.push({ name: TicketClinicDiagnosisGeneral.__name })"
          >
            <IconStethoscope />
            Khám
          </VueTabMenu>
          <VueTabMenu
            v-if="ticketClinicRef.ticketType === TicketType.Obstetric"
            style="padding: 6px 12px"
            :tabKey="TicketClinicDiagnosisObstetric.__name!"
            @active="router.push({ name: TicketClinicDiagnosisObstetric.__name })"
          >
            <IconStethoscope />
            Khám
          </VueTabMenu>
          <VueTabMenu
            v-if="ticketClinicRef.ticketType === TicketType.Eye"
            style="padding: 6px 12px"
            :tabKey="TicketClinicDiagnosisEyeBasic.__name!"
            @active="router.push({ name: TicketClinicDiagnosisEyeBasic.__name })"
          >
            <IconStethoscope />
            Khám mắt
          </VueTabMenu>
          <template
            v-if="
              [TicketStatus.Executing, TicketStatus.Debt, TicketStatus.Completed].includes(
                ticketClinicRef.status,
              )
            "
          >
            <VueTabMenu
              v-if="ticketClinicRef.ticketType === TicketType.Eye"
              style="padding: 6px 12px"
              :tabKey="TicketClinicDiagnosisEyeSpecial.__name!"
              @active="router.push({ name: TicketClinicDiagnosisEyeSpecial.__name })"
            >
              <IconEyeGlasses />
              Đo thị lực
            </VueTabMenu>
            <VueTabMenu
              v-if="organizationPermission[PermissionId.PROCEDURE]"
              :tabKey="TicketClinicProcedure.__name!"
              style="padding: 6px 12px"
              @active="router.push({ name: TicketClinicProcedure.__name })"
            >
              <IconFluidMed />
              Dịch vụ
            </VueTabMenu>
            <VueTabMenu
              style="padding: 6px 12px"
              :tabKey="TicketClinicConsumable.__name!"
              @active="router.push({ name: TicketClinicConsumable.__name })"
            >
              <IconOneToOne />
              Vật tư
            </VueTabMenu>
            <VueTabMenu
              v-if="organizationPermission[PermissionId.LABORATORY]"
              style="padding: 6px 12px"
              :tabKey="TicketClinicLaboratory.__name!"
              @active="router.push({ name: TicketClinicLaboratory.__name })"
            >
              <IconLabPanel />
              Xét nghiệm
            </VueTabMenu>
            <VueTabMenu
              v-if="organizationPermission[PermissionId.RADIOLOGY]"
              style="padding: 6px 12px"
              :tabKey="TicketClinicRadiology.__name!"
              @active="router.push({ name: TicketClinicRadiology.__name })"
            >
              <IconRadiology />
              CĐHA
            </VueTabMenu>
            <VueTabMenu
              style="padding: 6px 12px"
              :tabKey="TicketClinicPrescription.__name!"
              @active="router.push({ name: TicketClinicPrescription.__name })"
            >
              <IconDisconnect />
              Đơn thuốc
            </VueTabMenu>
            <VueTabMenu
              v-if="organizationPermission[PermissionId.POSITION]"
              style="padding: 6px 12px"
              :tabKey="TicketClinicUser.__name!"
              @active="router.push({ name: TicketClinicUser.__name })"
            >
              <IconUser />
              Nhân Viên
            </VueTabMenu>
            <VueTabMenu
              style="padding: 6px 12px"
              :tabKey="TicketClinicSummary.__name!"
              @active="router.push({ name: TicketClinicSummary.__name })"
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
              TicketClinicDiagnosisGeneral.__name,
              TicketClinicDiagnosisObstetric.__name,
              TicketClinicDiagnosisEyeBasic.__name,
              TicketClinicDiagnosisEyeSpecial.__name,
              TicketClinicProcedure.__name,
              TicketClinicConsumable.__name,
              TicketClinicLaboratory.__name,
              TicketClinicRadiology.__name,
              TicketClinicPrescription.__name,
            ].join(',')
          "
        >
          <component :is="Component" ref="childComponent" />
        </KeepAlive>
      </RouterView>
    </div>
    <div style="flex-basis: 260px; flex-grow: 1" class="">
      <TicketClinicInformation />
      <TicketClinicUserList v-if="organizationPermission[PermissionId.POSITION]" />
      <div class="mt-4 w-full flex flex-col px-1 gap-4">
        <VueButton
          v-if="
            [TicketStatus.Schedule, TicketStatus.Draft, TicketStatus.Deposited].includes(
              ticketClinicRef.status,
            ) &&
            userPermission[PermissionId.TICKET_CLINIC_START_CHECKUP] &&
            !!ticketClinicRef.id
          "
          color="blue"
          size="default"
          style="margin-left: -4px; margin-right: -4px"
          @click="startCheckup"
        >
          <IconLogin />
          VÀO KHÁM
        </VueButton>
        <VueButton
          v-if="!ticketClinicRef.id && userPermission[PermissionId.TICKET_CLINIC_START_CHECKUP]"
          color="blue"
          size="default"
          style="margin-left: -4px; margin-right: -4px"
          @click="startRegisterExecuting"
        >
          <IconLogin />
          ĐĂNG KÝ KHÁM
        </VueButton>
        <VueButton
          v-if="userPermission[PermissionId.TICKET_CLINIC_CLOSE]"
          color="blue"
          size="default"
          style="margin-left: -4px; margin-right: -4px"
          :disabled="![TicketStatus.Executing].includes(ticketClinicRef.status)"
          @click="clickCloseVisit"
        >
          <IconSave />
          ĐÓNG PHIẾU KHÁM
        </VueButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
