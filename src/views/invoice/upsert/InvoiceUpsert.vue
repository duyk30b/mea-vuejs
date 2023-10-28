<script setup lang="ts">
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputMoney, InputOptions } from '@/common/vue-form'
import { Customer, CustomerService, useCustomerStore } from '@/modules/customer'
import { Invoice, InvoiceItem, InvoiceService } from '@/modules/invoice'
import { useOrganizationStore } from '@/store/organization.store'
import { timeToText } from '@/utils'
import { NodeIndexOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import { onBeforeMount, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalCustomerUpsert from '../../customer/components/ModalCustomerUpsert.vue'
import InvoiceItemCreate from './InvoiceItemCreate.vue'
import InvoiceItemTable from './InvoiceItemTable.vue'
import ModalInvoiceUpsertSettingScreen from './ModalInvoiceUpsertSettingScreen.vue'
import { invoice } from './invoice-upsert.store'

const modalInvoiceUpsertSettingScreen = ref<InstanceType<typeof ModalInvoiceUpsertSettingScreen>>()
const inputSearchCustomer = ref<InstanceType<typeof InputOptions>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()

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
        invoiceItems: true,
      })

      invoice.value = invoiceResponse
      customer.value = Customer.fromInstance(invoiceResponse.customer!)
      if (mode.value === 'CREATE' || mode.value === 'COPY') {
        createTime.value = dayjs(new Date())
      } else if (mode.value === 'UPDATE') {
        createTime.value = dayjs(new Date(invoice.value.createTime))
      }
    }
    if (customerId) {
      const customerRes = await CustomerService.getOne(customerId)
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
}
</script>

<template>
  <ModalInvoiceUpsertSettingScreen ref="modalInvoiceUpsertSettingScreen" />
  <ModalCustomerUpsert ref="modalCustomerUpsert" @success="selectCustomer" />
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
                  <td>Thời gian</td>
                  <td><a-date-picker show-time placeholder="Select Time" v-model:value="createTime"
                      :format="'DD/MM/YYYY HH:mm:ss'" /></td>
                </tr>
                <tr>
                  <td class="font-bold" style="width: 120px;">Tiền hàng</td>
                  <td class="text-right" style="padding-right: 11px;">
                    {{ formatMoney(invoice.totalItemMoney) }}
                  </td>
                </tr>
                <tr v-if="organizationStore.SCREEN_INVOICE_UPSERT.paymentInfo.discount">
                  <td>Chiết khấu</td>
                  <td style="padding-right: 11px;">
                    <div class="flex flex-wrap gap-2 justify-end items-center">
                      <a-input-group compact style="width: 200px; margin-right: auto;">
                        <a-select v-model:value="invoice.discountType" style="min-width: 80px;">
                          <a-select-option value="%">%</a-select-option>
                          <a-select-option value="VNĐ">VNĐ</a-select-option>
                        </a-select>
                        <a-input-number v-if="invoice.discountType == '%'" style="width: 120px;"
                          v-model:value="invoice.discountPercent" :min="0" :max="100" />
                        <InputMoney v-if="invoice.discountType == 'VNĐ'" v-model:value="invoice.discountMoney"
                          style="width: 120px;" :min="0" />
                      </a-input-group>
                      <span>
                        {{ formatMoney(invoice.discountMoney) }}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr v-if="organizationStore.SCREEN_INVOICE_UPSERT.paymentInfo.surcharge">
                  <td>Phụ phí</td>
                  <td>
                    <InputMoney v-model:value="invoice.surcharge" class="input-payment" style="width: 100%;" />
                  </td>
                </tr>
                <tr>
                  <td class="font-bold">Tổng tiền</td>
                  <td class="text-right font-bold" style="padding-right: 11px; font-size: 16px;">
                    {{ formatMoney(invoice.totalMoney) }}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Thanh toán</td>
                  <td>
                    <InputMoney :value="invoice.totalMoney - invoice.debt"
                      @update:value="(e: number) => invoice.debt = invoice.totalMoney - e" min="0" class="input-payment"
                      style="width: 100%;" />
                  </td>
                </tr>
                <tr>
                  <td>Ghi nợ</td>
                  <td>
                    <InputMoney v-model:value="invoice.debt" class="input-payment" style="width: 100%;" />
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
                  <td>
                    <a-tooltip>
                      <template #title>Số tiền bên bán phải trả (VD: tiền hoa hồng cho người giới thiệu ...)</template>
                      Chi phí
                    </a-tooltip>
                  </td>
                  <td>
                    <InputMoney v-model:value="invoice.expenses" class="input-payment" style="width: 100%;" />
                  </td>
                </tr>
                <tr>
                  <td>Ghi chú</td>
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
