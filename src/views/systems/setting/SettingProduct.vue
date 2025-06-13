<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputCheckbox, InputSelect } from '../../../common/vue-form'
import VueButton from '../../../common/VueButton.vue'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import {
  PickupStrategy,
  SplitBatchByCostPrice,
  SplitBatchByDistributor,
  SplitBatchByExpiryDate,
  SplitBatchByWarehouse,
} from '../../../modules/enum'
import { OrganizationService } from '../../../modules/organization'

const settingStore = useSettingStore()
const saveLoading = ref(false)

const productSetting = ref<typeof settingStore.PRODUCT_SETTING>(
  JSON.parse(JSON.stringify(settingStore.PRODUCT_SETTING)),
)

const unsubscribe = settingStore.$subscribe((mutation, state) => {
  productSetting.value = JSON.parse(JSON.stringify(settingStore.PRODUCT_SETTING))
})

onUnmounted(() => unsubscribe())

const pickupStrategyOptions = [
  { value: PickupStrategy.Inherit, label: '--- Mặc định theo hệ thống ---' },
  { value: PickupStrategy.NoImpact, label: 'Không trừ kho (không quản lý số lượng trong kho)' },
  { value: PickupStrategy.RequireBatchSelection, label: 'Bắt buộc chọn lô hàng' },
  { value: PickupStrategy.AutoWithFIFO, label: 'Tự động chọn lô theo FIFO' },
  { value: PickupStrategy.AutoWithExpiryDate, label: 'Tự động chọn lô theo HSD gần nhất' },
]
pickupStrategyOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.PRODUCT_SETTING.pickupStrategy) {
    i.label = '(Hệ thống) - ' + i.label
  }
})

const splitBatchByWarehouseOptions = [
  { value: SplitBatchByWarehouse.Inherit, label: '--- Mặc định theo hệ thống ---' },
  { value: SplitBatchByWarehouse.Override, label: 'Không phân biệt giữa các lô' },
  { value: SplitBatchByWarehouse.SplitOnDifferent, label: 'Phân biệt giữa các lô' },
]
splitBatchByWarehouseOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.PRODUCT_SETTING.splitBatchByWarehouse) {
    i.label = '(Hệ thống) - ' + i.label
  }
})

const splitBatchByDistributorOptions = [
  { value: SplitBatchByDistributor.Inherit, label: '--- Mặc định theo hệ thống ---' },
  { value: SplitBatchByDistributor.Override, label: 'Không phân biệt giữa các lô' },
  { value: SplitBatchByDistributor.SplitOnDifferent, label: 'Phân biệt giữa các lô' },
]
splitBatchByDistributorOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.PRODUCT_SETTING.splitBatchByDistributor) {
    i.label = '(Hệ thống) - ' + i.label
  }
})

const splitBatchByExpiryDateOptions = [
  { value: SplitBatchByExpiryDate.Inherit, label: '--- Mặc định theo hệ thống ---' },
  { value: SplitBatchByExpiryDate.Override, label: 'Không phân biệt giữa các lô' },
  { value: SplitBatchByExpiryDate.SplitOnDifferent, label: 'Phân biệt giữa các lô' },
]
splitBatchByExpiryDateOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.PRODUCT_SETTING.splitBatchByExpiryDate) {
    i.label = '(Hệ thống) - ' + i.label
  }
})

const splitBatchByCostPriceOptions = [
  { value: SplitBatchByCostPrice.Inherit, label: '--- Mặc định theo hệ thống ---' },
  {
    value: SplitBatchByCostPrice.OverrideAndMAC,
    label: 'Ghi đè giá nhập cũ, giá vốn sử dụng công thức tính bình quân gia quyền',
  },
  { value: SplitBatchByCostPrice.SplitOnDifferent, label: 'Phân biệt giữa các lô' },
]
splitBatchByCostPriceOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.PRODUCT_SETTING.splitBatchByCostPrice) {
    i.label = '(Hệ thống) - ' + i.label
  }
})

const saveBatchSetting = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(productSetting.value)
    await OrganizationService.saveSettings(SettingKey.PRODUCT_SETTING, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    settingStore.PRODUCT_SETTING = JSON.parse(settingData)
  } catch (error) {
    console.log('🚀 ~ SettingBatch.vue:33 ~ saveBatchSetting ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}
</script>

<template>
  <div class="p-4">
    <div style="max-width: 1000px">
      <div class="">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th colspan="2">Cài đặt sản phẩm</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="2">
                  <div class="mt-1 font-medium">1. Quản lý số lượng sản phẩm</div>
                </td>
              </tr>
              <tr>
                <td style="width: 200px">Số lượng âm</td>
                <td>
                  <div style="line-height: 32px">
                    <InputCheckbox v-model:checked="productSetting.allowNegativeQuantity">
                      Cho phép tồn kho có số lượng âm (xuất kho được phép nhiều hơn số lượng tồn)
                    </InputCheckbox>
                  </div>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <div class="mt-1 font-medium">
                    2. Cài đặt đối với sản phẩm chia nhiều lô hàng, HSD
                  </div>
                </td>
              </tr>
              <tr>
                <td style="width: 200px">Chiến lược lấy hàng</td>
                <td>
                  <div>
                    <InputSelect
                      v-model:value="productSetting.pickupStrategy"
                      :options="pickupStrategyOptions"
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="width: 200px">Kho hàng</td>
                <td>
                  <div>
                    <InputSelect
                      v-model:value="productSetting.splitBatchByWarehouse"
                      :options="splitBatchByWarehouseOptions"
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td>Nhà cung cấp</td>
                <td>
                  <div>
                    <InputSelect
                      v-model:value="productSetting.splitBatchByDistributor"
                      :options="splitBatchByDistributorOptions"
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td>Hạn sử dụng</td>
                <td>
                  <div>
                    <InputSelect
                      v-model:value="productSetting.splitBatchByExpiryDate"
                      :options="splitBatchByExpiryDateOptions"
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td>Giá nhập</td>
                <td style="width: 400px">
                  <div>
                    <InputSelect
                      v-model:value="productSetting.splitBatchByCostPrice"
                      :options="splitBatchByCostPriceOptions"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="my-4 flex justify-end">
        <VueButton color="blue" icon="save" @click="saveBatchSetting">Lưu lại</VueButton>
      </div>
    </div>
  </div>
</template>
