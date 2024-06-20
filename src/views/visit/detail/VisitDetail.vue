<script setup lang="ts">
import {
  AuditOutlined,
  ContactsOutlined,
  ContainerOutlined,
  DeploymentUnitOutlined,
  DisconnectOutlined,
  ExclamationCircleOutlined,
  LoginOutlined,
  NodeIndexOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode, h, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { VisitApi, VisitStatus } from '../../../modules/visit'
import { VisitDiagnosis } from '../../../modules/visit-diagnosis'
import VisitCheckup from './VisitCheckup.vue'
import VisitInformation from './VisitInformation.vue'
import VisitInvoice from './VisitInvoice.vue'
import VisitPrescription from './VisitPrescription.vue'
import VisitProcedure from './VisitProcedure.vue'
import { visit } from './visit.ref'

const route = useRoute()
const router = useRouter()
const meStore = useMeStore()
const screenStore = useScreenStore()
const { permissionIdMap } = meStore
const { formatMoney } = screenStore
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
      <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]" trigger="click">
        <span>
          <SettingOutlined />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting"> Cài đặt hiển thị </a-menu-item>
            <a-menu-item key="data-setting"> Cài đặt dữ liệu </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>
  <div class="mt-4 md:mx-4 flex flex-col md:flex-row gap-4">
    <div class="md:w-2/3 px-4 pt-2 pb-4 bg-white">
      <a-tabs
        v-model:activeKey="tabsKey"
        type="card"
        :tabBarGutter="10"
        style="overflow: visible"
        @change="handleChangeTabs"
      >
        <a-tab-pane key="diagnosis">
          <template #tab>
            <span> <NodeIndexOutlined />Khám</span>
          </template>
          <VisitCheckup />
        </a-tab-pane>
        <a-tab-pane v-if="visit.startedAt" key="procedure">
          <template #tab>
            <span> <DeploymentUnitOutlined />Dịch vụ</span>
          </template>
          <VisitProcedure />
        </a-tab-pane>
        <a-tab-pane v-if="visit.startedAt" key="prescription">
          <template #tab>
            <span> <DisconnectOutlined />Đơn thuốc</span>
          </template>
          <VisitPrescription />
        </a-tab-pane>
        <a-tab-pane v-if="visit.startedAt" key="payment" forceRender>
          <template #tab>
            <span> <AuditOutlined />Tổng kết</span>
          </template>
          <!-- Rerender lại, mục đích để reload kiểm tra lô hàng của từng thuốc -->
          <VisitInvoice v-if="tabsKey == 'payment'" />
        </a-tab-pane>
      </a-tabs>
    </div>
    <div class="md:w-1/3">
      <VisitInformation />
      <div class="mt-4">
        <button
          v-if="[VisitStatus.Scheduled, VisitStatus.Waiting].includes(visit.visitStatus)"
          class="btn btn-blue btn-large w-full"
          @click="startCheckup"
        >
          <LoginOutlined /> VÀO KHÁM
        </button>
      </div>
      <div class="mt-4">
        <button
          class="btn btn-blue btn-large w-full"
          :disabled="![VisitStatus.InProgress].includes(visit.visitStatus)"
          @click="clickCloseVisit"
        >
          <ContainerOutlined /> ĐÓNG PHIẾU KHÁM
        </button>
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
