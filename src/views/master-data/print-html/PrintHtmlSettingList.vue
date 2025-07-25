<script setup lang="ts">
import type { VueSelectOption } from '@/common/vue-form/VueSelect.vue'
import { CONFIG } from '@/config'
import { PrintHtmlSetting, PrintHtmlSettingService } from '@/modules/print-html-setting'
import { ESArray, ESTypescript } from '@/utils'
import { onBeforeMount, ref } from 'vue'
import { VueButton } from '../../../common'
import { AlertStore } from '../../../common/vue-alert'
import { VueSelect } from '../../../common/vue-form'
import {
  PrintHtml,
  PrintHtmlService,
  PrintHtmlType,
  PrintHtmlTypeText,
} from '../../../modules/print-html'
import { MeService } from '@/modules/_me/me.service'

const { organization } = MeService

const settingList = ref<
  {
    type: PrintHtmlType
    printHtmlSetting: PrintHtmlSetting
    options: VueSelectOption<PrintHtml>[]
  }[]
>([])

const fetchData = async (options: { refetch: boolean }) => {
  const listSettingType = await PrintHtmlSettingService.list(
    { filter: { oid: organization.value.id } },
    { refetch: !!options?.refetch },
  )
  const mapSettingType = ESArray.arrayToKeyValue(listSettingType, 'printHtmlType')

  const phsSystemList = await PrintHtmlSettingService.list({ filter: { oid: 1 } })
  const phsSystemMapType = ESArray.arrayToKeyValue(phsSystemList, 'printHtmlType')

  const printHtmlAll = await PrintHtmlService.list({ sort: { priority: 'ASC' } })
  const printHtmlMapArrayType = ESArray.arrayToKeyArray(printHtmlAll, 'printHtmlType')

  settingList.value = ESTypescript.valuesEnum(PrintHtmlType).map((type) => {
    const printHtmlOptionsDefault = PrintHtml.blank()
    printHtmlOptionsDefault.name = '--'

    return {
      type,
      printHtmlSetting: mapSettingType[type] || PrintHtmlSetting.blank(),
      options: [printHtmlOptionsDefault, ...(printHtmlMapArrayType[type] || [])].map((i) => {
        let name = i.name
        if (phsSystemMapType[type]?.printHtmlId === i.id && i.id != 0) {
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
        id: i.printHtmlSetting.id,
        printHtmlId: i.printHtmlSetting.printHtmlId,
        printHtmlType: i.type,
      }
    })
    await PrintHtmlSettingService.replaceAll({ replaceAll })
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
    await fetchData({ refetch: true })
  } catch (error) {
    console.log('🚀 ~ file: ModalProductUpsert.vue:42 ~ handleSave ~ error:', error)
  }
}
</script>

<template>
  <div class="mt-4">
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'">ID-PrintHtmlId</th>
            <th>Loại</th>
            <th style="min-width: 300px">Mẫu In</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in settingList" :key="index">
            <td v-if="CONFIG.MODE === 'development'" class="text-center" style="color: violet">
              {{ item.printHtmlSetting.id }} - {{ item.printHtmlSetting.printHtmlId }}
            </td>
            <td>
              <div class="flex gap-2">
                <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                  {{ item.type }} -
                </span>
                <span>{{ PrintHtmlTypeText[item.type] }}</span>
              </div>
            </td>
            <td>
              <VueSelect
                v-model:value="item.printHtmlSetting.printHtmlId"
                :options="item.options"
              />
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
