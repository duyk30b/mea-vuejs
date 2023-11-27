<script setup lang="ts">
import { InputMoney, InputNumber, InputOptions } from '@/common/vue-form'
import { Customer, CustomerService, useCustomerStore } from '@/modules/customer'
import { DiscountType } from '@/modules/enum'
import { Invoice, InvoiceExpense, InvoiceItem, InvoiceService, InvoiceSurcharge } from '@/modules/invoice'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import { NodeIndexOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import { onBeforeMount, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalCustomerUpsert from '../../customer/upsert/ModalCustomerUpsert.vue'
import InvoiceExpenses from './InvoiceExpenses.vue'
import InvoiceItemCreate from './InvoiceItemCreate.vue'
import InvoiceItemTable from './InvoiceItemTable.vue'
import InvoiceSurcharges from './InvoiceSurcharges.vue'
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
      if (invoice.value.invoiceExpenses.length === 0) {
        invoice.value.invoiceExpenses.push(InvoiceExpense.blank())
      }
      if (invoice.value.invoiceSurcharges.length === 0) {
        invoice.value.invoiceSurcharges.push(InvoiceSurcharge.blank())
      }
      customer.value = Customer.fromInstance(invoiceResponse.customer!)
      if (mode.value === 'CREATE' || mode.value === 'COPY') {
        time.value = dayjs(new Date())
      } else if (mode.value === 'UPDATE') {
        time.value = dayjs(new Date(invoice.value.time))
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
    invoice.value.time = time.value.valueOf()
    invoice.value.invoiceSurcharges = invoice.value.invoiceSurcharges.filter((i) => {
      i.name = organizationStore.INVOICE_SURCHARGE_DETAIL[i.key] || i.name
      return i.money != 0
    })
    invoice.value.invoiceExpenses = invoice.value.invoiceExpenses.filter((i) => {
      i.name = organizationStore.INVOICE_EXPENSE_DETAIL[i.key] || i.name
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
            <a-menu-item key="screen-setting">
              Cài đặt hiển thị
            </a-menu-item>
            <a-menu-item key="data-setting">
              Cài đặt dữ liệu
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>

  <div class="mt-4 md:mx-4 invoice-procedure-upsert-tabs">
    <div class="flex flex-col md:flex-row gap-4">
      <div class="md:w-2/3">
        <div class="bg-white p-4">
          <InvoiceItemCreate :invoice="invoice" @add_invoice_item="handleAddInvoiceItem" />
        </div>
        <div class="bg-white mt-4">
          <InvoiceItemTable />
        </div>
      </div>
      <div class="md:w-1/3">
        <div class="bg-white p-4">
          <div class="flex justify-between">
            <span>Tên KH (nợ cũ: <b>{{ formatMoney(customer.debt) }}</b>)</span>
            <a @click="modalCustomerUpsert?.openModal()">Thêm khách hàng mới</a>
          </div>
          <div style="height: 40px">
            <InputOptions
              ref="inputSearchCustomer"
              v-model:searchText="customer.fullName"
              :options="customerList"
              :maxHeight="260"
              placeholder="(F4) Tìm kiếm bằng Tên hoặc Số Điện Thoại"
              :disabled="mode !== 'CREATE'"
              @selectItem="selectCustomer"
              @update:searchText="searchingCustomer"
            >
              <template #each="{ item: { fullName, phone, addressProvince, addressDistrict, addressWard, birthday } }">
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
                  <td class="whitespace-nowrap">
                    Thời gian
                  </td>
                  <td>
                    <a-date-picker
                      v-model:value="time"
                      show-time
                      placeholder="Select Time"
                      :format="'DD/MM/YYYY HH:mm:ss'"
                      style="width: 100%"
                    />
                  </td>
                </tr>
                <tr>
                  <td class="font-bold whitespace-nowrap" style="width: 120px">
                    Tiền hàng
                  </td>
                  <td class="text-right" style="padding-right: 11px; font-size: 16px">
                    {{ formatMoney(invoice.itemsActualMoney) }}
                  </td>
                </tr>
                <tr v-if="organizationStore.SCREEN_INVOICE_UPSERT.paymentInfo.discount">
                  <td class="whitespace-nowrap">
                    Chiết khấu
                  </td>
                  <td class="cursor-pointer" style="font-size: 16px">
                    <a-popconfirm>
                      <template #cancelButton>
                        <div />
                      </template>
                      <template #okButton>
                        <div />
                      </template>
                      <template #title>
                        <div>
                          Chiết khấu (Tiền hàng: <b>{{ formatMoney(invoice.itemsActualMoney) }}</b>)
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
                          <a-tag color="success">
                            {{ invoice.discountPercent || 0 }}%
                          </a-tag>
                        </div>
                        <div class="flex-1 text-right" style="padding-right: 11px; border-bottom: 1px solid #cdcdcd">
                          {{ formatMoney(invoice.discountMoney) }}
                        </div>
                      </div>
                    </a-popconfirm>
                  </td>
                </tr>
                <tr v-if="organizationStore.SCREEN_INVOICE_UPSERT.paymentInfo.surcharge">
                  <InvoiceSurcharges />
                </tr>
                <tr>
                  <td />
                  <td />
                </tr>
                <tr>
                  <td class="font-bold whitespace-nowrap">
                    Tổng tiền
                  </td>
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
                <tr v-if="organizationStore.SCREEN_INVOICE_UPSERT.paymentInfo.expense">
                  <InvoiceExpenses />
                </tr>
                <tr>
                  <td />
                  <td />
                </tr>
                <tr v-if="organizationStore.SCREEN_INVOICE_UPSERT.paymentInfo.profit">
                  <td class="font-bold whitespace-nowrap">
                    Tiền lãi
                  </td>
                  <td class="text-right font-bold" style="padding-right: 11px; font-size: 16px">
                    {{ formatMoney(invoice.profit) }}
                  </td>
                </tr>
                <tr>
                  <td class="whitespace-nowrap">
                    Ghi chú
                  </td>
                  <td>
                    <a-input v-model:value="invoice.note" class="input-payment" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-4">
          <a-button
            type="primary"
            :loading="saveLoading"
            size="large"
            block
            @click="saveInvoice"
          >
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
