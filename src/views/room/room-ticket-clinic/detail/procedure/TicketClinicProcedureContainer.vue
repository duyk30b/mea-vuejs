<script lang="ts" setup>
import { VueTag } from '@/common'
import VueButton from '@/common/VueButton.vue'
import {
  IconDelete,
  IconDollar,
  IconEye,
  IconFileSearch,
  IconSpin,
  IconTeam,
} from '@/common/icon-antd'
import { IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PaymentMoneyStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ticketRoomRef } from '@/modules/room'
import { TicketChangeProcedureApi, TicketStatus } from '@/modules/ticket'
import {
  TicketProcedure,
  TicketProcedureStatus,
  TicketProcedureType,
} from '@/modules/ticket-procedure'
import { TicketRegimen, TicketRegimenStatus } from '@/modules/ticket-regimen'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import ModalProcessTicketProcedure from '@/views/room/room-ticket-clinic/detail/procedure/ModalProcessTicketProcedure.vue'
import ModalTicketProcedureUpdateMoney from '@/views/room/room-ticket-clinic/detail/procedure/ModalTicketProcedureUpdateMoney.vue'
import ModalTicketProcedureUpdateUserResult from '@/views/room/room-ticket-clinic/detail/procedure/ModalTicketProcedureUpdateUserResult.vue'
import TicketProcedureStatusTooltip from '@/views/room/room-ticket-clinic/detail/procedure/TicketProcedureStatusTooltip.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ModalShowTicketRegimen from './ModalShowTicketRegimen.vue'
import ModalTicketProcedureUpdateUserRequest from './ModalTicketProcedureUpdateUserRequest.vue'
import ModalTicketRegimenUpdateMoney from './ModalTicketRegimenUpdateMoney.vue'
import ModalTicketRegimenUpdateUser from './ModalTicketRegimenUpdateUser.vue'
import TicketProcedureSelectItem from './TicketProcedureSelectItem.vue'
import TicketRegimenStatusTooltip from './TicketRegimenStatusTooltip.vue'
import { ESTimer } from '@/utils'
import { TicketProductType } from '@/modules/ticket-product'

const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalTicketProcedureUpdateMoney = ref<InstanceType<typeof ModalTicketProcedureUpdateMoney>>()
const modalTicketProcedureUpdateUserResult =
  ref<InstanceType<typeof ModalTicketProcedureUpdateUserResult>>()
const modalTicketProcedureUpdateUserRequest =
  ref<InstanceType<typeof ModalTicketProcedureUpdateUserRequest>>()
const modalTicketRegimenUpdateMoney = ref<InstanceType<typeof ModalTicketRegimenUpdateMoney>>()
const modalTicketRegimenUpdateUser = ref<InstanceType<typeof ModalTicketRegimenUpdateUser>>()
const modalProcessTicketProcedure = ref<InstanceType<typeof ModalProcessTicketProcedure>>()
const modalShowTicketRegimen = ref<InstanceType<typeof ModalShowTicketRegimen>>()

const router = useRouter()
const { userPermission, organization } = MeService

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketProcedureList = ref<TicketProcedure[]>([])
const ticketRegimenList = ref<TicketRegimen[]>([])

const processLoading = ref(false)

watch(
  () => ticketRoomRef.value.ticketProcedureList!,
  (newValue: TicketProcedure[]) => {
    ticketProcedureList.value = TicketProcedure.fromList(newValue || [])
  },
  { immediate: true, deep: true },
)

watch(
  () => ticketRoomRef.value.ticketRegimenList!,
  (newValue: TicketRegimen[]) => {
    ticketRegimenList.value = TicketRegimen.fromList(newValue || [])
  },
  { immediate: true, deep: true },
)

const hasChangePriority = computed(() => {
  for (let index = 0; index < (ticketRoomRef.value.ticketProcedureList || []).length; index++) {
    const tpRoot = ticketRoomRef.value.ticketProcedureList![index]
    if (tpRoot?.priority !== ticketProcedureList.value[index]?.priority) {
      return true
    }
  }
  return false
})

onMounted(async () => {
  try {
    await ticketRoomRef.value.refreshProcedureAndRegimen()
  } catch (error: any) {
    console.log('🚀 ~ TicketClinicProcedureContainer.vue:84 ~ error:', error)
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

const clickDestroyTicketProcedure = async (ticketProcedureId: number) => {
  ModalStore.confirm({
    title: 'Xác nhận xóa dịch vụ ?',
    content: [
      '- Hệ thống sẽ xóa dịch vụ này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketChangeProcedureApi.destroyTicketProcedure({
          ticketId: ticketRoomRef.value.id,
          ticketProcedureId,
        })
        ticketProcedureList.value = ticketProcedureList.value.filter((i) => {
          return i.id !== ticketProcedureId
        })
      } catch (error) {
        console.log(
          '🚀 ~ TicketClinicProcedureContainer.vue:124 ~ clickDestroyTicketProcedure ~ error:',
          error,
        )
      }
    },
  })
}

const clickDestroyTicketRegimen = async (ticketRegimenId: number) => {
  ModalStore.confirm({
    title: 'Xác nhận xóa liệu trình ?',
    content: [
      '- Hệ thống sẽ xóa liệu trình này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketChangeProcedureApi.destroyTicketRegimen({
          ticketId: ticketRoomRef.value.id,
          ticketRegimenId,
        })
        ticketRegimenList.value = ticketRegimenList.value.filter((i) => i.id !== ticketRegimenId)
      } catch (error) {
        console.log('🚀 ~ file: TicketClinicRegimen.vue:185 ~ onOk: ~ error:', error)
      }
    },
  })
}

const openBlankTicket = (ticketId: number) => {
  const route = router.resolve({
    name: 'TicketClinicDetailContainer',
    params: { roomId: ticketRoomRef.value.roomId, ticketId },
  })
  window.open(route.href, '_blank')
}
</script>
<template>
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <TicketProcedureSelectItem @addTicketProcedureList="handleAddTicketProcedureList" />
  <ModalTicketProcedureUpdateMoney ref="modalTicketProcedureUpdateMoney" />
  <ModalTicketProcedureUpdateUserRequest ref="modalTicketProcedureUpdateUserRequest" />
  <ModalTicketProcedureUpdateUserResult ref="modalTicketProcedureUpdateUserResult" />
  <ModalProcessTicketProcedure
    ref="modalProcessTicketProcedure"
    @success="handleUpdateTicketProcedure"
  />
  <ModalTicketRegimenUpdateMoney ref="modalTicketRegimenUpdateMoney" />
  <ModalTicketRegimenUpdateUser ref="modalTicketRegimenUpdateUser" />
  <ModalShowTicketRegimen ref="modalShowTicketRegimen" />
  <div class="mt-6">
    <div class="flex flex-wrap items-baseline justify-between">
      <div class="italic">Danh sách các dịch vụ</div>
    </div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'" style="width: 150px">ID-Priority-TicketId</th>
            <th>#</th>
            <th></th>
            <th>Dịch vụ</th>
            <th>SL</th>
            <th>Đơn giá</th>
            <th>T.Tiền</th>
            <th v-if="CONFIG.MODE === 'development'">
              <div>costAmount</div>
              <div>commissionAmount</div>
            </th>
            <th></th>
            <th>NV Chỉ định</th>
            <th>NV Thực hiện</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-if="
              ticketProcedureList!.length === 0 &&
              ticketRegimenList!.length === 0 &&
              ticketRoomRef.ticketRegimenListExtra!.length === 0
            "
          >
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <template v-for="(tp, index) in ticketProcedureList" :key="tp._localId">
            <tr v-if="tp.ticketProcedureType === TicketProcedureType.Normal">
              <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
                {{ tp.id }} - {{ tp.priority }} - {{ tp.ticketId }}
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

              <td><TicketProcedureStatusTooltip :status="tp.status" /></td>
              <td>
                <div class="flex flex-wrap items-center gap-2">
                  <span>{{ tp.procedure?.name }}</span>
                  <a
                    style="line-height: 0"
                    @click="modalProcedureDetail?.openModal(tp.procedureId)"
                  >
                    <IconFileSearch />
                  </a>
                  <div v-if="tp.status === TicketProcedureStatus.Pending" style="margin-left: auto">
                    <VueButton
                      size="small"
                      @click="
                        modalProcessTicketProcedure?.openModal({
                          ticketProcedure: tp,
                          ticketId: ticketRoomRef.id,
                        })
                      "
                    >
                      Thực hiện
                    </VueButton>
                  </div>
                  <div
                    v-if="tp.status === TicketProcedureStatus.Completed"
                    class="font-bold italic flex gap-1 cursor-pointer"
                    style="color: var(--text-green); margin-left: auto"
                    @click="
                      modalProcessTicketProcedure?.openModal({
                        ticketProcedure: tp,
                        ticketId: ticketRoomRef.id,
                      })
                    "
                  >
                    <IconEye width="20" height="20" />
                  </div>
                </div>
                <div
                  v-if="tp.status === TicketProcedureStatus.Completed"
                  style="font-size: 0.9em; color: #555"
                >
                  {{ tp.result }}
                </div>
              </td>
              <td class="text-center">{{ tp.quantity }}</td>
              <td>
                <div class="flex justify-between items-center">
                  <div>
                    <VueTag v-if="tp.discountMoney" color="green">
                      {{ tp.discountPercent + ' %' }}
                    </VueTag>
                  </div>
                  <div>
                    <div v-if="tp.discountMoney" class="text-xs italic text-red-500">
                      <del>{{ formatMoney(tp.expectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(tp.actualPrice) }}</div>
                  </div>
                </div>
              </td>
              <td class="text-right">
                <div v-if="tp.paymentMoneyStatus !== PaymentMoneyStatus.NoEffect">
                  {{ formatMoney(tp.actualPrice * tp.quantity) }}
                </div>
              </td>

              <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: right">
                <div>{{ formatMoney(tp.costAmount) }}</div>
                <div>{{ formatMoney(tp.commissionAmount) }}</div>
              </td>
              <template v-if="!tp.id">
                <td colspan="4"><IconSpin width="20" height="20" /></td>
              </template>
              <template v-else>
                <td>
                  <div
                    v-if="
                      !tp.ticketRegimenId &&
                      ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                      [PaymentMoneyStatus.PendingPayment, PaymentMoneyStatus.TicketPaid].includes(
                        tp.paymentMoneyStatus,
                      ) &&
                      userPermission[PermissionId.TICKET_CHANGE_PROCEDURE_REQUEST]
                    "
                    class="flex justify-center cursor-pointer"
                    style="font-size: 20px; color: var(--text-orange)"
                    @click="modalTicketProcedureUpdateMoney?.openModal({ ticketProcedure: tp })"
                  >
                    <IconDollar />
                  </div>
                  <div
                    v-if="
                      !tp.ticketRegimenId &&
                      [PaymentMoneyStatus.Paid].includes(tp.paymentMoneyStatus)
                    "
                  >
                    <PaymentMoneyStatusTooltip :paymentMoneyStatus="tp.paymentMoneyStatus" />
                  </div>
                </td>
                <td>
                  <div class="flex justify-around items-center">
                    <div v-if="tp.ticketUserRequestList?.length">
                      <div v-for="tu in tp.ticketUserRequestList" :key="tu.id" class="flex gap-1">
                        <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                          (P{{ tu.positionId }}-R{{ tu.roleId }}-U{{ tu.userId }})
                        </span>
                        <span>{{ tu.user?.fullName }}</span>
                      </div>
                    </div>
                    <a
                      class="flex justify-center cursor-pointer"
                      style="font-size: 20px"
                      @click="
                        modalTicketProcedureUpdateUserRequest?.openModal({ ticketProcedure: tp })
                      "
                    >
                      <IconTeam />
                    </a>
                  </div>
                </td>
                <td>
                  <div class="flex justify-around items-center">
                    <div v-if="tp.ticketUserResultList?.length">
                      <div v-for="tu in tp.ticketUserResultList" :key="tu.id" class="flex gap-1">
                        <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                          (P{{ tu.positionId }}-R{{ tu.roleId }}-U{{ tu.userId }})
                        </span>
                        <span>{{ tu.user?.fullName }}</span>
                      </div>
                    </div>
                    <a
                      class="flex justify-center cursor-pointer"
                      style="font-size: 20px"
                      @click="
                        modalTicketProcedureUpdateUserResult?.openModal({ ticketProcedure: tp })
                      "
                    >
                      <IconTeam />
                    </a>
                  </div>
                </td>
                <td class="text-center">
                  <div
                    v-if="
                      ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                      [PaymentMoneyStatus.PendingPayment, PaymentMoneyStatus.TicketPaid].includes(
                        tp.paymentMoneyStatus,
                      ) &&
                      [TicketProcedureStatus.Pending, TicketProcedureStatus.NoEffect].includes(
                        tp.status,
                      ) &&
                      userPermission[PermissionId.TICKET_CHANGE_PROCEDURE_REQUEST]
                    "
                    class="flex justify-center cursor-pointer"
                    style="color: var(--text-red); font-size: 20px"
                    @click="clickDestroyTicketProcedure(tp.id)"
                  >
                    <IconDelete />
                  </div>
                </td>
              </template>
            </tr>
          </template>
          <template
            v-for="(tr, trIndex) in [
              ...ticketRegimenList,
              ...(ticketRoomRef.ticketRegimenListExtra || []),
            ]"
            :key="tr.id"
          >
            <tr>
              <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
                {{ tr.id }} - {{ tr.regimenId }} - {{ tr.ticketId }}
              </td>
              <td class="text-center">{{ trIndex + 1 + (ticketProcedureList.length || 0) }}</td>
              <td><TicketRegimenStatusTooltip :status="tr.status" /></td>
              <td colspan="2">
                <div class="flex flex-wrap items-center gap-2 justify-between">
                  <div class="font-bold">{{ tr.regimen?.name }}</div>
                  <div
                    class="font-bold italic flex gap-1 cursor-pointer"
                    style="color: var(--text-green); margin-left: auto"
                    @click="modalShowTicketRegimen?.openModal({ ticketRegimen: tr })"
                  >
                    XEM
                    <IconEye width="20" height="20" />
                  </div>
                </div>
              </td>
              <td>
                <div class="flex justify-between items-center">
                  <div>
                    <VueTag v-if="tr.discountMoney" color="green">
                      {{ tr.discountPercent + ' %' }}
                    </VueTag>
                  </div>
                  <div>
                    <div v-if="tr.discountMoney" class="text-xs italic text-red-500">
                      <del>{{ formatMoney(tr.expectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(tr.actualPrice) }}</div>
                  </div>
                </div>
              </td>
              <td class="text-right">
                <div
                  v-if="
                    tr.ticketId === ticketRoomRef.id &&
                    tr.paymentMoneyStatus !== PaymentMoneyStatus.NoEffect
                  "
                >
                  {{ formatMoney(tr.actualPrice) }}
                </div>
                <div
                  v-if="tr.paymentMoneyStatus === PaymentMoneyStatus.NoEffect"
                  style="font-size: 0.9em; color: var(--text-green); font-weight: 500"
                >
                  Thanh toán từng buổi lẻ
                </div>
                <div v-else style="font-size: 0.9em; color: var(--text-green); font-weight: 500">
                  Thanh toán cả gói
                </div>
              </td>
              <td class="text-right" v-if="CONFIG.MODE === 'development'" style="color: violet">
                <div>{{ formatMoney(tr.costAmount) }}</div>
                <div>{{ formatMoney(tr.commissionAmount) }}</div>
              </td>
              <template v-if="!tr.id">
                <td colspan="4"><IconSpin width="20" height="20" /></td>
              </template>
              <template v-else-if="tr.ticketId !== ticketRoomRef.id">
                <td colspan="4" class="text-center">
                  <a @click="openBlankTicket(tr.ticketId)">
                    Liệu trình được kê ở phiếu PK_{{ tr.ticketId }}
                  </a>
                </td>
              </template>
              <template v-else>
                <td class="text-center">
                  <a
                    v-if="
                      ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                      [PaymentMoneyStatus.PendingPayment, PaymentMoneyStatus.TicketPaid].includes(
                        tr.paymentMoneyStatus,
                      ) &&
                      userPermission[PermissionId.TICKET_CHANGE_PROCEDURE_REQUEST]
                    "
                    @click="modalTicketRegimenUpdateMoney?.openModal({ ticketRegimen: tr })"
                    style="color: var(--text-orange)"
                  >
                    <IconDollar width="20" height="20" />
                  </a>
                  <a v-if="[PaymentMoneyStatus.Paid].includes(tr.paymentMoneyStatus)">
                    <TicketRegimenStatusTooltip :status="tr.status" />
                  </a>
                </td>
                <td>
                  <div class="flex justify-around items-center">
                    <div v-if="tr.ticketUserRequestList?.length">
                      <div v-for="tu in tr.ticketUserRequestList" :key="tu.id" class="flex gap-1">
                        <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                          (P{{ tu.positionId }}-R{{ tu.roleId }}-U{{ tu.userId }})
                        </span>
                        <span>{{ tu.user?.fullName }}</span>
                      </div>
                    </div>
                    <a
                      class="flex justify-center cursor-pointer"
                      style="font-size: 20px"
                      @click="modalTicketRegimenUpdateUser?.openModal({ ticketRegimen: tr })"
                    >
                      <IconTeam />
                    </a>
                  </div>
                </td>
                <td></td>
                <td class="text-center">
                  <a
                    v-if="
                      ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                      [PaymentMoneyStatus.PendingPayment, PaymentMoneyStatus.TicketPaid].includes(
                        tr.paymentMoneyStatus,
                      ) &&
                      [TicketRegimenStatus.Pending].includes(tr.status) &&
                      userPermission[PermissionId.TICKET_CHANGE_PROCEDURE_REQUEST]
                    "
                    @click="clickDestroyTicketRegimen(tr.id)"
                    style="color: var(--text-red)"
                  >
                    <IconDelete width="20" height="20" />
                  </a>
                </td>
              </template>
            </tr>
            <tr v-for="tpi in tr.ticketProcedureList" :key="tpi.id">
              <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
                {{ tpi.id }} - {{ tpi.priority }} - {{ tpi.ticketId }}
              </td>
              <td></td>
              <td><TicketProcedureStatusTooltip :status="tpi.status" /></td>
              <td colspan="2">
                <div class="flex flex-wrap items-center gap-2 justify-between">
                  <div>
                    <div class="flex gap-2">
                      <span>{{ tpi.procedure?.name }}</span>
                      <span style="font-weight: 500">({{ tpi.sessionIndex }})</span>
                    </div>
                    <div
                      v-if="tpi.status === TicketProcedureStatus.Completed"
                      style="font-size: 0.9em; color: #555"
                    >
                      {{ tpi.result }}
                    </div>
                  </div>
                  <div
                    v-if="tpi.status === TicketProcedureStatus.Pending"
                    style="margin-left: auto"
                  >
                    <VueButton
                      size="small"
                      @click="
                        modalProcessTicketProcedure?.openModal({
                          ticketProcedure: tpi,
                          ticketId: ticketRoomRef.id,
                        })
                      "
                    >
                      Thực hiện
                    </VueButton>
                  </div>
                  <div
                    v-if="tpi.status === TicketProcedureStatus.Completed"
                    class="italic flex gap-2 cursor-pointer"
                    style="margin-left: auto"
                    @click="
                      modalProcessTicketProcedure?.openModal({
                        ticketProcedure: tpi,
                        ticketId: ticketRoomRef.id,
                      })
                    "
                  >
                    {{ ESTimer.timeToText(tpi.completedAt, 'hh:mm DD/MM/YYYY') }}
                    <IconEye width="20" height="20" style="color: var(--text-green)" />
                  </div>
                </div>
              </td>
              <td class="text-right">
                <div class="flex justify-between items-center">
                  <span>
                    <VueTag v-if="tpi.discountMoney" color="green">
                      {{ tpi.discountPercent || 0 }}%
                    </VueTag>
                  </span>
                  <div>
                    <div v-if="tpi.discountMoney" class="text-xs italic text-red-500">
                      <!-- <del>{{ formatMoney(tpi.expectedPrice) }}</del> -->
                    </div>
                    <div>{{ formatMoney(tpi.actualPrice) }}</div>
                  </div>
                </div>
              </td>
              <td class="text-right">
                <span
                  v-if="
                    tpi.ticketId === ticketRoomRef.id &&
                    tpi.paymentMoneyStatus !== PaymentMoneyStatus.NoEffect
                  "
                >
                  {{ formatMoney(tpi.quantity * tpi.actualPrice) }}
                </span>
              </td>
              <td v-if="CONFIG.MODE === 'development'" style="text-align: right; color: violet">
                <div>{{ formatMoney(tpi.costAmount) }}</div>
                <div>{{ formatMoney(tpi.commissionAmount) }}</div>
              </td>
              <td></td>
              <td></td>
              <td>
                <div class="flex justify-around items-center">
                  <div v-if="tpi.ticketUserResultList?.length">
                    <div v-for="tu in tpi.ticketUserResultList" :key="tu.id" class="flex gap-1">
                      <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                        (P{{ tu.positionId }}-R{{ tu.roleId }}-U{{ tu.userId }})
                      </span>
                      <span>{{ tu.user?.fullName }}</span>
                    </div>
                  </div>
                  <a
                    class="flex justify-center cursor-pointer"
                    style="font-size: 20px"
                    @click="
                      modalTicketProcedureUpdateUserResult?.openModal({ ticketProcedure: tpi })
                    "
                  >
                    <IconTeam />
                  </a>
                </div>
              </td>
              <td></td>
            </tr>
          </template>
          <tr>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="5" class="text-right uppercase">
              <b>Tổng tiền</b>
            </td>

            <td class="text-right">
              <b>
                {{
                  formatMoney(
                    ticketProcedureList.reduce((acc, i) => acc + i.remainMoney, 0) +
                      ticketRegimenList.reduce((acc, i) => acc + i.remainMoney, 0),
                  )
                }}
              </b>
            </td>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="4"></td>
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
