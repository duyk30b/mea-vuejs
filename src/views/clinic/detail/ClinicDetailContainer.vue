<script setup lang="ts">
import {
  AuditOutlined,
  ContactsOutlined,
  ContainerOutlined,
  DisconnectOutlined,
  LoginOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { h, onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { IconFluidMed, IconRadiology, IconStethoscope } from '../../../common/icon-google'
import VueTabMenu from '../../../common/vue-tabs/VueTabMenu.vue'
import VueTabs from '../../../common/vue-tabs/VueTabs.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { VisitActionApi, VisitApi, ClinicVisitApi, VisitStatus } from '../../../modules/visit'
import { VisitDiagnosis } from '../../../modules/visit-diagnosis'
import ClinicDiagnosis from './ClinicDiagnosis.vue'
import VisitInformation from './ClinicInformation.vue'
import ClinicPrescription from './ClinicPrescription.vue'
import ClinicProcedure from './ClinicProcedure.vue'
import ClinicRadiology from './ClinicRadiology.vue'
import ClinicSummary from './ClinicSummary.vue'
import { visit } from './visit.ref'

const route = useRoute()
const router = useRouter()
const meStore = useMeStore()
const settingStore = useSettingStore()
const { permissionIdMap } = meStore
const { formatMoney } = settingStore

const startFetchData = async (visitId: number) => {
  try {
    const visitData = await VisitApi.detail(visitId, {
      relation: {
        customer: true,
        customerPaymentList: true, // query khi bật modal thanh toán
        visitDiagnosis: true,
        visitProductList: true,
        visitProcedureList: true,
        visitRadiologyList: true,
      },
    })
    if (!visitData.visitDiagnosis) {
      visitData.visitDiagnosis = VisitDiagnosis.blank()
      visitData.visitDiagnosis.visitId = visitId
    }
    visit.value = visitData
  } catch (error) {
    console.log('🚀 ~ file: InvoiceDetails.vue:51 ~ error:', error)
  }
}

onBeforeMount(async () => {
  const visitId = Number(route.params.id)
  if (visitId) {
    await startFetchData(visitId)
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
  await ClinicVisitApi.startCheckup({ visitId: visit.value.id })
}

const startCloseVisit = async () => {
  await VisitActionApi.close(visit.value.id)
}

const clickCloseVisit = () => {
  if (
    (!visit.value.isSent && visit.value.productsMoney > 0) ||
    !!(visit.value.visitProductList || []).find((i) => !i.isSent && i.quantity)
  ) {
    return Modal.warning({
      title: 'Thuốc vẫn chưa xuất hết ?',
      content: h('div', {}, [
        h('p', 'Cần xuất thuốc trước khi đóng phiếu khám'),
        h('p', 'Khách hàng không lấy thuốc có thể chọn số lượng mua = 0'),
      ]),
      okType: 'default',
      okText: 'Hủy',
    })
  }
  if ((visit.value.visitRadiologyList || []).find((i) => i.startedAt == null)) {
    return Modal.warning({
      title: 'Phiếu chẩn đoán hình ảnh vẫn chưa thực hiện ?',
      content: h('div', {}, [h('p', 'Cần thực hiện phiếu CĐHA trước khi đóng phiếu khám')]),
      okType: 'default',
      okText: 'Hủy',
    })
  }
  if (visit.value.paid > visit.value.totalMoney) {
    return Modal.warning({
      title: 'Khách hàng còn thừa tiền tạm ứng',
      content: h('div', {}, [h('p', 'Cần hoàn trả tiền thừa trước khi đóng hồ sơ')]),
      okType: 'default',
      okText: 'Hủy',
    })
  }
  if (visit.value.debt) {
    return Modal.confirm({
      title: 'Đóng phiếu khám khi khách hàng chưa thanh toán đủ ?',
      content: h('div', {}, [
        h('p', `- Vẫn đóng phiếu khám.`),
        h('p', `- Ghi nợ khách hàng: ${formatMoney(visit.value?.debt || 0)}.`),
      ]),
      async onOk() {
        await startCloseVisit()
      },
      onCancel() {},
      okText: 'Xác nhận Đóng phiếu',
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
        <span class="ml-2">{{ visit.customer?.fullName }}</span>
      </div>
    </div>
    <div class="page-header-setting">
      <a-dropdown v-if="permissionIdMap[PermissionId.SETTING_UPSERT]" trigger="click">
        <span>
          <SettingOutlined />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting">Cài đặt hiển thị</a-menu-item>
            <a-menu-item key="data-setting">Cài đặt dữ liệu</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>
  <div class="mt-4 md:mx-4 flex flex-wrap gap-4">
    <div style="flex-basis: 600px; flex-grow: 2; max-width: 100%" class="px-4 pt-2 pb-4 bg-white">
      <VueTabs :tabStart="String(route.name)" @changeTab="handleChangeTabs">
        <template #menu>
          <VueTabMenu tabKey="ClinicDiagnosis" @active="router.push({ name: 'ClinicDiagnosis' })">
            <IconStethoscope />
            Khám
          </VueTabMenu>
          <template
            v-if="
              [VisitStatus.InProgress, VisitStatus.Debt, VisitStatus.Completed].includes(
                visit.visitStatus
              )
            ">
            <VueTabMenu
              v-if="permissionIdMap[PermissionId.VISIT_PROCEDURES]"
              :tabKey="ClinicProcedure.__name!"
              @active="router.push({ name: ClinicProcedure.__name })">
              <IconFluidMed />
              Dịch vụ
            </VueTabMenu>
            <VueTabMenu
              v-if="permissionIdMap[PermissionId.VISIT_RADIOLOGY]"
              :tabKey="ClinicRadiology.__name!"
              @active="router.push({ name: ClinicRadiology.__name })">
              <IconRadiology />
              CĐHA
            </VueTabMenu>
            <VueTabMenu
              v-if="permissionIdMap[PermissionId.VISIT_PRESCRIPTION]"
              :tabKey="ClinicPrescription.__name!"
              @active="router.push({ name: ClinicPrescription.__name })">
              <DisconnectOutlined />
              Đơn thuốc
            </VueTabMenu>
            <VueTabMenu
              :tabKey="ClinicSummary.__name!"
              @active="router.push({ name: ClinicSummary.__name })">
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
              ClinicDiagnosis.__name,
              ClinicProcedure.__name,
              ClinicRadiology.__name,
              ClinicPrescription.__name,
            ].join(',')
          ">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </div>
    <div style="flex-basis: 300px; flex-grow: 1" class="">
      <VisitInformation />
      <div class="mt-4 w-full flex flex-col px-1 gap-4">
        <VueButton
          v-if="[VisitStatus.Draft, VisitStatus.Waiting].includes(visit.visitStatus)"
          color="blue"
          size="default"
          @click="startCheckup">
          <LoginOutlined />
          VÀO KHÁM
        </VueButton>
        <VueButton
          color="blue"
          size="default"
          :disabled="![VisitStatus.InProgress].includes(visit.visitStatus)"
          @click="clickCloseVisit">
          <ContainerOutlined />
          ĐÓNG PHIẾU KHÁM
        </VueButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.ant-tabs-tab) {
  border-top: 5px solid #d6d6d6 !important;

  &.ant-tabs-tab-active {
    border-top-color: #1890ff !important;
  }
}
</style>
