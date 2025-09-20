<!-- eslint-disable vue/no-mutating-props -->
<script setup lang="ts">
import { IconDelete, IconDollar, IconFileSearch, IconTeam } from '@/common/icon-antd'
import { InputNumber } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import { ProcedureService, ProcedureType, type Procedure } from '@/modules/procedure'
import { TicketProcedure, TicketProcedureStatus } from '@/modules/ticket-procedure'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import { ref } from 'vue'
import ModalTicketProcedureUpdateMoney from './ModalTicketProcedureUpdateMoney.vue'
import ModalTicketProcedureUpdateUserResult from './ModalTicketProcedureUpdateUserResult.vue'
import { TicketRegimen, TicketRegimenStatus } from '@/modules/ticket-regimen'
import ModalTicketRegimenUpdateMoney from './ModalTicketRegimenUpdateMoney.vue'
import ModalTicketRegimenUpdateUser from './ModalTicketRegimenUpdateUser.vue'
import type { Regimen } from '@/modules/regimen'
import { VueTag } from '@/common'
import ModalTicketProcedureUpdateUserRequest from './ModalTicketProcedureUpdateUserRequest.vue'

const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const modalTicketProcedureUpdateUserResult =
  ref<InstanceType<typeof ModalTicketProcedureUpdateUserResult>>()
const modalTicketProcedureUpdateUserRequest =
  ref<InstanceType<typeof ModalTicketProcedureUpdateUserRequest>>()
const modalTicketProcedureUpdateMoney = ref<InstanceType<typeof ModalTicketProcedureUpdateMoney>>()
const modalTicketRegimenUpdateUser = ref<InstanceType<typeof ModalTicketRegimenUpdateUser>>()
const modalTicketRegimenUpdateMoney = ref<InstanceType<typeof ModalTicketRegimenUpdateMoney>>()

const props = withDefaults(
  defineProps<{
    ticketProcedureListDraft: TicketProcedure[]
    ticketRegimenListDraft: TicketRegimen[]
    priorityStart: number
    requiredPaymentItem: boolean
  }>(),
  {
    ticketProcedureListDraft: () => [],
    ticketRegimenListDraft: () => [],
    priorityStart: 0,
    requiredPaymentItem: false,
  },
)

const emit = defineEmits<{
  (e: 'removeTicketProcedure', ticketProcedure: TicketProcedure): void
  (e: 'removeTicketRegimen', ticketRegimen: TicketRegimen): void
}>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const selectProcedure = async (data: { procedure: Procedure }) => {
  const procedureData = data.procedure
  const temp = TicketProcedure.blank()

  temp.priority = props.priorityStart + props.ticketProcedureListDraft.length + 1
  temp.ticketId = 0
  temp.customerId = 0
  temp.procedureId = procedureData.id
  temp.ticketRegimenId = 0

  temp.quantity = 1
  temp.sessionIndex = 0

  temp.expectedPrice = procedureData.price
  temp.discountMoney = 0
  temp.discountPercent = 0
  temp.discountType = DiscountType.Percent
  temp.actualPrice = procedureData.price

  if (procedureData.procedureType === ProcedureType.Basic) {
    temp.status = TicketProcedureStatus.NoEffect
  }
  if (procedureData.procedureType === ProcedureType.Process) {
    temp.status = TicketProcedureStatus.Pending
  }
  if (props.requiredPaymentItem) {
    temp.paymentMoneyStatus = PaymentMoneyStatus.PendingPayment
  } else {
    temp.paymentMoneyStatus = PaymentMoneyStatus.TicketPaid
  }

  temp.createdAt = Date.now()

  temp.procedure = procedureData

  await ProcedureService.executeRelation([procedureData], { discountList: true })
  const discountApply = procedureData?.discountApply
  if (discountApply) {
    let { discountType, discountPercent, discountMoney } = discountApply
    const expectedPrice = temp.expectedPrice || 0
    if (discountType === DiscountType.Percent) {
      discountMoney = Math.round((expectedPrice * (discountPercent || 0)) / 100)
    }
    if (discountType === DiscountType.VND) {
      discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
    }
    temp.discountType = discountType
    temp.discountPercent = discountPercent
    temp.discountMoney = discountMoney
    temp.actualPrice = expectedPrice - discountMoney
  }

  return temp
}

const selectRegimen = async (data: { regimen: Regimen }) => {
  const regimenData = data.regimen
  const temp = TicketRegimen.blank()
  temp.ticketId = 0
  temp.customerId = 0
  temp.regimenId = regimenData.id

  temp.expectedPrice = regimenData.totalMoney
  const discountApply = regimenData.discountApply
  if (discountApply?.discountType === DiscountType.VND) {
    temp.discountType = DiscountType.VND
    temp.discountMoney = discountApply?.discountMoney || 0
    temp.discountPercent =
      temp.expectedPrice === 0
        ? 0
        : Math.round((temp.discountMoney / temp.expectedPrice) * 100 * 100) / 100 // thêm nhân chia với 100 để làm tròn sau 2 số thập phân
  }
  if (discountApply?.discountType === DiscountType.Percent) {
    temp.discountType = DiscountType.Percent
    temp.discountPercent = discountApply?.discountPercent || 0
    temp.discountMoney = (temp.discountPercent * temp.expectedPrice) / 100
  }
  temp.actualPrice = temp.expectedPrice - temp.discountMoney

  if (props.requiredPaymentItem) {
    temp.paymentMoneyStatus = PaymentMoneyStatus.PendingPayment
  } else {
    temp.paymentMoneyStatus = PaymentMoneyStatus.TicketPaid
  }
  temp.status = TicketRegimenStatus.Pending
  temp.createdAt = Date.now()

  temp.regimen = regimenData

  temp.ticketProcedureWrapList = (regimenData.regimenItemList || []).map((ri) => {
    const tp = TicketProcedure.blank()
    tp.procedureId = ri.procedureId
    tp.quantity = ri.quantity

    tp.expectedPrice = ri.procedure?.price || 0
    tp.discountType = DiscountType.Percent
    tp.discountPercent = temp.discountPercent
    tp.discountMoney = ((ri.procedure?.price || 0) * temp.discountPercent) / 100
    tp.actualPrice = tp.expectedPrice - tp.discountMoney

    if (ri.procedure?.procedureType === ProcedureType.Basic) {
      tp.status = TicketProcedureStatus.NoEffect
    }
    if (ri.procedure?.procedureType === ProcedureType.Process) {
      tp.status = TicketProcedureStatus.Pending
    }
    tp.paymentMoneyStatus = PaymentMoneyStatus.NoEffect
    tp.procedure = ri.procedure
    return {
      _localId: Math.random().toString(36).substring(2),
      totalSession: ri.quantity,
      ticketProcedure: tp,
    }
  })

  return temp
}

const removeTicketRegimen = (ticketRegimenData: TicketRegimen) => {
  const indexRemove = props.ticketRegimenListDraft.findIndex((i) => {
    return i._localId === ticketRegimenData._localId
  })
  if (indexRemove !== -1) {
    props.ticketRegimenListDraft.splice(indexRemove, 1)
    emit('removeTicketRegimen', ticketRegimenData)
  }
}

const removeTicketProcedure = (ticketProcedureData: TicketProcedure) => {
  const indexRemove = props.ticketProcedureListDraft.findIndex((i) => {
    return i._localId === ticketProcedureData._localId
  })
  if (indexRemove !== -1) {
    props.ticketProcedureListDraft.splice(indexRemove, 1)
    emit('removeTicketProcedure', ticketProcedureData)
  }
}

const handleModalTicketRegimenSuccess = (ticketRegimenData: TicketRegimen) => {
  const _localId = ticketRegimenData._localId
  const findIndex = props.ticketRegimenListDraft.findIndex((i) => {
    return i._localId === _localId
  })
  if (findIndex !== -1) {
    Object.assign(props.ticketRegimenListDraft[findIndex], ticketRegimenData)
    props.ticketRegimenListDraft[findIndex] = ticketRegimenData
  }
}

const handleModalTicketProcedureUpdateSuccess = (ticketProcedureData: TicketProcedure) => {
  const _localId = ticketProcedureData._localId
  const findIndex = props.ticketProcedureListDraft.findIndex((i) => {
    return i._localId === _localId
  })
  if (findIndex !== -1) {
    Object.assign(props.ticketProcedureListDraft[findIndex], ticketProcedureData)
    props.ticketProcedureListDraft[findIndex] = ticketProcedureData
  }
}

const handleChangeTicketRegimenTotalSession = (data: {
  trLocalId: string
  tpWrapLocalId: string
  totalSession: number
}) => {
  const ticketRegimen = props.ticketRegimenListDraft.find((i) => i._localId === data.trLocalId)
  if (!ticketRegimen) return

  ticketRegimen.expectedPrice = ticketRegimen.ticketProcedureWrapList!.reduce((acc, item) => {
    return acc + item.totalSession * item.ticketProcedure.expectedPrice
  }, 0)
  ticketRegimen.actualPrice = ticketRegimen.ticketProcedureWrapList!.reduce((acc, item) => {
    return acc + item.totalSession * item.ticketProcedure.actualPrice
  }, 0)
}

defineExpose({ selectProcedure, selectRegimen })
</script>

<template>
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalTicketProcedureUpdateMoney
    ref="modalTicketProcedureUpdateMoney"
    @success="handleModalTicketProcedureUpdateSuccess"
  />
  <ModalTicketProcedureUpdateUserRequest
    ref="modalTicketProcedureUpdateUserRequest"
    @success="handleModalTicketProcedureUpdateSuccess"
  />
  <ModalTicketProcedureUpdateUserResult
    ref="modalTicketProcedureUpdateUserResult"
    @success="handleModalTicketProcedureUpdateSuccess"
  />
  <ModalTicketRegimenUpdateMoney
    ref="modalTicketRegimenUpdateMoney"
    @success="handleModalTicketRegimenSuccess"
  />
  <ModalTicketRegimenUpdateUser
    ref="modalTicketRegimenUpdateUser"
    @success="handleModalTicketRegimenSuccess"
  />
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th v-if="CONFIG.MODE === 'development'"></th>
          <th>#</th>
          <th>Dịch vụ</th>
          <th style="width: 150px">Số lượng</th>
          <th>Giá</th>
          <th>T.Tiền</th>
          <th></th>
          <th>NV Chỉ định</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="ticketProcedureListDraft.length === 0 && ticketRegimenListDraft.length === 0">
          <td colspan="20" class="text-center">Không có dịch vụ nào</td>
        </tr>
        <template v-for="tr in ticketRegimenListDraft" :key="tr._localId">
          <tr>
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              {{ tr.regimenId }}
            </td>
            <td colspan="3">
              <div class="flex items-center gap-1 font-bold">
                <span>{{ tr.regimen?.name }}</span>
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
              <div v-if="tr.paymentMoneyStatus !== PaymentMoneyStatus.NoEffect">
                {{ formatMoney(tr.actualPrice) }}
              </div>
            </td>
            <td>
              <a
                class="flex justify-center cursor-pointer"
                style="font-size: 20px; color: var(--text-orange)"
                @click="modalTicketRegimenUpdateMoney?.openModal({ ticketRegimen: tr })"
              >
                <IconDollar />
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
            <td>
              <div
                class="flex justify-center cursor-pointer"
                style="color: var(--text-red); cursor: pointer; font-size: 20px"
                @click="removeTicketRegimen(tr)"
              >
                <IconDelete />
              </div>
            </td>
          </tr>
          <tr v-for="(tpWrap, triIndex) in tr.ticketProcedureWrapList" :key="tpWrap._localId">
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center"></td>
            <td style="text-align: center">{{ triIndex + 1 }}</td>
            <td>{{ tpWrap.ticketProcedure.procedure?.name }}</td>
            <td class="text-right">
              <InputNumber
                v-model:value="tpWrap.totalSession"
                buttonControl
                textAlign="right"
                @update:value="
                  (v) =>
                    handleChangeTicketRegimenTotalSession({
                      totalSession: v,
                      trLocalId: tr._localId,
                      tpWrapLocalId: tpWrap._localId,
                    })
                "
              />
            </td>
            <td>
              <div class="flex justify-between items-center gap-4">
                <div>
                  <VueTag
                    v-if="
                      tpWrap.ticketProcedure.discountType === DiscountType.Percent &&
                      tpWrap.ticketProcedure.discountMoney
                    "
                    color="green"
                  >
                    {{ tpWrap.ticketProcedure.discountPercent + ' %' }}
                  </VueTag>
                </div>
                <div>
                  <div
                    v-if="tpWrap.ticketProcedure.discountMoney"
                    class="text-xs italic text-red-500"
                  >
                    <del>{{ formatMoney(tpWrap.ticketProcedure.expectedPrice) }}</del>
                  </div>
                  <div>{{ formatMoney(tpWrap.ticketProcedure.actualPrice) }}</div>
                </div>
              </div>
            </td>
            <td class="text-right">
              <div v-if="tpWrap.ticketProcedure.paymentMoneyStatus !== PaymentMoneyStatus.NoEffect">
                {{ formatMoney(tpWrap.ticketProcedure.actualPrice * tpWrap.totalSession) }}
              </div>
            </td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </template>
        <tr v-if="ticketRegimenListDraft.length && ticketProcedureListDraft.length">
          <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center"></td>
          <td colspan="100" class="font-bold">Dịch vụ lẻ</td>
        </tr>
        <tr v-for="(tp, index) in ticketProcedureListDraft" :key="tp._localId">
          <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
            {{ tp.procedureId }} - {{ tp.priority }}
          </td>
          <td style="text-align: center">{{ index + 1 }}</td>
          <td>
            <div class="flex items-center gap-1">
              <span>{{ tp.procedure?.name }}</span>
              <a style="line-height: 0" @click="modalProcedureDetail?.openModal(tp.procedureId)">
                <IconFileSearch />
              </a>
            </div>
          </td>
          <td>
            <div class="flex justify-center">
              <InputNumber v-model:value="tp.quantity" textAlign="right" :buttonControl="true" />
            </div>
          </td>
          <template v-if="!!tp.ticketRegimenId">
            <td colspan="4" class="text-center">
              <!-- <PaymentMoneyStatusTooltip :paymentMoneyStatus="tp.paymentMoneyStatus" /> -->
            </td>
          </template>
          <template v-else>
            <td class="text-right">
              <div v-if="tp.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(tp.expectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(tp.actualPrice) }}</div>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(tp.actualPrice * tp.quantity) }}</div>
            </td>
            <td>
              <div
                class="flex justify-center cursor-pointer"
                style="font-size: 20px; color: var(--text-orange)"
                @click="modalTicketProcedureUpdateMoney?.openModal({ ticketProcedure: tp })"
              >
                <IconDollar />
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
                  @click="modalTicketProcedureUpdateUserRequest?.openModal({ ticketProcedure: tp })"
                >
                  <IconTeam />
                </a>
              </div>
            </td>
          </template>

          <td class="text-center">
            <div
              class="flex justify-center cursor-pointer"
              style="color: var(--text-red); font-size: 20px"
              @click="removeTicketProcedure(tp)"
            >
              <IconDelete />
            </div>
          </td>
        </tr>
        <tr>
          <td v-if="CONFIG.MODE === 'development'"></td>
          <td colspan="4" class="text-right font-bold uppercase">Tổng tiền</td>
          <td class="font-bold text-right">
            {{
              formatMoney(
                ticketProcedureListDraft.reduce((acc, i) => acc + i.remainMoney, 0) +
                  ticketRegimenListDraft.reduce((acc, i) => acc + i.remainMoney, 0),
              )
            }}
          </td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
