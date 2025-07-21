<script setup lang="ts">
import ModalTicketRadiologyResult from '@/views/room/room-radiology/ModalTicketRadiologyResult.vue'
import { ref } from 'vue'
import {
  IconCaretLeft,
  IconCaretRight,
  IconCheckSquare,
  IconClockCircle,
  IconClose,
} from '../../../common/icon-antd'
import { IconVisibility } from '../../../common/icon-google'
import ImageUploadMultiple from '../../../common/image-upload/ImageUploadMultiple.vue'
import VueTooltip from '../../../common/popover/VueTooltip.vue'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer } from '../../../modules/customer'
import { ImageHost } from '../../../modules/image/image.model'
import { LaboratoryValueType } from '../../../modules/laboratory'
import { Ticket, TicketQueryApi, TicketType } from '../../../modules/ticket'
import { TicketClinicService } from '../../../modules/ticket-clinic/ticket-clinic.service'
import { TicketLaboratoryStatus } from '../../../modules/ticket-laboratory'
import { ESImage, ESTimer } from '../../../utils'

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
        ticketType: { NOT: TicketType.Order },
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
  ticket.value = await TicketClinicService.getTicket(basic)
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
                    <td>{{ ESTimer.timeToText(ticketItem.registeredAt, 'DD/MM/YY') }}</td>
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
            <div v-else>
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
              <div class="mt-4 px-4 pt-2 pb-1" style="background-color: white">
                <div style="font-style: italic; text-decoration: underline">5. Hình ảnh</div>
                <ImageUploadMultiple
                  ref="imageUploadRef"
                  :height="100"
                  :editable="false"
                  :rootImageList="
                    (ticket?.imageList || [])
                      .filter((i) => i.hostType === ImageHost.GoogleDriver)
                      .map((i) => ({
                        thumbnail: ESImage.getImageLink(i, { size: 200 }),
                        enlarged: ESImage.getImageLink(i, { size: 1000 }),
                        id: i.id,
                      }))
                  "
                />
              </div>
              <div class="mt-4 table-wrapper p-4" style="background-color: white">
                <div class="mb-2" style="font-weight: 500">6. Vật tư:</div>
                <table v-if="ticket.ticketProductConsumableList?.length">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tên sản phẩm</th>
                      <th>Số lượng</th>
                      <th>Giá tiền</th>
                    </tr>
                  </thead>
                  <tbody style="background-color: white">
                    <tr v-for="(tp, index) in ticket.ticketProductConsumableList" :key="tp.id">
                      <td class="text-center">{{ index + 1 }}</td>
                      <td>{{ tp.product?.brandName }}</td>
                      <td class="text-center">{{ tp.quantity }}</td>
                      <td class="text-right">
                        <div v-if="tp.discountMoney" class="text-xs italic text-red-500">
                          <del>{{ formatMoney(tp.unitExpectedPrice) }}</del>
                        </div>
                        <div>{{ formatMoney(tp.unitActualPrice) }}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-4 table-wrapper p-4" style="background-color: white">
                <div class="mb-2" style="font-weight: 500">7. Dịch vụ:</div>
                <table v-if="ticket.ticketProcedureList?.length">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tên dịch vụ</th>
                      <th>Số lượng</th>
                      <th>Giá tiền</th>
                    </tr>
                  </thead>
                  <tbody style="background-color: white">
                    <tr v-for="(tp, index) in ticket.ticketProcedureList" :key="tp.id">
                      <td class="text-center">{{ index + 1 }}</td>
                      <td>{{ tp.procedure?.name }}</td>
                      <td class="text-center">{{ tp.quantity }}</td>
                      <td class="text-right">
                        <div v-if="tp.discountMoney" class="text-xs italic text-red-500">
                          <del>{{ formatMoney(tp.expectedPrice) }}</del>
                        </div>
                        <div>{{ formatMoney(tp.actualPrice) }}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-4 table-wrapper p-4" style="background-color: white">
                <div class="mb-2" style="font-weight: 500">8. Xét nghiệm:</div>
                <table v-if="ticket.ticketLaboratoryList?.length">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th style="width: 32px"></th>
                      <th>Tên</th>
                      <th>Kết quả</th>
                      <th>Tham chiếu</th>
                      <th>Đơn vị</th>
                      <th>Giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="ticket.ticketLaboratoryGroupList!.length === 0">
                      <td colspan="20" class="text-center">Chưa có phiếu xét nghiệm nào</td>
                    </tr>
                    <template v-for="tlg in ticket.ticketLaboratoryGroupList" :key="tlg.id">
                      <tr>
                        <td colspan="3" class="">
                          <div class="flex items-center gap-2">
                            <span class="font-bold">{{ tlg.laboratoryGroup?.name }}</span>
                          </div>
                        </td>
                        <td colspan="4"></td>
                      </tr>
                      <template
                        v-for="(tlItem, index) in tlg.ticketLaboratoryList || []"
                        :key="tlItem.id"
                      >
                        <tr
                          :style="
                            tlg.ticketLaboratoryResultMap?.[tlItem.laboratoryId]?.attention
                              ? 'color: red'
                              : ''
                          "
                        >
                          <td class="text-center">
                            <span>{{ index + 1 }}</span>
                          </td>
                          <td class="text-center">
                            <VueTooltip v-if="tlItem.status === TicketLaboratoryStatus.Pending">
                              <template #trigger>
                                <IconClockCircle
                                  style="font-size: 18px; color: orange; cursor: not-allowed"
                                />
                              </template>
                              <div>Chưa có kết quả</div>
                            </VueTooltip>

                            <VueTooltip v-else>
                              <template #trigger>
                                <IconCheckSquare
                                  style="color: #52c41a; font-size: 18px; cursor: not-allowed"
                                />
                              </template>
                              <div>Đã hoàn thành</div>
                            </VueTooltip>
                          </td>
                          <td>{{ tlItem.laboratory?.name }}</td>
                          <td class="text-center">
                            <div>
                              {{ tlg.ticketLaboratoryResultMap?.[tlItem.laboratoryId]?.result }}
                            </div>
                          </td>
                          <td class="text-center">
                            <span
                              v-if="tlItem.laboratory?.valueType === LaboratoryValueType.Number"
                            >
                              {{ tlItem.laboratory?.lowValue }} -
                              {{ tlItem.laboratory?.highValue }}
                            </span>
                          </td>
                          <td class="text-center">
                            <span
                              v-if="tlItem.laboratory?.valueType === LaboratoryValueType.Number"
                            >
                              {{ tlItem.laboratory?.unit }}
                            </span>
                          </td>
                          <td class="text-right whitespace-nowrap">
                            <div v-if="tlItem.discountMoney" class="text-xs italic text-red-500">
                              <del>{{ formatMoney(tlItem.expectedPrice) }}</del>
                            </div>
                            <div>{{ formatMoney(tlItem.actualPrice) }}</div>
                          </td>
                        </tr>
                        <tr
                          v-for="(laboratoryChild, i) in tlItem.laboratory?.children || []"
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
                      <td colspan="6" class="text-right">
                        <b>Tổng tiền</b>
                      </td>
                      <td class="text-right">
                        <b>
                          {{ formatMoney(ticket.laboratoryMoney) }}
                        </b>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="mt-4 table-wrapper p-4" style="background-color: white">
                <div class="mb-2" style="font-weight: 500">9. CĐHA:</div>
                <table v-if="ticket.ticketRadiologyList?.length">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th class="text-center font-bold">Tên phiếu</th>
                      <th class="text-center font-bold">Chi tiết</th>
                      <th class="text-center font-bold">Giá tiền</th>
                    </tr>
                  </thead>
                  <tbody style="background-color: white">
                    <tr
                      v-for="(ticketRadiology, index) in ticket.ticketRadiologyList"
                      :key="ticketRadiology.id"
                    >
                      <td class="text-center">{{ index + 1 }}</td>
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
                  </tbody>
                </table>
              </div>

              <div class="mt-4 table-wrapper p-4" style="background-color: white">
                <div class="mb-2" style="font-weight: 500">10. Thuốc - Vật tư:</div>
                <table v-if="ticket.ticketProductPrescriptionList?.length">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th class="text-center">Tên thuốc</th>
                      <th class="text-center">SL kê</th>
                      <th class="text-center">SL mua</th>
                      <th class="text-center">Giá tiền</th>
                    </tr>
                  </thead>
                  <tbody style="background-color: white">
                    <tr v-for="(tp, index) in ticket.ticketProductPrescriptionList" :key="tp.id">
                      <td class="text-center">{{ index + 1 }}</td>
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
