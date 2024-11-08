<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconFileSearch } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { OrganizationService } from '../../../modules/organization'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const settingDisplay = ref<typeof store.SCREEN_RECEIPT_DETAIL>(
  JSON.parse(JSON.stringify(store.SCREEN_RECEIPT_DETAIL))
)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(store.SCREEN_RECEIPT_DETAIL))
}

const closeModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.SCREEN_RECEIPT_DETAIL, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
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
              <th>Thông tin hàng hóa</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a-checkbox v-model:checked="settingDisplay.receiptItemsTable.detail">
                  Hiển thị nút xem chi tiết sản phẩm (
                  <IconFileSearch />
                  )
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
                <a-checkbox
                  v-model:checked="settingDisplay.receiptItemsTable.lotNumberAndExpiryDate">
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
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a-checkbox v-model:checked="settingDisplay.process.sendProductAndPayment">
                  Hiển thị nút: Nhập hàng và thanh toán
                </a-checkbox>
              </td>
            </tr>
            <tr>
              <td>
                <a-checkbox v-model:checked="settingDisplay.process.sendProductAndDebit">
                  Hiển thị nút: Nhập hàng và ghi nợ
                </a-checkbox>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton icon="close" class="ml-auto" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton icon="save" color="blue" :loading="saveLoading" @click="handleSave">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>
