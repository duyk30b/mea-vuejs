<script setup lang="ts">
import { VueButton } from '@/common'
import { IconBug } from '@/common/icon-antd'
import { VueTooltip } from '@/common/popover'
import { AlertStore } from '@/common/vue-alert'
import { VueSelect } from '@/common/vue-form'
import type { VueSelectOption } from '@/common/vue-form/VueSelect.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { PrintSetting, PrintSettingService } from '@/modules/print-setting'
import {
  TemplateHtml,
  TemplateHtmlService,
  TemplateHtmlType,
  TemplateHtmlTypeText,
} from '@/modules/template-html'
import { ESArray, ESTypescript } from '@/utils'
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import { onBeforeMount, ref } from 'vue'

const { organization } = MeService

const settingList = ref<
  {
    type: TemplateHtmlType
    printSetting: PrintSetting
    options: VueSelectOption<TemplateHtml>[]
  }[]
>([])

const fetchData = async (options: { refetch: boolean }) => {
  const listSettingType = await PrintSettingService.list(
    { filter: { oid: organization.value.id } },
    { refetch: !!options?.refetch },
  )
  const mapSettingType = ESArray.arrayToKeyValue(listSettingType, 'templateHtmlType')

  const phsSystemList = await PrintSettingService.list({ filter: { oid: 1 } })
  const phsSystemMapType = ESArray.arrayToKeyValue(phsSystemList, 'templateHtmlType')

  const templateHtmlAll = await TemplateHtmlService.list({ sort: { priority: 'ASC' } })
  const templateHtmlMapArrayType = ESArray.arrayToKeyArray(templateHtmlAll, 'templateHtmlType')

  settingList.value = ESTypescript.valuesEnum(TemplateHtmlType).map((type) => {
    const templateHtmlOptionsDefault = TemplateHtml.blank()
    templateHtmlOptionsDefault.name = '--'

    return {
      type,
      printSetting: mapSettingType[type] || PrintSetting.blank(),
      options: [templateHtmlOptionsDefault, ...(templateHtmlMapArrayType[type] || [])].map((i) => {
        let name = i.name
        if (phsSystemMapType[type]?.templateHtmlId === i.id && i.id != 0) {
          name = '-- Mặc định -- ' + name
        }
        return {
          value: i.id,
          text: name,
          data: i,
        }
      }),
    }
  })
}

onBeforeMount(async () => {
  await fetchData({ refetch: true })
})

const handleSaveSetting = async () => {
  try {
    const replaceAll = settingList.value.map((i) => {
      return {
        id: i.printSetting.id,
        templateHtmlId: i.printSetting.templateHtmlId,
        templateHtmlType: i.type,
      }
    })
    await PrintSettingService.replaceAll({ replaceAll })
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    await fetchData({ refetch: true })
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
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>Loại</th>
            <th style="min-width: 300px">Mẫu In</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in settingList" :key="index">
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                <template #trigger>
                  <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
                </template>
                <pre>{{ JSON.stringify(item, null, 4) }}</pre>
              </VueTooltip>
            </td>
            <td>{{ TemplateHtmlTypeText[item.type] }}</td>
            <td>
              <VueSelect v-model:value="item.printSetting.templateHtmlId" :options="item.options" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-center">
      <VueButton color="blue" @click="handleSaveSetting()">Lưu lại</VueButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
table {
  td {
    padding: 12px;
  }
}
</style>
