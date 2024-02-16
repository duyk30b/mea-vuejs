<script setup lang="ts">
import { NodeIndexOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import { onBeforeMount, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputMoney, InputNumber, InputOptions } from '../../../common/vue-form'
import { Customer, CustomerApi, useCustomerStore } from '../../../modules/customer'
import { DiscountType } from '../../../modules/enum'
import {
  Invoice,
  InvoiceExpense,
  InvoiceService,
  InvoiceStatus,
  InvoiceSurcharge,
} from '../../../modules/invoice'
import { useProductStore } from '../../../modules/product'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { timeToText } from '../../../utils'
import ModalCustomerUpsert from '../../customer/upsert/ModalCustomerUpsert.vue'
import InvoiceExpenses from './InvoiceExpenses.vue'
import InvoiceItemTable from './InvoiceItemTable.vue'
import InvoiceSurcharges from './InvoiceSurcharges.vue'
import InvoiceItemContainer from './invoice-item-create/InvoiceItemContainer.vue'
import { EInvoiceSave, EInvoiceUpsertMode, invoice } from './invoice-upsert.store'
import ModalDataInvoice from './modal-setting/ModalDataInvoice.vue'
import ModalInvoiceUpsertSettingScreen from './modal-setting/ModalInvoiceUpsertSettingScreen.vue'
import type { InvoiceItem } from '../../../modules/invoice-item/invoice-item.model'
import { useMeStore } from '../../../modules/_me/me.store'
import { PermissionId } from '../../../modules/permission/permission.enum'

const modalInvoiceUpsertSettingScreen = ref<InstanceType<typeof ModalInvoiceUpsertSettingScreen>>()
const inputSearchCustomer = ref<InstanceType<typeof InputOptions>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()
const modalDataInvoice = ref<InstanceType<typeof ModalDataInvoice>>()
const invoiceUpsertForm = ref<InstanceType<typeof HTMLFormElement>>()

const router = useRouter()
const route = useRoute()

const productStore = useProductStore()
const customerStore = useCustomerStore()
const screenStore = useScreenStore()
const meStore = useMeStore()
const { permissionIdMap } = meStore
const { formatMoney } = screenStore

const mode = ref<EInvoiceUpsertMode>(EInvoiceUpsertMode.CREATE)

const customer = ref<Customer>(Customer.blank())
const customerList = ref<Customer[]>([])

const time = ref<Dayjs>(dayjs())

const saveLoading = ref(false)

onBeforeMount(async () => {
  try {
    const invoiceId = Number(route.params.id)
    const customerId = Number(route.query.customer_id)
    if (route.query.mode) {
      mode.value = route.query.mode as any
    }
    if (invoiceId) {
      const invoiceResponse = await InvoiceService.detail(invoiceId, {
        relation: {
          customer: true,
          invoiceItems: true,
          invoiceExpenses: true,
          invoiceSurcharges: true,
        },
      })

      invoice.value = invoiceResponse
      if (invoice.value.invoiceExpenses!.length === 0) {
        invoice.value.invoiceExpenses!.push(InvoiceExpense.blank())
      }
      if (invoice.value.invoiceSurcharges!.length === 0) {
        invoice.value.invoiceSurcharges!.push(InvoiceSurcharge.blank())
      }
      customer.value = Customer.fromInstance(invoiceResponse.customer!)
      if (mode.value === EInvoiceUpsertMode.CREATE || mode.value === EInvoiceUpsertMode.COPY) {
        time.value = dayjs(new Date())
      } else if (mode.value === EInvoiceUpsertMode.UPDATE) {
        time.value = dayjs(new Date(invoice.value.time))
      }
    } else if (customerId) {
      const customerRes = await CustomerApi.detail(customerId)
      customer.value = customerRes
      invoice.value.customer = customerRes
      invoice.value.customerId = customerId
    } else {
      const customerRes = Customer.fromPlain(meStore.customerDefault || Customer.blank())
      customer.value = customerRes
      invoice.value.customer = customerRes
      invoice.value.customerId = customerRes.id
    }
  } catch (error) {
    console.log('🚀 ~ file: ArrivalInvoiceUpsert.vue:73 ~ error:', error)
  }
})

const handleDocumentKeyup = (e: KeyboardEvent) => {
  if (e.key === 'F4') {
    e.preventDefault()
    inputSearchCustomer.value?.focus()
  }
}
onMounted(async () => {
  try {
    window.addEventListener('keydown', handleDocumentKeyup)
    await customerStore.refreshDB()
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
  invoice.value = Invoice.blank()
})

const searchingCustomer = async (text: string) => {
  customer.value.id = 0
  if (text) {
    customerList.value = await customerStore.search(text)
  } else {
    customerList.value = []
  }
}

const selectCustomer = (data: Customer) => {
  const snapCustomer = Customer.fromInstance(data || Customer.blank())
  invoice.value.customerId = snapCustomer.id!
  invoice.value.customer = snapCustomer
  customer.value = snapCustomer
}

const handleChangeInvoiceDiscountMoney = (data: number) => {
  invoice.value.discountMoney = data
  invoice.value.discountType = DiscountType.VND
}
const handleChangeInvoiceDiscountPercent = (data: number) => {
  invoice.value.discountPercent = data
  invoice.value.discountType = DiscountType.Percent
}

const saveInvoice = async (type: EInvoiceSave) => {
  const validForm = invoiceUpsertForm.value?.checkValidity()
  if (!validForm) {
    return invoiceUpsertForm.value?.reportValidity()
  }
  if (invoice.value.invoiceItems!.length == 0) {
    return message.error('Lỗi: cần có ít nhất 1 dịch vụ trong phiếu')
  }
  const invalidInvoiceItem = invoice.value.invoiceItems!.find((ii) => ii.quantity === 0)
  if (invalidInvoiceItem) {
    return message.error(`Lỗi: dịch vụ ${invalidInvoiceItem.procedure?.name} có số lượng 0`)
  }

  try {
    saveLoading.value = true
    invoice.value.time = time.value.valueOf()
    invoice.value.invoiceSurcharges = invoice.value.invoiceSurcharges!.filter((i) => {
      i.name = screenStore.INVOICE_SURCHARGE_DETAIL[i.key] || i.name
      return i.money != 0
    })
    invoice.value.invoiceExpenses = invoice.value.invoiceExpenses!.filter((i) => {
      i.name = screenStore.INVOICE_EXPENSE_DETAIL[i.key] || i.name
      return i.money != 0
    })

    switch (type) {
      case EInvoiceSave.CREATE_DRAFT: {
        const response = await InvoiceService.createDraft(invoice.value)
        router.push({ name: 'InvoiceDetail', params: { id: response!.invoiceId } })
        break
      }
      case EInvoiceSave.CREATE_BASIC_AND_DETAIL: {
        const response = await InvoiceService.createBasic(invoice.value)
        router.push({ name: 'InvoiceDetail', params: { id: response!.invoiceId } })
        break
      }
      case EInvoiceSave.CREATE_BASIC_AND_NEW: {
        await InvoiceService.createBasic(invoice.value)
        invoice.value = Invoice.blank()

        const customerRes = Customer.fromPlain(meStore.customerDefault)
        customer.value = customerRes
        invoice.value.customer = customerRes
        invoice.value.customerId = customerRes.id

        AlertStore.add({ type: 'success', message: 'Tạo đơn thành công', time: 500 })
        await productStore.refreshDB() //update product mới nhất luôn
        break
      }
      case EInvoiceSave.UPDATE_DRAFT: {
        const response = await InvoiceService.updateDraft(invoice.value.id, invoice.value)
        router.push({ name: 'InvoiceDetail', params: { id: response!.invoiceId } })
        break
      }
      case EInvoiceSave.UPDATE_BASIC: {
        const response = await InvoiceService.updateBasic(invoice.value.id, invoice.value)
        router.push({ name: 'InvoiceDetail', params: { id: response!.invoiceId } })
        break
      }
      default:
        break
    }
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  } finally {
    saveLoading.value = false
  }
}

const handleAddInvoiceItem = (invoiceItem: InvoiceItem) => {
  if (screenStore.SCREEN_INVOICE_UPSERT.invoiceItemsTable.allowDuplicateItem) {
    invoice.value.invoiceItems!.unshift(invoiceItem)
  } else {
    const exist = invoice.value.invoiceItems?.find((i) => {
      return i.referenceId === invoiceItem.referenceId
    })
    if (exist) {
      exist.quantity += invoiceItem.quantity
    } else {
      invoice.value.invoiceItems!.unshift(invoiceItem)
    }
  }
}

const handleMenuSettingClick = (menu: { key: string }) => {
  if (menu.key === 'screen-setting') {
    modalInvoiceUpsertSettingScreen.value?.openModal()
  }
  if (menu.key === 'data-setting') {
    modalDataInvoice.value?.openModal()
  }
}
</script>

<template>
  <ModalInvoiceUpsertSettingScreen ref="modalInvoiceUpsertSettingScreen" />
  <ModalCustomerUpsert ref="modalCustomerUpsert" @success="selectCustomer" />
  <ModalDataInvoice ref="modalDataInvoice" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="md:block">
        <NodeIndexOutlined class="mr-2" />
        <span v-if="mode == EInvoiceUpsertMode.CREATE">Tạo hóa đơn mới</span>
        <span v-if="mode == EInvoiceUpsertMode.UPDATE">Cập nhật hóa đơn</span>
        <span v-if="mode == EInvoiceUpsertMode.COPY">Copy hóa đơn</span>
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

  <div class="mt-4 md:mx-4 invoice-procedure-upsert-tabs">
    <div class="flex flex-col md:flex-row gap-4">
      <div class="md:w-2/3">
        <div class="bg-white p-4">
          <InvoiceItemContainer :invoice="invoice" @addInvoiceItem="handleAddInvoiceItem" />
        </div>
        <div class="bg-white mt-4">
          <InvoiceItemTable />
        </div>
      </div>
      <form ref="invoiceUpsertForm" class="md:w-1/3">
        <div class="bg-white p-4">
          <div class="flex justify-between">
            <span>
              Tên KH (nợ cũ: <b>{{ formatMoney(customer.debt) }}</b>
              )
            </span>
            <span>
              <a
                v-if="permissionIdMap[PermissionId.CUSTOMER_CREATE]"
                @click="modalCustomerUpsert?.openModal()"
              >
                Thêm khách hàng mới
              </a>
            </span>
          </div>
          <div style="height: 40px">
            <InputOptions
              ref="inputSearchCustomer"
              v-model:searchText="customer.fullName"
              :options="customerList"
              :maxHeight="260"
              placeholder="(F4) Tìm kiếm bằng Tên hoặc Số Điện Thoại"
              required
              :disabled="mode === EInvoiceUpsertMode.UPDATE"
              @selectItem="selectCustomer"
              @update:searchText="searchingCustomer"
            >
              <template
                #each="{
                  item: {
                    fullName,
                    phone,
                    addressProvince,
                    addressDistrict,
                    addressWard,
                    birthday,
                  },
                }"
              >
                <div>
                  <b>{{ fullName }}</b> - {{ phone }} - {{ timeToText(birthday, 'DD/MM/YYYY') }}
                </div>
                <div>{{ addressWard }} - {{ addressDistrict }} - {{ addressProvince }}</div>
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
                  <td class="whitespace-nowrap">Thời gian</td>
                  <td>
                    <a-date-picker
                      v-model:value="time"
                      show-time
                      placeholder="Select Time"
                      :format="'DD/MM/YYYY HH:mm:ss'"
                      style="width: 100%; margin-left: 0.5rem"
                    />
                  </td>
                </tr>
                <tr v-if="screenStore.SCREEN_INVOICE_UPSERT.paymentInfo.itemsActualMoney">
                  <td class="font-bold whitespace-nowrap" style="width: 120px">Tiền hàng</td>
                  <td class="text-right" style="padding-right: 11px; font-size: 16px">
                    {{ formatMoney(invoice.itemsActualMoney) }}
                  </td>
                </tr>
                <tr v-if="screenStore.SCREEN_INVOICE_UPSERT.paymentInfo.discount">
                  <td class="whitespace-nowrap">Chiết khấu</td>
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
                          Chiết khấu (Tiền hàng: <b>{{ formatMoney(invoice.itemsActualMoney) }}</b
                          >)
                        </div>
                        <div class="mt-2">
                          <div>
                            <InputMoney
                              :value="invoice.discountMoney"
                              append="VNĐ"
                              style="width: 100%"
                              @update:value="handleChangeInvoiceDiscountMoney"
                            />
                          </div>
                          <div class="mt-2">
                            <InputNumber
                              :value="invoice.discountPercent"
                              append="%"
                              @update:value="handleChangeInvoiceDiscountPercent"
                            />
                          </div>
                        </div>
                      </template>
                      <div class="flex">
                        <div>
                          <a-tag color="success"> {{ invoice.discountPercent || 0 }}% </a-tag>
                        </div>
                        <div
                          class="flex-1 text-right"
                          style="padding-right: 11px; border-bottom: 1px solid #cdcdcd"
                        >
                          {{ formatMoney(invoice.discountMoney) }}
                        </div>
                      </div>
                    </a-popconfirm>
                  </td>
                </tr>
                <tr v-if="screenStore.SCREEN_INVOICE_UPSERT.paymentInfo.surcharge">
                  <InvoiceSurcharges />
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td class="font-bold whitespace-nowrap">Tổng tiền</td>
                  <td class="text-right font-bold" style="padding-right: 11px; font-size: 16px">
                    {{ formatMoney(invoice.revenue) }}
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
                <tr v-if="screenStore.SCREEN_INVOICE_UPSERT.paymentInfo.expense">
                  <InvoiceExpenses />
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr v-if="screenStore.SCREEN_INVOICE_UPSERT.paymentInfo.profit">
                  <td class="font-bold whitespace-nowrap">Tiền lãi</td>
                  <td class="text-right font-bold" style="padding-right: 11px; font-size: 16px">
                    {{ formatMoney(invoice.profit) }}
                  </td>
                </tr>
                <tr>
                  <td class="whitespace-nowrap">Ghi chú</td>
                  <td>
                    <a-input v-model:value="invoice.note" class="input-payment" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <template v-if="[EInvoiceUpsertMode.CREATE, EInvoiceUpsertMode.COPY].includes(mode)">
          <div
            v-if="
              permissionIdMap[PermissionId.INVOICE] &&
              screenStore.SCREEN_INVOICE_UPSERT.save.createBasicAndNew
            "
            class="mt-4"
          >
            <a-button
              type="primary"
              :loading="saveLoading"
              size="large"
              block
              @click="saveInvoice(EInvoiceSave.CREATE_BASIC_AND_NEW)"
            >
              <template #icon>
                <SaveOutlined />
              </template>
              Lưu và Tạo đơn mới
            </a-button>
          </div>

          <div
            v-if="
              permissionIdMap[PermissionId.INVOICE] &&
              screenStore.SCREEN_INVOICE_UPSERT.save.createBasicAndDetail
            "
            class="mt-4"
          >
            <a-button
              type="primary"
              :loading="saveLoading"
              size="large"
              block
              @click="saveInvoice(EInvoiceSave.CREATE_BASIC_AND_DETAIL)"
            >
              <template #icon>
                <SaveOutlined />
              </template>
              Lưu và Xem chi tiết
            </a-button>
          </div>

          <div
            v-if="
              permissionIdMap[PermissionId.INVOICE_CREATE_DRAFT] &&
              screenStore.SCREEN_INVOICE_UPSERT.save.createDraft
            "
            class="mt-4"
          >
            <a-button
              type="primary"
              :loading="saveLoading"
              size="large"
              block
              @click="saveInvoice(EInvoiceSave.CREATE_DRAFT)"
            >
              <template #icon>
                <SaveOutlined />
              </template>
              Lưu nháp
            </a-button>
          </div>
        </template>

        <template v-if="[EInvoiceUpsertMode.UPDATE].includes(mode)">
          <div
            v-if="
              permissionIdMap[PermissionId.INVOICE_UPDATE_DRAFT] &&
              [InvoiceStatus.Draft].includes(invoice.status)
            "
            class="mt-4"
          >
            <a-button
              type="primary"
              :loading="saveLoading"
              size="large"
              block
              @click="saveInvoice(EInvoiceSave.UPDATE_DRAFT)"
            >
              <template #icon>
                <SaveOutlined />
              </template>
              Cập nhật đơn nháp
            </a-button>
          </div>

          <div
            v-if="
              permissionIdMap[PermissionId.INVOICE] &&
              [InvoiceStatus.Debt, InvoiceStatus.Success].includes(invoice.status)
            "
            class="mt-4"
          >
            <a-button
              type="primary"
              :loading="saveLoading"
              size="large"
              block
              @click="saveInvoice(EInvoiceSave.UPDATE_BASIC)"
            >
              <template #icon>
                <SaveOutlined />
              </template>
              Cập nhật đơn
            </a-button>
          </div>
        </template>
      </form>
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
