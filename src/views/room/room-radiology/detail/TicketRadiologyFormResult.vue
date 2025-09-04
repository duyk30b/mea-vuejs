<script setup lang="ts">
import ImageUploadCloudinary from '@/common/image-upload/ImageUploadCloudinary.vue'
import { InputDate } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputOptionsValue.vue'
import InputText from '@/common/vue-form/InputText.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import VueButton from '@/common/VueButton.vue'
import VueTinyMCE from '@/common/VueTinyMCE.vue'
import { MeService } from '@/modules/_me/me.service'
import { Image } from '@/modules/image/image.model'
import { PositionType } from '@/modules/position'
import { PrintHtml, PrintHtmlType } from '@/modules/print-html'
import { PrintHtmlAction } from '@/modules/print-html/print-html.action'
import { RadiologyService } from '@/modules/radiology'
import { RadiologySample } from '@/modules/radiology-sample'
import { TicketChangeRadiologyApi } from '@/modules/ticket'
import { TicketRadiology, TicketRadiologyStatus } from '@/modules/ticket-radiology'
import { TicketUser } from '@/modules/ticket-user'
import { ESImage, ESString } from '@/utils'
import InputSearchRadiologySample from '@/views/component/InputSearchRadiologySample.vue'
import VueSelectPrintHtml from '@/views/component/VueSelectPrintHtml.vue'
import { computed, onMounted, ref, watch } from 'vue'
import TicketChangeTicketUserPosition from '../../room-user/TicketChangeTicketUserPosition.vue'
import ModalSaveRadiologySample from '../modal/ModalSaveRadiologySample.vue'

const emit = defineEmits<{
  (e: 'updateResultSuccess', value: TicketRadiology): void
  (e: 'cancelResultSuccess', value: TicketRadiology): void
}>()

const props = withDefaults(
  defineProps<{
    ticketRadiologyProp: TicketRadiology
    editable?: boolean
  }>(),
  { ticketRadiologyProp: () => TicketRadiology.blank(), editable: true },
)

const imageUploadMultipleRef = ref<InstanceType<typeof ImageUploadCloudinary>>()
const modalSaveRadiologySample = ref<InstanceType<typeof ModalSaveRadiologySample>>()

const { userPermission, organization } = MeService
const ticketRadiologyOrigin = ref<TicketRadiology>(TicketRadiology.blank())
const ticketRadiology = ref<TicketRadiology>(TicketRadiology.blank())
const hasChangeImageList = ref(false)
const loadingImage = ref(false)

watch(
  () => props.ticketRadiologyProp,
  async (newValue) => {
    ticketRadiologyOrigin.value = TicketRadiology.from(newValue)
    if (!ticketRadiologyOrigin.value.completedAt) {
      ticketRadiologyOrigin.value.completedAt = Date.now()
    }

    ticketRadiology.value = TicketRadiology.from(ticketRadiologyOrigin.value)

    const { radiologyId } = ticketRadiology.value
    ticketRadiology.value.radiology = await RadiologyService.detail(radiologyId, {
      relation: { radiologyGroup: true },
    })
  },
  { immediate: true },
)

const radiologyMap = RadiologyService.radiologyMap

const saveLoading = ref(false)

const hasChangeTicketRadiology = computed(() => {
  return !TicketRadiology.equal(ticketRadiologyOrigin.value, ticketRadiology.value)
})

const hasChangeTicketUserList = computed(() => {
  const result = !TicketUser.equalList(
    ticketRadiologyOrigin.value.ticketUserResultList,
    ticketRadiology.value.ticketUserResultList,
  )
  return result
})

const handleChangeImage = () => {
  hasChangeImageList.value = true
}

const hasChangeData = computed(() => {
  if (
    hasChangeTicketRadiology.value ||
    ticketRadiology.value.status === TicketRadiologyStatus.Pending
  ) {
    return true
  }
  if (hasChangeTicketUserList.value) return true
  if (hasChangeImageList.value) return true
  return false
})

onMounted(async () => {
  try {
    await RadiologyService.getMap()
  } catch (error: any) {
    console.log('🚀 ~ TicketRadiologyFormResult.vue:107 ~ error:', error)
  }
})

const updateResult = async (options: { print: boolean }) => {
  try {
    saveLoading.value = true
    if (!ticketRadiology.value.completedAt) {
      ticketRadiology.value.completedAt = Date.now()
    }
    const { filesPosition, imageIdsKeep, files, imageUrls, imageIdsWait } =
      imageUploadMultipleRef.value?.getData() || {
        filesPosition: [],
        imageIdsWait: [],
        imageIdsKeep: [],
        files: [],
        imageUrls: [],
      }

    const ticketRadiologyUpdate = await TicketChangeRadiologyApi.updateResult({
      ticketId: ticketRadiology.value.ticketId,
      ticketRadiologyId: ticketRadiology.value.id,
      ticketRadiology: ticketRadiology.value,
      ticketUserResultList: ticketRadiology.value.ticketUserResultList || [],
      imagesChange: hasChangeImageList.value
        ? { files, imageIdsWait, externalUrlList: imageUrls }
        : undefined,
    })

    if (options.print) {
      ticketRadiologyUpdate.radiology = ticketRadiology.value.radiology
      ticketRadiologyUpdate.ticket = ticketRadiology.value.ticket
      await PrintHtmlAction.startPrintResultTicketRadiology({
        ticketRadiologyData: ticketRadiologyUpdate,
        ticket: ticketRadiology.value.ticket!,
        customer: ticketRadiology.value.customer!,
      })
    }
    // router.push({ name: 'RoomRadiology', params: { roomId: route.params.roomId } })
    emit('updateResultSuccess', ticketRadiologyUpdate)
  } catch (error) {
    console.log('🚀 ~ TicketRadiologyResult.vue:185 ~ updateResult ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const resetResult = () => {
  const radiologyDefault = radiologyMap.value[ticketRadiology.value.radiologyId]
  ticketRadiology.value.printHtmlId = radiologyDefault.printHtmlId
  ticketRadiology.value.description = radiologyDefault.descriptionDefault || ''
  ticketRadiology.value.result = radiologyDefault.resultDefault || ''
  ticketRadiology.value.customStyles = radiologyDefault.customStyles || ''
  ticketRadiology.value.customVariables = radiologyDefault.customVariables || ''
  ticketRadiology.value.completedAt = null as any
}

const clickCancelResult = async () => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn hủy kết quả này ?',
    content: 'Trạng thái của phiếu sẽ trở về: "Đợi kết quả" ?',
    onOk: async () => {
      try {
        saveLoading.value = true
        const radiologyDefault = radiologyMap.value[ticketRadiology.value.radiologyId]
        const ticketRadiologyUpdate = await TicketChangeRadiologyApi.cancelResult({
          ticketId: ticketRadiology.value.ticketId,
          ticketRadiologyId: ticketRadiology.value.id,
          body: {
            printHtmlId: radiologyDefault?.printHtmlId || 0,
            description: radiologyDefault?.descriptionDefault || '',
            result: radiologyDefault?.resultDefault || '',
            customStyles: radiologyDefault?.customStyles || '',
            customVariables: radiologyDefault?.customVariables || '',
          },
        })

        Object.assign(ticketRadiology.value, ticketRadiologyUpdate)
        emit('cancelResultSuccess', ticketRadiologyUpdate)
      } catch (error) {
        console.log('🚀 ~ ~ updateResult ~ error:', error)
      } finally {
        saveLoading.value = false
      }
    },
  })
}

const clickOpenModalSaveRadiologySample = () => {
  const radiologySampleDto = RadiologySample.blank()
  radiologySampleDto.radiologyId = ticketRadiology.value.radiologyId
  radiologySampleDto.printHtmlId = ticketRadiology.value.printHtmlId

  radiologySampleDto.description = ticketRadiology.value.description
  radiologySampleDto.result = ticketRadiology.value.result
  radiologySampleDto.customStyles = ticketRadiology.value.radiology?.customStyles || ''
  radiologySampleDto.customVariables = ticketRadiology.value.radiology?.customVariables || ''

  radiologySampleDto.name = ticketRadiology.value.ticket?.note || ''
  modalSaveRadiologySample.value?.openModal({
    radiologyId: ticketRadiology.value.radiologyId,
    radiologySample: radiologySampleDto,
  })
}

const selectRadiologySample = (radiologySampleData: RadiologySample | undefined) => {
  if (!radiologySampleData?.id) return
  ticketRadiology.value.printHtmlId = radiologySampleData.printHtmlId
  ticketRadiology.value.description = radiologySampleData.description
  ticketRadiology.value.result = radiologySampleData.result
  ticketRadiology.value.customStyles = radiologySampleData.customStyles
  ticketRadiology.value.customVariables = radiologySampleData.customVariables
}

const selectPrintHtml = (printHtml: PrintHtml | undefined) => {}

const logicFilterRadiologySample = (item: ItemOption, text: string) => {
  const radiologySampleItem = item.data as RadiologySample | undefined
  return (
    (radiologySampleItem?.radiologyId === ticketRadiology.value.radiologyId ||
      !radiologySampleItem?.radiologyId) &&
    (radiologySampleItem?.userId === MeService.user.value?.id || !radiologySampleItem?.userId) &&
    ESString.customFilter(item.text, text)
  )
}

const startPrintDemo = async () => {
  await PrintHtmlAction.startPrintResultTicketRadiology({
    customer: ticketRadiology.value.customer!,
    ticket: ticketRadiology.value.ticket!,
    ticketRadiologyData: ticketRadiology.value,
  })
}

const handleFixTicketUserResultList = (tuListData: TicketUser[]) => {
  ticketRadiologyOrigin.value.ticketUserResultList = TicketUser.fromList(tuListData)
}
</script>

<template>
  <ModalSaveRadiologySample ref="modalSaveRadiologySample" />
  <form class="p-4" @submit.prevent="updateResult({ print: false })">
    <div class="flex flex-wrap gap-4">
      <div style="flex-grow: 5; flex-basis: 600px">
        <div>
          <div class="flex justify-between">
            <span>Mô tả</span>
          </div>
          <div style="height: 600px">
            <VueTinyMCE v-model="ticketRadiology.description" menu-bar />
          </div>
        </div>
        <div class="mt-4">
          <div>Kết luận</div>
          <div>
            <InputText v-model:value="ticketRadiology.result" :disabled="!editable" />
          </div>
        </div>
      </div>
      <div style="flex-grow: 1; flex-basis: 300px">
        <div>
          <div class="flex justify-between">
            <span>Thời gian thực hiện</span>
            <div></div>
          </div>
          <div>
            <InputDate
              v-model:value="ticketRadiology.completedAt"
              :disabled="!editable"
              defaultType="date"
              showTime
              typeParser="number"
            />
          </div>
        </div>
        <div class="mt-4">
          <InputSearchRadiologySample
            @selectRadiologySample="selectRadiologySample"
            :logicFilter="logicFilterRadiologySample"
          />
        </div>
        <div class="mt-4">
          <div class="flex justify-between">
            <span>Chọn mẫu in</span>
            <a @click="startPrintDemo">In kết quả</a>
          </div>
          <VueSelectPrintHtml
            v-model:printHtmlId="ticketRadiology.printHtmlId"
            :printHtmlType="PrintHtmlType.RadiologyResult"
            @selectPrintHtml="selectPrintHtml"
            removeLabelWrapper
          />
        </div>
        <div class="mt-3">
          <div>Hình ảnh</div>
          <ImageUploadCloudinary
            ref="imageUploadMultipleRef"
            :height="100"
            :oid="organization.id"
            :customerId="ticketRadiology.customerId"
            :editable="editable"
            @changeImage="handleChangeImage"
            @loading="(v) => (loadingImage = v)"
            :rootImageList="
              (ticketRadiology.imageList || []).map((i: Image) => ({
                thumbnail: ESImage.getImageLink(i, { size: 200 }),
                enlarged: ESImage.getImageLink(i, { size: 1000 }),
                id: i.id,
              }))
            "
          />
        </div>

        <div class="mt-3">
          <TicketChangeTicketUserPosition
            ref="ticketChangeTicketUserPosition"
            v-model:ticketUserList="ticketRadiology.ticketUserResultList!"
            :positionType="PositionType.RadiologyResult"
            :positionInteractId="ticketRadiology.radiologyId"
            @fix:ticketUserList="handleFixTicketUserResultList"
            title="Nhân viên trả kết quả"
          />
        </div>
      </div>
    </div>

    <div class="mt-6 flex flex-wrap justify-end gap-4">
      <VueButton
        v-if="ticketRadiology.status === TicketRadiologyStatus.Completed"
        icon="close"
        color="red"
        @click="clickCancelResult"
      >
        Hủy kết quả
      </VueButton>
      <VueButton
        v-if="ticketRadiology.status === TicketRadiologyStatus.Pending"
        icon="close"
        color="red"
        @click="resetResult"
      >
        Reset
      </VueButton>
      <VueButton
        style="margin-left: auto"
        color="blue"
        type="button"
        @click="clickOpenModalSaveRadiologySample"
        icon="plus"
      >
        Lưu KQ mẫu
      </VueButton>
      <VueButton
        v-if="editable"
        :loading="saveLoading"
        color="blue"
        type="button"
        @click="updateResult({ print: true })"
        :disabled="!hasChangeData || loadingImage"
        icon="print"
      >
        Lưu và In
      </VueButton>
      <VueButton
        v-if="editable"
        :disabled="!hasChangeData || loadingImage"
        :loading="saveLoading"
        color="blue"
        type="submit"
        icon="save"
      >
        Lưu kết quả
      </VueButton>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
