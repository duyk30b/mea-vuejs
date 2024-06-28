<script setup lang="ts">
import {
  AuditOutlined,
  ContactsOutlined,
  ContainerOutlined,
  DeploymentUnitOutlined,
  DisconnectOutlined,
  LoginOutlined,
  NodeIndexOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { h, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import VueTabMenu from '../../../common/vue-tabs/VueTabMenu.vue'
import VueTabPanel from '../../../common/vue-tabs/VueTabPanel.vue'
import VueTabs from '../../../common/vue-tabs/VueTabs.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { VisitApi, VisitStatus } from '../../../modules/visit'
import { VisitDiagnosis } from '../../../modules/visit-diagnosis'
import VisitDiagnosisManageView from './VisitDiagnosisManageView.vue'
import VisitInformation from './VisitInformation.vue'
import VisitSummaryView from './VisitSummaryView.vue'
import VisitPrescriptionManageView from './VisitPrescriptionManageView.vue'
import VisitProcedureManageView from './VisitProcedureManageView.vue'
import { visit } from './visit.ref'
import { IconFluidMed, IconRadiology, IconStethoscope } from '../../../common/icon-google'
import VisitRadiologyManageView from './VisitRadiologyManageView.vue'

const route = useRoute()
const router = useRouter()
const meStore = useMeStore()
const settingStore = useSettingStore()
const { permissionIdMap } = meStore
const { formatMoney } = settingStore
const tabsKey = ref<'diagnosis' | 'procedure' | 'prescription' | 'payment'>('diagnosis')

const startFetchData = async (visitId: number) => {
  try {
    const visitData = await VisitApi.detail(visitId, {
      relation: {
        customer: true,
        customerPayments: true, // query khi bật modal thanh toán
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
  await VisitApi.startCheckup({ visitId: visit.value.id })
}

const startCloseVisit = async () => {
  await VisitApi.close(visit.value.id)
}

const clickCloseVisit = () => {
  if (visit.value.paid > visit.value.totalMoney) {
    return Modal.warning({
      title: 'Khách hàng còn thừa tiền tạm ứng',
      content: h('div', {}, [h('p', 'Cần hoàn trả tiền thừa trước khi đóng hồ sơ')]),
    })
  }
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
      <VueTabs :tabStart="tabsKey" @changeTab="handleChangeTabs">
        <template #menu>
          <VueTabMenu tabKey="diagnosis">
            <IconStethoscope />
            Khám
          </VueTabMenu>
          <template
            v-if="
              [VisitStatus.InProgress, VisitStatus.Debt, VisitStatus.Completed].includes(
                visit.visitStatus
              )
            ">
            <VueTabMenu tabKey="procedure">
              <IconFluidMed />
              Dịch vụ
            </VueTabMenu>
            <VueTabMenu tabKey="radiology">
              <IconRadiology />
              CĐHA
            </VueTabMenu>
            <VueTabMenu tabKey="prescription">
              <DisconnectOutlined />
              Đơn thuốc
            </VueTabMenu>
            <VueTabMenu tabKey="payment">
              <AuditOutlined />
              Tổng kết
            </VueTabMenu>
          </template>
        </template>
        <template #panel>
          <VueTabPanel tabKey="diagnosis">
            <VisitDiagnosisManageView />
          </VueTabPanel>
          <VueTabPanel tabKey="procedure">
            <VisitProcedureManageView />
          </VueTabPanel>
          <VueTabPanel tabKey="radiology">
            <VisitRadiologyManageView />
          </VueTabPanel>
          <VueTabPanel tabKey="prescription">
            <VisitPrescriptionManageView />
          </VueTabPanel>
          <VueTabPanel tabKey="payment" destroy-on-in-active>
            <VisitSummaryView />
          </VueTabPanel>
        </template>
      </VueTabs>
    </div>
    <div style="flex-basis: 300px; flex-grow: 1" class="">
      <VisitInformation />
      <div class="mt-4 w-full flex flex-col px-1 gap-4">
        <VueButton
          v-if="[VisitStatus.Scheduled, VisitStatus.Waiting].includes(visit.visitStatus)"
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
