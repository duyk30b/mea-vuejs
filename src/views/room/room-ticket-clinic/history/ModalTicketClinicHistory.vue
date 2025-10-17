<script setup lang="ts">
import {
  IconCaretLeft,
  IconCaretRight,
  IconCheckSquare,
  IconClockCircle,
  IconClose,
} from '@/common/icon-antd'
import { IconVisibility } from '@/common/icon-google'
import ImageUploadMultiple from '@/common/image-upload/ImageUploadMultiple.vue'
import VueTooltip from '@/common/popover/VueTooltip.vue'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Customer } from '@/modules/customer'
import { LaboratoryValueType } from '@/modules/laboratory'
import { Ticket, TicketQueryApi, TicketService } from '@/modules/ticket'
import { TicketLaboratoryStatus } from '@/modules/ticket-laboratory'
import { ESImage, ESTimer } from '@/utils'
import ModalTicketRadiologyResult from '@/views/room/room-radiology/ModalTicketRadiologyResult.vue'
import { ref } from 'vue'
import TicketLink from '../../room-ticket-base/TicketLink.vue'
import TicketRegimenStatusTooltip from '../detail/procedure/TicketRegimenStatusTooltip.vue'
import { DiscountType } from '@/modules/enum'
import { CONFIG } from '@/config'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import TicketProcedureStatusTooltip from '../detail/procedure/TicketProcedureStatusTooltip.vue'
import TicketLaboratoryStatusTooltip from '../../room-laboratory/TicketLaboratoryStatusTooltip.vue'
import TicketRadiologyStatusTooltip from '../../room-radiology/TicketRadiologyStatusTooltip.vue'
import TicketDeliveryStatusTooltip from '../../room-ticket-base/TicketDeliveryStatusTooltip.vue'
import { VueTag } from '@/common'

const modalTicketRadiologyResult = ref<InstanceType<typeof ModalTicketRadiologyResult>>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const customer = ref<Customer>(Customer.blank())
const ticketList = ref<Ticket[]>([])
const ticket = ref<Ticket>(Ticket.blank())

const page = ref<number>(1)
const limit = ref<number>(20)
const pageTotal = ref<number>(0)
const showModal = ref(false)

const startFetchData = async () => {
  try {
    const paginationResult = await TicketQueryApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        customerId: customer.value.id,
      },
      sort: { id: 'DESC' },
    })
    ticketList.value = paginationResult.ticketList
    pageTotal.value = Math.ceil(paginationResult.total / limit.value)
  } catch (error) {
    console.log('🚀 ~ file: CustomerTicketsHistory.vue:66 ~ error:', error)
  }
}

const openModal = async (customerProp: Customer) => {
  customer.value = Customer.from(customerProp)
  showModal.value = true
  await startFetchData()
}

const closeModal = () => {
  showModal.value = false
  customer.value = Customer.blank()
}

const clickTicketHistory = async (basic: Ticket) => {
  ticket.value = await TicketService.getTicket(basic)
}

const handleChangePageHistory = async (pageSelect: number) => {
  page.value = pageSelect
  await startFetchData()
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 1400px; margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">{{ customer.fullName }}</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="mt-4">
        <div class="flex flex-wrap mt-4 gap-2 p-2" style="background-color: var(--color-body-bg)">
          <div class="p-1 grow w-full lg:w-[200px]" style="background-color: white">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th colspan="2">Lịch sử khám</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="ticketItem in ticketList"
                    :key="ticketItem.id"
                    style="cursor: pointer; user-select: none"
                    class="hover:text-blue-500"
                    :class="ticket.id === ticketItem.id ? 'active' : ''"
                    @click="clickTicketHistory(ticketItem)"
                  >
                    <td>{{ ESTimer.timeToText(ticketItem.createdAt, 'DD/MM/YY') }}</td>
                    <td>{{ ticketItem.note }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-2 px-2 pb-2 flex justify-between items-center gap-4">
              <button
                style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                class="cursor-pointer disabled:opacity-[30%] disabled:cursor-not-allowed"
                :disabled="page == 1"
                @click="(e) => handleChangePageHistory(page - 1)"
              >
                <IconCaretLeft style="font-size: 22px; opacity: 0.6" />
              </button>
              <div class="flex justify-end items-center" style="font-size: 14px; color: gray">
                {{ page }} / {{ pageTotal }}
              </div>
              <button
                style="border: none; font-size: 1.2rem; line-height: 0.5; background: none"
                class="cursor-pointer disabled:opacity-[30%] disabled:cursor-not-allowed"
                :disabled="page === pageTotal"
                @click="(e) => handleChangePageHistory(page + 1)"
              >
                <IconCaretRight style="font-size: 22px; opacity: 0.6" />
              </button>
            </div>
          </div>
          <div class="grow basis-[90%] lg:basis-[70%]">
            <div
              v-if="!ticket.id"
              class="px-4 py-2 text-center italic"
              style="background-color: white"
            >
              Chưa chọn phiếu khám
            </div>
            <div v-if="ticket.id">
              <div class="pb-1">
                <span>- Phiếu khám:</span>
                <TicketLink :ticket="ticket" :ticketId="ticket.id" target="_blank" />
              </div>
              <div class="flex flex-wrap items-start gap-4 p-4" style="background-color: white">
                <div style="flex-grow: 1">
                  <div>
                    <span class="mr-4" style="font-weight: 500">1. Lý do khám:</span>
                    {{ ticket.ticketAttributeMap?.reason }}
                  </div>
                  <div class="mt-4" style="font-weight: 500">2. Tiền sử:</div>
                  <div class="mt-2 ml-4" v-html="ticket.ticketAttributeMap?.healthHistory"></div>
                  <div class="mt-4" style="font-weight: 500">3. Tóm tắt:</div>
                  <div class="mt-2 ml-4" v-html="ticket.ticketAttributeMap?.summary"></div>
                  <div class="mt-4" style="font-weight: 500">4. Chẩn đoán:</div>
                  <div class="mt-2 ml-4">
                    {{ ticket.note }}
                  </div>
                </div>
                <div class="py-2 px-2" style="border: 1px solid #d1d5db">
                  <table class="table-vital-signs">
                    <tbody>
                      <tr>
                        <td class="title-vital-signs">Mạch</td>
                        <td>:</td>
                        <td class="input-vital-signs">
                          <input disabled :value="ticket.ticketAttributeMap?.pulse" type="number" />
                        </td>
                        <td class="unit-vital-signs">l/p</td>
                      </tr>
                      <tr>
                        <td class="title-vital-signs">Nhiệt độ</td>
                        <td>:</td>
                        <td class="input-vital-signs">
                          <input
                            disabled
                            :value="ticket.ticketAttributeMap?.temperature"
                            type="number"
                          />
                        </td>
                        <td class="unit-vital-signs">°C</td>
                      </tr>
                      <tr>
                        <td class="title-vital-signs">Huyết áp</td>
                        <td>:</td>
                        <td class="input-vital-signs">
                          <input disabled :value="ticket.ticketAttributeMap?.bloodPressure" />
                        </td>
                        <td class="unit-vital-signs">mmHg</td>
                      </tr>
                      <tr>
                        <td class="title-vital-signs">TS Thở</td>
                        <td>:</td>
                        <td class="input-vital-signs">
                          <input
                            disabled
                            :value="ticket.ticketAttributeMap?.respiratoryRate"
                            type="number"
                          />
                        </td>
                        <td class="unit-vital-signs">l/p</td>
                      </tr>
                      <tr>
                        <td class="title-vital-signs">SpO2</td>
                        <td>:</td>
                        <td class="input-vital-signs">
                          <input disabled :value="ticket.ticketAttributeMap?.spO2" type="number" />
                        </td>
                        <td class="unit-vital-signs">%</td>
                      </tr>
                      <tr>
                        <td class="title-vital-signs">Chiều cao</td>
                        <td>:</td>
                        <td class="input-vital-signs">
                          <input
                            disabled
                            :value="ticket.ticketAttributeMap?.height"
                            type="number"
                          />
                        </td>
                        <td class="unit-vital-signs">cm</td>
                      </tr>
                      <tr>
                        <td class="title-vital-signs">Cân nặng</td>
                        <td>:</td>
                        <td class="input-vital-signs">
                          <input
                            disabled
                            :value="ticket.ticketAttributeMap?.weight"
                            type="number"
                          />
                        </td>
                        <td class="unit-vital-signs">kg</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div
                v-if="ticket?.imageDiagnosisList?.length"
                class="mt-4 px-4 pt-2 pb-1"
                style="background-color: white"
              >
                <div style="font-style: italic; text-decoration: underline">5. Hình ảnh khám</div>
                <ImageUploadMultiple
                  ref="imageUploadRef"
                  :height="100"
                  :editable="false"
                  :rootImageList="
                    (ticket?.imageDiagnosisList || []).map((i) => ({
                      thumbnail: ESImage.getImageLink(i, { size: 200 }),
                      enlarged: ESImage.getImageLink(i, { size: 1000 }),
                      id: i.id,
                    }))
                  "
                />
              </div>

              <div
                v-if="ticket.ticketRegimenList?.length || ticket.ticketProcedureNormalList?.length"
                class="mt-4 table-wrapper p-4"
                style="background-color: white"
              >
                <div class="mb-2" style="font-weight: 500">6. Dịch vụ:</div>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th style="width: 40px"></th>
                      <th
                        v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'"
                        style="width: 40px"
                      ></th>
                      <th>Tên dịch vụ</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Tổng tiền</th>
                    </tr>
                  </thead>
                  <tbody style="background-color: white">
                    <template
                      v-for="(ticketRegimen, trIndex) in ticket.ticketRegimenList"
                      :key="ticketRegimen.id"
                    >
                      <tr>
                        <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
                          {{ trIndex + 1 }}
                        </td>
                        <td v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
                        <td class="text-center">
                          <TicketRegimenStatusTooltip :status="ticketRegimen.status" />
                        </td>
                        <td :colspan="6">
                          <div class="flex justify-between">
                            <div class="flex flex-wrap items-center gap-1">
                              <span style="font-weight: 500">
                                {{ ticketRegimen.regimen?.name }}
                              </span>
                            </div>
                            <div class="text-right">
                              <div>Giá tiền</div>
                              <div
                                v-if="ticketRegimen.discountMoney"
                                class="text-xs italic text-red-500"
                              >
                                <del>{{ formatMoney(ticketRegimen.expectedPrice) }}</del>
                              </div>
                              <div
                                class="flex items-center gap-1"
                                style="font-weight: bold; color: var(--text-green)"
                              >
                                <span>{{ formatMoney(ticketRegimen.actualPrice) }}</span>
                              </div>
                            </div>
                            <div v-if="ticket.isPaymentEachItem" class="text-right">
                              <div>Đã thanh toán</div>
                              <div style="font-weight: bold; color: var(--text-green)">
                                {{ formatMoney(ticketRegimen.moneyAmountPaid) }}
                              </div>
                            </div>
                            <div v-if="!ticket.isPaymentEachItem" class="text-right">
                              <div>Đã thực hiện</div>
                              <div style="font-weight: bold; color: var(--text-green)">
                                {{ formatMoney(ticketRegimen.moneyAmountUsed) }}
                              </div>
                            </div>
                            <div
                              v-if="
                                ticket.isPaymentEachItem && ticketRegimen.moneyAmountWallet != 0
                              "
                              class="text-right"
                            >
                              <div>Ví</div>
                              <div style="font-weight: bold; color: violet">
                                {{ formatMoney(ticketRegimen.moneyAmountWallet) }}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr
                        v-for="(tri, triIndex) in ticketRegimen.ticketRegimenItemList"
                        :key="tri.id"
                      >
                        <td></td>
                        <td v-if="ticket.isPaymentEachItem"></td>
                        <td class="text-center"></td>
                        <td colspan="1">
                          <div class="flex gap-2">
                            <span>
                              {{ trIndex + 1 }}.{{ triIndex + 1 }}. {{ tri.procedure?.name }}
                            </span>
                            <span style="font-weight: 500">
                              ({{ tri.quantityUsed }} / {{ tri.quantityRegular }})
                            </span>
                          </div>
                        </td>
                        <td style="font-weight: 700; text-align: center">
                          <span></span>
                          <span></span>
                          {{ tri.quantityActual }}
                        </td>
                        <td class="text-right whitespace-nowrap">
                          <div v-if="tri.discountMoneyAmount" class="text-xs italic text-red-500">
                            <del>
                              {{
                                formatMoney(
                                  Math.round(tri.moneyAmountRegular / tri.quantityRegular),
                                )
                              }}
                            </del>
                          </div>
                          <div>
                            {{ formatMoney(Math.round(tri.moneyAmountSale / tri.quantityRegular)) }}
                          </div>
                        </td>
                        <td class="text-right whitespace-nowrap">
                          <span>
                            {{ formatMoney(tri.moneyAmountActual) }}
                          </span>
                        </td>
                      </tr>
                    </template>
                    <tr v-for="(tp, index) in ticket.ticketProcedureNormalList" :key="tp.id">
                      <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
                        {{ index + (ticket.ticketRegimenList?.length || 0) + 1 }}
                      </td>
                      <td v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'">
                        <PaymentMoneyStatusTooltip :paymentMoneyStatus="tp.paymentMoneyStatus" />
                      </td>
                      <td class="text-center">
                        <TicketProcedureStatusTooltip :status="tp.status" />
                      </td>
                      <td>{{ tp.procedure?.name }}</td>
                      <td class="text-center">{{ tp.quantity }}</td>
                      <td class="text-right">
                        <div v-if="tp.discountMoney" class="text-xs italic text-red-500">
                          <del>{{ formatMoney(tp.expectedPrice) }}</del>
                        </div>
                        <div>{{ formatMoney(tp.actualPrice) }}</div>
                      </td>
                      <td class="text-right whitespace-nowrap">
                        {{ formatMoney(tp.actualPrice * tp.quantity) }}
                      </td>
                    </tr>
                    <tr>
                      <td></td>
                      <td v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
                      <td class="text-right" colspan="4">
                        <div class="flex items-center justify-end gap-2">
                          <span class="uppercase">Tổng tiền dịch vụ</span>
                        </div>
                      </td>
                      <td class="font-bold text-right whitespace-nowrap" colspan="1">
                        {{ formatMoney(ticket.procedureMoney) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                v-if="ticket.ticketLaboratoryGroupList?.length"
                class="mt-4 table-wrapper p-4"
                style="background-color: white"
              >
                <div class="mb-2" style="font-weight: 500">7. Xét nghiệm:</div>
                <table v-if="ticket.ticketLaboratoryList?.length">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th
                        v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'"
                        style="width: 40px"
                      ></th>
                      <th style="width: 40px"></th>
                      <th>Tên</th>
                      <th>Kết quả</th>
                      <th>Tham chiếu</th>
                      <th>Đơn vị</th>
                      <th>Giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="tlg in ticket.ticketLaboratoryGroupList" :key="tlg.id">
                      <tr>
                        <td colspan="8" class="">
                          <div class="flex items-center gap-2">
                            <span class="font-bold">
                              {{ tlg.laboratoryGroup?.name || 'Chưa có nhóm' }}
                            </span>
                          </div>
                        </td>
                      </tr>
                      <template v-for="(tl, index) in tlg.ticketLaboratoryList || []" :key="tl.id">
                        <tr
                          :style="
                            tlg.ticketLaboratoryResultMap?.[tl.laboratoryId]?.attention
                              ? 'color: red'
                              : ''
                          "
                        >
                          <td class="text-center">
                            <span>{{ index + 1 }}</span>
                          </td>
                          <td v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'">
                            <PaymentMoneyStatusTooltip
                              :paymentMoneyStatus="tl.paymentMoneyStatus"
                            />
                          </td>
                          <td class="text-center">
                            <TicketLaboratoryStatusTooltip :status="tl.status" />
                          </td>
                          <td>{{ tl.laboratory?.name }}</td>
                          <td class="text-center">
                            <div>
                              {{ tlg.ticketLaboratoryResultMap?.[tl.laboratoryId]?.result }}
                            </div>
                          </td>
                          <td class="text-center">
                            <span v-if="tl.laboratory?.valueType === LaboratoryValueType.Number">
                              {{ tl.laboratory?.lowValue }} -
                              {{ tl.laboratory?.highValue }}
                            </span>
                          </td>
                          <td class="text-center">
                            <span v-if="tl.laboratory?.valueType === LaboratoryValueType.Number">
                              {{ tl.laboratory?.unit }}
                            </span>
                          </td>
                          <td class="text-right whitespace-nowrap">
                            <div v-if="tl.discountMoney" class="text-xs italic text-red-500">
                              <del>{{ formatMoney(tl.expectedPrice) }}</del>
                            </div>
                            <div>{{ formatMoney(tl.actualPrice) }}</div>
                          </td>
                        </tr>
                        <tr
                          v-for="(laboratoryChild, i) in tl.laboratory?.children || []"
                          :key="i"
                          :style="
                            tlg.ticketLaboratoryResultMap?.[laboratoryChild.id]?.attention
                              ? 'color: red'
                              : ''
                          "
                        >
                          <td></td>
                          <td></td>
                          <td>{{ laboratoryChild.name }}</td>
                          <td class="text-center">
                            <div>
                              {{ tlg.ticketLaboratoryResultMap?.[laboratoryChild.id]?.result }}
                            </div>
                          </td>
                          <td class="text-center">
                            <span v-if="laboratoryChild.valueType === LaboratoryValueType.Number">
                              {{ laboratoryChild.lowValue }} -
                              {{ laboratoryChild.highValue }}
                            </span>
                          </td>
                          <td class="text-center">{{ laboratoryChild.unit }}</td>
                          <td class="text-right"></td>
                          <td class="text-center"></td>
                        </tr>
                      </template>
                    </template>

                    <tr>
                      <td></td>
                      <td v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
                      <td colspan="5" class="text-right uppercase">Tổng tiền xét nghiệm</td>
                      <td class="text-right">
                        <b>
                          {{ formatMoney(ticket.laboratoryMoney) }}
                        </b>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                v-if="ticket.ticketRadiologyList?.length"
                class="mt-4 table-wrapper p-4"
                style="background-color: white"
              >
                <div class="mb-2" style="font-weight: 500">8. CĐHA:</div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 32px">#</th>
                      <th
                        v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'"
                        style="width: 32px"
                      ></th>
                      <th style="width: 32px"></th>
                      <th class="">Tên phiếu</th>
                      <th class="">Chi tiết</th>
                      <th class="">Giá tiền</th>
                    </tr>
                  </thead>
                  <tbody style="background-color: white">
                    <tr
                      v-for="(ticketRadiology, index) in ticket.ticketRadiologyList"
                      :key="ticketRadiology.id"
                    >
                      <td class="text-center">{{ index + 1 }}</td>
                      <td v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'">
                        <PaymentMoneyStatusTooltip
                          :paymentMoneyStatus="ticketRadiology.paymentMoneyStatus"
                        />
                      </td>
                      <td class="text-center">
                        <TicketRadiologyStatusTooltip :status="ticketRadiology.status" />
                      </td>
                      <td>
                        <div style="font-weight: 500">{{ ticketRadiology.radiology?.name }}</div>
                        <div style="font-style: italic">{{ ticketRadiology.result }}</div>
                      </td>
                      <td class="text-center">
                        <a
                          @click="
                            modalTicketRadiologyResult?.openModal(ticketRadiology.id, {
                              noEdit: true,
                            })
                          "
                        >
                          <IconVisibility width="22" height="22" />
                        </a>
                      </td>

                      <td class="text-right">
                        <div
                          v-if="ticketRadiology.discountMoney"
                          class="text-xs italic text-red-500"
                        >
                          <del>{{ formatMoney(ticketRadiology.expectedPrice) }}</del>
                        </div>
                        <div>{{ formatMoney(ticketRadiology.actualPrice) }}</div>
                      </td>
                    </tr>
                    <tr>
                      <td></td>
                      <td v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
                      <td class="text-right uppercase" colspan="3">Tổng tiền CĐHA</td>
                      <td class="font-bold text-right whitespace-nowrap">
                        {{ formatMoney(ticket.radiologyMoney) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                v-if="ticket.ticketProductConsumableList?.length"
                class="mt-4 table-wrapper p-4"
                style="background-color: white"
              >
                <div class="mb-2" style="font-weight: 500">9. Vật tư:</div>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th
                        v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'"
                        style="width: 32px"
                      ></th>
                      <th style="width: 32px"></th>
                      <th>Tên vật tư</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Tổng tiền</th>
                    </tr>
                  </thead>
                  <tbody style="background-color: white">
                    <tr v-for="(tp, index) in ticket.ticketProductConsumableList" :key="tp.id">
                      <td class="text-center">{{ index + 1 }}</td>
                      <td v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'">
                        <PaymentMoneyStatusTooltip :paymentMoneyStatus="tp.paymentMoneyStatus" />
                      </td>
                      <td class="text-center">
                        <TicketDeliveryStatusTooltip :deliveryStatus="tp.deliveryStatus" />
                      </td>
                      <td>{{ tp.product?.brandName }}</td>
                      <td class="text-center">{{ tp.quantity }}</td>
                      <td class="text-right">
                        <div v-if="tp.discountMoney" class="text-xs italic text-red-500">
                          <del>{{ formatMoney(tp.unitExpectedPrice) }}</del>
                        </div>
                        <div>{{ formatMoney(tp.unitActualPrice) }}</div>
                      </td>
                      <td class="text-right">
                        {{ formatMoney(tp.actualPrice * tp.quantity) }}
                      </td>
                    </tr>
                    <tr>
                      <td></td>
                      <td v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
                      <td class="text-right uppercase" colspan="4">Tổng tiền vật tư</td>
                      <td class="font-bold text-right whitespace-nowrap">
                        {{
                          formatMoney(
                            ticket.ticketProductConsumableList.reduce((acc, item) => {
                              return acc + item.quantity * item.actualPrice
                            }, 0),
                          )
                        }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                v-if="ticket.ticketProductPrescriptionList?.length"
                class="mt-4 table-wrapper p-4"
                style="background-color: white"
              >
                <div class="mb-2" style="font-weight: 500">10. Thuốc:</div>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'"></th>
                      <th style="width: 32px"></th>
                      <th>Tên thuốc</th>
                      <th>SL kê</th>
                      <th>SL mua</th>
                      <th>Đơn giá</th>
                      <th>Tổng tiền</th>
                    </tr>
                  </thead>
                  <tbody style="background-color: white">
                    <tr v-for="(tp, index) in ticket.ticketProductPrescriptionList" :key="tp.id">
                      <td class="text-center">{{ index + 1 }}</td>
                      <td v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'">
                        <PaymentMoneyStatusTooltip :paymentMoneyStatus="tp.paymentMoneyStatus" />
                      </td>
                      <td class="text-center">
                        <TicketDeliveryStatusTooltip :deliveryStatus="tp.deliveryStatus" />
                      </td>
                      <td>
                        <div>{{ tp.product?.brandName }}</div>
                        <div style="font-size: 0.8rem; font-style: italic">
                          {{ tp.hintUsage }}
                        </div>
                      </td>
                      <td class="text-center">{{ tp.unitQuantityPrescription }}</td>
                      <td class="text-center">{{ tp.unitQuantity }}</td>
                      <td class="text-right">
                        <div v-if="tp.discountMoney" class="text-xs italic text-red-500">
                          <del>{{ formatMoney(tp.unitExpectedPrice) }}</del>
                        </div>
                        <div>{{ formatMoney(tp.unitActualPrice) }}</div>
                      </td>
                      <td class="text-right">
                        {{ formatMoney(tp.actualPrice * tp.quantity) }}
                      </td>
                    </tr>
                    <tr>
                      <td></td>
                      <td v-if="ticket.isPaymentEachItem || CONFIG.MODE === 'development'"></td>
                      <td class="text-right uppercase" colspan="5">Tổng tiền thuốc</td>
                      <td class="font-bold text-right whitespace-nowrap">
                        {{
                          formatMoney(
                            ticket.ticketProductPrescriptionList.reduce((acc, item) => {
                              return acc + item.quantity * item.actualPrice
                            }, 0),
                          )
                        }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-4 table-wrapper p-4" style="background-color: white">
                <div class="mb-2" style="font-weight: 500">11. Thanh toán:</div>
                <table>
                  <tbody>
                    <tr>
                      <td>- Tổng chi phí:</td>
                      <td class="px-4">{{ formatMoney(ticket.totalMoney) }}</td>
                    </tr>
                    <tr v-if="ticket.discountMoney">
                      <td>- Chiết khấu:</td>
                      <td class="px-4">
                        <VueTag v-if="ticket.discountType === 'VNĐ'" color="green">
                          {{ formatMoney(ticket.discountMoney) }}
                        </VueTag>
                        <VueTag v-if="ticket.discountType === '%'" color="green">
                          {{ ticket.discountPercent || 0 }}%
                        </VueTag>
                      </td>
                    </tr>
                    <tr>
                      <td>- Đã thanh toán:</td>
                      <td class="px-4">{{ formatMoney(ticket.paid) }}</td>
                    </tr>
                    <tr>
                      <td>- Nợ:</td>
                      <td class="px-4">{{ formatMoney(ticket.debt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </VueModal>
  <ModalTicketRadiologyResult ref="modalTicketRadiologyResult" />
</template>

<style lang="scss" scoped>
table {
  tbody {
    tr {
      &.active {
        color: #0047cc;
      }
    }
  }
}
</style>
