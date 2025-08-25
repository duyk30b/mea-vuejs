<script lang="ts" setup>
import { VueButton } from '@/common'
import { IconFileSearch } from '@/common/icon-antd'
import { IconMinus, IconPlus } from '@/common/icon-font-awesome'
import { IconDelete, IconEditSquare } from '@/common/icon-google'
import { InputNumber, InputText } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { Procedure, ProcedureService, ProcedureType } from '@/modules/procedure'
import { ticketRoomRef } from '@/modules/room'
import { TicketChangeProcedureApi, TicketStatus } from '@/modules/ticket'
import { TicketProcedure, TicketProcedureStatus } from '@/modules/ticket-procedure'
import { TicketProcedureItem } from '@/modules/ticket-procedure/ticket-procedure-item.model'
import { ESString } from '@/utils'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import { onMounted, ref } from 'vue'
import ModalTicketProcedureUpdate from './ModalTicketProcedureUpdate.vue'

const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalTicketProcedureUpdate = ref<InstanceType<typeof ModalTicketProcedureUpdate>>()

const emit = defineEmits<{ (e: 'addTicketProcedureList', value: TicketProcedure[]): void }>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const searchText = ref('')
const procedureFilter = ref<Procedure[]>([])
const procedureIdCheckbox = ref<Record<string, boolean>>({})
const ticketProcedureListDraft = ref<TicketProcedure[]>([])

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
      const temp = TicketProcedure.blank()
      temp.ticketId = ticketRoomRef.value.id
      temp.customerId = ticketRoomRef.value.customerId
      temp.procedureId = procedureData.id
      temp.procedure = procedureData

      temp.paymentMoneyStatus = settingStore.TICKET_CLINIC_DETAIL.procedure.paymentMoneyStatus
      if (procedureData.procedureType === ProcedureType.Basic) {
        temp.status = TicketProcedureStatus.Completed
      } else {
        temp.status = TicketProcedureStatus.Pending
      }

      temp.expectedPrice = procedureData.price
      temp.discountMoney = 0
      temp.discountPercent = 0
      temp.discountType = DiscountType.VND
      temp.expectedPrice = procedureData.price
      temp.actualPrice = procedureData.price

      temp.quantity = 1
      temp.totalSessions = procedureData.totalSessions

      temp.createdAt = Date.now()

      await ProcedureService.executeRelation([procedureData], { discountList: true })
      const discountApply = procedureData?.discountApply
      if (discountApply) {
        let { discountType, discountPercent, discountMoney } = discountApply
        const expectedPrice = temp.expectedPrice || 0
        if (discountType === DiscountType.Percent) {
          discountMoney = Math.round((expectedPrice * (discountPercent || 0)) / 100)
        }
        if (discountType === DiscountType.VND) {
          discountPercent =
            expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
        }
        temp.discountType = discountType
        temp.discountPercent = discountPercent
        temp.discountMoney = discountMoney
        temp.actualPrice = expectedPrice - discountMoney
      }

      if (procedureData.procedureType === ProcedureType.Regimen) {
        temp.ticketProcedureItemList = []
        const startedAt = new Date()
        startedAt.setMinutes(0, 0, 0)
        startedAt.setHours(startedAt.getHours() + 1)
        for (let i = 0; i < procedureData.totalSessions; i++) {
          const tpItem = TicketProcedureItem.blank()
          tpItem.completedAt = startedAt.getTime() + i * procedureData.gapHours * 60 * 60 * 1000
          temp.ticketProcedureItemList.push(tpItem)
        }
      }

      ticketProcedureListDraft.value.push(temp)
    }
  } else {
    if (findIndex != -1) {
      ticketProcedureListDraft.value.splice(findIndex, 1)
    }
  }
}

const handleRemoveTicketProcedure = (ticketProcedureData: TicketProcedure) => {
  const indexRemove = ticketProcedureListDraft.value.findIndex((i) => {
    return i._localId === ticketProcedureData._localId
  })
  if (indexRemove !== -1) {
    ticketProcedureListDraft.value.splice(indexRemove, 1)
    procedureIdCheckbox.value[ticketProcedureData.procedureId] = false
  }
}

const handleModalTicketProcedureUpdateSuccess = (
  ticketProcedureData: TicketProcedure,
  type: 'CREATE' | 'UPDATE' | 'DESTROY',
) => {
  if (type === 'UPDATE') {
    const findIndex = ticketProcedureListDraft.value.findIndex((i) => {
      return i._localId === ticketProcedureData._localId
    })
    if (findIndex !== -1) {
      ticketProcedureListDraft.value[findIndex] = ticketProcedureData
    }
  }
}

const handleSave = async () => {
  emit('addTicketProcedureList', ticketProcedureListDraft.value)

  try {
    saveLoading.value = true
    await TicketChangeProcedureApi.addTicketProcedureList({
      ticketId: ticketRoomRef.value.id,
      ticketProcedureList: ticketProcedureListDraft.value,
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
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalTicketProcedureUpdate
    ref="modalTicketProcedureUpdate"
    @success="handleModalTicketProcedureUpdateSuccess"
  />
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

    <div style="flex-basis: 300px; max-width: 100%; flex-grow: 5" class="flex flex-col">
      <div
        class="table-wrapper flex-1"
        style="overflow-y: scroll; border-bottom: 1px solid #eee; border-left: 1px solid #eee"
      >
        <table>
          <thead>
            <tr>
              <th v-if="CONFIG.MODE === 'development'" style="width: 50px">procedureId</th>
              <th>#</th>
              <th>Tên dịch vụ</th>
              <th style="width: 150px">Số lượng</th>
              <th>Giá tiền</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!ticketProcedureListDraft.length">
              <td colspan="100" class="text-center">Chưa chọn dịch vụ nào</td>
            </tr>
            <template
              v-else
              v-for="(tpItem, index) in ticketProcedureListDraft"
              :key="tpItem._localId"
            >
              <tr>
                <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
                  {{ tpItem.procedureId }}
                </td>
                <td class="text-center">{{ index + 1 }}</td>
                <td :colspan="tpItem.procedure?.procedureType !== ProcedureType.Basic ? 2 : 1">
                  <div class="flex items-center gap-1">
                    <span>{{ tpItem.procedure?.name }}</span>
                    <a
                      style="line-height: 0"
                      @click="modalProcedureDetail?.openModal(tpItem.procedureId)"
                    >
                      <IconFileSearch />
                    </a>
                    <span
                      v-if="tpItem.procedure?.procedureType === ProcedureType.Regimen"
                      class="font-bold"
                    >
                      ({{ tpItem.totalSessions }} buổi)
                    </span>
                  </div>
                </td>
                <td
                  v-if="tpItem.procedure?.procedureType === ProcedureType.Basic"
                  class="text-center"
                >
                  <div class="flex items-center justify-between">
                    <button
                      style="
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        border: 1px solid #cdcdcd;
                      "
                      class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                      :disabled="tpItem.quantity <= 0"
                      @click="tpItem.quantity--"
                    >
                      <IconMinus />
                    </button>
                    <div style="width: calc(100% - 60px); min-width: 50px">
                      <InputNumber v-model:value="tpItem.quantity" textAlign="right" />
                    </div>
                    <button
                      style="
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        border: 1px solid #cdcdcd;
                      "
                      class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                      @click="tpItem.quantity++"
                    >
                      <IconPlus />
                    </button>
                  </div>
                </td>
                <td class="text-right">
                  <div v-if="tpItem.discountMoney" class="text-xs italic text-red-500">
                    <del>{{ formatMoney(tpItem.expectedPrice) }}</del>
                  </div>
                  <div>{{ formatMoney(tpItem.actualPrice) }}</div>
                </td>
                <td>
                  <a
                    class="flex justify-center cursor-pointer"
                    style="font-size: 20px"
                    @click="modalTicketProcedureUpdate?.openModal(tpItem)"
                  >
                    <IconEditSquare />
                  </a>
                </td>
                <td>
                  <div
                    class="flex justify-center cursor-pointer"
                    style="font-size: 20px"
                    @click="handleRemoveTicketProcedure(tpItem)"
                  >
                    <IconDelete style="color: var(--text-red)" />
                  </div>
                </td>
              </tr>
            </template>
            <tr>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td colspan="3" class="text-right font-bold uppercase">Tổng tiền</td>
              <td class="font-bold text-right">
                {{
                  formatMoney(ticketProcedureListDraft.reduce((acc, i) => acc + i.actualPrice, 0))
                }}
              </td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="mt-3 flex justify-center">
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
</template>
<style lang="scss" scope></style>
