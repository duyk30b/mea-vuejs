<script setup lang="ts">
import IconRight from '@/common/icon-antd/IconRight.vue'
import { RadiologyService } from '@/modules/radiology'
import { TicketRadiology, TicketRadiologyApi } from '@/modules/ticket-radiology'
import Breadcrumb from '@/views/component/Breadcrumb.vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalSaveRadiologySample from '../modal/ModalSaveRadiologySample.vue'
import TicketRadiologyStatusTag from '../TicketRadiologyStatusTag.vue'
import TicketRadiologyFormResult from './TicketRadiologyFormResult.vue'

const modalSaveRadiologySample = ref<InstanceType<typeof ModalSaveRadiologySample>>()

const showModal = ref(false)

const route = useRoute()
const router = useRouter()

const ticketRadiology = ref<TicketRadiology>(TicketRadiology.blank())
const radiologyMap = RadiologyService.radiologyMap

onMounted(async () => {
  const ticketRadiologyId = route.params.ticketRadiologyId as string
  ticketRadiology.value = await TicketRadiologyApi.detail(ticketRadiologyId, {
    relation: {
      ticket: true,
      customer: true,
      imageList: true,
      ticketUserRequestList: true,
      ticketUserResultList: true,
    },
  })
})

const cancelResultSuccess = (data: TicketRadiology) => {
  Object.assign(ticketRadiology.value, data)
}

const updateResultSuccess = () => {
  router.push({ name: 'RoomRadiology', params: { roomId: route.params.roomId } })
}
</script>

<template>
  <ModalSaveRadiologySample ref="modalSaveRadiologySample" />
  <div class="mx-4 mt-4 gap-4 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2 text-lg font-medium">
        <Breadcrumb />
        <IconRight style="font-size: 0.7em; opacity: 0.5" />
        {{ ticketRadiology.customer?.fullName }}
        <IconRight style="font-size: 0.7em; opacity: 0.5" />
        {{ radiologyMap[ticketRadiology.radiologyId]?.name }}
        <TicketRadiologyStatusTag :status="ticketRadiology.status" />
      </div>
    </div>
    <div class="mr-2 flex items-center gap-4 flex-wrap"></div>
  </div>

  <div class="page-main">
    <TicketRadiologyFormResult
      :ticketRadiologyProp="ticketRadiology"
      :editable="true"
      @cancelResultSuccess="cancelResultSuccess"
      @updateResultSuccess="updateResultSuccess"
    />
  </div>
</template>

<style lang="scss" scoped></style>
