<script setup lang="ts">
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputCheckbox, InputRadio, InputSelect, type InputSelectOption } from '@/common/vue-form'
import type { InputRadioOptionType } from '@/common/vue-form/InputRadio.vue'
import VueButton from '@/common/VueButton.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { SettingKey } from '@/modules/_me/store.variable'
import { OrganizationService } from '@/modules/organization'
import {
  ProductType,
  ProductTypeText,
  SplitBatchByCostPrice,
  SplitBatchByCostPriceText,
  SplitBatchByDistributor,
  SplitBatchByDistributorText,
  SplitBatchByExpiryDate,
  SplitBatchByExpiryDateText,
  SplitBatchByWarehouse,
  SplitBatchByWarehouseText,
} from '@/modules/product'
import { ESTypescript } from '@/utils'
import { onUnmounted, ref } from 'vue'

const settingStore = useSettingStore()
const saveLoading = ref(false)

const productSetting = ref<typeof settingStore.PRODUCT_SETTING>(
  JSON.parse(JSON.stringify(settingStore.PRODUCT_SETTING)),
)

const unsubscribe = settingStore.$subscribe((mutation, state) => {
  productSetting.value = JSON.parse(JSON.stringify(settingStore.PRODUCT_SETTING))
})

onUnmounted(() => unsubscribe())

const productTypeOptions = ESTypescript.keysEnum(ProductType).map((key) => {
  return {
    key: ProductType[key],
    label: ProductTypeText[ProductType[key]],
  } satisfies InputRadioOptionType
})
const splitBatchByWarehouseOptions = ESTypescript.keysEnum(SplitBatchByWarehouse).map((key) => {
  return {
    value: SplitBatchByWarehouse[key],
    label: SplitBatchByWarehouseText[SplitBatchByWarehouse[key]],
  } satisfies InputSelectOption<any>
})

const splitBatchByDistributorOptions = ESTypescript.keysEnum(SplitBatchByDistributor).map((key) => {
  return {
    value: SplitBatchByDistributor[key],
    label: SplitBatchByDistributorText[SplitBatchByDistributor[key]],
  } satisfies InputSelectOption<any>
})
const splitBatchByExpiryDateOptions = ESTypescript.keysEnum(SplitBatchByExpiryDate).map((key) => {
  return {
    value: SplitBatchByExpiryDate[key],
    label: SplitBatchByExpiryDateText[SplitBatchByExpiryDate[key]],
  } satisfies InputSelectOption<any>
})

const splitBatchByCostPriceOptions = ESTypescript.keysEnum(SplitBatchByCostPrice).map((key) => {
  return {
    value: SplitBatchByCostPrice[key],
    label: SplitBatchByCostPriceText[SplitBatchByCostPrice[key]],
  } satisfies InputSelectOption<any>
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
                    2. Khi tạo sản phẩm mới, các cài đặt mặc định sẽ được áp dụng:
                  </div>
                </td>
              </tr>
              <tr>
                <td style="width: 200px">Loại sản phẩm</td>
                <td>
                  <div class="">
                    <InputRadio
                      v-model:value="productSetting.productType"
                      :options="productTypeOptions"
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
