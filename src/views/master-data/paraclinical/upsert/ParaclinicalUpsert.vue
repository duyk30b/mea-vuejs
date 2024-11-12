<script setup lang="ts">
import { computed, nextTick, onBeforeMount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MonacoEditor from '../../../../common/MonacoEditor.vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconPrint } from '../../../../common/icon'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputMoney, InputText, VueSelect } from '../../../../common/vue-form'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../../common/vue-tabs'
import { useMeStore } from '../../../../modules/_me/me.store'
import { Customer } from '../../../../modules/customer'
import { AttributeInputType, AttributeLayoutType } from '../../../../modules/enum'
import { Image, ImageHost } from '../../../../modules/image/image.model'
import {
  Paraclinical,
  ParaclinicalApi,
  ParaclinicalService,
} from '../../../../modules/paraclinical'
import { ParaclinicalGroup, ParaclinicalGroupService } from '../../../../modules/paraclinical-group'
import { ParaclinicalAttribute } from '../../../../modules/paraclinical/paraclinical-attribute.model'
import { PrintHtml } from '../../../../modules/print-html'
import {
  ticketClinicPrintTicketParaclinicalCompiledTemplate,
  ticketClinicPrintTicketParaclinicalDefault,
} from '../../../../modules/print-html/print-content/ticket-clinic-print-ticket-paraclinical'
import { Ticket } from '../../../../modules/ticket'
import { TicketDiagnosis } from '../../../../modules/ticket-diagnosis'
import { TicketParaclinical } from '../../../../modules/ticket-paraclinical'
import ModalSelectParaclinicalExample from './ModalSelectParaclinicalExample.vue'
import { convertViToEn } from '../../../../utils'

const TABS_KEY = {
  BASIC: 'BASIC',
  PRINT_SETTING: 'PRINT_SETTING',
}

const modalSelectParaclinicalExample = ref<InstanceType<typeof ModalSelectParaclinicalExample>>()

const route = useRoute()
const router = useRouter()

const paraclinicalRoot = ref(Paraclinical.blank())
const paraclinical = ref(Paraclinical.blank())
const saveLoading = ref(false)
const paraclinicalGroupAll = ref<ParaclinicalGroup[]>([])

const activeTab = ref(TABS_KEY.BASIC)
const iframe = ref<HTMLIFrameElement>()

onBeforeMount(async () => {
  paraclinicalGroupAll.value = await ParaclinicalGroupService.getAll()
})

onMounted(async () => {
  const paraclinicalId = Number(route.params.id)
  if (paraclinicalId) {
    const paraclinicalResponse = await ParaclinicalApi.detail(paraclinicalId, {
      relation: { paraclinicalAttributeList: true, printHtml: true },
    })
    paraclinicalRoot.value = paraclinicalResponse
    paraclinical.value = Paraclinical.from(paraclinicalResponse)
  } else {
    paraclinical.value = Paraclinical.blank()
    paraclinical.value.printHtml!.paraclinicalId = paraclinical.value.id
  }

  if (!paraclinical.value.printHtml?.content) {
    paraclinical.value.printHtml!.content = await ticketClinicPrintTicketParaclinicalDefault()
  }

  updatePreview()
})

const disableButtonUpdateInfo = computed(() => {
  return Paraclinical.equal(paraclinical.value, paraclinicalRoot.value)
})

const disableButtonUpdateFull = computed(() => {
  if (!Paraclinical.equal(paraclinical.value, paraclinicalRoot.value)) {
    return false
  }
  if (
    !PrintHtml.equal(
      paraclinical.value.printHtml || PrintHtml.blank(),
      paraclinicalRoot.value.printHtml || PrintHtml.blank()
    )
  ) {
    return false
  }
  if (
    !ParaclinicalAttribute.equalList(
      paraclinical.value.paraclinicalAttributeList || [],
      paraclinicalRoot.value.paraclinicalAttributeList || []
    )
  ) {
    return false
  }
  return true
})

const handleCreateNew = async () => {
  saveLoading.value = true
  try {
    await ParaclinicalService.createOne(paraclinical.value)
    router.push({ name: 'ParaclinicalList' })
    AlertStore.addSuccess('Tạo mới thành công', 1000)
  } catch (error) {
    console.log('🚀 ~ file: ParaclinicalUpsert.vue:72 ~ handleCreateNew ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleUpdateInfo = async () => {
  saveLoading.value = true
  try {
    const paraclinicalResponse = await ParaclinicalApi.updateInfo(
      paraclinical.value.id,
      paraclinical.value
    )
    Object.assign(paraclinical.value, Paraclinical.from(paraclinicalResponse))
    Object.assign(paraclinicalRoot.value, Paraclinical.from(paraclinicalResponse))
  } catch (error) {
    console.log('🚀 ~ file: ParaclinicalUpsert.vue:84 ~ handleUpdateInfo ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleUpdateFull = async () => {
  saveLoading.value = true
  try {
    const paraclinicalResponse = await ParaclinicalApi.updateOne(
      paraclinical.value.id,
      paraclinical.value
    )
    Object.assign(paraclinical.value, Paraclinical.from(paraclinicalResponse))
    Object.assign(paraclinicalRoot.value, Paraclinical.from(paraclinicalResponse))
  } catch (error) {
    console.log('🚀 ~ file: handleUpdateFull.vue:99 ~ handleUpdateFull ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const updatePreview = () => {
  if (iframe.value) {
    const doc = iframe.value?.contentDocument || iframe.value?.contentWindow?.document
    if (doc) {
      const printHtmlContent = paraclinical.value.printHtml?.content || ''

      const ticketExample = Ticket.blank()
      ticketExample.ticketDiagnosis = TicketDiagnosis.blank()
      ticketExample.ticketDiagnosis.diagnosis = 'Viêm mũi dị ứng'
      ticketExample.startedAt = Date.now()

      const customer = Customer.example()

      const ticketParaclinical = TicketParaclinical.blank()
      ticketParaclinical.result = paraclinical.value.conclusionDefault
      ticketParaclinical.imageList = [
        '1_znv_NdURQWK-ec3FpvaFTaSodPxOcWt',
        '1AFStFNRF1_TENXskR9ppbsDcR4JW9S9j',
        '1LsOS-RAWtL-_hR-dviAb59e6KKCenkPb',
        '1N9UKIJHbfbq8dGo93T3hWiHK7_e2vPPQ',
      ].map((id) => {
        const image = Image.blank()
        image.hostType = ImageHost.GoogleDriver
        image.hostId = id
        return image
      })

      const descriptionObject: Record<string, any> = {}
      paraclinical.value.paraclinicalAttributeList ||= []
      paraclinical.value.paraclinicalAttributeList.forEach((i) => {
        descriptionObject[i.code] = i.default
      })
      ticketParaclinical.description = JSON.stringify(descriptionObject)

      const textDom = ticketClinicPrintTicketParaclinicalCompiledTemplate({
        organization: useMeStore().organization,
        ticket: ticketExample,
        customer,
        paraclinical: paraclinical.value,
        ticketParaclinical: ticketParaclinical,
        data: JSON.parse(ticketParaclinical.description || '{}'),
        doctorName: '',
        htmlString: printHtmlContent,
      })

      doc.open()
      doc.write(textDom)
      doc.close()
    }
  }
}

const handleUpdateTabShow = () => {
  nextTick(() => {
    updatePreview()
  })
}

const handleAddAttribute = () => {
  const attribute = ParaclinicalAttribute.blank()
  attribute.paraclinicalId = paraclinical.value.id
  paraclinical.value.paraclinicalAttributeList!.push(attribute)
}

const changeItemPosition = (index: number, count: number) => {
  const temp = paraclinical.value.paraclinicalAttributeList![index]
  paraclinical.value.paraclinicalAttributeList![index] =
    paraclinical.value.paraclinicalAttributeList![index + count]
  paraclinical.value.paraclinicalAttributeList![index + count] = temp
}

const handleModalSelectParaclinicalExampleSuccess = (paraclinicalProp: Paraclinical) => {
  const paraclinicalExample = Paraclinical.from(paraclinicalProp)
  paraclinicalExample.id = paraclinical.value.id
  paraclinicalExample.paraclinicalGroupId = paraclinical.value.paraclinicalGroupId

  paraclinical.value = paraclinicalExample
}

const handleUpdateAttributeName = (index: number, name: string) => {
  const code = convertViToEn(name)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
  paraclinical.value.paraclinicalAttributeList![index].code = code
}
</script>

<template>
  <ModalSelectParaclinicalExample
    ref="modalSelectParaclinicalExample"
    @select="handleModalSelectParaclinicalExampleSuccess" />
  <div class="page-header">
    <div class="page-header-content">
      <IconPrint />
      Thông tin phiếu {{ paraclinical.name }}
    </div>
  </div>

  <form class="md:mx-4 mt-4 my-8 p-4 bg-white" @submit.prevent="handleCreateNew">
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
                <span>
                  <a @click="modalSelectParaclinicalExample?.openModal()">( Lấy từ dữ liệu mẫu )</a>
                </span>
              </div>
              <div>
                <InputText v-model:value="paraclinical.name" required />
              </div>
            </div>

            <div style="flex-basis: 400px; flex-grow: 1">
              <div class="">Nhóm</div>
              <div>
                <VueSelect
                  v-model:value="paraclinical.paraclinicalGroupId"
                  :options="
                    paraclinicalGroupAll.map((group) => ({ value: group.id, text: group.name }))
                  " />
              </div>
            </div>

            <div style="flex-basis: 400px; flex-grow: 1">
              <div>Giá tiền</div>
              <div style="flex: 1">
                <InputMoney
                  v-model:value="paraclinical.price"
                  :validate="{ GTE: 0 }"
                  style="width: 100%" />
              </div>
            </div>

            <div class="" style="flex-basis: 90%; flex-grow: 1">
              <div>Kết luận mặc định</div>
              <div>
                <InputText v-model:value="paraclinical.conclusionDefault" />
              </div>
            </div>

            <div
              v-if="paraclinical.id"
              style="flex-basis: 90%; flex-grow: 1"
              class="mt-4 flex justify-center">
              <VueButton
                :disabled="disableButtonUpdateInfo"
                color="blue"
                type="button"
                :loading="saveLoading"
                icon="save"
                @click="handleUpdateInfo">
                Cập nhật thông tin
              </VueButton>
            </div>
          </div>
        </VueTabPanel>
        <VueTabPanel :tabKey="TABS_KEY.PRINT_SETTING">
          <div class="mt-4 flex flex-wrap gap-4">
            <div style="flex-basis: 400px; flex-grow: 1" class="flex flex-col">
              <div>Dạng hiển thị</div>
              <div style="flex-grow: 1">
                <VueSelect
                  v-model:value="paraclinical.attributeLayout"
                  :options="
                    Object.keys(AttributeLayoutType).map((i) => ({
                      value: i,
                      text: AttributeLayoutType[i as unknown as keyof typeof AttributeLayoutType],
                    }))
                  "
                  required />
              </div>
            </div>
            <div class="" style="flex-basis: 90%; flex-grow: 1">
              <div class="italic underline">Danh sách các giá trị cần điền</div>
              <div v-if="paraclinical.paraclinicalAttributeList?.length">
                <table class="attribute-options">
                  <thead>
                    <tr>
                      <th style="padding: 0 6px">#</th>
                      <th>Tên</th>
                      <th>Giá trị mặc định</th>
                      <th>Code</th>
                      <th>Input</th>
                      <th>Options</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(attribute, index) in paraclinical.paraclinicalAttributeList || []"
                      :key="index">
                      <td style="padding: 0 6px 6px 0">
                        <div class="flex flex-col items-center">
                          <button
                            type="button"
                            style="
                              border: none;
                              font-size: 1.2rem;
                              line-height: 0.5;
                              background: none;
                              margin-bottom: -0.5rem;
                            "
                            class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                            :disabled="index === 0"
                            @click="changeItemPosition(index, -1)">
                            <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
                          </button>
                          <button
                            type="button"
                            style="
                              border: none;
                              font-size: 1.2rem;
                              line-height: 0.5;
                              background: none;
                              margin-top: -0.5rem;
                            "
                            class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                            :disabled="index === paraclinical.paraclinicalAttributeList!.length - 1"
                            @click="changeItemPosition(index, 1)">
                            <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                          </button>
                        </div>
                      </td>
                      <td style="padding: 0 6px 6px 0">
                        <InputText
                          v-model:value="paraclinical.paraclinicalAttributeList![index].name"
                          required
                          @update:value="(name) => handleUpdateAttributeName(index, name)" />
                      </td>
                      <td style="padding: 0 6px 6px 0">
                        <InputText
                          v-if="
                            paraclinical.paraclinicalAttributeList![index].inputType ===
                            AttributeInputType.InputText
                          "
                          v-model:value="paraclinical.paraclinicalAttributeList![index].default" />
                      </td>
                      <td style="padding: 0 6px 6px 0">
                        <InputText
                          :value="paraclinical.paraclinicalAttributeList![index].code"
                          disabled />
                      </td>
                      <td style="padding: 0 6px 6px 0">
                        <VueSelect
                          v-model:value="paraclinical.paraclinicalAttributeList![index].inputType"
                          :options="
                            Object.keys(AttributeInputType).map((i) => ({ value: i, text: i }))
                          "
                          required />
                      </td>
                      <td style="padding: 0 6px 6px 0">
                        <InputText
                          v-model:value="paraclinical.paraclinicalAttributeList![index].options" />
                      </td>
                      <td style="padding: 0 0 6px 0; text-align: center">
                        <a
                          style="color: var(--text-red)"
                          @click="paraclinical.paraclinicalAttributeList!.splice(index, 1)">
                          Xóa
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="text-left"><a @click="handleAddAttribute">✚ Thêm giá trị</a></div>
            </div>

            <div style="flex-basis: 600px; flex-grow: 1; height: 600px" class="flex flex-col">
              <div>Cài đặt mẫu in nâng cao</div>
              <div style="flex-grow: 1; border: 1px solid #cdcdcd; padding-top: 10px">
                <MonacoEditor
                  v-model:value="paraclinical.printHtml!.content"
                  @update:value="updatePreview" />
              </div>
            </div>

            <div style="flex-basis: 600px; flex-grow: 1; height: 600px" class="flex flex-col">
              <div>&nbsp;</div>
              <div style="flex-grow: 1">
                <iframe
                  ref="iframe"
                  class="preview-iframe"
                  style="width: 100%; height: 100%; text-align: center"></iframe>
              </div>
            </div>

            <div
              v-if="paraclinical.id"
              style="flex-basis: 90%; flex-grow: 1"
              class="mt-4 flex justify-center">
              <VueButton
                :disabled="disableButtonUpdateFull"
                color="blue"
                type="button"
                :loading="saveLoading"
                icon="save"
                @click="handleUpdateFull">
                Cập nhật dữ liệu và mẫu in
              </VueButton>
            </div>
          </div>
        </VueTabPanel>
      </template>
    </VueTabs>

    <div v-if="!paraclinical.id" class="mt-8 flex justify-center">
      <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">Tạo mới</VueButton>
    </div>
  </form>
</template>

<style lang="scss" scoped>
textarea {
  padding: 6px;
  outline: none;
  border: 1px solid #d9d9d9;
  &:focus {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px #1890ff33;
  }
}

table.attribute-options {
  width: 100%;
  th {
    padding: 0;
    text-align: center;
    font-weight: 500;
  }
}
</style>
