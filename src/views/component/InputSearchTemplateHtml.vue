<script lang="ts" setup>
import { InputOptionsValue } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputOptionsValue.vue'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { TemplateHtmlService, type TemplateHtml } from '@/modules/template-html'
import { ESString } from '@/utils'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'selectTemplateHtml', value: TemplateHtml): void
  (e: 'update:templateHtmlId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    templateHtmlId: number
    disabled?: boolean
    required?: boolean
  }>(),
  {
    templateHtmlId: 0,
    disabled: false,
    required: false,
  },
)

const inputOptionsTemplateHtml = ref<InstanceType<typeof InputOptionsValue>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const templateHtmlOptions = ref<{ value: number; text: string; data: TemplateHtml }[]>([])

onMounted(async () => {
  const templateHtmlAll = await TemplateHtmlService.list({ sort: { priority: 'ASC' } })
  templateHtmlOptions.value = templateHtmlAll.map((i) => ({ value: i.id, text: i.name, data: i }))
})

const handleUpdateValue = (v: any) => {
  emit('update:templateHtmlId', v)
}

const handleSelectItem = (item?: ItemOption) => {
  emit('selectTemplateHtml', item?.data)
}

const logicFilter = (item: ItemOption, text: string) => {
  const templateHtml = item.data as TemplateHtml
  return ESString.customFilter(templateHtml.name, text)
}
</script>
<template>
  <div class="flex gap-1 flex-wrap">
    <span>Chọn mẫu in</span>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">({{ templateHtmlId }})</span>
  </div>

  <div>
    <InputOptionsValue
      ref="inputOptionsTemplateHtml"
      :value="templateHtmlId"
      :disabled="disabled"
      :maxHeight="320"
      :options="templateHtmlOptions"
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
