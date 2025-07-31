<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '../../common/VueButton.vue'
import { IconClose } from '../../common/icon-antd'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { InputMoney, InputSelect, InputText } from '../../common/vue-form'
import VueModal from '../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../modules/_me/setting.store'
import { Distributor, DistributorService } from '../../modules/distributor'
import { PaymentMethodService } from '../../modules/payment-method'
import { ReceiptApi, ReceiptStatus, type Receipt } from '../../modules/receipt'
import { ESTimer } from '../../utils'
import LinkAndStatusReceipt from '../receipt/LinkAndStatusReceipt.vue'
import { MeService } from '../../modules/_me/me.service'
import { PaymentApi } from '@/modules/payment'

const inputMoneyPay = ref<InstanceType<typeof InputMoney>>()

const emit = defineEmits<{
  (e: 'success', value: { distributor: Distributor }): void
}>()
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, user } = MeService

const money = ref<number>(0)
const note = ref('')
const distributor = ref<Distributor>(Distributor.blank())
const paymentMethodId = ref<number>(0)
const paymentMethodOptions = ref<{ value: any; label: string }[]>([])

const receiptPaymentList = ref<{ receipt: Receipt; money: number }[]>([])

const showModal = ref(false)
const dataLoading = ref(false)
const saveLoading = ref(false)

onMounted(async () => {
  const paymentMethodAll = await PaymentMethodService.list({ sort: { priority: 'ASC' } })
  paymentMethodOptions.value = paymentMethodAll.map((i) => ({ value: i.id, label: i.name }))
  paymentMethodId.value = paymentMethodAll[0]?.id || 0
})

const openModal = async (distributorId: number) => {
  showModal.value = true
  money.value = 0
  note.value = ''
  try {
    dataLoading.value = true
    const fetchPromise = await Promise.all([
      DistributorService.detail(distributorId),
      ReceiptApi.list({
        filter: {
          distributorId,
          status: ReceiptStatus.Debt,
        },
        sort: { id: 'ASC' },
      }),
    ])
    distributor.value = fetchPromise[0] || Distributor.blank()
    receiptPaymentList.value = fetchPromise[1].map((i) => ({ receipt: i, money: 0 }))
  } catch (error) {
    console.log('🚀 ~ ModalDistributorPayDebt.vue:62 ~ openModal ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  receiptPaymentList.value = []
  money.value = 0
  note.value = ''
  distributor.value = Distributor.blank()
  paymentMethodId.value = 0
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (money.value === 0) {
      return AlertStore.addError('Số tiền trả nợ phải khác 0')
    }

    const data = await PaymentApi.distributorPayDebt({
      body: {
        distributorId: distributor.value.id,
        paymentMethodId: paymentMethodId.value,
        paidAmount: money.value,
        note: '',
        dataList: receiptPaymentList.value
          .map((i) => ({ receiptId: i.receipt.id, paidAmount: i.money }))
          .filter((i) => i.paidAmount > 0),
      },
    })
    AlertStore.addSuccess(`Trả nợ cho NCC ${distributor.value.fullName} thành công`)
    emit('success', { distributor: data.distributorModified })
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalDistributorPayDebt.vue:104 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleClickPayAllDebt = () => {
  money.value = distributor.value.debt
  calculatorEachReceiptPayment()
}

const calculatorEachReceiptPayment = () => {
  let totalMoney = money.value
  receiptPaymentList.value.forEach((item) => {
    const number = Math.min(totalMoney, item.receipt.debt)
    item.money = number
    totalMoney = totalMoney - number
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 800px" @close="closeModal">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">
          {{ distributor.fullName + ': Trả nợ' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="flex flex-wrap justify-between">
          <span>Chọn phiếu trả nợ (tự động)</span>
          <span>
            Tổng nợ
            <strong>{{ formatMoney(distributor.debt) }}</strong>
          </span>
        </div>
        <div class="mt-2 table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Đơn</th>
                <th>Nợ</th>
                <th>Số tiền trả</th>
              </tr>
            </thead>
            <tbody v-if="dataLoading">
              <tr>
                <td colspan="100">
                  <div class="vue-skeleton-loading"></div>
                  <div class="vue-skeleton-loading mt-2"></div>
                </td>
              </tr>
              <tr>
                <td colspan="100">
                  <div class="vue-skeleton-loading"></div>
                  <div class="vue-skeleton-loading mt-2"></div>
                </td>
              </tr>
            </tbody>
            <tbody>
              <tr v-for="(receiptPayment, index) in receiptPaymentList" :key="index">
                <td>
                  <LinkAndStatusReceipt :receipt="receiptPayment.receipt" />
                  <div>
                    {{ ESTimer.timeToText(receiptPayment.receipt.startedAt, 'DD/MM/YYYY hh:mm') }}
                  </div>
                </td>
                <td class="text-right">
                  {{ formatMoney(receiptPayment.receipt.debt) }}
                </td>
                <td class="text-right">
                  {{ formatMoney(receiptPayment.money) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-wrap gap-4 mt-4">
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div>
              <div>Phương thức thanh toán</div>
              <div>
                <InputSelect v-model:value="paymentMethodId" :options="paymentMethodOptions" />
              </div>
            </div>
            <div class="mt-4">
              <div>Ghi chú</div>
              <div>
                <InputText v-model:value="note" />
              </div>
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div class="">
              <div class="flex flex-wrap justify-between">
                <span>Số tiền thanh toán</span>
              </div>
              <div>
                <div class="flex">
                  <VueButton color="blue" @click="handleClickPayAllDebt">Tất cả</VueButton>
                  <InputMoney
                    ref="inputMoneyPay"
                    v-model:value="money"
                    textAlign="right"
                    :validate="{ lte: distributor.debt, gt: 0 }"
                    required
                    @update:value="calculatorEachReceiptPayment"
                  />
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div>Số nợ còn lại</div>
              <div>
                <InputMoney :value="distributor.debt - money" disabled textAlign="right" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div class="flex justify-center gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton type="submit" icon="save" color="blue" :loading="saveLoading">
            Xác nhận trả nợ
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
