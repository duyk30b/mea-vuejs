<script setup lang="ts">
import {
  AuditOutlined,
  ContactsOutlined,
  ContainerOutlined,
  DisconnectOutlined,
  LoginOutlined,
  OneToOneOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { IconSetting } from '../../../common/icon'
import {
  IconEyeGlasses,
  IconFluidMed,
  IconRadiology,
  IconStethoscope,
} from '../../../common/icon-google'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import VueTabMenu from '../../../common/vue-tabs/VueTabMenu.vue'
import VueTabs from '../../../common/vue-tabs/VueTabs.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DeliveryStatus } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { TicketStatus, TicketType } from '../../../modules/ticket'
import {
  TicketClinicApi,
  ticketClinicRef,
  ticketRefDeliveryStatus,
  useTicketClinicStore,
} from '../../../modules/ticket-clinic'
import { TicketDiagnosis } from '../../../modules/ticket-diagnosis'
import TicketClinicConsumable from './TicketClinicConsumable.vue'
import TicketClinicDiagnosisBase from './TicketClinicDiagnosisBase.vue'
import TicketClinicDiagnosisEyeBasic from './TicketClinicDiagnosisEyeBasic.vue'
import TicketClinicDiagnosisEyeSpecial from './TicketClinicDiagnosisEyeSpecial.vue'
import TicketClinicInformation from './TicketClinicInformation.vue'
import TicketClinicPrescription from './TicketClinicPrescription.vue'
import TicketClinicProcedure from './TicketClinicProcedure.vue'
import TicketClinicRadiology from './TicketClinicRadiology.vue'
import TicketClinicSummary from './TicketClinicSummary.vue'
import ModalTicketClinicDetailSettingData from './setting/ModalTicketClinicDetailSettingData.vue'

const modalTicketClinicDetailSettingData =
  ref<InstanceType<typeof ModalTicketClinicDetailSettingData>>()

const route = useRoute()
const router = useRouter()
const meStore = useMeStore()
const settingStore = useSettingStore()
const ticketClinicStore = useTicketClinicStore()
const { permissionIdMap } = meStore
const { formatMoney } = settingStore

const startFetchData = async (ticketId: number) => {
  try {
    const ticketData = await ticketClinicStore.detail(ticketId, {
      relation: {
        customer: true,
        customerPaymentList: false, // query khi bật modal thanh toán

        ticketDiagnosis: true,
        // ticketProductList: true,
        ticketProductConsumableList: { product: true, batch: true },
        ticketProductPrescriptionList: { product: true, batch: true },
        ticketProcedureList: { procedure: true },
        ticketRadiologyList: { radiology: true },

        ticketUserList: { user: true },
        toAppointment: true,
      },
    })
    if (!ticketData.ticketDiagnosis) {
      const ticketDiagnosis = TicketDiagnosis.blank()
      ticketDiagnosis.ticketId = ticketData.id
      ticketDiagnosis.reason = ticketData.note
      ticketData.ticketDiagnosis = ticketDiagnosis
    }
    if (!ticketData.ticketProcedureList) ticketData.ticketProcedureList = []
    if (!ticketData.ticketProductList) ticketData.ticketProductList = []
    if (!ticketData.ticketRadiologyList) ticketData.ticketRadiologyList = []
    ticketClinicRef.value = ticketData
  } catch (error) {
    console.log('🚀 ~ file: InvoiceDetails.vue:51 ~ error:', error)
  }
}

onBeforeMount(async () => {
  const ticketId = Number(route.params.id)
  if (ticketId) {
    await startFetchData(ticketId)
  }
})

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'SETTING_DATA') {
    console.log(
      '🚀 ~ file: TicketClinicDetailContainer.vue:98 ~ handleMenuSettingClick ~ menu:',
      menu
    )
    modalTicketClinicDetailSettingData.value?.openModal()
  }
}

const handleChangeTabs = (activeKey: any) => {}

const startCheckup = async () => {
  await TicketClinicApi.startCheckup({ ticketId: ticketClinicRef.value.id })
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
  if ((ticketClinicRef.value.ticketRadiologyList || []).find((i) => i.startedAt == null)) {
    return ModalStore.alert({
      title: 'Phiếu chẩn đoán hình ảnh vẫn chưa thực hiện ?',
      content: 'Cần thực hiện phiếu CĐHA trước khi đóng phiếu khám',
    })
  }

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
  <ModalTicketClinicDetailSettingData ref="modalTicketClinicDetailSettingData" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="md:block">
        <ContactsOutlined />
        <span class="ml-2">{{ ticketClinicRef.customer?.fullName }}</span>
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
    <div style="flex-basis: 600px; flex-grow: 2; max-width: 100%" class="px-4 pt-2 pb-4 bg-white">
      <VueTabs :tabShow="String(route.name)" @update:tabShow="handleChangeTabs">
        <template #menu>
          <VueTabMenu
            v-if="ticketClinicRef.ticketType === TicketType.Clinic"
            :tabKey="TicketClinicDiagnosisBase.__name!"
            @active="router.push({ name: TicketClinicDiagnosisBase.__name })">
            <IconStethoscope />
            Khám
          </VueTabMenu>
          <template v-else-if="ticketClinicRef.ticketType === TicketType.Eye">
            <VueTabMenu
              :tabKey="TicketClinicDiagnosisEyeBasic.__name!"
              @active="router.push({ name: TicketClinicDiagnosisEyeBasic.__name })">
              <IconStethoscope />
              Khám mắt
            </VueTabMenu>
            <VueTabMenu
              :tabKey="TicketClinicDiagnosisEyeSpecial.__name!"
              @active="router.push({ name: TicketClinicDiagnosisEyeSpecial.__name })">
              <IconEyeGlasses />
              Đo thị lực
            </VueTabMenu>
          </template>
          <template
            v-if="
              [TicketStatus.Executing, TicketStatus.Debt, TicketStatus.Completed].includes(
                ticketClinicRef.ticketStatus
              )
            ">
            <VueTabMenu
              :tabKey="TicketClinicProcedure.__name!"
              @active="router.push({ name: TicketClinicProcedure.__name })">
              <IconFluidMed />
              Dịch vụ
            </VueTabMenu>
            <VueTabMenu
              :tabKey="TicketClinicConsumable.__name!"
              @active="router.push({ name: TicketClinicConsumable.__name })">
              <OneToOneOutlined />
              Vật tư
            </VueTabMenu>
            <VueTabMenu
              :tabKey="TicketClinicRadiology.__name!"
              @active="router.push({ name: TicketClinicRadiology.__name })">
              <IconRadiology />
              CĐHA
            </VueTabMenu>
            <VueTabMenu
              :tabKey="TicketClinicPrescription.__name!"
              @active="router.push({ name: TicketClinicPrescription.__name })">
              <DisconnectOutlined />
              Đơn thuốc
            </VueTabMenu>
            <VueTabMenu
              :tabKey="TicketClinicSummary.__name!"
              @active="router.push({ name: TicketClinicSummary.__name })">
              <AuditOutlined />
              Tổng kết
            </VueTabMenu>
          </template>
        </template>
      </VueTabs>
      <RouterView v-slot="{ Component }">
        <KeepAlive
          :include="
            [
              TicketClinicDiagnosisBase.__name,
              TicketClinicDiagnosisEyeBasic.__name,
              TicketClinicDiagnosisEyeSpecial.__name,
              TicketClinicProcedure.__name,
              TicketClinicConsumable.__name,
              TicketClinicRadiology.__name,
              TicketClinicPrescription.__name,
            ].join(',')
          ">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </div>
    <div style="flex-basis: 300px; flex-grow: 1" class="">
      <TicketClinicInformation />
      <div class="mt-4 w-full flex flex-col px-1 gap-4">
        <VueButton
          v-if="
            [TicketStatus.Schedule, TicketStatus.Draft, TicketStatus.Approved].includes(
              ticketClinicRef.ticketStatus
            ) && permissionIdMap[PermissionId.TICKET_CLINIC_START_CHECKUP]
          "
          color="blue"
          size="default"
          @click="startCheckup">
          <LoginOutlined />
          VÀO KHÁM
        </VueButton>
        <VueButton
          v-if="permissionIdMap[PermissionId.TICKET_CLINIC_CLOSE]"
          color="blue"
          size="default"
          :disabled="![TicketStatus.Executing].includes(ticketClinicRef.ticketStatus)"
          @click="clickCloseVisit">
          <ContainerOutlined />
          ĐÓNG PHIẾU KHÁM
        </VueButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
