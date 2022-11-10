<script setup lang="ts">
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputOptions } from '@/common/vue-form'
import { ArrivalInvoiceService } from '@/modules/arrival'
import { Customer, CustomerService } from '@/modules/customer'
import { DiscountType, InvoiceItemType, PaymentStatus } from '@/modules/enum'
import { Invoice, InvoiceItem, InvoiceService } from '@/modules/invoice'
import { useOrganizationStore } from '@/store/organization.store'
import { formatNumber, timeToText } from '@/utils'
import { DeleteOutlined, NodeIndexOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { onBeforeMount, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalCustomerUpsert from '../../customer/components/ModalCustomerUpsert.vue'
import ArrivalInvoiceItemCreate from './ArrivalInvoiceItemCreate.vue'
import ModalArrivalInvoiceUpsertSettingScreen from './ModalArrivalInvoiceUpsertSettingScreen.vue'

const modalInvoiceArrivalUpsertSettingScreen = ref<InstanceType<typeof ModalArrivalInvoiceUpsertSettingScreen>>()
const inputSearchCustomer = ref<InstanceType<typeof InputOptions>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()

const mode = ref<'CREATE' | 'UPDATE' | 'CREATE_AFTER_REFUND'>('CREATE')

const router = useRouter()
const route = useRoute()
const organizationStore = useOrganizationStore()

const customer = ref<Customer>(Customer.blank())
const customerList = ref<Customer[]>([])

const invoice = ref<Invoice>(Invoice.blank())

const saveLoading = ref(false)

onBeforeMount(async () => {
  try {
    const invoiceId = Number(route.params.id)
    const customerId = Number(route.query.customer_id)
    const copyId = Number(route.query.copy_id)
    if (invoiceId) {
      const invoiceResponse = await InvoiceService.getOne(invoiceId, {
        customer: true,
        invoiceItems: true,
      })

      invoice.value = invoiceResponse
      customer.value = Customer.fromInstance(invoiceResponse.customer || Customer.blank())

      if (invoiceResponse.paymentStatus === PaymentStatus.Unpaid) {
        mode.value = 'UPDATE'
      }
      if (invoiceResponse.paymentStatus === PaymentStatus.Refund) {
        mode.value = 'CREATE_AFTER_REFUND'
      }
    }
    else if (customerId) {
      const customerRes = await CustomerService.getOne(customerId)
      customer.value = customerRes
      invoice.value.customer = customerRes
      invoice.value.customerId = customerId
    }
    else if (copyId) {
      const invoiceResponse = await InvoiceService.getOne(copyId, {
        customer: false,
        invoiceItems: true,
      })
      invoiceResponse.customerId = 0

      invoice.value = invoiceResponse
      mode.value = 'CREATE'
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
onMounted(() => {
  window.addEventListener('keydown', handleDocumentKeyup)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
})

watchEffect(() => {
  const totalCostMoney = invoice.value.invoiceItems.reduce((acc, item) => acc + item.costPrice * item.quantity, 0)
  const totalItemMoney = invoice.value.invoiceItems.reduce((acc, item) => acc + item.actualPrice * item.quantity, 0)

  let discountMoney = 0
  let discountPercent = 0
  let discountType: DiscountType = DiscountType.VND
  if (invoice.value.discountType === DiscountType.VND) {
    discountMoney = invoice.value.discountMoney || 0
    discountPercent = totalItemMoney == 0 ? 0 : Math.floor(discountMoney * 100 / totalItemMoney)
    discountType = DiscountType.VND
  }
  if (invoice.value.discountType === DiscountType.Percent) {
    discountPercent = invoice.value.discountPercent || 0
    discountMoney = Math.floor(totalItemMoney * discountPercent / 100)
    discountType = DiscountType.Percent
  }

  const surcharge = invoice.value.surcharge || 0
  const expenses = invoice.value.expenses || 0
  const totalMoney = totalItemMoney - discountMoney + surcharge
  const profit = totalMoney - totalCostMoney - expenses

  invoice.value.totalCostMoney = totalCostMoney
  invoice.value.totalItemMoney = totalItemMoney
  invoice.value.discountMoney = discountMoney
  invoice.value.discountPercent = discountPercent
  invoice.value.discountType = discountType
  invoice.value.totalMoney = totalMoney
  invoice.value.profit = profit
})

const handleChangeInvoiceItemDiscountMoney = (data: number, index: number) => {
  const discountMoney = data / invoice.value.invoiceItems[index].unit.rate
  const expectedPrice = invoice.value.invoiceItems[index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.floor(discountMoney * 100 / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  invoice.value.invoiceItems[index].discountMoney = discountMoney
  invoice.value.invoiceItems[index].discountPercent = discountPercent
  invoice.value.invoiceItems[index].actualPrice = actualPrice
  invoice.value.invoiceItems[index].discountType = DiscountType.VND
}

const handleChangeInvoiceItemDiscountPercent = (discountPercent: number, index: number) => {
  const expectedPrice = invoice.value.invoiceItems[index].expectedPrice || 0
  const discountMoney = Math.floor(discountPercent * expectedPrice / 100)
  const actualPrice = expectedPrice - discountMoney
  invoice.value.invoiceItems[index].discountPercent = discountPercent
  invoice.value.invoiceItems[index].discountMoney = discountMoney
  invoice.value.invoiceItems[index].actualPrice = actualPrice
  invoice.value.invoiceItems[index].discountType = DiscountType.Percent
}

const searchingCustomer = async (text: string) => {
  try {
    customer.value.id = 0
    customerList.value = []
    if (text) {
      customerList.value = await CustomerService.searchByFullNameOrPhone(text)
    }
  } catch (error) {
    console.log('🚀 ~ file: ArrivalInvoiceUpsert.vue:191 ~ error:', error)
  }
}

const selectCustomer = (c: Customer) => {
  invoice.value.customerId = c.id!
  invoice.value.customer = c
  customer.value = c
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
    return message.error(`Lỗi: dịch vụ ${invalidInvoiceItem.procedure?.nameVi} có số lượng 0`)
  }

  try {
    saveLoading.value = true
    let response: { success: boolean, message: string, data: { arrivalId: number, invoiceId: number }, }
    if (mode.value === 'CREATE') {
      response = await ArrivalInvoiceService.createInvoiceDraft(invoice.value)
    } else if (mode.value === 'UPDATE') {
      response = await ArrivalInvoiceService.updateInvoiceDraft(invoice.value.id, invoice.value)
    } else {
      response = await ArrivalInvoiceService.createInvoiceDraftAfterRefund(invoice.value.arrivalId, invoice.value)
    }

    if (response.success) {
      router.push({ name: 'ArrivalInvoiceDetail', params: { id: response.data.arrivalId } })
    } else {
      AlertStore.add({ type: 'error', message: response.message })
    }
  } catch (error) {
    console.log('🚀 ~ file: InvoiceUpsert.vue:365 ~ saveInvoice ~ error:', error)
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
    modalInvoiceArrivalUpsertSettingScreen.value?.openModal()
  }
}
</script>

<template>
  <ModalArrivalInvoiceUpsertSettingScreen ref="modalInvoiceArrivalUpsertSettingScreen" />
  <ModalCustomerUpsert ref="modalCustomerUpsert" @success="selectCustomer" />
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.3rem;">
        <NodeIndexOutlined style="margin-right: 1rem" />
        {{ invoice.id ? 'Cập nhật phiếu tiếp đón' : 'Tạo phiếu tiếp đón mới' }}
      </div>
      <div>
        <a-dropdown trigger="click">
          <span style="font-size: 1.1rem; cursor: pointer;">
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
  </div>

  <div class="mt-4 mx-4 invoice-procedure-upsert-tabs">
    <div class="flex flex-col md:flex-row gap-4">
      <div class="md:w-2/3 ">
        <div class="bg-white p-4">
          <ArrivalInvoiceItemCreate :invoice="invoice" @add_invoice_item="handleAddInvoiceItem" />

          <div class="mt-4">
            <div>Danh sách sản phẩm trong phiếu</div>
            <div class="table-wrapper mt-2">
              <table class="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tên</th>
                    <th v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.invoiceItemsTable.expiryDate">HSD</th>
                    <th style="width: 120px;">Số lượng</th>
                    <th v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.invoiceItemsTable.unit">Đơn vị</th>
                    <th v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.invoiceItemsTable.discount">Chiết khấu</th>
                    <th>Đơn giá</th>
                    <th>Tổng tiền</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="invoice.invoiceItems.length == 0">
                    <td colspan="20" class="text-center">No data</td>
                  </tr>
                  <tr v-for="(ii, index) in invoice.invoiceItems" :key="index">
                    <td class="index"></td>
                    <td v-if="ii.type === InvoiceItemType.ProductBatch">
                      <div style="font-weight: 500;">{{ ii.productBatch?.product?.brandName }}</div>
                      <div v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.invoiceItemsTable.substance">
                        {{ ii.productBatch?.product?.substance }}
                      </div>
                    </td>
                    <td v-if="ii.type === InvoiceItemType.Procedure">
                      <div style="font-weight: 500;">{{ ii.procedure.nameVi }}</div>
                    </td>
                    <td v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.invoiceItemsTable.expiryDate"
                      class="text-center">
                      {{ timeToText(ii.productBatch?.expiryDate) }}
                    </td>
                    <td>
                      <a-input-number :value="ii.quantity / ii.unit.rate"
                        @update:value="(e: number) => invoice.invoiceItems[index].quantity = e * ii.unit.rate"
                        class="w-full" :min="0" />
                    </td>
                    <td v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.invoiceItemsTable.unit" class="text-center">
                      {{ ii.unit?.name || 'Lần' }}
                    </td>
                    <td v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.invoiceItemsTable.discount"
                      class="text-center">
                      <a-popconfirm>
                        <template #cancelButton>
                          <div></div>
                        </template>
                        <template #okButton>
                          <div></div>
                        </template>
                        <template #title>
                          <div>Chiết khấu (Tiền hàng: <b>{{ formatNumber(ii.expectedPrice) }}</b>)</div>
                          <div class="mt-2">
                            <div>
                              <a-input-number :value="ii.discountMoney * ii.unit.rate"
                                @change="(e: number) => handleChangeInvoiceItemDiscountMoney(e, index)" addon-after="VNĐ"
                                style="width: 100%;" step="1000"
                                :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                                :parser="(value: any) => value.replace(/(,*)/g, '')"></a-input-number>
                            </div>
                            <div class="mt-2">
                              <a-input-number :value="ii.discountPercent"
                                @change="(e: number) => handleChangeInvoiceItemDiscountPercent(e, index)" addon-after="%"
                                :min="0" :max="100" style="width: 100%;"></a-input-number>
                            </div>
                          </div>
                        </template>
                        <a-tag v-if="ii.discountType === 'VNĐ'" color="success" style="cursor: pointer;">
                          {{ formatNumber(ii.discountMoney * ii.unit.rate) }}
                        </a-tag>
                        <a-tag v-if="ii.discountType === '%'" color="success" style="cursor: pointer;">
                          {{ ii.discountPercent || 0 }}%
                        </a-tag>
                      </a-popconfirm>
                    </td>
                    <td class="text-right">
                      <div v-if="ii.discountMoney" class="text-xs italic text-red-500">
                        <del>{{ formatNumber(ii.expectedPrice * ii.unit.rate) }}</del>
                      </div>
                      <div>{{ formatNumber(ii.actualPrice * ii.unit.rate) }}</div>
                    </td>
                    <td class="text-right">{{ formatNumber(ii.actualPrice * ii.quantity) }} </td>
                    <td class="text-center">
                      <a @click="invoice.invoiceItems.splice(index, 1)" class="text-red-500 text-xl">
                        <DeleteOutlined />
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="100" class="text-right">
                      <span class="mr-10">Tổng tiền:</span>
                      <span class="mr-20"> {{ formatNumber(invoice.totalItemMoney) }} </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="md:w-1/3 ">
        <div class="bg-white p-4">
          <div class="flex justify-between">
            <span>Tên khách hàng (nợ cũ: <b>{{ formatNumber(customer.debt) }}</b>)</span>
            <a @click="modalCustomerUpsert?.openModal()">Thêm khách hàng mới</a>
          </div>
          <InputOptions ref="inputSearchCustomer" :options="customerList" v-model:searchText="customer.fullNameVi"
            @selectItem="selectCustomer" :maxHeight="260" @update:searchText="searchingCustomer"
            placeholder="(F4) Tìm kiếm bằng Tên hoặc Số Điện Thoại" :disabled="mode !== 'CREATE'">
            <template
              v-slot:each="{ item: { fullNameVi, phone, addressProvince, addressDistrict, addressWard, birthday } }">
              <div> <b>{{ fullNameVi }}</b> - {{ phone }} - {{ timeToText(birthday, 'DD/MM/YYYY') }} </div>
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
                  <td class="font-bold" style="width: 120px;">Tiền dịch vụ</td>
                  <td class="text-right" style="padding-right: 11px;">
                    {{ formatNumber(invoice.totalItemMoney, 0) }}
                  </td>
                </tr>
                <tr v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.paymentInfo.discount">
                  <td>Chiết khấu</td>
                  <td style="padding-right: 11px;">
                    <div class="flex gap-2">
                      <a-input-group compact>
                        <a-select v-model:value="invoice.discountType" style="min-width: 80px;">
                          <a-select-option value="%">%</a-select-option>
                          <a-select-option value="VNĐ">VNĐ</a-select-option>
                        </a-select>
                        <a-input-number v-if="invoice.discountType == '%'" style="width: 120px;"
                          v-model:value="invoice.discountPercent" :min="0" :max="100" />
                        <a-input-number v-if="invoice.discountType == 'VNĐ'" v-model:value="invoice.discountMoney"
                          step="1000" style="width: 120px;" :min="0"
                          :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                          :parser="(value: any) => value.replace(/(,*)/g, '')" />

                      </a-input-group>
                      {{ formatNumber(invoice.discountMoney, 0) }}
                    </div>
                  </td>
                </tr>
                <tr v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.paymentInfo.surcharge">
                  <td>Phụ phí</td>
                  <td>
                    <a-input-number v-model:value="invoice.surcharge" step="1000" class="input-payment"
                      :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                      :parser="(value: any) => value.replace(/(,*)/g, '')" />
                  </td>
                </tr>
                <tr>
                  <td class="font-bold">Tổng tiền</td>
                  <td class="text-right font-bold" style="padding-right: 11px;">
                    {{ formatNumber(invoice.totalMoney, 0) }}
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Thanh toán</td>
                  <td>
                    <a-input-number :value="invoice.totalMoney - invoice.debt"
                      @change="(e: number) => invoice.debt = invoice.totalMoney - e" step="1000" class="input-payment"
                      :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                      :parser="(value: any) => value.replace(/(,*)/g, '')" />
                  </td>
                </tr>
                <tr>
                  <td>Ghi nợ</td>
                  <td>
                    <a-input-number v-model:value="invoice.debt" step="1000" class="input-payment"
                      :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                      :parser="(value: any) => value.replace(/(,*)/g, '')" />
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
                <tr v-if="organizationStore.SCREEN_INVOICE_ARRIVAL_UPSERT.other.expenses">
                  <td>
                    <a-tooltip>
                      <template #title>Số tiền bên bán phải trả (VD: tiền hoa hồng cho người giới thiệu ...)</template>
                      Chi phí
                    </a-tooltip>
                  </td>
                  <td>
                    <a-input-number v-model:value="invoice.expenses" step="1000" class="input-payment"
                      :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                      :parser="(value: any) => value.replace(/(,*)/g, '')" />
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

<style lang="scss">
.invoice-procedure-upsert-tabs {
  .ant-tabs-tab {
    border-top: 5px solid #d6d6d6 !important;

    &.ant-tabs-tab-active {
      border-top-color: #1890ff !important;
    }
  }
}

.table-payment {
  td {
    padding: 6px 0;
  }
}

.input-payment {
  text-align: right;
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
