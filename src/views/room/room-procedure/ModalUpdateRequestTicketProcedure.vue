<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconDoubleRight } from '@/common/icon-antd'
import { IconDelete } from '@/common/icon-google'
import { InputDate, InputMoney, InputNumber, VueSelect } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import { PositionType } from '@/modules/position'
import { ProcedureType } from '@/modules/procedure'
import { ticketRoomRef } from '@/modules/room'
import { TicketChangeProcedureApi } from '@/modules/ticket'
import { TicketProcedure, TicketProcedureStatus } from '@/modules/ticket-procedure'
import { TicketProcedureItem } from '@/modules/ticket-procedure/ticket-procedure-item.model'
import { TicketUser } from '@/modules/ticket-user'
import { ESTimer } from '@/utils'
import { computed, ref } from 'vue'
import TicketChangeTicketUserPosition from '../room-user/TicketChangeTicketUserPosition.vue'
import TicketProcedureStatusTag from './TicketProcedureStatusTag.vue'

const ticketChangeTicketUserPosition = ref<InstanceType<typeof TicketChangeTicketUserPosition>>()

const emit = defineEmits<{
  (e: 'success', type: 'CREATE' | 'UPDATE' | 'DESTROY', data: TicketProcedure): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

let ticketProcedureOrigin = TicketProcedure.blank()
const ticketProcedure = ref<TicketProcedure>(TicketProcedure.blank())

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (data: { ticketProcedure: TicketProcedure }) => {
  ticketProcedureOrigin = data.ticketProcedure
  ticketProcedure.value = TicketProcedure.from(data.ticketProcedure)

  showModal.value = true
}

const hasChangeTicketProcedure = computed(() => {
  const result = !TicketProcedure.equal(ticketProcedureOrigin, ticketProcedure.value)
  return result
})

const hasChangeTicketProcedureItemList = computed(() => {
  const result = !TicketProcedureItem.equalList(
    ticketProcedureOrigin.ticketProcedureItemList || [],
    ticketProcedure.value.ticketProcedureItemList || [],
  )
  return result
})

const hasChangeTicketUserList = computed(() => {
  const result = !TicketUser.equalList(
    ticketProcedureOrigin.ticketUserRequestList || [],
    ticketProcedure.value.ticketUserRequestList || [],
  )
  return result
})

const hasChangeData = computed(() => {
  const result =
    hasChangeTicketProcedure.value ||
    hasChangeTicketProcedureItemList.value ||
    hasChangeTicketUserList.value
  return result
})

const handleChangeUnitDiscountMoney = (data: number) => {
  const discountMoney = data
  const expectedPrice = ticketProcedure.value.expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketProcedure.value.discountPercent = discountPercent
  ticketProcedure.value.discountMoney = discountMoney
  ticketProcedure.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeDiscountPercent = (data: number) => {
  const expectedPrice = ticketProcedure.value.expectedPrice || 0
  const discountMoney = Math.round((expectedPrice * (data || 0)) / 100)
  ticketProcedure.value.discountPercent = data
  ticketProcedure.value.discountMoney = discountMoney
  ticketProcedure.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeActualPrice = (data: number) => {
  const actualPrice = data
  const expectedPrice = ticketProcedure.value.expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketProcedure.value.discountPercent = discountPercent
  ticketProcedure.value.discountMoney = discountMoney
  ticketProcedure.value.discountType = DiscountType.VND
  ticketProcedure.value.actualPrice = actualPrice
}

const closeModal = () => {
  showModal.value = false
  ticketProcedure.value = TicketProcedure.blank()
  ticketProcedureOrigin = TicketProcedure.blank()
}

const clickDestroy = async () => {
  if (ticketProcedure.value.paymentMoneyStatus === PaymentMoneyStatus.Paid) {
    return ModalStore.alert({
      title: 'Không thể xóa dịch vụ ?',
      content: ['- Dịch vụ đã được thanh toán sẽ không thể xóa'],
    })
  }

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
          ticketProcedureId: ticketProcedure.value.id,
        })
        emit('success', 'DESTROY', ticketProcedure.value)
        closeModal()
      } catch (error) {
        console.log('🚀 ~ file: TicketClinicProcedure.vue:185 ~ onOk: ~ error:', error)
      }
    },
  })
}

const submitChangeTicketProcedure = async () => {
  if (ticketProcedure.value.procedure?.procedureType === ProcedureType.Regimen) {
    ticketProcedure.value.totalSessions = ticketProcedure.value.ticketProcedureItemList?.length || 0
  }

  if (ticketProcedure.value.id) {
    await fetchUpdateTicketProcedure()
  } else {
    emit('success', 'UPDATE', ticketProcedure.value)
    closeModal()
  }
}

const reCalculatorStatus = () => {
  const tpiList = ticketProcedure.value.ticketProcedureItemList || []

  ticketProcedure.value.finishedSessions = tpiList.filter((i) => {
    return [TicketProcedureStatus.Completed, TicketProcedureStatus.Cancelled].includes(i.status)
  }).length

  if (!tpiList.length) {
    ticketProcedure.value.status = TicketProcedureStatus.Empty
  } else if (tpiList.some((i) => i.status === TicketProcedureStatus.Completed)) {
    if (ticketProcedure.value.finishedSessions === ticketProcedure.value.totalSessions) {
      ticketProcedure.value.status = TicketProcedureStatus.Completed
    } else {
      ticketProcedure.value.status = TicketProcedureStatus.Executing
    }
  }
  if (tpiList.some((i) => i.status === TicketProcedureStatus.Pending)) {
    ticketProcedure.value.status = TicketProcedureStatus.Pending
  } else {
    ticketProcedure.value.status = TicketProcedureStatus.Cancelled
  }
}

const fetchUpdateTicketProcedure = async () => {
  saveLoading.value = true
  reCalculatorStatus()
  try {
    await TicketChangeProcedureApi.updateRequestTicketProcedure({
      ticketId: ticketRoomRef.value.id,
      ticketProcedureId: ticketProcedure.value.id,
      ticketProcedure: ticketProcedure.value,
      ticketProcedureItemList: hasChangeTicketProcedureItemList.value
        ? ticketProcedure.value.ticketProcedureItemList
        : undefined,
      ticketUserRequestList:
        hasChangeTicketProcedure.value || hasChangeTicketUserList.value
          ? ticketProcedure.value.ticketUserRequestList
          : undefined,
    })
    emit('success', 'UPDATE', ticketProcedure.value)
    closeModal()
  } catch (error) {
    console.log('🚀: ModalTicketProcedureUpdate.vue:205 ~ updateTicketProcedure ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleRemoveTicketProcedureItem = (tpItem: TicketProcedureItem) => {
  const indexRemove = (ticketProcedure.value.ticketProcedureItemList || []).findIndex((i) => {
    return i._localId === tpItem._localId
  })
  if (indexRemove !== -1) {
    ticketProcedure.value.ticketProcedureItemList!.splice(indexRemove, 1)
  }
}

const handleAddTicketProcedureItem = () => {
  const length = ticketProcedure.value.ticketProcedureItemList?.length || 0
  let lastRegisteredAt = ticketProcedure.value.ticketProcedureItemList?.[length - 1]?.registeredAt
  const nowTime = new Date()
  nowTime.setMinutes(0, 0, 0)

  const currentTime = lastRegisteredAt
    ? lastRegisteredAt + ticketProcedure.value.procedure!.gapHours * 60 * 60 * 1000
    : nowTime.getTime()

  const ticketProcedureAdd = TicketProcedureItem.blank()
  if (ticketProcedure.value.procedure!.gapHours != 0) {
    ticketProcedureAdd.registeredAt = currentTime
  }
  ticketProcedure.value.ticketProcedureItemList?.push(ticketProcedureAdd)
}

const handleUpdateTimeTicketProcedureItem = (time: any, index: number) => {
  for (let i = index + 1; i < ticketProcedure.value.ticketProcedureItemList!.length; i++) {
    const item = ticketProcedure.value.ticketProcedureItemList![i]
    if (!item || item.status === TicketProcedureStatus.Completed) return
    if (!time || ticketProcedure.value.procedure!.gapHours === 0) {
      item.registeredAt = null as any
    } else {
      let fixTime = new Date(time)
      fixTime.setMinutes(0, 0, 0)
      fixTime.setHours(fixTime.getHours() + 1)
      item.registeredAt =
        fixTime.getTime() + ticketProcedure.value.procedure!.gapHours * 60 * 60 * 1000 * (i - index)
    }
  }
}

const handleFixTicketUserList = (tuListData: TicketUser[]) => {
  ticketProcedureOrigin.ticketUserRequestList = TicketUser.fromList(tuListData)
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ ticketProcedure.procedure?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 gap-4" @submit.prevent="(e) => submitChangeTicketProcedure()">
        <div class="flex flex-wrap gap-4">
          <div
            v-if="ticketProcedure.procedure?.procedureType === ProcedureType.Basic"
            style="flex-grow: 1; flex-basis: 300px"
          >
            <div>Số lượng</div>
            <div>
              <InputNumber
                v-model:value="ticketProcedure.quantity"
                :disabled="ticketProcedure.paymentMoneyStatus === PaymentMoneyStatus.Paid"
                required
                :validate="{ gt: 0 }"
              />
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 300px">
            <div>Giá niêm yết</div>
            <div>
              <InputMoney v-model:value="ticketProcedure.expectedPrice" disabled />
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 300px">
            <div>
              Chiết khấu
              <span
                v-if="
                  ticketProcedure.discountType === DiscountType.Percent &&
                  ticketProcedure.discountPercent !== 0
                "
              >
                (
                <b>{{ formatMoney(ticketProcedure.discountMoney) }}</b>
                )
              </span>
            </div>
            <div class="flex">
              <VueSelect
                v-model:value="ticketProcedure.discountType"
                style="width: 120px"
                :options="[
                  { value: DiscountType.Percent, text: '%' },
                  { value: DiscountType.VND, text: 'VNĐ' },
                ]"
              />
              <div style="width: calc(100% - 120px)">
                <InputMoney
                  v-if="ticketProcedure.discountType === DiscountType.VND"
                  :value="ticketProcedure.discountMoney"
                  :disabled="ticketProcedure.paymentMoneyStatus === PaymentMoneyStatus.Paid"
                  @update:value="handleChangeUnitDiscountMoney"
                  :validate="{ gte: 0 }"
                />
                <InputNumber
                  v-else
                  :value="ticketProcedure.discountPercent"
                  :disabled="ticketProcedure.paymentMoneyStatus === PaymentMoneyStatus.Paid"
                  @update:value="handleChangeDiscountPercent"
                  :validate="{ gte: 0, lte: 100 }"
                />
              </div>
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 300px">
            <div>Đơn giá</div>
            <div style="width: 100%">
              <InputMoney
                :value="ticketProcedure.actualPrice"
                :disabled="ticketProcedure.paymentMoneyStatus === PaymentMoneyStatus.Paid"
                @update:value="handleChangeActualPrice"
              />
            </div>
          </div>
        </div>
        <div class="mt-4">
          <TicketChangeTicketUserPosition
            ref="ticketChangeTicketUserPosition"
            v-model:ticketUserList="ticketProcedure.ticketUserRequestList!"
            :positionType="PositionType.ProcedureRequest"
            :positionInteractId="ticketProcedure.procedureId"
            @fix:ticketUserList="handleFixTicketUserList"
            title="Nhân viên tư vấn, chỉ định dịch vụ"
          />
        </div>

        <div
          v-if="ticketProcedure.procedure?.procedureType === ProcedureType.Regimen"
          class="mt-4 w-full"
        >
          <div
            class="font-bold flex gap-2 flex-wrap items-center"
            style="flex-basis: 90%; flex-grow: 1; min-width: 300px"
          >
            <IconDoubleRight />
            <span>Thời gian thực hiện các buổi:</span>
            <span style="margin-left: auto">
              Tổng {{ ticketProcedure.ticketProcedureItemList?.length }} buổi
            </span>
          </div>
          <div class="mt-2 w-full table table-wrapper">
            <table>
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'">ID</th>
                  <th>#</th>
                  <th>Trạng Thái</th>
                  <th>Thời gian</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(tpItem, index) in ticketProcedure.ticketProcedureItemList || []"
                  :key="tpItem._localId"
                >
                  <td
                    v-if="CONFIG.MODE === 'development'"
                    class="text-center"
                    style="color: violet"
                  >
                    {{ tpItem.id }}
                  </td>
                  <td class="text-center">
                    <TicketProcedureStatusTag :status="tpItem.status" />
                  </td>
                  <td class="text-center">Buổi {{ index + 1 }}</td>
                  <td>
                    <div v-if="tpItem.status === TicketProcedureStatus.Completed">
                      {{ ESTimer.timeToText(tpItem.completedAt, 'hh:mm DD/MM/YYYY') }}
                    </div>
                    <InputDate
                      v-else-if="tpItem.status === TicketProcedureStatus.Pending"
                      v-model:value="tpItem.registeredAt"
                      show-time
                      typeParser="number"
                      @update:value="(v) => handleUpdateTimeTicketProcedureItem(v, index)"
                    />
                  </td>
                  <td>
                    <div
                      v-if="
                        [TicketProcedureStatus.Pending, TicketProcedureStatus.Cancelled].includes(
                          tpItem.status,
                        )
                      "
                      class="flex justify-center cursor-pointer"
                      style="font-size: 20px"
                      @click="handleRemoveTicketProcedureItem(tpItem)"
                    >
                      <IconDelete style="color: var(--text-red)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="mt-2">
              <a @click="handleAddTicketProcedureItem">✚ Thêm buổi</a>
            </div>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 80%" class="mt-6 flex gap-4">
          <VueButton v-if="ticketProcedure.id" color="red" icon="trash" @click="clickDestroy">
            Xóa
          </VueButton>
          <VueButton style="margin-left: auto" type="reset" icon="close" @click="closeModal">
            Đóng lại
          </VueButton>
          <VueButton
            :disabled="!hasChangeData"
            :loading="saveLoading"
            color="blue"
            type="submit"
            icon="save"
          >
            Cập nhật
          </VueButton>
        </div>
      </form>
    </div>
  </VueModal>
</template>
<style lang="scss" scope></style>
