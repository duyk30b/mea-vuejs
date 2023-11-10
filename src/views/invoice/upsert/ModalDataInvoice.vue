<script setup lang="ts">
import { OrganizationService } from '@/modules/organization'
import { useOrganizationStore } from '@/store/organization.store'
import { OrganizationSettingsType } from '@/store/store.variable'
import { message } from 'ant-design-vue'
import { computed, ref } from 'vue'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useOrganizationStore()
const SURCHARGE_DETAIL = ref<typeof store.INVOICE_SURCHARGE_DETAIL>(JSON.parse(JSON.stringify(store.INVOICE_SURCHARGE_DETAIL)))
const EXPENSES_DETAIL = ref<typeof store.INVOICE_EXPENSES_DETAIL>(JSON.parse(JSON.stringify(store.INVOICE_EXPENSES_DETAIL)))

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref('1')

const openModal = async () => {
  showModal.value = true
  SURCHARGE_DETAIL.value = JSON.parse(JSON.stringify(store.INVOICE_SURCHARGE_DETAIL))
  EXPENSES_DETAIL.value = JSON.parse(JSON.stringify(store.INVOICE_EXPENSES_DETAIL))
}

const refreshModal = () => {
  showModal.value = false
}

const disabledButtonSave = computed(() => {
  return JSON.stringify(EXPENSES_DETAIL.value) === JSON.stringify(store.INVOICE_EXPENSES_DETAIL)
    && JSON.stringify(SURCHARGE_DETAIL.value) === JSON.stringify(store.INVOICE_SURCHARGE_DETAIL)
})

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (activeTab.value === '1') {
      Object.keys(SURCHARGE_DETAIL.value).forEach((key) => {
        if (!SURCHARGE_DETAIL.value[key]) delete SURCHARGE_DETAIL.value[key]
      })
      const data = JSON.stringify(SURCHARGE_DETAIL.value)
      await OrganizationService.saveSettings(OrganizationSettingsType.INVOICE_SURCHARGE_DETAIL, data)
      store.INVOICE_SURCHARGE_DETAIL = JSON.parse(data)
    }
    if (activeTab.value === '2') {
      Object.keys(EXPENSES_DETAIL.value).forEach((key) => {
        if (!EXPENSES_DETAIL.value[key]) delete EXPENSES_DETAIL.value[key]
      })
      const data = JSON.stringify(EXPENSES_DETAIL.value)
      await OrganizationService.saveSettings(OrganizationSettingsType.INVOICE_EXPENSES_DETAIL, data)
      store.INVOICE_EXPENSES_DETAIL = JSON.parse(data)
    }

    message.success('Cập nhật cài đặt thành công')
    emit('success')
  } catch (error) {
    console.log('🚀 ~ file: ModalSettingDataProduct.vue:74 ~ handleSaveRoute ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}
const handleReload = () => {
  SURCHARGE_DETAIL.value = JSON.parse(JSON.stringify(store.INVOICE_SURCHARGE_DETAIL))
  EXPENSES_DETAIL.value = JSON.parse(JSON.stringify(store.INVOICE_EXPENSES_DETAIL))
}

defineExpose({ openModal })
</script>

<template>
  <a-modal v-model:visible="showModal" width="900px" title="Cài đặt dữ liệu" :confirm-loading="saveLoading"
    :afterClose="refreshModal">
    <template #footer>
      <div class="flex justify-between px-2">
        <div>
          <a-button @click="handleReload">Tải lại</a-button>
        </div>
        <div>
          <a-button @click="showModal = false">Hủy</a-button>
          <a-button :disabled="disabledButtonSave" type="primary" @click="handleSave" :loading="saveLoading">
            Lưu lại
          </a-button>
        </div>
      </div>
    </template>
    <div class="modal-data-product-tabs">
      <a-tabs v-model:activeKey="activeTab" type="card" :tabBarGutter="10">
        <a-tab-pane key="1" tab="Phụ phí">
          <div class="w-full">
            <details class="my-2">
              <summary style="font-style: italic;">Giải thích chi tiết về phụ phí</summary>
              <p class="mt-2 italic"> - Tiền <b>phụ phí</b> là tiền người mua cần phải trả thêm vào đơn hàng </p>
              <p> - Các phụ phí thường gặp như: <b>tiền vận chuyển</b>, tiền đóng gói, tiền tư vấn, ... </p>
              <p class="italic"> - Công thức tính tổng tiền đơn hàng:</p>
              <div class="text-center">
                <span class="mx-2 font-bold">Tổng tiền</span>
                = <span class="mx-2">Tiền hàng</span>
                - <span class="mx-2">Chiết khấu</span>
                + <span class="mx-2 font-bold">Phụ phí</span>
              </div>
            </details>
            <div class="flex mt-4">
              <div style="width: 90px; font-weight: 600; padding: 0 5px;">Mã</div>
              <div style="flex: 1; font-weight: 600; padding: 0 5px">Tên phụ phí</div>
            </div>
            <div v-for="(r, key) in SURCHARGE_DETAIL" :key="key">
              <div class="py-2 flex items-stretch">
                <div class="flex justify-center items-center px-1"
                  style="border: 1px solid #d9d9d9; border-right: none; width: 90px; background-color: #f7f7f7;">
                  <span>{{ key.toUpperCase() }}</span>
                </div>
                <a-input v-model:value="SURCHARGE_DETAIL[key]" style="flex: 1" />
                <a-button type="text" @click="delete SURCHARGE_DETAIL[key]" danger
                  :disabled="key === '_unknown'">Xóa</a-button>
              </div>
            </div>
          </div>
          <div class="py-2 flex justify-center">
            <a-button type="primary" @click="SURCHARGE_DETAIL[Date.now().toString(36)] = ''"
              style="background-color: #28a745; border-color: #28a745;">Thêm mới</a-button>
          </div>
        </a-tab-pane>
        <a-tab-pane key="2" tab="Chi phí">
          <div class="w-full">
            <details class="my-2">
              <summary style="font-style: italic;">Giải thích chi tiết về chi phí</summary>
              <p class="mt-2 italic"> - Tiền <b>chi phí</b> là tiền người bán phải chịu khi tạo đơn hàng </p>
              <p> - Các chi phí thường gặp như: <b>tiền hoa hồng</b>, ... </p>
              <div class="italic"> - Công thức tính lãi của đơn hàng:</div>
              <div class="text-center">
                <span class="mx-2 font-bold">Tiền lãi</span>
                = <span class="mx-2">Tổng tiền</span>
                - <span class="mx-2">Tiền nhập hàng</span>
                - <span class="mx-2 font-bold">Chi phí</span>
              </div>
            </details>
            <div class="flex mt-4">
              <div style="width: 90px; font-weight: 600; padding: 0 5px;">Mã</div>
              <div style="flex: 1; font-weight: 600; padding: 0 5px">Tên chi phí</div>
            </div>
            <div v-for="(r, key) in EXPENSES_DETAIL" :key="key">
              <div class="py-2 flex">
                <div class="flex justify-center items-center px-1"
                  style="border: 1px solid #d9d9d9; border-right: none; width: 90px; background-color: #f7f7f7;">
                  <span>{{ key.toUpperCase() }}</span>
                </div>
                <a-input v-model:value="EXPENSES_DETAIL[key]" style="flex: 1" />
                <a-button type="text" @click="delete EXPENSES_DETAIL[key]" danger
                  :disabled="key === '_unknown'">Xóa</a-button>
              </div>
            </div>
          </div>
          <div class="py-2 flex justify-center">
            <a-button type="primary" @click="EXPENSES_DETAIL[Date.now().toString(36)] = ''"
              style="background-color: #28a745; border-color: #28a745;">Thêm mới</a-button>
          </div>
        </a-tab-pane>
      </a-tabs>

    </div>
  </a-modal>
</template>

<style lang="scss">
.modal-data-product-tabs {
  .ant-tabs-tab {
    border-top: 5px solid #d6d6d6 !important;

    &.ant-tabs-tab-active {
      border-top-color: #1890ff !important;
    }
  }
}

.table-payment {
  td {
    padding: 6px 0;
  }
}
</style>
