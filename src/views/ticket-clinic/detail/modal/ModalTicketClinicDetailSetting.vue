<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon-antd'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputCheckbox, VueSelect } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../../common/vue-tabs'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { SettingKey } from '../../../../modules/_me/store.variable'
import { OrganizationService } from '../../../../modules/organization'
import { PrintHtml, PrintHtmlService } from '../../../../modules/print-html'
import { TicketType } from '../../../../modules/ticket'
import { WarehouseService } from '../../../../modules/warehouse/warehouse.service'

const TABS_KEY = {
  CONSUMABLE: 'CONSUMABLE',
  PRESCRIPTION: 'PRESCRIPTION',
}

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const meStore = useMeStore()

const settingDisplay = ref<typeof settingStore.TICKET_CLINIC_DETAIL>(
  JSON.parse(JSON.stringify(settingStore.TICKET_CLINIC_DETAIL)),
)

const warehouseOptions = ref<{ value: number; label: string }[]>([])
const printHtmlOptions = ref<{ value: number; text: string; data: PrintHtml }[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const activeTab = ref(TABS_KEY.PRESCRIPTION)

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(settingStore.TICKET_CLINIC_DETAIL))

  PrintHtmlService.list({})
    .then((result) => {
      printHtmlOptions.value = [
        { value: 0, text: 'Mặc định', data: PrintHtml.blank() },
        ...result.map((i) => ({ value: i.id, text: i.name, data: i })),
      ]
    })
    .catch((e) => {
      console.log('🚀: ModalTicketClinicDetailSetting.vue:64 ~ PrintHtmlService.list ~ e:', e)
    })

  WarehouseService.list({})
    .then((result) => {
      warehouseOptions.value = [
        { value: 0, label: 'Tất cả kho' },
        ...result.map((i) => ({ value: i.id, label: i.name })),
      ]
    })
    .catch((e) => {
      console.log('🚀: ModalTicketClinicDetailSetting.vue:78 ~ WarehouseService.list ~ e:', e)
    })
}

const closeModal = () => {
  showModal.value = false
}

const clearWarehouseIdList = () => {
  if (settingDisplay.value.consumable.warehouseIdList.length === 0) {
    settingDisplay.value.consumable.warehouseIdList = [0]
  }
  if (settingDisplay.value.consumable.warehouseIdList.includes(0)) {
    settingDisplay.value.consumable.warehouseIdList = [0]
  }
  if (settingDisplay.value.prescriptions.warehouseIdList.length === 0) {
    settingDisplay.value.prescriptions.warehouseIdList = [0]
  }
  if (settingDisplay.value.prescriptions.warehouseIdList.includes(0)) {
    settingDisplay.value.prescriptions.warehouseIdList = [0]
  }
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    clearWarehouseIdList()
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.TICKET_CLINIC_DETAIL, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công', 1000)
    settingStore.TICKET_CLINIC_DETAIL = JSON.parse(settingData)
    emit('success')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:68 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Cài đặt dữ liệu</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 invoice-upsert-setting-screen-tabs">
        <VueTabs :tabShow="activeTab">
          <template #menu>
            <VueTabMenu :tabKey="TABS_KEY.CONSUMABLE">Vật tư</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.PRESCRIPTION">Đơn thuốc</VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.CONSUMABLE">
              <div class="mt-4 pb-20 table-wrapper">
                <table class="">
                  <thead>
                    <tr>
                      <th colspan="2">Cài đặt vật tư</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="width: 30%">Kho tìm kiếm vật tư</td>
                      <td>
                        <div>
                          <a-select
                            v-model:value="settingDisplay.consumable.warehouseIdList"
                            mode="multiple"
                            style="width: 100%"
                            placeholder="Please select"
                            :options="warehouseOptions"
                          ></a-select>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox
                          v-model:value="settingDisplay.consumable.searchIncludeZeroQuantity"
                          type-parser="number"
                          label="Khi tìm kiếm: hiển thị cả những sản phẩm có số lượng = 0"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.PRESCRIPTION">
              <div class="mt-4 pb-20 table-wrapper">
                <table class="">
                  <thead>
                    <tr>
                      <th colspan="2">Cài đặt đơn thuốc</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="width: 30%">Kho tìm kiếm thuốc</td>
                      <td>
                        <div>
                          <a-select
                            v-model:value="settingDisplay.prescriptions.warehouseIdList"
                            mode="multiple"
                            style="width: 100%"
                            placeholder="Please select"
                            :options="warehouseOptions"
                          ></a-select>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox
                          v-model:value="settingDisplay.prescriptions.searchIncludeZeroQuantity"
                          type-parser="number"
                          label="Khi tìm kiếm: hiển thị cả những sản phẩm có số lượng = 0"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </VueTabPanel>
          </template>
        </VueTabs>
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

<style lang="scss" scoped></style>
