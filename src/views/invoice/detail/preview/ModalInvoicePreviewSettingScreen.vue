<script setup lang="ts">
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import { OrganizationService } from '../../../../modules/organization'
import { useScreenStore } from '../../../../modules/_me/screen.store'
import { ScreenSettingKey } from '../../../../modules/_me/store.variable'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useScreenStore()
const settingDisplay = ref<typeof store.SCREEN_INVOICE_PREVIEW>(
  JSON.parse(JSON.stringify(store.SCREEN_INVOICE_PREVIEW))
)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_INVOICE_PREVIEW))
}

const refreshModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(
      ScreenSettingKey.SCREEN_INVOICE_PREVIEW,
      settingData
    )
    message.success('Cập nhật cài đặt thành công')
    store.SCREEN_INVOICE_PREVIEW = JSON.parse(settingData)

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
  <a-modal
    v-model:visible="showModal"
    width="900px"
    title="Cài đặt hiển thị"
    :confirm-loading="saveLoading"
    :afterClose="refreshModal"
    @ok="handleSave"
  >
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Bảng thông tin sản phẩm - dịch vụ</th>
          </tr>
        </thead>
        <tbody>
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
                Hiển thị tên lô hàng
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.invoiceItemsTable.expiryDate">
                Hiển thị hạn sử dụng
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
              <a-checkbox v-model:checked="settingDisplay.invoiceItemsTable.hintUsage">
                Hiển thị hướng dẫn sử dụng
              </a-checkbox>
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
      </table>
    </div>
  </a-modal>
</template>