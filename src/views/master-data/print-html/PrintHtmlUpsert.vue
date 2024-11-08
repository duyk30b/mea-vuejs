<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { InputOptions, VueSelect } from '../../../common/vue-form'
import {
  PrintHtml,
  PrintHtmlApi,
  PrintHtmlType,
  PrintHtmlService,
} from '../../../modules/print-html'
import { Radiology, RadiologyService } from '../../../modules/radiology'
import { customFilter } from '../../../utils'
import { IconPrint } from '../../../common/icon'

const emit = defineEmits<{
  (e: 'success', value: PrintHtml, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const route = useRoute()
const router = useRouter()

const printHtml = ref(PrintHtml.blank())
const saveLoading = ref(false)
const radiologyOptions = ref<{ value: number; text: string; data: Radiology }[]>([])
let radiologyAll: Radiology[] = []

onBeforeMount(async () => {
  const printHtmlId = Number(route.params.id)
  if (printHtmlId) {
    printHtml.value = await PrintHtmlApi.detail(printHtmlId)
  } else {
    printHtml.value = PrintHtml.blank()
  }
  radiologyAll = await RadiologyService.getAll()
  radiologyOptions.value = radiologyAll.map((i) => ({ value: i.id, text: i.name, data: i }))
})

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!printHtml.value.id) {
      const response = await PrintHtmlService.createOne(printHtml.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await PrintHtmlService.updateOne(printHtml.value.id, printHtml.value.content)
      emit('success', response, 'UPDATE')
    }
    router.push({ name: 'PrintHtmlList' })
  } catch (error) {
    console.log('🚀 ~ file: PrintHtmlUpsert.vue:46 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const searchingRadiology = async (text: string) => {
  radiologyOptions.value = radiologyAll
    .filter((i) => customFilter(i.name, text))
    .map((i) => ({ value: i.id, text: i.name, data: i }))
}
</script>

<template>
  <div class="page-header">
    <div class="page-header-content">
      <IconPrint />
      Thông tin mẫu in
    </div>
  </div>

  <form class="md:mx-4 mt-4 p-4 bg-white" @submit.prevent="handleSave">
    <div class="">
      <div>Loại</div>
      <div>
        <VueSelect
          v-model:value="printHtml.key"
          :options="
            Object.entries(PrintHtmlType).map(([key, text]) => ({ text, value: key }))
          "></VueSelect>
      </div>
    </div>

    <div v-if="printHtml.key === PrintHtmlType.RADIOLOGY" class="mt-4">
      <div>Phiếu CĐHA</div>
      <div>
        <InputOptions
          v-model:value="printHtml.radiologyId"
          :options="radiologyOptions"
          :maxHeight="320"
          placeholder="Tìm kiếm tên dịch vụ"
          @update:text="searchingRadiology"></InputOptions>
      </div>
    </div>

    <div class="mt-4">
      <div>Data</div>
      <div>
        <textarea v-model="printHtml.content"></textarea>
      </div>
    </div>

    <div class="mt-4 flex justify-between">
      <div></div>
      <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">Lưu lại</VueButton>
    </div>
  </form>
</template>

<style lang="scss" scoped>
textarea {
  width: 100%;
  min-height: 400px;
  padding: 6px;
  outline: none;
  border: 1px solid #d9d9d9;

  &:focus {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px #1890ff33;
  }
}
</style>
