<script setup lang="ts">
import { IconDoorOpen } from '@/common/icon-google'
import { PermissionId } from '@/modules/permission/permission.enum'
import { RoomInteractType, RoomService } from '@/modules/room'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IconApartment } from '../../common/icon-antd'
import { MeService } from '../../modules/_me/me.service'
import Breadcrumb from '../component/Breadcrumb.vue'

const router = useRouter()

const { organizationPermission, userPermission, roomIdMap } = MeService
const roomList = RoomService.roomList

onMounted(async () => {
  await RoomService.getAll()
})
</script>

<template>
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
  </div>
  <div class="mt-4 mx-4 bg-white">
    <div class="p-4 flex flex-wrap gap-4">
      <div class="card" @click="router.push({ name: 'ReceptionTicketList' })">
        <div class="card-icon">
          <IconDoorOpen />
        </div>
        <div class="card-content">
          <div class="card-title">Tiếp đón</div>
          <div class="card-description"></div>
        </div>
      </div>
      <div
        v-if="userPermission[PermissionId.APPOINTMENT_MENU]"
        class="card"
        @click="router.push({ name: 'AppointmentList' })"
      >
        <div class="card-icon">
          <IconDoorOpen />
        </div>
        <div class="card-content">
          <div class="card-title">Danh sách Hẹn</div>
          <div class="card-description"></div>
        </div>
      </div>
      <template v-for="room in roomList" :key="room.id">
        <div
          v-if="roomIdMap[room.id] && room.roomInteractType === RoomInteractType.Ticket"
          class="card"
          @click="router.push({ name: 'RoomTicket', params: { roomId: room.id } })"
        >
          <div class="card-icon">
            <IconApartment />
          </div>
          <div class="card-content">
            <div class="card-title">{{ room.name }}</div>
            <div class="card-description"></div>
          </div>
        </div>
        <div
          v-if="roomIdMap[room.id] && room.roomInteractType === RoomInteractType.Laboratory"
          class="card"
          @click="router.push({ name: 'RoomLaboratory', params: { roomId: room.id } })"
        >
          <div class="card-icon">
            <IconApartment />
          </div>
          <div class="card-content">
            <div class="card-title">{{ room.name }}</div>
            <div class="card-description"></div>
          </div>
        </div>
        <div
          v-if="roomIdMap[room.id] && room.roomInteractType === RoomInteractType.Radiology"
          class="card"
          @click="router.push({ name: 'RoomRadiology', params: { roomId: room.id } })"
        >
          <div class="card-icon">
            <IconApartment />
          </div>
          <div class="card-content">
            <div class="card-title">{{ room.name }}</div>
            <div class="card-description"></div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card {
  flex-grow: 1;
  flex-basis: 20%;
  min-width: 300px;
  padding: 1em;
  gap: 1em;
  display: flex;
  // align-items: center;
  background-color: #e6f4ff;
  cursor: pointer;
  .card-icon {
    font-size: 24px;
    color: #1677ff;
  }
  .card-content {
    .card-title {
      font-weight: 500;
    }
    .card-description {
      margin-top: 0.5em;
      color: #555;
      font-size: 0.9em;
    }
  }
}
</style>
