
<script setup lang="ts">
import { OrganizationService } from '@/modules/organization'
import { useOrganizationStore } from '@/store/organization.store'
import { OrganizationSettingsType } from '@/store/store.variable'
import { FileSearchOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useOrganizationStore()
const settingDisplay = ref<typeof store.SCREEN_PURCHASE_RECEIPT_UPSERT>(JSON.parse(JSON.stringify(store.SCREEN_PURCHASE_RECEIPT_UPSERT)))
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_PURCHASE_RECEIPT_UPSERT))
}

const refreshModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(OrganizationSettingsType.SCREEN_PURCHASE_RECEIPT_UPSERT, settingData)
    message.success('Cập nhật cài đặt thành công')
    store.SCREEN_PURCHASE_RECEIPT_UPSERT = JSON.parse(settingData)

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
            <th>Chọn sản phẩm</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td> <a-checkbox v-model:checked="settingDisplay.receiptItemInput.batch">Hiển thị lô hàng</a-checkbox> </td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.receiptItemInput.wholesalePrice">Hiển thị giá bán
                sỉ</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.receiptItemInput.retailPrice">Hiển thị giá bán lẻ</a-checkbox>
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
            <td> <a-checkbox v-model:checked="settingDisplay.receiptItemsTable.substance">Hiển thị hoạt chất</a-checkbox>
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
            <td><a-checkbox v-model:checked="settingDisplay.receiptItemsTable.batch">Hiển thị lô hàng</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.receiptItemsTable.expiryDate">Hiển thị hạn sử
                dụng</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.receiptItemsTable.unit">Hiển thị đơn vị</a-checkbox></td>
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
              <a-checkbox v-model:checked="settingDisplay.paymentInfo.totalActualMoney">Hiển thị tiền hàng</a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.paymentInfo.discount">Hiển thị chiết khấu</a-checkbox>
            </td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.paymentInfo.surcharge">Hiển thị phụ phí</a-checkbox></td>
          </tr>
        </tbody>
      </table>
    </div>
  </a-modal>
</template>
