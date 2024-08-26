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
import { TicketService, TicketStatus, ticketRef } from '../../../modules/ticket'
import { TicketDiagnosis } from '../../../modules/ticket-diagnosis'
import TicketSpaConsumable from './TicketSpaConsumable.vue'
import TicketSpaDiagnosis from './TicketSpaDiagnosis.vue'
import TicketSpaInformation from './TicketSpaInformation.vue'
import TicketSpaPrescription from './TicketSpaPrescription.vue'
import TicketSpaProcedure from './TicketSpaProcedure.vue'
import TicketSpaRadiology from './TicketSpaRadiology.vue'
import TicketSpaSummary from './TicketSpaSummary.vue'
import { TicketSpaApi } from '../../../modules/ticket/ticket-spa.api'

const route = useRoute()
const router = useRouter()
const meStore = useMeStore()
const settingStore = useSettingStore()
const { permissionIdMap } = meStore
const { formatMoney } = settingStore

const startFetchData = async (ticketId: number) => {
  try {
    const ticketData = await TicketService.detail(ticketId, {
      relation: {
        customer: true,
        user: true,
        customerPaymentList: false, // query khi bật modal thanh toán
        ticketDiagnosis: true,
        ticketProductList: true,
        ticketProcedureList: true,
        ticketRadiologyList: true,
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
    ticketRef.value = ticketData
  } catch (error) {
    console.log('🚀 ~ file: InvoiceDetails.vue:60 ~ error:', error)
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
  await TicketSpaApi.startCheckup({ ticketId: ticketRef.value.id })
}

const startCloseVisit = async () => {
  // await TicketSpaApi.close(ticketRef.value.id)
}

const clickCloseVisit = () => {
  if (ticketRef.value.deliveryStatus === DeliveryStatus.Pending) {
    return ModalStore.alert({
      title: 'Thuốc vẫn chưa xuất hết ?',
      content: [
        '- Cần xuất thuốc và vật tư trước khi đóng phiếu khám',
        '- Khách hàng không lấy thuốc có thể chọn số lượng mua = 0',
      ],
    })
  }
  if ((ticketRef.value.ticketRadiologyList || []).find((i) => i.startedAt == null)) {
    return ModalStore.alert({
      title: 'Phiếu chẩn đoán hình ảnh vẫn chưa thực hiện ?',
      content: 'Cần thực hiện phiếu CĐHA trước khi đóng phiếu khám',
    })
  }

  if (ticketRef.value.paid > ticketRef.value.totalMoney) {
    return ModalStore.alert({
      title: 'Khách hàng còn thừa tiền tạm ứng',
      content: 'Cần hoàn trả tiền thừa trước khi đóng hồ sơ',
    })
  }

  if (ticketRef.value.debt) {
    return ModalStore.confirm({
      title: 'Đóng phiếu khám khi khách hàng chưa thanh toán đủ ?',
      content: [
        '- Vẫn đóng phiếu khám.',
        `- Ghi nợ khách hàng: ${formatMoney(ticketRef.value?.debt || 0)}.`,
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
        <span class="ml-2">{{ ticketRef.customer?.fullName }}</span>
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
            :tabKey="TicketSpaDiagnosis.__name!"
            @active="router.push({ name: TicketSpaDiagnosis.__name })">
            <IconStethoscope />
            Khám
          </VueTabMenu>
          <template
            v-if="
              [TicketStatus.Executing, TicketStatus.Debt, TicketStatus.Completed].includes(
                ticketRef.ticketStatus
              )
            ">
            <VueTabMenu
              :tabKey="TicketSpaProcedure.__name!"
              @active="router.push({ name: TicketSpaProcedure.__name })">
              <IconFluidMed />
              Dịch vụ
            </VueTabMenu>
            <VueTabMenu
              :tabKey="TicketSpaConsumable.__name!"
              @active="router.push({ name: TicketSpaConsumable.__name })">
              <OneToOneOutlined />
              Vật tư
            </VueTabMenu>
            <VueTabMenu
              :tabKey="TicketSpaRadiology.__name!"
              @active="router.push({ name: TicketSpaRadiology.__name })">
              <IconRadiology />
              CĐHA
            </VueTabMenu>
            <VueTabMenu
              :tabKey="TicketSpaPrescription.__name!"
              @active="router.push({ name: TicketSpaPrescription.__name })">
              <DisconnectOutlined />
              Đơn thuốc
            </VueTabMenu>
            <VueTabMenu
              :tabKey="TicketSpaSummary.__name!"
              @active="router.push({ name: TicketSpaSummary.__name })">
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
              TicketSpaDiagnosis.__name,
              TicketSpaProcedure.__name,
              TicketSpaConsumable.__name,
              TicketSpaRadiology.__name,
              TicketSpaPrescription.__name,
            ].join(',')
          ">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </div>
    <div style="flex-basis: 300px; flex-grow: 1" class="">
      <TicketSpaInformation />
      <div class="mt-4 w-full flex flex-col px-1 gap-4">
        <VueButton
          v-if="
            [TicketStatus.Schedule, TicketStatus.Draft, TicketStatus.Approved].includes(
              ticketRef.ticketStatus
            )
          "
          color="blue"
          size="default"
          @click="startCheckup">
          <LoginOutlined />
          VÀO PHÒNG
        </VueButton>
        <VueButton
          color="blue"
          size="default"
          :disabled="![TicketStatus.Executing].includes(ticketRef.ticketStatus)"
          @click="clickCloseVisit">
          <ContainerOutlined />
          ĐÓNG PHIẾU
        </VueButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
