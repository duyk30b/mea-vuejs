<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import VueTag from '@/common/VueTag.vue'
import {
  IconCalendar,
  IconClockCircle,
  IconContainer,
  IconDollar,
  IconExclamationCircle,
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
import { PermissionId } from '@/modules/permission/permission.enum'
import { PrintHtmlAction } from '@/modules/print-html'
import { ticketRoomRef } from '@/modules/room/room.ref'
import { TicketStatus } from '@/modules/ticket'
import { TicketSurchargeService } from '@/modules/ticket-surcharge'
import { ESString, ESTimer } from '@/utils'
import ModalTicketPaymentHistory from '@/views/room/room-ticket-base/ModalTicketPaymentHistory.vue'
import ModalTicketRegisterAppointment from '@/views/room/room-ticket-base/ModalTicketRegisterAppointment.vue'
import TicketDeliveryStatusTag from '@/views/room/room-ticket-base/TicketDeliveryStatusTag.vue'
import TicketStatusTag from '@/views/room/room-ticket-base/TicketStatusTag.vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModalTicketChangeDiscount from './ModalTicketChangeDiscount.vue'
import ModalTicketChangeSurcharge from './ModalTicketChangeSurcharge.vue'
import TicketSummaryLaboratory from './TicketSummaryLaboratory.vue'
import TicketSummaryProcedure from './TicketSummaryProcedure.vue'
import TicketSummaryProduct from './TicketSummaryProduct.vue'
import TicketSummaryRadiology from './TicketSummaryRadiology.vue'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import { PaymentMoneyStatus } from '@/modules/enum'

const modalTicketChangeDiscount = ref<InstanceType<typeof ModalTicketChangeDiscount>>()
const modalTicketChangeSurcharge = ref<InstanceType<typeof ModalTicketChangeSurcharge>>()
const modalTicketRegisterAppointment = ref<InstanceType<typeof ModalTicketRegisterAppointment>>()
const modalTicketPaymentHistory = ref<InstanceType<typeof ModalTicketPaymentHistory>>()

const route = useRoute()
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, organizationPermission, organization } = MeService

onMounted(async () => {
  await TicketSurchargeService.refreshRelation(ticketRoomRef.value.ticketSurchargeList)
})

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
  <ModalTicketChangeSurcharge ref="modalTicketChangeSurcharge" />
  <ModalTicketRegisterAppointment ref="modalTicketRegisterAppointment" />
  <ModalTicketPaymentHistory ref="modalTicketPaymentHistory" />

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
              <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td class="text-right" colspan="8">
                <div class="flex items-center justify-end gap-2">
                  <span>Tổng thành phần</span>
                  <span v-if="ticketRoomRef.itemsDiscount" class="italic" style="font-size: 13px">
                    (CK: {{ formatMoney(ticketRoomRef.itemsDiscount) }})
                  </span>
                </div>
              </td>
              <td class="font-bold text-right whitespace-nowrap">
                {{ formatMoney(ticketRoomRef.itemsActualMoney) }}
              </td>
              <td></td>
            </tr>
            <tr>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td colspan="8">
                <div class="flex gap-2 items-center justify-end">
                  <div v-if="ticketRoomRef.discountMoney">
                    <div v-if="!ticketRoomRef.isPaymentEachItem"></div>
                    <PaymentMoneyStatusTooltip
                      v-else-if="
                        ticketRoomRef.discountMoney ===
                        -ticketRoomRef.ticketPaymentDetail.paidDiscount
                      "
                      :paymentMoneyStatus="PaymentMoneyStatus.FullPaid"
                    />
                    <PaymentMoneyStatusTooltip
                      v-else-if="
                        ticketRoomRef.ticketPaymentDetail.paidDiscount === 0 &&
                        ticketRoomRef.ticketPaymentDetail.debtDiscount === 0
                      "
                      :paymentMoneyStatus="PaymentMoneyStatus.PendingPayment"
                    />
                    <PaymentMoneyStatusTooltip
                      v-else-if="
                        ticketRoomRef.ticketPaymentDetail.paidDiscount === 0 &&
                        ticketRoomRef.ticketPaymentDetail.debtDiscount !== 0
                      "
                      :paymentMoneyStatus="PaymentMoneyStatus.Debt"
                    />
                    <PaymentMoneyStatusTooltip
                      v-else
                      :paymentMoneyStatus="PaymentMoneyStatus.PartialPaid"
                    />
                  </div>
                  <div>Chiết khấu</div>
                </div>
              </td>
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
            </tr>
            <tr v-if="!ticketRoomRef.ticketSurchargeList?.length">
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td colspan="8">
                <div class="flex gap-2 items-center justify-end">
                  <div v-if="ticketRoomRef.surcharge">
                    <div v-if="!ticketRoomRef.isPaymentEachItem"></div>
                    <PaymentMoneyStatusTooltip
                      v-else-if="
                        ticketRoomRef.surcharge === ticketRoomRef.ticketPaymentDetail.paidSurcharge
                      "
                      :paymentMoneyStatus="PaymentMoneyStatus.FullPaid"
                    />
                    <PaymentMoneyStatusTooltip
                      v-else-if="
                        ticketRoomRef.ticketPaymentDetail.paidSurcharge === 0 &&
                        ticketRoomRef.ticketPaymentDetail.debtSurcharge === 0
                      "
                      :paymentMoneyStatus="PaymentMoneyStatus.PendingPayment"
                    />
                    <PaymentMoneyStatusTooltip
                      v-else-if="
                        ticketRoomRef.ticketPaymentDetail.paidSurcharge === 0 &&
                        ticketRoomRef.ticketPaymentDetail.debtSurcharge !== 0
                      "
                      :paymentMoneyStatus="PaymentMoneyStatus.Debt"
                    />
                    <PaymentMoneyStatusTooltip
                      v-else
                      :paymentMoneyStatus="PaymentMoneyStatus.PartialPaid"
                    />
                  </div>
                  <div>Phụ phí</div>
                </div>
              </td>
              <td class="text-right" style="width: 40px">
                {{ formatMoney(ticketRoomRef.surcharge) }}
              </td>

              <td class="text-center">
                <a
                  v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                    userPermission[PermissionId.TICKET_CHANGE_DISCOUNT]
                  "
                  class="text-orange-500"
                  @click="modalTicketChangeSurcharge?.openModal()"
                >
                  <IconEditSquare width="20" height="20" />
                </a>
              </td>
            </tr>
            <tr v-for="(ts, tsIndex) in ticketRoomRef.ticketSurchargeList" :key="ts.id">
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td colspan="8">
                <div class="flex gap-2 items-center justify-end">
                  <div v-if="ticketRoomRef.surcharge">
                    <div v-if="!ticketRoomRef.isPaymentEachItem"></div>
                    <PaymentMoneyStatusTooltip
                      v-else-if="
                        ticketRoomRef.surcharge === ticketRoomRef.ticketPaymentDetail.paidSurcharge
                      "
                      :paymentMoneyStatus="PaymentMoneyStatus.FullPaid"
                    />
                    <PaymentMoneyStatusTooltip
                      v-else-if="
                        ticketRoomRef.ticketPaymentDetail.paidSurcharge === 0 &&
                        ticketRoomRef.ticketPaymentDetail.debtSurcharge === 0
                      "
                      :paymentMoneyStatus="PaymentMoneyStatus.PendingPayment"
                    />
                    <PaymentMoneyStatusTooltip
                      v-else-if="
                        ticketRoomRef.ticketPaymentDetail.paidSurcharge === 0 &&
                        ticketRoomRef.ticketPaymentDetail.debtSurcharge !== 0
                      "
                      :paymentMoneyStatus="PaymentMoneyStatus.Debt"
                    />
                    <PaymentMoneyStatusTooltip
                      v-else
                      :paymentMoneyStatus="PaymentMoneyStatus.PartialPaid"
                    />
                  </div>
                  <div>{{ ts.surcharge?.name }}</div>
                </div>
              </td>
              <td class="text-right" style="width: 40px">
                {{ formatMoney(ts.money) }}
              </td>
              <td
                v-if="tsIndex === 0"
                :rowspan="ticketRoomRef.ticketSurchargeList?.length"
                class="text-center"
              >
                <a
                  v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status) &&
                    userPermission[PermissionId.TICKET_CHANGE_DISCOUNT]
                  "
                  class="text-orange-500"
                  @click="modalTicketChangeSurcharge?.openModal()"
                >
                  <IconEditSquare width="20" height="20" />
                </a>
              </td>
            </tr>
            <tr>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td class="uppercase text-right font-bold" colspan="8">Tổng tiền</td>
              <td class="font-bold text-right whitespace-nowrap">
                {{ formatMoney(ticketRoomRef.totalMoney) }}
              </td>
              <td></td>
            </tr>
            <tr>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td class="uppercase text-right font-bold" colspan="8">
                <a
                  @click="
                    modalTicketPaymentHistory?.openModal({ ticket: ticketRoomRef, refetch: true })
                  "
                >
                  <span class="mr-1">Đã thanh toán</span>
                  <IconExclamationCircle />
                </a>
              </td>
              <td class="font-bold text-right whitespace-nowrap">
                {{ formatMoney(ticketRoomRef.paidTotal) }}
              </td>
              <td></td>
            </tr>
            <tr
              v-if="ticketRoomRef.isPaymentEachItem && ticketRoomRef.ticketPaymentDetail.paidWait"
            >
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td class="text-right font-bold uppercase" style="color: violet" colspan="8">
                Ví (tiền chờ)
              </td>
              <td class="font-bold text-right whitespace-nowrap" style="color: violet">
                {{ formatMoney(ticketRoomRef.ticketPaymentDetail.paidWait) }}
              </td>
              <td></td>
            </tr>
            <tr v-if="ticketRoomRef.debtTotal">
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td class="uppercase text-right font-bold" colspan="8">Đang nợ</td>
              <td class="font-bold text-right whitespace-nowrap" style="color: var(--text-red)">
                {{ formatMoney(ticketRoomRef.debtTotal) }}
              </td>
              <td></td>
            </tr>
            <tr v-if="ticketRoomRef.paidTotal > ticketRoomRef.totalMoney">
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td class="uppercase text-right font-bold" colspan="8">Đang thừa</td>
              <td class="font-bold text-right whitespace-nowrap" style="color: var(--text-green)">
                {{ formatMoney(ticketRoomRef.paidTotal - ticketRoomRef.totalMoney) }}
              </td>
              <td></td>
            </tr>
            <tr
              v-else-if="
                ticketRoomRef.debtTotal !== ticketRoomRef.totalMoney - ticketRoomRef.paidTotal
              "
            >
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRoomRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td class="uppercase text-right font-bold" colspan="8">Đang thiếu</td>
              <td class="font-bold text-right whitespace-nowrap" style="color: var(--text-red)">
                {{ formatMoney(ticketRoomRef.totalMoney - ticketRoomRef.paidTotal) }}
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
            <td>TG tạo phiếu</td>
            <td>:</td>
            <td style="font-style: italic">
              {{ ESTimer.timeToText(ticketRoomRef.createdAt, 'hh:mm DD/MM/YYYY') }}
            </td>
          </tr>
          <tr>
            <td><IconClockCircle /></td>
            <td>TG tiếp đón</td>
            <td>:</td>
            <td style="font-style: italic">
              {{ ESTimer.timeToText(ticketRoomRef.receptionAt, 'hh:mm DD/MM/YYYY') }}
            </td>
          </tr>
          <tr>
            <td><IconClockCircle /></td>
            <td>Trạng thái phiếu</td>
            <td>:</td>
            <td><TicketStatusTag :ticket="ticketRoomRef" /></td>
          </tr>
          <tr>
            <td><IconDollar /></td>
            <td class="cursor-pointer">
              <a
                @click="
                  modalTicketPaymentHistory?.openModal({ ticket: ticketRoomRef, refetch: true })
                "
              >
                Đã thanh toán
              </a>
            </td>
            <td>:</td>
            <td>
              <div class="text-lg font-bold" style="color: var(--text-green)">
                {{ formatMoney(ticketRoomRef.paidTotal) }} /
                {{ formatMoney(ticketRoomRef.totalMoney) }}
              </div>
            </td>
          </tr>
          <tr v-if="ticketRoomRef.debtTotal">
            <td><IconDollar /></td>
            <td>Đang nợ</td>
            <td>:</td>
            <td>
              <div class="text-lg font-bold" style="color: var(--text-red)">
                {{ formatMoney(ticketRoomRef.debtTotal) }}
              </div>
            </td>
          </tr>
          <tr v-if="ticketRoomRef.paidTotal > ticketRoomRef.totalMoney">
            <td><IconDollar /></td>
            <td>Tiền thừa</td>
            <td>:</td>
            <td>
              <div class="text-lg font-bold" style="color: var(--text-green)">
                {{ formatMoney(ticketRoomRef.paidTotal - ticketRoomRef.totalMoney) }}
              </div>
            </td>
          </tr>
          <tr
            v-else-if="
              ticketRoomRef.debtTotal !== ticketRoomRef.totalMoney - ticketRoomRef.paidTotal
            "
          >
            <td><IconDollar /></td>
            <td>Còn thiếu</td>
            <td>:</td>
            <td>
              <div class="text-lg font-bold" style="color: var(--text-red)">
                {{ formatMoney(ticketRoomRef.totalMoney - ticketRoomRef.paidTotal) }}
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
