<script lang="ts" setup>
import { VueTag } from '@/common'
import VueButton from '@/common/VueButton.vue'
import { IconFileSearch, IconSpin } from '@/common/icon-antd'
import { IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconEditSquare } from '@/common/icon-google'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PaymentMoneyStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ProcedureType } from '@/modules/procedure'
import { ticketRoomRef } from '@/modules/room'
import { TicketChangeProcedureApi, TicketStatus } from '@/modules/ticket'
import { TicketProcedure } from '@/modules/ticket-procedure'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import { computed, onMounted, ref, watch } from 'vue'
import ModalTicketProcedureUpdate from './ModalTicketProcedureUpdate.vue'
import TicketProcedureSelectItem from './TicketProcedureSelectItem.vue'
import ModalProcessTicketProcedureRegimen from './ModalProcessTicketProcedureRegimen.vue'
import ModalShowTicketProcedureRegimen from './ModalShowTicketProcedureRegimen.vue'
import TicketProcedureStatusTooltip from '../../room-procedure/TicketProcedureStatusTooltip.vue'

const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalProcessTicketProcedureRegimen =
  ref<InstanceType<typeof ModalProcessTicketProcedureRegimen>>()
const modalShowTicketProcedureRegimen = ref<InstanceType<typeof ModalShowTicketProcedureRegimen>>()
const modalTicketProcedureUpdate = ref<InstanceType<typeof ModalTicketProcedureUpdate>>()

const { userPermission, organization } = MeService

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketProcedureList = ref<TicketProcedure[]>([])

const processLoading = ref(false)

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

const savePriorityTicketProcedure = async () => {
  try {
    await TicketChangeProcedureApi.updatePriorityTicketProcedure({
      ticketId: ticketRoomRef.value.id,
      ticketProcedureList: ticketProcedureList.value,
    })
  } catch (error) {
    console.log('🚀  TicketClinicProcedure.vue:71 ~ savePriorityTicketProcedure ~ error:', error)
  }
}

const handleAddTicketProcedureList = (value: TicketProcedure[]) => {
  ticketProcedureList.value = [...ticketProcedureList.value, ...value]
}

const handleProcessTicketProcedureRegimenSuccess = (data: TicketProcedure) => {
  const findExist = ticketProcedureList.value.findIndex((i) => {
    return i.id === data.id
  })
  if (findExist !== -1) {
    Object.assign(ticketProcedureList.value[findExist], data)
  }
}
</script>
<template>
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalProcessTicketProcedureRegimen
    ref="modalProcessTicketProcedureRegimen"
    @success="handleProcessTicketProcedureRegimenSuccess"
  />
  <ModalShowTicketProcedureRegimen ref="modalShowTicketProcedureRegimen" />
  <ModalTicketProcedureUpdate ref="modalTicketProcedureUpdate" />
  <TicketProcedureSelectItem @addTicketProcedureList="handleAddTicketProcedureList" />
  <div class="mt-10">
    <div class="flex flex-wrap items-baseline justify-between">
      <div class="italic">Danh sách các dịch vụ, thủ thuật</div>
    </div>
    <div class="table-wrapper mt-2">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'" style="width: 50px">ID</th>
            <th>#</th>
            <th></th>
            <th></th>
            <th>Dịch vụ</th>
            <th>SL</th>
            <th>Giá NY</th>
            <th>Chiết khấu</th>
            <th>Đơn giá</th>
            <th>T.Tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketProcedureList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(tpItem, index) in ticketProcedureList" :key="tpItem._localId">
            <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
              {{ tpItem.id }}
            </td>
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
            <td><TicketProcedureStatusTooltip :status="tpItem.status" /></td>
            <td :colspan="tpItem.procedure?.procedureType !== ProcedureType.Basic ? 2 : 1">
              <div class="flex flex-wrap items-center gap-2">
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
                  ({{ tpItem.completedSessions }}/{{ tpItem.totalSessions }} buổi)
                </span>
                <div
                  v-if="tpItem.procedure?.procedureType === ProcedureType.Regimen"
                  @click="modalShowTicketProcedureRegimen?.openModal(tpItem)"
                  class="font-bold italic underline cursor-pointer"
                  style="color: var(--text-green)"
                >
                  XEM
                </div>
                <div
                  v-if="tpItem.procedure?.procedureType === ProcedureType.Regimen"
                  style="margin-left: auto"
                >
                  <VueButton
                    v-if="tpItem.completedSessions < tpItem.totalSessions"
                    size="small"
                    @click="
                      modalProcessTicketProcedureRegimen?.openModal({
                        ticketProcedure: tpItem,
                        ticketProcedureItem:
                          tpItem.ticketProcedureItemList![tpItem.completedSessions],
                      })
                    "
                  >
                    Thực hiện buổi {{ tpItem.completedSessions + 1 }}
                    <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                      ({{ tpItem.ticketProcedureItemList![tpItem.completedSessions].id }})
                    </span>
                  </VueButton>
                  <span v-else class="font-bold italic" style="color: var(--text-green)">
                    HOÀN THÀNH
                  </span>
                </div>
              </div>
            </td>
            <td class="text-center" v-if="tpItem.procedure?.procedureType === ProcedureType.Basic">
              <div>
                {{ tpItem.quantity }}
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(tpItem.expectedPrice) }}
            </td>
            <td>
              <div class="flex justify-between">
                <span>
                  <VueTag v-if="tpItem.discountPercent" color="green">
                    {{ tpItem.discountPercent || 0 }}%
                  </VueTag>
                </span>
                {{ formatMoney(tpItem.discountMoney) }}
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(tpItem.actualPrice) }}
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
                  [PaymentMoneyStatus.NoEffect, PaymentMoneyStatus.Pending].includes(
                    tpItem.paymentMoneyStatus,
                  ) &&
                  userPermission[PermissionId.TICKET_CHANGE_PROCEDURE]
                "
                @click="modalTicketProcedureUpdate?.openModal(tpItem)"
                style="color: var(--text-orange)"
              >
                <IconEditSquare width="20" height="20" />
              </a>
            </td>
          </tr>
          <tr>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="8" class="text-right uppercase">
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
      v-if="userPermission[PermissionId.TICKET_CHANGE_PROCEDURE] && hasChangePriority"
      color="blue"
      icon="save"
      @click="savePriorityTicketProcedure"
    >
      Lưu lại
    </VueButton>
  </div>
</template>
<style lang="scss" scope></style>
