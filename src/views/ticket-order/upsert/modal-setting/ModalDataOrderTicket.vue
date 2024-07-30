<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { IconClose } from '../../../../common/icon'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { SettingKey } from '../../../../modules/_me/store.variable'
import { OrganizationService } from '../../../../modules/organization'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../../common/vue-tabs'

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const SURCHARGE_DETAIL = ref<typeof store.INVOICE_SURCHARGE_DETAIL>(
  JSON.parse(JSON.stringify(store.INVOICE_SURCHARGE_DETAIL))
)
const EXPENSE_DETAIL = ref<typeof store.INVOICE_EXPENSE_DETAIL>(
  JSON.parse(JSON.stringify(store.INVOICE_EXPENSE_DETAIL))
)

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref('surcharge')

const openModal = async () => {
  showModal.value = true
  SURCHARGE_DETAIL.value = JSON.parse(JSON.stringify(store.INVOICE_SURCHARGE_DETAIL))
  EXPENSE_DETAIL.value = JSON.parse(JSON.stringify(store.INVOICE_EXPENSE_DETAIL))
}

const closeModal = () => {
  showModal.value = false
}

const disabledButtonSave = computed(() => {
  return (
    JSON.stringify(EXPENSE_DETAIL.value) === JSON.stringify(store.INVOICE_EXPENSE_DETAIL) &&
    JSON.stringify(SURCHARGE_DETAIL.value) === JSON.stringify(store.INVOICE_SURCHARGE_DETAIL)
  )
})

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (activeTab.value === '1') {
      Object.keys(SURCHARGE_DETAIL.value).forEach((key) => {
        if (!SURCHARGE_DETAIL.value[key]) delete SURCHARGE_DETAIL.value[key]
      })
      const data = JSON.stringify(SURCHARGE_DETAIL.value)
      await OrganizationService.saveSettings(SettingKey.INVOICE_SURCHARGE_DETAIL, data)
      store.INVOICE_SURCHARGE_DETAIL = JSON.parse(data)
    }
    if (activeTab.value === '2') {
      Object.keys(EXPENSE_DETAIL.value).forEach((key) => {
        if (!EXPENSE_DETAIL.value[key]) delete EXPENSE_DETAIL.value[key]
      })
      const data = JSON.stringify(EXPENSE_DETAIL.value)
      await OrganizationService.saveSettings(SettingKey.INVOICE_EXPENSE_DETAIL, data)
      store.INVOICE_EXPENSE_DETAIL = JSON.parse(data)
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
  EXPENSE_DETAIL.value = JSON.parse(JSON.stringify(store.INVOICE_EXPENSE_DETAIL))
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

      <div class="mt-4 px-4 bg-white">
        <div class="modal-data-product-tabs">
          <VueTabs v-model:tabShow="activeTab">
            <template #menu>
              <VueTabMenu tabKey="surcharge">Phụ phí</VueTabMenu>
              <VueTabMenu tabKey="expense">Chi phí</VueTabMenu>
            </template>
            <template #panel>
              <VueTabPanel tabKey="surcharge">
                <div class="w-full">
                  <details class="my-2">
                    <summary style="font-style: italic">Giải thích chi tiết về phụ phí</summary>
                    <p class="mt-2 italic">
                      - Tiền
                      <b>phụ phí</b>
                      là tiền người mua cần phải trả thêm vào đơn hàng
                    </p>
                    <p>
                      - Các phụ phí thường gặp như:
                      <b>tiền vận chuyển</b>
                      , tiền đóng gói, tiền tư vấn, ...
                    </p>
                    <p class="italic">- Công thức tính tổng tiền đơn hàng:</p>
                    <div class="text-center">
                      <span class="mx-2 font-bold">Tổng tiền</span>
                      =
                      <span class="mx-2">Tiền hàng</span>
                      -
                      <span class="mx-2">Chiết khấu</span>
                      +
                      <span class="mx-2 font-bold">Phụ phí</span>
                    </div>
                  </details>
                  <div class="flex mt-4">
                    <div style="width: 90px; font-weight: 600; padding: 0 5px">ID</div>
                    <div style="flex: 1; font-weight: 600; padding: 0 5px">Tên phụ phí</div>
                  </div>
                  <div v-for="(r, key, index) in SURCHARGE_DETAIL" :key="key">
                    <div class="py-2 flex items-stretch">
                      <div
                        class="flex justify-center items-center px-1"
                        style="
                          border: 1px solid #d9d9d9;
                          border-right: none;
                          width: 40px;
                          background-color: #f7f7f7;
                        ">
                        <span>{{ index }}</span>
                      </div>
                      <a-input v-model:value="SURCHARGE_DETAIL[key]" style="flex: 1" />
                      <div v-if="key !== '_unknown'" class="flex items-center mx-2">
                        <a style="color: var(--text-red)" @click="delete SURCHARGE_DETAIL[key]">
                          Xóa
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="py-2 flex justify-center">
                  <VueButton
                    color="blue"
                    icon="plus"
                    @click="SURCHARGE_DETAIL[Date.now().toString(36)] = ''">
                    Thêm mới
                  </VueButton>
                </div>
              </VueTabPanel>
              <VueTabPanel tabKey="expense">
                <div class="w-full">
                  <details class="my-2">
                    <summary style="font-style: italic">Giải thích chi tiết về chi phí</summary>
                    <p class="mt-2 italic">
                      - Tiền
                      <b>chi phí</b>
                      là tiền người bán phải chịu khi tạo đơn hàng
                    </p>
                    <p>
                      - Các chi phí thường gặp như:
                      <b>tiền hoa hồng</b>
                      , ...
                    </p>
                    <div class="italic">- Công thức tính lãi của đơn hàng:</div>
                    <div class="text-center">
                      <span class="mx-2 font-bold">Tổng tiền</span>
                      =
                      <span class="mx-2">Tiền cost</span>
                      +
                      <span class="mx-2">Chi phí</span>
                      +
                      <span class="mx-2 font-bold">Tiền lãi</span>
                    </div>
                  </details>
                  <div class="flex mt-4">
                    <div style="width: 90px; font-weight: 600; padding: 0 5px">ID</div>
                    <div style="flex: 1; font-weight: 600; padding: 0 5px">Tên chi phí</div>
                  </div>
                  <div v-for="(r, key, index) in EXPENSE_DETAIL" :key="key">
                    <div class="py-2 flex">
                      <div
                        class="flex justify-center items-center px-1"
                        style="
                          border: 1px solid #d9d9d9;
                          border-right: none;
                          width: 40px;
                          background-color: #f7f7f7;
                        ">
                        <span>{{ index }}</span>
                      </div>
                      <a-input v-model:value="EXPENSE_DETAIL[key]" style="flex: 1" />
                      <div v-if="key !== '_unknown'" class="flex items-center mx-2">
                        <a style="color: var(--text-red)" @click="delete EXPENSE_DETAIL[key]">
                          Xóa
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="py-2 flex justify-center">
                  <VueButton
                    color="blue"
                    icon="plus"
                    @click="EXPENSE_DETAIL[Date.now().toString(36)] = ''">
                    Thêm mới
                  </VueButton>
                </div>
              </VueTabPanel>
            </template>
          </VueTabs>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton @click="handleReload">Tải lại</VueButton>
          <VueButton icon="close" class="ml-auto" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton
            :disabled="disabledButtonSave"
            :loading="saveLoading"
            icon="save"
            color="blue"
            @click="handleSave">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
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
