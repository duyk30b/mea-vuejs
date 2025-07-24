<script lang="ts" setup>
import { PrintHtmlAction } from '@/modules/print-html'
import { ticketRoomRef } from '@/modules/room'
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconSpin } from '../../../../common/icon-antd'
import { IconSortDown, IconSortUp } from '../../../../common/icon-font-awesome'
import { IconEditSquare } from '../../../../common/icon-google'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { MeService } from '../../../../modules/_me/me.service'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { TicketStatus } from '../../../../modules/ticket'
import { TicketClinicProcedureApi } from '../../../../modules/ticket-clinic'
import { TicketProcedure } from '../../../../modules/ticket-procedure'
import type { TicketUser } from '../../../../modules/ticket-user'
import ModalTicketProcedureUpdate from './ModalTicketProcedureUpdate.vue'
import TicketClinicProcedureSelectItem from './TicketClinicProcedureSelectItem.vue'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'

const modalTicketProcedureUpdate = ref<InstanceType<typeof ModalTicketProcedureUpdate>>()

const { userPermission, organization } = MeService

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketProcedureList = ref<TicketProcedure[]>([])

watch(
  () => ticketRoomRef.value.ticketProcedureList!,
  (newValue: TicketProcedure[]) => {
    ticketProcedureList.value = TicketProcedure.fromList(newValue || [])
  },
  { immediate: true, deep: true },
)

const hasChangePriority = computed(() => {
  for (let index = 0; index < (ticketRoomRef.value.ticketProcedureList || []).length; index++) {
    const tpRoot = ticketRoomRef.value.ticketProcedureList![index]
    if (tpRoot.priority !== ticketProcedureList.value[index].priority) {
      return true
    }
  }
  return false
})

onMounted(async () => {
  try {
    await ticketRoomRef.value.refreshProcedure()
  } catch (error: any) {
    console.log('🚀 ~ file: TicketClinicProcedure.vue:52 ~ ProcedureService.list ~ error:', error)
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketProcedureList.value[index]
  ticketProcedureList.value[index] = ticketProcedureList.value[index + count]
  ticketProcedureList.value[index + count] = temp
}

const handleAddTicketProcedure = async (data: {
  ticketProcedure: TicketProcedure
  ticketUserList: TicketUser[]
}) => {
  try {
    ticketProcedureList.value = [...ticketProcedureList.value, data.ticketProcedure]
    await TicketClinicProcedureApi.addTicketProcedure({
      ticketId: ticketRoomRef.value.id,
      ticketProcedure: data.ticketProcedure,
      ticketUserList: data.ticketUserList,
    })
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicProcedure.vue:76 ~ handleAddTicketProcedure:', error)
  }
}

const savePriorityTicketProcedure = async () => {
  try {
    await TicketClinicProcedureApi.updatePriorityTicketProcedure({
      ticketId: ticketRoomRef.value.id,
      ticketProcedureList: ticketProcedureList.value,
    })
  } catch (error) {
    console.log('🚀  TicketClinicProcedure.vue:71 ~ savePriorityTicketProcedure ~ error:', error)
  }
}

const startPrintRequest = async () => {
  await PrintHtmlAction.startPrintRequestProcedure({
    ticket: ticketRoomRef.value,
    customer: ticketRoomRef.value.customer!,
  })
}
</script>
<template>
  <ModalTicketProcedureUpdate ref="modalTicketProcedureUpdate" />
  <TicketClinicProcedureSelectItem @success="handleAddTicketProcedure" />
  <div class="mt-4">
    <div class="flex flex-wrap items-baseline justify-between">
      <div class="italic">Danh sách các dịch vụ, thủ thuật</div>
      <div>
        <VueButton icon="print" size="small" @click="startPrintRequest">
          In chỉ định dịch vụ
        </VueButton>
      </div>
    </div>
    <div class="table-wrapper mt-2">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th></th>
            <th>Dịch vụ</th>
            <th>SL</th>
            <th>Giá</th>
            <th>T.Tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketProcedureList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(tpItem, index) in ticketProcedureList" :key="tpItem._localId">
            <td>
              <div class="flex flex-col items-center">
                <button
                  type="button"
                  style="
                    border: none;
                    font-size: 1.2rem;
                    line-height: 0.5;
                    background: none;
                    margin-bottom: -0.5rem;
                  "
                  class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                  :disabled="index === 0"
                  @click="changeItemPosition(index, -1)"
                >
                  <IconSortUp style="opacity: 0.6" />
                </button>
                <span>{{ index + 1 }}</span>
                <button
                  type="button"
                  style="
                    border: none;
                    font-size: 1.2rem;
                    line-height: 0.5;
                    background: none;
                    margin-top: -0.5rem;
                  "
                  class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                  :disabled="index === ticketProcedureList.length - 1"
                  @click="changeItemPosition(index, 1)"
                >
                  <IconSortDown style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td><PaymentMoneyStatusTooltip :paymentMoneyStatus="tpItem.paymentMoneyStatus" /></td>
            <td>{{ tpItem.procedure?.name }}</td>
            <td class="text-center">{{ tpItem.quantity }}</td>
            <td class="text-right">
              <div v-if="tpItem.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(tpItem.expectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(tpItem.actualPrice) }}</div>
            </td>
            <td class="text-right">
              {{ formatMoney(tpItem.actualPrice * tpItem.quantity) }}
            </td>
            <td class="text-center">
              <a v-if="!tpItem.id">
                <IconSpin width="20" height="20" />
              </a>
              <a
                v-else-if="
                  ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                  userPermission[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PROCEDURE_LIST]
                "
                class="text-orange-500"
                @click="modalTicketProcedureUpdate?.openModal(tpItem)"
              >
                <IconEditSquare width="20" height="20" />
              </a>
            </td>
          </tr>
          <tr>
            <td colspan="5" class="text-right">
              <b>Tổng tiền</b>
            </td>
            <td class="text-right">
              <b>
                {{
                  formatMoney(
                    ticketProcedureList.reduce((acc: number, item: TicketProcedure) => {
                      return (acc += item.expectedPrice * item.quantity)
                    }, 0),
                  )
                }}
              </b>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="mt-4 flex justify-between">
    <div></div>
    <VueButton
      v-if="
        userPermission[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PROCEDURE_LIST] && hasChangePriority
      "
      color="blue"
      icon="save"
      @click="savePriorityTicketProcedure"
    >
      Lưu lại
    </VueButton>
  </div>
</template>
<style lang="scss" scope></style>
