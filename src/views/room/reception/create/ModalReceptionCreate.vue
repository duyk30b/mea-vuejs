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
import { Ticket, TicketChangeReceptionApi, TicketQueryApi, TicketStatus } from '@/modules/ticket'
import type { TicketAttributeKeyGeneralType, TicketAttributeMap } from '@/modules/ticket-attribute'
import { TicketProcedure } from '@/modules/ticket-procedure'
import { TicketReception } from '@/modules/ticket-reception'
import type { TicketRegimen } from '@/modules/ticket-regimen'
import { TicketUser } from '@/modules/ticket-user'
import { ESTimer } from '@/utils'
import InputAddress from '@/views/component/InputAddress.vue'
import InputSearchCustomer from '@/views/component/InputSearchCustomer.vue'
import InputSearchProcedure from '@/views/component/InputSearchProcedure.vue'
import InputSelectCustomerSource from '@/views/component/InputSelectCustomerSource.vue'
import InputSelectRoom from '@/views/component/InputSelectRoom.vue'
import DiagnosisObstetric from '@/views/room/room-ticket-clinic/detail/diagnosis/DiagnosisObstetric.vue'
import DiagnosisVitalSigns from '@/views/room/room-ticket-clinic/detail/diagnosis/DiagnosisVitalSigns.vue'
import TableTicketProcedureListRequest from '@/views/room/room-ticket-clinic/detail/procedure/TableTicketProcedureListDraft.vue'
import TicketChangeTicketUserPosition from '@/views/room/room-user/TicketChangeTicketUserPosition.vue'
import { nextTick, ref } from 'vue'
import TicketLink from '../../room-ticket-base/TicketLink.vue'
import ModalReceptionCreateSetting from './ModalReceptionCreateSetting.vue'

const modalReceptionCreateSetting = ref<InstanceType<typeof ModalReceptionCreateSetting>>()
const tableTicketProcedureListRequest = ref<InstanceType<typeof TableTicketProcedureListRequest>>()

const ticketClinicCreateForm = ref<InstanceType<typeof HTMLFormElement>>()

const emit = defineEmits<{
  (e: 'success', type: 'CREATE' | 'UPDATE' | 'DESTROY', data: { ticketId: string }): void
}>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore
const { userPermission } = MeService

const appointmentOptions = ref<Appointment[]>([])
const ticketPendingOptions = ref<Ticket[]>([])

const currentRoom = ref(Room.blank())

const currentCustomer = ref<Customer>(Customer.blank())

const ticketReception = ref<TicketReception>(TicketReception.blank())

const ticketAttributeMap = ref<TicketAttributeMap>({})

const procedureId = ref(0)
const ticketProcedureListDraft = ref<TicketProcedure[]>([])
const ticketRegimenListDraft = ref<TicketRegimen[]>([])
const ticketUserReceptionList = ref<TicketUser[]>([])

const fromAppointmentId = ref('')
const ticketPendingId = ref('')

const ticketStatusRegister = ref<TicketStatus>(TicketStatus.Draft)
const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (object: {
  roomId?: number
  ticketReception?: TicketReception
  customer?: Customer
  ticketStatusRegister?: TicketStatus
}) => {
  showModal.value = true

  if (object.roomId) {
    currentRoom.value = await RoomService.detail(object.roomId)
  }
  ticketStatusRegister.value = object.ticketStatusRegister || TicketStatus.Draft

  try {
    if (!object.ticketReception) {
      ticketReception.value = TicketReception.blank()
      ticketReception.value.receptionAt = Date.now()
      ticketReception.value.roomId = object.roomId || 0
      currentCustomer.value = Customer.blank()
    } else {
      ticketReception.value = TicketReception.from(object.ticketReception)
      currentCustomer.value = Customer.from(object.customer || Customer.blank())
    }
  } catch (error) {
    console.log('🚀 ~ ModalTicketClinicCreate.vue:109 ~ openModal ~ error:', error)
  }
}

const closeModal = () => {
  ticketReception.value = TicketReception.blank()

  appointmentOptions.value = []
  ticketPendingOptions.value = []

  currentRoom.value = Room.blank()
  currentCustomer.value = Customer.blank()

  fromAppointmentId.value = ''
  ticketPendingId.value = ''

  ticketAttributeMap.value = {}

  procedureId.value = 0
  ticketProcedureListDraft.value = []
  ticketRegimenListDraft.value = []
  ticketUserReceptionList.value = []

  showModal.value = false
}

const selectCustomer = async (customerSelect?: Customer) => {
  if (!customerSelect) {
    const fullName = currentCustomer.value.fullName
    currentCustomer.value = Customer.blank()
    currentCustomer.value.fullName = fullName // để fix lỗi mất tên khách hàng đã chọn

    appointmentOptions.value = []
    ticketPendingOptions.value = []
    ticketPendingId.value = ''
    fromAppointmentId.value = ''
    return
  }
  currentCustomer.value = Customer.from(customerSelect)

  try {
    ticketReception.value.customerSourceId = customerSelect.customerSourceId

    const [appointmentList, ticketResponseList] = await Promise.all([
      AppointmentApi.list({
        filter: {
          status: { IN: [AppointmentStatus.Waiting, AppointmentStatus.Confirm] },
          customerId: customerSelect.id,
        },
      }),
      TicketQueryApi.list({
        filter: {
          status: {
            IN: [
              TicketStatus.Draft,
              TicketStatus.Schedule,
              TicketStatus.Deposited,
              TicketStatus.Executing,
            ],
          },
          customerId: customerSelect.id,
        },
      }),
    ])

    ticketPendingOptions.value = ticketResponseList.ticketList.sort((a, b) => {
      return a.createdAt > b.createdAt ? 1 : -1
    })
    if (ticketPendingOptions.value.length) {
      ticketPendingId.value = ticketPendingOptions.value[0].id
      ticketReception.value.isFirstReception = 0
    }

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
    ticketReception.value.customerSourceId = appointment.customerSourceId
  } else {
    fromAppointmentId.value = ''
    ticketReception.value.customerSourceId = 0
  }
}

const handleChangeCheckboxTicketPending = (e: Event, ticket: Ticket) => {
  if ((e.target as HTMLInputElement).checked) {
    ticketPendingId.value = ticket.id
    ticketAttributeMap.value.reason = ticket.note || ''
    ticketReception.value.customerSourceId = ticket.customerSourceId
    ticketReception.value.isFirstReception = 0
  } else {
    ticketPendingId.value = ''
    ticketReception.value.customerSourceId = 0
    ticketReception.value.isFirstReception = 1
  }
}

const handleModalReceptionCreateSettingSuccess = () => {}

const handleSubmitFormTicketClinic = async () => {
  saveLoading.value = true
  try {
    const ticketAttributeList = Object.entries(ticketAttributeMap.value).map(([key, value]) => ({
      key,
      value: value != null ? value : '',
    }))

    if (!ticketReception.value.id) {
      if (currentCustomer.value.healthHistory) {
        const key: TicketAttributeKeyGeneralType = 'healthHistory'
        ticketAttributeList.push({
          value: currentCustomer.value.healthHistory,
          key,
        })
      }
      const ticketResponse = await TicketChangeReceptionApi.create({
        ticketId: ticketPendingId.value,
        customerId: currentCustomer.value.id,
        isPaymentEachItem: settingStore.TICKET_CLINIC_LIST.isPaymentEachItem,
        customer: currentCustomer.value,
        ticketReception: ticketReception.value,
        ticketAttributeList,
        ticketUserReceptionList: ticketUserReceptionList.value || [],
        ticketRegimenWrapList: ticketRegimenListDraft.value.map((i) => {
          return {
            ticketRegimenAdd: i,
            ticketRegimenItemAddList: i.ticketRegimenItemList || [],
            ticketUserRequestAddList: i.ticketUserRequestList || [],
          }
        }),
        ticketProcedureWrapList: ticketProcedureListDraft.value.map((i) => {
          return {
            ticketProcedureAdd: i,
            ticketUserRequestAddList: i.ticketUserRequestList || [],
          }
        }),
        fromAppointmentId: fromAppointmentId.value,
        status: ticketStatusRegister.value,
      })
      emit('success', 'CREATE', { ticketId: ticketResponse.id })
    }
    if (ticketReception.value.id) {
      const ticketResponse = await TicketChangeReceptionApi.update({
        ticketId: ticketReception.value.ticketId,
        ticketReceptionId: ticketReception.value.id,
        ticketReception: ticketReception.value,
        ticketAttributeList,
        ticketUserReceptionList: ticketUserReceptionList.value || [],
      })
      emit('success', 'UPDATE', { ticketId: ticketResponse.id })
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
  ticketUserReceptionList.value = TicketUser.fromList(tuListData)
}

const handleClickDestroy = async () => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa phiếu tiếp đón này ?',
    content: 'Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    onOk: async () => {
      try {
        await TicketChangeReceptionApi.destroyTicketReception({
          ticketId: ticketReception.value.ticketId,
          ticketReceptionId: ticketReception.value.id,
        })
        AlertStore.addSuccess('Xóa phiếu tiếp đón thành công')
        emit('success', 'DESTROY', { ticketId: ticketReception.value.ticketId })
        closeModal()
      } catch (error) {
        console.log('🚀 ~ TicketReceptionList.vue:181 ~ handleClickDestroy ~ error:', error)
      }
    },
  })
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
          <span v-if="!ticketReception.customerId">Tiếp đón khách hàng mới</span>
          <span v-if="!!ticketReception.customerId">Sửa thông tin tiếp đón</span>
        </div>
        <div
          v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalReceptionCreateSetting?.openModal()"
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
            :customer="ticketReception.customer"
            :disabled="!!ticketReception.id"
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

        <template v-if="!ticketReception.id">
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
        </template>

        <div
          v-if="appointmentOptions.length"
          style="flex-grow: 1; flex-basis: 40%; min-width: 400px"
        >
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
          v-if="ticketPendingOptions.length"
          style="flex-grow: 1; flex-basis: 90%; min-width: 400px"
        >
          <div>Khách hàng đến tiếp tục điều trị ?</div>
          <div class="ml-4">
            <div v-for="(ticketPending, index) in ticketPendingOptions" :key="index">
              <InputCheckbox
                :checked="ticketPendingId === ticketPending.id"
                @change="(e: Event) => handleChangeCheckboxTicketPending(e, ticketPending)"
              >
                <span>
                  {{ ESTimer.timeToText(ticketPending.receptionAt, 'DD/MM/YYYY hh:mm ') }}
                </span>
                <span>
                  -
                  <TicketLink
                    :ticketId="ticketPending.id"
                    :ticket="ticketPending"
                    :target="'_blank'"
                  />
                </span>
                <span>- CĐ: {{ ticketPending.note }}</span>
              </InputCheckbox>
            </div>
          </div>
        </div>

        <div
          v-if="settingStore.TICKET_CLINIC_CREATE.customerSource"
          :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle"
        >
          <InputSelectCustomerSource
            :disabled="!!ticketPendingId || !ticketReception.isFirstReception"
            v-model:customerSourceId="ticketReception.customerSourceId"
          />
        </div>

        <div
          v-if="
            !ticketReception.id && currentRoom.roomStyle === RoomTicketStyle.TicketClinicObstetric
          "
          style="flex-basis: 90%; flex-grow: 1"
          class="flex gap-4"
        >
          <DiagnosisObstetric :ticketAttributeMap="ticketAttributeMap" />
          <DiagnosisVitalSigns :ticketAttributeMap="ticketAttributeMap" />
        </div>

        <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Thời gian tiếp đón</div>
          <div>
            <InputDate
              v-model:value="ticketReception.receptionAt"
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
              v-model:roomId="ticketReception.roomId"
              :roomType="RoomType.Ticket"
              :disabled="!!ticketPendingId || !ticketReception.isFirstReception"
              :roomTicketStyle="[
                RoomTicketStyle.TicketClinicGeneral,
                RoomTicketStyle.TicketClinicObstetric,
                RoomTicketStyle.TicketClinicEye,
              ]"
              removeLabelWrapper
              autoSelectFirstValue
            />
          </div>
        </div>

        <div :style="settingStore.TICKET_CLINIC_CREATE.SCREEN.itemStyle">
          <div>Lý do</div>
          <div>
            <InputText v-model:value="ticketReception.reason" />
          </div>
        </div>
        <div style="flex-basis: 95%; flex-grow: 1">
          <TicketChangeTicketUserPosition
            ref="ticketChangeTicketUserPosition"
            v-model:ticketUserList="ticketUserReceptionList"
            :positionType="PositionType.Reception"
            :positionInteractId="0"
            @fix:ticketUserList="handleFixTicketUserList"
            title="Nhân viên tiếp đón"
          />
        </div>
      </div>

      <div
        class="px-4 mt-4"
        v-if="
          !ticketReception.id &&
          !ticketPendingId &&
          settingStore.TICKET_CLINIC_CREATE.requestProcedure
        "
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
            ref="tableTicketProcedureListRequest"
          />
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex flex-wrap gap-4">
          <VueButton v-if="ticketReception.id" color="red" icon="trash" @click="handleClickDestroy">
            Xóa
          </VueButton>
          <div style="margin-left: auto">
            <VueButton icon="close" type="reset" @click="closeModal">Hủy bỏ</VueButton>
          </div>
          <VueButton class="btn btn-blue" icon="save" type="submit" :loading="saveLoading">
            <span v-if="!ticketReception.id">TIẾP ĐÓN</span>
            <span v-else>CẬP NHẬT THÔNG TIN</span>
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalReceptionCreateSetting
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalReceptionCreateSetting"
    @success="handleModalReceptionCreateSettingSuccess"
  />
</template>

<style lang="scss" scoped></style>
