<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputCheckbox, InputSelect } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { VueTabMenu, VueTabPanel, VueTabs } from '@/common/vue-tabs'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { SettingKey } from '@/modules/_me/store.variable'
import { PickupStrategy } from '@/modules/enum'
import { OrganizationService } from '@/modules/organization'
import { ROOM_SETTING_DEFAULT, RoomService } from '@/modules/room'
import { TemplateHtmlService, TemplateHtmlType } from '@/modules/template-html'
import { WarehouseService } from '@/modules/warehouse/warehouse.service'
import { useTicketClinicDetailStore } from '@/store/ticket-clinic-detail.store'
import { ref } from 'vue'

const TABS_KEY = {
  GENERAL: 'GENERAL',
  DIAGNOSIS: 'DIAGNOSIS',
  PROCEDURE: 'PROCEDURE',
  CONSUMABLE: 'CONSUMABLE',
  LABORATORY: 'LABORATORY',
  RADIOLOGY: 'RADIOLOGY',
  PRESCRIPTION: 'PRESCRIPTION',
}

const emit = defineEmits<{ (e: 'success'): void }>()

const ticketClinicDetailStore = useTicketClinicDetailStore()
const { userPermission, organizationPermission } = MeService

const roomSettingObj = ref<typeof ROOM_SETTING_DEFAULT>(
  JSON.parse(JSON.stringify(ROOM_SETTING_DEFAULT)),
)

const warehouseOptions = ref<{ value: number; label: string }[]>([])
const templateHtmlOptions = ref<{ value: number; label: string }[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const activeTab = ref(TABS_KEY.GENERAL)

const openModal = async () => {
  showModal.value = true

  roomSettingObj.value = JSON.parse(JSON.stringify(ticketClinicDetailStore.roomRef.roomSettingObj))
  activeTab.value = TABS_KEY.GENERAL

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
  TemplateHtmlService.list({
    filter: { templateHtmlType: TemplateHtmlType.TicketClinicDocumentExtra },
  })
    .then((result) => {
      templateHtmlOptions.value = result.map((i) => ({ value: i.id, label: i.name }))
    })
    .catch((e) => {
      console.log('🚀: ModalTicketClinicDetailSetting.vue:78 ~ TemplateHtmlService.list ~ e:', e)
    })
}

const pickupStrategyConsumableOptions = [
  { value: PickupStrategy.Inherit, label: '--- Mặc định theo hệ thống ---' },
  { value: PickupStrategy.NoImpact, label: 'Không trừ kho (không quản lý số lượng trong kho)' },
  { value: PickupStrategy.RequireBatchSelection, label: 'Bắt buộc chọn lô hàng' },
  { value: PickupStrategy.AutoWithFIFO, label: 'Tự động chọn lô theo FIFO' },
  { value: PickupStrategy.AutoWithExpiryDate, label: 'Tự động chọn lô theo HSD gần nhất' },
]
pickupStrategyConsumableOptions.forEach((i) => {
  if (i.value === roomSettingObj.value.consumable.pickupStrategy) {
    i.label = '(Hệ thống) - ' + i.label
  }
})

const pickupStrategyPrescriptionOptions = [
  { value: PickupStrategy.Inherit, label: '--- Mặc định theo hệ thống ---' },
  { value: PickupStrategy.NoImpact, label: 'Không trừ kho (không quản lý số lượng trong kho)' },
  { value: PickupStrategy.RequireBatchSelection, label: 'Bắt buộc chọn lô hàng' },
  { value: PickupStrategy.AutoWithFIFO, label: 'Tự động chọn lô theo FIFO' },
  { value: PickupStrategy.AutoWithExpiryDate, label: 'Tự động chọn lô theo HSD gần nhất' },
]
pickupStrategyPrescriptionOptions.forEach((i) => {
  if (i.value === roomSettingObj.value.prescription.pickupStrategy) {
    i.label = '(Hệ thống) - ' + i.label
  }
})

const closeModal = () => {
  showModal.value = false
}

const clearWarehouseIdList = () => {
  if (roomSettingObj.value.consumable.warehouseIdList.length === 0) {
    roomSettingObj.value.consumable.warehouseIdList = [0]
  }
  if (roomSettingObj.value.consumable.warehouseIdList.includes(0)) {
    roomSettingObj.value.consumable.warehouseIdList = [0]
  }
  if (roomSettingObj.value.prescription.warehouseIdList.length === 0) {
    roomSettingObj.value.prescription.warehouseIdList = [0]
  }
  if (roomSettingObj.value.prescription.warehouseIdList.includes(0)) {
    roomSettingObj.value.prescription.warehouseIdList = [0]
  }
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    clearWarehouseIdList()
    const roomSetting = JSON.stringify(roomSettingObj.value)
    await ticketClinicDetailStore.updateRoomSetting(roomSetting)
    AlertStore.addSuccess('Cập nhật cài đặt thành công', 1000)
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
  <VueModal v-model:show="showModal" style="margin-top: 50px">
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
            <VueTabMenu :tabKey="TABS_KEY.GENERAL">Cài đặt chung</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.DIAGNOSIS">Khám & Chẩn đoán</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.PROCEDURE">Dịch vụ</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.CONSUMABLE">Vật tư</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.PRESCRIPTION">Đơn thuốc</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.LABORATORY">Xét nghiệm</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.RADIOLOGY">CĐHA</VueTabMenu>
          </template>
          <template #panel>
            <VueTabPanel :tabKey="TABS_KEY.GENERAL">
              <div class="mt-4 pb-20 table-wrapper">
                <table class="">
                  <thead>
                    <tr>
                      <th colspan="2">Cài đặt chung</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox
                          v-model:value="roomSettingObj.general.showMoneyTitle"
                          type-parser="number"
                          label="Hiển thị thông tin tiền trên tiêu đề"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox
                          v-model:value="roomSettingObj.general.showMenuConsumable"
                          type-parser="number"
                          label="Hiển thị menu vật tư"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox
                          v-model:value="roomSettingObj.general.showMenuLaboratory"
                          type-parser="number"
                          label="Hiển thị menu xét nghiệm"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox
                          v-model:value="roomSettingObj.general.showMenuRadiology"
                          type-parser="number"
                          label="Hiển thị menu CĐHA"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox
                          v-model:value="roomSettingObj.general.showMenuUser"
                          type-parser="number"
                          label="Hiển thị menu nhân viên"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.DIAGNOSIS">
              <div class="mt-4 pb-20 table-wrapper">
                <table class="">
                  <thead>
                    <tr>
                      <th colspan="2">Cài đặt thông tin khám & chẩn đoán</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox
                          v-model:value="roomSettingObj.diagnosis.icd10"
                          type-parser="number"
                          label="Hiển thị điền gợi ý chẩn đoán theo ICD10"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style="width: 30%">Danh sách tài liệu bổ sung</td>
                      <td>
                        <div>
                          <a-select
                            v-model:value="roomSettingObj.diagnosis.templateHtmlIdList"
                            mode="multiple"
                            style="width: 100%"
                            placeholder="Please select"
                            :options="templateHtmlOptions"
                          ></a-select>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.PROCEDURE">
              <div class="mt-4 pb-20 table-wrapper">
                <table class="">
                  <thead>
                    <tr>
                      <th colspan="2">Cài đặt dịch vụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colspan="2">
                        <InputCheckbox
                          v-model:value="roomSettingObj.regimen.isEffectTotalMoney"
                          type-parser="number"
                          label="Liệu trình: Tính cả những buổi chưa thực hiện vào tổng tiền"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </VueTabPanel>
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
                            v-model:value="roomSettingObj.consumable.warehouseIdList"
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
                          v-model:value="roomSettingObj.consumable.searchIncludeZeroQuantity"
                          type-parser="number"
                          label="Khi tìm kiếm: hiển thị cả những sản phẩm có số lượng = 0"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style="width: 200px">Chiến lược lấy hàng</td>
                      <td>
                        <div>
                          <InputSelect
                            v-model:value="roomSettingObj.consumable.pickupStrategy"
                            :options="pickupStrategyConsumableOptions"
                          />
                        </div>
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
                      <th colspan="2">Cài đặt thuốc</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="width: 30%">Kho tìm kiếm thuốc</td>
                      <td>
                        <div>
                          <a-select
                            v-model:value="roomSettingObj.prescription.warehouseIdList"
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
                          v-model:value="roomSettingObj.prescription.searchIncludeZeroQuantity"
                          type-parser="number"
                          label="Khi tìm kiếm: hiển thị cả những sản phẩm có số lượng = 0"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style="width: 200px">Chiến lược lấy hàng</td>
                      <td>
                        <div>
                          <InputSelect
                            v-model:value="roomSettingObj.prescription.pickupStrategy"
                            :options="pickupStrategyConsumableOptions"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.LABORATORY">
              <div class="mt-4 pb-20 table-wrapper">
                <table class="">
                  <thead>
                    <tr>
                      <th colspan="2">Cài đặt xét nghiệm</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.RADIOLOGY">
              <div class="mt-4 pb-20 table-wrapper">
                <table class="">
                  <thead>
                    <tr>
                      <th colspan="2">Cài đặt phiếu CĐHA</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
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
