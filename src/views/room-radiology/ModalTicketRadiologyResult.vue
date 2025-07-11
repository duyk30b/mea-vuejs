<script setup lang="ts">
import { IconClose } from '@/common/icon-antd'
import ImageUploadMultiple from '@/common/image-upload/ImageUploadMultiple.vue'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputDate, InputFilter } from '@/common/vue-form'
import InputText from '@/common/vue-form/InputText.vue'
import VueModal from '@/common/vue-modal/VueModal.vue'
import VueButton from '@/common/VueButton.vue'
import VueTinyMCE from '@/common/VueTinyMCE.vue'
import { MeService } from '@/modules/_me/me.service'
import { Image, ImageHost } from '@/modules/image/image.model'
import { PositionService, PositionInteractType } from '@/modules/position'
import { compiledTemplatePrintHtml, PrintHtmlService } from '@/modules/print-html'
import { Radiology, RadiologyService } from '@/modules/radiology'
import { Role, RoleService } from '@/modules/role'
import { TicketClinicRadiologyApi } from '@/modules/ticket-clinic/ticket-clinic-radiology.api'
import { TicketRadiology, TicketRadiologyApi } from '@/modules/ticket-radiology'
import { TicketUser } from '@/modules/ticket-user'
import { User, UserService } from '@/modules/user'
import { UserRoleService } from '@/modules/user-role'
import { DString, ESDom } from '@/utils'
import { computed, onMounted, ref } from 'vue'

const imageUploadMultipleRef = ref<InstanceType<typeof ImageUploadMultiple>>()

const showModal = ref(false)

const { userPermission, organization } = MeService
const ticketRadiology = ref<TicketRadiology>(TicketRadiology.blank())

const roleMap = ref<Record<string, Role>>({})
const radiologyMap = ref<Record<string, Radiology>>({})

const ticketUserList = ref<TicketUser[]>([])
const ticketUserListOrigin = ref<TicketUser[]>([])

const userRoleMapRoleIdOptions = ref<Record<string, { value: number; text: string; data: User }[]>>(
  {},
)
const saveLoading = ref(false)
const editable = ref(true)

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

const hasChangeTicketUserList = computed(() => {
  const result = !TicketUser.equalList(ticketUserListOrigin.value, ticketUserList.value)
  return result
})

onMounted(async () => {
  try {
    const fetchPromise = await Promise.all([
      RadiologyService.getMap(),
      RoleService.getMap(),
      UserService.getMap(),
      UserRoleService.list(),
    ])

    radiologyMap.value = fetchPromise[0]
    roleMap.value = fetchPromise[1]
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

const openModal = async (ticketRadiologyId: number, options?: { noEdit: boolean }) => {
  showModal.value = true
  const ticketRadiologyResponse = await TicketRadiologyApi.detail(ticketRadiologyId, {
    relation: { imageList: true, ticketUserList: true },
  })
  ticketRadiology.value = ticketRadiologyResponse
  if (ticketRadiology.value.startedAt == null) {
    const radiologyId = ticketRadiology.value.radiologyId
    ticketRadiology.value.description = radiologyMap.value[radiologyId]?.descriptionDefault || ''
    ticketRadiology.value.result = radiologyMap.value[radiologyId]?.resultDefault || ''
  }
  ticketRadiology.value.startedAt = Date.now()

  editable.value = !options?.noEdit

  await refreshTicketUserList()
}

const closeModal = () => {
  showModal.value = false
  ticketRadiology.value = TicketRadiology.blank()
  ticketUserList.value = []
  ticketUserListOrigin.value = []
}

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
      await PrintHtmlService.startPrintResultTicketRadiology({
        ticketRadiologyData: ticketRadiologyUpdate,
        organization: organization.value,
      })
    }

    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalTicketRadiologyResult.vue:171 ~ updateResult ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const cancelResult = async () => {
  try {
    saveLoading.value = true
    await TicketRadiologyApi.cancelResult({
      ticketRadiologyId: ticketRadiology.value.id,
    })
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ~ updateResult ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 1200px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ radiologyMap[ticketRadiology.radiologyId]?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4" @submit.prevent="updateResult({ print: false })">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1">
            <div>Thời gian thực hiện</div>
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
          <!-- <div class="flex-1">
            <div>BS thực hiện</div>
            <div>
              <InputText disabled :value="ticketRadiology.doctor?.fullName" />
            </div>
          </div> -->
        </div>
        <div class="mt-3">
          <div>Mô tả</div>
          <div style="height: 400px">
            <VueTinyMCE v-model="ticketRadiology.description" menu-bar />
          </div>
        </div>
        <div class="mt-3">
          <div>Hình ảnh</div>
          <ImageUploadMultiple
            ref="imageUploadMultipleRef"
            :height="100"
            :editable="editable"
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
        <div class="mt-3">
          <div>Kết luận</div>
          <div>
            <InputText v-model:value="ticketRadiology.result" :disabled="!editable" />
          </div>
        </div>

        <div v-if="ticketUserList.length" class="mt-3 flex flex-wrap gap-3">
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
                    - {{ DString.formatPhone(data.phone) }} -
                  </div>
                </template>
              </InputFilter>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Đóng lại</VueButton>
          <VueButton icon="close" color="red" @click="cancelResult">Hủy kết quả</VueButton>
          <VueButton
            style="margin-left: auto"
            v-if="editable"
            :loading="saveLoading"
            color="blue"
            type="button"
            @click="updateResult({ print: true })"
            icon="print"
          >
            Lưu và In
          </VueButton>
          <VueButton v-if="editable" :loading="saveLoading" color="blue" type="submit" icon="save">
            Lưu kết quả
          </VueButton>
        </div>
      </form>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
