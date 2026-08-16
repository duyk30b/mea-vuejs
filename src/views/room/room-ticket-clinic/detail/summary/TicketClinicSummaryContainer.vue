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
import { TicketItemPaymentType } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { TemplateHtmlAction } from '@/modules/template-html'
import { TicketSurchargeService } from '@/modules/ticket-surcharge'
import { ticketRef } from '@/store/room.store'
import { ESString, ESTimer } from '@/utils'
import TicketItemPaymentTypeTooltip from '@/views/room/room-ticket-base/TicketItemPaymentTypeTooltip.vue'
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
import { TicketStatus } from '@/modules/ticket/ticket.type'

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
  await TicketSurchargeService.refreshRelation(ticketRef.value.ticketSurchargeList)
})

const startPrintAllMoney = async () => {
  await TemplateHtmlAction.startPrintTicketClinicAllMoney({
    ticket: ticketRef.value,
    customer: ticketRef.value.customer!,
  })
}

const handleClickModalRegisterAppointment = () => {
  let toAppointment
  if (ticketRef.value.toAppointment) {
    toAppointment = Appointment.from(ticketRef.value.toAppointment)
  } else {
    toAppointment = Appointment.blank()
    toAppointment.fromTicketId = ticketRef.value.id
    toAppointment.customerId = ticketRef.value.customerId

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
              <td v-if="ticketRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td class="text-right" colspan="8">
                <div class="flex items-center justify-end gap-2">
                  <span>Tổng thành phần</span>
                  <span v-if="ticketRef.itemsDiscount" class="italic" style="font-size: 13px">
                    (CK: {{ formatMoney(ticketRef.itemsDiscount) }})
                  </span>
                </div>
              </td>
              <td class="font-bold text-right whitespace-nowrap">
                {{ formatMoney(ticketRef.itemsActualMoney) }}
              </td>
              <td></td>
            </tr>
            <tr>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td colspan="8">
                <div class="flex gap-2 items-center justify-end">
                  <div v-if="ticketRef.discountMoney">
                    <div v-if="!ticketRef.isPaymentEachItem"></div>
                    <TicketItemPaymentTypeTooltip
                      v-else-if="
                        ticketRef.discountMoney === -ticketRef.ticketPaymentDetail.paidDiscount
                      "
                      :ticketItemPaymentType="TicketItemPaymentType.FullPaid"
                    />
                    <TicketItemPaymentTypeTooltip
                      v-else-if="
                        ticketRef.ticketPaymentDetail.paidDiscount === 0 &&
                        ticketRef.ticketPaymentDetail.debtDiscount === 0
                      "
                      :ticketItemPaymentType="TicketItemPaymentType.PendingPayment"
                    />
                    <TicketItemPaymentTypeTooltip
                      v-else-if="
                        ticketRef.ticketPaymentDetail.paidDiscount === 0 &&
                        ticketRef.ticketPaymentDetail.debtDiscount !== 0
                      "
                      :ticketItemPaymentType="TicketItemPaymentType.Debt"
                    />
                    <TicketItemPaymentTypeTooltip
                      v-else
                      :ticketItemPaymentType="TicketItemPaymentType.PartialPaid"
                    />
                  </div>
                  <div>Chiết khấu</div>
                </div>
              </td>
              <td class="text-center" style="width: 40px">
                <VueTag v-if="ticketRef.discountType === 'VNĐ'" color="green">
                  {{ formatMoney(ticketRef.discountMoney) }}
                </VueTag>
                <VueTag v-if="ticketRef.discountType === '%'" color="green">
                  {{ ticketRef.discountPercent || 0 }}%
                </VueTag>
              </td>
              <td class="text-center">
                <a
                  v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.status) &&
                    userPermission[PermissionId.TICKET_CHANGE_DISCOUNT]
                  "
                  class="text-orange-500"
                  @click="modalTicketChangeDiscount?.openModal()"
                >
                  <IconEditSquare width="20" height="20" />
                </a>
              </td>
            </tr>
            <tr v-if="!ticketRef.ticketSurchargeList?.length">
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td colspan="8">
                <div class="flex gap-2 items-center justify-end">
                  <div v-if="ticketRef.surcharge">
                    <div v-if="!ticketRef.isPaymentEachItem"></div>
                    <TicketItemPaymentTypeTooltip
                      v-else-if="
                        ticketRef.surcharge === ticketRef.ticketPaymentDetail.paidSurcharge
                      "
                      :ticketItemPaymentType="TicketItemPaymentType.FullPaid"
                    />
                    <TicketItemPaymentTypeTooltip
                      v-else-if="
                        ticketRef.ticketPaymentDetail.paidSurcharge === 0 &&
                        ticketRef.ticketPaymentDetail.debtSurcharge === 0
                      "
                      :ticketItemPaymentType="TicketItemPaymentType.PendingPayment"
                    />
                    <TicketItemPaymentTypeTooltip
                      v-else-if="
                        ticketRef.ticketPaymentDetail.paidSurcharge === 0 &&
                        ticketRef.ticketPaymentDetail.debtSurcharge !== 0
                      "
                      :ticketItemPaymentType="TicketItemPaymentType.Debt"
                    />
                    <TicketItemPaymentTypeTooltip
                      v-else
                      :ticketItemPaymentType="TicketItemPaymentType.PartialPaid"
                    />
                  </div>
                  <div>Phụ phí</div>
                </div>
              </td>
              <td class="text-right" style="width: 40px">
                {{ formatMoney(ticketRef.surcharge) }}
              </td>

              <td class="text-center">
                <a
                  v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.status) &&
                    userPermission[PermissionId.TICKET_CHANGE_DISCOUNT]
                  "
                  class="text-orange-500"
                  @click="modalTicketChangeSurcharge?.openModal()"
                >
                  <IconEditSquare width="20" height="20" />
                </a>
              </td>
            </tr>
            <tr v-for="(ts, tsIndex) in ticketRef.ticketSurchargeList" :key="ts.id">
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td colspan="8">
                <div class="flex gap-2 items-center justify-end">
                  <div v-if="ticketRef.surcharge">
                    <div v-if="!ticketRef.isPaymentEachItem"></div>
                    <TicketItemPaymentTypeTooltip
                      v-else-if="
                        ticketRef.surcharge === ticketRef.ticketPaymentDetail.paidSurcharge
                      "
                      :ticketItemPaymentType="TicketItemPaymentType.FullPaid"
                    />
                    <TicketItemPaymentTypeTooltip
                      v-else-if="
                        ticketRef.ticketPaymentDetail.paidSurcharge === 0 &&
                        ticketRef.ticketPaymentDetail.debtSurcharge === 0
                      "
                      :ticketItemPaymentType="TicketItemPaymentType.PendingPayment"
                    />
                    <TicketItemPaymentTypeTooltip
                      v-else-if="
                        ticketRef.ticketPaymentDetail.paidSurcharge === 0 &&
                        ticketRef.ticketPaymentDetail.debtSurcharge !== 0
                      "
                      :ticketItemPaymentType="TicketItemPaymentType.Debt"
                    />
                    <TicketItemPaymentTypeTooltip
                      v-else
                      :ticketItemPaymentType="TicketItemPaymentType.PartialPaid"
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
                :rowspan="ticketRef.ticketSurchargeList?.length"
                class="text-center"
              >
                <a
                  v-if="
                    ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.status) &&
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
              <td v-if="ticketRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td class="uppercase text-right font-bold" colspan="8">Tổng tiền</td>
              <td class="font-bold text-right whitespace-nowrap">
                {{ formatMoney(ticketRef.totalMoney) }}
              </td>
              <td></td>
            </tr>
            <tr>
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td class="uppercase text-right font-bold" colspan="8">
                <a
                  @click="
                    modalTicketPaymentHistory?.openModal({ ticket: ticketRef, refetch: true })
                  "
                >
                  <span class="mr-1">Đã thanh toán</span>
                  <IconExclamationCircle />
                </a>
              </td>
              <td class="font-bold text-right whitespace-nowrap">
                {{ formatMoney(ticketRef.paidTotal) }}
              </td>
              <td></td>
            </tr>
            <tr v-if="ticketRef.isPaymentEachItem && ticketRef.ticketPaymentDetail.paidWait">
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td class="text-right font-bold uppercase" style="color: violet" colspan="8">
                Ví (tiền chờ)
              </td>
              <td class="font-bold text-right whitespace-nowrap" style="color: violet">
                {{ formatMoney(ticketRef.ticketPaymentDetail.paidWait) }}
              </td>
              <td></td>
            </tr>
            <tr v-if="ticketRef.debtTotal">
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td class="uppercase text-right font-bold" colspan="8">Đang nợ</td>
              <td class="font-bold text-right whitespace-nowrap" style="color: var(--text-red)">
                {{ formatMoney(ticketRef.debtTotal) }}
              </td>
              <td></td>
            </tr>
            <tr v-if="ticketRef.debtTotal + ticketRef.paidTotal < ticketRef.totalMoney">
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td class="uppercase text-right font-bold" colspan="8">Đang thiếu</td>
              <td class="font-bold text-right whitespace-nowrap" style="color: var(--text-red)">
                {{ formatMoney(ticketRef.totalMoney - ticketRef.paidTotal - ticketRef.debtTotal) }}
              </td>
              <td></td>
            </tr>
            <tr v-if="ticketRef.debtTotal + ticketRef.paidTotal > ticketRef.totalMoney">
              <td v-if="CONFIG.MODE === 'development'"></td>
              <td v-if="ticketRef.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
              <td class="uppercase text-right font-bold" colspan="8">Đang thừa</td>
              <td class="font-bold text-right whitespace-nowrap" style="color: var(--text-green)">
                {{ formatMoney(ticketRef.paidTotal + ticketRef.debtTotal - ticketRef.totalMoney) }}
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
            <td style="font-weight: 500">{{ ticketRef.customer?.fullName }}</td>
          </tr>
          <tr>
            <td><IconPhone /></td>
            <td>Số điện thoại:</td>
            <td>:</td>
            <td style="font-weight: 500">
              {{ ESString.formatPhone(ticketRef.customer?.phone) }}
            </td>
          </tr>
          <tr>
            <td><IconContainer /></td>
            <td>Địa chỉ</td>
            <td>:</td>
            <td style="font-weight: 500">{{ ESString.formatAddress(ticketRef.customer!) }}</td>
          </tr>
          <tr>
            <td><IconWarning /></td>
            <td>Chẩn đoán</td>
            <td>:</td>
            <td style="font-weight: 500">{{ ticketRef.note }}</td>
          </tr>
          <tr>
            <td><IconClockCircle /></td>
            <td>TG tạo phiếu</td>
            <td>:</td>
            <td style="font-style: italic">
              {{ ESTimer.timeToText(ticketRef.createdAt, 'hh:mm DD/MM/YYYY') }}
            </td>
          </tr>
          <tr>
            <td><IconClockCircle /></td>
            <td>TG tiếp đón</td>
            <td>:</td>
            <td style="font-style: italic">
              {{ ESTimer.timeToText(ticketRef.receptionAt, 'hh:mm DD/MM/YYYY') }}
            </td>
          </tr>
          <tr>
            <td><IconClockCircle /></td>
            <td>Trạng thái phiếu</td>
            <td>:</td>
            <td><TicketStatusTag :ticket="ticketRef" /></td>
          </tr>
          <tr>
            <td><IconDollar /></td>
            <td class="cursor-pointer">
              <a
                @click="modalTicketPaymentHistory?.openModal({ ticket: ticketRef, refetch: true })"
                style="display: flex; gap: 4px; align-items: center"
              >
                <span>Đã thanh toán</span>
                <IconExclamationCircle width="14" height="14" />
              </a>
            </td>
            <td>:</td>
            <td>
              <div class="text-lg font-bold" style="color: var(--text-green)">
                {{ formatMoney(ticketRef.paidTotal) }} /
                {{ formatMoney(ticketRef.totalMoney) }}
              </div>
            </td>
          </tr>
          <tr v-if="ticketRef.debtTotal">
            <td><IconDollar /></td>
            <td>Đang nợ</td>
            <td>:</td>
            <td>
              <div class="text-lg font-bold" style="color: var(--text-red)">
                {{ formatMoney(ticketRef.debtTotal) }}
              </div>
            </td>
          </tr>
          <tr v-if="ticketRef.paidTotal > ticketRef.totalMoney">
            <td><IconDollar /></td>
            <td>Tiền thừa</td>
            <td>:</td>
            <td>
              <div class="text-lg font-bold" style="color: var(--text-green)">
                {{ formatMoney(ticketRef.paidTotal - ticketRef.totalMoney) }}
              </div>
            </td>
          </tr>
          <tr v-else-if="ticketRef.debtTotal !== ticketRef.totalMoney - ticketRef.paidTotal">
            <td><IconDollar /></td>
            <td>Còn thiếu</td>
            <td>:</td>
            <td>
              <div class="text-lg font-bold" style="color: var(--text-red)">
                {{ formatMoney(ticketRef.totalMoney - ticketRef.paidTotal - ticketRef.debtTotal) }}
              </div>
            </td>
          </tr>
          <tr>
            <td><IconSend /></td>
            <td>Sản phẩm</td>
            <td>:</td>
            <td><TicketDeliveryStatusTag :deliveryStatus="ticketRef.deliveryStatus" /></td>
          </tr>
          <tr>
            <td><IconCalendar /></td>
            <td>Hẹn</td>
            <td>:</td>
            <td>
              <div v-if="!ticketRef.toAppointment">
                <VueButton size="small" color="blue" @click="handleClickModalRegisterAppointment">
                  <IconCalendar />
                  Tạo lịch hẹn
                </VueButton>
              </div>
              <div v-else class="flex gap-2 items-center flex-wrap">
                <VueButton size="small" @click="handleClickModalRegisterAppointment">Sửa</VueButton>
                {{ ESTimer.timeToText(ticketRef.toAppointment.registeredAt, 'hh:mm DD/MM/YYYY') }}
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
