<script lang="ts" setup>
import { VueTag } from '@/common'
import VueButton from '@/common/VueButton.vue'
import {
  IconCheckSquare,
  IconClockCircle,
  IconDelete,
  IconDollar,
  IconDoubleRight,
  IconExclamationCircle,
  IconFileSearch,
  IconSpin,
  IconTeam,
} from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PaymentEffect, PaymentMoneyStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ticketRoomRef } from '@/modules/room'
import { TicketChangeProcedureApi, TicketStatus } from '@/modules/ticket'
import {
  TicketProcedure,
  TicketProcedureService,
  TicketProcedureStatus,
  TicketProcedureType,
} from '@/modules/ticket-procedure'
import {
  TicketRegimen,
  TicketRegimenItem,
  TicketRegimenService,
  TicketRegimenStatus,
} from '@/modules/ticket-regimen'
import { ESTimer } from '@/utils'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
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
import { TicketProductService } from '@/modules/ticket-product'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'

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
  () => ticketRoomRef.value.ticketProcedureNormalList!,
  (newValue: TicketProcedure[]) => {
    ticketProcedureNormalList.value = TicketProcedure.fromList(newValue || [])
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

onMounted(async () => {
  try {
    await Promise.all([
      TicketProductService.refreshRelation(ticketRoomRef.value.ticketProductList || []),
      TicketProcedureService.refreshRelation(ticketRoomRef.value.ticketProcedureList || []),
      TicketRegimenService.refreshRelation(ticketRoomRef.value.ticketRegimenList || []),
      TicketRegimenService.refreshRelationItem(ticketRoomRef.value.ticketRegimenItemList || []),
    ])
    ticketRoomRef.value.refreshTicketProcedureAndRegimen()
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
          ticketId: ticketRoomRef.value.id,
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

const handleProcessTicketRegimenItem = (props: {
  ticketRegimen: TicketRegimen
  ticketRegimenItem: TicketRegimenItem
}) => {
  const temp = TicketProcedure.blank()
  temp.id = ''
  temp.ticketId = ticketRoomRef.value.id
  temp.procedureId = props.ticketRegimenItem.procedureId
  temp.ticketRegimenId = props.ticketRegimen.id
  temp.ticketRegimenItemId = props.ticketRegimenItem.id
  temp.ticketProcedureType = TicketProcedureType.InRegimen

  temp.procedure = props.ticketRegimenItem.procedure
  temp.expectedPrice = props.ticketRegimenItem.expectedPrice
  temp.discountMoney = props.ticketRegimenItem.discountMoney
  temp.discountPercent = props.ticketRegimenItem.discountPercent
  temp.discountType = props.ticketRegimenItem.discountType
  temp.actualPrice = props.ticketRegimenItem.actualPrice
  temp.quantity = 1
  temp.ticketProcedureType = TicketProcedureType.InRegimen
  temp.status = TicketProcedureStatus.Pending

  modalProcessTicketProcedure.value?.openModal({ ticketProcedure: temp })
}
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
            <th v-if="CONFIG.MODE === 'development'" style="width: 150px">ID</th>
            <th></th>
            <th>Dịch vụ</th>
            <th style="min-width: 60px">SL</th>
            <th>Thời gian</th>
            <th>Hành động</th>
            <th>T.Tiền</th>
            <th>T.Toán</th>
            <th>Vật tư</th>
            <th>Nhân viên</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketProcedureNormalList!.length === 0 && ticketRegimenList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <template v-for="(tp, tpIndex) in ticketProcedureNormalList" :key="tp._localId">
            <tr>
              <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
                {{ tp.id }}
              </td>

              <td class="text-center">{{ tpIndex + 1 }}</td>
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
              <td class="text-center">{{ tp.quantity }}</td>
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
                <div class="flex flex-wrap gap-2 justify-between items-center">
                  <div>
                    <VueTag v-if="tp.discountMoney" color="green">
                      {{ tp.discountPercent + ' %' }}
                    </VueTag>
                  </div>
                  <div>
                    <div v-if="tp.discountMoney" class="text-xs italic text-red-500">
                      <del>{{ formatMoney(tp.expectedPrice * tp.quantity) }}</del>
                    </div>
                    <div>{{ formatMoney(tp.actualPrice * tp.quantity) }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div
                  v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                    tp.paymentMoneyStatus === PaymentMoneyStatus.PendingPaid &&
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
                    !tp.ticketRegimenId && [PaymentMoneyStatus.Paid].includes(tp.paymentMoneyStatus)
                  "
                >
                  <PaymentMoneyStatusTooltip :paymentMoneyStatus="tp.paymentMoneyStatus" />
                </div>
              </td>
              <td>
                <div
                  v-for="tpp in tp.ticketProductProcedureList"
                  :key="tpp.id"
                  class="flex flex-wrap items-center gap-1"
                  style="font-size: 0.9em; color: #555"
                >
                  <span>{{ tpp.product?.brandName }} x {{ tpp.quantity }}</span>
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
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                    tp.paymentMoneyStatus === PaymentMoneyStatus.PendingPaid &&
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
            </tr>
          </template>
          <template v-for="tr in ticketRegimenList" :key="tr.id">
            <tr>
              <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
                {{ tr.id }}
              </td>
              <td>
                <TicketRegimenStatusTooltip :status="tr.status" />
              </td>
              <td colspan="2">
                <div class="font-bold flex gap-1">
                  <span>{{ tr.regimen?.name }}</span>
                </div>
                <template v-for="tri in tr.ticketRegimenItemList" :key="tri.id">
                  <div class="flex gap-2" style="font-size: 0.9em; color: #555">
                    <span>- {{ tri.procedure?.name }}</span>
                    <span class="font-bold">
                      ({{ tri.quantityFinish }} / {{ tri.quantityTotal }})
                    </span>
                  </div>
                </template>
              </td>
              <td>
                <!-- <div
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
                </div> -->
              </td>
              <td>
                <div class="flex gap-2 justify-between items-center">
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

              <td class="text-center">
                <!-- <a
                  v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                    tr.paymentMoneyStatus === PaymentMoneyStatus.PendingPaid &&
                    userPermission[PermissionId.TICKET_CHANGE_PROCEDURE_REQUEST]
                  "
                  @click="modalTicketRegimenUpdateMoney?.openModal({ ticketRegimen: tr })"
                  style="color: var(--text-orange)"
                >
                  <IconDollar width="20" height="20" />
                </a>
                <a v-if="[PaymentMoneyStatus.Paid].includes(tr.paymentMoneyStatus)">
                  <TicketRegimenStatusTooltip :status="tr.status" />
                </a> -->
              </td>
              <td></td>
              <td>
                <div v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: right">
                  Σ {{ formatMoney(tr.costAmount) }}
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
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                    tr.paymentMoneyStatus === PaymentMoneyStatus.PendingPaid &&
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
            <template v-for="(tp, tpIndex) in tr.ticketProcedureList" :key="tp.id">
              <tr>
                <td v-if="CONFIG.MODE === 'development'" style="text-align: center; color: violet">
                  {{ tp.id }}
                </td>

                <td class="text-center">
                  {{ tpIndex + 1 }}
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
                    <span style="font-weight: 500">({{ tp.indexSession }})</span>
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
                <td>
                  <div
                    v-if="tp.status === TicketProcedureStatus.Pending"
                    class="flex justify-center"
                  >
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
                <td>
                  <div
                    v-if="
                      ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                      tp.paymentMoneyStatus === PaymentMoneyStatus.PendingPaid &&
                      userPermission[PermissionId.TICKET_CHANGE_PROCEDURE_REQUEST]
                    "
                    class="flex justify-center cursor-pointer"
                    style="font-size: 20px; color: var(--text-orange)"
                    @click="modalTicketProcedureUpdateMoney?.openModal({ ticketProcedure: tp })"
                  >
                    <IconDollar />
                  </div>
                </td>
                <td>
                  <div
                    v-for="tpp in tp.ticketProductProcedureList"
                    :key="tpp.id"
                    class="flex flex-wrap items-center gap-1"
                    style="font-size: 0.9em; color: #555"
                  >
                    <span>{{ tpp.product?.brandName }} x {{ tpp.quantity }}</span>
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
                      ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                      tp.paymentMoneyStatus === PaymentMoneyStatus.PendingPaid &&
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
              </tr>
            </template>
          </template>
          <tr>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="4" class="text-right uppercase">
              <b>Tổng tiền</b>
            </td>

            <td class="text-right">
              <b>
                {{
                  formatMoney(
                    ticketProcedureNormalList.reduce(
                      (acc, i) => acc + i.actualPrice * i.quantity,
                      0,
                    ) + ticketRegimenList.reduce((acc, i) => acc + i.actualPrice, 0),
                  )
                }}
              </b>
            </td>
            <td></td>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="3"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<style lang="scss" scope></style>
