<!-- eslint-disable vue/no-mutating-props -->
<script setup lang="ts">
import { IconDelete, IconFileSearch } from '@/common/icon-antd'
import { IconMinus, IconPlus } from '@/common/icon-font-awesome'
import { IconEditSquare } from '@/common/icon-google'
import { InputNumber } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType } from '@/modules/enum'
import { ProcedureService, ProcedureType, type Procedure } from '@/modules/procedure'
import { TicketProcedure, TicketProcedureStatus } from '@/modules/ticket-procedure'
import { TicketProcedureItem } from '@/modules/ticket-procedure/ticket-procedure-item.model'
import ModalProcedureDetail from '@/views/master-data/procedure/detail/ModalProcedureDetail.vue'
import { ref } from 'vue'
import ModalUpdateRequestTicketProcedure from './ModalUpdateRequestTicketProcedure.vue'

const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const props = withDefaults(defineProps<{ ticketProcedureListRequest: TicketProcedure[] }>(), {
  ticketProcedureListRequest: () => [],
})

const emit = defineEmits<{
  (e: 'removeProcedureId', procedureId: number): void
}>()

const modalUpdateRequestTicketProcedure =
  ref<InstanceType<typeof ModalUpdateRequestTicketProcedure>>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const procedureId = ref(0)

const selectProcedure = async (procedureData?: Procedure) => {
  if (procedureData) {
    const temp = TicketProcedure.blank()

    temp.priority = props.ticketProcedureListRequest.length + 1
    temp.ticketId = 0
    temp.customerId = 0
    temp.procedureId = procedureData.id
    temp.procedure = procedureData
    temp.procedureType = procedureData.procedureType

    temp.paymentMoneyStatus = settingStore.TICKET_CLINIC_DETAIL.procedure.paymentMoneyStatus
    if (procedureData.procedureType === ProcedureType.Basic) {
      temp.status = TicketProcedureStatus.Completed
    } else {
      temp.status = TicketProcedureStatus.Pending
    }

    temp.expectedPrice = procedureData.price
    temp.discountMoney = 0
    temp.discountPercent = 0
    temp.discountType = DiscountType.Percent
    temp.expectedPrice = procedureData.price
    temp.actualPrice = procedureData.price

    temp.quantity = 1
    temp.totalSessions = procedureData.totalSessions
    temp.createdAt = Date.now()

    temp.ticketUserRequestList = []

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

    if (procedureData.procedureType === ProcedureType.SingleProcess) {
      temp.ticketProcedureItemList = []
      const tpItem = TicketProcedureItem.blank()

      tpItem.registeredAt = null as any // để null để tránh tạo bản ghi hẹn

      temp.ticketProcedureItemList.push(tpItem)
    }
    if (procedureData.procedureType === ProcedureType.Regimen) {
      temp.ticketProcedureItemList = []
      const registeredAt = new Date()
      registeredAt.setMinutes(0, 0, 0)
      registeredAt.setHours(registeredAt.getHours() + 1)
      for (let i = 0; i < procedureData.totalSessions; i++) {
        const tpItem = TicketProcedureItem.blank()
        if (procedureData.gapHours !== 0) {
          tpItem.registeredAt = registeredAt.getTime() + i * procedureData.gapHours * 60 * 60 * 1000
        }
        temp.ticketProcedureItemList.push(tpItem)
      }
    }
    props.ticketProcedureListRequest.push(temp)
  } else {
  }
  procedureId.value = 0
}

const handleModalUpdateRequestTicketProcedureSuccess = (
  type: 'CREATE' | 'UPDATE' | 'DESTROY',
  ticketProcedureData: TicketProcedure,
) => {
  if (type === 'UPDATE') {
    const _localId = ticketProcedureData._localId
    const findIndex = props.ticketProcedureListRequest.findIndex((i) => {
      return i._localId === _localId
    })
    if (findIndex !== -1) {
      Object.assign(props.ticketProcedureListRequest[findIndex], ticketProcedureData)
      props.ticketProcedureListRequest[findIndex] = ticketProcedureData
    }
  }
}

const removeTicketProcedure = (ticketProcedureData: TicketProcedure) => {
  const indexRemove = props.ticketProcedureListRequest.findIndex((i) => {
    return i._localId === ticketProcedureData._localId
  })
  if (indexRemove !== -1) {
    props.ticketProcedureListRequest.splice(indexRemove, 1)
    emit('removeProcedureId', ticketProcedureData.procedureId)
  }
}

defineExpose({ selectProcedure })
</script>

<template>
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <ModalUpdateRequestTicketProcedure
    ref="modalUpdateRequestTicketProcedure"
    @success="handleModalUpdateRequestTicketProcedureSuccess"
  />
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th v-if="CONFIG.MODE === 'development'">ProcedureID</th>
          <th>#</th>
          <th>Dịch vụ</th>
          <th style="width: 150px">Số lượng</th>
          <th>Giá</th>
          <th>T.Tiền</th>
          <th v-if="CONFIG.MODE === 'development'">Nhân viên</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="ticketProcedureListRequest.length === 0">
          <td colspan="20" class="text-center">Không có dịch vụ nào</td>
        </tr>
        <tr v-for="(tp, index) in ticketProcedureListRequest" :key="tp._localId">
          <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
            {{ tp.procedureId }}
          </td>
          <td style="text-align: center">{{ index + 1 }}</td>
          <td :colspan="tp.procedure?.procedureType !== ProcedureType.Basic ? 2 : 1">
            <div class="flex items-center gap-1">
              <span>{{ tp.procedure?.name }}</span>
              <a style="line-height: 0" @click="modalProcedureDetail?.openModal(tp.procedureId)">
                <IconFileSearch />
              </a>
              <span v-if="tp.procedure?.procedureType === ProcedureType.Regimen" class="font-bold">
                ({{ tp.totalSessions }} buổi)
              </span>
            </div>
          </td>
          <td v-if="tp.procedure?.procedureType === ProcedureType.Basic">
            <div class="flex items-center justify-between">
              <button
                style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                :disabled="tp.quantity <= 0"
                @click="tp.quantity--"
                type="button"
              >
                <IconMinus />
              </button>
              <div style="width: calc(100% - 60px); min-width: 50px">
                <InputNumber v-model:value="tp.quantity" textAlign="right" />
              </div>
              <button
                style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                @click="tp.quantity++"
                type="button"
              >
                <IconPlus />
              </button>
            </div>
          </td>
          <td class="text-right">
            <div v-if="tp.discountMoney" class="text-xs italic text-red-500">
              <del>{{ formatMoney(tp.expectedPrice) }}</del>
            </div>
            <div>{{ formatMoney(tp.actualPrice) }}</div>
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
          <td>
            <a
              class="flex justify-center cursor-pointer"
              style="font-size: 20px"
              @click="modalUpdateRequestTicketProcedure?.openModal({ ticketProcedure: tp })"
            >
              <IconEditSquare />
            </a>
          </td>
          <td class="text-center">
            <div
              style="color: var(--text-red); cursor: pointer; font-size: 18px"
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
            {{ formatMoney(ticketProcedureListRequest.reduce((acc, i) => acc + i.actualPrice, 0)) }}
          </td>
          <td v-if="CONFIG.MODE === 'development'"></td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
