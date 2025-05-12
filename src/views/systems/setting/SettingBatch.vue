<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputSelect } from '../../../common/vue-form'
import VueButton from '../../../common/VueButton.vue'
import { MeService } from '../../../modules/_me/me.service'
import {
  BatchCostPriceRule,
  BatchDistributorIdRule,
  BatchWarehouseIdRule,
} from '../../../modules/_me/setting.default'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { OrganizationService } from '../../../modules/organization'

const settingStore = useSettingStore()
const saveLoading = ref(false)

const settingDisplay = ref<typeof settingStore.BATCH_SETTING>(
  JSON.parse(JSON.stringify(settingStore.BATCH_SETTING)),
)

const unsubscribe = settingStore.$subscribe((mutation, state) => {
  settingDisplay.value = JSON.parse(JSON.stringify(settingStore.BATCH_SETTING))
})

onUnmounted(() => unsubscribe())

const batchWarehouseIdOptions = [
  { value: BatchWarehouseIdRule.Inherit, label: '-' },
  { value: BatchWarehouseIdRule.Override, label: 'Không sử dụng' },
  {
    value: BatchWarehouseIdRule.SplitOnDifferent,
    label: 'Phân biệt giữa các lô',
  },
]
batchWarehouseIdOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.BATCH_SETTING.warehouseId) {
    i.label += ' - (Mặc định)'
  }
})

const batchDistributorIdOptions = [
  { value: BatchDistributorIdRule.Inherit, label: '-' },
  { value: BatchDistributorIdRule.Override, label: 'Không sử dụng' },
  {
    value: BatchDistributorIdRule.SplitOnDifferent,
    label: 'Phân biệt giữa các lô',
  },
]
batchDistributorIdOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.BATCH_SETTING.distributorId) {
    i.label += ' - (Mặc định)'
  }
})

const batchCostPriceOptions = [
  { value: BatchCostPriceRule.Inherit, label: '-' },
  {
    value: BatchCostPriceRule.OverrideAndMAC,
    label: 'Ghi đè giá cũ, giá vốn sử dụng công thức tính bình quân gia quyền',
  },
  {
    value: BatchCostPriceRule.SplitOnDifferent,
    label: 'Phân biệt giữa các lô',
  },
]
batchCostPriceOptions.forEach((i) => {
  if (i.value === MeService.settingMapRoot.value.BATCH_SETTING.costPrice) {
    i.label += ' - (Mặc định)'
  }
})

const saveBatchSetting = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.BATCH_SETTING, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    settingStore.BATCH_SETTING = JSON.parse(settingData)
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
      <h2>1. Các thông tin của lô hàng</h2>
      <div class="table-wrapper">
        <table>
          <tbody>
            <tr>
              <td style="width: 200px">Kho hàng</td>
              <td>
                <div>
                  <InputSelect
                    v-model:value="settingStore.BATCH_SETTING.warehouseId"
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
                    v-model:value="settingStore.BATCH_SETTING.distributorId"
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
                    v-model:value="settingStore.BATCH_SETTING.costPrice"
                    :options="batchCostPriceOptions"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="my-4 flex justify-end">
        <VueButton color="blue" icon="save" @click="saveBatchSetting">Lưu lại</VueButton>
      </div>
    </div>
  </div>
</template>
