<script setup lang="ts">
import { ref, watch } from 'vue'
import ImageUpload from '../../../common/ImageUpload.vue'
import { IconVisibility } from '../../../common/icon-google'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer } from '../../../modules/customer'
import { ImageHost } from '../../../modules/image/image.model'
import { Ticket, TicketApi, TicketType } from '../../../modules/ticket'
import { useTicketClinicStore } from '../../../modules/ticket-clinic/ticket-clinic.store'
import { DTimer, formatPhone } from '../../../utils'
import ModalTicketRadiologyResult from '../../ticket-clinic/detail/modal/ModalTicketRadiologyResult.vue'

const modalTicketRadiologyResult = ref<InstanceType<typeof ModalTicketRadiologyResult>>()
const props = withDefaults(defineProps<{ customer: Customer }>(), {
  customer: () => Customer.blank(),
})

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketClinicStore = useTicketClinicStore()
const ticketList = ref<Ticket[]>([])
const ticket = ref<Ticket>(Ticket.blank())
const page = ref(1)
const limit = ref(
  Number(localStorage.getItem('CUSTOMER_TICKET_CLINIC_HISTORY_PAGINATION_LIMIT')) || 20
)
const total = ref(0)
const general = ref<{
  pulse?: number // Mạch
  temperature?: number // Nhiệt độ
  bloodPressure?: string // Huyết áp
  respiratoryRate?: number // Nhịp thở
  spO2?: number // sp02
  height?: number // Chiều cao
  weight?: number // Cân nặng
}>({})

const startFetchData = async () => {
  try {
    const { data, meta } = await TicketApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {
        customerId: props.customer.id!,
        ticketType: { IN: [TicketType.Clinic, TicketType.Eye] },
      },
      relation: { ticketDiagnosis: true },
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
  general.value = JSON.parse(ticket.value.ticketDiagnosis?.general || '{}')
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
  () => props.customer.id,
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
    <div class="flex flex-wrap items-center gap-2">
      <span>
        KH:
        <b>{{ customer.fullName }}</b>
      </span>
      <span>
        <a :href="'tel:' + customer.phone">{{ formatPhone(customer.phone || '') }}</a>
      </span>
      <div class="ml-auto"></div>
    </div>

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
            {{ ticketItem.ticketDiagnosis?.diagnosis }}
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
                {{ ticket.ticketDiagnosis?.reason }}
              </div>
              <div class="mt-4" style="font-weight: 500">2. Tiền sử:</div>
              <div class="mt-2 ml-4" v-html="ticket.ticketDiagnosis?.healthHistory"></div>
              <!-- <div class="mt-4" style="font-weight: 500">3. Chỉ số sinh tồn</div>
            <div>{{ JSON.stringify(ticket.ticketDiagnosis?.general) }}</div> -->
              <div class="mt-4" style="font-weight: 500">4. Tóm tắt:</div>
              <div class="mt-2 ml-4" v-html="ticket.ticketDiagnosis?.summary"></div>
              <div class="mt-4" style="font-weight: 500">5. Chẩn đoán:</div>
              <div class="mt-2 ml-4">
                {{ ticket.ticketDiagnosis?.diagnosis }}
              </div>
            </div>
            <div class="py-2 px-2" style="border: 1px solid #d1d5db">
              <table class="table-vital-signs">
                <tr>
                  <td class="title-vital-signs">Mạch</td>
                  <td>:</td>
                  <td class="input-vital-signs">
                    <input disabled :value="general.pulse" type="number" />
                  </td>
                  <td class="unit-vital-signs">l/p</td>
                </tr>
                <tr>
                  <td class="title-vital-signs">Nhiệt độ</td>
                  <td>:</td>
                  <td class="input-vital-signs">
                    <input disabled :value="general.temperature" type="number" />
                  </td>
                  <td class="unit-vital-signs">°C</td>
                </tr>
                <tr>
                  <td class="title-vital-signs">Huyết áp</td>
                  <td>:</td>
                  <td class="input-vital-signs">
                    <input disabled :value="general.bloodPressure" />
                  </td>
                  <td class="unit-vital-signs">mmHg</td>
                </tr>
                <tr>
                  <td class="title-vital-signs">TS Thở</td>
                  <td>:</td>
                  <td class="input-vital-signs">
                    <input disabled :value="general.respiratoryRate" type="number" />
                  </td>
                  <td class="unit-vital-signs">l/p</td>
                </tr>
                <tr>
                  <td class="title-vital-signs">SpO2</td>
                  <td>:</td>
                  <td class="input-vital-signs">
                    <input disabled :value="general.spO2" type="number" />
                  </td>
                  <td class="unit-vital-signs">%</td>
                </tr>
                <tr>
                  <td class="title-vital-signs">Chiều cao</td>
                  <td>:</td>
                  <td class="input-vital-signs">
                    <input disabled :value="general.height" type="number" />
                  </td>
                  <td class="unit-vital-signs">cm</td>
                </tr>
                <tr>
                  <td class="title-vital-signs">Cân nặng</td>
                  <td>:</td>
                  <td class="input-vital-signs">
                    <input disabled :value="general.weight" type="number" />
                  </td>
                  <td class="unit-vital-signs">kg</td>
                </tr>
              </table>
            </div>
          </div>
          <div class="mt-4 px-4 pt-2 pb-1" style="background-color: white">
            <div style="font-style: italic; text-decoration: underline">Hình ảnh</div>
            <ImageUpload
              ref="imageUploadRef"
              :height="100"
              :editable="false"
              :rootImageList="
                (ticket.ticketDiagnosis?.imageList || [])
                  .filter((i) => i.hostType === ImageHost.GoogleDriver)
                  .map((i) => ({
                    thumbnail: i.link({ size: 200 }),
                    enlarged: i.link({ size: 1000 }),
                    id: i.id,
                  }))
              " />
          </div>
          <div class="mt-4 table-wrapper p-4" style="background-color: white">
            <div class="mb-2" style="font-weight: 500">6. Dịch vụ:</div>
            <table>
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

          <div class="mt-4 table-wrapper p-4" style="background-color: white">
            <div class="mb-2" style="font-weight: 500">7. CĐHA:</div>
            <table>
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
                        modalTicketRadiologyResult?.openModalByInstance(ticketRadiology, {
                          editable: false,
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
            <div class="mb-2" style="font-weight: 500">8. Đơn thuốc:</div>
            <table>
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
            <div class="mb-2" style="font-weight: 500">9. Thanh toán:</div>
            <table>
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
