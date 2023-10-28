<script setup lang="ts">
import { FileSearchOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import { OrganizationService } from '../../../modules/organization'
import { ReceiptProcessType, useScreenStore } from '../../../modules/_me/screen.store'
import { ScreenSettingKey } from '../../../modules/_me/store.variable'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useScreenStore()
const settingDisplay = ref<typeof store.SCREEN_RECEIPT_DETAIL>(
  JSON.parse(JSON.stringify(store.SCREEN_RECEIPT_DETAIL))
)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_RECEIPT_DETAIL))
}

const refreshModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(ScreenSettingKey.SCREEN_RECEIPT_DETAIL, settingData)
    message.success('Cập nhật cài đặt thành công')
    store.SCREEN_RECEIPT_DETAIL = JSON.parse(settingData)

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
      <table class="screen-setting">
        <thead>
          <tr>
            <th>Thông tin hàng hóa</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.receiptItemsTable.detail">
                Hiển thị nút xem chi tiết sản phẩm (
                <FileSearchOutlined /> )
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.receiptItemsTable.substance">
                Hiển thị hoạt chất
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.receiptItemsTable.batch">
                Hiển thị số lô và HSD
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.receiptItemsTable.unit">
                Hiển thị đơn vị
              </a-checkbox>
            </td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th>Thông tin phiếu nhập hàng</th>
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
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.paymentInfo.paid">
                Hiển thị tiền đã thanh toán
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.paymentInfo.debt">
                Hiển thị nợ
              </a-checkbox>
            </td>
          </tr>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.paymentInfo.debt">
                Hiển thị nợ
              </a-checkbox>
            </td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th>Nhập hàng và thanh toán</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a-radio-group v-model:value="settingDisplay.receiptProcessType">
                <a-radio
                  style="display: flex; line-height: 36px"
                  :value="ReceiptProcessType.NoDebt"
                >
                  Phiếu nhập hàng không nợ: Nhập hàng và thanh toán đồng thời
                </a-radio>
                <a-radio
                  style="display: flex; line-height: 36px"
                  :value="ReceiptProcessType.HasDebt"
                >
                  Phiếu nhập hàng có nợ: Nhập hàng riêng, thanh toán riêng
                </a-radio>
              </a-radio-group>
            </td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th>Chức năng</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a-checkbox v-model:checked="settingDisplay.function.forceEdit">
                Cho phép sửa mọi phiếu hàng
              </a-checkbox>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </a-modal>
</template>
