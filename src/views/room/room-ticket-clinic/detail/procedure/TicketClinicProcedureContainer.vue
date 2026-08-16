<script lang="ts" setup>
import { VueTag } from '@/common'
import VueButton from '@/common/VueButton.vue'
import {
  IconBug,
  IconCheckSquare,
  IconClockCircle,
  IconDelete,
  IconDollar,
  IconFileSearch,
  IconMinusCircle,
  IconTeam,
} from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { TicketItemPaymentType } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { TicketChangeProcedureApi } from '@/modules/ticket'
import {
  TicketProcedure,
  TicketProcedureService,
  TicketProcedureStatus,
  TicketProcedureType,
} from '@/modules/ticket-procedure'
import { TicketProductService } from '@/modules/ticket-product'
import {
  TicketRegimen,
  TicketRegimenItem,
  TicketRegimenService,
  TicketRegimenStatus,
} from '@/modules/ticket-regimen'
import { ESTimer } from '@/utils'
import TicketItemPaymentTypeTooltip from '@/views/room/room-ticket-base/TicketItemPaymentTypeTooltip.vue'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import ModalProcessTicketProcedure from '@/views/room/room-ticket-clinic/detail/procedure/ModalProcessTicketProcedure.vue'
import ModalTicketProcedureUpdateMoney from '@/views/room/room-ticket-clinic/detail/procedure/ModalTicketProcedureUpdateMoney.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ModalShowTicketRegimen from './ModalShowTicketRegimen.vue'
import ModalTicketProcedureUpdateUser from './ModalTicketProcedureUpdateUser.vue'
import ModalTicketRegimenUpdateMoney from './ModalTicketRegimenUpdateMoney.vue'
import ModalTicketRegimenUpdateUser from './ModalTicketRegimenUpdateUser.vue'
import TicketProcedureSelectItem from './TicketProcedureSelectItem.vue'
import TicketRegimenStatusTooltip from './TicketRegimenStatusTooltip.vue'
import TicketProcedureStatusTooltip from './TicketProcedureStatusTooltip.vue'
import { IconEditSquare } from '@/common/icon-google'
import { VueTooltip } from '@/common/popover'
import { ticketRef } from '@/store/room.store'
import { TicketStatus } from '@/modules/ticket/ticket.type'

const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalTicketProcedureUpdateMoney = ref<InstanceType<typeof ModalTicketProcedureUpdateMoney>>()
const modalTicketProcedureUpdateUser = ref<InstanceType<typeof ModalTicketProcedureUpdateUser>>()
const modalTicketRegimenUpdateMoney = ref<InstanceType<typeof ModalTicketRegimenUpdateMoney>>()
const modalTicketRegimenUpdateUser = ref<InstanceType<typeof ModalTicketRegimenUpdateUser>>()
const modalProcessTicketProcedure = ref<InstanceType<typeof ModalProcessTicketProcedure>>()
const modalShowTicketRegimen = ref<InstanceType<typeof ModalShowTicketRegimen>>()

const router = useRouter()
const { userPermission, organization } = MeService

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketProcedureNormalList = ref<TicketProcedure[]>([])
const ticketRegimenList = ref<TicketRegimen[]>([])

watch(
  () => ticketRef.value.ticketProcedureNormalList!,
  (newValue: TicketProcedure[]) => {
    ticketProcedureNormalList.value = TicketProcedure.fromList(newValue || [])
  },
  { immediate: true, deep: true },
)

watch(
  () => ticketRef.value.ticketRegimenList!,
  (newValue: TicketRegimen[]) => {
    ticketRegimenList.value = TicketRegimen.fromList(newValue || [])
  },
  { immediate: true, deep: true },
)

onMounted(async () => {
  try {
    await Promise.all([
      TicketProductService.refreshRelation(ticketRef.value.ticketProductList || []),
      TicketProcedureService.refreshRelation(ticketRef.value.ticketProcedureList || []),
      TicketRegimenService.refreshRelation(ticketRef.value.ticketRegimenList || []),
      TicketRegimenService.refreshRelationItem(ticketRef.value.ticketRegimenItemList || []),
    ])
    ticketRef.value.refreshTicketProcedureAndRegimen()
  } catch (error: any) {
    console.log('🚀 ~ TicketClinicProcedureContainer.vue:84 ~ error:', error)
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const handleAddTicketProcedureList = (value: TicketProcedure[]) => {
  ticketProcedureNormalList.value = [...ticketProcedureNormalList.value, ...value]
}
const handleAddTicketRegimenList = (value: TicketRegimen[]) => {
  ticketRegimenList.value = [...ticketRegimenList.value, ...value]
}

const clickDestroyTicketProcedure = async (ticketProcedureId: string) => {
  ModalStore.confirm({
    title: 'Xác nhận xóa dịch vụ ?',
    content: [
      '- Hệ thống sẽ xóa dịch vụ này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketChangeProcedureApi.destroyTicketProcedure({
          ticketId: ticketRef.value.id,
          ticketProcedureId,
        })
        ticketProcedureNormalList.value = ticketProcedureNormalList.value.filter((i) => {
          return i.id !== ticketProcedureId
        })
      } catch (error) {
        console.log('🚀 ~ TicketClinicProcedureContainer.vue:124 ~ destroyTicketProcedure:', error)
      }
    },
  })
}

const clickDestroyTicketRegimen = async (ticketRegimenId: string) => {
  const trCurrent = ticketRegimenList.value.find((i) => i.id === ticketRegimenId)
  if (!trCurrent) return
  if (
    trCurrent.paid != 0 ||
    trCurrent.paidItem != 0 ||
    trCurrent.moneyAmountUsed != 0
  ) {
    return AlertStore.addError('Liệu trình có tiền không thể xóa')
  }
  for (let i = 0; i < (trCurrent.ticketRegimenItemList || []).length; i++) {
    const element = trCurrent.ticketRegimenItemList![i]
    if (element.quantityUsed != 0 || element.moneyAmountUsed != 0) {
      return AlertStore.addError('Phiếu đã sử dụng không thể xóa')
    }
  }

  ModalStore.confirm({
    title: 'Xác nhận xóa liệu trình ?',
    content: [
      '- Hệ thống sẽ xóa liệu trình này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketChangeProcedureApi.destroyTicketRegimen({
          ticketId: ticketRef.value.id,
          ticketRegimenId,
        })
        ticketRegimenList.value = ticketRegimenList.value.filter((i) => i.id !== ticketRegimenId)
      } catch (error) {
        console.log('🚀 ~ file: TicketClinicRegimen.vue:185 ~ onOk: ~ error:', error)
      }
    },
  })
}

const totalMoney = computed(() => {
  return (ticketRef.value.ticketProcedureList || []).reduce((acc, item) => {
    const money =
      item.ticketItemPaymentType !== TicketItemPaymentType.NoEffect ? item.actualPrice * item.quantity : 0
    return acc + money
  }, 0)
  // ticketProcedureNormalList.value.reduce((acc, i) => acc + i.actualPrice * i.quantity, 0) +
  // ticketRegimenList.value.reduce((acc, i) => acc + i.mo, 0)
})
</script>
<template>
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalProductDetail ref="modalProductDetail" />
  <TicketProcedureSelectItem
    @addTicketProcedureList="handleAddTicketProcedureList"
    @addTicketRegimenList="handleAddTicketRegimenList"
  />
  <ModalTicketProcedureUpdateMoney ref="modalTicketProcedureUpdateMoney" />
  <ModalTicketProcedureUpdateUser ref="modalTicketProcedureUpdateUser" />
  <ModalProcessTicketProcedure ref="modalProcessTicketProcedure" />
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
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>TT</th>
            <th>Dịch vụ</th>
            <th>Hành động</th>
            <th>Thời gian</th>
            <th style="min-width: 60px">SL</th>
            <th>Đơn Giá</th>
            <th>Tiền sử dụng</th>
            <th>Vật tư</th>
            <th>Nhân viên</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketProcedureNormalList!.length === 0 && ticketRegimenList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <template v-for="tp in ticketProcedureNormalList" :key="tp._localId">
            <tr>
              <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                  <template #trigger>
                    <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
                  </template>
                  <pre>{{ JSON.stringify(tp, null, 4) }}</pre>
                </VueTooltip>
              </td>
              <td>
                <TicketItemPaymentTypeTooltip :ticketItemPaymentType="tp.ticketItemPaymentType" />
              </td>

              <td>
                <div class="flex flex-wrap items-center gap-2">
                  <span>{{ tp.procedure?.name }}</span>
                  <a
                    style="line-height: 0"
                    @click="modalProcedureDetail?.openModal(tp.procedureId)"
                  >
                    <IconFileSearch />
                  </a>
                </div>
                <div
                  v-if="tp.status === TicketProcedureStatus.Completed"
                  style="font-size: 0.9em; color: #555"
                >
                  {{ tp.result }}
                </div>
              </td>
              <td>
                <div v-if="tp.status === TicketProcedureStatus.Pending" class="flex justify-center">
                  <VueButton
                    size="small"
                    @click="
                      modalProcessTicketProcedure?.openModal({
                        ticketProcedure: tp,
                      })
                    "
                    :icon="IconClockCircle"
                  >
                    Thực hiện
                  </VueButton>
                </div>
              </td>
              <td>
                <div
                  v-if="tp.status === TicketProcedureStatus.Completed"
                  class="italic flex items-center justify-center gap-2 cursor-pointer"
                  style="margin-left: auto"
                  @click="
                    modalProcessTicketProcedure?.openModal({
                      ticketProcedure: tp,
                    })
                  "
                >
                  {{ ESTimer.timeToText(tp.completedAt, 'hh:mm DD/MM/YYYY') }}
                  <IconCheckSquare width="16" height="16" style="color: var(--text-green)" />
                </div>
              </td>

              <td class="text-center">{{ tp.quantity }}</td>
              <td>
                <div class="flex flex-wrap gap-2 items-center">
                  <div>
                    <VueTag v-if="tp.discountMoney" color="green">
                      {{ tp.discountPercent + ' %' }}
                    </VueTag>
                  </div>
                  <div class="ml-auto">
                    <div v-if="tp.discountMoney" class="text-xs italic text-red-500">
                      <del>{{ formatMoney(tp.expectedPrice) }}</del>
                    </div>
                    <div>{{ formatMoney(tp.actualPrice) }}</div>
                  </div>
                  <a
                    v-if="
                      ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.status) &&
                      [TicketItemPaymentType.TicketPaid, TicketItemPaymentType.PendingPayment].includes(
                        tp.ticketItemPaymentType,
                      ) &&
                      userPermission[PermissionId.TICKET_CHANGE_PROCEDURE_REQUEST]
                    "
                    @click="modalTicketProcedureUpdateMoney?.openModal({ ticketProcedure: tp })"
                    style="color: var(--text-orange); line-height: 0"
                  >
                    <IconEditSquare width="20" height="20" />
                  </a>
                </div>
              </td>
              <td class="text-right">{{ formatMoney(tp.actualPrice * tp.quantity) }}</td>
              <td>
                <div
                  v-for="tpp in tp.ticketProductProcedureList"
                  :key="tpp.id"
                  class="flex flex-wrap items-center gap-1"
                  style="font-size: 0.9em; color: #555"
                >
                  <span>{{ tpp.product?.brandName }} x {{ tpp.unitQuantity }}</span>
                  <a style="line-height: 0" @click="modalProductDetail?.openModal(tpp.product!)">
                    <IconFileSearch />
                  </a>
                  <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                    ({{ formatMoney(tpp.costAmount) }})
                  </span>
                </div>
                <div v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: right">
                  Σ {{ formatMoney(tp.costAmount) }}
                </div>
              </td>

              <td>
                <div class="flex justify-around items-center">
                  <div
                    v-if="tp.ticketUserRequestList?.length || tp.ticketUserResultList?.length"
                    style="font-size: 0.9em; color: #555"
                  >
                    <div v-for="tu in tp.ticketUserRequestList" :key="tu.id" class="flex gap-1">
                      <span>{{ tu.user?.fullName }}</span>
                      <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                        ({{ formatMoney(tu.commissionMoney) }})
                      </span>
                    </div>
                    <div
                      v-for="tu in tp.ticketUserResultList"
                      :key="tu.id"
                      class="flex flex-wrap gap-1"
                    >
                      <span>{{ tu.user?.fullName }}</span>
                      <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                        ({{ formatMoney(tu.commissionMoney) }})
                      </span>
                    </div>
                  </div>
                  <a
                    class="flex justify-center cursor-pointer"
                    style="font-size: 20px"
                    @click="modalTicketProcedureUpdateUser?.openModal({ ticketProcedure: tp })"
                  >
                    <IconTeam />
                  </a>
                </div>

                <div v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: right">
                  Σ {{ formatMoney(tp.commissionAmount) }}
                </div>
              </td>
              <td class="text-center">
                <div
                  v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.status) &&
                    [TicketItemPaymentType.TicketPaid, TicketItemPaymentType.PendingPayment].includes(
                      tp.ticketItemPaymentType,
                    ) &&
                    [
                      TicketProcedureStatus.NoEffect,
                      TicketProcedureStatus.NoAction,
                      TicketProcedureStatus.Pending,
                    ].includes(tp.status) &&
                    userPermission[PermissionId.TICKET_CHANGE_PROCEDURE_REQUEST]
                  "
                  class="flex justify-center cursor-pointer"
                  style="color: var(--text-red); font-size: 20px"
                  @click="clickDestroyTicketProcedure(tp.id)"
                >
                  <IconDelete />
                </div>
              </td>
            </tr>
          </template>
          <template v-for="tr in ticketRegimenList" :key="tr.id">
            <tr>
              <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                  <template #trigger>
                    <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
                  </template>
                  <pre>{{ JSON.stringify(tr, null, 4) }}</pre>
                </VueTooltip>
              </td>
              <td></td>
              <!-- <td>
                <TicketRegimenStatusTooltip :status="tr.status" />
              </td> -->
              <td colspan="6">
                <div class="flex gap-4 justify-between">
                  <div>
                    <div class="font-bold">{{ tr.regimen?.name }}</div>
                    <template v-for="tri in tr.ticketRegimenItemList" :key="tri.id">
                      <div class="flex gap-2" style="font-size: 0.9em; color: #555">
                        <span>- {{ tri.procedure?.name }}</span>
                        <span class="font-bold">
                          ({{ tri.quantityUsed }} / {{ tri.quantityRegular }})
                        </span>
                        <span v-if="CONFIG.MODE === 'development'" style="color: violet"></span>
                        <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                          ( A {{ formatMoney(tri.moneyAmountActual) }} / {{ tri.quantityActual }} )
                        </span>
                      </div>
                    </template>
                  </div>
                  <div class="text-right">
                    <div>Giá tiền</div>
                    <div v-if="tr.discountMoney" class="text-xs italic text-red-500">
                      <del>{{ formatMoney(tr.expectedPrice) }}</del>
                    </div>
                    <div
                      class="flex items-center gap-1 text-lg"
                      style="font-weight: bold; color: var(--text-green)"
                    >
                      <span>{{ formatMoney(tr.actualPrice) }}</span>
                      <a
                        v-if="
                          ![TicketStatus.Debt, TicketStatus.Completed].includes(
                            ticketRef.status,
                          ) &&
                          !tr.paid &&
                          !tr.paidItem &&
                          userPermission[PermissionId.TICKET_CHANGE_PROCEDURE_REQUEST]
                        "
                        @click="modalTicketRegimenUpdateMoney?.openModal({ ticketRegimen: tr })"
                        style="color: var(--text-orange); line-height: 0"
                      >
                        <IconEditSquare width="20" height="20" />
                      </a>
                    </div>
                  </div>
                  <div v-if="ticketRef.isPaymentEachItem" class="text-right">
                    <div>Đã thanh toán</div>
                    <div class="text-lg" style="font-weight: bold; color: var(--text-green)">
                      {{ formatMoney(tr.paidItem) }}
                    </div>
                  </div>
                  <div class="text-right">
                    <div>Đã thực hiện</div>
                    <div class="text-lg" style="font-weight: bold; color: var(--text-green)">
                      {{ formatMoney(tr.moneyAmountUsed) }}
                      <span v-if="tr.moneyAmountUsed !== tr.moneyAmountActual">
                        / {{ formatMoney(tr.moneyAmountActual) }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <!-- <td>
                <div
                  class="font-bold italic flex gap-2 cursor-pointer items-center justify-center"
                  style="color: var(--text-green); margin-left: auto"
                  @click="modalShowTicketRegimen?.openModal({ ticketRegimen: tr })"
                >
                  XEM
                  <IconClockCircle
                    v-if="tr.status === TicketRegimenStatus.Pending"
                    style="font-size: 18px"
                  />
                  <IconExclamationCircle
                    v-if="tr.status === TicketRegimenStatus.Executing"
                    style="font-size: 18px"
                  />
                  <IconCheckSquare
                    v-if="tr.status === TicketRegimenStatus.Completed"
                    style="font-size: 18px"
                  />
                </div>
              </td> -->
              <td>
                <div v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: right">
                  <div>CostAmount</div>
                  <div>Σ {{ formatMoney(tr.costAmount) }}</div>
                </div>
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
                <div v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: right">
                  Σ {{ formatMoney(tr.commissionAmount) }}
                </div>
              </td>
              <td class="text-center">
                <a
                  v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.status) &&
                    [TicketRegimenStatus.Pending].includes(tr.status) &&
                    userPermission[PermissionId.TICKET_CHANGE_PROCEDURE_REQUEST]
                  "
                  @click="clickDestroyTicketRegimen(tr.id)"
                  style="color: var(--text-red)"
                >
                  <IconDelete width="20" height="20" />
                </a>
              </td>
            </tr>
            <template v-for="tp in tr.ticketProcedureList" :key="tp.id">
              <tr>
                <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                  <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                    <template #trigger>
                      <IconBug
                        style="color: violet; cursor: pointer"
                        width="1.2em"
                        height="1.2em"
                      />
                    </template>
                    <pre>{{ JSON.stringify(tp, null, 4) }}</pre>
                  </VueTooltip>
                </td>
                <td>
                  <TicketItemPaymentTypeTooltip :ticketItemPaymentType="tp.ticketItemPaymentType" />
                </td>
                <!-- <td class="text-center">
                  <TicketProcedureStatusTooltip :status="tp.status" />
                </td> -->
                <td>
                  <div class="flex flex-wrap items-center gap-2">
                    <span>{{ tp.procedure?.name }}</span>
                    <a
                      style="line-height: 0"
                      @click="modalProcedureDetail?.openModal(tp.procedureId)"
                    >
                      <IconFileSearch />
                    </a>
                    <span style="font-weight: 500">({{ tp.indexSession }})</span>
                  </div>
                  <div
                    v-if="tp.status === TicketProcedureStatus.Completed"
                    style="font-size: 0.9em; color: #555"
                  >
                    {{ tp.result }}
                  </div>
                </td>
                <td>
                  <div
                    v-if="
                      [TicketProcedureStatus.NoEffect, TicketProcedureStatus.Pending].includes(
                        tp.status,
                      )
                    "
                    class="flex justify-center"
                  >
                    <VueButton
                      size="small"
                      @click="modalProcessTicketProcedure?.openModal({ ticketProcedure: tp })"
                    >
                      <IconMinusCircle v-if="tp.status === TicketProcedureStatus.NoEffect" />
                      <IconClockCircle v-if="tp.status === TicketProcedureStatus.Pending" />
                      Thực hiện
                    </VueButton>
                  </div>
                </td>
                <td>
                  <div
                    v-if="tp.status === TicketProcedureStatus.Completed"
                    class="italic flex items-center justify-center gap-2 cursor-pointer"
                    style="margin-left: auto"
                    @click="
                      modalProcessTicketProcedure?.openModal({
                        ticketProcedure: tp,
                      })
                    "
                  >
                    {{ ESTimer.timeToText(tp.completedAt, 'hh:mm DD/MM/YYYY') }}
                    <IconCheckSquare width="16" height="16" style="color: var(--text-green)" />
                  </div>
                </td>

                <td class="text-center">{{ tp.quantity }}</td>
                <td>
                  <div class="flex flex-wrap gap-2 justify-between items-center">
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
                  <span v-if="tp.ticketItemPaymentType !== TicketItemPaymentType.NoEffect">
                    {{ formatMoney(tp.actualPrice) }}
                  </span>
                </td>

                <td>
                  <div
                    v-for="tpp in tp.ticketProductProcedureList"
                    :key="tpp.id"
                    class="flex flex-wrap items-center gap-1"
                    style="font-size: 0.9em; color: #555"
                  >
                    <span>
                      {{ tpp.product?.brandName }} x {{ tpp.unitQuantity }} {{ tpp.unitName }}
                    </span>
                    <a style="line-height: 0" @click="modalProductDetail?.openModal(tpp.product!)">
                      <IconFileSearch />
                    </a>
                    <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                      ({{ formatMoney(tpp.costAmount) }})
                    </span>
                  </div>
                  <div
                    v-if="CONFIG.MODE === 'development'"
                    style="color: violet; text-align: right"
                  >
                    Σ {{ formatMoney(tp.costAmount) }}
                  </div>
                </td>
                <td>
                  <div style="font-size: 0.9em; color: #555">
                    <div v-for="tu in tp.ticketUserRequestList" :key="tu.id" class="flex gap-1">
                      <span>{{ tu.user?.fullName }}</span>
                      <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                        ({{ formatMoney(tu.commissionMoney) }})
                      </span>
                    </div>
                    <div
                      v-for="tu in tp.ticketUserResultList"
                      :key="tu.id"
                      class="flex flex-wrap gap-1"
                    >
                      <span>{{ tu.user?.fullName }}</span>
                      <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                        ({{ formatMoney(tu.commissionMoney) }})
                      </span>
                    </div>
                  </div>

                  <div
                    v-if="CONFIG.MODE === 'development'"
                    style="color: violet; text-align: right"
                  >
                    Σ {{ formatMoney(tp.commissionAmount) }}
                  </div>
                </td>
                <td class="text-center">
                  <div
                    v-if="
                      ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.status) &&
                      [
                        TicketProcedureStatus.NoEffect,
                        TicketProcedureStatus.NoAction,
                        TicketProcedureStatus.Pending,
                      ].includes(tp.status) &&
                      userPermission[PermissionId.TICKET_CHANGE_PROCEDURE_REQUEST]
                    "
                    class="flex justify-center cursor-pointer"
                    style="color: var(--text-red); font-size: 20px"
                    @click="clickDestroyTicketProcedure(tp.id)"
                  >
                    <IconDelete />
                  </div>
                </td>
              </tr>
            </template>
          </template>
          <tr>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td></td>
            <td colspan="5" class="text-right uppercase">
              <b>Tổng tiền</b>
            </td>

            <td class="text-right">
              <b>
                {{ formatMoney(totalMoney) }}
              </b>
            </td>
            <td colspan="3"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<style lang="scss" scope></style>
