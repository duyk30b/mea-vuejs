<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import ImageUploadMultiple from '../../../common/image-upload/ImageUploadMultiple.vue'
import { IconVisibility } from '../../../common/icon-google'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer } from '../../../modules/customer'
import { ImageHost } from '../../../modules/image/image.model'
import { Ticket, TicketApi, TicketType } from '../../../modules/ticket'
import { useTicketClinicStore } from '../../../modules/ticket-clinic/ticket-clinic.store'
import { DImage, DTimer, formatPhone } from '../../../utils'
import ModalTicketRadiologyResult from '../../ticket-clinic/detail/radiology/ModalTicketRadiologyResult.vue'
import { Laboratory, LaboratoryService, LaboratoryValueType } from '../../../modules/laboratory'

const modalTicketRadiologyResult = ref<InstanceType<typeof ModalTicketRadiologyResult>>()
const props = withDefaults(defineProps<{ customerId: number }>(), {
  customerId: 0,
})

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const ticketClinicStore = useTicketClinicStore()

const laboratoryMap = ref<Record<string, Laboratory>>({})

const ticketList = ref<Ticket[]>([])
const ticket = ref<Ticket>(Ticket.blank())
const page = ref(1)
const limit = ref(
  Number(localStorage.getItem('CUSTOMER_TICKET_CLINIC_HISTORY_PAGINATION_LIMIT')) || 20
)
const total = ref(0)

onMounted(async () => {
  laboratoryMap.value = await LaboratoryService.getMap()
})

const startFetchData = async () => {
  try {
    const { data, meta } = await TicketApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        customerId: props.customerId,
        ticketType: { NOT: TicketType.Order },
      },
      relation: { ticketAttributeList: true },
      sort: { id: 'DESC' },
    })
    ticketList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerTicketsHistory.vue:44 ~ error:', error)
  }
}

const clickTicketHistory = async (basic: Ticket) => {
  ticket.value = await ticketClinicStore.getTicketHistoryByBasic(basic)
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('CUSTOMER_TICKET_HISTORY_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

watch(
  () => props.customerId,
  async (newValue) => {
    if (newValue) await startFetchData()
    else ticketList.value = []
  },
  { immediate: true }
)
</script>

<template>
  <ModalTicketRadiologyResult ref="modalTicketRadiologyResult" />
  <div class="mt-4">
    <div class="flex flex-wrap mt-4 gap-2 p-2" style="background-color: var(--color-body-bg)">
      <div class="grow w-full lg:w-[200px]" style="background-color: white">
        <div class="text-center py-2 ticket-title-header">Lịch sử khám</div>
        <div class="w-full" style="border: 1px solid #eee">
          <div
            v-for="ticketItem in ticketList"
            :key="ticketItem.id"
            class="ticket-title py-2 px-2"
            :class="ticket.id === ticketItem.id ? 'active' : ''"
            @click="clickTicketHistory(ticketItem)">
            {{ DTimer.timeToText(ticketItem.registeredAt, 'DD/MM/YY') }} -
            {{ ticketItem.ticketAttributeMap?.diagnosis }}
          </div>
        </div>
        <div class="mt-4 mb-2 flex justify-center">
          <a-pagination
            v-model:current="page"
            v-model:pageSize="limit"
            :total="total"
            simple
            @change="
              (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
            " />
        </div>
      </div>
      <div class="grow basis-[90%] lg:basis-[70%]">
        <div v-if="!ticket.id" class="px-4 py-2 text-center italic" style="background-color: white">
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
                {{ ticket.ticketAttributeMap?.diagnosis }}
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
                        type="number" />
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
                        type="number" />
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
                      <input disabled :value="ticket.ticketAttributeMap?.height" type="number" />
                    </td>
                    <td class="unit-vital-signs">cm</td>
                  </tr>
                  <tr>
                    <td class="title-vital-signs">Cân nặng</td>
                    <td>:</td>
                    <td class="input-vital-signs">
                      <input disabled :value="ticket.ticketAttributeMap?.weight" type="number" />
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
                    thumbnail: DImage.getImageLink(i, { size: 200 }),
                    enlarged: DImage.getImageLink(i, { size: 1000 }),
                    id: i.id,
                  }))
              " />
          </div>
          <div class="mt-4 table-wrapper p-4" style="background-color: white">
            <div class="mb-2" style="font-weight: 500">6. Dịch vụ:</div>
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
                <tr
                  v-for="(ticketProcedure, index) in ticket.ticketProcedureList"
                  :key="ticketProcedure.id">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>{{ ticketProcedure.procedure?.name }}</td>
                  <td class="text-center">{{ ticketProcedure.quantity }}</td>
                  <td class="text-right">
                    <div
                      v-if="ticketProcedure.discountMoney"
                      style="
                        color: var(--text-red);
                        font-size: 0.8rem;
                        text-decoration: line-through;
                        font-style: italic;
                        white-space: nowrap;
                      ">
                      {{ formatMoney(ticketProcedure.expectedPrice) }}
                    </div>
                    <div>{{ formatMoney(ticketProcedure.actualPrice) }}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- <div class="mt-4 table-wrapper p-4" style="background-color: white">
            <div class="mb-2" style="font-weight: 500">7. Xét nghiệm:</div>
            <table v-if="ticket.ticketLaboratoryList?.length">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên Xét nghiệm</th>
                  <th>Kết quả</th>
                  <th>Tham chiếu</th>
                  <th>Đơn vị</th>
                  <th>Giá tiền</th>
                </tr>
              </thead>
              <tbody style="background-color: white">
                <template
                  v-for="(ticketLaboratory, index) in ticket.ticketLaboratoryList"
                  :key="ticketLaboratory.id">
                  <tr
                    v-for="(laboratoryParent, i) in laboratoryMap[ticketLaboratory.laboratoryId]
                      ? [laboratoryMap[ticketLaboratory.laboratoryId]]
                      : []"
                    :key="i"
                    :style="
                      ticketLaboratory.attentionParse[laboratoryParent.id] ? 'color: red' : ''
                    ">
                    <td class="text-center">{{ index + 1 }}</td>
                    <td>{{ laboratoryParent?.name }}</td>
                    <td class="text-center">
                      <div>{{ ticketLaboratory.resultParse[laboratoryParent.id] }}</div>
                    </td>
                    <td>
                      <span v-if="laboratoryParent?.valueType === LaboratoryValueType.Number">
                        {{ laboratoryParent?.lowValue }} -
                        {{ laboratoryParent?.highValue }}
                      </span>
                    </td>
                    <td class="text-center">
                      <span v-if="laboratoryParent?.valueType === LaboratoryValueType.Number">
                        {{ laboratoryParent?.unit }}
                      </span>
                    </td>
                    <td class="text-right">
                      <div
                        v-if="ticketLaboratory.discountMoney"
                        style="
                          color: var(--text-red);
                          font-size: 0.8rem;
                          text-decoration: line-through;
                          font-style: italic;
                          white-space: nowrap;
                        ">
                        {{ formatMoney(ticketLaboratory.expectedPrice) }}
                      </div>
                      <div>{{ formatMoney(ticketLaboratory.actualPrice) }}</div>
                    </td>
                  </tr>
                  <tr
                    v-for="(laboratoryItem, i) in laboratoryMap[ticketLaboratory.laboratoryId]
                      ?.children || []"
                    :key="i"
                    :style="ticketLaboratory.attentionParse[laboratoryItem.id] ? 'color: red' : ''">
                    <td></td>
                    <td>{{ laboratoryItem?.name }}</td>
                    <td class="text-center">
                      <div>{{ ticketLaboratory?.resultParse[laboratoryItem.id] }}</div>
                    </td>
                    <td>
                      <span v-if="laboratoryItem?.valueType === LaboratoryValueType.Number">
                        {{ laboratoryItem?.lowValue }} -
                        {{ laboratoryItem?.highValue }}
                      </span>
                    </td>
                    <td class="text-center">
                      <span v-if="laboratoryItem?.valueType === LaboratoryValueType.Number">
                        {{ laboratoryItem?.unit }}
                      </span>
                    </td>
                    <td class="text-right"></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div> -->

          <div class="mt-4 table-wrapper p-4" style="background-color: white">
            <div class="mb-2" style="font-weight: 500">8. CĐHA:</div>
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
                  :key="ticketRadiology.id">
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
                      ">
                      <IconVisibility width="22" height="22" />
                    </a>
                  </td>
                  <td class="text-right">
                    <div
                      v-if="ticketRadiology.discountMoney"
                      style="
                        color: var(--text-red);
                        font-size: 0.8rem;
                        text-decoration: line-through;
                        font-style: italic;
                        white-space: nowrap;
                      ">
                      {{ formatMoney(ticketRadiology.expectedPrice) }}
                    </div>
                    <div>{{ formatMoney(ticketRadiology.actualPrice) }}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4 table-wrapper p-4" style="background-color: white">
            <div class="mb-2" style="font-weight: 500">9. Thuốc - Vật tư:</div>
            <table v-if="ticket.ticketProductList?.length">
              <thead>
                <tr>
                  <th>#</th>
                  <th class="text-center font-bold">Tên thuốc</th>
                  <th class="text-center font-bold">Số lượng</th>
                  <th class="text-center font-bold">Giá tiền</th>
                </tr>
              </thead>
              <tbody style="background-color: white">
                <tr
                  v-for="(ticketProduct, index) in ticket.ticketProductList"
                  :key="ticketProduct.id">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <div>{{ ticketProduct.product?.brandName }}</div>
                    <div style="font-size: 0.8rem; font-style: italic">
                      {{ ticketProduct.hintUsage }}
                    </div>
                  </td>
                  <td class="text-center">{{ ticketProduct.quantity }}</td>
                  <td class="text-right">
                    <div
                      v-if="ticketProduct.discountMoney"
                      style="
                        color: var(--text-red);
                        font-size: 0.8rem;
                        text-decoration: line-through;
                        font-style: italic;
                        white-space: nowrap;
                      ">
                      {{ formatMoney(ticketProduct.expectedPrice) }}
                    </div>
                    <div>{{ formatMoney(ticketProduct.actualPrice) }}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4 table-wrapper p-4" style="background-color: white">
            <div class="mb-2" style="font-weight: 500">10. Thanh toán:</div>
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
</template>

<style lang="scss" scoped>
.ticket-title-header {
  background-color: #5884c4;
  color: white;
  font-weight: bold;
}
.ticket-title {
  width: 100%;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:nth-child(even) {
    background-color: #f0f4fa;
  }
  &:hover {
    background-color: #d3e2f1;
  }
  &.active {
    background-color: #b8cfe5;
  }
}

.table-vital-signs {
  width: 100%;
  td.title-vital-signs {
    padding: 4px 4px 4px 8px;
    white-space: nowrap;
  }
  td.unit-vital-signs {
    padding: 4px 8px 4px 8px;
    white-space: nowrap;
  }
  td.input-vital-signs {
    padding-left: 8px;
  }
  input {
    width: 80px;
    padding-left: 0.5rem;
    text-align: left;
    font-style: italic;
    border-top: none;
    border-left: none;
    border-right: none;
    border-bottom: 1px solid #cdcdcd;
    &:focus {
      outline: none;
    }
  }
}
</style>
