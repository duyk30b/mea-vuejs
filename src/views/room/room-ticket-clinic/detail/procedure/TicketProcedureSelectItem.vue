<script lang="ts" setup>
import { VueButton } from '@/common'
import { AlertStore } from '@/common/vue-alert'
import { InputText } from '@/common/vue-form'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PaymentMoneyStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Procedure, ProcedureService } from '@/modules/procedure'
import { Regimen, RegimenService } from '@/modules/regimen'
import { ticketRoomRef } from '@/modules/room'
import { TicketChangeProcedureApi, TicketStatus } from '@/modules/ticket'
import { TicketProcedure } from '@/modules/ticket-procedure'
import { TicketRegimen } from '@/modules/ticket-regimen'
import { ESString } from '@/utils'
import TableTicketProcedureListRequest from '@/views/room/room-ticket-clinic/detail/procedure/TableTicketProcedureListDraft.vue'
import { computed, onMounted, ref } from 'vue'

const tableTicketProcedureListRequest = ref<InstanceType<typeof TableTicketProcedureListRequest>>()

const emit = defineEmits<{ (e: 'addTicketProcedureList', value: TicketProcedure[]): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const searchText = ref('')
const regimenAll = ref<Regimen[]>([])
const regimenFilter = ref<Regimen[]>([])
const procedureFilter = ref<Procedure[]>([])
const procedureIdCheckbox = ref<Record<string, boolean>>({})
const regimenIdCheckbox = ref<Record<string, boolean>>({})

const ticketProcedureListDraft = ref<TicketProcedure[]>([])
const ticketRegimenListDraft = ref<TicketRegimen[]>([])

const saveLoading = ref(false)

onMounted(async () => {
  const dataPromise = await Promise.all([
    ProcedureService.getAll(),
    RegimenService.list({
      relation: { regimenItemList: { procedure: true }, discountList: true },
    }),
  ])
  regimenAll.value = dataPromise[1]
  startFilter('')
})

const priorityStart = computed(() => {
  const priorityList = (ticketRoomRef.value.ticketProcedureList || []).map((i) => i.priority)
  return Math.max(0, ...priorityList)
})

const reset = () => {
  searchText.value = ''
  startFilter('')
  procedureIdCheckbox.value = {}
  regimenIdCheckbox.value = {}
  ticketProcedureListDraft.value = []
  ticketRegimenListDraft.value = []
}

const startFilter = (text: string) => {
  procedureFilter.value = ProcedureService.procedureAll.value.filter((l) => {
    if (!ESString.customFilter(l.name, text, 2)) return false
    return true
  })
  regimenFilter.value = regimenAll.value.filter((l) => {
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
      const temp = await tableTicketProcedureListRequest.value?.selectProcedure({
        procedure: procedureData,
      })
      if (temp) {
        ticketProcedureListDraft.value.push(temp)
      }
    }
  }
  if (!checked) {
    if (findIndex != -1) {
      ticketProcedureListDraft.value.splice(findIndex, 1)
    }
  }
}

const handleChangeCheckboxRegimen = async (checked: boolean, regimenData: Regimen) => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.value.status)) {
    return
  }
  regimenIdCheckbox.value[regimenData.id] = checked

  const findIndex = ticketRegimenListDraft.value.findIndex((i) => {
    return i.regimenId === regimenData.id
  })

  if (checked) {
    if (findIndex == -1) {
      const temp = await tableTicketProcedureListRequest.value?.selectRegimen({
        regimen: regimenData,
      })
      if (temp) {
        ticketRegimenListDraft.value.push(temp)
      }
    }
  }
  if (!checked) {
    if (findIndex != -1) {
      ticketRegimenListDraft.value.splice(findIndex, 1)
    }
  }
}

const handleRemoveTicketProcedure = (ticketProcedureData: TicketProcedure) => {
  procedureIdCheckbox.value[ticketProcedureData.procedureId] = false
}
const handleRemoveTicketRegimen = (ticketRegimenData: TicketRegimen) => {
  regimenIdCheckbox.value[ticketRegimenData.regimenId] = false
}

const handleSave = async () => {
  emit('addTicketProcedureList', ticketProcedureListDraft.value)

  ticketProcedureListDraft.value.forEach((tp) => {
    if (tp.quantity < 0) {
      AlertStore.addError('Không thể chọn số lượng < 0')
      throw new Error('Không thể chọn số lượng < 0')
    }
  })
  ticketRegimenListDraft.value.forEach((tr) => {
    tr.ticketProcedureWrapList?.forEach((tpWrap) => {
      if (tpWrap.ticketProcedure.quantity < 0) {
        AlertStore.addError('Không thể chọn số lượng < 0')
        throw new Error('Không thể chọn số lượng < 0')
      }
    })
  })

  try {
    saveLoading.value = true
    await TicketChangeProcedureApi.addTicketProcedureList({
      ticketId: ticketRoomRef.value.id,
      ticketRegimenAddWrapList: ticketRegimenListDraft.value.map((i) => {
        return {
          ticketRegimenAdd: i,
          ticketProcedureRegimenAddWrapList: (i.ticketProcedureWrapList || []).map((tpWrap) => {
            return {
              totalSession: tpWrap.totalSession,
              ticketProcedureAdd: tpWrap.ticketProcedure,
            }
          }),
          ticketUserRequestAddList: i.ticketUserRequestList || [],
        }
      }),
      ticketProcedureNormalWrapList: ticketProcedureListDraft.value.map((i) => {
        return {
          ticketProcedureAdd: i,
          ticketUserRequestAddList: i.ticketUserRequestList || [],
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
      <div class="flex flex-col" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0">
        <div class="flex-0">
          <InputText
            v-model:value="searchText"
            prepend="🔎"
            placeholder="Tìm kiếm theo tên dịch vụ"
            @update:value="startFilter"
          />
        </div>
        <div class="table-wrapper flex-1 shadow-sm" style="overflow-y: scroll">
          <table>
            <tbody>
              <template v-for="regimen in regimenFilter" :key="regimen.id">
                <tr
                  @click="handleChangeCheckboxRegimen(!regimenIdCheckbox[regimen.id], regimen)"
                  style="cursor: pointer"
                >
                  <td style="user-select: none" class="text-center">
                    <input
                      type="checkbox"
                      :checked="!!regimenIdCheckbox[regimen.id]"
                      style="cursor: pointer"
                      :disabled="
                        [TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status)
                      "
                    />
                  </td>
                  <td style="user-select: none">
                    <div class="font-bold">{{ regimen.name }}</div>
                    <div v-for="regimenItem in regimen.regimenItemList" :key="regimenItem.id">
                      - {{ regimenItem.procedure?.name }}
                      <span style="font-style: italic">({{ regimenItem.quantity }} buổi)</span>
                    </div>
                  </td>
                  <td class="text-right">
                    <div
                      class="text-xs italic line-through"
                      style="color: var(--text-red)"
                      v-if="regimen.totalMoney !== regimen.totalMoneyAfterDiscount"
                    >
                      {{ formatMoney(regimen.totalMoney) }}
                    </div>
                    <div>{{ formatMoney(regimen.totalMoneyAfterDiscount) }}</div>
                  </td>
                </tr>
              </template>
              <template v-for="procedure in procedureFilter" :key="procedure.id">
                <tr
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
                  <td style="user-select: none">{{ procedure.name }}</td>
                  <td class="text-right">{{ formatMoney(procedure.price) }}</td>
                </tr>
              </template>
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
        :ticketProcedureListDraft="ticketProcedureListDraft"
        :ticketRegimenListDraft="ticketRegimenListDraft"
        :priorityStart="priorityStart"
        :requiredPaymentItem="!!settingStore.TICKET_CLINIC_LIST.requiredPaymentItem"
        @removeTicketProcedure="handleRemoveTicketProcedure"
        @removeTicketRegimen="handleRemoveTicketRegimen"
      />

      <div class="my-3 flex justify-center">
        <VueButton
          :disabled="
            [TicketStatus.Completed, TicketStatus.Debt].includes(ticketRoomRef.status) ||
            !userPermission[PermissionId.TICKET_CHANGE_PROCEDURE_REQUEST]
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
