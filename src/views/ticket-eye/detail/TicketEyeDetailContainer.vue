<script setup lang="ts">
import {
  AuditOutlined,
  ContactsOutlined,
  ContainerOutlined,
  DisconnectOutlined,
  EyeOutlined,
  LoginOutlined,
  OneToOneOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { IconFluidMed, IconStethoscope } from '../../../common/icon-google'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import VueTabMenu from '../../../common/vue-tabs/VueTabMenu.vue'
import VueTabs from '../../../common/vue-tabs/VueTabs.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DeliveryStatus } from '../../../modules/enum'
import { TicketStatus } from '../../../modules/ticket'
import { TicketDiagnosis } from '../../../modules/ticket-diagnosis'
import { TicketEyeApi, ticketEyeRef } from '../../../modules/ticket-eye'
import { TicketEyeService } from '../../../modules/ticket-eye/ticket-eye.service'
import TicketEyeConsumable from './TicketEyeConsumable.vue'
import TicketEyeDiagnosisBasic from './TicketEyeDiagnosisBasic.vue'
import TicketEyeDiagnosisSpecial from './TicketEyeDiagnosisSpecial.vue'
import TicketEyeInformation from './TicketEyeInformation.vue'
import TicketEyePrescription from './TicketEyePrescription.vue'
import TicketEyeProcedure from './TicketEyeProcedure.vue'
import TicketEyeSummary from './TicketEyeSummary.vue'

const route = useRoute()
const router = useRouter()
const meStore = useMeStore()
const settingStore = useSettingStore()
const { permissionIdMap } = meStore
const { formatMoney } = settingStore

const startFetchData = async (ticketId: number) => {
  try {
    const ticketData = await TicketEyeService.detail(ticketId, {
      relation: {
        customer: true,
        customerPaymentList: false, // query khi bật modal thanh toán

        ticketDiagnosis: true,
        // ticketProductList: true,
        ticketProductConsumableList: { product: true, batch: true },
        ticketProductPrescriptionList: { product: true, batch: true },
        ticketProcedureList: { procedure: true },
        // ticketRadiologyList: true,

        ticketUserList: { user: true },
        toAppointment: true,
      },
    })
    if (!ticketData.ticketDiagnosis) {
      const ticketDiagnosis = TicketDiagnosis.blank()
      ticketDiagnosis.ticketId = ticketId
      ticketDiagnosis.reason = ticketData.note

      ticketData.ticketDiagnosis = ticketDiagnosis
    }
    if (!ticketData.ticketProcedureList) ticketData.ticketProcedureList = []
    if (!ticketData.ticketProductList) ticketData.ticketProductList = []
    if (!ticketData.ticketRadiologyList) ticketData.ticketRadiologyList = []
    if (!ticketData.ticketUserList) ticketData.ticketUserList = []
    ticketEyeRef.value = ticketData
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
  if (menu.key === 'screen-setting') {
    console.log('🚀 ~ file: VisitContainer.vue:82 ~ handleMenuSettingClick ~ menu.key:', menu.key)
  }
  if (menu.key === 'data-setting') {
    console.log('🚀 ~ file: VisitContainer.vue:85 ~ handleMenuSettingClick ~ menu.key:', menu.key)
  }
}

const handleChangeTabs = (activeKey: any) => {}

const startCheckup = async () => {
  await TicketEyeApi.startCheckup({ ticketId: ticketEyeRef.value.id })
}

const startCloseVisit = async () => {
  await TicketEyeApi.close(ticketEyeRef.value.id)
}

const clickCloseVisit = () => {
  if (ticketEyeRef.value.deliveryStatus === DeliveryStatus.Pending) {
    return ModalStore.alert({
      title: 'Thuốc vẫn chưa xuất hết ?',
      content: [
        '- Cần xuất thuốc và vật tư trước khi đóng phiếu khám',
        '- Khách hàng không lấy thuốc có thể chọn số lượng mua = 0',
      ],
    })
  }
  if ((ticketEyeRef.value.ticketRadiologyList || []).find((i) => i.startedAt == null)) {
    return ModalStore.alert({
      title: 'Phiếu chẩn đoán hình ảnh vẫn chưa thực hiện ?',
      content: 'Cần thực hiện phiếu CĐHA trước khi đóng phiếu khám',
    })
  }

  if (ticketEyeRef.value.paid > ticketEyeRef.value.totalMoney) {
    return ModalStore.alert({
      title: 'Khách hàng còn thừa tiền tạm ứng',
      content: 'Cần hoàn trả tiền thừa trước khi đóng hồ sơ',
    })
  }

  if (ticketEyeRef.value.debt) {
    return ModalStore.confirm({
      title: 'Đóng phiếu khám khi khách hàng chưa thanh toán đủ ?',
      content: [
        '- Vẫn đóng phiếu khám.',
        `- Ghi nợ khách hàng: ${formatMoney(ticketEyeRef.value?.debt || 0)}.`,
      ],
      okText: 'Xác nhận Đóng phiếu kèm ghi nợ',
      async onOk() {
        await startCloseVisit()
      },
    })
  }

  startCloseVisit()
}
</script>

<template>
  <div class="page-header">
    <div class="page-header-content">
      <div class="md:block">
        <ContactsOutlined />
        <span class="ml-2">{{ ticketEyeRef.customer?.fullName }}</span>
      </div>
    </div>
    <div class="page-header-setting">
      <!-- <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]" trigger="click">
        <span>
          <SettingOutlined />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting">Cài đặt hiển thị</a-menu-item>
            <a-menu-item key="data-setting">Cài đặt dữ liệu</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown> -->
    </div>
  </div>
  <div class="mt-4 md:mx-4 flex flex-wrap gap-4">
    <div style="flex-basis: 600px; flex-grow: 2; max-width: 100%" class="px-4 pt-2 pb-4 bg-white">
      <VueTabs :tabShow="String(route.name)" @update:tabShow="handleChangeTabs">
        <template #menu>
          <VueTabMenu
            :tabKey="TicketEyeDiagnosisBasic.__name!"
            @active="router.push({ name: TicketEyeDiagnosisBasic.__name })">
            <IconStethoscope />
            Khám
          </VueTabMenu>
          <template
            v-if="
              [TicketStatus.Executing, TicketStatus.Debt, TicketStatus.Completed].includes(
                ticketEyeRef.ticketStatus
              )
            ">
            <VueTabMenu
              :tabKey="TicketEyeDiagnosisSpecial.__name!"
              @active="router.push({ name: TicketEyeDiagnosisSpecial.__name })">
              <EyeOutlined />
              Đo thị lực
            </VueTabMenu>
            <VueTabMenu
              :tabKey="TicketEyeProcedure.__name!"
              @active="router.push({ name: TicketEyeProcedure.__name })">
              <IconFluidMed />
              Dịch vụ
            </VueTabMenu>
            <VueTabMenu
              :tabKey="TicketEyeConsumable.__name!"
              @active="router.push({ name: TicketEyeConsumable.__name })">
              <OneToOneOutlined />
              Vật tư
            </VueTabMenu>
            <VueTabMenu
              :tabKey="TicketEyePrescription.__name!"
              @active="router.push({ name: TicketEyePrescription.__name })">
              <DisconnectOutlined />
              Đơn thuốc
            </VueTabMenu>
            <VueTabMenu
              :tabKey="TicketEyeSummary.__name!"
              @active="router.push({ name: TicketEyeSummary.__name })">
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
              TicketEyeDiagnosisBasic.__name,
              TicketEyeDiagnosisSpecial.__name,
              TicketEyeProcedure.__name,
              TicketEyeConsumable.__name,
              TicketEyePrescription.__name,
            ].join(',')
          ">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </div>
    <div style="flex-basis: 300px; flex-grow: 1" class="">
      <TicketEyeInformation />
      <div class="mt-4 w-full flex flex-col px-1 gap-4">
        <VueButton
          v-if="
            [TicketStatus.Schedule, TicketStatus.Draft, TicketStatus.Approved].includes(
              ticketEyeRef.ticketStatus
            )
          "
          color="blue"
          size="default"
          @click="startCheckup">
          <LoginOutlined />
          VÀO KHÁM
        </VueButton>
        <VueButton
          color="blue"
          size="default"
          :disabled="![TicketStatus.Executing].includes(ticketEyeRef.ticketStatus)"
          @click="clickCloseVisit">
          <ContainerOutlined />
          ĐÓNG PHIẾU KHÁM
        </VueButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
