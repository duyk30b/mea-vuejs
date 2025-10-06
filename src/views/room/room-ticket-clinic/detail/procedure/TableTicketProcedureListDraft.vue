<!-- eslint-disable vue/no-mutating-props -->
<script setup lang="ts">
import { VueTag } from '@/common'
import { IconDelete, IconDollar, IconFileSearch, IconTeam } from '@/common/icon-antd'
import { InputNumber } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import { ProcedureService, ProcedureType, type Procedure } from '@/modules/procedure'
import type { Regimen } from '@/modules/regimen'
import { TicketProcedure, TicketProcedureStatus } from '@/modules/ticket-procedure'
import { TicketRegimen, TicketRegimenItem, TicketRegimenStatus } from '@/modules/ticket-regimen'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import { computed, ref } from 'vue'
import ModalTicketProcedureUpdateMoney from './ModalTicketProcedureUpdateMoney.vue'
import ModalTicketProcedureUpdateUser from './ModalTicketProcedureUpdateUser.vue'
import ModalTicketRegimenUpdateMoney from './ModalTicketRegimenUpdateMoney.vue'
import ModalTicketRegimenUpdateUser from './ModalTicketRegimenUpdateUser.vue'
import { IconEditSquare } from '@/common/icon-google'

const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()
const modalTicketProcedureUpdateUser = ref<InstanceType<typeof ModalTicketProcedureUpdateUser>>()
const modalTicketProcedureUpdateMoney = ref<InstanceType<typeof ModalTicketProcedureUpdateMoney>>()
const modalTicketRegimenUpdateUser = ref<InstanceType<typeof ModalTicketRegimenUpdateUser>>()
const modalTicketRegimenUpdateMoney = ref<InstanceType<typeof ModalTicketRegimenUpdateMoney>>()

const props = withDefaults(
  defineProps<{
    ticketProcedureListDraft: TicketProcedure[]
    ticketRegimenListDraft: TicketRegimen[]
    priorityStart: number
  }>(),
  {
    ticketProcedureListDraft: () => [],
    ticketRegimenListDraft: () => [],
    priorityStart: 0,
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
  temp.ticketId = ''
  temp.customerId = 0
  temp.procedureId = procedureData.id
  temp.ticketRegimenId = ''

  temp.quantity = 1

  temp.expectedPrice = procedureData.price
  temp.discountMoney = 0
  temp.discountPercent = 0
  temp.discountType = DiscountType.Percent
  temp.actualPrice = procedureData.price

  if (procedureData.procedureType === ProcedureType.Basic) {
    temp.status = TicketProcedureStatus.NoAction
  }
  if (procedureData.procedureType === ProcedureType.Process) {
    temp.status = TicketProcedureStatus.Pending
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
  temp.ticketId = ''
  temp.customerId = 0
  temp.regimenId = regimenData.id
  temp.isEffectTotalMoney = Number(settingStore.TICKET_CLINIC_DETAIL.regimen.isEffectTotalMoney)

  temp.moneyAmountRegular = regimenData.totalMoney
  const discountApply = regimenData.discountApply
  if (discountApply?.discountType === DiscountType.VND) {
    temp.discountType = DiscountType.VND
    temp.discountMoney = discountApply?.discountMoney || 0
    temp.discountPercent =
      temp.moneyAmountRegular === 0
        ? 0
        : Math.round((temp.discountMoney / temp.moneyAmountRegular) * 100 * 100) / 100 // thêm nhân chia với 100 để làm tròn sau 2 số thập phân
  }
  if (discountApply?.discountType === DiscountType.Percent) {
    temp.discountType = DiscountType.Percent
    temp.discountPercent = discountApply?.discountPercent || 0
    temp.discountMoney = Math.round((temp.discountPercent * temp.moneyAmountRegular) / 100)
  }
  temp.moneyAmountSale = temp.moneyAmountRegular - temp.discountMoney

  temp.status = TicketRegimenStatus.Pending
  temp.createdAt = Date.now()

  temp.regimen = regimenData

  let totalMoneyAmountRegularRemain = temp.moneyAmountRegular
  let totalMoneyAmountSaleRemain = temp.moneyAmountSale
  let totalDiscountMoneyRemain = temp.discountMoney
  let trLength = temp.ticketRegimenItemList?.length || 0
  temp.ticketRegimenItemList = (regimenData.regimenItemList || []).map((ri, index) => {
    const tri = TicketRegimenItem.blank()
    tri.regimenId = ri.regimenId
    tri.procedureId = ri.procedureId

    tri.quantityRegular = ri.quantity
    tri.quantityPaid = 0
    tri.quantityUsed = 0
    tri.gapDay = 1

    tri.procedure = ri.procedure

    if (index + 1 !== trLength) {
      tri.moneyAmountRegular = (ri.procedure?.price || 0) * ri.quantity
      tri.discountType = DiscountType.Percent
      tri.discountPercent = temp.discountPercent
      tri.discountMoneyAmount =
        Math.floor(((ri.procedure?.price || 0) * temp.discountPercent) / 100 / 1000) * 1000
      tri.moneyAmountSale = tri.moneyAmountRegular - tri.discountMoneyAmount

      totalMoneyAmountRegularRemain -= tri.moneyAmountRegular
      totalDiscountMoneyRemain -= tri.discountMoneyAmount
      totalMoneyAmountSaleRemain -= tri.moneyAmountSale
    } else {
      tri.moneyAmountRegular = totalMoneyAmountRegularRemain
      tri.discountMoneyAmount = totalDiscountMoneyRemain
      tri.moneyAmountSale = totalMoneyAmountSaleRemain
      tri.discountType = DiscountType.Percent
      tri.discountPercent = temp.discountPercent
    }

    return tri
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

const handleChangeTicketRegimenItemQuantityExpected = (data: {
  trLocalId: string
  triLocalId: string
  quantityRegular: number
}) => {
  const { quantityRegular } = data
  const ticketRegimen = props.ticketRegimenListDraft.find((i) => {
    return i._localId === data.trLocalId
  })
  if (!ticketRegimen) return
  const ticketRegimenItem = (ticketRegimen.ticketRegimenItemList || []).find((i) => {
    return i._localId === data.triLocalId
  })
  if (!ticketRegimenItem) return

  const oldQuantityRegular = ticketRegimenItem.quantityRegular
  ticketRegimenItem.quantityRegular = quantityRegular

  ticketRegimenItem.moneyAmountRegular = Math.floor(
    (ticketRegimenItem.moneyAmountRegular / oldQuantityRegular) * quantityRegular,
  )
  ticketRegimenItem.discountMoneyAmount = Math.floor(
    (ticketRegimenItem.discountMoneyAmount / oldQuantityRegular) * quantityRegular,
  )
  ticketRegimenItem.moneyAmountSale = Math.floor(
    (ticketRegimenItem.moneyAmountSale / oldQuantityRegular) * quantityRegular,
  )
  ticketRegimen.moneyAmountRegular = ticketRegimen.ticketRegimenItemList!.reduce((acc, item) => {
    return acc + item.moneyAmountRegular
  }, 0)
  ticketRegimen.discountMoney = ticketRegimen.ticketRegimenItemList!.reduce((acc, item) => {
    return acc + item.discountMoneyAmount
  }, 0)
  ticketRegimen.moneyAmountSale = ticketRegimen.ticketRegimenItemList!.reduce((acc, item) => {
    return acc + item.moneyAmountSale
  }, 0)
}

const totalMoney = computed(() => {
  return (
    props.ticketProcedureListDraft.reduce((acc, i) => acc + i.actualPrice * i.quantity, 0) +
    props.ticketRegimenListDraft.reduce((acc, i) => acc + i.moneyAmountSale, 0)
  )
})

defineExpose({ selectProcedure, selectRegimen })
</script>

<template>
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalProductDetail ref="modalProductDetail" />
  <ModalTicketProcedureUpdateMoney
    ref="modalTicketProcedureUpdateMoney"
    @success="handleModalTicketProcedureUpdateSuccess"
  />
  <ModalTicketProcedureUpdateUser
    ref="modalTicketProcedureUpdateUser"
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
          <th>#</th>
          <th>Dịch vụ</th>
          <th style="width: 150px">Số lượng</th>
          <th v-if="ticketRegimenListDraft.length" style="width: 100px">Cách ngày</th>
          <th>Đơn Giá</th>
          <th>Tổng Tiền</th>
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
            <td colspan="4">
              <div class="flex items-center gap-1 font-bold">
                <span>{{ tr.regimen?.name }}</span>
                <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                  ({{ tr.regimenId }})
                </span>
              </div>
            </td>
            <td>
              <div class="flex gap-2 items-center">
                <div>
                  <VueTag v-if="tr.discountMoney" color="green">
                    {{ tr.discountPercent + ' %' }}
                  </VueTag>
                </div>
                <div class="ml-auto">
                  <div v-if="tr.discountMoney" class="text-xs italic text-red-500">
                    <del>{{ formatMoney(tr.moneyAmountRegular) }}</del>
                  </div>
                  <div>{{ formatMoney(tr.moneyAmountSale) }}</div>
                </div>
                <a
                  style="font-size: 20px; color: var(--text-orange)"
                  @click="modalTicketRegimenUpdateMoney?.openModal({ ticketRegimen: tr })"
                >
                  <IconEditSquare />
                </a>
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(tr.moneyAmountSale) }}
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
          <tr v-for="(tri, triIndex) in tr.ticketRegimenItemList" :key="tri._localId">
            <td style="text-align: center">{{ triIndex + 1 }}</td>
            <td>
              <div class="flex flex-wrap gap-1">
                <span>{{ tri.procedure?.name }}</span>
                <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                  ({{ tri.procedureId }})
                </span>
              </div>
            </td>
            <td class="text-right">
              <InputNumber
                :value="tri.quantityRegular"
                buttonControl
                textAlign="right"
                @update:value="
                  (v) =>
                    handleChangeTicketRegimenItemQuantityExpected({
                      trLocalId: tr._localId,
                      triLocalId: tri._localId,
                      quantityRegular: v,
                    })
                "
              />
            </td>
            <td>
              <InputNumber v-model:value="tri.gapDay" textAlign="right" />
            </td>
            <td>
              <div class="flex justify-between items-center gap-4">
                <div>
                  <VueTag
                    v-if="tri.discountType === DiscountType.Percent && tri.discountMoneyAmount"
                    color="green"
                  >
                    {{ tri.discountPercent + ' %' }}
                  </VueTag>
                </div>
                <div>
                  <div v-if="tri.discountMoneyAmount" class="text-xs italic text-red-500">
                    <del>
                      {{ formatMoney(Math.floor(tri.moneyAmountRegular / tri.quantityRegular)) }}
                    </del>
                  </div>
                  <div>
                    {{ formatMoney(Math.floor(tri.moneyAmountSale / tri.quantityRegular)) }}
                  </div>
                </div>
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(tri.moneyAmountSale) }}
            </td>
            <td></td>
            <td></td>
          </tr>
        </template>
        <tr v-if="ticketRegimenListDraft.length && ticketProcedureListDraft.length">
          <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center"></td>
          <td colspan="100" class="font-bold">Dịch vụ lẻ</td>
        </tr>
        <tr v-for="(tp, index) in ticketProcedureListDraft" :key="tp._localId">
          <td style="text-align: center">{{ index + 1 }}</td>
          <td>
            <div class="flex items-center gap-1">
              <span>{{ tp.procedure?.name }}</span>
              <a style="line-height: 0" @click="modalProcedureDetail?.openModal(tp.procedureId)">
                <IconFileSearch />
              </a>
              <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                ({{ tp.procedureId }})
              </span>
            </div>
          </td>
          <td>
            <div class="flex justify-center">
              <InputNumber v-model:value="tp.quantity" textAlign="right" :buttonControl="true" />
            </div>
          </td>
          <td v-if="ticketRegimenListDraft.length"></td>
          <template v-if="!!tp.ticketRegimenId">
            <td colspan="4" class="text-center">
              <!-- <PaymentMoneyStatusTooltip :paymentMoneyStatus="tp.paymentMoneyStatus" /> -->
            </td>
          </template>
          <template v-else>
            <td class="flex items-center gap-2">
              <div class="ml-auto">
                <div v-if="tp.discountMoney" class="text-xs italic text-red-500">
                  <del>{{ formatMoney(tp.expectedPrice) }}</del>
                </div>
                <div>{{ formatMoney(tp.actualPrice) }}</div>
              </div>
              <a
                style="font-size: 20px; color: var(--text-orange)"
                @click="modalTicketProcedureUpdateMoney?.openModal({ ticketProcedure: tp })"
              >
                <IconEditSquare />
              </a>
            </td>
            <td class="text-right">
              <div>{{ formatMoney(tp.actualPrice * tp.quantity) }}</div>
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
                  @click="modalTicketProcedureUpdateUser?.openModal({ ticketProcedure: tp })"
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
          <td
            :colspan="ticketRegimenListDraft.length ? 5 : 4"
            class="text-right font-bold uppercase"
          >
            Tổng tiền
          </td>
          <td class="font-bold text-right">
            {{ formatMoney(totalMoney) }}
          </td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
