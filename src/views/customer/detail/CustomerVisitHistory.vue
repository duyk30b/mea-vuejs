<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Customer } from '../../../modules/customer'
import { Visit, VisitApi } from '../../../modules/visit'
import { useVisitStore } from '../../../modules/visit/visit.store'
import { timeToText } from '../../../utils'

const props = withDefaults(defineProps<{ customer: Customer }>(), {
  customer: () => Customer.blank(),
})

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const visitStore = useVisitStore()
const visitList = ref<Visit[]>([])
const visit = ref<Visit>(Visit.blank())
const page = ref(1)
const limit = ref(Number(localStorage.getItem('CUSTOMER_VISIT_HISTORY_PAGINATION_LIMIT')) || 20)
const total = ref(0)
const vitalSigns = ref<{
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
    const { data, meta } = await VisitApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: { customerId: props.customer.id! },
      relation: { visitDiagnosis: true },
      sort: { id: 'DESC' },
    })
    visitList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: CustomerVisitsHistory.vue:33 ~ error:', error)
  }
}

const clickVisitHistory = async (basic: Visit) => {
  visit.value = await visitStore.getVisitHistoryByBasic(basic)
  vitalSigns.value = JSON.parse(visit.value.visitDiagnosis?.vitalSigns || '{}')
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('CUSTOMER_INVOICE_HISTORY_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

watch(
  () => props.customer.id,
  async (newValue) => {
    if (newValue) await startFetchData()
    else visitList.value = []
  },
  { immediate: true }
)
</script>

<template>
  <div class="flex flex-wrap mt-4">
    <div class="grow w-full lg:w-[200px]">
      <div class="text-center py-2 visit-title-header">Lịch sử khám</div>
      <div class="w-full" style="border: 1px solid #eee">
        <div
          v-for="visitItem in visitList"
          :key="visitItem.id"
          class="visit-title py-2 px-2"
          :class="visit.id === visitItem.id ? 'active' : ''"
          @click="clickVisitHistory(visitItem)"
        >
          {{ timeToText(visitItem.registeredAt, 'DD/MM/YY') }} -
          {{ visitItem.visitDiagnosis?.diagnosis }}
        </div>
      </div>
      <div class="mt-4 mb-2 flex justify-center">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          :total="total"
          simple
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
        />
      </div>
    </div>
    <div class="grow basis-[90%] lg:basis-[70%]">
      <div v-if="!visit.id" class="px-4 py-2 text-center">
        Chưa chọn phiếu khám
      </div>
      <div v-else class="px-4 py-2">
        <div class="flex flex-wrap items-start gap-4">
          <div style="flex-grow: 1">
            <div>
              <span class="mr-4" style="font-weight: 500">1. Lý do khám:</span>
              {{ visit.visitDiagnosis?.reason }}
            </div>
            <div class="mt-4" style="font-weight: 500">2. Tiền sử:</div>
            <div class="mt-2 ml-4" v-html="visit.visitDiagnosis?.healthHistory"></div>
            <!-- <div class="mt-4" style="font-weight: 500">3. Chỉ số sinh tồn</div>
            <div>{{ JSON.stringify(visit.visitDiagnosis?.vitalSigns) }}</div> -->
            <div class="mt-4" style="font-weight: 500">4. Tóm tắt:</div>
            <div class="mt-2 ml-4" v-html="visit.visitDiagnosis?.summary"></div>
            <div class="mt-4" style="font-weight: 500">5. Chẩn đoán:</div>
            <div class="mt-2 ml-4">
              {{ visit.visitDiagnosis?.diagnosis }}
            </div>
          </div>
          <div class="py-2 px-2" style="border: 1px solid #d1d5db">
            <table class="table-vital-signs">
              <tr>
                <td class="title-vital-signs">Mạch</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input disabled :value="vitalSigns.pulse" type="number" />
                </td>
                <td class="unit-vital-signs">l/p</td>
              </tr>
              <tr>
                <td class="title-vital-signs">Nhiệt độ</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input disabled :value="vitalSigns.temperature" type="number" />
                </td>
                <td class="unit-vital-signs">°C</td>
              </tr>
              <tr>
                <td class="title-vital-signs">Huyết áp</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input disabled :value="vitalSigns.bloodPressure" />
                </td>
                <td class="unit-vital-signs">mmHg</td>
              </tr>
              <tr>
                <td class="title-vital-signs">TS Thở</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input disabled :value="vitalSigns.respiratoryRate" type="number" />
                </td>
                <td class="unit-vital-signs">l/p</td>
              </tr>
              <tr>
                <td class="title-vital-signs">SpO2</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input disabled :value="vitalSigns.spO2" type="number" />
                </td>
                <td class="unit-vital-signs">%</td>
              </tr>
              <tr>
                <td class="title-vital-signs">Chiều cao</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input disabled :value="vitalSigns.height" type="number" />
                </td>
                <td class="unit-vital-signs">cm</td>
              </tr>
              <tr>
                <td class="title-vital-signs">Cân nặng</td>
                <td>:</td>
                <td class="input-vital-signs">
                  <input disabled :value="vitalSigns.weight" type="number" />
                </td>
                <td class="unit-vital-signs">kg</td>
              </tr>
            </table>
          </div>
        </div>
        <div class="mt-4 table-wrapper">
          <table>
            <tbody>
              <div class="mb-2" style="font-weight: 500">6. Dịch vụ:</div>
              <tr>
                <td class="text-center font-bold">Tên dịch vụ</td>
                <td class="text-center font-bold">Số lượng</td>
                <td class="text-center font-bold">Giá tiền</td>
              </tr>
              <tr v-for="visitProcedure in visit.visitProcedureList" :key="visitProcedure.id">
                <td>{{ visitProcedure.procedure?.name }}</td>
                <td class="text-center">{{ visitProcedure.quantity }}</td>
                <td class="text-right">
                  <div
                    v-if="visitProcedure.discountMoney"
                    style="
                      color: var(--text-red);
                      font-size: 0.8rem;
                      text-decoration: line-through;
                      font-style: italic;
                      white-space: nowrap;
                    "
                  >
                    {{ formatMoney(visitProcedure.expectedPrice) }}
                  </div>
                  <div>{{ formatMoney(visitProcedure.actualPrice) }}</div>
                </td>
              </tr>
              <div class="mt-4 mb-2" style="font-weight: 500">7. Đơn thuốc</div>
              <tr>
                <td class="text-center font-bold">Tên thuốc</td>
                <td class="text-center font-bold">Số lượng</td>
                <td class="text-center font-bold">Giá tiền</td>
              </tr>
              <tr v-for="visitProduct in visit.visitProductList" :key="visitProduct.id">
                <td>
                  <div>{{ visitProduct.product?.brandName }}</div>
                  <div style="font-size: 0.8rem; font-style: italic">
                    {{ visitProduct.hintUsage }}
                  </div>
                </td>
                <td class="text-center">{{ visitProduct.quantity }}</td>
                <td class="text-right">
                  <div
                    v-if="visitProduct.discountMoney"
                    style="
                      color: var(--text-red);
                      font-size: 0.8rem;
                      text-decoration: line-through;
                      font-style: italic;
                      white-space: nowrap;
                    "
                  >
                    {{ formatMoney(visitProduct.expectedPrice) }}
                  </div>
                  <div>{{ formatMoney(visitProduct.actualPrice) }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-4" style="font-weight: 500">8. Thanh toán:</div>
        <div class="mt-2 ml-4">
          <table>
            <tr>
              <td>- Tổng chi phí:</td>
              <td class="px-4">{{ formatMoney(visit.totalMoney) }}</td>
            </tr>
            <tr>
              <td>- Đã thanh toán:</td>
              <td class="px-4">{{ formatMoney(visit.paid) }}</td>
            </tr>
            <tr>
              <td>- Nợ:</td>
              <td class="px-4">{{ formatMoney(visit.debt) }}</td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  </div>
  <div class="mt-4 w-full table-wrapper"></div>
</template>

<style lang="scss" scoped>
.visit-title-header {
  background-color: #5884c4;
  color: white;
  font-weight: bold;
}
.visit-title {
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
