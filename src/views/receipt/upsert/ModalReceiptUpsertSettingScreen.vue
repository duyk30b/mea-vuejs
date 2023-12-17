<script setup lang="ts">
import VueModal from '@/common/VueModal.vue'
import { InputOptions } from '@/common/vue-form'
import { Distributor, useDistributorStore } from '@/modules/distributor'
import { OrganizationService } from '@/modules/organization'
import { useOrganizationStore } from '@/store/organization.store'
import { OrganizationSettingsType } from '@/store/store.variable'
import { DTimer } from '@/utils'
import { FileSearchOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import { CloseOutlined, SaveOutlined } from '@ant-design/icons-vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const distributorStore = useDistributorStore()

const store = useOrganizationStore()
const settingDisplay = ref<typeof store.SCREEN_RECEIPT_UPSERT>(
  JSON.parse(JSON.stringify(store.SCREEN_RECEIPT_UPSERT))
)
const showModal = ref(false)
const saveLoading = ref(false)

const activeTab = ref('1')
const distributorSearchText = ref(store.distributorDefault?.fullName || '')

const distributorList = ref<Distributor[]>([])
const distributorDefault = ref<Distributor>()

const selectDistributor = async (data?: Distributor) => {
  settingDisplay.value.distributor.idDefault = data?.id || 0
  distributorSearchText.value = data?.fullName || ''
  distributorDefault.value = data || Distributor.blank()
}

const searchingDistributor = async (text: string) => {
  if (text) {
    distributorList.value = distributorStore.search(text)
  } else {
    distributorList.value = []
    settingDisplay.value.distributor.idDefault = 0
  }
}

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_RECEIPT_UPSERT))
}

const handleClose = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(
      OrganizationSettingsType.SCREEN_RECEIPT_UPSERT,
      settingData
    )
    message.success('Cập nhật cài đặt thành công')
    store.SCREEN_RECEIPT_UPSERT = JSON.parse(settingData)
    store.distributorDefault = Distributor.fromPlain(distributorDefault.value)
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:66 ~ handleSave ~ error:', error)
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

      <div class="px-6 mt-4 receipt-upsert-setting-screen-tabs">
        <a-tabs v-model:activeKey="activeTab" type="card" :tabBarGutter="10">
          <a-tab-pane key="1" tab="Cài đặt tìm kiếm">
            <table class="table-setting">
              <thead>
                <tr>
                  <th>Tìm kiếm sản phẩm</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <a-checkbox v-model:checked="settingDisplay.receiptItemInput.batch">
                      Hiển thị lô hàng
                    </a-checkbox>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a-checkbox v-model:checked="settingDisplay.receiptItemInput.expiryDate">
                      Hiển thị hạn sử dụng
                    </a-checkbox>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a-checkbox v-model:checked="settingDisplay.receiptItemInput.wholesalePrice">
                      Hiển thị giá bán sỉ
                    </a-checkbox>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a-checkbox v-model:checked="settingDisplay.receiptItemInput.retailPrice">
                      Hiển thị giá bán lẻ
                    </a-checkbox>
                  </td>
                </tr>
              </tbody>
            </table>
          </a-tab-pane>
          <a-tab-pane key="2" tab="Cài đặt danh sách">
            <table class="table-setting">
              <thead>
                <tr>
                  <th>Danh sách hàng trong phiếu</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div>Khi thêm sản phẩm có sẵn trong phiếu</div>
                    <div class="pl-7">
                      <a-radio-group
                        v-model:value="settingDisplay.receiptItemsTable.allowDuplicateItem"
                      >
                        <a-radio style="display: flex; line-height: 36px" :value="false">
                          Cộng gộp số lượng
                        </a-radio>
                        <a-radio style="display: flex; line-height: 36px" :value="true">
                          Không cộng gộp (VD: nhập 4 tặng 1 thì bản ghi số lượng 1 có thể điền đơn
                          giá = 0)
                        </a-radio>
                      </a-radio-group>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a-checkbox v-model:checked="settingDisplay.receiptItemsTable.detail">
                      Hiển thị chi tiết sản phẩm (
                      <FileSearchOutlined /> )
                    </a-checkbox>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a-checkbox v-model:checked="settingDisplay.receiptItemsTable.substance">
                      Hiển thị hoạt chất
                    </a-checkbox>
                  </td>
                </tr>

                <tr>
                  <td>
                    <a-checkbox v-model:checked="settingDisplay.receiptItemsTable.batch">
                      Hiển thị lô hàng
                    </a-checkbox>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a-checkbox v-model:checked="settingDisplay.receiptItemsTable.expiryDate">
                      Hiển thị hạn sử dụng
                    </a-checkbox>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a-checkbox v-model:checked="settingDisplay.receiptItemsTable.unit">
                      Hiển thị đơn vị
                    </a-checkbox>
                  </td>
                </tr>
              </tbody>
            </table>
          </a-tab-pane>
          <a-tab-pane key="3" tab="Cài đặt phiếu">
            <table class="table-setting">
              <thead>
                <tr>
                  <th>Thông tin thanh toán</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div>Nhà cung cấp mặc định</div>
                    <div class="py-2">
                      <InputOptions
                        ref="inputSearchDistributor"
                        v-model:searchText="distributorSearchText"
                        :options="distributorList"
                        :maxHeight="260"
                        placeholder="(F4) Tìm kiếm bằng Tên hoặc Số Điện Thoại"
                        @selectItem="selectDistributor"
                        @update:searchText="searchingDistributor"
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
                      Lưu và Tạo phiếu mới
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
.receipt-upsert-setting-screen-tabs {
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
