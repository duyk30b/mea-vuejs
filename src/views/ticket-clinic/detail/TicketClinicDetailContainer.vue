<script setup lang="ts">
import { onBeforeMount, onUnmounted, ref, watchEffect } from 'vue'
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
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import VueTabMenu from '../../../common/vue-tabs/VueTabMenu.vue'
import VueTabs from '../../../common/vue-tabs/VueTabs.vue'
import { CONFIG } from '../../../config'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer } from '../../../modules/customer'
import { DeliveryStatus } from '../../../modules/enum'
import { Laboratory, LaboratoryService } from '../../../modules/laboratory'
import { LaboratoryGroup, LaboratoryGroupService } from '../../../modules/laboratory-group'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Procedure, ProcedureService } from '../../../modules/procedure'
import { Radiology, RadiologyService } from '../../../modules/radiology'
import { Ticket, TicketStatus, TicketType } from '../../../modules/ticket'
import {
  TicketClinicApi,
  ticketClinicRef,
  ticketRefDeliveryStatus,
  useTicketClinicStore,
} from '../../../modules/ticket-clinic'
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
import TicketClinicPrescription from './prescription/TicketClinicPrescription.vue'
import TicketClinicProcedure from './procedure/TicketClinicProcedure.vue'
import TicketClinicRadiology from './radiology/TicketClinicRadiology.vue'
import ModalTicketClinicDetailSetting from './setting/ModalTicketClinicDetailSetting.vue'
import TicketClinicSummary from './summary/TicketClinicSummary.vue'
import TicketClinicUser from './user/TicketClinicUser.vue'

const modalTicketClinicHistory = ref<InstanceType<typeof ModalTicketClinicHistory>>()
const modalTicketClinicDetailSetting = ref<InstanceType<typeof ModalTicketClinicDetailSetting>>()

const route = useRoute()
const router = useRouter()
const meStore = useMeStore()
const settingStore = useSettingStore()
const ticketClinicStore = useTicketClinicStore()
const { permissionIdMap } = meStore
const { formatMoney } = settingStore
const childComponent = ref<any>(null)

const procedureMap = ref<Record<string, Procedure>>({})
const laboratoryMap = ref<Record<string, Laboratory>>({})
const laboratoryGroupMap = ref<Record<string, LaboratoryGroup>>({})
const radiologyMap = ref<Record<string, Radiology>>({})

onBeforeMount(async () => {
  const ticketId = Number(route.params.id)
  if (ticketId) {
    await startFetchData(ticketId)
  } else {
    ticketClinicRef.value = Ticket.blank()
    ticketClinicRef.value.ticketType = settingStore.TICKET_CLINIC_LIST.ticketType
    ticketClinicRef.value.customer = Customer.init()
  }

  const fetchData = await Promise.all([
    ProcedureService.getMap(),
    LaboratoryService.getMap(),
    LaboratoryGroupService.getMap(),
    RadiologyService.getMap(),
  ])
  procedureMap.value = fetchData[0]
  laboratoryMap.value = fetchData[1]
  laboratoryGroupMap.value = fetchData[2]
  radiologyMap.value = fetchData[3]
})

onUnmounted(async () => {
  ticketClinicRef.value = Ticket.blank()
})

watchEffect(() => {
  Ticket.refreshTreeData(ticketClinicRef.value, {
    procedureMap: procedureMap.value,
    laboratoryMap: laboratoryMap.value,
    laboratoryGroupMap: laboratoryGroupMap.value,
    radiologyMap: radiologyMap.value,
  })
})

const startFetchData = async (ticketId: number) => {
  try {
    const ticketData = await ticketClinicStore.detail(ticketId, {
      relation: {
        customer: true,
        customerPaymentList: false, // query khi bật modal thanh toán

        ticketAttributeList: true,
        // ticketProductList: true,
        ticketProductConsumableList: { product: true },
        ticketProductPrescriptionList: { product: true },
        ticketBatchList: CONFIG.MODE === 'development' ? { batch: true } : undefined,
        ticketProcedureList: {},
        ticketLaboratoryList: {},
        ticketLaboratoryGroupList: {},
        ticketLaboratoryResultList: true,
        ticketRadiologyList: {},
        ticketUserList: {},
        toAppointment: true,
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

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'SETTING_DATA') {
    modalTicketClinicDetailSetting.value?.openModal()
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
  if (ticketRefDeliveryStatus.value === DeliveryStatus.Pending) {
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
    <div class="page-header-setting">
      <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]" trigger="click">
        <span>
          <IconSetting />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <!-- <a-menu-item key="screen-setting">Cài đặt hiển thị</a-menu-item> -->
            <a-menu-item key="SETTING_DATA">Cài đặt dữ liệu</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>
  <div class="mt-4 md:mx-4 flex flex-wrap gap-4">
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
                ticketClinicRef.ticketStatus,
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
              style="padding: 6px 12px"
              :tabKey="TicketClinicLaboratory.__name!"
              @active="router.push({ name: TicketClinicLaboratory.__name })"
            >
              <IconLabPanel />
              Xét nghiệm
            </VueTabMenu>
            <VueTabMenu
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
      <TicketClinicUserList />
      <div class="mt-4 w-full flex flex-col px-1 gap-4">
        <VueButton
          v-if="
            [TicketStatus.Schedule, TicketStatus.Draft, TicketStatus.Prepayment].includes(
              ticketClinicRef.ticketStatus,
            ) &&
            permissionIdMap[PermissionId.TICKET_CLINIC_START_CHECKUP] &&
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
          v-if="!ticketClinicRef.id && permissionIdMap[PermissionId.TICKET_CLINIC_START_CHECKUP]"
          color="blue"
          size="default"
          style="margin-left: -4px; margin-right: -4px"
          @click="startRegisterExecuting"
        >
          <IconLogin />
          ĐĂNG KÝ KHÁM
        </VueButton>
        <VueButton
          v-if="permissionIdMap[PermissionId.TICKET_CLINIC_CLOSE]"
          color="blue"
          size="default"
          style="margin-left: -4px; margin-right: -4px"
          :disabled="![TicketStatus.Executing].includes(ticketClinicRef.ticketStatus)"
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
