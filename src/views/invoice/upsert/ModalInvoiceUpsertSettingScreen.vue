<script setup lang="ts">
import { OrganizationService } from '@/modules/organization'
import { useOrganizationStore } from '@/store/organization.store'
import { OrganizationSettingsType } from '@/store/store.variable'
import { message } from 'ant-design-vue'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useOrganizationStore()
const settingDisplay = ref<typeof store.SCREEN_INVOICE_UPSERT>(JSON.parse(JSON.stringify(store.SCREEN_INVOICE_UPSERT)))
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_INVOICE_UPSERT))
}

const refreshModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(OrganizationSettingsType.SCREEN_INVOICE_UPSERT, settingData)
    message.success('Cập nhật cài đặt thành công')
    store.SCREEN_INVOICE_UPSERT = JSON.parse(settingData)

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
  <a-modal v-model:visible="showModal" width="900px" title="Cài đặt hiển thị" :confirm-loading="saveLoading"
    :afterClose="refreshModal" @ok="handleSave">
    <div class="table-wrapper">
      <table class="screen-setting">
        <thead>
          <tr>
            <th>Chọn dịch vụ - hàng hóa</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.invoiceItemInput.hintUsage">
                Hiển thị hướng dẫn sử dụng
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.invoiceItemInput.expectedPrice">
                Hiển thị giá bán
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.invoiceItemInput.wholesalePrice">
                Hiển thị chọn giá bán sỉ
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.invoiceItemInput.costPrice">
                Hiển thị chọn giá nhập
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.invoiceItemInput.discount">
                Hiển thị chiết khấu
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.invoiceItemInput.actualPrice">
                Hiển thị giá bán thực tế
              </a-checkbox>
            </td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th>Danh sách</th>
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
              <a-checkbox v-model:checked="settingDisplay.invoiceItemsTable.discount">
                Hiển thị chiết khấu
              </a-checkbox>
            </td>
          </tr>
        </tbody>

        <thead>
          <tr>
            <th>Thông tin thanh toán</th>
          </tr>
        </thead>
        <tbody>
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
            <th>Thông tin khác</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.other.expenses">
                Hiển thị chi phí
              </a-checkbox>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </a-modal>
</template>
