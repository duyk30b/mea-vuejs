<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { VueSelect } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../../common/vue-tabs'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { SettingKey } from '../../../../modules/_me/store.variable'
import { OrganizationService } from '../../../../modules/organization'
import { PrintHtml, PrintHtmlService } from '../../../../modules/print-html'
import { TicketType } from '../../../../modules/ticket'

const TABS_KEY = {
  GENERAL: 'GENERAL',
  PRINT_SETTING: 'PRINT_SETTING',
}

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const meStore = useMeStore()

const settingDisplay = ref<typeof settingStore.TICKET_CLINIC_DETAIL>(
  JSON.parse(JSON.stringify(settingStore.TICKET_CLINIC_DETAIL))
)
const showModal = ref(false)
const saveLoading = ref(false)

const activeTab = ref(TABS_KEY.PRINT_SETTING)

const printHtmlAll = ref<PrintHtml[]>([])

let firstLoad = true

const openModal = async () => {
  showModal.value = true
  settingDisplay.value = JSON.parse(JSON.stringify(settingStore.TICKET_CLINIC_DETAIL))

  if (firstLoad) {
    const promiseInit = await Promise.all([PrintHtmlService.getAll()])
    printHtmlAll.value = promiseInit[0]
    firstLoad = false
  }
}

const closeModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
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
            <VueTabMenu :tabKey="TABS_KEY.GENERAL">Cài đặt chung</VueTabMenu>
            <VueTabMenu :tabKey="TABS_KEY.PRINT_SETTING">Cài đặt IN</VueTabMenu>
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
                      <td>Khác</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </VueTabPanel>
            <VueTabPanel :tabKey="TABS_KEY.PRINT_SETTING">
              <div class="mt-4 pb-20 table-wrapper">
                <table class="">
                  <thead>
                    <tr>
                      <th colspan="2">Cài đặt IN</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="settingStore.TICKET_CLINIC_LIST.ticketType === TicketType.Eye">
                      <td>Đo thị lực</td>
                      <td>
                        <div>
                          <VueSelect
                            v-model:value="settingDisplay.printHtmlIdSetting.diagnosisEyeSpecial"
                            :options="[
                              { value: 0, text: 'Mặc định' },
                              ...printHtmlAll.map((group) => ({
                                value: group.id,
                                text: group.name,
                              })),
                            ]" />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Đơn thuốc</td>
                      <td>
                        <div>
                          <VueSelect
                            v-model:value="settingDisplay.printHtmlIdSetting.prescription"
                            :options="[
                              { value: 0, text: 'Mặc định' },
                              ...printHtmlAll.map((group) => ({
                                value: group.id,
                                text: group.name,
                              })),
                            ]" />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Hóa đơn</td>
                      <td>
                        <div>
                          <VueSelect
                            v-model:value="settingDisplay.printHtmlIdSetting.invoice"
                            :options="[
                              { value: 0, text: 'Mặc định' },
                              ...printHtmlAll.map((group) => ({
                                value: group.id,
                                text: group.name,
                              })),
                            ]" />
                        </div>
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
          <VueButton icon="close" class="ml-auto" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton icon="save" color="blue" :loading="saveLoading" @click="handleSave">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
