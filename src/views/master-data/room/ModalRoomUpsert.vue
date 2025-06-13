<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { InputRadio, InputSelect, InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Room, RoomInteractType, RoomInteractTypeText } from '../../../modules/room'
import { RoomService } from '../../../modules/room/room.service'
import { MeService } from '../../../modules/_me/me.service'
import { AlertStore } from '@/common/vue-alert'

const emit = defineEmits<{
  (e: 'success', value: Room, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const mode = ref<'UPDATE' | 'CREATE'>('CREATE')

const { userPermission, organizationPermission } = MeService

const showModal = ref(false)
const room = ref(Room.blank())
const saveLoading = ref(false)

const openModal = async (roomId?: number) => {
  showModal.value = true
  if (roomId) {
    room.value = await RoomService.detail(roomId)
  } else {
    room.value = Room.blank()
  }
}

const closeModal = () => {
  room.value = Room.blank()
  showModal.value = false
}

const handleSave = async () => {
  if (!room.value.roomInteractType) {
    return AlertStore.addError('Lỗi: Chưa chọn loại phòng')
  }
  try {
    saveLoading.value = true
    if (!room.value.id) {
      const response = await RoomService.createOne({ room: room.value })
      emit('success', response, 'CREATE')
    } else {
      const response = await RoomService.updateOne(room.value.id, { room: room.value })
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
    content: 'Kho hàng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await RoomService.destroyOne(room.value.id)
        if (response.success) {
          emit('success', room.value, 'DESTROY')
          closeModal()
        }
      } catch (error) {
        console.log('🚀 ~ file: ModalRoomUpsert.vue:76 ~ clickDelete ~ error:', error)
      }
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="(e) => handleSave()">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ room.id ? 'Cập nhật kho hàng' : 'Tạo kho hàng mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="">
          <div>Loại phòng</div>
          <div>
            <div>
              <InputSelect
                v-model:value="room.roomInteractType"
                required
                :disabled="!!room.id"
                :options="[
                  {
                    value: RoomInteractType.Ticket,
                    label: RoomInteractTypeText[RoomInteractType.Ticket],
                  },
                  {
                    value: RoomInteractType.Product,
                    label: RoomInteractTypeText[RoomInteractType.Product],
                  },
                  ...(organizationPermission[PermissionId.PROCEDURE]
                    ? [
                        {
                          value: RoomInteractType.Procedure,
                          label: RoomInteractTypeText[RoomInteractType.Procedure],
                        },
                      ]
                    : []),
                  ...(organizationPermission[PermissionId.LABORATORY]
                    ? [
                        {
                          value: RoomInteractType.Laboratory,
                          label: RoomInteractTypeText[RoomInteractType.Laboratory],
                        },
                      ]
                    : []),
                  ...(organizationPermission[PermissionId.RADIOLOGY]
                    ? [
                        {
                          value: RoomInteractType.Radiology,
                          label: RoomInteractTypeText[RoomInteractType.Radiology],
                        },
                      ]
                    : []),
                ]"
              ></InputSelect>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <div>Tên phòng</div>
          <div>
            <InputText v-model:value="room.name" required />
          </div>
        </div>

        <div class="mt-6 flex">
          <div style="width: 100px">Chức năng:</div>
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

        <div class="mt-6 flex">
          <div style="width: 100px">Menu:</div>
          <div style="flex: 1">
            <InputRadio
              v-model:value="room.showMenu"
              :options="[
                { key: 1, label: 'Hiển thị trên menu' },
                { key: 0, label: 'Không hiển thị' },
              ]"
            />
          </div>
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
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss" scoped></style>
