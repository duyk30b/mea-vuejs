<script setup lang="ts">
import { computed, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { InputRadio, InputSelect, InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import {
  Room,
  RoomType,
  RoomTypeText,
  RoomTicketStyle,
  RoomTicketStyleText,
} from '../../../modules/room'
import { RoomService } from '../../../modules/room/room.service'
import { MeService } from '../../../modules/_me/me.service'
import { AlertStore } from '@/common/vue-alert'
import InputCheckboxUserList from '@/views/component/InputCheckboxUserList.vue'
import { CONFIG } from '@/config'
import { ESArray, ESTypescript } from '@/utils'

const emit = defineEmits<{
  (e: 'success', value: Room, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const { userPermission, organizationPermission } = MeService

const roomOrigin = ref(Room.blank())
const room = ref(Room.blank())
const userIdListOrigin = ref<number[]>([])
const userIdList = ref<number[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const roomTicketStyleOptions = ESTypescript.keysEnum(RoomTicketStyle).map((key) => ({
  value: RoomTicketStyle[key],
  label: RoomTicketStyleText[RoomTicketStyle[key]],
}))

const openModal = async (roomId?: number) => {
  showModal.value = true
  if (roomId) {
    roomOrigin.value = await RoomService.detail(
      roomId,
      { relation: { userRoomList: { user: false } } },
      { query: true },
    )
    userIdListOrigin.value = roomOrigin.value.userRoomList!.map((i) => i.userId)
  } else {
    roomOrigin.value = Room.blank()
    userIdListOrigin.value = []
  }
  room.value = Room.from(roomOrigin.value)
  userIdList.value = [...userIdListOrigin.value]
}

const closeModal = () => {
  room.value = Room.blank()
  userIdListOrigin.value = []
  userIdList.value = []
  showModal.value = false
}

const hasChangeUserIdList = computed(() => {
  if (!ESArray.equal(userIdListOrigin.value, userIdList.value)) {
    return true
  }
  return false
})

const hasChangeData = computed(() => {
  if (!Room.equal(roomOrigin.value, room.value)) {
    return true
  }
  if (hasChangeUserIdList.value) {
    return true
  }
  return false
})

const handleUpdateRoomStyle = (v: any) => {
  if (!room.value.name) {
    room.value.name = RoomTicketStyleText[room.value.roomStyle]
  }
}

const handleSave = async () => {
  if (!room.value.roomType) {
    return AlertStore.addError('Lỗi: Chưa chọn loại phòng')
  }
  try {
    saveLoading.value = true
    if (!room.value.id) {
      const response = await RoomService.createOne({
        room: room.value,
        userIdList: userIdList.value,
      })
      emit('success', response, 'CREATE')
    } else {
      const response = await RoomService.updateOne(room.value.id, {
        room: room.value,
        userIdList: hasChangeUserIdList.value ? userIdList.value : undefined,
      })
      emit('success', response, 'UPDATE')
    }
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: RoomUpsert.vue:46 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa kho hàng này',
    content: 'Phòng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await RoomService.destroyOne(room.value.id)
        if (response.success) {
          emit('success', room.value, 'DESTROY')
          closeModal()
        } else {
          ModalStore.alert({
            title: 'Không thể xóa phòng có chứa các phiếu tiếp đón',
            content: [
              'Nếu bắt buộc phải xóa, bạn cần phải xóa tất cả phiếu tiếp đón này trước',
              `Các phiếu liên quan: ${response.ticketList.map((i) => i.id).join(', ')} ...`,
              'Bạn có thể dùng chức năng "Gộp phòng" để chuyển tất cả các phiếu của phòng này sang phòng khác',
            ],
          })
        }
      } catch (error) {
        console.log("🚀 ~ ModalRoomUpsert.vue:137 ~ clickDelete ~ error:", error)
      }
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" @close="closeModal">
    <form class="bg-white" @submit.prevent="(e) => handleSave()">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ room.id ? 'Cập nhật phòng' : 'Tạo phòng mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4 flex flex-wrap gap-4">
        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div>Tên phòng</div>
          <div>
            <InputText v-model:value="room.name" required />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div class="">Mã phòng</div>
          <div class="">
            <InputText v-model:value="room.code" placeholder="Tạo tự động" />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div>Loại phòng</div>
          <div>
            <InputSelect
              v-model:value="room.roomType"
              required
              :disabled="!!room.id"
              :options="[
                {
                  value: RoomType.Ticket,
                  label: RoomTypeText[RoomType.Ticket],
                },
                {
                  value: RoomType.Product,
                  label: RoomTypeText[RoomType.Product],
                },
                ...(organizationPermission[PermissionId.PROCEDURE]
                  ? [
                      {
                        value: RoomType.Procedure,
                        label: RoomTypeText[RoomType.Procedure],
                      },
                    ]
                  : []),
                ...(organizationPermission[PermissionId.LABORATORY]
                  ? [
                      {
                        value: RoomType.Laboratory,
                        label: RoomTypeText[RoomType.Laboratory],
                      },
                    ]
                  : []),
                ...(organizationPermission[PermissionId.RADIOLOGY]
                  ? [
                      {
                        value: RoomType.Radiology,
                        label: RoomTypeText[RoomType.Radiology],
                      },
                    ]
                  : []),
              ]"
            ></InputSelect>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div>Kiểu phòng</div>
          <div v-if="room.roomType === RoomType.Ticket">
            <InputSelect
              v-model:value="room.roomStyle"
              required
              :options="roomTicketStyleOptions"
              @update:value="handleUpdateRoomStyle"
            ></InputSelect>
          </div>
          <div v-else>
            <InputText :value="''" disabled />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px" class="flex flex-wrap">
          <div style="width: 120px">Chức năng:</div>
          <div style="flex: 1">
            <InputRadio
              v-model:value="room.isCommon"
              :options="[
                { key: 1, label: 'Phòng chung' },
                { key: 0, label: 'Phòng lẻ' },
              ]"
            />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px" class="flex flex-wrap">
          <div class="w-[120px] flex-none">
            <div>Tài khoản</div>
            <div v-if="CONFIG.MODE === 'development'" style="color: violet">
              {{ JSON.stringify(userIdList) }}
            </div>
          </div>
          <InputCheckboxUserList v-model:userIdList="userIdList" />
        </div>
      </div>

      <div class="p-4 mt-4">
        <div class="flex gap-4">
          <VueButton
            v-if="userPermission[PermissionId.MASTER_DATA_WAREHOUSE] && room.id"
            color="red"
            @click="clickDelete"
          >
            Xóa
          </VueButton>
          <VueButton type="reset" style="margin-left: auto" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton
            color="blue"
            type="submit"
            :loading="saveLoading"
            icon="save"
            :disabled="!hasChangeData"
          >
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss" scoped></style>
