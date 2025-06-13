<script setup lang="ts">
import { VueSelect } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { PrintHtml, PrintHtmlService } from '@/modules/print-html'
import { onMounted, ref, watch } from 'vue'

const emit = defineEmits<{
  (e: 'update:printHtmlId', value: number): void
  (e: 'selectPrintHtml', value: PrintHtml): void
}>()

const props = withDefaults(
  defineProps<{
    printHtmlId: number
    disabled?: boolean
    required?: boolean
    label?: string
    removeLabelWrapper?: boolean
  }>(),
  {
    printHtmlId: 0,
    disabled: false,
    required: false,
    label: 'Chọn mẫu in',
    removeLabelWrapper: false,
  },
)

const printHtml = ref(PrintHtml.blank())
const printHtmlOptions = ref<{ value: number; text: string; data?: PrintHtml }[]>([])

watch(
  () => props.printHtmlId,
  async (newValue) => {
    if (newValue && newValue != printHtml.value.id) {
      const printHtmlData = await PrintHtmlService.detail(newValue)
      if (printHtmlData) {
        setPrintHtmlFromParent(printHtmlData)
      }
    }
  },
  { immediate: true },
)

onMounted(async () => {
  const printHtmlAll = await PrintHtmlService.list({ sort: { priority: 'ASC' } })

  printHtmlOptions.value = [
    { text: 'Mặc định', value: 0, data: PrintHtml.blank() },
    ...printHtmlAll.map((i) => {
      return { value: i.id, text: i.name, data: i }
    }),
  ]
})

const setPrintHtmlFromChild = async (printHtmlData: PrintHtml) => {
  printHtml.value = PrintHtml.from(printHtmlData)
  emit('update:printHtmlId', printHtmlData.id)
  emit('selectPrintHtml', printHtmlData)
}

const setPrintHtmlFromParent = async (printHtmlData: PrintHtml) => {
  printHtml.value = PrintHtml.from(printHtmlData)
  emit('selectPrintHtml', printHtmlData)
}
</script>

<template>
  <div v-if="!removeLabelWrapper" class="flex flex-wrap gap-1">
    <span>{{ label }}</span>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">({{ printHtml.id }})</span>
  </div>
  <div>
    <VueSelect
      v-model:value="printHtml.id"
      :options="printHtmlOptions"
      :required="required"
      @selectItem="({ data }) => setPrintHtmlFromChild(data)"
    />
  </div>
</template>

<style lang="scss" scoped></style>
