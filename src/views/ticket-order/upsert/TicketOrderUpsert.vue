<script setup lang="ts">
import { NodeIndexOutlined, SettingOutlined } from '@ant-design/icons-vue'
import dayjs, { Dayjs } from 'dayjs'
import { nextTick, onBeforeMount, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { IconFileSearch } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputMoney, InputNumber, InputOptions } from '../../../common/vue-form'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../common/vue-tabs'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer, CustomerApi, CustomerService } from '../../../modules/customer'
import { DiscountType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Ticket, TicketStatus } from '../../../modules/ticket'
import { TicketExpense } from '../../../modules/ticket-expense/ticket-expense.model'
import { TicketOrderApi } from '../../../modules/ticket-order'
import { TicketSurcharge } from '../../../modules/ticket-surcharge/ticket-surcharge.model'
import { TicketApi } from '../../../modules/ticket/ticket.api'
import { DString, DTimer } from '../../../utils'
import ModalCustomerDetail from '../../customer/detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../../customer/upsert/ModalCustomerUpsert.vue'
import TicketOrderExpenseList from './TicketOrderExpenseList.vue'
import TicketOrderItemTable from './TicketOrderItemTable.vue'
import TicketOrderSelectProcedure from './TicketOrderSelectProcedure.vue'
import TicketOrderSelectProduct from './TicketOrderSelectProduct.vue'
import TicketOrderSurchargeList from './TicketOrderSurchargeList.vue'
import ModalDataTicketOrder from './modal-setting/ModalDataTicketOrder.vue'
import ModalTicketOrderUpsertSetting from './modal-setting/ModalTicketOrderUpsertSetting.vue'
import { ETicketOrderSave, ETicketOrderUpsertMode, ticket } from './ticket-order-upsert.ref'

const TABS_KEY = {
  PRODUCT: 'PRODUCT',
  PROCEDURE: 'PROCEDURE',
}

const ticketOrderSelectProcedure = ref<InstanceType<typeof TicketOrderSelectProcedure>>()
const ticketOrderSelectProduct = ref<InstanceType<typeof TicketOrderSelectProduct>>()
const inputOptionsCustomer = ref<InstanceType<typeof InputOptions>>()
const modalTicketOrderUpsertSetting = ref<InstanceType<typeof ModalTicketOrderUpsertSetting>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalDataTicketOrder = ref<InstanceType<typeof ModalDataTicketOrder>>()
const ticketUpsertForm = ref<InstanceType<typeof HTMLFormElement>>()

const router = useRouter()
const route = useRoute()

const settingStore = useSettingStore()
const meStore = useMeStore()
const { permissionIdMap } = meStore
const { formatMoney } = settingStore

let defaultTabStart = localStorage.getItem('TICKET_ORDER_UPSERT_TAB_START') || TABS_KEY.PRODUCT
if (![TABS_KEY.PRODUCT, TABS_KEY.PROCEDURE].includes(defaultTabStart)) {
  defaultTabStart = TABS_KEY.PRODUCT
}
const tabStart = ref(defaultTabStart as any)

const mode = ref<ETicketOrderUpsertMode>(ETicketOrderUpsertMode.CREATE)

const oldTicket = ref<Ticket>(Ticket.blank())
const customer = ref<Customer>(Customer.blank())
const customerList = ref<Customer[]>([])

const time = ref<Dayjs>(dayjs())

const saveLoading = ref(false)

onBeforeMount(async () => {
  try {
    const ticketId = Number(route.params.id)
    const customerId = Number(route.query.customer_id)
    let customerDefault = Customer.blank()
    if (route.query.mode) {
      mode.value = route.query.mode as any
    }
    if (ticketId) {
      const ticketResponse = await TicketApi.detail(ticketId, {
        relation: {
          customer: true,
          ticketAttributeList: true,
          ticketProductList: { product: true, batch: true },
          ticketProcedureList: { procedure: true },
          ticketSurchargeList: true,
          ticketExpenseList: true,
        },
      })

      ticket.value = ticketResponse
      oldTicket.value = Ticket.from(ticketResponse)
      customerDefault = ticketResponse.customer!

      if (ticket.value.ticketExpenseList!.length === 0) {
        ticket.value.ticketExpenseList!.push(TicketExpense.blank())
      }
      if (ticket.value.ticketSurchargeList!.length === 0) {
        ticket.value.ticketSurchargeList!.push(TicketSurcharge.blank())
      }
      if (
        mode.value === ETicketOrderUpsertMode.CREATE ||
        mode.value === ETicketOrderUpsertMode.COPY
      ) {
        time.value = dayjs(new Date())
      } else if (mode.value === ETicketOrderUpsertMode.UPDATE) {
        time.value = dayjs(new Date(ticket.value.startedAt || Date.now()))
      }
    } else if (customerId) {
      customerDefault = await CustomerApi.detail(customerId)
    } else {
      customerDefault = await CustomerService.getCustomerDefault()
    }

    customer.value = customerDefault
    ticket.value.customer = customerDefault
    ticket.value.customerId = customerDefault.id

    nextTick(() => {
      inputOptionsCustomer.value?.setItem({
        value: customerDefault.id,
        text: customerDefault.fullName,
        data: customerDefault,
      })
    })
  } catch (error) {
    console.log('🚀 ~ file: ArrivalInvoiceUpsert.vue:73 ~ error:', error)
  }
})

const handleDocumentKeyup = (e: KeyboardEvent) => {
  if (e.key === 'F3') {
    e.preventDefault()
    if (tabStart.value === TABS_KEY.PRODUCT) {
      tabStart.value = TABS_KEY.PROCEDURE
      nextTick(() => ticketOrderSelectProcedure.value?.focus())
    } else if (tabStart.value === TABS_KEY.PROCEDURE) {
      tabStart.value = TABS_KEY.PRODUCT
      nextTick(() => ticketOrderSelectProduct.value?.focus())
    }
  }
  if (e.key === 'F4') {
    e.preventDefault()
    inputOptionsCustomer.value?.focus()
  }
}
onMounted(async () => {
  try {
    window.addEventListener('keydown', handleDocumentKeyup)
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
  ticket.value = Ticket.blank()
})

const handleFocusFirstSearchCustomer = async () => {
  await CustomerService.refreshDB()
}

const searchingCustomer = async (text: string) => {
  customer.value = Customer.blank()
  ticket.value.customerId = 0
  if (text) {
    customerList.value = await CustomerService.search(text)
  } else {
    customerList.value = []
  }
}

const createCustomer = (instance?: Customer) => {
  inputOptionsCustomer.value?.setItem({
    text: instance?.fullName,
    data: instance,
    value: instance?.id,
  })
  selectCustomer(instance)
}

const selectCustomer = (data?: Customer) => {
  ticket.value.customerId = data?.id || 0
  ticket.value.customer = data
  customer.value = data || Customer.blank()
}

const handleChangeInvoiceDiscountMoney = (data: number) => {
  ticket.value.discountMoney = data
  ticket.value.discountType = DiscountType.VND
}
const handleChangeInvoiceDiscountPercent = (data: number) => {
  ticket.value.discountPercent = data
  ticket.value.discountType = DiscountType.Percent
}

const saveInvoice = async (type: ETicketOrderSave) => {
  const validForm = ticketUpsertForm.value?.checkValidity()
  if (!validForm) {
    return ticketUpsertForm.value?.reportValidity()
  }
  if (
    ticket.value.ticketProductList!.length == 0 &&
    ticket.value.ticketProcedureList!.length == 0
  ) {
    return AlertStore.addError('Lỗi: cần có ít nhất 1 sản phẩm hoặc dịch vụ trong phiếu')
  }
  const invalidTicketProduct = ticket.value.ticketProductList!.find((vp) => vp.quantity === 0)
  if (invalidTicketProduct) {
    return AlertStore.addError(`Lỗi: ${invalidTicketProduct.product?.brandName} có số lượng 0`)
  }
  const invalidTicketProcedure = ticket.value.ticketProcedureList!.find((vp) => vp.quantity === 0)
  if (invalidTicketProcedure) {
    return AlertStore.addError(`Lỗi: ${invalidTicketProcedure.procedure?.name} có số lượng 0`)
  }

  try {
    saveLoading.value = true
    ticket.value.registeredAt = time.value.valueOf()
    ticket.value.ticketSurchargeList = ticket.value.ticketSurchargeList!.filter((i) => {
      i.name = settingStore.INVOICE_SURCHARGE_DETAIL[i.key] || i.name
      return i.money != 0
    })
    ticket.value.ticketExpenseList = ticket.value.ticketExpenseList!.filter((i) => {
      i.name = settingStore.INVOICE_EXPENSE_DETAIL[i.key] || i.name
      return i.money != 0
    })

    ticket.value.ticketAttributeList = Object.entries(ticket.value.ticketAttributeMap)
      .map(([key, value]) => ({
        id: 0,
        ticketId: ticket.value.id,
        key: key as any,
        value,
      }))
      .filter((i) => !!i.value)

    switch (type) {
      case ETicketOrderSave.CREATE_DRAFT: {
        const ticketResponse = await TicketOrderApi.createDraft({
          ticket: ticket.value,
        })
        router.push({ name: 'TicketOrderDetail', params: { id: ticketResponse!.id } })
        break
      }
      case ETicketOrderSave.UPDATE_DRAFT_APPROVED: {
        const ticketResponse = await TicketOrderApi.updateDraftApproved({
          ticket: ticket.value,
          ticketId: ticket.value.id,
        })
        router.push({ name: 'TicketOrderDetail', params: { id: ticketResponse!.id } })
        break
      }
      case ETicketOrderSave.CREATE_DEBT_SUCCESS: {
        await TicketOrderApi.createDebtSuccess({
          ticket: ticket.value,
        })
        ticket.value = Ticket.blank()

        const customerRes = Customer.from(CustomerService.customerDefault)
        customer.value = customerRes
        ticket.value.customer = customerRes
        ticket.value.customerId = customerRes.id
        inputOptionsCustomer.value?.setItem({
          text: customerRes.fullName,
          value: customerRes.id,
          data: customerRes,
        })

        AlertStore.add({ type: 'success', message: 'Tạo đơn thành công', time: 500 })
        break
      }

      case ETicketOrderSave.UPDATE_DEBT_SUCCESS: {
        ModalStore.confirm({
          title: 'Bạn có chắc chắn cập nhật hóa đơn này',
          content: [
            '- Nếu có thay đổi hàng hóa, kho hàng sẽ nhập lại hàng cũ và xuất hàng mới',
            ...(ticket.value.paid != oldTicket.value.paid
              ? [
                  `- Số tiền thanh toán thay đổi: ${formatMoney(
                    oldTicket.value.paid
                  )} --> ${formatMoney(ticket.value.paid)}`,
                ]
              : []),
            ...(ticket.value.paid > oldTicket.value.paid
              ? [
                  `- Khách hàng cần thanh toán thêm: ${formatMoney(
                    ticket.value.paid - oldTicket.value.paid
                  )}`,
                ]
              : []),
            ...(ticket.value.paid < oldTicket.value.paid
              ? [`- Trả lại khách hàng: ${formatMoney(oldTicket.value.paid - ticket.value.paid)}`]
              : []),
            ...(ticket.value.debt != oldTicket.value.debt
              ? [
                  `- Số tiền nợ đơn này thay đổi: ${formatMoney(
                    oldTicket.value.debt
                  )} --> ${formatMoney(ticket.value.debt)}`,
                ]
              : []),
            ...(ticket.value.debt > oldTicket.value.debt
              ? [`- Khách hàng nợ thêm: ${formatMoney(ticket.value.debt - oldTicket.value.debt)}`]
              : []),
            ...(ticket.value.debt < oldTicket.value.debt
              ? [`- Trừ nợ khách hàng: ${formatMoney(oldTicket.value.debt - ticket.value.debt)}`]
              : []),
          ],
          async onOk() {
            const ticketResponse = await TicketOrderApi.updateDebtSuccess({
              ticketId: ticket.value.id,
              ticket: ticket.value,
            })
            router.push({ name: 'TicketOrderDetail', params: { id: ticketResponse!.id } })
          },
          okText: 'Xác nhận CẬP NHẬT ĐƠN',
        })
        break
      }
      default:
        break
    }
  } catch (error: any) {
    console.log('🚀 ~ file: InvoiceUpsert.vue:248 ~ saveInvoice ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalTicketOrderUpsertSetting.value?.openModal()
  }
  if (menu.key === 'data-setting') {
    modalDataTicketOrder.value?.openModal()
  }
}

const handleChangeTabs = (activeKey: any) => {
  tabStart.value = activeKey
  localStorage.setItem('TICKET_ORDER_UPSERT_TAB_START', activeKey)
}
</script>

<template>
  <ModalTicketOrderUpsertSetting ref="modalTicketOrderUpsertSetting" />
  <ModalCustomerUpsert ref="modalCustomerUpsert" @success="createCustomer" />
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalDataTicketOrder ref="modalDataTicketOrder" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="md:block">
        <NodeIndexOutlined class="mr-2" />
        <span v-if="mode == ETicketOrderUpsertMode.CREATE">Tạo hóa đơn mới</span>
        <span v-if="mode == ETicketOrderUpsertMode.UPDATE">Cập nhật hóa đơn</span>
        <span v-if="mode == ETicketOrderUpsertMode.COPY">Copy hóa đơn</span>
      </div>
    </div>

    <div class="page-header-setting">
      <a-dropdown v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]" trigger="click">
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

  <div class="mt-4 md:mx-4">
    <div class="flex flex-wrap gap-4">
      <div style="flex-basis: 600px; flex-grow: 2" class="">
        <div class="bg-white p-4">
          <VueTabs :tabShow="tabStart" @update:tabShow="handleChangeTabs">
            <template #menu>
              <VueTabMenu
                v-if="permissionIdMap[PermissionId.PRODUCT_READ]"
                :tabKey="TABS_KEY.PRODUCT">
                Hàng hóa ({{ ticket.ticketProductList!.length }})
              </VueTabMenu>
              <VueTabMenu
                v-if="permissionIdMap[PermissionId.MASTER_DATA_PROCEDURE]"
                :tabKey="TABS_KEY.PROCEDURE">
                Dịch vụ ({{ ticket.ticketProcedureList!.length }})
              </VueTabMenu>
            </template>
            <template #panel>
              <VueTabPanel :tabKey="TABS_KEY.PRODUCT">
                <div class="mt-2">
                  <TicketOrderSelectProduct ref="ticketOrderSelectProduct" />
                </div>
              </VueTabPanel>
              <VueTabPanel :tabKey="TABS_KEY.PROCEDURE">
                <div class="mt-2">
                  <TicketOrderSelectProcedure ref="ticketOrderSelectProcedure" />
                </div>
              </VueTabPanel>
            </template>
          </VueTabs>
        </div>
        <div class="bg-white mt-4">
          <TicketOrderItemTable />
        </div>
      </div>
      <form ref="ticketUpsertForm" style="flex-basis: 300px; flex-grow: 1">
        <div class="bg-white p-4">
          <div class="flex justify-between">
            <span>
              Tên KH (nợ cũ:
              <b>{{ formatMoney(customer.debt) }}</b>
              )
              <a
                v-if="ticket.customerId"
                class="ml-1"
                @click="modalCustomerDetail?.openModal(ticket.customer!)">
                <IconFileSearch />
              </a>
            </span>
            <span>
              <a
                v-if="permissionIdMap[PermissionId.CUSTOMER_CREATE]"
                @click="modalCustomerUpsert?.openModal()">
                Thêm KH mới
              </a>
            </span>
          </div>
          <div style="height: 40px">
            <InputOptions
              ref="inputOptionsCustomer"
              :options="customerList.map((i) => ({ value: i.id, text: i.fullName, data: i }))"
              :maxHeight="320"
              placeholder="(F4) Tìm kiếm bằng Tên hoặc Số Điện Thoại"
              :disabled="mode == ETicketOrderUpsertMode.UPDATE"
              required
              @selectItem="({ data }) => selectCustomer(data)"
              @onFocusinFirst="handleFocusFirstSearchCustomer"
              @update:text="searchingCustomer">
              <template #option="{ item: { data } }">
                <div>
                  <b>{{ data.fullName }}</b>
                  - {{ DString.formatPhone(data.phone) }} -
                  {{ DTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
                </div>
                <div>{{ DString.formatAddress(data) }}</div>
              </template>
            </InputOptions>
          </div>
        </div>

        <div class="mt-4 p-4 bg-white">
          <div>Thông tin thanh toán</div>
          <div class="px-4 pb-4" style="border: 1px solid #cdcdcd">
            <table class="table w-full mt-2 table-payment">
              <tbody>
                <tr>
                  <td style="white-space: nowrap; padding-right: 10px">Thời gian</td>
                  <td style="text-align: right">
                    <a-date-picker
                      v-model:value="time"
                      show-time
                      placeholder="Select Time"
                      :format="'DD/MM/YYYY HH:mm:ss'" />
                  </td>
                </tr>
                <tr v-if="settingStore.SCREEN_INVOICE_UPSERT.paymentInfo.itemsActualMoney">
                  <td class="font-bold" style="white-space: nowrap; padding-right: 10px">
                    Tiền hàng
                  </td>
                  <td class="text-right" style="padding-right: 11px; font-size: 16px">
                    <span
                      v-if="ticket.itemsDiscount"
                      style="font-style: italic; font-size: 13px"
                      class="mr-2">
                      (CK {{ formatMoney(ticket.itemsDiscount) }})
                    </span>
                    <span>{{ formatMoney(ticket.itemsActualMoney) }}</span>
                  </td>
                </tr>
                <tr v-if="settingStore.SCREEN_INVOICE_UPSERT.paymentInfo.discount">
                  <td style="white-space: nowrap; padding-right: 10px">Chiết khấu</td>
                  <td class="cursor-pointer" style="font-size: 16px">
                    <a-popconfirm>
                      <template #cancelButton>
                        <div></div>
                      </template>
                      <template #okButton>
                        <div></div>
                      </template>
                      <template #title>
                        <div>
                          Chiết khấu (Tiền hàng:
                          <b>{{ formatMoney(ticket.productMoney + ticket.procedureMoney) }}</b>
                          )
                        </div>
                        <div class="mt-2">
                          <div>
                            <InputMoney
                              :value="ticket.discountMoney"
                              append="VNĐ"
                              style="width: 100%"
                              @update:value="handleChangeInvoiceDiscountMoney" />
                          </div>
                          <div class="mt-2">
                            <InputNumber
                              :value="ticket.discountPercent"
                              append="%"
                              @update:value="handleChangeInvoiceDiscountPercent" />
                          </div>
                        </div>
                      </template>
                      <div class="flex">
                        <div>
                          <a-tag color="success">{{ ticket.discountPercent || 0 }}%</a-tag>
                        </div>
                        <div
                          class="flex-1 text-right"
                          style="padding-right: 11px; border-bottom: 1px solid #cdcdcd">
                          {{ formatMoney(ticket.discountMoney) }}
                        </div>
                      </div>
                    </a-popconfirm>
                  </td>
                </tr>
                <tr v-if="settingStore.SCREEN_INVOICE_UPSERT.paymentInfo.surcharge">
                  <TicketOrderSurchargeList />
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td class="font-bold" style="white-space: nowrap; padding-right: 10px">
                    Tổng tiền
                  </td>
                  <td class="text-right font-bold" style="padding-right: 11px; font-size: 16px">
                    {{ formatMoney(ticket.totalMoney) }}
                  </td>
                </tr>
                <tr v-if="settingStore.SCREEN_INVOICE_UPSERT.paymentInfo.paid">
                  <td style="white-space: nowrap; padding-right: 10px">Thanh toán</td>
                  <td>
                    <InputMoney
                      v-model:value="ticket.paid"
                      class="input-payment"
                      style="width: 100%" />
                  </td>
                </tr>
                <tr v-if="settingStore.SCREEN_INVOICE_UPSERT.paymentInfo.debt">
                  <td style="white-space: nowrap; padding-right: 10px">Ghi nợ</td>
                  <td>
                    <InputMoney
                      :value="ticket.totalMoney - ticket.paid"
                      class="input-payment"
                      style="width: 100%"
                      @update:value="(v) => (ticket.paid = ticket.totalMoney - v)" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-4 p-4 bg-white">
          <div>Thông tin khác</div>
          <div class="px-4 pb-4" style="border: 1px solid #cdcdcd">
            <table class="table w-full mt-2 table-payment">
              <tbody>
                <tr v-if="settingStore.SCREEN_INVOICE_UPSERT.paymentInfo.expense">
                  <TicketOrderExpenseList />
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr v-if="settingStore.SCREEN_INVOICE_UPSERT.paymentInfo.profit">
                  <td class="font-bold whitespace-nowrap">Tổng vốn</td>
                  <td class="text-right font-bold" style="padding-right: 11px; font-size: 16px">
                    {{ formatMoney(ticket.totalCostAmount) }}
                  </td>
                </tr>
                <tr v-if="settingStore.SCREEN_INVOICE_UPSERT.paymentInfo.profit">
                  <td class="font-bold whitespace-nowrap">Tiền lãi</td>
                  <td class="text-right font-bold" style="padding-right: 11px; font-size: 16px">
                    {{ formatMoney(ticket.profit) }}
                  </td>
                </tr>
                <tr>
                  <td class="whitespace-nowrap">Ghi chú</td>
                  <td>
                    <a-input v-model:value="ticket.ticketAttributeMap.note" class="input-payment" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <template
          v-if="[ETicketOrderUpsertMode.CREATE, ETicketOrderUpsertMode.COPY].includes(mode)">
          <div
            v-if="
              settingStore.SCREEN_INVOICE_UPSERT.save.createDraft &&
              permissionIdMap[PermissionId.TICKET_ORDER_CREATE_DRAFT]
            "
            class="mt-4 w-full flex flex-col px-1">
            <VueButton
              color="blue"
              :loading="saveLoading"
              :size="'large'"
              type="button"
              icon="save"
              @click="saveInvoice(ETicketOrderSave.CREATE_DRAFT)">
              Lưu nháp
            </VueButton>
          </div>

          <div
            v-if="
              settingStore.SCREEN_INVOICE_UPSERT.save.createBasicAndNew &&
              permissionIdMap[PermissionId.TICKET_ORDER_CREATE_DEBT_SUCCESS]
            "
            class="mt-4 w-full flex flex-col px-1">
            <VueButton
              color="blue"
              type="button"
              :loading="saveLoading"
              size="large"
              icon="save"
              @click="saveInvoice(ETicketOrderSave.CREATE_DEBT_SUCCESS)">
              Lưu và Tạo đơn mới
            </VueButton>
          </div>
        </template>

        <template v-if="[ETicketOrderUpsertMode.UPDATE].includes(mode)">
          <div
            v-if="
              [TicketStatus.Draft].includes(ticket.ticketStatus) &&
              permissionIdMap[PermissionId.TICKET_ORDER_UPDATE_DRAFT_APPROVED]
            "
            class="mt-4 w-full flex flex-col px-1">
            <VueButton
              color="blue"
              :loading="saveLoading"
              size="large"
              type="button"
              icon="save"
              @click="saveInvoice(ETicketOrderSave.UPDATE_DRAFT_APPROVED)">
              Cập nhật đơn nháp
            </VueButton>
          </div>
          <div
            v-if="
              [TicketStatus.Approved].includes(ticket.ticketStatus) &&
              permissionIdMap[PermissionId.TICKET_ORDER_UPDATE_DRAFT_APPROVED]
            "
            class="mt-4 w-full flex flex-col px-1">
            <VueButton
              color="blue"
              :loading="saveLoading"
              size="large"
              type="button"
              icon="save"
              @click="saveInvoice(ETicketOrderSave.UPDATE_DRAFT_APPROVED)">
              Cập nhật đơn tạm ứng
            </VueButton>
          </div>
          <div
            v-if="
              [TicketStatus.Debt, TicketStatus.Completed].includes(ticket.ticketStatus) &&
              permissionIdMap[PermissionId.TICKET_ORDER_UPDATE_DEBT_SUCCESS]
            "
            class="mt-4 w-full flex flex-col px-1">
            <VueButton
              color="blue"
              :loading="saveLoading"
              size="large"
              type="button"
              icon="save"
              @click="saveInvoice(ETicketOrderSave.UPDATE_DEBT_SUCCESS)">
              Cập nhật đơn đã gửi
            </VueButton>
          </div>
        </template>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-payment {
  td {
    padding: 6px 0;
  }
}

:deep(.input-payment) {
  width: 100%;
  border-top: none;
  border-left: none;
  border-right: none;
  box-shadow: none !important;

  .ant-input-number-handler-wrap {
    display: none !important;
  }

  & input {
    text-align: right !important;
  }
}
</style>
