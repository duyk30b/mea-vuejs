<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose, IconFileSearch } from '../../../../common/icon'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputOptions } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../../common/vue-tabs'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { SettingKey } from '../../../../modules/_me/store.variable'
import { Customer, useCustomerStore } from '../../../../modules/customer'
import { OrganizationService } from '../../../../modules/organization'
import { DTimer } from '../../../../utils'

const TABS_KEY = {
  SELECT_ITEM: 'SELECT_ITEM',
  TICKET_ITEMS: 'TICKET_ITEMS',
  TICKET_PAYMENT: 'TICKET_PAYMENT',
}

const inputOptionsCustomer = ref<InstanceType<typeof InputOptions>>()

const emit = defineEmits<{ (e: 'success'): void }>()

const customerStore = useCustomerStore()
const store = useSettingStore()
const meStore = useMeStore()

const settingDisplay = ref<typeof store.SCREEN_INVOICE_UPSERT>(
  JSON.parse(JSON.stringify(store.SCREEN_INVOICE_UPSERT))
)
const showModal = ref(false)
const saveLoading = ref(false)

const activeTab = ref(TABS_KEY.SELECT_ITEM)

const customerList = ref<Customer[]>([])
const customerDefault = ref<Customer>(meStore.customerDefault)

const selectCustomer = async (data?: Customer) => {
  settingDisplay.value.customer.idDefault = data?.id || 0
  customerDefault.value = data || Customer.blank()
}

const searchingCustomer = async (text: string) => {
  if (text) {
    customerList.value = await customerStore.search(text)
  } else {
    customerList.value = []
    settingDisplay.value.customer.idDefault = 0
  }
}

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_INVOICE_UPSERT))
}

const closeModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.SCREEN_INVOICE_UPSERT, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    store.SCREEN_INVOICE_UPSERT = JSON.parse(settingData)
    meStore.customerDefault = Customer.from(customerDefault.value)
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:68 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleActiveTabPaymentSetting = async (v: any) => {
  customerDefault.value = await meStore.getCustomerDefault()
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
                      <th>Chọn sản phẩm</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div>
                          <a-checkbox
                            v-model:checked="settingDisplay.invoiceItemInput.customAfterSearch">
                            Lựa chọn thêm sau khi tìm kiếm
                          </a-checkbox>
                        </div>
                        <div class="pl-7">
                          <div class="pt-2">
                            <a-checkbox
                              v-model:checked="settingDisplay.invoiceItemInput.hintUsage"
                              :disabled="!settingDisplay.invoiceItemInput.customAfterSearch">
                              Chỉnh sửa hướng dẫn sử dụng
                            </a-checkbox>
                          </div>
                          <div class="pt-3">
                            <a-checkbox
                              v-model:checked="settingDisplay.invoiceItemInput.expectedPrice"
                              :disabled="!settingDisplay.invoiceItemInput.customAfterSearch">
                              Hiển thị giá bán niêm yết
                            </a-checkbox>
                          </div>
                          <div class="pt-3">
                            <a-checkbox
                              v-model:checked="settingDisplay.invoiceItemInput.costPrice"
                              :disabled="
                                !settingDisplay.invoiceItemInput.customAfterSearch ||
                                !settingDisplay.invoiceItemInput.expectedPrice
                              ">
                              Thêm lựa chọn giá bán = giá nhập
                            </a-checkbox>
                          </div>
                          <div class="pt-3">
                            <a-checkbox
                              v-model:checked="settingDisplay.invoiceItemInput.costPriceAverage"
                              :disabled="
                                !settingDisplay.invoiceItemInput.customAfterSearch ||
                                !settingDisplay.invoiceItemInput.expectedPrice
                              ">
                              Thêm lựa chọn giá bán = giá vốn trung bình
                            </a-checkbox>
                          </div>
                          <div class="pt-3">
                            <a-checkbox
                              v-model:checked="settingDisplay.invoiceItemInput.discount"
                              :disabled="!settingDisplay.invoiceItemInput.customAfterSearch">
                              Chỉnh sửa chiết khấu
                            </a-checkbox>
                          </div>
                          <div class="pt-3">
                            <a-checkbox
                              v-model:checked="settingDisplay.invoiceItemInput.actualPrice"
                              :disabled="!settingDisplay.invoiceItemInput.customAfterSearch">
                              Chỉnh sửa giá bán thực tế
                            </a-checkbox>
                          </div>
                        </div>
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
                          <a-radio-group
                            v-model:value="settingDisplay.invoiceItemsTable.allowDuplicateItem">
                            <a-radio style="display: flex; line-height: 36px" :value="false">
                              Cộng gộp số lượng
                            </a-radio>
                            <a-radio style="display: flex; line-height: 36px" :value="true">
                              Không cộng gộp (VD: bán 4 tặng 1 thì bản ghi số lượng 1 có thể điền
                              đơn giá = 0)
                            </a-radio>
                          </a-radio-group>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox v-model:checked="settingDisplay.invoiceItemsTable.detail">
                          Hiển thị chi tiết sản phẩm (
                          <IconFileSearch />
                          )
                        </a-checkbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox v-model:checked="settingDisplay.invoiceItemsTable.substance">
                          Hiển thị hoạt chất
                        </a-checkbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox
                          v-model:checked="settingDisplay.invoiceItemsTable.lotNumberAndExpiryDate">
                          Hiển thị số lô và HSD
                        </a-checkbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox v-model:checked="settingDisplay.invoiceItemsTable.hintUsage">
                          Hiển thị hướng dẫn sử dụng
                        </a-checkbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox v-model:checked="settingDisplay.invoiceItemsTable.unit">
                          Hiển thị đơn vị
                        </a-checkbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox
                          v-model:checked="settingDisplay.invoiceItemsTable.expectedPrice">
                          Hiển thị giá niêm yết
                        </a-checkbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox
                          v-model:checked="settingDisplay.invoiceItemsTable.editActualPrice">
                          Sửa đơn giá trong bảng danh sách
                        </a-checkbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox v-model:checked="settingDisplay.invoiceItemsTable.discount">
                          Hiển thị chiết khấu
                        </a-checkbox>
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
                            @update:text="searchingCustomer">
                            <template #option="{ item: { data } }">
                              <div>
                                <b>{{ data.fullName }}</b>
                                - {{ data.phone }} -
                                {{ DTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
                              </div>
                              <div>
                                {{ data.addressWard }} - {{ data.addressDistrict }} -
                                {{ data.addressProvince }}
                              </div>
                            </template>
                          </InputOptions>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox v-model:checked="settingDisplay.paymentInfo.itemsActualMoney">
                          Hiển thị tiền hàng
                        </a-checkbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox v-model:checked="settingDisplay.paymentInfo.discount">
                          Hiển thị chiết khấu
                        </a-checkbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox v-model:checked="settingDisplay.paymentInfo.paid">
                          Hiển thị tiền thanh toán
                        </a-checkbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox v-model:checked="settingDisplay.paymentInfo.debt">
                          Hiển thị tiền nợ
                        </a-checkbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox v-model:checked="settingDisplay.paymentInfo.surcharge">
                          Hiển thị phụ phí
                        </a-checkbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox v-model:checked="settingDisplay.paymentInfo.expense">
                          Hiển thị chi phí
                        </a-checkbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox v-model:checked="settingDisplay.paymentInfo.totalCostAmount">
                          Hiển thị tổng vốn
                        </a-checkbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox v-model:checked="settingDisplay.paymentInfo.profit">
                          Hiển thị tiền lãi
                        </a-checkbox>
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
                        <a-checkbox v-model:checked="settingDisplay.save.createBasicAndNew">
                          Lưu và Tạo đơn mới
                        </a-checkbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a-checkbox v-model:checked="settingDisplay.save.createDraft">
                          Lưu nháp
                        </a-checkbox>
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
          <VueButton icon="close" class="ml-auto" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton icon="save" color="blue" :loading="saveLoading" @click="handleSave">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
