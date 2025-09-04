<script lang="ts" setup>
import { VueTag } from '@/common'
import VueButton from '@/common/VueButton.vue'
import { IconEye, IconFileSearch, IconSpin } from '@/common/icon-antd'
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
import ModalProcessTicketProcedureRegimen from '../../room-procedure/ModalProcessTicketProcedureRegimen.vue'
import ModalShowTicketProcedureRegimen from '../../room-procedure/ModalShowTicketProcedureRegimen.vue'
import ModalUpdateRequestTicketProcedure from '../../room-procedure/ModalUpdateRequestTicketProcedure.vue'
import TicketProcedureStatusTooltip from '../../room-procedure/TicketProcedureStatusTooltip.vue'
import TicketProcedureSelectItem from './TicketProcedureSelectItem.vue'

const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalProcessTicketProcedureRegimen =
  ref<InstanceType<typeof ModalProcessTicketProcedureRegimen>>()
const modalShowTicketProcedureRegimen = ref<InstanceType<typeof ModalShowTicketProcedureRegimen>>()
const modalUpdateRequestTicketProcedure =
  ref<InstanceType<typeof ModalUpdateRequestTicketProcedure>>()

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

const handleUpdateTicketProcedure = (data: { ticketProcedure: TicketProcedure }) => {
  const findExist = ticketProcedureList.value.findIndex((i) => {
    return i.id === data.ticketProcedure.id
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
    @success="handleUpdateTicketProcedure"
  />
  <ModalShowTicketProcedureRegimen
    ref="modalShowTicketProcedureRegimen"
    @success="handleUpdateTicketProcedure"
  />
  <ModalUpdateRequestTicketProcedure ref="modalUpdateRequestTicketProcedure" />
  <TicketProcedureSelectItem @addTicketProcedureList="handleAddTicketProcedureList" />
  <div class="mt-10">
    <div class="flex flex-wrap items-baseline justify-between">
      <div class="italic">Danh sách các dịch vụ, thủ thuật</div>
    </div>
    <div class="table-wrapper mt-2">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'" style="width: 50px">ID-ProcedureId</th>
            <th>#</th>
            <th></th>
            <th></th>
            <th>Dịch vụ</th>
            <th>SL</th>
            <th>Giá NY</th>
            <th>Chiết khấu</th>
            <th>Đơn giá</th>
            <th>T.Tiền</th>
            <th v-if="CONFIG.MODE === 'development'">N.Viên</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketProcedureList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(tp, index) in ticketProcedureList" :key="tp._localId">
            <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
              {{ tp.id }} - {{ tp.procedureId }}
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
            <td><PaymentMoneyStatusTooltip :paymentMoneyStatus="tp.paymentMoneyStatus" /></td>
            <td><TicketProcedureStatusTooltip :status="tp.status" /></td>
            <td :colspan="tp.procedure?.procedureType !== ProcedureType.Basic ? 2 : 1">
              <div class="flex flex-wrap items-center gap-2">
                <span>{{ tp.procedure?.name }}</span>
                <a style="line-height: 0" @click="modalProcedureDetail?.openModal(tp.procedureId)">
                  <IconFileSearch />
                </a>

                <template v-if="tp.procedureType === ProcedureType.SingleProcess">
                  <div style="margin-left: auto">
                    <VueButton
                      v-if="tp.finishedSessions < tp.totalSessions"
                      size="small"
                      @click="
                        modalProcessTicketProcedureRegimen?.openModal({
                          ticketProcedure: tp,
                          ticketProcedureItem: tp.ticketProcedureItemList![0],
                        })
                      "
                    >
                      Thực hiện
                      <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                        ({{ tp.ticketProcedureItemList![0].id }})
                      </span>
                    </VueButton>
                    <div
                      v-else
                      class="font-bold italic flex gap-1 cursor-pointer"
                      style="color: var(--text-green)"
                      @click="
                        modalProcessTicketProcedureRegimen?.openModal({
                          ticketProcedure: tp,
                          ticketProcedureItem: tp.ticketProcedureItemList![0],
                        })
                      "
                    >
                      <span>HOÀN THÀNH</span>
                      <IconEye width="20" height="20" />
                    </div>
                  </div>
                </template>

                <template v-if="tp.procedureType === ProcedureType.Regimen">
                  <div
                    v-if="tp.procedure?.procedureType === ProcedureType.Regimen"
                    class="font-bold"
                  >
                    ({{ tp.finishedSessions }}/{{ tp.totalSessions }} buổi)
                  </div>

                  <div
                    @click="modalShowTicketProcedureRegimen?.openModal({ ticketProcedure: tp })"
                    class="font-bold italic underline cursor-pointer"
                    style="color: var(--text-green)"
                  >
                    XEM
                  </div>

                  <div style="margin-left: auto">
                    <VueButton
                      v-if="tp.finishedSessions < tp.totalSessions"
                      size="small"
                      @click="
                        modalProcessTicketProcedureRegimen?.openModal({
                          ticketProcedure: tp,
                          ticketProcedureItem: tp.ticketProcedureItemList![tp.finishedSessions],
                        })
                      "
                    >
                      Thực hiện buổi {{ tp.finishedSessions + 1 }}
                      <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                        ({{ tp.ticketProcedureItemList![tp.finishedSessions].id }})
                      </span>
                    </VueButton>
                    <span v-else class="font-bold italic" style="color: var(--text-green)">
                      HOÀN THÀNH
                    </span>
                  </div>
                </template>
              </div>
            </td>
            <td class="text-center" v-if="tp.procedureType === ProcedureType.Basic">
              <div>
                {{ tp.quantity }}
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(tp.expectedPrice) }}
            </td>
            <td>
              <div class="flex justify-between">
                <span>
                  <VueTag v-if="tp.discountPercent" color="green">
                    {{ tp.discountPercent || 0 }}%
                  </VueTag>
                </span>
                {{ formatMoney(tp.discountMoney) }}
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(tp.actualPrice) }}
            </td>
            <td class="text-right">
              {{ formatMoney(tp.actualPrice * tp.quantity) }}
            </td>
            <td v-if="CONFIG.MODE === 'development'" style="color: violet">
              <div v-for="tu in tp.ticketUserRequestList" :key="tu.id" class="flex gap-1">
                <span>(P{{ tu.positionId }}-R{{ tu.roleId }}-U{{ tu.userId }})</span>
                <span>{{ tu.user?.fullName }}</span>
              </div>
            </td>
            <td class="text-center">
              <a v-if="!tp.id">
                <IconSpin width="20" height="20" />
              </a>
              <a
                v-else-if="
                  ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                  [PaymentMoneyStatus.NoEffect, PaymentMoneyStatus.Pending].includes(
                    tp.paymentMoneyStatus,
                  ) &&
                  userPermission[PermissionId.TICKET_CHANGE_PROCEDURE_REQUEST]
                "
                @click="modalUpdateRequestTicketProcedure?.openModal({ ticketProcedure: tp })"
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
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="mt-4 flex justify-between">
    <div></div>
    <VueButton
      v-if="userPermission[PermissionId.TICKET_CHANGE_PROCEDURE_REQUEST] && hasChangePriority"
      color="blue"
      icon="save"
      @click="savePriorityTicketProcedure"
    >
      Lưu lại
    </VueButton>
  </div>
</template>
<style lang="scss" scope></style>
