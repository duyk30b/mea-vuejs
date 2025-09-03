<script lang="ts" setup>
import { VueButton } from '@/common'
import { InputText } from '@/common/vue-form'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PositionType } from '@/modules/position'
import { Procedure, ProcedureService, ProcedureType } from '@/modules/procedure'
import { ticketRoomRef } from '@/modules/room'
import { TicketChangeProcedureApi, TicketStatus } from '@/modules/ticket'
import { TicketProcedure } from '@/modules/ticket-procedure'
import type { TicketUser } from '@/modules/ticket-user'
import { ESString } from '@/utils'
import { onMounted, ref } from 'vue'
import TableTicketProcedureListRequest from '../../room-procedure/TableTicketProcedureListRequest.vue'

const tableTicketProcedureListRequest = ref<InstanceType<typeof TableTicketProcedureListRequest>>()

const emit = defineEmits<{ (e: 'addTicketProcedureList', value: TicketProcedure[]): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const searchText = ref('')
const procedureFilter = ref<Procedure[]>([])
const procedureIdCheckbox = ref<Record<string, boolean>>({})
const ticketProcedureListDraft = ref<TicketProcedure[]>([])
const ticketUserTree = ref<Record<string, Record<string, Record<string, TicketUser[]>>>>({
  [PositionType.ProcedureRequest]: { 0: { 0: [] } },
}) // ticketUserTree[positionType][ticketItemId][ticketItemChildId] = []

const { userPermission } = MeService

const saveLoading = ref(false)

onMounted(async () => {
  await ProcedureService.getAll()
  startFilterProcedure('')
})

const reset = () => {
  searchText.value = ''
  startFilterProcedure('')
  procedureIdCheckbox.value = {}
  ticketProcedureListDraft.value = []
  ticketUserTree.value = { [PositionType.ProcedureRequest]: { 0: { 0: [] } } }
}

const startFilterProcedure = (text: string) => {
  procedureFilter.value = ProcedureService.procedureAll.value.filter((l) => {
    if (!ESString.customFilter(l.name, text, 2)) return false
    return true
  })
}

const handleChangeCheckboxProcedure = async (checked: boolean, procedureData: Procedure) => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.value.status)) {
    return
  }

  procedureIdCheckbox.value[procedureData.id] = checked

  const findIndex = ticketProcedureListDraft.value.findIndex((i) => {
    return i.procedureId === procedureData.id
  })

  if (checked) {
    if (findIndex == -1) {
      tableTicketProcedureListRequest.value?.selectProcedure(procedureData)
    }
  }
  if (!checked) {
    if (findIndex != -1) {
      ticketProcedureListDraft.value.splice(findIndex, 1)
      const currentTp = ticketProcedureListDraft.value[findIndex]
      ticketUserTree.value[PositionType.ProcedureRequest][currentTp._localId] = {}
    }
  }
}

const handleSave = async () => {
  emit('addTicketProcedureList', ticketProcedureListDraft.value)

  try {
    saveLoading.value = true
    await TicketChangeProcedureApi.addTicketProcedureList({
      ticketId: ticketRoomRef.value.id,
      ticketProcedureWrapList: ticketProcedureListDraft.value.map((i) => {
        return {
          ticketProcedure: i,
          ticketProcedureItemList: i.ticketProcedureItemList || [],
          ticketUserRequestList: ticketUserTree.value[PositionType.ProcedureRequest][i._localId][0],
        }
      }),
    })
    reset()
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicProcedure.vue:76 ~ handleAddTicketProcedure:', error)
  } finally {
    saveLoading.value = false
  }
}
</script>
<template>
  <div class="mt-4 flex flex-wrap gap-4">
    <div style="flex-basis: 300px; flex-grow: 1; position: relative; min-height: 300px">
      <div
        class="flex flex-col shadow-sm"
        style="
          border-right: 1px solid #eee;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        "
      >
        <div class="flex-0">
          <InputText
            v-model:value="searchText"
            prepend="🔎"
            placeholder="Tìm kiếm theo tên xét nghiệm"
            @update:value="startFilterProcedure"
          />
        </div>
        <div class="table-wrapper flex-1" style="overflow-y: scroll">
          <table>
            <tbody>
              <tr
                v-for="procedure in procedureFilter"
                :key="procedure.id"
                @click="
                  handleChangeCheckboxProcedure(!procedureIdCheckbox[procedure.id], procedure)
                "
                style="cursor: pointer"
              >
                <td style="user-select: none" class="text-center">
                  <input
                    type="checkbox"
                    :checked="!!procedureIdCheckbox[procedure.id]"
                    style="cursor: pointer"
                    :disabled="
                      [TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status)
                    "
                  />
                </td>
                <td style="user-select: none">
                  <span>{{ procedure.name }}</span>
                  <span v-if="procedure?.procedureType === ProcedureType.Regimen" class="font-bold">
                    ({{ procedure.totalSessions }} buổi)
                  </span>
                </td>
                <td class="text-right">{{ formatMoney(procedure.price) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      style="flex-basis: 300px; max-width: 100%; flex-grow: 5; border-bottom: 1px solid #eee"
      class="flex flex-col"
    >
      <TableTicketProcedureListRequest
        ref="tableTicketProcedureListRequest"
        :ticketProcedureListRequest="ticketProcedureListDraft"
        :ticketUserTree="ticketUserTree"
        @removeProcedureId="(procedureId) => (procedureIdCheckbox[procedureId] = false)"
      />

      <div class="my-3 flex justify-center">
        <VueButton
          :disabled="
            [TicketStatus.Completed, TicketStatus.Debt].includes(ticketRoomRef.status) ||
            !userPermission[PermissionId.TICKET_CHANGE_PROCEDURE]
          "
          color="blue"
          icon="save"
          @click="handleSave"
          :loading="saveLoading"
        >
          Lưu lại
        </VueButton>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scope></style>
