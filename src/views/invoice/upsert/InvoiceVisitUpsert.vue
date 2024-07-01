<script setup lang="ts">
import { NodeIndexOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons-vue'
import dayjs, { Dayjs } from 'dayjs'
import { nextTick, onBeforeMount, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputMoney, InputNumber, InputOptions } from '../../../common/vue-form'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../common/vue-tabs'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer, CustomerApi, useCustomerStore } from '../../../modules/customer'
import { DiscountType } from '../../../modules/enum'
import { Invoice, InvoiceApi } from '../../../modules/invoice'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { InvoiceVisitApi, Visit, VisitApi, VisitStatus } from '../../../modules/visit'
import { VisitExpense } from '../../../modules/visit-expense/visit-expense.model'
import { VisitSurcharge } from '../../../modules/visit-surcharge/visit-surcharge.model'
import { timeToText } from '../../../utils'
import ModalCustomerUpsert from '../../customer/upsert/ModalCustomerUpsert.vue'
import InvoiceExpenses from './InvoiceExpenses.vue'
import InvoiceItemProcedure from './InvoiceItemProcedure.vue'
import InvoiceItemProduct from './InvoiceItemProduct.vue'
import InvoiceItemTable from './InvoiceItemTable.vue'
import InvoiceSurcharges from './InvoiceSurcharges.vue'
import { EInvoiceSave, EInvoiceUpsertMode, invoice, visit } from './invoice-upsert.ref'
import ModalDataInvoice from './modal-setting/ModalDataInvoice.vue'
import ModalInvoiceUpsertSettingScreen from './modal-setting/ModalInvoiceUpsertSettingScreen.vue'

const modalInvoiceUpsertSettingScreen = ref<InstanceType<typeof ModalInvoiceUpsertSettingScreen>>()
const invoiceItemProcedure = ref<InstanceType<typeof InvoiceItemProcedure>>()
const invoiceItemProduct = ref<InstanceType<typeof InvoiceItemProduct>>()
const inputOptionsCustomer = ref<InstanceType<typeof InputOptions>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()
const modalDataInvoice = ref<InstanceType<typeof ModalDataInvoice>>()
const invoiceUpsertForm = ref<InstanceType<typeof HTMLFormElement>>()

const router = useRouter()
const route = useRoute()

const customerStore = useCustomerStore()
const settingStore = useSettingStore()
const meStore = useMeStore()
const { permissionIdMap } = meStore
const { formatMoney } = settingStore

const defaultTabsKey = localStorage.getItem('INVOICE_VISIT_UPSERT_TABS') || 'product'
const tabsKey = ref<'product' | 'procedure'>(defaultTabsKey as any)

const mode = ref<EInvoiceUpsertMode>(EInvoiceUpsertMode.CREATE)

const customer = ref<Customer>(Customer.blank())
const customerList = ref<Customer[]>([])

const time = ref<Dayjs>(dayjs())

const saveLoading = ref(false)

onBeforeMount(async () => {
  try {
    const visitId = Number(route.params.id)
    const customerId = Number(route.query.customer_id)
    let customerDefault = Customer.blank()
    if (route.query.mode) {
      mode.value = route.query.mode as any
    }
    if (visitId) {
      const visitResponse = await VisitApi.detail(visitId, {
        relation: {
          customer: true,
          visitProductList: true,
          visitProcedureList: true,
          visitSurchargeList: true,
          visitExpenseList: true,
        },
      })

      visit.value = visitResponse
      customerDefault = visitResponse.customer!

      if (visit.value.visitExpenseList!.length === 0) {
        visit.value.visitExpenseList!.push(VisitExpense.blank())
      }
      if (visit.value.visitSurchargeList!.length === 0) {
        visit.value.visitSurchargeList!.push(VisitSurcharge.blank())
      }
      if (mode.value === EInvoiceUpsertMode.CREATE || mode.value === EInvoiceUpsertMode.COPY) {
        time.value = dayjs(new Date())
      } else if (mode.value === EInvoiceUpsertMode.UPDATE) {
        time.value = dayjs(new Date(visit.value.startedAt || Date.now()))
      }
    } else if (customerId) {
      customerDefault = await CustomerApi.detail(customerId)
    } else {
      customerDefault = await meStore.getCustomerDefault()
    }

    customer.value = customerDefault
    visit.value.customer = customerDefault
    visit.value.customerId = customerDefault.id

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
    if (tabsKey.value === 'product') {
      tabsKey.value = 'procedure'
      nextTick(() => invoiceItemProcedure.value?.focus())
    } else if (tabsKey.value === 'procedure') {
      tabsKey.value = 'product'
      nextTick(() => invoiceItemProduct.value?.focus())
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
    await customerStore.refreshDB()
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleDocumentKeyup)
  visit.value = Visit.blank()
})

const searchingCustomer = async (text: string) => {
  customer.value.id = 0
  if (text) {
    customerList.value = await customerStore.search(text)
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
  visit.value.customerId = data?.id || 0
  visit.value.customer = data
  customer.value = data || Customer.blank()
}

const handleChangeInvoiceDiscountMoney = (data: number) => {
  visit.value.discountMoney = data
  visit.value.discountType = DiscountType.VND
}
const handleChangeInvoiceDiscountPercent = (data: number) => {
  visit.value.discountPercent = data
  visit.value.discountType = DiscountType.Percent
}

const saveInvoice = async (type: EInvoiceSave) => {
  const validForm = invoiceUpsertForm.value?.checkValidity()
  if (!validForm) {
    return invoiceUpsertForm.value?.reportValidity()
  }
  if (visit.value.visitProductList!.length == 0 && visit.value.visitProcedureList!.length == 0) {
    return AlertStore.addError('Lỗi: cần có ít nhất 1 sản phẩm hoặc dịch vụ trong phiếu')
  }
  const invalidVisitProduct = visit.value.visitProductList!.find((vp) => vp.quantity === 0)
  if (invalidVisitProduct) {
    return AlertStore.addError(`Lỗi: ${invalidVisitProduct.product?.brandName} có số lượng 0`)
  }
  const invalidVisitProcedure = visit.value.visitProcedureList!.find((vp) => vp.quantity === 0)
  if (invalidVisitProcedure) {
    return AlertStore.addError(`Lỗi: ${invalidVisitProcedure.procedure?.name} có số lượng 0`)
  }

  try {
    saveLoading.value = true
    visit.value.registeredAt = time.value.valueOf()
    visit.value.visitSurchargeList = visit.value.visitSurchargeList!.filter((i) => {
      i.name = settingStore.INVOICE_SURCHARGE_DETAIL[i.key] || i.name
      return i.money != 0
    })
    visit.value.visitExpenseList = visit.value.visitExpenseList!.filter((i) => {
      i.name = settingStore.INVOICE_EXPENSE_DETAIL[i.key] || i.name
      return i.money != 0
    })

    switch (type) {
      case EInvoiceSave.CREATE_DRAFT: {
        const response = await InvoiceVisitApi.createDraft(visit.value)
        return
        router.push({ name: 'InvoiceDetail', params: { id: response!.visitId } })
        break
      }
      case EInvoiceSave.CREATE_QUICK_AND_NEW: {
        await InvoiceApi.createQuickInvoice(invoice.value)
        invoice.value = Invoice.blank()

        const customerRes = Customer.from(meStore.customerDefault)
        customer.value = customerRes
        invoice.value.customer = customerRes
        invoice.value.customerId = customerRes.id
        inputOptionsCustomer.value?.setItem({
          text: customerRes.fullName,
          value: customerRes.id,
          data: customerRes,
        })

        AlertStore.add({ type: 'success', message: 'Tạo đơn thành công', time: 500 })
        break
      }
      case EInvoiceSave.UPDATE_INVOICE_DRAFT_AND_INVOICE_PREPAYMENT: {
        const response = await InvoiceApi.updateInvoiceDraftAndInvoicePrepayment(
          invoice.value.id,
          invoice.value
        )
        router.push({ name: 'InvoiceDetail', params: { id: response!.invoiceId } })
        break
      }
      case EInvoiceSave.UPDATE_INVOICE_DEBT_AND_INVOICE_SUCCESS: {
        const response = await InvoiceApi.updateInvoiceDebtAndInvoiceSuccess(
          invoice.value.id,
          invoice.value
        )
        router.push({ name: 'InvoiceDetail', params: { id: response!.invoiceId } })
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
    modalInvoiceUpsertSettingScreen.value?.openModal()
  }
  if (menu.key === 'data-setting') {
    modalDataInvoice.value?.openModal()
  }
}

const handleChangeTabs = (activeKey: any) => {
  tabsKey.value = activeKey
  localStorage.setItem('INVOICE_VISIT_UPSERT_TABS', activeKey)
}
</script>

<template>
  <ModalInvoiceUpsertSettingScreen ref="modalInvoiceUpsertSettingScreen" />
  <ModalCustomerUpsert ref="modalCustomerUpsert" @success="createCustomer" />
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

  <div class="mt-4 md:mx-4">
    <div class="flex flex-wrap gap-4">
      <div style="flex-basis: 600px; flex-grow: 2" class="">
        <div class="bg-white p-4">
          <VueTabs :tabStart="tabsKey" @changeTab="handleChangeTabs">
            <template #menu>
              <VueTabMenu v-if="permissionIdMap[PermissionId.PRODUCT_READ]" tabKey="product">
                Hàng hóa ({{ visit.visitProductList!.length }})
              </VueTabMenu>
              <VueTabMenu v-if="permissionIdMap[PermissionId.PROCEDURE_READ]" tabKey="procedure">
                Dịch vụ ({{ visit.visitProcedureList!.length }})
              </VueTabMenu>
            </template>
            <template #panel>
              <VueTabPanel tabKey="product">
                <div class="mt-2">
                  <InvoiceItemProduct ref="invoiceItemProduct" />
                </div>
              </VueTabPanel>
              <VueTabPanel tabKey="procedure">
                <div class="mt-2">
                  <InvoiceItemProcedure ref="invoiceItemProcedure" />
                </div>
              </VueTabPanel>
            </template>
          </VueTabs>
        </div>
        <div class="bg-white mt-4">
          <InvoiceItemTable />
        </div>
      </div>
      <form ref="invoiceUpsertForm" style="flex-basis: 300px; flex-grow: 1">
        <div class="bg-white p-4">
          <div class="flex justify-between">
            <span>
              Tên KH (nợ cũ:
              <b>{{ formatMoney(customer.debt) }}</b>
              )
            </span>
            <span>
              <a
                v-if="permissionIdMap[PermissionId.CUSTOMER_CREATE]"
                @click="modalCustomerUpsert?.openModal()">
                Thêm khách hàng mới
              </a>
            </span>
          </div>
          <div style="height: 40px">
            <InputOptions
              ref="inputOptionsCustomer"
              :options="customerList.map((i) => ({ value: i.id, text: i.fullName, data: i }))"
              :maxHeight="320"
              placeholder="(F4) Tìm kiếm bằng Tên hoặc Số Điện Thoại"
              :disabled="mode == EInvoiceUpsertMode.UPDATE"
              required
              @selectItem="({ data }) => selectCustomer(data)"
              @update:text="searchingCustomer">
              <template #option="{ item: { data } }">
                <div>
                  <b>{{ data.fullName }}</b>
                  - {{ data.phone }} -
                  {{ timeToText(data.birthday, 'DD/MM/YYYY') }}
                </div>
                <div>{{ data.addressString }}</div>
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
                  <td>
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
                    {{ formatMoney(visit.productsMoney + visit.proceduresMoney) }}
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
                          <b>{{ formatMoney(visit.productsMoney + visit.proceduresMoney) }}</b>
                          )
                        </div>
                        <div class="mt-2">
                          <div>
                            <InputMoney
                              :value="visit.discountMoney"
                              append="VNĐ"
                              style="width: 100%"
                              @update:value="handleChangeInvoiceDiscountMoney" />
                          </div>
                          <div class="mt-2">
                            <InputNumber
                              :value="visit.discountPercent"
                              append="%"
                              @update:value="handleChangeInvoiceDiscountPercent" />
                          </div>
                        </div>
                      </template>
                      <div class="flex">
                        <div>
                          <a-tag color="success">{{ visit.discountPercent || 0 }}%</a-tag>
                        </div>
                        <div
                          class="flex-1 text-right"
                          style="padding-right: 11px; border-bottom: 1px solid #cdcdcd">
                          {{ formatMoney(visit.discountMoney) }}
                        </div>
                      </div>
                    </a-popconfirm>
                  </td>
                </tr>
                <tr v-if="settingStore.SCREEN_INVOICE_UPSERT.paymentInfo.surcharge">
                  <InvoiceSurcharges />
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
                    {{ formatMoney(visit.totalMoney) }}
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
                  <InvoiceExpenses />
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr v-if="settingStore.SCREEN_INVOICE_UPSERT.paymentInfo.profit">
                  <td class="font-bold whitespace-nowrap">Tiền lãi</td>
                  <td class="text-right font-bold" style="padding-right: 11px; font-size: 16px">
                    {{ formatMoney(visit.profit) }}
                  </td>
                </tr>
                <tr>
                  <td class="whitespace-nowrap">Ghi chú</td>
                  <td>
                    <a-input v-model:value="visit.note" class="input-payment" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <template v-if="[EInvoiceUpsertMode.CREATE, EInvoiceUpsertMode.COPY].includes(mode)">
          <div
            v-if="settingStore.SCREEN_INVOICE_UPSERT.save.createBasicAndNew"
            class="mt-4 w-full flex flex-col px-1">
            <VueButton
              color="blue"
              type="button"
              :loading="saveLoading"
              size="large"
              @click="saveInvoice(EInvoiceSave.CREATE_QUICK_AND_NEW)">
              <template #icon>
                <SaveOutlined />
              </template>
              Lưu và Tạo đơn mới
            </VueButton>
          </div>

          <div
            v-if="settingStore.SCREEN_INVOICE_UPSERT.save.createDraft"
            class="mt-4 w-full flex flex-col px-1">
            <VueButton
              color="blue"
              :loading="saveLoading"
              :size="'large'"
              type="button"
              @click="saveInvoice(EInvoiceSave.CREATE_DRAFT)">
              <template #icon>
                <SaveOutlined />
              </template>
              Lưu nháp
            </VueButton>
          </div>
        </template>

        <template v-if="[EInvoiceUpsertMode.UPDATE].includes(mode)">
          <div
            v-if="[VisitStatus.Draft].includes(visit.visitStatus)"
            class="mt-4 w-full flex flex-col px-1">
            <VueButton
              color="blue"
              :loading="saveLoading"
              size="large"
              type="button"
              @click="saveInvoice(EInvoiceSave.UPDATE_INVOICE_DRAFT_AND_INVOICE_PREPAYMENT)">
              <template #icon>
                <SaveOutlined />
              </template>
              Cập nhật đơn nháp
            </VueButton>
          </div>

          <div
            v-if="[VisitStatus.InProgress].includes(visit.visitStatus)"
            class="mt-4 w-full flex flex-col px-1">
            <VueButton
              color="blue"
              :loading="saveLoading"
              size="large"
              type="button"
              @click="saveInvoice(EInvoiceSave.UPDATE_INVOICE_DRAFT_AND_INVOICE_PREPAYMENT)">
              <template #icon>
                <SaveOutlined />
              </template>
              Cập nhật đơn tạm ứng
            </VueButton>
          </div>

          <div
            v-if="[VisitStatus.Debt, VisitStatus.Completed].includes(visit.visitStatus)"
            class="mt-4 w-full flex flex-col px-1">
            <VueButton
              color="blue"
              :loading="saveLoading"
              size="large"
              type="button"
              @click="saveInvoice(EInvoiceSave.UPDATE_INVOICE_DEBT_AND_INVOICE_SUCCESS)">
              <template #icon>
                <SaveOutlined />
              </template>
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
