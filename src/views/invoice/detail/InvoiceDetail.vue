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
import { createVNode, h, onBeforeMount, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { Invoice, InvoiceApi, InvoiceStatus } from '../../../modules/invoice'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { timeToText } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import InvoiceStatusTag from '../InvoiceStatusTag.vue'
import { EInvoiceUpsertMode } from '../upsert/invoice-upsert.ref'
import InvoiceDetailTable from './InvoiceDetailTable.vue'
import ModalInvoiceDetailSettingScreen from './ModalInvoiceDetailSettingScreen.vue'
import ModalInvoicePayment from './ModalInvoicePayment.vue'
import { invoice } from './invoice-detail.ref'
import ModalInvoicePreview from './preview/ModalInvoicePreview.vue'
import { invoiceHtmlContent } from './preview/invoice-html-content'
import { PaymentViewType } from '../../../modules/enum'

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

const loadingProcess = ref(false)
const loadingRefund = ref(false)

const startFetchData = async (invoiceId: number) => {
  try {
    invoice.value = await InvoiceApi.detail(invoiceId, {
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

onUnmounted(() => {
  invoice.value = Invoice.blank()
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
    await InvoiceApi.destroyDraft(invoice.value.id!)
    AlertStore.add({ type: 'success', message: 'Xóa đơn thành công', time: 1000 })
    router.push({ name: 'InvoiceList' })
  } catch (error) {
    console.log('🚀 ~ destroyDraft ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const startRefundPrepayment = async () => {
  try {
    loadingProcess.value = true
    const { invoiceBasic, customerPayments } = await InvoiceApi.refundPrepayment(
      invoice.value.id,
      invoice.value.paid
    )
    Object.assign(invoice.value, invoiceBasic)
    invoice.value.customerPayments = customerPayments
    AlertStore.add({ type: 'success', message: 'Trả tiền tạm ứng thành công', time: 1000 })
  } catch (error) {
    console.log('🚀 ~ file: InvoiceDetail.vue:117 ~ startRefundPrepayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const startReturnProduct = async () => {
  try {
    loadingProcess.value = true
    const { invoiceBasic, customerPayments } = await InvoiceApi.returnProduct(
      invoice.value.id!,
      invoice.value.paid
    )
    Object.assign(invoice.value, invoiceBasic)
    invoice.value.customerPayments = customerPayments
    AlertStore.add({ type: 'success', message: 'Trả hàng thành công', time: 1000 })
  } catch (error) {
    console.log('🚀 ~ startReturnProduct ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const softDeleteRefund = async () => {
  try {
    loadingProcess.value = true
    await InvoiceApi.softDeleteRefund(invoice.value.id!)
    AlertStore.add({ type: 'success', message: 'Xóa đơn thành công', time: 1000 })
    router.push({ name: 'InvoiceList' })
  } catch (error) {
    console.log('🚀 ~ softDeleteRefund ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const sendProductAndDebit = async () => {
  try {
    loadingProcess.value = true
    const { invoiceBasic, customerPayments } = await InvoiceApi.sendProductAndPayment(
      invoice.value.id!,
      0
    )
    Object.assign(invoice.value, invoiceBasic)
    invoice.value.customerPayments = customerPayments
  } catch (error) {
    console.log('🚀 ~ startShipAndPayment ~ error:', error)
  } finally {
    loadingProcess.value = false
  }
}

const clickReturnProduct = () => {
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
      await startReturnProduct()
    },
    onCancel() {},
  })
}

const clickRefundPrepayment = () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn hoàn trả tiền tạm ứng đơn này',
    icon: createVNode(ExclamationCircleOutlined),
    content: h('div', {}, [
      h(
        'div',
        `- Khách hàng nhận lại số tiền đã thanh toán là: ${formatMoney(invoice.value.paid)}`
      ),
      h('div', '- Đơn hàng sẽ chuyển về trạng thái NHÁP'),
    ]),
    async onOk() {
      await startRefundPrepayment()
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
  if (menu.key === 'EDIT_INVOICE') startEdit()
  if (menu.key === 'REFUND_PREPAYMENT') clickRefundPrepayment()
  if (menu.key === 'RETURN_PRODUCT') clickReturnProduct()
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
  <ModalInvoicePayment ref="modalInvoicePayment" />
  <ModalInvoiceDetailSettingScreen ref="modalInvoiceDetailSettingScreen" />

  <div class="page-header">
    <div class="page-header-content">
      <ScheduleOutlined /> Thông tin hóa đơn
      <span v-if="invoice.deletedAt" style="color: var(--text-red)">(Đơn đã bị xóa)</span>
      <div>
        <VueButton
          v-if="permissionIdMap[PermissionId.INVOICE_CREATE_DRAFT]"
          color="blue"
          @click="
            $router.push({ name: 'InvoiceUpsert', query: { mode: EInvoiceUpsertMode.CREATE } })
          "
        >
          <PlusOutlined />
          Tạo hóa đơn mới
        </VueButton>
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
          <a class="ml-1" @click="modalCustomerDetail?.openModal(invoice.customerId)">
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
      <VueButton @click="openModalInvoicePreview">
        <EyeOutlined />
        Xem
      </VueButton>
      <VueButton @click="startPrint">
        <PrinterOutlined />
        In
      </VueButton>
      <VueButton
        v-if="permissionIdMap[PermissionId.INVOICE_CREATE_DRAFT]"
        class="ml-auto"
        @click="startCopy"
      >
        <CopyOutlined />
        Copy đơn
      </VueButton>
      <VueButton
        v-if="
          permissionIdMap[PermissionId.INVOICE_UPDATE_INVOICE_DRAFT_AND_INVOICE_PREPAYMENT] &&
          [InvoiceStatus.Draft, InvoiceStatus.Prepayment].includes(invoice.status)
        "
        color="blue"
        @click="startEdit"
      >
        <ExceptionOutlined />
        Sửa đơn
      </VueButton>

      <a-dropdown>
        <template #overlay>
          <a-menu @click="handleMenuActionClick">
            <a-menu-item
              v-if="
                screenStore.SCREEN_INVOICE_DETAIL.process.forceEdit &&
                [InvoiceStatus.Debt, InvoiceStatus.Success].includes(invoice.status)
              "
              key="EDIT_INVOICE"
            >
              <span class="text-red-500"> <FileSyncOutlined class="mr-2" /> Sửa đơn </span>
            </a-menu-item>
            <a-menu-item
              v-if="
                permissionIdMap[PermissionId.INVOICE_REFUND_PREPAYMENT] &&
                [InvoiceStatus.Prepayment].includes(invoice.status)
              "
              key="REFUND_PREPAYMENT"
            >
              <span class="text-red-500">
                <FileSyncOutlined class="mr-2" /> Hoàn trả tiền tạm ứng
              </span>
            </a-menu-item>
            <a-menu-item
              v-if="
                permissionIdMap[PermissionId.INVOICE_RETURN_PRODUCT] &&
                [InvoiceStatus.Debt, InvoiceStatus.Success].includes(invoice.status)
              "
              key="RETURN_PRODUCT"
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
      <InvoiceDetailTable @showInvoicePayment="(view) => modalInvoicePayment?.openModal(view)" />
    </div>

    <div class="flex justify-center gap-4 my-4">
      <template
        v-if="
          permissionIdMap[PermissionId.INVOICE_SEND_PRODUCT] &&
          [InvoiceStatus.Draft, InvoiceStatus.Prepayment].includes(invoice.status)
        "
      >
        <VueButton
          v-if="invoice.paid == invoice.totalMoney"
          color="blue"
          :loading="loadingProcess"
          @click="sendProductAndDebit"
        >
          <template #icon>
            <FileDoneOutlined />
          </template>
          Gửi hàng
        </VueButton>

        <VueButton
          v-if="
            invoice.paid != invoice.totalMoney &&
            screenStore.SCREEN_INVOICE_DETAIL.process.sendProductAndPayment
          "
          color="blue"
          :loading="loadingProcess"
          @click="modalInvoicePayment?.openModal(PaymentViewType.SendProductAndPayment)"
        >
          <template #icon>
            <FileDoneOutlined />
          </template>
          Gửi hàng và Thanh toán
        </VueButton>

        <VueButton
          v-if="
            invoice.paid != invoice.totalMoney &&
            screenStore.SCREEN_INVOICE_DETAIL.process.sendProductAndDebit
          "
          color="blue"
          :loading="loadingProcess"
          @click="sendProductAndDebit"
        >
          <template #icon>
            <FileDoneOutlined />
          </template>
          Gửi hàng và Ghi nợ
        </VueButton>
      </template>

      <template
        v-if="
          permissionIdMap[PermissionId.INVOICE_PAY_DEBT] && invoice.status === InvoiceStatus.Debt
        "
      >
        <VueButton
          color="blue"
          :loading="loadingProcess"
          @click="modalInvoicePayment?.openModal(PaymentViewType.PayDebt)"
        >
          <template #icon>
            <FileDoneOutlined />
          </template>
          Trả nợ
        </VueButton>
      </template>
    </div>
  </div>
</template>
