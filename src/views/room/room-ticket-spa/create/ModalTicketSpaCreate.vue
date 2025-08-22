<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconDelete, IconDoubleRight } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputCheckbox, InputDate, InputRadio, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Appointment } from '@/modules/appointment'
import { Customer } from '@/modules/customer/customer.model'
import { DiscountType } from '@/modules/enum'
import { ProcedureService, ProcedureType, type Procedure } from '@/modules/procedure'
import { RoomInteractType, RoomTicketStyle } from '@/modules/room'
import {
  Ticket,
  TicketActionApi,
  TicketReceptionApi,
  TicketService,
  TicketStatus,
} from '@/modules/ticket'
import type { TicketAttributeKeyGeneralType, TicketAttributeMap } from '@/modules/ticket-attribute'
import { TicketProcedure, TicketProcedureStatus } from '@/modules/ticket-procedure'
import { TicketProcedureItem } from '@/modules/ticket-procedure/ticket-procedure-item.model'
import { TicketUser } from '@/modules/ticket-user'
import { User } from '@/modules/user'
import { ESTimer } from '@/utils'
import InputSearchCustomer from '@/views/component/InputSearchCustomer.vue'
import InputSearchProcedure from '@/views/component/InputSearchProcedure.vue'
import InputSelectRoom from '@/views/component/InputSelectRoom.vue'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import { ref } from 'vue'
import ModalTicketProcedureUpdate from '../../room-ticket-base/procedure/ModalTicketProcedureUpdate.vue'
import { IconEditSquare } from '@/common/icon-google'

const ticketClinicCreateForm = ref<InstanceType<typeof HTMLFormElement>>()
const modalTicketProcedureUpdate = ref<InstanceType<typeof ModalTicketProcedureUpdate>>()

const emit = defineEmits<{
  (e: 'success', ticketId: number): void
}>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission } = MeService

const appointmentOptions = ref<Appointment[]>([])

const currentCustomer = ref(Customer.blank())
const ticketId = ref(0)
const ticket = ref<Ticket>(Ticket.blank())

const ticketUserList = ref<TicketUser[]>([])
const ticketAttributeMap = ref<TicketAttributeMap>({})

const procedureId = ref(0)
const ticketProcedureListRequest = ref<TicketProcedure[]>([])

const fromAppointmentId = ref(0)

const ticketStatusRegister = ref<TicketStatus>(TicketStatus.Draft)
const showModal = ref(false)
const saveLoading = ref(false)

const startFetchData = async (options: { ticketId: number; roomId: number }) => {
  ticketId.value = options.ticketId

  try {
    if (!options.ticketId) {
      ticket.value = Ticket.blank()
      ticket.value.registeredAt = Date.now()
      ticket.value.roomId = options.roomId
      currentCustomer.value = Customer.blank()
    } else {
      ticket.value = await TicketService.detail(options.ticketId, {
        relation: {
          customer: true,
          ticketAttributeList: true,
          ticketUserList: {},
          customerSource: true,
        },
      })
      currentCustomer.value = Customer.from(ticket.value.customer || Customer.blank())
    }
  } catch (error) {
    console.log('🚀 ~ ModalTicketClinicCreate.vue:141 ~ startFetchData ~ error:', error)
  }
}

const openModal = async (options: {
  roomId: number
  ticketId?: number
  ticketStatusRegister?: TicketStatus
}) => {
  showModal.value = true

  ticketStatusRegister.value = options.ticketStatusRegister || TicketStatus.Draft

  startFetchData({ ticketId: options?.ticketId || 0, roomId: options.roomId })
}

const closeModal = () => {
  appointmentOptions.value = []

  currentCustomer.value = Customer.blank()
  ticket.value = Ticket.blank()
  ticketUserList.value = []
  ticketAttributeMap.value = {}
  fromAppointmentId.value = 0
  ticketProcedureListRequest.value = []

  showModal.value = false
}

const handleChangeCheckboxAppointment = (e: Event, appointment: Appointment) => {
  if ((e.target as HTMLInputElement).checked) {
    fromAppointmentId.value = appointment.id
    ticketAttributeMap.value.reason = appointment.reason || ''
    ticket.value.customerSourceId = appointment.customerSourceId
  } else {
    fromAppointmentId.value = 0
    ticket.value.customerSourceId = 0
  }
}

const handleClickDestroy = async () => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa lượt tiếp đón này ?',
    content: 'Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    onOk: async () => {
      try {
        await TicketActionApi.destroy(ticket.value.id)
        AlertStore.addSuccess('Xóa phiếu tiếp đón thành công')
        emit('success', ticket.value.id)
        closeModal()
      } catch (error) {
        console.log('🚀 ModalTicketClinicCreate.vue:356 ~ handleClickDestroy: ~ error:', error)
      }
    },
  })
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const ticketAttributeList = Object.entries(ticketAttributeMap.value).map(([key, value]) => ({
      key,
      value: value != null ? value : '',
    }))

    if (!ticket.value.id) {
      if (ESTimer.timeToText(ticket.value.registeredAt) !== ESTimer.timeToText(new Date())) {
        return AlertStore.addError(
          'Thời gian đăng ký tiếp đón không hợp lệ. Chỉ được đăng ký tiếp đón trong ngày',
        )
      }
      if (currentCustomer.value.healthHistory) {
        const key: TicketAttributeKeyGeneralType = 'healthHistory'
        ticketAttributeList.push({
          value: currentCustomer.value.healthHistory,
          key,
        })
      }
      const ticketCreated = await TicketReceptionApi.create({
        customer: currentCustomer.value,
        ticketReception: {
          roomId: ticket.value.roomId,
          status: ticketStatusRegister.value,
          registeredAt: ticket.value.registeredAt,
          customerSourceId: ticket.value.customerSourceId,
          note: ticket.value.note || '',
          customerId: currentCustomer.value.id,
          fromAppointmentId: fromAppointmentId.value,
        },
        ticketAttributeList,
        ticketUserList: ticketUserList.value,
        ticketProcedureList: ticketProcedureListRequest.value,
      })
      emit('success', ticketCreated.id)
    }
    if (ticket.value.id) {
      await TicketReceptionApi.update({
        ticketId: ticket.value.id,
        ticketReception: {
          roomId: ticket.value.roomId,
          registeredAt: ticket.value.registeredAt,
          customerSourceId: ticket.value.customerSourceId,
          note: ticket.value.note || '',
        },
        ticketAttributeList,
        ticketUserList: ticketUserList.value,
      })
      emit('success', ticket.value.id)
    }

    closeModal()
  } catch (error) {
    console.log('🚀 ModalTicketClinicCreate.vue:369 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const selectProcedure = async (procedureData?: Procedure) => {
  if (procedureData) {
    const temp = TicketProcedure.blank()

    temp.priority = ticketProcedureListRequest.value.length + 1
    temp.ticketId = 0
    temp.customerId = 0
    temp.procedureId = procedureData.id
    temp.procedure = procedureData

    temp.paymentMoneyStatus = settingStore.TICKET_CLINIC_DETAIL.procedure.paymentMoneyStatus
    temp.status = TicketProcedureStatus.Pending

    temp.expectedPrice = procedureData.price
    temp.discountMoney = 0
    temp.discountPercent = 0
    temp.discountType = DiscountType.Percent
    temp.expectedPrice = procedureData.price
    temp.actualPrice = procedureData.price

    temp.quantity = 1
    temp.totalSessions = procedureData.totalSessions
    temp.startedAt = Date.now()

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

    if (procedureData.procedureType === ProcedureType.Regimen) {
      temp.ticketProcedureItemList = []
      const startedAt = new Date()
      startedAt.setMinutes(0, 0, 0)
      startedAt.setHours(startedAt.getHours() + 1)
      for (let i = 0; i < procedureData.totalSessions; i++) {
        const tpItem = TicketProcedureItem.blank()
        tpItem.completedAt = startedAt.getTime() + i * procedureData.gapHours * 60 * 60 * 1000
        temp.ticketProcedureItemList.push(tpItem)
      }
    }
    ticketProcedureListRequest.value.push(temp)
  } else {
  }
  procedureId.value = 0
}

const handleModalTicketProcedureUpdateSuccess = (
  ticketProcedureData: TicketProcedure,
  type: 'CREATE' | 'UPDATE' | 'DESTROY',
) => {
  if (type === 'UPDATE') {
    const findIndex = ticketProcedureListRequest.value.findIndex((i) => {
      return i._localId === ticketProcedureData._localId
    })
    if (findIndex !== -1) {
      ticketProcedureListRequest.value[findIndex] = ticketProcedureData
    }
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 1000px; margin-top: 40px" @close="closeModal">
    <form ref="ticketClinicCreateForm" class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          <span v-if="!ticket.customerId">Tiếp đón khách hàng mới</span>
          <span v-if="!!ticket.customerId">Sửa thông tin tiếp đón</span>
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 flex flex-wrap gap-3">
        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <InputSearchCustomer
            v-model:customerId="currentCustomer.id"
            v-model:text="currentCustomer.fullName"
            :customer="ticket.customer"
            :disabled="!!ticket.id"
            required
            @selectCustomer="(v) => (currentCustomer = Customer.from(v))"
            :clearTextIfNoSelect="false"
          />
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Số điện thoại</div>
          <div style="">
            <InputText
              v-model:value="currentCustomer.phone"
              :disabled="!!currentCustomer.id"
              pattern="[0][356789][0-9]{8}"
              title="Định dạng số điện thoại không đúng"
              @update:value="(e: string) => (currentCustomer.phone = e.replace(/ /g, ''))"
            />
          </div>
        </div>

        <template v-if="!ticketId">
          <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
            <div>Ngày sinh</div>
            <div>
              <InputDate
                v-model:value="currentCustomer.birthday"
                v-model:year="currentCustomer.yearOfBirth"
                :disabled="!!currentCustomer.id"
                format="DD/MM/YYYY"
                type-parser="number"
                class="w-full"
              />
            </div>
          </div>

          <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
            <div>Giới tính</div>
            <div>
              <InputRadio
                v-model:value="currentCustomer.gender"
                :disabled="!!currentCustomer.id"
                :options="[
                  { key: 1, label: 'Nam' },
                  { key: 0, label: 'Nữ' },
                ]"
              />
            </div>
          </div>
        </template>

        <div v-if="!ticketId && appointmentOptions.length" class="grow basis-[80%]">
          <div>Khách hàng đến theo hẹn ?</div>
          <div class="ml-4">
            <div v-for="(appointment, index) in appointmentOptions" :key="index">
              <InputCheckbox
                :checked="fromAppointmentId === appointment.id"
                @change="(e: Event) => handleChangeCheckboxAppointment(e, appointment)"
              >
                <span>{{ ESTimer.timeToText(appointment.registeredAt, 'DD/MM/YYYY hh:mm ') }}</span>
                <span>- Lý do: {{ appointment.reason }}</span>
              </InputCheckbox>
            </div>
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Thời gian đăng ký</div>
          <div>
            <InputDate
              v-model:value="ticket.registeredAt"
              type-parser="number"
              class="w-full"
              show-time
            />
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Đăng ký phòng</div>
          <div>
            <InputSelectRoom
              v-model:roomId="ticket.roomId"
              :roomInteractType="RoomInteractType.Ticket"
              :roomTicketStyle="RoomTicketStyle.TicketSpa"
              removeLabelWrapper
              autoSelectFirstValue
            />
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
          <div>Lý do</div>
          <div>
            <InputText v-model:value="ticket.note" />
          </div>
        </div>
      </div>

      <div v-if="!ticketId" class="px-4 mt-4">
        <div class="font-bold">
          <IconDoubleRight />
          Yêu cầu dịch vụ
        </div>
        <div>
          <InputSearchProcedure
            v-model:procedureId="procedureId"
            @selectProcedure="selectProcedure"
            removeLabelWrapper
          />
        </div>
        <div class="table-wrapper mt-2">
          <table>
            <thead>
              <tr>
                <th v-if="CONFIG.MODE === 'development'">ProcedureID</th>
                <th>#</th>
                <th>Dịch vụ</th>
                <th>SL</th>
                <th>Giá</th>
                <th>T.Tiền</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="ticketProcedureListRequest.length === 0">
                <td colspan="20" class="text-center">Không có dịch vụ nào</td>
              </tr>
              <tr v-for="(tpItem, index) in ticketProcedureListRequest" :key="tpItem._localId">
                <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                  {{ tpItem.procedureId }}
                </td>
                <td style="text-align: center">{{ index + 1 }}</td>
                <td :colspan="tpItem.procedure?.procedureType !== ProcedureType.Basic ? 2 : 1">
                  <span>{{ tpItem.procedure?.name }}</span>
                  <span
                    v-if="tpItem.procedure?.procedureType === ProcedureType.Regimen"
                    class="font-bold"
                  >
                    ({{ tpItem.totalSessions }} buổi)
                  </span>
                </td>
                <td
                  class="text-center"
                  v-if="tpItem.procedure?.procedureType === ProcedureType.Basic"
                >
                  {{ tpItem.quantity }}
                </td>
                <td class="text-right">
                  <div v-if="tpItem.discountMoney" class="text-xs italic text-red-500">
                    <del>{{ formatMoney(tpItem.expectedPrice) }}</del>
                  </div>
                  <div>{{ formatMoney(tpItem.actualPrice) }}</div>
                </td>
                <td class="text-right">
                  {{ formatMoney(tpItem.actualPrice * tpItem.quantity) }}
                </td>
                <td>
                  <a
                    class="flex justify-center cursor-pointer"
                    style="font-size: 20px"
                    @click="modalTicketProcedureUpdate?.openModal(tpItem)"
                  >
                    <IconEditSquare />
                  </a>
                </td>
                <td class="text-center">
                  <div
                    style="color: var(--text-red); cursor: pointer; font-size: 18px"
                    @click="ticketProcedureListRequest.splice(index, 1)"
                  >
                    <IconDelete />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex flex-wrap gap-4">
          <VueButton
            v-if="ticket.id && [TicketStatus.Schedule, TicketStatus.Draft].includes(ticket.status)"
            color="red"
            icon="trash"
            @click="handleClickDestroy"
          >
            Xóa
          </VueButton>
          <div style="margin-left: auto">
            <VueButton icon="close" type="reset" @click="closeModal">Hủy bỏ</VueButton>
          </div>
          <VueButton class="btn btn-blue" icon="save" type="submit" :loading="saveLoading">
            <span v-if="!ticket.id">ĐĂNG KÝ</span>
            <span v-else>CẬP NHẬT THÔNG TIN</span>
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalTicketProcedureUpdate
    ref="modalTicketProcedureUpdate"
    @success="handleModalTicketProcedureUpdateSuccess"
  />
</template>
