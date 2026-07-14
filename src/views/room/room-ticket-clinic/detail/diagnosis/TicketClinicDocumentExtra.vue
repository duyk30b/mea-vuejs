<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { MeService } from '@/modules/_me/me.service'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ticketRoomRef } from '@/modules/room'
import { TemplateHtml, TemplateHtmlAction } from '@/modules/template-html'
import { TicketChangeAttributeApi } from '@/modules/ticket'
import { type TicketAttributeKeyType } from '@/modules/ticket-attribute'
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(defineProps<{ templateHtml: TemplateHtml }>(), {
  templateHtml: () => TemplateHtml.blank(),
})

const { userPermission, organization, user } = MeService

let templateHtmlIdCurrent = 0

let ticketAttributeKeyList: string[] = []
const ticketAttributeOriginMap: Record<string, any> = {}
const ticketAttributeMap: Record<string, any> = {}

const hasChangeAttribute = ref(false)
const saveLoading = ref(false)

watch(
  () => props.templateHtml,
  (newValue) => {
    if (!newValue.id) return
    templateHtmlIdCurrent = newValue.id

    const matchFieldAll = newValue.htmlInput.matchAll(/data-field="([^"]*)"/g)
    ticketAttributeKeyList = Array.from(matchFieldAll, (match) => match[1])

    ticketAttributeKeyList.forEach((key) => {
      const k = key as unknown as TicketAttributeKeyType
      const v = ticketRoomRef.value.ticketAttributeMap[k] || ''
      ticketAttributeOriginMap[k] = v
      ticketAttributeMap[k] = v
    })

    nextTick(() => {
      eval(newValue?.jsInput || '')
      ticketAttributeKeyList.forEach((key) => {
        const inputElement: HTMLInputElement | null = document.querySelector(
          `input[data-field="${key}"]`,
        )
        if (!inputElement) return
        inputElement.value = ticketAttributeMap[key] || ''
        inputElement.addEventListener('input', (e) => {
          const target = e.target as HTMLInputElement
          ticketAttributeMap[key] = target.value
          checkHasChangeAttribute()
        })
      })
    })
  },
  { immediate: true },
)

watch(
  () => ticketRoomRef.value.ticketAttributeList,
  (newValue, oldValue) => {
    if (!newValue) return

    newValue.forEach((i) => {
      const k = i.key
      if (!ticketAttributeKeyList.includes(k)) return
      if (ticketAttributeOriginMap[k] === i.value) return
      ticketAttributeOriginMap[k] = i.value
      ticketAttributeMap[k] = i.value

      const inputElement: HTMLInputElement | null = document.querySelector(
        `input[data-field="${k}"]`,
      )
      if (inputElement) {
        inputElement.value = i.value
      }
    })
    checkHasChangeAttribute()
  },
  { deep: true },
)

const checkHasChangeAttribute = () => {
  let hasChange = false
  for (const key of ticketAttributeKeyList) {
    if (ticketAttributeOriginMap[key] !== ticketAttributeMap[key]) {
      hasChange = true
      break
    }
  }
  hasChangeAttribute.value = hasChange
}

const saveDocumentExtra = async () => {
  try {
    saveLoading.value = true

    await TicketChangeAttributeApi.updateTicketAttributeList({
      ticketId: ticketRoomRef.value.id,
      ticketAttributeList: ticketAttributeKeyList.map((key) => ({
        key,
        value: ticketAttributeMap[key] || '',
      })),
    })
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicDocumentExtra.vue:115 ~:', error)
  } finally {
    saveLoading.value = false
  }
}

const startPrintTicketClinicDocumentExtra = async () => {
  await TemplateHtmlAction.startPrintTicketClinicDocumentExtra({
    ticket: ticketRoomRef.value,
    customer: ticketRoomRef.value.customer!,
    templateHtmlId: templateHtmlIdCurrent,
  })
}
</script>
<template>
  <div class="mt-2">
    <div v-html="templateHtml.htmlInput"></div>
    <div class="mt-4 flex justify-between gap-4">
      <div>
        <VueButton
          v-if="templateHtml.htmlPrint"
          color="blue"
          icon="print"
          @click="startPrintTicketClinicDocumentExtra"
        >
          In phiếu {{ templateHtml.name }}
        </VueButton>
      </div>
      <VueButton
        v-if="ticketRoomRef.id && userPermission[PermissionId.TICKET_CHANGE_ATTRIBUTE]"
        color="blue"
        :disabled="!hasChangeAttribute"
        :loading="saveLoading"
        icon="save"
        @click="saveDocumentExtra"
      >
        Lưu lại
      </VueButton>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
