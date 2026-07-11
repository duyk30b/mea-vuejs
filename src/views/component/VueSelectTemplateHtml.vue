<script setup lang="ts">
import { VueSelect } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { TemplateHtml, TemplateHtmlService, TemplateHtmlType } from '@/modules/template-html'
import { onMounted, ref, watch } from 'vue'

const emit = defineEmits<{
  (e: 'update:templateHtmlId', value: number): void
  (e: 'selectTemplateHtml', value: TemplateHtml): void
}>()

const props = withDefaults(
  defineProps<{
    templateHtmlId: number
    templateHtmlType: TemplateHtmlType
    disabled?: boolean
    required?: boolean
    label?: string
    removeLabelWrapper?: boolean
  }>(),
  {
    templateHtmlId: 0,
    templateHtmlType: 0 as any,
    disabled: false,
    required: false,
    label: 'Chọn mẫu in',
    removeLabelWrapper: false,
  },
)

const templateHtml = ref(TemplateHtml.blank())
const templateHtmlOptions = ref<{ value: number; text: string; data?: TemplateHtml }[]>([])

watch(
  () => props.templateHtmlId,
  async (newValue) => {
    if (newValue && newValue != templateHtml.value.id) {
      const templateHtmlData = await TemplateHtmlService.detail(newValue)
      if (templateHtmlData) {
        setTemplateHtmlFromParent(templateHtmlData)
      }
    }
  },
  { immediate: true },
)

onMounted(async () => {
  const templateHtmlList = await TemplateHtmlService.list({
    filter: { templateHtmlType: props.templateHtmlType ? props.templateHtmlType : undefined },
    sort: { priority: 'ASC' },
  })

  templateHtmlOptions.value = [
    { text: 'Mặc định', value: 0, data: TemplateHtml.blank() },
    ...templateHtmlList.map((i) => {
      return { value: i.id, text: i.name, data: i }
    }),
  ]
})

const setTemplateHtmlFromChild = async (templateHtmlData: TemplateHtml) => {
  templateHtml.value = TemplateHtml.from(templateHtmlData)
  emit('update:templateHtmlId', templateHtmlData.id)
  emit('selectTemplateHtml', templateHtmlData)
}

const setTemplateHtmlFromParent = async (templateHtmlData: TemplateHtml) => {
  templateHtml.value = TemplateHtml.from(templateHtmlData)
  emit('selectTemplateHtml', templateHtmlData)
}
</script>

<template>
  <div v-if="!removeLabelWrapper" class="flex flex-wrap gap-1">
    <span>{{ label }}</span>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">({{ templateHtml.id }})</span>
  </div>
  <div>
    <VueSelect
      v-model:value="templateHtml.id"
      :options="templateHtmlOptions"
      :required="required"
      @selectItem="({ data }) => setTemplateHtmlFromChild(data)"
    />
  </div>
</template>

<style lang="scss" scoped></style>
