<script setup lang="ts">
import { nextTick, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconFileSearch } from '../../../common/icon-antd'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputCheckbox, InputOptions } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../common/vue-tabs'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { Distributor, DistributorService } from '../../../modules/distributor'
import { OrganizationService } from '../../../modules/organization'
import { ESTimer } from '../../../utils'

const TABS_KEY = {
  RECEIPT_ITEMS: 'RECEIPT_ITEMS',
  RECEIPT_PAYMENT: 'RECEIPT_PAYMENT',
}

const inputOptionsDistributor = ref<InstanceType<typeof InputOptions>>()

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const meStore = useMeStore()
const settingDisplay = ref<typeof store.SCREEN_RECEIPT_UPSERT>(
  JSON.parse(JSON.stringify(store.SCREEN_RECEIPT_UPSERT))
)
const showModal = ref(false)
const saveLoading = ref(false)

const activeTab = ref(TABS_KEY.RECEIPT_ITEMS)

const distributorList = ref<Distributor[]>([])
const distributorDefault = ref<Distributor>(DistributorService.distributorDefault)

const selectDistributor = async (data?: Distributor) => {
  settingDisplay.value.distributor.idDefault = data?.id || 0
  distributorDefault.value = data || Distributor.blank()
}

const searchingDistributor = async (text: string) => {
  if (text) {
    distributorList.value = await DistributorService.search(text)
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
    await OrganizationService.saveSettings(SettingKey.SCREEN_RECEIPT_UPSERT, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công', 1000)
    store.SCREEN_RECEIPT_UPSERT = JSON.parse(settingData)
    DistributorService.distributorDefault = Distributor.from(distributorDefault.value)
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:75 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleUpdateTabShow = async (value: any) => {
  if (value === TABS_KEY.RECEIPT_PAYMENT) {
    distributorDefault.value = await DistributorService.getDistributorDefault()
    nextTick(() => {
      inputOptionsDistributor.value?.setItem({
        value: distributorDefault.value.id,
        text: distributorDefault.value.fullName,
        data: distributorDefault.value,
      })
    })
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
          <IconClose />
        </div>
      </div>

      <div class="px-6 mt-4 receipt-upsert-setting-screen-tabs">
        <VueTabs v-model:tabShow="activeTab" @update:tabShow="handleUpdateTabShow">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.RECEIPT_ITEMS">Cài đặt danh sách</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.RECEIPT_PAYMENT">Cài đặt phiếu</VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.RECEIPT_ITEMS">
              <div class="mt-4 table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Chọn sản phẩm</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <InputCheckbox
                          v-model:checked="settingDisplay.receiptItemsSelect.warehouse">
                          Hiển thị chọn kho
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox
                          v-model:checked="
                            settingDisplay.receiptItemsSelect.batchCodeAndExpiryDate
                          ">
                          Hiển thị số lô và HSD
                        </InputCheckbox>
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
                        <InputCheckbox v-model:checked="settingDisplay.receiptItemsTable.detail">
                          Hiển thị chi tiết sản phẩm (
                          <IconFileSearch />
                          )
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.receiptItemsTable.substance">
                          Hiển thị hoạt chất
                        </InputCheckbox>
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <InputCheckbox
                          v-model:checked="settingDisplay.receiptItemsTable.batchCodeAndExpiryDate">
                          Hiển thị số lô và HSD
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.receiptItemsTable.unit">
                          Hiển thị đơn vị
                        </InputCheckbox>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <InputCheckbox v-model:checked="settingDisplay.receiptItemsTable.warehouse">
                          Hiển thị kho được nhập
                        </InputCheckbox>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.RECEIPT_PAYMENT">
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
                        <div>Nhà cung cấp mặc định</div>
                        <div class="py-2">
                          <InputOptions
                            ref="inputOptionsDistributor"
                            :options="
                              distributorList.map((i) => ({
                                value: i.id,
                                text: i.fullName,
                                data: i,
                              }))
                            "
                            :max-height="180"
                            placeholder="Tìm kiếm bằng Tên hoặc Số Điện Thoại"
                            @selectItem="({ data }) => selectDistributor(data)"
                            @update:text="searchingDistributor">
                            <template #option="{ item: { data } }">
                              <div>
                                <b>{{ data.fullName }}</b>
                                - {{ data.phone }} -
                                {{ ESTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
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
                        <InputCheckbox
                          v-model:checked="settingDisplay.paymentInfo.itemsActualMoney">
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
                        <InputCheckbox v-model:checked="settingDisplay.paymentInfo.surcharge">
                          Hiển thị phụ phí
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

      <div class="p-6">
        <div class="flex justify-end gap-4">
          <VueButton icon="close" @click="handleClose">Hủy bỏ</VueButton>
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
</style>
