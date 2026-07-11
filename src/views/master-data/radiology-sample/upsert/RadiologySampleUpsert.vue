<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import VueTinyMCE from '@/common/VueTinyMCE.vue'
import { IconRight } from '@/common/icon-antd'
import MonacoEditor from '@/common/monaco-editor/MonacoEditor.vue'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputNumber, InputText } from '@/common/vue-form'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { MeService } from '@/modules/_me/me.service'
import { Customer } from '@/modules/customer'
import { Image, ImageHostType } from '@/modules/image/image.model'
import { PermissionId } from '@/modules/permission/permission.enum'
import { TemplateHtml, TemplateHtmlAction, TemplateHtmlCompile, TemplateHtmlType } from '@/modules/template-html'
import { Radiology } from '@/modules/radiology'
import { RadiologySample, RadiologySampleService } from '@/modules/radiology-sample'
import { Ticket } from '@/modules/ticket'
import { TicketRadiology } from '@/modules/ticket-radiology'
import { ESDom } from '@/utils'
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import InputSearchRadiology from '@/views/component/InputSearchRadiology.vue'
import InputSearchUser from '@/views/component/InputSearchUser.vue'
import VueSelectTemplateHtml from '@/views/component/VueSelectTemplateHtml.vue'
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const iframe = ref<HTMLIFrameElement>()

const route = useRoute()
const router = useRouter()

const { userPermission, organization, user } = MeService

const radiologySample = ref(RadiologySample.blank())
const radiologySampleOrigin = ref(RadiologySample.blank())

const ticketDemo = Ticket.blank()
ticketDemo.note = 'Viêm mũi dị ứng'
ticketDemo.createdAt = Date.now()
ticketDemo.customer = Customer.example()

let systemVarLog = {}

const saveLoading = ref(false)

const templateHtmlHeader = ref(TemplateHtml.blank())
const templateHtmlFooter = ref(TemplateHtml.blank())

onBeforeMount(async () => {
  templateHtmlHeader.value = await TemplateHtmlAction.getTemplateHtmlByType({
    oid: organization.value.id,
    templateHtmlType: TemplateHtmlType._HEADER,
  })
  templateHtmlFooter.value = await TemplateHtmlAction.getTemplateHtmlByType({
    oid: organization.value.id,
    templateHtmlType: TemplateHtmlType._FOOTER,
  })
})

onMounted(async () => {
  const radiologySampleId = Number(route.params.id)
  if (radiologySampleId) {
    const radiologySampleResponse = await RadiologySampleService.detail(radiologySampleId, {
      relation: { radiology: true },
    })
    radiologySampleOrigin.value = radiologySampleResponse
    radiologySample.value = RadiologySample.from(radiologySampleResponse)
  } else {
    radiologySampleOrigin.value = RadiologySample.blank()
    radiologySample.value = RadiologySample.blank()
    radiologySample.value.priority = RadiologySampleService.generatePriority()
    radiologySample.value.userId = MeService.user.value?.id || 0
    // radiologySample.value.customStyles = `.description td { border: 1px dashed; }`
    // radiologySample.value.templateHtmlId = 21
  }
  const templateHtml = await TemplateHtmlAction.getTemplateHtmlByType({
    oid: organization.value.id,
    templateHtmlType: TemplateHtmlType.TicketClinicRadiologyResult,
    templateHtmlId: radiologySample.value.templateHtmlId,
  })
  radiologySample.value.templateHtml = templateHtml
  radiologySample.value.templateHtmlId = templateHtml.id
  updatePreview()
})

const hasChangeData = computed(() => {
  if (!RadiologySample.equal(radiologySample.value, radiologySampleOrigin.value)) {
    return true
  }
  return false
})

const disabledButtonSave = computed(() => {
  if (!userPermission.value[PermissionId.MASTER_DATA_RADIOLOGY_CONTENT_SAMPLE]) return true
  if (
    radiologySampleOrigin.value.userId !== 0 &&
    radiologySampleOrigin.value.userId !== MeService.user.value?.id
  ) {
    return true
  }

  if (hasChangeData.value) return false

  return true
})

const selectTemplateHtml = async (templateHtmlProp?: TemplateHtml) => {
  if (templateHtmlProp?.id) {
    radiologySample.value.templateHtml = templateHtmlProp
  } else {
    radiologySample.value.templateHtml = await TemplateHtmlAction.getTemplateHtmlByType({
      oid: organization.value.id,
      templateHtmlType: TemplateHtmlType.TicketClinicRadiologyResult,
    })
  }
  updatePreview()
}

const selectRadiology = (radiology?: Radiology) => {
  radiologySample.value.radiology = radiology
  updatePreview()
}

const handleSave = async () => {
  try {
    saveLoading.value = true
    if (radiologySample.value.id) {
      await RadiologySampleService.updateOne(radiologySample.value.id, {
        radiologySample: radiologySample.value,
      })
      AlertStore.addSuccess('Cập nhật thành công', 1000)
    } else {
      await RadiologySampleService.createOne({ radiologySample: radiologySample.value })
      AlertStore.addSuccess('Tạo mới thành công', 500)
      router.push({ name: 'RadiologySampleList' })
    }
  } catch (error) {
    console.log('🚀 ~ RadiologySampleUpsert.vue:93 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const hostGoogleDriverIdExampleList = [
  '1d6VOuyrjyG9_HDG6TyB8-b3dslmJPo29',
  '1f4H08hSUzRSfS4oM5AX4tPbxG_bTqm7L',
  '1LsOS-RAWtL-_hR-dviAb59e6KKCenkPb',
  '1N9UKIJHbfbq8dGo93T3hWiHK7_e2vPPQ',
]

const updatePreview = async () => {
  if (!iframe.value) return
  const doc = iframe.value?.contentDocument || iframe.value?.contentWindow?.document
  if (!doc) return

  const templateHtml = radiologySample.value.templateHtml
  const radiology = radiologySample.value.radiology || Radiology.blank()
  if (!templateHtml?.htmlPrint) return

  const ticketRadiology = TicketRadiology.blank()
  ticketRadiology.radiology = Radiology.from(radiology)
  ticketRadiology.description = radiologySample.value.description
  ticketRadiology.result = radiologySample.value.result
  ticketRadiology.customStyles = radiologySample.value.customStyles
  ticketRadiology.customVariables = radiologySample.value.customVariables
  ticketRadiology.imageList = Array.from({ length: 4 }, (_, i) => {
    const image = Image.blank()
    image.hostType = ImageHostType.GoogleDriver
    image.externalId = hostGoogleDriverIdExampleList[i]
    return image
  })

  const templateHtmlCompiled = TemplateHtmlCompile.compilePageHtml({
    data: {
      organization: organization.value,
      me: user.value!,
      ticket: ticketDemo,
      customer: ticketDemo.customer!,
      ticketRadiology,
    },
    template: {
      _header: templateHtmlHeader.value.htmlPrint,
      _footer: templateHtmlFooter.value.htmlPrint,
      _content: ticketRadiology.description || '',
      _wrapper: templateHtml.htmlPrint,
    },
    variablesString: [
      templateHtmlHeader.value.initVariable,
      templateHtmlFooter.value.initVariable,
      templateHtml.initVariable,
      ticketRadiology.customVariables,
    ],
  })
  systemVarLog = templateHtmlCompiled?._SYSTEM_VARIABLE || {}

  if (!templateHtmlCompiled || !templateHtmlCompiled.htmlString) {
    return
  }

  ESDom.writeWindow(doc, {
    html: templateHtmlCompiled?.htmlString || '',
    cssList: [
      templateHtmlHeader.value.cssPrint,
      templateHtmlFooter.value.cssPrint,
      templateHtml.cssPrint,
      ticketRadiology.customStyles,
    ],
  })
}

const handleClickDelete = async () => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa mẫu: ' + radiologySample.value.name,
    content: 'Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    onOk: async () => {
      try {
        const response = await RadiologySampleService.destroyOne(radiologySample.value.id)
        router.push({ name: 'RadiologySampleList' })
      } catch (error) {
        console.log('🚀 ~ file: RadiologyUpsert.vue:165 ~ onOk: ~ error:', error)
      }
    },
  })
}

const startTestPrint = async () => {
  try {
    const templateHtml = radiologySample.value.templateHtml
    if (!templateHtml?.htmlPrint) {
      return AlertStore.addError('Cài đặt in thất bại')
    }

    const ticketRadiology = TicketRadiology.blank()
    ticketRadiology.radiology = Radiology.from(radiologySample.value.radiology || Radiology.blank())
    ticketRadiology.result = radiologySample.value.result
    ticketRadiology.description = radiologySample.value.description
    ticketRadiology.customStyles = radiologySample.value.customStyles
    ticketRadiology.customVariables = radiologySample.value.customVariables
    ticketRadiology.imageList = Array.from({ length: 4 }, (_, i) => {
      const image = Image.blank()
      image.hostType = ImageHostType.GoogleDriver
      image.externalId = hostGoogleDriverIdExampleList[i]
      return image
    })

    const templateHtmlCompiled = TemplateHtmlCompile.compilePageHtml({
      data: {
        organization: organization.value,
        me: user.value!,
        ticket: ticketDemo,
        customer: ticketDemo.customer!,
        ticketRadiology,
      },
      template: {
        _header: templateHtmlHeader.value.htmlPrint,
        _footer: templateHtmlFooter.value.htmlPrint,
        _content: ticketRadiology.description || '',
        _wrapper: templateHtml.htmlPrint,
      },
      variablesString: [
        templateHtmlHeader.value.initVariable,
        templateHtmlFooter.value.initVariable,
        templateHtml.initVariable,
        ticketRadiology.customVariables,
      ],
    })
    systemVarLog = templateHtmlCompiled?._SYSTEM_VARIABLE || {}

    if (!templateHtmlCompiled || !templateHtmlCompiled.htmlString) {
      return
    }

    await ESDom.startPrint('iframe-print', {
      html: templateHtmlCompiled?.htmlString || '',
      cssList: [
        templateHtmlHeader.value.cssPrint,
        templateHtmlFooter.value.cssPrint,
        templateHtml.cssPrint,
        ticketRadiology.customStyles,
      ],
    })
  } catch (error) {
    console.log('🚀 ~ file: VisitPrescription.vue:153 ~ startPrint ~ error:', error)
  }
}

const showDataSystemPrint = () => {
  console.log(systemVarLog)
}

const startCleanHtml = () => {
  radiologySample.value.description = ESDom.cleanHtml(radiologySample.value.description).replace(
    /Ø/gi,
    ' - ',
  )
}
</script>

<template>
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:flex items-center gap-2 text-lg font-medium">
      <Breadcrumb />
      <IconRight style="font-size: 0.7em; opacity: 0.5" />
      {{ radiologySample.name }}
    </div>
  </div>

  <form class="md:mx-4 mt-4 my-8 p-4 bg-white" @submit.prevent="handleSave">
    <div class="flex flex-wrap gap-4">
      <div style="flex-basis: 500px; flex-grow: 1; min-height: 800px" class="flex flex-col">
        <div class="flex flex-wrap gap-4">
          <div style="flex-grow: 1; flex-basis: 45%; min-width: 200">
            <div>STT</div>
            <div>
              <InputNumber v-model:value="radiologySample.priority" required />
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 45%; min-width: 200">
            <InputSearchUser label="Người dùng" v-model:userId="radiologySample.userId" />
          </div>
          <div style="flex-grow: 1; flex-basis: 45%; min-width: 400px">
            <div>Tên mẫu kết quả</div>
            <div>
              <InputText v-model:value="radiologySample.name" required />
            </div>
          </div>

          <div style="flex-grow: 1; flex-basis: 45%; min-width: 400px">
            <InputSearchRadiology
              label="Áp dụng cho phiếu"
              v-model:radiologyId="radiologySample.radiologyId"
              @selectRadiology="(v) => selectRadiology(v)"
            />
          </div>

          <div style="flex-grow: 1; flex-basis: 45%; min-width: 400px">
            <VueSelectTemplateHtml
              v-model:templateHtmlId="radiologySample.templateHtmlId"
              :templateHtmlType="TemplateHtmlType.TicketClinicRadiologyResult"
              @selectTemplateHtml="(v) => selectTemplateHtml(v)"
            />
          </div>
        </div>

        <div class="mt-4">
          <span>Nội dung mô tả mặc định</span>
          <span class="ml-4">
            <!-- <a @click="modalSelectRadiologyExample?.openModal()">( Lấy từ dữ liệu mẫu )</a> -->
          </span>
        </div>
        <div style="flex-grow: 1; min-height: 400px">
          <VueTinyMCE
            v-model:modelValue="radiologySample.description"
            @update:modelValue="updatePreview"
            menu-bar
            status-bar
          />
        </div>
        <div class="flex justify-end">
          <a @click="startCleanHtml">CleanHTML</a>
        </div>
        <div class="mt-4">
          <div>Kết luận mặc định</div>
          <div>
            <InputText v-model:value="radiologySample.result" @update:value="updatePreview" />
          </div>
        </div>

        <div class="mt-10">
          <details>
            <summary><a>Cài đặt nâng cao</a></summary>
            <div class="mt-4">
              <div class="flex justify-between">
                <span>Khởi tạo biến mặc định</span>
                <a @click="showDataSystemPrint">Xem biến hệ thống (console.log)</a>
              </div>
              <div style="height: 150px; border: 1px solid #cdcdcd">
                <MonacoEditor
                  :value="
                    (templateHtmlHeader?.initVariable || '') +
                    (templateHtmlFooter?.initVariable || '') +
                    (radiologySample.templateHtml?.initVariable || '')
                  "
                  language="javascript"
                  readOnly
                />
              </div>
            </div>
            <div class="mt-4">
              <div class="">Tùy chỉnh biến</div>
              <div class="" style="height: 150px; border: 1px solid #cdcdcd">
                <MonacoEditor
                  v-model:value="radiologySample!.customVariables"
                  @update:value="updatePreview"
                  language="javascript"
                />
              </div>
            </div>
            <div class="mt-4">
              <div class="">Tùy chỉnh style</div>
              <div class="" style="height: 150px; border: 1px solid #cdcdcd">
                <MonacoEditor
                  v-model:value="radiologySample!.customStyles"
                  @update:value="updatePreview"
                  language="css"
                />
              </div>
            </div>
          </details>
        </div>
      </div>

      <div style="flex-basis: 500px; flex-grow: 1; min-height: 800px" class="flex flex-col">
        <div class="flex justify-end">
          <a @click="startTestPrint">In thử</a>
        </div>
        <div style="flex-grow: 1; box-shadow: 4px 4px 8px 4px rgba(0, 0, 0, 0.2)">
          <iframe
            ref="iframe"
            class="preview-iframe"
            style="width: 100%; height: 100%; text-align: center"
          ></iframe>
        </div>
      </div>
    </div>

    <div class="mt-8 flex justify-between">
      <VueButton color="red" type="button" icon="trash" @click="handleClickDelete">Xóa</VueButton>
      <VueButton
        color="blue"
        type="submit"
        :loading="saveLoading"
        icon="save"
        :disabled="disabledButtonSave"
      >
        {{ radiologySample.id ? 'Cập nhật thông tin' : 'Tạo mới' }}
      </VueButton>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
