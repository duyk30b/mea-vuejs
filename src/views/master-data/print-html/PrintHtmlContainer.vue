<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { AlertStore } from '../../../common/vue-alert'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../common/vue-tabs'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { SettingKey } from '../../../modules/_me/store.variable'
import { OrganizationService } from '../../../modules/organization'
import Breadcrumb from '../../component/Breadcrumb.vue'
import PrintHtmlList from './PrintHtmlList.vue'
import { VueSelect } from '../../../common/vue-form'
import { PrintHtml, PrintHtmlService } from '../../../modules/print-html'
import { VueButton } from '../../../common'

const TABS_KEY = {
  PRINT_HTML_SELECT: 'PRINT_HTML_SELECT',
  PRINT_HTML_LIST: 'PRINT_HTML_LIST',
}

const activeTab = ref(TABS_KEY.PRINT_HTML_SELECT)

const store = useSettingStore()

const settingDisplay = ref<typeof store.PRINT_SETTING>(
  JSON.parse(JSON.stringify(store.PRINT_SETTING)),
)

const printHtmlOptions = ref<{ value: number; text: string; data: PrintHtml }[]>([])

const fetchData = async () => {
  const printHtmlAll = await PrintHtmlService.list({ sort: { id: 'DESC' } })
  printHtmlOptions.value = [
    { value: 0, text: ' -- Mặc định -- ', data: PrintHtml.blank() },
    ...printHtmlAll.map((i) => ({ value: i.id, text: i.name, data: i })),
  ]
}

onBeforeMount(async () => {
  settingDisplay.value = JSON.parse(JSON.stringify(store.PRINT_SETTING))
  await fetchData()
})

const handleSaveSetting = async () => {
  try {
    const settingData = JSON.stringify(settingDisplay.value)
    await OrganizationService.saveSettings(SettingKey.PRINT_SETTING, settingData)
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    store.PRINT_SETTING = JSON.parse(settingData)
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:42 ~ handleSave ~ error:', error)
  }
}
</script>

<template>
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div class="ml-auto flex items-center gap-8"></div>
  </div>

  <div class="mt-4 md:mx-4 p-4 bg-white">
    <VueTabs v-model:tabShow="activeTab">
      <template #menu>
        <VueTabMenu :tabKey="TABS_KEY.PRINT_HTML_SELECT">Cài đặt chung</VueTabMenu>
        <VueTabMenu :tabKey="TABS_KEY.PRINT_HTML_LIST">Danh sách mẫu in</VueTabMenu>
      </template>
      <template #panel>
        <VueTabPanel :tabKey="TABS_KEY.PRINT_HTML_SELECT">
          <div class="mt-4">
            <table>
              <tbody>
                <tr>
                  <td>_LAYOUT_HEADER</td>
                  <td style="min-width: 500px">
                    <VueSelect
                      v-model:value="settingDisplay._LAYOUT_HEADER.printHtmlId"
                      :options="printHtmlOptions"
                    />
                  </td>
                </tr>
                <tr>
                  <td>Mẫu in hóa đơn</td>
                  <td style="min-width: 500px">
                    <VueSelect
                      v-model:value="settingDisplay.invoice.printHtmlId"
                      :options="printHtmlOptions"
                    />
                  </td>
                </tr>
                <tr>
                  <td>Mẫu in đơn thuốc</td>
                  <td style="min-width: 500px">
                    <VueSelect
                      v-model:value="settingDisplay.prescription.printHtmlId"
                      :options="printHtmlOptions"
                    />
                  </td>
                </tr>
                <tr>
                  <td>Mẫu in phiếu đo thị lực</td>
                  <td style="min-width: 500px">
                    <VueSelect
                      v-model:value="settingDisplay.optometry.printHtmlId"
                      :options="printHtmlOptions"
                    />
                  </td>
                </tr>
                <tr>
                  <td>Mẫu in Xét nghiệm mặc định</td>
                  <td style="min-width: 500px">
                    <VueSelect
                      v-model:value="settingDisplay.laboratory.printHtmlId"
                      :options="printHtmlOptions"
                    />
                  </td>
                </tr>
                <tr>
                  <td>Mẫu in CĐHA mặc định</td>
                  <td style="min-width: 500px">
                    <VueSelect
                      v-model:value="settingDisplay.radiology.printHtmlId"
                      :options="printHtmlOptions"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-4">
            <VueButton color="blue" @click="handleSaveSetting()">Lưu lại</VueButton>
          </div>
        </VueTabPanel>
        <VueTabPanel :tabKey="TABS_KEY.PRINT_HTML_LIST">
          <PrintHtmlList />
        </VueTabPanel>
      </template>
    </VueTabs>
  </div>
</template>

<style lang="scss" scoped>
table {
  td {
    padding: 12px;
  }
}
</style>
