<script setup lang="ts">
import {
  CopyOutlined,
  DeleteOutlined,
  ExceptionOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  FileSyncOutlined,
  MoreOutlined,
  PlusOutlined,
  PrinterOutlined,
  ScheduleOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { createVNode, h, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { Invoice, InvoiceService, InvoiceStatus } from '../../../modules/invoice'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { timeToText } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import InvoiceStatusTag from '../InvoiceStatusTag.vue'
import { EInvoiceUpsertMode } from '../upsert/invoice-upsert.store'
import InvoiceDetailTable from './InvoiceDetailTable.vue'
import ModalInvoiceDetailSettingScreen from './ModalInvoiceDetailSettingScreen.vue'
import ModalInvoicePayment from './ModalInvoicePayment.vue'
import ModalInvoicePreview from './preview/ModalInvoicePreview.vue'
import { invoiceHtmlContent } from './preview/invoice-html-content'

const modalInvoiceDetailSettingScreen = ref<InstanceType<typeof ModalInvoiceDetailSettingScreen>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalInvoicePreview = ref<InstanceType<typeof ModalInvoicePreview>>()
const modalInvoicePayment = ref<InstanceType<typeof ModalInvoicePayment>>()

const screenStore = useScreenStore()
const meStore = useMeStore()
const { permissionIdMap } = meStore
const { formatMoney, isMobile } = screenStore

const route = useRoute()
const router = useRouter()

const invoice = ref<Invoice>(Invoice.blank())

const loadingProcess = ref(false)
const loadingRefund = ref(false)

const startFetchData = async (invoiceId: number) => {
  try {
    invoice.value = await InvoiceService.detail(invoiceId, {
      relation: {
        customer: true,
        customerPayments: true,
        invoiceItems: true,
        invoiceSurcharges: true,
        invoiceExpenses: true,
      },
    })
  } catch (error) {
    console.log('🚀 ~ file: InvoiceDetails.vue:51 ~ error:', error)
  }
}

onBeforeMount(async () => {
  const invoiceId = Number(route.params.id)
  if (invoiceId) {
    await startFetchData(invoiceId)
  }
})

const startEdit = () => {
  router.push({
    name: 'InvoiceUpsert',
    params: { id: invoice.value.id },
    query: { mode: EInvoiceUpsertMode.UPDATE },
  })
}

const startCopy = () => {
  router.push({
    name: 'InvoiceUpsert',
    params: { id: invoice.value.id },
    query: { mode: EInvoiceUpsertMode.COPY },
  })
}

const destroyDraft = async () => {
  try {
    loadingProcess.value = true
    await InvoiceService.destroyDraft(invoice.value.id!)
    AlertStore.add({ type: 'success', message: 'Xóa đơn thành công', time: 1000 })
    router.push({ name: 'InvoiceList' })
  } catch (error) {
    console.log('🚀 ~ destroyDraft ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const startRefund = async () => {
  try {
    loadingProcess.value = true
    await InvoiceService.startRefund(invoice.value.id!)
    await startFetchData(invoice.value.id!)
    AlertStore.add({ type: 'success', message: 'Trả hàng thành công', time: 1000 })
  } catch (error) {
    console.log('🚀 ~ startRefund ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const softDeleteRefund = async () => {
  try {
    loadingProcess.value = true
    await InvoiceService.softDeleteRefund(invoice.value.id!)
    AlertStore.add({ type: 'success', message: 'Xóa đơn thành công', time: 1000 })
    router.push({ name: 'InvoiceList' })
  } catch (error) {
    console.log('🚀 ~ startRefund ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const startShipAndPayment = async (money: number) => {
  try {
    loadingProcess.value = true
    await InvoiceService.startShipAndPayment(invoice.value.id!, money)
    await startFetchData(invoice.value.id!)
  } catch (error) {
    console.log('🚀 ~ startShipAndPayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const clickRefund = () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn hoàn trả hóa đơn này',
    icon: createVNode(ExclamationCircleOutlined),
    content: h('div', {}, [
      h('div', '- Kho hàng sẽ nhập lại tất cả hàng hóa trong đơn'),
      ...(invoice.value.debt > 0
        ? [h('div', `- Trừ nợ khách hàng: ${formatMoney(invoice.value.debt)}`)]
        : []),
      ...(invoice.value.paid > 0
        ? [
            h(
              'div',
              `- Khách hàng nhận lại số tiền đã thanh toán là: ${formatMoney(invoice.value.paid)}`
            ),
          ]
        : []),
    ]),
    async onOk() {
      await startRefund()
    },
    onCancel() {},
  })
}

const clickDestroyDraft = () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn muốn xóa hóa đơn này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Đơn hàng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      await destroyDraft()
    },
    onCancel() {},
  })
}

const clickSoftDeleteRefund = () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn muốn xóa hóa đơn này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Đơn hàng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      await softDeleteRefund()
    },
    onCancel() {},
  })
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalInvoiceDetailSettingScreen.value?.openModal()
  }
}

const handleMenuActionClick = (menu: { key: string }) => {
  if (menu.key === 'REFUND') clickRefund()
  if (menu.key === 'DELETE') {
    if (invoice.value.status === InvoiceStatus.Draft) {
      clickDestroyDraft()
    } else if (invoice.value.status === InvoiceStatus.Refund) {
      clickSoftDeleteRefund()
    }
  }
}

const startPrint = () => {
  const iframePrint = document.getElementById('iframe-print') as HTMLIFrameElement
  const pri = iframePrint.contentWindow as Window
  pri.document.open()
  const content = invoiceHtmlContent(invoice.value)
  pri.document.write(content)
  pri.document.close()
  pri.focus()
  pri.print()
}

const openModalInvoicePreview = () => {
  modalInvoicePreview.value?.openModal(invoice.value)
}
</script>

<template>
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalInvoicePreview ref="modalInvoicePreview" />
  <ModalInvoicePayment
    ref="modalInvoicePayment"
    :invoice="invoice"
    @success="startFetchData(invoice.id)"
  />
  <ModalInvoiceDetailSettingScreen ref="modalInvoiceDetailSettingScreen" />

  <div class="page-header">
    <div class="page-header-content">
      <ScheduleOutlined /> Thông tin hóa đơn
      <span v-if="invoice.deletedAt" style="color: #ff4d4f">(Đơn đã bị xóa)</span>
      <a-button
        v-if="permissionIdMap[PermissionId.INVOICE_CREATE_DRAFT]"
        type="primary"
        @click="$router.push({ name: 'InvoiceUpsert', query: { mode: EInvoiceUpsertMode.CREATE } })"
      >
        <template #icon>
          <PlusOutlined />
        </template>
        Tạo hóa đơn mới
      </a-button>
    </div>
    <div class="page-header-setting">
      <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]" trigger="click">
        <span>
          <SettingOutlined />
        </span>
        <template #overlay>
          <a-menu @click="handleMenuSettingClick">
            <a-menu-item key="screen-setting"> Cài đặt hiển thị </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>

  <div class="md:mx-4 mt-4 p-4 bg-white">
    <table>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Khách hàng</td>
        <td class="font-medium px-2 py-1">
          {{ invoice.customer?.fullName }}
          <a class="ml-1" @click="modalCustomerDetail?.openModal(invoice.customer!)">
            <FileSearchOutlined />
          </a>
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Mã đơn</td>
        <td class="px-2 py-1">IV{{ invoice.id }}</td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Thời gian tạo</td>
        <td class="px-2 py-1">
          {{ timeToText(invoice.startedAt, 'hh:mm DD/MM/YY') }}
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap" style="vertical-align: top">Trạng thái</td>
        <td class="px-2 py-1">
          <InvoiceStatusTag :status="invoice.status" />
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap">Chi phí</td>
        <td class="px-2 py-1">
          {{ formatMoney(invoice.expense) }}
          <span
            v-if="
              (invoice.invoiceExpenses || []).length > 1 ||
              ((invoice.invoiceExpenses || []).length == 1 &&
                invoice.invoiceExpenses![0].key !== '_unknown')
            "
            class="ml-2"
          >
            (
            {{
              invoice.invoiceExpenses!.map((i) => `${i.name}: ${formatMoney(i.money)}`).join(' - ')
            }}
            )
          </span>
        </td>
      </tr>
      <tr>
        <td class="px-2 py-1 whitespace-nowrap align-top">Ghi chú</td>
        <td class="px-2 py-1">
          {{ invoice.note }}
        </td>
      </tr>
    </table>
  </div>

  <div class="page-main">
    <div class="px-4 pt-4 flex flex-wrap gap-2">
      <a-button type="default" @click="openModalInvoicePreview">
        <template #icon>
          <EyeOutlined />
        </template>
        Xem
      </a-button>
      <a-button type="default" @click="startPrint">
        <template #icon>
          <PrinterOutlined />
        </template>
        In
      </a-button>
      <a-button
        v-if="permissionIdMap[PermissionId.INVOICE_CREATE_DRAFT]"
        class="ml-auto"
        type="default"
        @click="startCopy"
      >
        <template #icon>
          <CopyOutlined />
        </template>
        Copy đơn
      </a-button>

      <template
        v-if="
          permissionIdMap[PermissionId.INVOICE_UPDATE_DRAFT] &&
          invoice.status !== InvoiceStatus.Refund
        "
      >
        <a-button
          v-if="
            invoice.status === InvoiceStatus.Draft ||
            (screenStore.SCREEN_INVOICE_DETAIL.function.forceEdit &&
              [InvoiceStatus.Debt, InvoiceStatus.Success].includes(invoice.status))
          "
          type="primary"
          @click="startEdit"
        >
          <template #icon>
            <ExceptionOutlined />
          </template>
          Sửa đơn
        </a-button>
      </template>

      <a-dropdown>
        <template #overlay>
          <a-menu @click="handleMenuActionClick">
            <a-menu-item
              v-if="
                permissionIdMap[PermissionId.INVOICE_REFUND] &&
                [
                  InvoiceStatus.AwaitingShipment,
                  InvoiceStatus.Debt,
                  InvoiceStatus.Success,
                ].includes(invoice.status)
              "
              key="REFUND"
            >
              <span class="text-red-500"> <FileSyncOutlined class="mr-2" /> Hoàn trả </span>
            </a-menu-item>
            <a-menu-item
              v-if="
                permissionIdMap[PermissionId.INVOICE_DELETE] &&
                [InvoiceStatus.Draft, InvoiceStatus.Refund].includes(invoice.status)
              "
              key="DELETE"
            >
              <span class="text-red-500"> <DeleteOutlined class="mr-2" /> Xóa đơn </span>
            </a-menu-item>
          </a-menu>
        </template>
        <a-button shape="circle">
          <template #icon>
            <MoreOutlined style="font-size: 1.2rem; font-weight: bold" />
          </template>
        </a-button>
      </a-dropdown>
    </div>

    <div class="mt-2">
      <InvoiceDetailTable
        :invoice="invoice"
        @show-invoice-payment="modalInvoicePayment?.openModal()"
      />
    </div>

    <div class="flex justify-center gap-4 my-4">
      <template v-if="invoice.status === InvoiceStatus.Draft">
        <a-button
          v-if="
            permissionIdMap[PermissionId.INVOICE] &&
            screenStore.SCREEN_INVOICE_DETAIL.invoiceProcessType === 1
          "
          type="primary"
          :loading="loadingProcess"
          @click="startShipAndPayment(invoice.revenue)"
        >
          <template #icon>
            <FileDoneOutlined />
          </template>
          Gửi hàng và thanh toán
        </a-button>

        <a-button
          v-if="
            permissionIdMap[PermissionId.INVOICE_PREPAYMENT] &&
            screenStore.SCREEN_INVOICE_DETAIL.invoiceProcessType === 2
          "
          type="primary"
          :loading="loadingProcess"
          @click="modalInvoicePayment?.openModal()"
        >
          <template #icon>
            <FileDoneOutlined />
          </template>
          Thanh toán
        </a-button>
      </template>

      <template
        v-if="
          permissionIdMap[PermissionId.INVOICE_SHIP] &&
          invoice.status === InvoiceStatus.AwaitingShipment
        "
      >
        <a-button type="primary" :loading="loadingProcess" @click="startShipAndPayment(0)">
          <template #icon>
            <FileDoneOutlined />
          </template>
          Gửi hàng
        </a-button>
      </template>

      <template
        v-if="
          permissionIdMap[PermissionId.INVOICE_PAY_DEBT] && invoice.status === InvoiceStatus.Debt
        "
      >
        <a-button
          type="primary"
          :loading="loadingProcess"
          @click="modalInvoicePayment?.openModal()"
        >
          <template #icon>
            <FileDoneOutlined />
          </template>
          Trả nợ
        </a-button>
      </template>
    </div>
  </div>
</template>
