<script setup lang="ts">
import { CloseOutlined, FileSearchOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { nextTick, ref } from 'vue'
import VueModal from '../../../common/VueModal.vue'
import { InputOptions } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { Distributor, useDistributorStore } from '../../../modules/distributor'
import { OrganizationService } from '../../../modules/organization'
import { DTimer } from '../../../utils'
import VueButton from '../../../common/VueButton.vue'

const inputOptionsDistributor = ref<InstanceType<typeof InputOptions>>()

const emit = defineEmits<{ (e: 'success'): void }>()

const distributorStore = useDistributorStore()

const store = useSettingStore()
const meStore = useMeStore()
const settingDisplay = ref<typeof store.SCREEN_RECEIPT_UPSERT>(
  JSON.parse(JSON.stringify(store.SCREEN_RECEIPT_UPSERT))
)
const showModal = ref(false)
const saveLoading = ref(false)

const activeTab = ref('1')

const distributorList = ref<Distributor[]>([])
const distributorDefault = ref<Distributor>(meStore.distributorDefault)

const selectDistributor = async (data?: Distributor) => {
  settingDisplay.value.distributor.idDefault = data?.id || 0
  distributorDefault.value = data || Distributor.blank()
}

const searchingDistributor = async (text: string) => {
  if (text) {
    distributorList.value = await distributorStore.search(text)
  } else {
    distributorList.value = []
    settingDisplay.value.distributor.idDefault = 0
  }
}

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_RECEIPT_UPSERT))

  distributorDefault.value = await meStore.getDistributorDefault()
  nextTick(() => {
    inputOptionsDistributor.value?.setItem({
      value: distributorDefault.value.id,
      text: distributorDefault.value.fullName,
      data: distributorDefault.value,
    })
  })
}

const handleClose = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.SCREEN_RECEIPT_UPSERT, settingData)
    message.success('Cập nhật cài đặt thành công')
    store.SCREEN_RECEIPT_UPSERT = JSON.parse(settingData)
    meStore.distributorDefault = Distributor.from(distributorDefault.value)
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:75 ~ handleSave ~ error:', error)
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
          <a-tab-pane key="1" tab="Cài đặt danh sách">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Chọn sản phẩm</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <a-checkbox v-model:checked="settingDisplay.receiptItemInput.salePrice">
                        Cập nhật giá bán
                      </a-checkbox>
                    </td>
                  </tr>
                </tbody>
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
                          v-model:value="settingDisplay.receiptItemsTable.allowDuplicateItem">
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
                        <FileSearchOutlined />
                        )
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
                        Hiển thị số lô và HSD
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
            </div>
          </a-tab-pane>
          <a-tab-pane key="2" tab="Cài đặt phiếu" forceRender>
            <div class="table-wrapper">
              <table class="">
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
                          ref="inputOptionsDistributor"
                          :options="
                            distributorList.map((i) => ({ value: i.id, text: i.fullName, data: i }))
                          "
                          :max-height="180"
                          placeholder="Tìm kiếm bằng Tên hoặc Số Điện Thoại"
                          @selectItem="({ data }) => selectDistributor(data)"
                          @update:text="searchingDistributor">
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
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>

      <div class="p-6">
        <div class="flex justify-end gap-4">
          <VueButton @click="handleClose">
            <CloseOutlined />
            Hủy bỏ
          </VueButton>
          <VueButton color="blue" :loading="saveLoading" icon="save" @click="handleSave">
            Lưu lại
          </VueButton>
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
