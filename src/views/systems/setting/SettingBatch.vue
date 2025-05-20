<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputCheckbox, InputSelect } from '../../../common/vue-form'
import VueButton from '../../../common/VueButton.vue'
import { MeService } from '../../../modules/_me/me.service'
import {
  BatchCostPriceRule,
  BatchDistributorIdRule,
  BatchWarehouseIdRule,
} from '../../../modules/_me/setting.default'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { InventoryStrategy } from '../../../modules/enum'
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

const inventoryStrategyOptions = [
  { value: InventoryStrategy.Inherit, label: '-' },
  { value: InventoryStrategy.NoImpact, label: 'Không trừ kho (không quản lý số lượng trong kho)' },
  { value: InventoryStrategy.RequireBatchSelection, label: 'Bắt buộc chọn lô hàng' },
  { value: InventoryStrategy.AutoWithFIFO, label: 'Tự động chọn lô theo FIFO' },
  { value: InventoryStrategy.AutoWithLIFO, label: 'Tự động chọn lô theo LIFO' },
  { value: InventoryStrategy.AutoWithExpiryDate, label: 'Tự động chọn lô theo HSD gần nhất' },
]
inventoryStrategyOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.PRODUCT_SETTING.inventoryStrategy) {
    i.label = '(Mặc định) - ' + i.label
  }
})

const batchWarehouseIdOptions = [
  { value: BatchWarehouseIdRule.Inherit, label: '-' },
  { value: BatchWarehouseIdRule.Override, label: 'Không sử dụng' },
  { value: BatchWarehouseIdRule.SplitOnDifferent, label: 'Phân biệt giữa các lô' },
]
batchWarehouseIdOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.PRODUCT_SETTING.batch_warehouseId) {
    i.label = '(Mặc định) - ' + i.label
  }
})

const batchDistributorIdOptions = [
  { value: BatchDistributorIdRule.Inherit, label: '-' },
  { value: BatchDistributorIdRule.Override, label: 'Không sử dụng' },
  { value: BatchDistributorIdRule.SplitOnDifferent, label: 'Phân biệt giữa các lô' },
]
batchDistributorIdOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.PRODUCT_SETTING.batch_distributorId) {
    i.label = '(Mặc định) - ' + i.label
  }
})

const batchCostPriceOptions = [
  { value: BatchCostPriceRule.Inherit, label: '-' },
  {
    value: BatchCostPriceRule.OverrideAndMAC,
    label: 'Ghi đè giá cũ, giá vốn sử dụng công thức tính bình quân gia quyền',
  },
  { value: BatchCostPriceRule.SplitOnDifferent, label: 'Phân biệt giữa các lô' },
]
batchCostPriceOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.PRODUCT_SETTING.batch_costPrice) {
    i.label = '(Mặc định) - ' + i.label
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
                <td style="width: 200px">Chiến lược trừ kho</td>
                <td>
                  <div>
                    <InputSelect
                      v-model:value="productSetting.inventoryStrategy"
                      :options="inventoryStrategyOptions"
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <div class="mt-1 font-medium">2. Quản lý thông tin của lô hàng</div>
                </td>
              </tr>
              <tr>
                <td style="width: 200px">Kho hàng</td>
                <td>
                  <div>
                    <InputSelect
                      v-model:value="productSetting.batch_warehouseId"
                      :options="batchWarehouseIdOptions"
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td>Nhà cung cấp</td>
                <td>
                  <div>
                    <InputSelect
                      v-model:value="productSetting.batch_distributorId"
                      :options="batchDistributorIdOptions"
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td>Giá nhập</td>
                <td style="width: 400px">
                  <div>
                    <InputSelect
                      v-model:value="productSetting.batch_costPrice"
                      :options="batchCostPriceOptions"
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
