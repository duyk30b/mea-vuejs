<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconDoubleRight, IconSetting } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputCheckbox, InputDate, InputRadio, InputText } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Appointment, AppointmentApi, AppointmentStatus } from '@/modules/appointment'
import { Customer } from '@/modules/customer/customer.model'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PositionType } from '@/modules/position'
import { type Procedure } from '@/modules/procedure'
import { Room, RoomService, RoomTicketStyle, RoomType } from '@/modules/room'
import {
  Ticket,
  TicketActionApi,
  TicketReceptionApi,
  TicketService,
  TicketStatus,
} from '@/modules/ticket'
import type { TicketAttributeKeyGeneralType, TicketAttributeMap } from '@/modules/ticket-attribute'
import { TicketProcedure } from '@/modules/ticket-procedure'
import { TicketUser } from '@/modules/ticket-user'
import { ESTimer } from '@/utils'
import InputAddress from '@/views/component/InputAddress.vue'
import InputSearchCustomer from '@/views/component/InputSearchCustomer.vue'
import InputSearchProcedure from '@/views/component/InputSearchProcedure.vue'
import InputSelectCustomerSource from '@/views/component/InputSelectCustomerSource.vue'
import InputSelectRoom from '@/views/component/InputSelectRoom.vue'
import { nextTick, ref } from 'vue'
import TableTicketProcedureListRequest from '../../room-ticket-clinic/detail/procedure/TableTicketProcedureListDraft.vue'
import DiagnosisObstetric from '../../room-ticket-clinic/detail/diagnosis/DiagnosisObstetric.vue'
import DiagnosisVitalSigns from '../../room-ticket-clinic/detail/diagnosis/DiagnosisVitalSigns.vue'
import TicketChangeTicketUserPosition from '../../room-user/TicketChangeTicketUserPosition.vue'
import ModalTicketClinicCreateSetting from './ModalTicketClinicCreateSetting.vue'
import type { TicketRegimen } from '@/modules/ticket-regimen'

const modalTicketClinicCreateSetting = ref<InstanceType<typeof ModalTicketClinicCreateSetting>>()
const tableTicketProcedureListRequest = ref<InstanceType<typeof TableTicketProcedureListRequest>>()

const ticketClinicCreateForm = ref<InstanceType<typeof HTMLFormElement>>()

const emit = defineEmits<{
  (e: 'success', type: 'CREATE' | 'UPDATE' | 'DESTROY', ticketId: number): void
}>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission } = MeService

const appointmentOptions = ref<Appointment[]>([])

const currentRoom = ref(Room.blank())

const customerOptions = ref<{ value: number; text: string; data: Customer }[]>([])

const currentCustomer = ref<Customer>(Customer.blank())
const ticketId = ref(0)
const ticket = ref<Ticket>(Ticket.blank())

const ticketAttributeMap = ref<TicketAttributeMap>({})

const procedureId = ref(0)
const ticketProcedureListDraft = ref<TicketProcedure[]>([])
const ticketRegimenListDraft = ref<TicketRegimen[]>([])

const fromAppointmentId = ref(0)

const ticketStatusRegister = ref<TicketStatus>(TicketStatus.Draft)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (options: {
  roomId: number
  ticketId?: number
  ticketStatusRegister?: TicketStatus
}) => {
  showModal.value = true

  currentRoom.value = await RoomService.detail(options.roomId)

  ticketStatusRegister.value = options.ticketStatusRegister || TicketStatus.Draft

  try {
    if (!options.ticketId) {
      ticket.value = Ticket.blank()
      ticket.value.registeredAt = Date.now()
      ticket.value.roomId = options.roomId
    } else {
      const ticketResponse = await TicketService.detail(options.ticketId, {
        relation: {
          customer: true,
          ticketAttributeList: true,
          ticketUserList: {},
          customerSource: true,
        },
      })
      ticketResponse.refreshTicketUserTree()
      ticketResponse.ticketUserReceptionList =
        ticketResponse.ticketUserTree[PositionType.TicketReception]?.[0] || []
      ticket.value = ticketResponse
    }

    currentCustomer.value = Customer.from(ticket.value.customer)
  } catch (error) {
    console.log('🚀 ~ ModalTicketClinicCreate.vue:109 ~ openModal ~ error:', error)
  }
}

const closeModal = () => {
  customerOptions.value = []
  appointmentOptions.value = []

  currentCustomer.value = Customer.blank()
  ticket.value = Ticket.blank()
  ticketAttributeMap.value = {}
  fromAppointmentId.value = 0
  ticketProcedureListDraft.value = []
  ticketRegimenListDraft.value = []

  showModal.value = false
}

const selectCustomer = async (customerSelect?: Customer) => {
  if (!customerSelect) {
    currentCustomer.value = Customer.blank()
    return
  }
  currentCustomer.value = Customer.from(customerSelect)

  try {
    ticket.value.customerSourceId = customerSelect.customerSourceId

    const appointmentList = await AppointmentApi.list({
      filter: {
        status: { IN: [AppointmentStatus.Waiting, AppointmentStatus.Confirm] },
        customerId: customerSelect.id,
      },
    })

    appointmentOptions.value = appointmentList.sort((a, b) => {
      return a.registeredAt > b.registeredAt ? 1 : -1
    })
    appointmentOptions.value.forEach((i) => {
      if (ESTimer.timeToText(i.registeredAt) === ESTimer.timeToText(new Date())) {
        fromAppointmentId.value = i.id
      }
    })
  } catch (error) {
    console.log('🚀 ~ file: ModalTicketClinicCreate.vue:167 ~ selectCustomer ~ error:', error)
  }
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

const handleModalTicketClinicCreateSettingSuccess = () => {}

const handleClickDestroy = async () => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa lượt khám này ?',
    content: 'Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    onOk: async () => {
      try {
        await TicketActionApi.destroy(ticket.value.id)
        AlertStore.addSuccess('Xóa phiếu khám thành công')
        emit('success', 'DESTROY', ticket.value.id)
        closeModal()
      } catch (error) {
        console.log('🚀 ModalTicketClinicCreate.vue:356 ~ handleClickDestroy: ~ error:', error)
      }
    },
  })
}

const handleSubmitFormTicketClinic = async () => {
  saveLoading.value = true
  try {
    const ticketAttributeList = Object.entries(ticketAttributeMap.value).map(([key, value]) => ({
      key,
      value: value != null ? value : '',
    }))

    if (!ticket.value.id) {
      if (ESTimer.timeToText(ticket.value.registeredAt) !== ESTimer.timeToText(new Date())) {
        return AlertStore.addError(
          'Thời gian đăng ký khám không hợp lệ. Chỉ được đăng ký khám trong ngày',
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
          note: ticket.value.note,
          customerId: currentCustomer.value.id,
          fromAppointmentId: fromAppointmentId.value,
        },
        ticketAttributeList,
        ticketUserReceptionList: ticket.value.ticketUserReceptionList || [],
        ticketRegimenAddWrapList: ticketRegimenListDraft.value.map((i) => {
          return {
            ticketRegimenAdd: i,
            ticketProcedureRegimenAddWrapList: (i.ticketProcedureWrapList || []).map((tpWrap) => {
              return {
                totalSession: tpWrap.totalSession,
                ticketProcedureAdd: tpWrap.ticketProcedure,
              }
            }),
            ticketUserRequestAddList: i.ticketUserRequestList || [],
          }
        }),
        ticketProcedureNormalWrapList: ticketProcedureListDraft.value.map((i) => {
          return {
            ticketProcedureAdd: i,
            ticketUserRequestAddList: i.ticketUserRequestList || [],
          }
        }),
      })
      emit('success', 'CREATE', ticketCreated.id)
    }
    if (ticket.value.id) {
      await TicketReceptionApi.update({
        ticketId: ticket.value.id,
        ticketReception: {
          roomId: ticket.value.roomId,
          registeredAt: ticket.value.registeredAt,
          customerSourceId: ticket.value.customerSourceId,
          note: ticket.value.note,
        },
        ticketAttributeList,
        ticketUserReceptionList: ticket.value.ticketUserReceptionList || [],
      })
      emit('success', 'UPDATE', ticket.value.id)
    }

    closeModal()
  } catch (error) {
    console.log('🚀 ModalTicketClinicCreate.vue:369 ~ handleSubmitFormTicketClinic ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const selectProcedure = async (procedureData?: Procedure) => {
  if (!procedureData) return
  const temp = await tableTicketProcedureListRequest.value?.selectProcedure({
    procedure: procedureData,
  })
  if (temp) {
    ticketProcedureListDraft.value.push(temp)
  }
  await nextTick()
  procedureId.value = 0
}

const handleFixTicketUserList = (tuListData: TicketUser[]) => {
  ticket.value.ticketUserReceptionList = TicketUser.fromList(tuListData)
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 1000px; margin-top: 40px" @close="closeModal">
    <form
      ref="ticketClinicCreateForm"
      class="bg-white"
      @submit.prevent="handleSubmitFormTicketClinic"
    >
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          <span v-if="!ticket.customerId">Tiếp đón khách hàng mới</span>
          <span v-if="!!ticket.customerId">Sửa thông tin tiếp đón</span>
        </div>
        <div
          v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalTicketClinicCreateSetting?.openModal()"
        >
          <IconSetting />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 flex flex-wrap gap-3">
        <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <InputSearchCustomer
            v-model:customerId="currentCustomer.id"
            v-model:text="currentCustomer.fullName"
            :customer="ticket.customer"
            :disabled="!!ticket.id"
            required
            @selectCustomer="selectCustomer"
            :clearTextIfNoSelect="false"
          />
        </div>

        <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Số điện thoại</div>
          <div>
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
          <div
            v-if="settingStore.TICKET_CLINIC_CREATE.facebook"
            :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle"
          >
            <div>Link Facebook</div>
            <div>
              <InputText
                v-model:value="currentCustomer.facebook"
                :disabled="!!currentCustomer.id"
                type="url"
              />
            </div>
          </div>

          <div
            v-if="settingStore.TICKET_CLINIC_CREATE.zalo"
            :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle"
          >
            <div>Link Zalo</div>
            <div>
              <InputText
                v-model:value="currentCustomer.zalo"
                :disabled="!!currentCustomer.id"
                type="url"
              />
            </div>
          </div>

          <div
            v-if="settingStore.TICKET_CLINIC_CREATE.birthday"
            :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle"
          >
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

          <div
            v-if="settingStore.TICKET_CLINIC_CREATE.gender"
            :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle"
          >
            <div>Giới tính</div>
            <div>
              <InputRadio
                v-model:value="currentCustomer!.gender"
                :disabled="!!currentCustomer!.id"
                :options="[
                  { key: 1, label: 'Nam' },
                  { key: 0, label: 'Nữ' },
                ]"
              />
            </div>
          </div>

          <template v-if="settingStore.TICKET_CLINIC_CREATE.address">
            <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
              <div>Địa chỉ</div>
              <div>
                <InputAddress
                  v-model:province="currentCustomer!.addressProvince"
                  v-model:ward="currentCustomer!.addressWard"
                  :disabled="!!currentCustomer.id"
                />
              </div>
            </div>

            <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
              <div>Số nhà, ngõ ...</div>
              <div>
                <InputText
                  v-model:value="currentCustomer!.addressStreet"
                  placeholder="Số nhà, ngõ ..."
                  :disabled="!!currentCustomer.id"
                />
              </div>
            </div>
          </template>

          <div
            v-if="settingStore.TICKET_CLINIC_CREATE.relative"
            :disabled="!!currentCustomer.id"
            :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle"
          >
            <div>Liên hệ khác</div>
            <div>
              <InputText
                v-model:value="currentCustomer.relative"
                :disabled="!!currentCustomer.id"
                placeholder="Tên người thân, số điện thoại"
              />
            </div>
          </div>

          <div
            v-if="settingStore.TICKET_CLINIC_CREATE.note"
            :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle"
          >
            <div>Ghi chú</div>
            <div style="flex: 1">
              <InputText v-model:value="currentCustomer.note" :disabled="!!currentCustomer.id" />
            </div>
          </div>
        </template>

        <div v-if="appointmentOptions.length" class="grow basis-[80%]">
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

        <div
          v-if="settingStore.TICKET_CLINIC_CREATE.customerSource"
          :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle"
        >
          <InputSelectCustomerSource v-model:customerSourceId="ticket.customerSourceId" />
        </div>

        <div
          v-if="currentRoom.roomStyle === RoomTicketStyle.TicketClinicObstetric"
          style="flex-basis: 90%; flex-grow: 1"
          class="flex gap-4"
        >
          <DiagnosisObstetric :ticketAttributeMap="ticketAttributeMap" />
          <DiagnosisVitalSigns :ticketAttributeMap="ticketAttributeMap" />
        </div>

        <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Thời gian đăng ký khám</div>
          <div>
            <InputDate
              v-model:value="ticket.registeredAt"
              type-parser="number"
              class="w-full"
              show-time
            />
          </div>
        </div>
        <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Đăng ký phòng</div>
          <div>
            <InputSelectRoom
              v-model:roomId="ticket.roomId"
              :roomType="RoomType.Ticket"
              removeLabelWrapper
            />
          </div>
        </div>

        <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Lý do / Chẩn đoán</div>
          <div>
            <InputText v-model:value="ticket.note" />
          </div>
        </div>
        <div v-if="ticket.id" style="flex-basis: 95%; flex-grow: 1">
          <TicketChangeTicketUserPosition
            ref="ticketChangeTicketUserPosition"
            v-model:ticketUserList="ticket.ticketUserReceptionList!"
            :positionType="PositionType.TicketReception"
            :positionInteractId="0"
            @fix:ticketUserList="handleFixTicketUserList"
            title="Nhân viên tiếp đón"
          />
        </div>
        <div v-else style="flex-basis: 95%; flex-grow: 1">
          <TicketChangeTicketUserPosition
            ref="ticketChangeTicketUserPosition"
            v-model:ticketUserList="ticket.ticketUserReceptionList!"
            :positionType="PositionType.TicketReception"
            :positionInteractId="0"
            @fix:ticketUserList="handleFixTicketUserList"
            title="Nhân viên tiếp đón"
          />
        </div>
      </div>

      <div
        class="px-4 mt-4"
        v-if="settingStore.TICKET_CLINIC_CREATE.requestProcedure && !ticket.id"
      >
        <div class="font-bold">
          <IconDoubleRight />
          Yêu cầu dịch vụ ban đầu
        </div>
        <div>
          <InputSearchProcedure
            v-model:procedureId="procedureId"
            @selectProcedure="selectProcedure"
            removeLabelWrapper
          />
        </div>
        <div class="mt-2">
          <TableTicketProcedureListRequest
            :ticketProcedureListDraft="ticketProcedureListDraft"
            :ticketRegimenListDraft="ticketRegimenListDraft"
            :priorityStart="0"
            :requiredPaymentItem="!!settingStore.TICKET_CLINIC_LIST.requiredPaymentItem"
            ref="tableTicketProcedureListRequest"
          />
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
            <span v-if="!ticket.id">ĐĂNG KÝ KHÁM</span>
            <span v-else>CẬP NHẬT THÔNG TIN</span>
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalTicketClinicCreateSetting
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalTicketClinicCreateSetting"
    @success="handleModalTicketClinicCreateSettingSuccess"
  />
</template>

<style lang="scss" scoped></style>
