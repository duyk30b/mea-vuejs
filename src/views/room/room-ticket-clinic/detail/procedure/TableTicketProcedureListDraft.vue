<!-- eslint-disable vue/no-mutating-props -->
<script setup lang="ts">
import { VueTag } from '@/common'
import { IconBug, IconDelete, IconDollar, IconFileSearch, IconTeam } from '@/common/icon-antd'
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
import { VueTooltip } from '@/common/popover'

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
    temp.discountMoney = Math.round((temp.discountPercent * temp.expectedPrice) / 100)
  }
  temp.actualPrice = temp.expectedPrice - temp.discountMoney

  temp.status = TicketRegimenStatus.Pending
  temp.createdAt = Date.now()

  temp.regimen = regimenData

  const totalMoneyAmountRoot = (regimenData.regimenItemList || []).reduce((acc, item) => {
    return acc + (item.procedure?.price || 0) * item.quantity
  }, 0)
  let totalMoneyAmountRegularRemain = temp.expectedPrice
  let totalMoneyAmountSaleRemain = temp.actualPrice
  let totalDiscountMoneyAmountRemain = temp.discountMoney

  temp.ticketRegimenItemList = []
  for (let index = (regimenData.regimenItemList || []).length - 1; index >= 0; index--) {
    const ri = (regimenData.regimenItemList || [])[index]

    const tri = TicketRegimenItem.blank()
    tri.regimenId = ri.regimenId
    tri.procedureId = ri.procedureId
    tri.quantityRegular = ri.quantity
    tri.quantityUsed = 0
    tri.gapDay = 1
    tri.procedure = ri.procedure

    tri.moneyAmountRegular =
      totalMoneyAmountRoot === 0
        ? 0
        : Math.floor(
            ((ri.procedure?.price || 0) * (temp.expectedPrice / totalMoneyAmountRoot)) / 1000,
          ) *
          1000 *
          tri.quantityRegular
    tri.discountType = DiscountType.Percent
    tri.discountPercent = temp.discountPercent

    if (index !== 0) {
      tri.moneyAmountSale =
        tri.quantityRegular === 0
          ? 0
          : Math.floor(
              (tri.moneyAmountRegular * (100 - tri.discountPercent)) /
                100 /
                tri.quantityRegular /
                1000,
            ) *
            tri.quantityRegular *
            1000
      tri.discountMoneyAmount = tri.moneyAmountRegular - tri.moneyAmountSale

      totalMoneyAmountRegularRemain -= tri.moneyAmountRegular
      totalMoneyAmountSaleRemain -= tri.moneyAmountSale
      totalDiscountMoneyAmountRemain -= tri.discountMoneyAmount
    } else {
      tri.moneyAmountRegular = totalMoneyAmountRegularRemain
      tri.moneyAmountSale = totalMoneyAmountSaleRemain
      tri.discountMoneyAmount = totalDiscountMoneyAmountRemain
    }

    temp.ticketRegimenItemList.unshift(tri)
  }

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

  const totalMoneyAmountRoot = (ticketRegimen.ticketRegimenItemList || []).reduce((acc, item) => {
    return acc + (item.procedure?.price || 0) * item.quantityRegular
  }, 0)
  const rateRegular =
    totalMoneyAmountRoot === 0 ? 1 : ticketRegimen.expectedPrice / totalMoneyAmountRoot

  ticketRegimenItem.quantityRegular = quantityRegular
  ticketRegimenItem.moneyAmountRegular =
    (ticketRegimenItem.procedure?.price || 0) * rateRegular * quantityRegular

  ticketRegimenItem.discountMoneyAmount =
    Math.floor(
      (ticketRegimenItem.moneyAmountRegular * ticketRegimen.discountPercent) / 100 / 1000,
    ) * 1000
  ticketRegimenItem.moneyAmountSale =
    ticketRegimenItem.moneyAmountRegular - ticketRegimenItem.discountMoneyAmount

  ticketRegimen.expectedPrice = ticketRegimen.ticketRegimenItemList!.reduce((acc, item) => {
    return acc + item.moneyAmountRegular
  }, 0)
  ticketRegimen.discountMoney = ticketRegimen.ticketRegimenItemList!.reduce((acc, item) => {
    return acc + item.discountMoneyAmount
  }, 0)
  ticketRegimen.actualPrice = ticketRegimen.ticketRegimenItemList!.reduce((acc, item) => {
    return acc + item.moneyAmountSale
  }, 0)
}

const totalMoney = computed(() => {
  return (
    props.ticketProcedureListDraft.reduce((acc, i) => acc + i.actualPrice * i.quantity, 0) +
    props.ticketRegimenListDraft.reduce((acc, i) => acc + i.actualPrice, 0)
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
          <th v-if="CONFIG.MODE === 'development'"></th>
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
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              <VueTooltip>
                <template #trigger>
                  <IconBug width="1.2em" height="1.2em" />
                </template>
                <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
                  <pre>{{ JSON.stringify(tr, null, 4) }}</pre>
                </div>
              </VueTooltip>
            </td>
            <td colspan="4">{{ tr.regimen?.name }}</td>
            <td>
              <div class="flex gap-2 items-center">
                <div>
                  <VueTag v-if="tr.discountMoney" color="green">
                    {{ tr.discountPercent + ' %' }}
                  </VueTag>
                </div>
                <div class="ml-auto">
                  <div v-if="tr.discountMoney" class="text-xs italic text-red-500">
                    <del>{{ formatMoney(tr.expectedPrice) }}</del>
                  </div>
                  <div>{{ formatMoney(tr.actualPrice) }}</div>
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
              {{ formatMoney(tr.actualPrice) }}
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
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              <VueTooltip>
                <template #trigger>
                  <IconBug width="1.2em" height="1.2em" />
                </template>
                <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
                  <pre>{{ JSON.stringify(tri, null, 4) }}</pre>
                </div>
              </VueTooltip>
            </td>
            <td style="text-align: center">{{ triIndex + 1 }}</td>
            <td>{{ tri.procedure?.name }}</td>
            <td class="text-right">
              <InputNumber
                :value="tri.quantityRegular"
                controlHorizontal
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
              <div v-if="tri.discountMoneyAmount" class="text-xs italic text-red-500">
                <del>{{ formatMoney(tri.moneyAmountRegular) }}</del>
              </div>
              <div>{{ formatMoney(tri.moneyAmountSale) }}</div>
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
              <InputNumber v-model:value="tp.quantity" textAlign="right" controlHorizontal />
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
          <td v-if="CONFIG.MODE === 'development'"></td>
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
