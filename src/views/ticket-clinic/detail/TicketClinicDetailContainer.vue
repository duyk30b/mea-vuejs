<script setup lang="ts">
import {
  AuditOutlined,
  ContactsOutlined,
  ContainerOutlined,
  DisconnectOutlined,
  LoginOutlined,
  OneToOneOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { IconFluidMed, IconRadiology, IconStethoscope } from '../../../common/icon-google'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import VueTabMenu from '../../../common/vue-tabs/VueTabMenu.vue'
import VueTabs from '../../../common/vue-tabs/VueTabs.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DeliveryStatus } from '../../../modules/enum'
import { TicketStatus } from '../../../modules/ticket'
import { TicketClinicApi, ticketClinicRef, useTicketClinicStore } from '../../../modules/ticket-clinic'
import { TicketDiagnosis } from '../../../modules/ticket-diagnosis'
import TicketClinicDiagnosis from './TicketClinicDiagnosisBasic.vue'
import TicketClinicInformation from './TicketClinicInformation.vue'
import TicketClinicPrescription from './TicketClinicPrescription.vue'
import TicketClinicProcedure from './TicketClinicProcedure.vue'
import TicketClinicRadiology from './TicketClinicRadiology.vue'
import TicketClinicSummary from './TicketClinicSummary.vue'
import TicketClinicConsumable from './TicketClinicConsumable.vue'

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
        ticketProductConsumableList: true,
        ticketProductPrescriptionList: true,
        ticketProcedureList: true,
        ticketRadiologyList: true,

        ticketUserList: true,
        toAppointment: true,
      },
    })
    if (!ticketData.ticketDiagnosis) {
      ticketData.ticketDiagnosis = TicketDiagnosis.blank()
      ticketData.ticketDiagnosis.ticketId = ticketId
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
  if (menu.key === 'screen-setting') {
    console.log('🚀 ~ file: VisitContainer.vue:60 ~ handleMenuSettingClick ~ menu.key:', menu.key)
  }
  if (menu.key === 'data-setting') {
    console.log('🚀 ~ file: VisitContainer.vue:63 ~ handleMenuSettingClick ~ menu.key:', menu.key)
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
  if (ticketClinicRef.value.deliveryStatus === DeliveryStatus.Pending) {
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
  <div class="page-header">
    <div class="page-header-content">
      <div class="md:block">
        <ContactsOutlined />
        <span class="ml-2">{{ ticketClinicRef.customer?.fullName }}</span>
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
            :tabKey="TicketClinicDiagnosis.__name!"
            @active="router.push({ name: TicketClinicDiagnosis.__name })">
            <IconStethoscope />
            Khám
          </VueTabMenu>
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
              TicketClinicDiagnosis.__name,
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
