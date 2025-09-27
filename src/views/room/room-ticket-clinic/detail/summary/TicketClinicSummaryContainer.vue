<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import VueTag from '@/common/VueTag.vue'
import {
  IconCalendar,
  IconClockCircle,
  IconContainer,
  IconDollar,
  IconPhone,
  IconSend,
  IconUser,
  IconWarning,
} from '@/common/icon-antd'
import { IconEditSquare } from '@/common/icon-google'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Appointment } from '@/modules/appointment'
import { PaymentViewType } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PrintHtmlAction } from '@/modules/print-html'
import { ticketRoomRef } from '@/modules/room/room.ref'
import { TicketStatus } from '@/modules/ticket'
import { ESString, ESTimer } from '@/utils'
import ModalTicketPayment from '@/views/room/room-ticket-base/ModalTicketPayment.vue'
import ModalTicketRegisterAppointment from '@/views/room/room-ticket-base/ModalTicketRegisterAppointment.vue'
import TicketDeliveryStatusTag from '@/views/room/room-ticket-base/TicketDeliveryStatusTag.vue'
import TicketStatusTag from '@/views/room/room-ticket-base/TicketStatusTag.vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalTicketChangeDiscount from './ModalTicketChangeDiscount.vue'
import TicketSummaryLaboratory from './TicketSummaryLaboratory.vue'
import TicketSummaryProcedure from './TicketSummaryProcedure.vue'
import TicketSummaryProduct from './TicketSummaryProduct.vue'
import TicketSummaryRadiology from './TicketSummaryRadiology.vue'

const modalTicketChangeDiscount = ref<InstanceType<typeof ModalTicketChangeDiscount>>()
const modalTicketRegisterAppointment = ref<InstanceType<typeof ModalTicketRegisterAppointment>>()
const modalTicketPayment = ref<InstanceType<typeof ModalTicketPayment>>()

const route = useRoute()
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, organizationPermission, organization } = MeService

const startPrintAllMoney = async () => {
  await PrintHtmlAction.startPrintAllMoney({
    ticket: ticketRoomRef.value,
    customer: ticketRoomRef.value.customer!,
  })
}

const handleClickModalRegisterAppointment = () => {
  let toAppointment
  if (ticketRoomRef.value.toAppointment) {
    toAppointment = Appointment.from(ticketRoomRef.value.toAppointment)
  } else {
    toAppointment = Appointment.blank()
    toAppointment.fromTicketId = ticketRoomRef.value.id
    toAppointment.customerId = ticketRoomRef.value.customerId

    const time = new Date()
    time.setMinutes(0, 0)
    time.setDate(time.getDate() + 7)
    toAppointment.registeredAt = time.getTime()
  }

  modalTicketRegisterAppointment.value?.openModal(toAppointment)
}
</script>
<template>
  <ModalTicketChangeDiscount ref="modalTicketChangeDiscount" />
  <ModalTicketPayment ref="modalTicketPayment" />
  <ModalTicketRegisterAppointment ref="modalTicketRegisterAppointment" />
  <div class="flex flex-wrap gap-4">
    <div style="flex-grow: 5; flex-basis: 400px">
      <div class="mt-4 table-wrapper">
        <table>
          <TicketSummaryProcedure />
          <TicketSummaryProduct />
          <TicketSummaryLaboratory />
          <TicketSummaryRadiology />
          <tbody>
            <tr>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td class="text-right" colspan="9">
                <div class="flex items-center justify-end gap-2">
                  <span>Tổng thành phần</span>
                  <span v-if="ticketRoomRef.itemsDiscount" class="italic" style="font-size: 13px">
                    (CK: {{ formatMoney(ticketRoomRef.itemsDiscount) }})
                  </span>
                </div>
              </td>
              <td v-if="CONFIG.MODE === 'development'" class="text-right" style="color: violet">
                {{ formatMoney(ticketRoomRef.itemsCostAmount) }}
              </td>
              <td v-if="CONFIG.MODE === 'development'" class="text-right" style="color: violet">
                {{ formatMoney(ticketRoomRef.commissionMoney) }}
              </td>
              <td class="font-bold text-right whitespace-nowrap">
                {{ formatMoney(ticketRoomRef.itemsActualMoney) }}
              </td>
              <td></td>
            </tr>
            <tr>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td class="text-right" colspan="8">Chiết khấu</td>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td class="text-center" style="width: 40px">
                <VueTag v-if="ticketRoomRef.discountType === 'VNĐ'" color="green">
                  {{ formatMoney(ticketRoomRef.discountMoney) }}
                </VueTag>
                <VueTag v-if="ticketRoomRef.discountType === '%'" color="green">
                  {{ ticketRoomRef.discountPercent || 0 }}%
                </VueTag>
              </td>
              <td class="text-center">
                <a
                  v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                    userPermission[PermissionId.TICKET_CHANGE_DISCOUNT]
                  "
                  class="text-orange-500"
                  @click="modalTicketChangeDiscount?.openModal()"
                >
                  <IconEditSquare width="20" height="20" />
                </a>
              </td>
              <td></td>
            </tr>
            <tr>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td class="uppercase text-right font-bold" colspan="9">Tổng tiền</td>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td class="font-bold text-right whitespace-nowrap">
                {{ formatMoney(ticketRoomRef.totalMoney) }}
              </td>
              <td></td>
            </tr>
            <tr>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td class="uppercase text-right font-bold" colspan="9">Đã thanh toán</td>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td class="font-bold text-right whitespace-nowrap">
                {{ formatMoney(ticketRoomRef.paid) }}
              </td>
              <td></td>
            </tr>
            <tr>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td class="uppercase text-right font-bold" colspan="9">Còn thiếu</td>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td class="font-bold text-right whitespace-nowrap">
                {{ formatMoney(ticketRoomRef.debt) }}
              </td>
              <td></td>
            </tr>
            <tr v-if="CONFIG.MODE === 'development'" style="color: violet">
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td class="text-right" colspan="9">profit</td>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td class="text-right whitespace-nowrap">
                {{ formatMoney(ticketRoomRef.profit) }}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-8 flex gap-4">
        <VueButton color="blue" icon="print" @click="startPrintAllMoney">
          In bảng kê chi phí
        </VueButton>
      </div>
    </div>

    <div class="pl-2" style="flex-grow: 1; flex-basis: 260px; border-left: 1px solid #ddd">
      <table class="mt-4 table-information">
        <tbody>
          <tr>
            <td><IconUser /></td>
            <td>Tên Khách Hàng</td>
            <td>:</td>
            <td style="font-weight: 500">{{ ticketRoomRef.customer?.fullName }}</td>
          </tr>
          <tr>
            <td><IconPhone /></td>
            <td>Số điện thoại:</td>
            <td>:</td>
            <td style="font-weight: 500">
              {{ ESString.formatPhone(ticketRoomRef.customer?.phone) }}
            </td>
          </tr>
          <tr>
            <td><IconContainer /></td>
            <td>Địa chỉ</td>
            <td>:</td>
            <td style="font-weight: 500">{{ ESString.formatAddress(ticketRoomRef.customer!) }}</td>
          </tr>
          <tr>
            <td><IconWarning /></td>
            <td>Chẩn đoán</td>
            <td>:</td>
            <td style="font-weight: 500">{{ ticketRoomRef.note }}</td>
          </tr>
          <tr>
            <td><IconClockCircle /></td>
            <td>Thời gian</td>
            <td>:</td>
            <td style="font-style: italic">
              {{ ESTimer.timeToText(ticketRoomRef.createdAt, 'hh:mm DD/MM/YYYY') }}
            </td>
          </tr>
          <tr>
            <td><IconClockCircle /></td>
            <td>Trạng thái phiếu</td>
            <td>:</td>
            <td><TicketStatusTag :ticket="ticketRoomRef" /></td>
          </tr>
          <tr>
            <td><IconClockCircle /></td>
            <td>Thanh toán</td>
            <td>:</td>
            <td>
              <div class="flex flex-wrap items-center gap-x-4">
                <div>
                  <VueButton
                    v-if="
                      [
                        TicketStatus.Schedule,
                        TicketStatus.Draft,
                        TicketStatus.Deposited,
                        TicketStatus.Executing,
                      ].includes(ticketRoomRef.status)
                    "
                    size="small"
                    color="green"
                    icon="dollar"
                    @click="
                      modalTicketPayment?.openModal({
                        ticket: ticketRoomRef,
                        paymentView: PaymentViewType.Prepayment,
                      })
                    "
                  >
                    <span class="font-bold">TẠM ỨNG</span>
                  </VueButton>
                  <VueButton
                    v-if="[TicketStatus.Debt].includes(ticketRoomRef.status)"
                    size="small"
                    color="green"
                    icon="dollar"
                    @click="
                      modalTicketPayment?.openModal({
                        ticket: ticketRoomRef,
                        paymentView: PaymentViewType.PayDebt,
                      })
                    "
                  >
                    <span class="font-bold">TRẢ NỢ</span>
                  </VueButton>
                  <VueButton
                    v-if="
                      [TicketStatus.Completed, TicketStatus.Cancelled].includes(
                        ticketRoomRef.status,
                      )
                    "
                    size="small"
                    color="green"
                    icon="dollar"
                    @click="
                      modalTicketPayment?.openModal({
                        ticket: ticketRoomRef,
                        paymentView: PaymentViewType.Success,
                      })
                    "
                  >
                    <span class="font-bold">THANH TOÁN</span>
                  </VueButton>
                </div>
                <span class="">
                  {{ formatMoney(ticketRoomRef.paid) }} /
                  {{ formatMoney(ticketRoomRef.totalMoney) }}
                </span>
              </div>
            </td>
          </tr>
          <tr v-if="ticketRoomRef.totalMoney < ticketRoomRef.paid">
            <td><IconDollar /></td>
            <td>Tiền thừa</td>
            <td>:</td>
            <td>
              <div class="text-lg text-green-500 font-bold">
                {{ formatMoney(Math.abs(ticketRoomRef.totalMoney - ticketRoomRef.paid)) }}
              </div>
            </td>
          </tr>
          <tr v-if="ticketRoomRef.totalMoney > ticketRoomRef.paid">
            <td><IconDollar /></td>
            <td>Còn thiếu</td>
            <td>:</td>
            <td>
              <div class="text-lg text-red-500 font-bold">
                {{ formatMoney(Math.abs(ticketRoomRef.totalMoney - ticketRoomRef.paid)) }}
              </div>
            </td>
          </tr>
          <tr>
            <td><IconSend /></td>
            <td>Sản phẩm</td>
            <td>:</td>
            <td><TicketDeliveryStatusTag :deliveryStatus="ticketRoomRef.deliveryStatus" /></td>
          </tr>
          <tr>
            <td><IconCalendar /></td>
            <td>Hẹn</td>
            <td>:</td>
            <td>
              <div v-if="!ticketRoomRef.toAppointment">
                <VueButton size="small" color="blue" @click="handleClickModalRegisterAppointment">
                  <IconCalendar />
                  Tạo lịch hẹn
                </VueButton>
              </div>
              <div v-else class="flex gap-2 items-center flex-wrap">
                <VueButton size="small" @click="handleClickModalRegisterAppointment">Sửa</VueButton>
                {{
                  ESTimer.timeToText(ticketRoomRef.toAppointment.registeredAt, 'hh:mm DD/MM/YYYY')
                }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  opacity: 1;
}

.table-information {
  td {
    padding: 8px 8px;
  }

  td:nth-child(2) {
    white-space: nowrap;
  }
}
</style>
