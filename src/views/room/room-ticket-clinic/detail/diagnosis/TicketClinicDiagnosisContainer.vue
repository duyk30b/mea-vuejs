<script lang="ts" setup>
import { TemplateHtml, TemplateHtmlService } from '@/modules/template-html'
import { useTicketClinicDetailStore } from '@/store/ticket-clinic-detail.store'
import { onBeforeMount, ref } from 'vue'
import TicketClinicDiagnosisBasic from './TicketClinicDiagnosisBasic.vue'
import TicketClinicDocumentExtra from './TicketClinicDocumentExtra.vue'

const ticketClinicDetailStore = useTicketClinicDetailStore()

const templateHtmlChooseList = ref<TemplateHtml[]>([])
const templateHtmlCurrent = ref<TemplateHtml | null>(null)

const selectTemplateHtml = (templateHtml: TemplateHtml | null) => {
  templateHtmlCurrent.value = templateHtml ? TemplateHtml.from(templateHtml) : null
}

onBeforeMount(async () => {
  const templateHtmlMap = await TemplateHtmlService.getMap()
  const templateHtmlIdList =
    ticketClinicDetailStore.roomRef?.roomSettingObj?.diagnosis?.templateHtmlIdList || []
  templateHtmlChooseList.value = templateHtmlIdList
    .map((i) => templateHtmlMap[i] || TemplateHtml.blank())
    .filter((i) => !!i.id)
})
</script>
<template>
  <div class="mt-2 flex gap-2 flex-wrap">
    <a
      class="diagnosis_menu"
      :class="!templateHtmlCurrent ? 'active' : ''"
      @click="() => selectTemplateHtml(null)"
    >
      Cơ bản
    </a>
    <a
      class="diagnosis_menu"
      :class="templateHtmlCurrent?.id === templateHtml.id ? 'active' : ''"
      v-for="templateHtml in templateHtmlChooseList"
      :key="templateHtml.id"
      @click="() => selectTemplateHtml(templateHtml)"
    >
      {{ templateHtml.name }}
    </a>
  </div>

  <div v-if="!templateHtmlCurrent">
    <TicketClinicDiagnosisBasic />
  </div>
  <div v-else class="mt-2">
    <TicketClinicDocumentExtra :templateHtml="templateHtmlCurrent" />
  </div>
</template>

<style scoped lang="scss">
.diagnosis_menu {
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #f0f0f0;
  }
  &.active {
    background-color: #1890ff;
    color: white;
  }
}
</style>
