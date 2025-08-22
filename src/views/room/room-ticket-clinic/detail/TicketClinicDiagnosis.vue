<script lang="ts" setup>
import { Room, RoomInteractType, RoomService, RoomTicketStyle } from '@/modules/room'
import TicketDiagnosisGeneral from '@/views/room/room-ticket-base/diagnosis/TicketDiagnosisGeneral.vue'
import TicketClinicDiagnosisObstetric from './diagnosis/TicketClinicDiagnosisObstetric.vue'
import TicketClinicDiagnosisEyeBasic from './diagnosis/TicketClinicDiagnosisEyeBasic.vue'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const roomMap = RoomService.roomMap
const currentRoom = ref<Room>(Room.blank())

watch(
  () => route.params.roomId,
  async (newValue) => {
    const roomId = Number(newValue) || 0
    await RoomService.getMap()
    currentRoom.value = roomMap.value[roomId]
    if (!currentRoom.value) {
      currentRoom.value = Room.blank()
      currentRoom.value.isCommon = 1
      currentRoom.value.roomInteractType = RoomInteractType.Ticket
    }
  },
  { immediate: true },
)
</script>

<template>
  <TicketDiagnosisGeneral v-if="currentRoom.roomStyle === RoomTicketStyle.TicketClinicGeneral" />
  <TicketClinicDiagnosisObstetric
    v-else-if="currentRoom.roomStyle === RoomTicketStyle.TicketClinicObstetric"
  />
  <TicketClinicDiagnosisEyeBasic v-else-if="currentRoom.roomStyle === RoomTicketStyle.TicketClinicEye" />
  <TicketDiagnosisGeneral v-else />
</template>
