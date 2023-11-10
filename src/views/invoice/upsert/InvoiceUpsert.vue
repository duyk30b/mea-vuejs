<script setup lang="ts">
import { InputMoney, InputNumber, InputOptions, VueSelect } from '@/common/vue-form'
import { Customer, CustomerService, useCustomerStore } from '@/modules/customer'
import { DiscountType } from '@/modules/enum'
import { Invoice, InvoiceItem, InvoiceService } from '@/modules/invoice'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import {
  ExclamationCircleOutlined, NodeIndexOutlined,
  SaveOutlined, SettingOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import { onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalCustomerUpsert from '../../customer/upsert/ModalCustomerUpsert.vue'
import InvoiceItemCreate from './InvoiceItemCreate.vue'
import InvoiceItemTable from './InvoiceItemTable.vue'
import ModalDataInvoice from './ModalDataInvoice.vue'
import ModalInvoiceUpsertSettingScreen from './ModalInvoiceUpsertSettingScreen.vue'
import { invoice } from './invoice-upsert.store'

const modalInvoiceUpsertSettingScreen = ref<InstanceType<typeof ModalInvoiceUpsertSettingScreen>>()
const inputSearchCustomer = ref<InstanceType<typeof InputOptions>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()
const modalDataInvoice = ref<InstanceType<typeof ModalDataInvoice>>()

const router = useRouter()
const route = useRoute()

const customerStore = useCustomerStore()
const organizationStore = useOrganizationStore()
const { formatMoney } = organizationStore

const mode = ref<'CREATE' | 'UPDATE' | 'COPY'>('CREATE')

const customer = ref<Customer>(Customer.blank())
const customerList = ref<Customer[]>([])

const createTime = ref<Dayjs>(dayjs())

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
        customer: true,
        invoice_items: true,
      })

      invoice.value = invoiceResponse
      if (invoice.value.expensesDetails.length === 0) {
        invoice.value.expensesDetails.push({ key: '_unknown', name: '', money: invoice.value.expenses })
      }
      if (invoice.value.surchargeDetails.length === 0) {
        invoice.value.surchargeDetails.push({ key: '_unknown', name: '', money: invoice.value.surcharge })
      }
      customer.value = Customer.fromInstance(invoiceResponse.customer!)
      if (mode.value === 'CREATE' || mode.value === 'COPY') {
        createTime.value = dayjs(new Date())
      } else if (mode.value === 'UPDATE') {
        createTime.value = dayjs(new Date(invoice.value.createTime))
      }
    }
    if (customerId) {
      const customerRes = await CustomerService.detail(customerId)
      customer.value = customerRes
      invoice.value.customer = customerRes
      invoice.value.customerId = customerId
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
  window.addEventListener('keydown', handleDocumentKeyup)
  await customerStore.fetchAll()
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
  invoice.value = Invoice.blank()
})

const searchingCustomer = async (text: string) => {
  customer.value.id = 0
  if (text) {
    customerList.value = customerStore.search(text)
  } else {
    customerList.value = []
  }
}

const selectCustomer = (data: Customer) => {
  const snapCustomer = Customer.fromInstance(data)
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

const handleChangeInvoiceExpenses = (data: number) => {
  invoice.value.expenses = data
  const hasOther = invoice.value.expensesDetails.find((i) => i.key === '_unknown')
  if (!hasOther) {
    const key = '_unknown'
    const name = organizationStore.INVOICE_EXPENSES_DETAIL[key]
    invoice.value.expensesDetails.push({ key, name, money: data })
  }

  let totalKnownExpenses = 0
  let indexOther = 0
  for (let i = 0; i < invoice.value.expensesDetails.length; i++) {
    const item = invoice.value.expensesDetails[i]
    if (item.key !== '_unknown') totalKnownExpenses += item.money
    else indexOther = i
  }
  invoice.value.expensesDetails[indexOther].money = data - totalKnownExpenses
}

const handleChangeMoneyInvoiceExpensesDetail = (money: number, index: number) => {
  invoice.value.expensesDetails[index].money = money
  invoice.value.expenses = invoice.value.expensesDetails.reduce((acc, cur) => acc + cur.money, 0)
}

const handleAddExpensesDetail = () => {
  const existKey = invoice.value.expensesDetails.map((i) => i.key)
  existKey.push('_unknown')
  const allKey = Object.keys(organizationStore.INVOICE_EXPENSES_DETAIL)
  const key = allKey.find((i) => !existKey.includes(i)) || '_unknown'
  const name = organizationStore.INVOICE_EXPENSES_DETAIL[key]
  invoice.value.expensesDetails.push({ key, name, money: 0 })
}

const handleDeleteExpensesDetail = (index: number) => {
  invoice.value.expensesDetails.splice(index, 1)
  invoice.value.expenses = invoice.value.expensesDetails.reduce((acc, cur) => acc + cur.money, 0)
}

const handleChangeInvoiceSurcharge = (data: number) => {
  invoice.value.surcharge = data
  const hasOther = invoice.value.surchargeDetails.find((i) => i.key === '_unknown')
  if (!hasOther) {
    const key = '_unknown'
    const name = organizationStore.INVOICE_SURCHARGE_DETAIL[key]
    invoice.value.surchargeDetails.push({ key, name, money: data })
  }

  let totalKnownSurcharge = 0
  let indexOther = 0
  for (let i = 0; i < invoice.value.surchargeDetails.length; i++) {
    const item = invoice.value.surchargeDetails[i]
    if (item.key !== '_unknown') totalKnownSurcharge += item.money
    else indexOther = i
  }
  invoice.value.surchargeDetails[indexOther].money = data - totalKnownSurcharge
}

const handleChangeMoneyInvoiceSurchargeDetail = (money: number, index: number) => {
  invoice.value.surchargeDetails[index].money = money
  invoice.value.surcharge = invoice.value.surchargeDetails.reduce((acc, cur) => acc + cur.money, 0)
}

const handleAddSurchargeDetail = () => {
  const existKey = invoice.value.surchargeDetails.map((i) => i.key)
  existKey.push('_unknown')
  const allKey = Object.keys(organizationStore.INVOICE_SURCHARGE_DETAIL)
  const key = allKey.find((i) => !existKey.includes(i)) || '_unknown'
  const name = organizationStore.INVOICE_SURCHARGE_DETAIL[key]
  invoice.value.surchargeDetails.push({ key, name, money: 0 })
}

const handleDeleteSurchargeDetail = (index: number) => {
  invoice.value.surchargeDetails.splice(index, 1)
  invoice.value.surcharge = invoice.value.surchargeDetails.reduce((acc, cur) => acc + cur.money, 0)
}

const saveInvoice = async () => {
  if (!customer.value.id) {
    message.error('Lỗi: chưa chọn khách hàng')
    inputSearchCustomer.value?.focus()
    return
  }
  if (invoice.value.invoiceItems.length == 0) {
    return message.error('Lỗi: cần có ít nhất 1 dịch vụ trong phiếu')
  }
  const invalidInvoiceItem = invoice.value.invoiceItems.find((ii) => ii.quantity === 0)
  if (invalidInvoiceItem) {
    return message.error(`Lỗi: dịch vụ ${invalidInvoiceItem.procedure?.name} có số lượng 0`)
  }

  try {
    saveLoading.value = true
    invoice.value.createTime = createTime.value.valueOf()
    invoice.value.surchargeDetails = invoice.value.surchargeDetails.filter((i) => {
      i.name = organizationStore.INVOICE_SURCHARGE_DETAIL[i.key] || i.name
      return i.money != 0
    })
    invoice.value.expensesDetails = invoice.value.expensesDetails.filter((i) => {
      i.name = organizationStore.INVOICE_EXPENSES_DETAIL[i.key] || i.name
      return i.money != 0
    })
    let response: { invoiceId: number }
    if (mode.value === 'CREATE') {
      response = await InvoiceService.createDraft(invoice.value)
    } else if (mode.value === 'UPDATE') {
      response = await InvoiceService.updateDraft(invoice.value.id, invoice.value)
    } else if (mode.value === 'COPY') {
      response = await InvoiceService.createDraft(invoice.value)
    }
    router.push({ name: 'InvoiceDetail', params: { id: response!.invoiceId } })
  } catch (error) {
    console.log('🚀 ~ file: InvoiceUpsert.vue:170 ~ saveInvoice ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleAddInvoiceItem = (ii: InvoiceItem) => {
  const invoiceItem = InvoiceItem.fromObject(ii)
  invoice.value.invoiceItems.push(invoiceItem)
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
        <NodeIndexOutlined />
        <span>
          {{ mode === 'UPDATE' ? 'Cập nhật hóa đơn' : 'Tạo hóa đơn mới' }}
        </span>
      </div>
    </div>
    <div class="page-header-setting">
      <a-dropdown trigger="click">
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
      <div class="md:w-2/3 ">
        <div class="bg-white p-4">
          <InvoiceItemCreate :invoice="invoice" @add_invoice_item="handleAddInvoiceItem" />
        </div>
        <div class="bg-white mt-4">
          <InvoiceItemTable />
        </div>
      </div>
      <div class="md:w-1/3 ">
        <div class="bg-white p-4">
          <div class="flex justify-between">
            <span>Tên KH (nợ cũ: <b>{{ formatMoney(customer.debt) }}</b>)</span>
            <a @click="modalCustomerUpsert?.openModal()">Thêm khách hàng mới</a>
          </div>
          <InputOptions ref="inputSearchCustomer" :options="customerList" v-model:searchText="customer.fullName"
            @selectItem="selectCustomer" :maxHeight="260" @update:searchText="searchingCustomer"
            placeholder="(F4) Tìm kiếm bằng Tên hoặc Số Điện Thoại" :disabled="mode !== 'CREATE'">
            <template
              v-slot:each="{ item: { fullName, phone, addressProvince, addressDistrict, addressWard, birthday } }">
              <div> <b>{{ fullName }}</b> - {{ phone }} - {{ timeToText(birthday, 'DD/MM/YYYY') }} </div>
              <div> {{ addressWard }} - {{ addressDistrict }} - {{ addressProvince }} </div>
            </template>
          </InputOptions>
        </div>

        <div class="mt-4 p-4 bg-white">
          <div>Thông tin thanh toán</div>
          <div class="px-4 pb-4" style="border: 1px solid #cdcdcd;">
            <table class="table w-full mt-2 table-payment">
              <tbody>
                <tr>
                  <td class="whitespace-nowrap">Thời gian</td>
                  <td>
                    <a-date-picker show-time placeholder="Select Time" v-model:value="createTime"
                      :format="'DD/MM/YYYY HH:mm:ss'" style="width: 100%;" />
                  </td>
                </tr>
                <tr>
                  <td class="font-bold whitespace-nowrap" style="width: 120px;">Tiền hàng</td>
                  <td class="text-right" style="padding-right: 11px; font-size: 16px;">
                    {{ formatMoney(invoice.totalItemMoney) }}
                  </td>
                </tr>
                <tr v-if="organizationStore.SCREEN_INVOICE_UPSERT.paymentInfo.discount">
                  <td class="whitespace-nowrap">Chiết khấu</td>
                  <td class="cursor-pointer" style="font-size: 16px;">
                    <a-popconfirm>
                      <template #cancelButton>
                        <div></div>
                      </template>
                      <template #okButton>
                        <div></div>
                      </template>
                      <template #title>
                        <div>Chiết khấu (Tiền hàng: <b>{{ formatMoney(invoice.totalItemMoney) }}</b>)
                        </div>
                        <div class="mt-2">
                          <div>
                            <InputMoney :value="invoice.discountMoney" @update:value="handleChangeInvoiceDiscountMoney"
                              append="VNĐ" style="width: 100%;" />
                          </div>
                          <div class="mt-2">
                            <InputNumber :value="invoice.discountPercent"
                              @update:value="handleChangeInvoiceDiscountPercent" append="%" />
                          </div>
                        </div>
                      </template>
                      <div class="flex">
                        <div>
                          <a-tag color="success">
                            {{ invoice.discountPercent || 0 }}%
                          </a-tag>
                        </div>
                        <div class="flex-1 text-right" style="padding-right: 11px; border-bottom: 1px solid #cdcdcd;">
                          {{ formatMoney(invoice.discountMoney) }}
                        </div>
                      </div>
                    </a-popconfirm>
                  </td>
                </tr>
                <tr v-if="organizationStore.SCREEN_INVOICE_UPSERT.paymentInfo.surcharge">
                  <td class="cursor-pointer whitespace-nowrap">
                    <a-popconfirm>
                      <template #cancelButton>
                        <div></div>
                      </template>
                      <template #okButton>
                        <div></div>
                      </template>
                      <template #title>
                        <div style="width: 320px;">
                          <div class="flex">
                            <div style="width: 160px; font-size: 13px;">Loại phụ phí</div>
                            <div style="flex: 1; font-size: 13px;">Số tiền</div>
                          </div>
                          <div class="flex flex-col gap-2 mt-2">
                            <div v-for="(surcharge, index) in invoice.surchargeDetails" :key="index"
                              class="flex items-stretch">
                              <VueSelect style="width: 160px;" v-model:value="invoice.surchargeDetails[index].key"
                                :options="[
                                  ...Object.entries(organizationStore.INVOICE_SURCHARGE_DETAIL).map(([key, text]) => ({ value: key, text: text })),
                                  ...(organizationStore.INVOICE_SURCHARGE_DETAIL[surcharge.key] ? [] : [{ value: surcharge.key, text: surcharge.name }])
                                ].reverse()" />
                              <div style="flex: 1">
                                <InputMoney :value="surcharge.money"
                                  @update:value="(data) => handleChangeMoneyInvoiceSurchargeDetail(data, index)" />
                              </div>
                              <div style="width: 60px;">
                                <a-button danger @click="handleDeleteSurchargeDetail(index)">Xóa</a-button>
                              </div>
                            </div>
                          </div>
                          <div class="text-end mt-1" style="font-size: 13px;">
                            <a @click="handleAddSurchargeDetail">Thêm phụ phí khác</a>
                          </div>
                          <div class="flex mt-2">
                            <div style="width: 160px;">Tổng phụ phí:</div>
                            <div style="flex: 1">
                              <b class="ml-3" style="font-size: 16px;">
                                {{ formatMoney(invoice.surcharge) }}
                              </b>
                            </div>
                          </div>
                        </div>
                      </template>
                      <div>
                        <span class="mr-2"> Phụ phí</span>
                        <ExclamationCircleOutlined />
                      </div>
                    </a-popconfirm>
                  </td>
                  <td>
                    <InputMoney :value="invoice.surcharge" @update:value="handleChangeInvoiceSurcharge"
                      class="input-payment" style="width: 100%;" />
                  </td>
                </tr>
                <tr><td></td><td></td></tr>
                <tr>
                  <td class="font-bold whitespace-nowrap">Tổng tiền</td>
                  <td class="text-right font-bold" style="padding-right: 11px; font-size: 16px;">
                    {{ formatMoney(invoice.totalMoney) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-4 p-4 bg-white">
          <div>Thông tin khác</div>
          <div class="px-4 pb-4" style="border: 1px solid #cdcdcd;">
            <table class="table w-full mt-2 table-payment">
              <tbody>
                <tr v-if="organizationStore.SCREEN_INVOICE_UPSERT.other.expenses">
                  <td class="cursor-pointer whitespace-nowrap">
                    <a-popconfirm>
                      <template #cancelButton>
                        <div></div>
                      </template>
                      <template #okButton>
                        <div></div>
                      </template>
                      <template #title>
                        <div style="width: 320px;">
                          <div class="flex">
                            <div style="width: 160px; font-size: 13px;">Loại chi phí</div>
                            <div style="flex: 1; font-size: 13px;">Số tiền</div>
                          </div>
                          <div class="flex flex-col gap-2 mt-2">
                            <div v-for="(expenses, index) in invoice.expensesDetails" :key="index"
                              class="flex items-stretch">
                              <VueSelect style="width: 160px;" v-model:value="invoice.expensesDetails[index].key"
                                :options="[
                                  ...Object.entries(organizationStore.INVOICE_EXPENSES_DETAIL).map(([key, text]) => ({ value: key, text: text })),
                                  ...(organizationStore.INVOICE_EXPENSES_DETAIL[expenses.key] ? [] : [{ value: expenses.key, text: expenses.name }])
                                ].reverse()" />
                              <div style="flex: 1">
                                <InputMoney :value="expenses.money"
                                  @update:value="(data) => handleChangeMoneyInvoiceExpensesDetail(data, index)" />
                              </div>
                              <div style="width: 60px;">
                                <a-button danger @click="handleDeleteExpensesDetail(index)">Xóa</a-button>
                              </div>
                            </div>
                          </div>
                          <div class="text-end mt-1" style="font-size: 13px;">
                            <a @click="handleAddExpensesDetail"> Thêm chi phí khác</a>
                          </div>
                          <div class="flex mt-2">
                            <div style="width: 160px;">Tổng chi phí:</div>
                            <div style="flex: 1">
                              <b class="ml-3" style="font-size: 16px;">
                                {{ formatMoney(invoice.expenses) }}
                              </b>
                            </div>
                          </div>
                        </div>
                      </template>
                      <div>
                        <span class="mr-2"> Chi phí</span>
                        <ExclamationCircleOutlined />
                      </div>
                    </a-popconfirm>
                  </td>
                  <td>
                    <InputMoney :value="invoice.expenses" @update:value="handleChangeInvoiceExpenses"
                      class="input-payment" style="width: 100%;" />
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

        <div class="mt-4">
          <a-button @click="saveInvoice" type="primary" :loading="saveLoading" size="large" block>
            <template #icon>
              <SaveOutlined />
            </template>
            Lưu lại
          </a-button>
        </div>
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
