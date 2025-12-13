<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconFileSearch } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputCheckbox } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { SettingKey } from '@/modules/_me/store.variable'
import { OrganizationService } from '@/modules/organization'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const settingDisplay = ref<typeof store.SCREEN_INVOICE_DETAIL>(
  JSON.parse(JSON.stringify(store.SCREEN_INVOICE_DETAIL)),
)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_INVOICE_DETAIL))
}

const closeModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.SCREEN_INVOICE_DETAIL, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    store.SCREEN_INVOICE_DETAIL = JSON.parse(settingData)

    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Cài đặt hiển thị</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div class="mt-4 px-4 table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Danh sách sản phẩm - dịch vụ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <InputCheckbox v-model:checked="settingDisplay.invoiceItemsTable.detail">
                  Hiển thị nút xem chi tiết sản phẩm (
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
                <InputCheckbox v-model:checked="settingDisplay.invoiceItemsTable.hintUsage">
                  Hiển thị hướng dẫn sử dụng
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
                <InputCheckbox v-model:checked="settingDisplay.invoiceItemsTable.discount">
                  Hiển thị chiết khấu
                </InputCheckbox>
              </td>
            </tr>
            <tr>
              <td>
                <InputCheckbox v-model:checked="settingDisplay.invoiceItemsTable.expectedPrice">
                  Hiển thị giá niêm yết
                </InputCheckbox>
              </td>
            </tr>
          </tbody>
          <thead>
            <tr>
              <th>Thông tin đơn hàng</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <InputCheckbox v-model:checked="settingDisplay.paymentInfo.itemsActualMoney">
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
            <tr>
              <td>
                <InputCheckbox v-model:checked="settingDisplay.paymentInfo.itemsCostAmount">
                  Hiển thị tổng vốn
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
                <InputCheckbox v-model:checked="settingDisplay.paymentInfo.profit">
                  Hiển thị tiền lãi
                </InputCheckbox>
              </td>
            </tr>
          </tbody>
          <thead>
            <tr>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <InputCheckbox v-model:checked="settingDisplay.process.forceEdit">
                  Cho phép sửa đơn hàng đã hoàn thành
                </InputCheckbox>
              </td>
            </tr>
          </tbody>
        </table>
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
