<script setup lang="ts">
import { computed, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon-antd'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputText } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../../common/vue-tabs'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { SettingKey } from '../../../../modules/_me/store.variable'
import { OrganizationService } from '../../../../modules/organization'

const TABS_KEY = {
  SURCHARGE: 'SURCHARGE',
  EXPENSE: 'EXPENSE',
}

const emit = defineEmits<{ (e: 'success'): void }>()

const store = useSettingStore()
const SURCHARGE_DETAIL = ref<typeof store.INVOICE_SURCHARGE_DETAIL>(
  JSON.parse(JSON.stringify(store.INVOICE_SURCHARGE_DETAIL)),
)
const EXPENSE_DETAIL = ref<typeof store.INVOICE_EXPENSE_DETAIL>(
  JSON.parse(JSON.stringify(store.INVOICE_EXPENSE_DETAIL)),
)

const showModal = ref(false)
const saveLoading = ref(false)
const activeTab = ref(TABS_KEY.SURCHARGE)

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
    if (activeTab.value === TABS_KEY.SURCHARGE) {
      Object.keys(SURCHARGE_DETAIL.value).forEach((key) => {
        if (!SURCHARGE_DETAIL.value[key]) delete SURCHARGE_DETAIL.value[key]
      })
      const data = JSON.stringify(SURCHARGE_DETAIL.value)
      await OrganizationService.saveSettings(SettingKey.INVOICE_SURCHARGE_DETAIL, data)
      store.INVOICE_SURCHARGE_DETAIL = JSON.parse(data)
    } else if (activeTab.value === TABS_KEY.EXPENSE) {
      Object.keys(EXPENSE_DETAIL.value).forEach((key) => {
        if (!EXPENSE_DETAIL.value[key]) delete EXPENSE_DETAIL.value[key]
      })
      const data = JSON.stringify(EXPENSE_DETAIL.value)
      await OrganizationService.saveSettings(SettingKey.INVOICE_EXPENSE_DETAIL, data)
      store.INVOICE_EXPENSE_DETAIL = JSON.parse(data)
    } else {
      return AlertStore.addSuccess('Cập nhật cài đặt thất bại')
    }

    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    emit('success')
  } catch (error) {
    console.log('🚀 ~ file: ModalSettingDataProduct.vue:66 ~ handleSaveRoute ~ error:', error)
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
        <div class="flex-1 font-medium" style="font-size: 16px">Cài đặt dữ liệu</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="mt-4 px-4 bg-white">
        <VueTabs v-model:tabShow="activeTab">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.SURCHARGE">Phụ phí</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.EXPENSE">Chi phí</VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.SURCHARGE">
              <div class="w-full mt-4">
                <details class="my-2">
                  <summary style="font-style: italic">Giải thích chi tiết về phụ phí</summary>
                  <p class="mt-2 italic">
                    - Tiền
                    <b>phụ phí</b>
                    là tiền thu thêm người mua khi mua hàng
                  </p>
                  <p>
                    - Các phụ phí thường gặp như:
                    <b>tiền vận chuyển</b>
                    , tiền tư vấn, ...
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
                    <div style="flex: 1">
                      <InputText
                        v-model:value="SURCHARGE_DETAIL[key]"
                        :prepend="index.toString()"
                      />
                    </div>
                    <div v-if="key !== '_unknown'" class="flex items-center mx-2">
                      <a style="color: var(--text-red)" @click="delete SURCHARGE_DETAIL[key]">
                        Xóa
                      </a>
                    </div>
                    <div v-else class="flex items-center mx-2">
                      <a style="opacity: 0">Xóa</a>
                    </div>
                  </div>
                </div>
              </div>
              <div class="py-2 flex">
                <VueButton
                  color="blue"
                  icon="plus"
                  @click="SURCHARGE_DETAIL[Date.now().toString(36)] = ''"
                ></VueButton>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.EXPENSE">
              <div class="w-full">
                <details class="my-2">
                  <summary style="font-style: italic">Giải thích chi tiết về chi phí</summary>
                  <p class="mt-2 italic">
                    - Tiền
                    <b>chi phí</b>
                    là tiền
                    <b>người bán phải chịu</b>
                    khi tạo đơn hàng
                  </p>
                  <p>
                    - Các chi phí thường gặp như:
                    <b>tiền đóng gói</b>
                    , tiền hao hụt, thất thoát ...
                  </p>
                  <div class="italic">- Công thức tính lãi của đơn hàng:</div>
                  <div class="text-center">
                    <span class="mx-2 font-bold">Tiền lãi</span>
                    =
                    <span class="mx-2">Tổng tiền</span>
                    <span class="font-bold">-</span>
                    (
                    <span class="mx-2">Tiền vốn</span>
                    +
                    <span class="mx-2">Hoa hồng nhân viên</span>
                    +
                    <span class="mx-2 font-bold">Chi phí</span>
                    )
                  </div>
                </details>
                <div class="flex mt-4">
                  <div style="width: 90px; font-weight: 600; padding: 0 5px">ID</div>
                  <div style="flex: 1; font-weight: 600; padding: 0 5px">Tên chi phí</div>
                </div>
                <div v-for="(r, key, index) in EXPENSE_DETAIL" :key="key">
                  <div class="py-2 flex">
                    <div style="flex: 1">
                      <InputText v-model:value="EXPENSE_DETAIL[key]" :prepend="index.toString()" />
                    </div>
                    <div v-if="key !== '_unknown'" class="flex items-center mx-2">
                      <a style="color: var(--text-red)" @click="delete EXPENSE_DETAIL[key]">Xóa</a>
                    </div>
                    <div v-else class="flex items-center mx-2">
                      <a style="opacity: 0">Xóa</a>
                    </div>
                  </div>
                </div>
              </div>
              <div class="py-2 flex">
                <VueButton
                  color="blue"
                  icon="plus"
                  @click="EXPENSE_DETAIL[Date.now().toString(36)] = ''"
                ></VueButton>
              </div>
            </VueTabPanel>
          </template>
        </VueTabs>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton icon="close" style="margin-left: auto" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton
            :disabled="disabledButtonSave"
            :loading="saveLoading"
            icon="save"
            color="blue"
            @click="handleSave"
          >
            Lưu lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss">
.table-payment {
  td {
    padding: 6px 0;
  }
}
</style>
