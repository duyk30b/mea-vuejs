<script setup lang="ts">
import { CloseOutlined, FileSearchOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import VueModal from '../../../../common/VueModal.vue'
import { InputOptions } from '../../../../common/vue-form'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useScreenStore } from '../../../../modules/_me/screen.store'
import { ScreenSettingKey } from '../../../../modules/_me/store.variable'
import { Customer, useCustomerStore } from '../../../../modules/customer'
import { OrganizationService } from '../../../../modules/organization'
import { DTimer } from '../../../../utils'

const emit = defineEmits<{ (e: 'success'): void }>()

const customerStore = useCustomerStore()
const store = useScreenStore()
const meStore = useMeStore()

const settingDisplay = ref<typeof store.SCREEN_INVOICE_UPSERT>(
  JSON.parse(JSON.stringify(store.SCREEN_INVOICE_UPSERT))
)
const showModal = ref(false)
const saveLoading = ref(false)

const activeTab = ref('1')
const customerSearchText = ref(meStore.customerDefault?.fullName || '')

const customerList = ref<Customer[]>([])
const customerDefault = ref<Customer>()

const selectCustomer = async (data?: Customer) => {
  settingDisplay.value.customer.idDefault = data?.id || 0
  customerSearchText.value = data?.fullName || ''
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

const handleClose = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(ScreenSettingKey.SCREEN_INVOICE_UPSERT, settingData)
    message.success('Cập nhật cài đặt thành công')
    store.SCREEN_INVOICE_UPSERT = JSON.parse(settingData)
    meStore.customerDefault = Customer.fromPlain(customerDefault.value)
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:68 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Cài đặt hiển thị</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="handleClose">
          <CloseOutlined />
        </div>
      </div>

      <div class="px-6 mt-4 invoice-upsert-setting-screen-tabs">
        <a-tabs v-model:activeKey="activeTab" type="card" :tabBarGutter="10">
          <a-tab-pane key="1" tab="Chọn sản phẩm">
            <table class="table-setting">
              <thead>
                <tr>
                  <th>Cài đặt hiển thị</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <a-checkbox v-model:checked="settingDisplay.invoiceItemInput.negativeQuantity">
                      Được phép xuất số lượng nhiều hơn số lượng tồn (số lượng tồn có thể là số âm)
                    </a-checkbox>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div>
                      <a-checkbox
                        v-model:checked="settingDisplay.invoiceItemInput.customAfterSearch"
                      >
                        Lựa chọn thêm sau khi tìm kiếm
                      </a-checkbox>
                    </div>
                    <div class="pl-7">
                      <div class="pt-2">
                        <a-checkbox
                          v-model:checked="settingDisplay.invoiceItemInput.hintUsage"
                          :disabled="!settingDisplay.invoiceItemInput.customAfterSearch"
                        >
                          Chỉnh sửa hướng dẫn sử dụng
                        </a-checkbox>
                      </div>
                      <div class="pt-3">
                        <a-checkbox
                          v-model:checked="settingDisplay.invoiceItemInput.expectedPrice"
                          :disabled="!settingDisplay.invoiceItemInput.customAfterSearch"
                        >
                          Hiển thị giá bán niêm yết
                        </a-checkbox>
                      </div>
                      <div class="pt-3">
                        <a-checkbox
                          v-model:checked="settingDisplay.invoiceItemInput.costPrice"
                          :disabled="
                            !settingDisplay.invoiceItemInput.customAfterSearch ||
                            !settingDisplay.invoiceItemInput.expectedPrice
                          "
                        >
                          Thêm lựa chọn giá bán = giá nhập
                        </a-checkbox>
                      </div>
                      <div class="pt-3">
                        <a-checkbox
                          v-model:checked="settingDisplay.invoiceItemInput.discount"
                          :disabled="!settingDisplay.invoiceItemInput.customAfterSearch"
                        >
                          Chỉnh sửa chiết khấu
                        </a-checkbox>
                      </div>
                      <div class="pt-3">
                        <a-checkbox
                          v-model:checked="settingDisplay.invoiceItemInput.actualPrice"
                          :disabled="!settingDisplay.invoiceItemInput.customAfterSearch"
                        >
                          Chỉnh sửa giá bán thực tế
                        </a-checkbox>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </a-tab-pane>
          <a-tab-pane key="2" tab="Cài đặt danh sách">
            <table class="table-setting">
              <thead>
                <tr>
                  <th>Danh sách hàng trong đơn</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div>Khi thêm sản phẩm có sẵn trong phiếu</div>
                    <div class="pl-7">
                      <a-radio-group
                        v-model:value="settingDisplay.invoiceItemsTable.allowDuplicateItem"
                      >
                        <a-radio style="display: flex; line-height: 36px" :value="false">
                          Cộng gộp số lượng
                        </a-radio>
                        <a-radio style="display: flex; line-height: 36px" :value="true">
                          Không cộng gộp (VD: bán 4 tặng 1 thì bản ghi số lượng 1 có thể điền đơn
                          giá = 0)
                        </a-radio>
                      </a-radio-group>
                    </div>
                  </td>
                </tr>
                <!-- <tr>
                  <td>
                    <div>Khi thêm sản phẩm vượt quá số lượng tồn kho</div>
                    <div class="pl-7">
                      <a-radio-group
                        v-model:value="settingDisplay.invoiceItemsTable.allowOverQuantity"
                      >
                        <a-radio style="display: flex; line-height: 36px" :value="0">
                          Không được phép bán quá số lượng tồn kho
                        </a-radio>
                        <a-radio style="display: flex; line-height: 36px" :value="-1">
                          Được phép bán quá số lượng (số lượng tồn kho có thể là số âm)
                        </a-radio>
                      </a-radio-group>
                    </div>
                  </td>
                </tr> -->
                <tr>
                  <td>
                    <a-checkbox v-model:checked="settingDisplay.invoiceItemsTable.detail">
                      Hiển thị chi tiết sản phẩm (
                      <FileSearchOutlined /> )
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
                    <a-checkbox v-model:checked="settingDisplay.invoiceItemsTable.batch">
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
                    <a-checkbox v-model:checked="settingDisplay.invoiceItemsTable.expectedPrice">
                      Hiển thị giá niêm yết
                    </a-checkbox>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a-checkbox v-model:checked="settingDisplay.invoiceItemsTable.editActualPrice">
                      Cho phép sửa đơn giá
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
          </a-tab-pane>
          <a-tab-pane key="3" tab="Cài đặt hóa đơn">
            <table class="table-setting">
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
                        ref="inputSearchCustomer"
                        v-model:searchText="customerSearchText"
                        :options="customerList"
                        :maxHeight="260"
                        placeholder="(F4) Tìm kiếm bằng Tên hoặc Số Điện Thoại"
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
                            <b>{{ fullName }}</b> - {{ phone }} -
                            {{ DTimer.timeToText(birthday, 'DD/MM/YYYY') }}
                          </div>
                          <div>
                            {{ addressWard }} - {{ addressDistrict }} - {{ addressProvince }}
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
                    <a-checkbox v-model:checked="settingDisplay.save.createBasicAndDetail">
                      Lưu và Xem chi tiết
                    </a-checkbox>
                  </td>
                </tr>
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
          </a-tab-pane>
        </a-tabs>
      </div>

      <div class="p-6">
        <div class="flex justify-end gap-4">
          <a-button @click="handleClose">
            <template #icon>
              <CloseOutlined />
            </template>
            Hủy bỏ
          </a-button>
          <a-button type="primary" :loading="saveLoading" @click="handleSave">
            <template #icon>
              <SaveOutlined />
            </template>
            Lưu lại
          </a-button>
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss">
.invoice-upsert-setting-screen-tabs {
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
</style>
