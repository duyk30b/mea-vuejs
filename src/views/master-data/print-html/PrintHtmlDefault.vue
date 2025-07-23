<script setup lang="ts">
import { CONFIG } from '@/config'
import { ESArray, ESTypescript } from '@/utils'
import { onBeforeMount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

const TABS_KEY = {
  SETTING_COMMON: 'SETTING_COMMON',
  LIST: 'LIST',
}

const router = useRouter()
const route = useRoute()

const { organization } = MeService

onMounted(() => {})

const activeTab = ref<any>(route.query.tab || TABS_KEY.LIST)

const pintHtmlDefaultList = ref(
  ESTypescript.valuesEnum(PrintHtmlType).map((value) => ({
    printHtmlType: value,
    text: PrintHtmlTypeText[value],
    printHtmlId: 0,
    options: <{ value: number; text: string; data: PrintHtml }[]>[],
  })),
)

const fetchData = async () => {
  const printHtmlAll = await PrintHtmlService.list({})

  const printHtmlDefault = printHtmlAll.filter((i) => {
    return i.isDefault && i.oid === organization.value.id
  })

  const printHtmlDefaultMap = ESArray.arrayToKeyValue(printHtmlDefault, 'printHtmlType')

  const printHtmlArrayMap = ESArray.arrayToKeyArray(printHtmlAll, 'printHtmlType')

  pintHtmlDefaultList.value.forEach((i) => {
    i.printHtmlId = printHtmlDefaultMap[i.printHtmlType]?.id || 0
    i.options = [
      { value: 0, text: ' -- Mặc định -- ', data: PrintHtml.blank() },
      ...(printHtmlArrayMap[i.printHtmlType] || []).map((i) => ({
        value: i.id,
        text: i.name,
        data: i,
      })),
      ...(printHtmlArrayMap[0] || []).map((i) => ({
        value: i.id,
        text: i.name,
        data: i,
      })),
    ]
  })
}

onBeforeMount(async () => {
  await fetchData()
})

const handleSaveSetting = async () => {
  try {
    const listDefault = pintHtmlDefaultList.value.map((i) => {
      return { printHtmlId: i.printHtmlId, printHtmlType: i.printHtmlType }
    })
    await PrintHtmlService.saveListDefault({ listDefault })
    AlertStore.addSuccess('Cập nhật cài đặt thành công')
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
            <th v-if="CONFIG.MODE === 'development'">Type</th>
            <th>Loại</th>
            <th style="min-width: 300px">Mẫu In</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in pintHtmlDefaultList" :key="item.printHtmlType">
            <td v-if="CONFIG.MODE === 'development'" class="text-center" style="color: violet">
              {{ item.printHtmlType }}
            </td>
            <td>
              <div class="flex gap-2">
                <span>{{ item.text }}</span>
                <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                  - {{ item.printHtmlId }}
                </span>
              </div>
            </td>
            <td>
              <VueSelect
                v-model:value="pintHtmlDefaultList[index].printHtmlId"
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
