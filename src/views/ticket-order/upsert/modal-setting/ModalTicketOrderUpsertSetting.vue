<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconFileSearch } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputCheckbox, InputOptions, InputRadio, InputSelect } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { VueTabMenu, VueTabPanel, VueTabs } from '@/common/vue-tabs'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { SettingKey } from '@/modules/_me/store.variable'
import { Customer, CustomerService } from '@/modules/customer'
import { PickupStrategy } from '@/modules/enum'
import { OrganizationService } from '@/modules/organization'
import { WarehouseService } from '@/modules/warehouse/warehouse.service'
import { ESTimer } from '@/utils'
import { ref } from 'vue'

const TABS_KEY = {
  SELECT_ITEM: 'SELECT_ITEM',
  TICKET_ITEMS: 'TICKET_ITEMS',
  TICKET_PAYMENT: 'TICKET_PAYMENT',
}

const inputOptionsCustomer = ref<InstanceType<typeof InputOptions>>()

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()

const settingDisplay = ref<typeof store.SCREEN_INVOICE_UPSERT>(
  JSON.parse(JSON.stringify(store.SCREEN_INVOICE_UPSERT)),
)

const warehouseOptions = ref<{ value: number; label: string }[]>([])
const showModal = ref(false)
const saveLoading = ref(false)

const activeTab = ref(TABS_KEY.SELECT_ITEM)

const customerList = ref<Customer[]>([])
const customerDefault = ref<Customer>(Customer.blank())

const handleFocusFirstSearchCustomer = async () => {
  await CustomerService.refreshDB()
}

const selectCustomer = async (data?: Customer) => {
  settingDisplay.value.customer.idDefault = data?.id || 0
  customerDefault.value = data || Customer.blank()
}

const searchingCustomer = async (text: string) => {
  if (text) {
    customerList.value = await CustomerService.search(text)
  } else {
    customerList.value = []
    settingDisplay.value.customer.idDefault = 0
  }
}

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_INVOICE_UPSERT))

  const warehouseAll = await WarehouseService.list({})
  warehouseOptions.value = [
    { value: 0, label: 'Tất cả kho' },
    ...warehouseAll.map((i) => ({ value: i.id, label: i.name })),
  ]
}

const pickupStrategyOptions = [
  { value: PickupStrategy.Inherit, label: '--- Mặc định theo hệ thống ---' },
  { value: PickupStrategy.NoImpact, label: 'Không trừ kho (không quản lý số lượng trong kho)' },
  { value: PickupStrategy.RequireBatchSelection, label: 'Bắt buộc chọn lô hàng' },
  { value: PickupStrategy.AutoWithFIFO, label: 'Tự động chọn lô theo FIFO' },
  { value: PickupStrategy.AutoWithExpiryDate, label: 'Tự động chọn lô theo HSD gần nhất' },
]
pickupStrategyOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.SCREEN_INVOICE_UPSERT.pickupStrategy) {
    i.label = '(Hệ thống) - ' + i.label
  }
})

const closeModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (settingDisplay.value.invoiceItemInput.warehouseIdList.length === 0) {
      settingDisplay.value.invoiceItemInput.warehouseIdList = [0]
    }
    if (settingDisplay.value.invoiceItemInput.warehouseIdList.includes(0)) {
      settingDisplay.value.invoiceItemInput.warehouseIdList = [0]
    }
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.SCREEN_INVOICE_UPSERT, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công', 500)
    store.SCREEN_INVOICE_UPSERT = JSON.parse(settingData)
    CustomerService.customerDefault = Customer.from(customerDefault.value)
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:68 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleActiveTabPaymentSetting = async (v: any) => {
  customerDefault.value = await CustomerService.getCustomerDefault()
  inputOptionsCustomer.value?.setItem({
    value: customerDefault.value.id,
    text: customerDefault.value.fullName,
    data: customerDefault.value,
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Cài đặt hiển thị</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 invoice-upsert-setting-screen-tabs">
        <VueTabs :tabShow="activeTab">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.SELECT_ITEM">Chọn sản phẩm</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.TICKET_ITEMS">Danh sách sản phẩm</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.TICKET_PAYMENT" @active="handleActiveTabPaymentSetting">
              Thanh toán
            </VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.SELECT_ITEM">
              <div class="mt-4 table-wrapper">
                <table class="">
                  <thead>
                    <tr>
                      <th colspan="2">Chọn sản phẩm</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="width: 200px">Chiến lược lấy hàng</td>
                      <td>
                        <div>
                          <InputSelect
                            v-model:value="settingDisplay.pickupStrategy"
                            :options="pickupStrategyOptions"
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div>Kho bán hàng</div>
                      </td>
                      <td>
                        <div>
                          <a-select
                            v-model:value="settingDisplay.invoiceItemInput.warehouseIdList"
                            mode="multiple"
                            style="width: 100%"
                            placeholder="Please select"
                            :options="warehouseOptions"
                          ></a-select>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox
                          v-model:checked="
                            settingDisplay.invoiceItemInput.searchIncludeZeroQuantity
                          "
                        >
                          Kết quả tìm kiếm có chứa những sản phẩm số lượng = 0
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox
                          v-model:checked="settingDisplay.invoiceItemInput.expectedPrice"
                        >
                          Hiển thị giá bán niêm yết
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox v-model:checked="settingDisplay.invoiceItemInput.costPrice">
                          Thêm lựa chọn giá bán = giá nhập
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox v-model:checked="settingDisplay.invoiceItemInput.discount">
                          Chỉnh sửa chiết khấu
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox v-model:checked="settingDisplay.invoiceItemInput.quantity">
                          Chỉnh sửa chọn số lượng
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox
                          v-model:checked="settingDisplay.invoiceItemInput.actualPrice"
                        >
                          Chỉnh sửa giá bán
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox v-model:checked="settingDisplay.invoiceItemInput.hintUsage">
                          Hiển thị hướng dẫn sử dụng
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox
                          v-model:checked="settingDisplay.invoiceItemInput.buttonSubmit"
                        >
                          Hiển thị nút "Thêm vào giỏ hàng"
                        </InputCheckbox>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.TICKET_ITEMS">
              <div class="mt-4 table-wrapper">
                <table class="">
                  <thead>
                    <tr>
                      <th>Danh sách hàng trong đơn</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div>Khi thêm sản phẩm có sẵn trong danh sách</div>
                        <div class="pl-7">
                          <InputRadio
                            v-model:value="settingDisplay.invoiceItemsTable.allowDuplicateItem"
                            :customStyle="{
                              item: { width: '100%' },
                            }"
                            :options="[
                              { key: false, label: 'Cộng gộp số lượng' },
                              {
                                key: true,
                                label:
                                  'Không cộng gộp (VD: bán 4 tặng 1 thì bản ghi số lượng 1 có thể điền đơn giá = 0)',
                              },
                            ]"
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.invoiceItemsTable.detail">
                          Hiển thị chi tiết sản phẩm (
                          <IconFileSearch />
                          )
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.invoiceItemsTable.substance">
                          Hiển thị hoạt chất
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.invoiceItemsTable.unit">
                          Hiển thị đơn vị
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox
                          v-model:checked="settingDisplay.invoiceItemsTable.expectedPrice"
                        >
                          Hiển thị giá niêm yết
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.invoiceItemsTable.discount">
                          Hiển thị chiết khấu
                        </InputCheckbox>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.TICKET_PAYMENT">
              <div class="mt-4 table-wrapper">
                <table class="">
                  <thead>
                    <tr>
                      <th>Thông tin thanh toán</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div>Khách hàng mặc định</div>
                        <div class="py-2">
                          <InputOptions
                            ref="inputOptionsCustomer"
                            :options="
                              customerList.map((i) => ({ value: i.id, text: i.fullName, data: i }))
                            "
                            :maxHeight="180"
                            placeholder="Tìm kiếm bằng Tên hoặc Số Điện Thoại"
                            @selectItem="({ data }) => selectCustomer(data)"
                            @onFocusinFirst="handleFocusFirstSearchCustomer"
                            @update:text="searchingCustomer"
                          >
                            <template #option="{ item: { data } }">
                              <div>
                                <b>{{ data.fullName }}</b>
                                - {{ data.phone }} -
                                {{ ESTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
                              </div>
                              <div>
                                {{ data.addressStreet }} - {{ data.addressWard }} -
                                {{ data.addressProvince }}
                              </div>
                            </template>
                          </InputOptions>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox
                          v-model:checked="settingDisplay.paymentInfo.itemsActualMoney"
                        >
                          Hiển thị tiền hàng
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.paymentInfo.discount">
                          Hiển thị chiết khấu
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.paymentInfo.paid">
                          Hiển thị tiền thanh toán
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.paymentInfo.debt">
                          Hiển thị tiền nợ
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.paymentInfo.surcharge">
                          Hiển thị phụ phí
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.paymentInfo.expense">
                          Hiển thị chi phí
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.paymentInfo.itemsCostAmount">
                          Hiển thị tổng vốn
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.paymentInfo.profit">
                          Hiển thị tiền lãi
                        </InputCheckbox>
                      </td>
                    </tr>
                  </tbody>
                  <thead>
                    <tr>
                      <th>Lưu lại</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.save.createBasicAndNew">
                          Lưu và Tạo đơn mới
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.save.createDraft">
                          Lưu nháp
                        </InputCheckbox>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </VueTabPanel>
          </template>
        </VueTabs>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton icon="close" style="margin-left: auto" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton icon="save" color="blue" :loading="saveLoading" @click="handleSave">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
