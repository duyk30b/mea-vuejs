<script setup lang="ts">
import IconRight from '@/common/icon-antd/IconRight.vue'
import ImageUploadMultiple from '@/common/image-upload/ImageUploadMultiple.vue'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputDate, InputFilter } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputOptionsValue.vue'
import InputText from '@/common/vue-form/InputText.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import VueButton from '@/common/VueButton.vue'
import VueTinyMCE from '@/common/VueTinyMCE.vue'
import { MeService } from '@/modules/_me/me.service'
import { Image, ImageHost } from '@/modules/image/image.model'
import { PositionInteractType, PositionService } from '@/modules/position'
import { PrintHtml, PrintHtmlService } from '@/modules/print-html'
import { RadiologyService } from '@/modules/radiology'
import { RadiologySample } from '@/modules/radiology-sample'
import { RoleService } from '@/modules/role'
import {
  TicketRadiology,
  TicketRadiologyApi,
  TicketRadiologyStatus,
} from '@/modules/ticket-radiology'
import { TicketUser } from '@/modules/ticket-user'
import { User, UserService } from '@/modules/user'
import { UserRoleService } from '@/modules/user-role'
import { ESString } from '@/utils'
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import InputSearchRadiologySample from '@/views/component/InputSearchRadiologySample.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalSaveRadiologySample from '../modal/ModalSaveRadiologySample.vue'
import TicketRadiologyStatusTag from '../TicketRadiologyStatusTag.vue'
import { PrintHtmlAction } from '@/modules/print-html/print-html.action'
import InputSearchPrintHtml from '@/views/component/InputSearchPrintHtml.vue'
import VueSelectPrintHtml from '@/views/component/VueSelectPrintHtml.vue'

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

const imageUploadMultipleRef = ref<InstanceType<typeof ImageUploadMultiple>>()
const modalSaveRadiologySample = ref<InstanceType<typeof ModalSaveRadiologySample>>()

const { userPermission, organization } = MeService
const ticketRadiologyOrigin = ref<TicketRadiology>(TicketRadiology.blank())
const ticketRadiology = ref<TicketRadiology>(TicketRadiology.blank())
const hasChangeImageList = ref(false)

watch(
  () => props.ticketRadiologyProp,
  async (newValue) => {
    ticketRadiologyOrigin.value = TicketRadiology.from(newValue)
    if (!ticketRadiologyOrigin.value.startedAt) {
      ticketRadiologyOrigin.value.startedAt = Date.now()
    }

    ticketRadiology.value = TicketRadiology.from(ticketRadiologyOrigin.value)

    const { radiologyId } = ticketRadiology.value
    ticketRadiology.value.radiology = await RadiologyService.detail(radiologyId, {
      relation: { radiologyGroup: true },
    })
    await refreshTicketUserList()
  },
)

const roleMap = RoleService.roleMap
const radiologyMap = RadiologyService.radiologyMap

const ticketUserList = ref<TicketUser[]>([])
const ticketUserListOrigin = ref<TicketUser[]>([])

const userRoleMapRoleIdOptions = ref<Record<string, { value: number; text: string; data: User }[]>>(
  {},
)
const saveLoading = ref(false)

const refreshTicketUserList = async () => {
  ticketUserListOrigin.value = []
  const ticketUserListRef = ticketRadiology.value.ticketUserList || []

  const positionList = await PositionService.list({
    filter: {
      positionType: PositionInteractType.Radiology,
      positionInteractId: ticketRadiology.value.radiologyId,
    },
  })

  // lấy tất cả role có trong commission trước
  positionList.forEach((i) => {
    const findExist = ticketUserListRef.find((j) => j.roleId === i.roleId)
    if (findExist) {
      ticketUserListOrigin.value.push(TicketUser.from(findExist))
    } else {
      const ticketUserBlank = TicketUser.blank()
      ticketUserBlank.roleId = i.roleId
      ticketUserListOrigin.value.push(ticketUserBlank)
    }
  })

  // lấy role còn thừa ra ở trong ticketUser vẫn phải hiển thị
  ticketUserListRef.forEach((i) => {
    const findExist = ticketUserListOrigin.value.find((j) => j.roleId === i.roleId)
    if (findExist) {
      return // nếu đã có rồi thì bỏ qua
    } else {
      ticketUserListOrigin.value.push(TicketUser.from(i))
    }
  })
  ticketUserList.value = TicketUser.fromList(ticketUserListOrigin.value)
}

const hasChangeTicketRadiology = computed(() => {
  return !TicketRadiology.equal(ticketRadiologyOrigin.value, ticketRadiology.value)
})

const hasChangeTicketUserList = computed(() => {
  const result = !TicketUser.equalList(ticketUserListOrigin.value, ticketUserList.value)
  return result
})

const handleChangeImage = () => {
  hasChangeImageList.value = true
}

const hasChangeDate = computed(() => {
  if (hasChangeTicketRadiology.value) return true
  if (hasChangeTicketUserList.value) return true
  if (hasChangeImageList.value) return true

  return false
})

onMounted(async () => {
  try {
    const fetchPromise = await Promise.all([
      RadiologyService.getMap(),
      RoleService.getMap(),
      UserService.getMap(),
      UserRoleService.list(),
    ])

    const userMap = fetchPromise[2]
    const userRoleList = fetchPromise[3]

    userRoleList.forEach((i) => {
      const key = i.roleId
      if (!userRoleMapRoleIdOptions.value[key]) {
        userRoleMapRoleIdOptions.value[key] = []
      }
      userRoleMapRoleIdOptions.value[key].push({
        value: userMap[i.userId]?.id || 0,
        text: userMap[i.userId]?.fullName || '',
        data: userMap[i.userId],
      })
    })
  } catch (error: any) {
    console.log('🚀 ~ file: ModalTicketRadiologyResult.vue:108 ~ onMounted ~ error:', error)
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const updateResult = async (options: { print: boolean }) => {
  try {
    saveLoading.value = true
    const { filesPosition, imageIdsKeep, files } = imageUploadMultipleRef.value?.getData() || {
      filesPosition: [],
      imageIdsKeep: [],
      files: [],
    }

    const ticketRadiologyUpdate = await TicketRadiologyApi.updateResult({
      ticketRadiologyId: ticketRadiology.value.id,
      ticketRadiology: ticketRadiology.value,
      imageIdsKeep,
      files,
      filesPosition,
      ticketUserList: hasChangeTicketUserList.value ? ticketUserList.value : undefined,
      response: {
        ticketRadiology: options.print
          ? { ticket: true, customer: true, imageList: true, ticketUserList: true }
          : {},
      },
    })

    if (options.print) {
      ticketRadiologyUpdate.radiology = ticketRadiology.value.radiology
      ticketRadiologyUpdate.ticket = ticketRadiology.value.ticket
      await PrintHtmlAction.startPrintResultTicketRadiology({
        ticketRadiologyData: ticketRadiologyUpdate,
        organization: organization.value,
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
  ticketRadiology.value.description = radiologyDefault.descriptionDefault
  ticketRadiology.value.result = radiologyDefault.resultDefault
  ticketRadiology.value.customStyles = radiologyDefault.customStyles
  ticketRadiology.value.customVariables = radiologyDefault.customVariables
  ticketRadiology.value.startedAt = null as any
}

const clickCancelResult = async () => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn hủy kết quả này ?',
    content: 'Trạng thái của phiếu sẽ trở về: "Đợi kết quả" ?',
    onOk: async () => {
      try {
        saveLoading.value = true
        const radiologyDefault = radiologyMap.value[ticketRadiology.value.radiologyId]
        const ticketRadiologyUpdate = await TicketRadiologyApi.cancelResult(
          ticketRadiology.value.id,
          {
            printHtmlId: radiologyDefault?.printHtmlId || 0,
            description: radiologyDefault?.descriptionDefault || '',
            result: radiologyDefault?.resultDefault || '',
            customStyles: radiologyDefault?.customStyles || '',
            customVariables: radiologyDefault?.customVariables || '',
          },
        )

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
    organization: organization.value,
    customer: ticketRadiology.value.customer!,
    ticket: ticketRadiology.value.ticket!,
    ticketRadiologyData: ticketRadiology.value,
  })
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
              v-model:value="ticketRadiology.startedAt"
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
            @selectPrintHtml="selectPrintHtml"
            removeLabelWrapper
          />
        </div>
        <div class="mt-3">
          <div>Hình ảnh</div>
          <ImageUploadMultiple
            ref="imageUploadMultipleRef"
            :height="100"
            :editable="editable"
            @changeImage="handleChangeImage"
            :rootImageList="
              (ticketRadiology.imageList || [])
                .filter((i: Image) => i.hostType === ImageHost.GoogleDriver)
                .map((i: Image) => ({
                  thumbnail: `https://drive.google.com/thumbnail?id=${i.hostId}&amp;sz=w200`,
                  enlarged: `https://drive.google.com/thumbnail?id=${i.hostId}&amp;sz=w1000`,
                  id: i.id,
                }))
            "
          />
        </div>
        <div v-if="ticketUserList.length" class="mt-4 flex flex-wrap gap-4">
          <div
            v-for="(ticketUser, index) in ticketUserList"
            :key="index"
            style="flex-basis: 45%; flex-grow: 1; min-width: 300px"
          >
            <div>{{ roleMap[ticketUser.roleId]?.name || '' }}</div>
            <div>
              <InputFilter
                v-model:value="ticketUserList[index].userId"
                :options="userRoleMapRoleIdOptions[ticketUser.roleId] || []"
                :maxHeight="200"
                placeholder="Tìm kiếm bằng tên hoặc SĐT của nhân viên"
              >
                <template #option="{ item: { data } }">
                  <div>
                    <b>{{ data.fullName }}</b>
                    - {{ ESString.formatPhone(data.phone) }} -
                  </div>
                </template>
              </InputFilter>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 flex justify-end gap-4">
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
        :disabled="!hasChangeDate"
        icon="print"
      >
        Lưu và In
      </VueButton>
      <VueButton
        v-if="editable"
        :disabled="!hasChangeDate"
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
