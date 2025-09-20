<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { PositionType } from '@/modules/position'
import { TicketChangeProcedureApi } from '@/modules/ticket'
import { TicketRegimen } from '@/modules/ticket-regimen'
import { TicketUser } from '@/modules/ticket-user'
import TicketChangeTicketUserPosition from '@/views/room/room-user/TicketChangeTicketUserPosition.vue'
import { computed, ref } from 'vue'

const ticketChangeTicketUserPosition = ref<InstanceType<typeof TicketChangeTicketUserPosition>>()

const emit = defineEmits<{
  (e: 'success', data: TicketRegimen): void
}>()

let ticketRegimenOrigin = TicketRegimen.blank()
const ticketRegimen = ref<TicketRegimen>(TicketRegimen.blank())

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (data: { ticketRegimen: TicketRegimen }) => {
  ticketRegimenOrigin = data.ticketRegimen
  ticketRegimen.value = TicketRegimen.from(data.ticketRegimen)

  showModal.value = true
}

const hasChangeData = computed(() => {
  const result = !TicketUser.equalList(
    ticketRegimenOrigin.ticketUserRequestList || [],
    ticketRegimen.value.ticketUserRequestList || [],
  )
  return result
})

const closeModal = () => {
  showModal.value = false
  ticketRegimen.value = TicketRegimen.blank()
  ticketRegimenOrigin = TicketRegimen.blank()
}

const handleSave = async () => {
  try {
    if (ticketRegimen.value.id) {
      const ticketRegimenResponse = await TicketChangeProcedureApi.updateUserRequestTicketRegimen({
        ticketId: ticketRegimen.value.ticketId,
        ticketRegimenId: ticketRegimen.value.id,
        ticketUserRequestList: ticketRegimen.value.ticketUserRequestList || [],
      })
      Object.assign(ticketRegimen.value, ticketRegimenResponse)
    }
    emit('success', ticketRegimen.value)
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalTicketRegimenUpdateUser.vue:58 ~ handleSave ~ error:', error)
  }
}

const handleFixTicketUserList = (tuListData: TicketUser[]) => {
  ticketRegimenOrigin.ticketUserRequestList = TicketUser.fromList(tuListData)
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ ticketRegimen.regimen?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 gap-4" @submit.prevent="(e) => handleSave()">
        <div class="">
          <TicketChangeTicketUserPosition
            ref="ticketChangeTicketUserPosition"
            v-model:ticketUserList="ticketRegimen.ticketUserRequestList!"
            :positionType="PositionType.RegimenRequest"
            :positionInteractId="ticketRegimen.regimenId"
            @fix:ticketUserList="handleFixTicketUserList"
            title="Nhân viên tư vấn, chỉ định liệu trình"
          />
        </div>

        <div style="flex-grow: 1; flex-basis: 80%" class="mt-6 flex gap-4">
          <VueButton style="margin-left: auto" type="reset" icon="close" @click="closeModal">
            Đóng lại
          </VueButton>
          <VueButton
            :disabled="!hasChangeData || !ticketRegimen.ticketUserRequestList?.length"
            :loading="saveLoading"
            color="blue"
            type="submit"
            icon="save"
          >
            Cập nhật
          </VueButton>
        </div>
      </form>
    </div>
  </VueModal>
</template>
<style lang="scss" scope></style>
