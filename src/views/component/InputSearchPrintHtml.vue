<script lang="ts" setup>
import { InputOptionsValue } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputOptionsValue.vue'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PrintHtmlService, type PrintHtml } from '@/modules/print-html'
import { ESString } from '@/utils'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'selectPrintHtml', value: PrintHtml): void
  (e: 'update:printHtmlId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    printHtmlId: number
    disabled?: boolean
    required?: boolean
  }>(),
  {
    printHtmlId: 0,
    disabled: false,
    required: false,
  },
)

const inputOptionsPrintHtml = ref<InstanceType<typeof InputOptionsValue>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const printHtmlOptions = ref<{ value: number; text: string; data: PrintHtml }[]>([])

onMounted(async () => {
  const printHtmlAll = await PrintHtmlService.list({ sort: { priority: 'ASC' } })
  printHtmlOptions.value = printHtmlAll.map((i) => ({ value: i.id, text: i.name, data: i }))
})

const handleUpdateValue = (v: any) => {
  emit('update:printHtmlId', v)
}

const handleSelectItem = (item?: ItemOption) => {
  emit('selectPrintHtml', item?.data)
}

const logicFilter = (item: ItemOption, text: string) => {
  const printHtml = item.data as PrintHtml
  return ESString.customFilter(printHtml.name, text)
}
</script>
<template>
  <div class="flex gap-1 flex-wrap">
    <span>Chọn mẫu in</span>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">({{ printHtmlId }})</span>
  </div>

  <div>
    <InputOptionsValue
      ref="inputOptionsPrintHtml"
      :value="printHtmlId"
      :disabled="disabled"
      :maxHeight="320"
      :options="printHtmlOptions"
      placeholder="Tìm kiếm tên của mẫu in"
      :required="required"
      @update:value="(v) => handleUpdateValue(v)"
      @selectItem="(item) => handleSelectItem(item)"
      :logicFilter="logicFilter"
    >
      <template #option="{ item: { data } }">
        <div>
          <b>{{ data.name }}</b>
        </div>
      </template>
    </InputOptionsValue>
  </div>
</template>

<style lang="scss" scoped></style>
