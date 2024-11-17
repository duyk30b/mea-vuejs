<script setup lang="ts">
import { computed, nextTick, onBeforeMount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../../common/VueButton.vue'
import { IconPrint } from '../../../../common/icon'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputMoney, InputText, VueSelect } from '../../../../common/vue-form'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../../common/vue-tabs'
import WysiwygEditor from '../../../../common/wysiwyg-editor/WysiwygEditor.vue'
import { useMeStore } from '../../../../modules/_me/me.store'
import { Customer } from '../../../../modules/customer'
import {
  PrintHtml,
  printHtmlCompiledTemplate,
  PrintHtmlIdDefault,
  PrintHtmlService,
  ticketClinicPrintTicketRadiologyDefault,
} from '../../../../modules/print-html'
import { Radiology, RadiologyApi, RadiologyService } from '../../../../modules/radiology'
import { RadiologyGroup, RadiologyGroupService } from '../../../../modules/radiology-group'
import { Ticket } from '../../../../modules/ticket'
import { TicketDiagnosis } from '../../../../modules/ticket-diagnosis'
import ModalSelectRadiologyExample from './ModalSelectRadiologyExample.vue'

const TABS_KEY = {
  BASIC: 'BASIC',
  PRINT_SETTING: 'PRINT_SETTING',
}

const modalSelectRadiologyExample = ref<InstanceType<typeof ModalSelectRadiologyExample>>()

const route = useRoute()
const router = useRouter()

const radiologyRoot = ref(Radiology.blank())
const radiology = ref(Radiology.blank())
const saveLoading = ref(false)
const radiologyGroupAll = ref<RadiologyGroup[]>([])
const printHtmlOptions = ref<{ text: string; value: number }[]>([])

const activeTab = ref(TABS_KEY.BASIC)
const iframe = ref<HTMLIFrameElement>()

onBeforeMount(async () => {
  const promiseInit = await Promise.all([
    RadiologyGroupService.getAll(),
    PrintHtmlService.getAll(),
    PrintHtmlService.getExampleList(),
  ])
  radiologyGroupAll.value = promiseInit[0]
  printHtmlOptions.value = [
    ...promiseInit[1],
    ...promiseInit[2].filter((i) =>
      [PrintHtmlIdDefault.ENDOSCOPY, PrintHtmlIdDefault.ULTRASOUND].includes(i.id)
    ),
  ].map((i) => {
    return { value: i.id, text: i.name }
  })
})

onMounted(async () => {
  const radiologyId = Number(route.params.id)
  if (radiologyId) {
    const radiologyResponse = await RadiologyApi.detail(radiologyId, {
      relation: { printHtml: true },
    })
    radiologyRoot.value = radiologyResponse
    radiology.value = Radiology.from(radiologyResponse)
  } else {
    radiology.value = Radiology.blank()
  }

  if (!radiology.value.printHtml) {
    radiology.value.printHtml = PrintHtml.blank()
  }
  if (!radiology.value.printHtml.content) {
    radiology.value.printHtml!.content = await ticketClinicPrintTicketRadiologyDefault()
  }

  updatePreview()
})

const disabledButtonSave = computed(() => {
  return Radiology.equal(radiology.value, radiologyRoot.value)
})

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (radiology.value.id) {
      const radiologyResponse = await RadiologyService.updateOne(
        radiology.value.id,
        radiology.value
      )
      Object.assign(radiology.value, Radiology.from(radiologyResponse))
      Object.assign(radiologyRoot.value, Radiology.from(radiologyResponse))
      AlertStore.addSuccess('Cập nhật thành công', 1000)
    } else {
      await RadiologyService.createOne(radiology.value)
      router.push({ name: 'RadiologyList' })
      AlertStore.addSuccess('Tạo mới thành công', 1000)
    }
  } catch (error) {
    console.log('🚀 ~ file: RadiologyUpsert.vue:91 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const updatePreview = async () => {
  if (!iframe.value) return
  const doc = iframe.value?.contentDocument || iframe.value?.contentWindow?.document
  if (!doc) return

  let printHtml = await PrintHtmlService.detail(radiology.value.printHtmlId)
  if (!printHtml) printHtml = PrintHtml.blank()
  if (!printHtml.content) {
    printHtml.content = await ticketClinicPrintTicketRadiologyDefault()
  }

  const ticketExample = Ticket.blank()
  ticketExample.ticketDiagnosis = TicketDiagnosis.blank()
  ticketExample.ticketDiagnosis.diagnosis = 'Viêm mũi dị ứng'
  ticketExample.startedAt = Date.now()
  ticketExample.customer = Customer.example()

  const data = JSON.parse(printHtml.dataExample || '{}')

  data.radiology = Radiology.from(radiology.value)
  data.result = radiology.value.resultDefault
  data.description = radiology.value.descriptionDefault

  const textDom = printHtmlCompiledTemplate({
    organization: useMeStore().organization,
    ticket: ticketExample,
    data,
    printHtml,
  })

  doc.open()
  doc.write(textDom)
  doc.close()
}

const handleUpdateTabShow = () => {
  nextTick(() => updatePreview())
}

const handleModalSelectRadiologyExampleSuccess = (radiologyProp: Radiology) => {
  radiology.value.descriptionDefault = radiologyProp.descriptionDefault
  radiology.value.resultDefault = radiologyProp.resultDefault
  radiology.value.printHtmlId = radiologyProp.printHtmlId
}
</script>

<template>
  <ModalSelectRadiologyExample
    ref="modalSelectRadiologyExample"
    @select="handleModalSelectRadiologyExampleSuccess" />
  <div class="page-header">
    <div class="page-header-content">
      <IconPrint />
      Thông tin phiếu {{ radiology.name }}
    </div>
  </div>

  <form class="md:mx-4 mt-4 my-8 p-4 bg-white" @submit.prevent="handleSave">
    <VueTabs v-model:tabShow="activeTab" @update:tab-show="handleUpdateTabShow">
      <template #menu>
        <VueTabMenu :tabKey="TABS_KEY.BASIC">Cơ bản</VueTabMenu>
        <VueTabMenu :tabKey="TABS_KEY.PRINT_SETTING">
          <IconPrint />
          Dữ liệu và In
        </VueTabMenu>
      </template>
      <template #panel>
        <VueTabPanel :tabKey="TABS_KEY.BASIC">
          <div class="mt-4 flex flex-wrap gap-4">
            <div style="flex-basis: 90%; flex-grow: 1">
              <div class="flex gap-4 justify-start">
                <span>Tên phiếu</span>
              </div>
              <div>
                <InputText v-model:value="radiology.name" required />
              </div>
            </div>

            <div style="flex-basis: 400px; flex-grow: 1">
              <div class="">Nhóm</div>
              <div>
                <VueSelect
                  v-model:value="radiology.radiologyGroupId"
                  :options="
                    radiologyGroupAll.map((group) => ({ value: group.id, text: group.name }))
                  " />
              </div>
            </div>

            <div style="flex-basis: 400px; flex-grow: 1">
              <div>Giá tiền</div>
              <div style="flex: 1">
                <InputMoney
                  v-model:value="radiology.price"
                  :validate="{ GTE: 0 }"
                  style="width: 100%" />
              </div>
            </div>

            <div class="" style="flex-basis: 90%; flex-grow: 1">
              <div>Kết luận mặc định</div>
              <div>
                <InputText v-model:value="radiology.resultDefault" />
              </div>
            </div>
          </div>
        </VueTabPanel>
        <VueTabPanel :tabKey="TABS_KEY.PRINT_SETTING">
          <div class="mt-4 flex flex-wrap gap-4">
            <div style="flex-basis: 90%; flex-grow: 1">
              <div class="">Chọn mẫu in</div>
              <div>
                <VueSelect
                  v-model:value="radiology.printHtmlId"
                  :options="printHtmlOptions"
                  @select-item="updatePreview" />
              </div>
            </div>

            <div style="flex-basis: 600px; flex-grow: 1; min-height: 600px" class="flex flex-col">
              <div>
                <span>Nội dung mô tả mặc định</span>
                <span class="ml-4">
                  <a @click="modalSelectRadiologyExample?.openModal()">( Lấy từ dữ liệu mẫu )</a>
                </span>
              </div>
              <div style="flex-grow: 1">
                <WysiwygEditor
                  v-model:value="radiology.descriptionDefault"
                  @update:value="updatePreview" />
              </div>
            </div>

            <div style="flex-basis: 600px; flex-grow: 1; min-height: 600px" class="flex flex-col">
              <div>&nbsp;</div>
              <div style="flex-grow: 1">
                <iframe
                  ref="iframe"
                  class="preview-iframe"
                  style="width: 100%; height: 100%; text-align: center"></iframe>
              </div>
            </div>
          </div>
        </VueTabPanel>
      </template>
    </VueTabs>

    <div class="mt-8 flex justify-between">
      <VueButton
        color="blue"
        type="submit"
        :loading="saveLoading"
        icon="save"
        :disabled="disabledButtonSave">
        Xóa
      </VueButton>
      <VueButton
        color="blue"
        type="submit"
        :loading="saveLoading"
        icon="save"
        :disabled="disabledButtonSave">
        {{ radiology.id ? 'Cập nhật thông tin' : 'Tạo mới' }}
      </VueButton>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
