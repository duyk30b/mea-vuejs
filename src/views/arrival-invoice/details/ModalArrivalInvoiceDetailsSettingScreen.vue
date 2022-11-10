
<script setup lang="ts">
import { OrganizationService } from '@/modules/organization'
import { useOrganizationStore } from '@/store/organization.store'
import { OrganizationSettingsType } from '@/store/store.variable'
import { FileSearchOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useOrganizationStore()
const settingDisplay = ref<typeof store.SCREEN_INVOICE_ARRIVAL_DETAIL>(JSON.parse(JSON.stringify(store.SCREEN_INVOICE_ARRIVAL_DETAIL)))
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_INVOICE_ARRIVAL_DETAIL))
}

const refreshModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(OrganizationSettingsType.SCREEN_INVOICE_ARRIVAL_DETAIL, settingData)
    message.success('Cập nhật cài đặt thành công')
    store.SCREEN_INVOICE_ARRIVAL_DETAIL = JSON.parse(settingData)

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
            <th>Thông tin sản phẩm - dịch vụ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.invoiceItems.detail">
                Hiển thị nút xem chi tiết sản phẩm (
                <FileSearchOutlined /> )
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.invoiceItems.substance">Hiển thị thành phần</a-checkbox>
            </td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.invoiceItems.expiryDate">Hiển thị hạn sử
                dụng</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.invoiceItems.unit">Hiển thị đơn vị</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.invoiceItems.discount">Hiển thị chiết khấu</a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.invoiceItems.expectedPrice">
                Hiển thị giá niêm yết
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
            <td><a-checkbox v-model:checked="settingDisplay.paymentInfo.totalItemMoney">Hiển thị tiền hàng</a-checkbox>
            </td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.paymentInfo.discount">Hiển thị chiết khấu</a-checkbox></td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.paymentInfo.surcharge">Hiển thị phụ phí</a-checkbox></td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.paymentInfo.payment">
                Hiển thị tiền đã thanh toán
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td><a-checkbox v-model:checked="settingDisplay.paymentInfo.debt">Hiển thị nợ</a-checkbox></td>
          </tr>
        </tbody>
      </table>
    </div>
  </a-modal>
</template>
