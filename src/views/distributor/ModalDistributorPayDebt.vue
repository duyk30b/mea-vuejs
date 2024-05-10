<script setup lang="ts">
import { CloseOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import VueModal from '../../common/VueModal.vue'
import { InputMoney } from '../../common/vue-form'
import { useScreenStore } from '../../modules/_me/screen.store'
import { Distributor, useDistributorStore } from '../../modules/distributor'
import { ReceiptApi, ReceiptStatus, type Receipt } from '../../modules/receipt'
import { timeToText } from '../../utils'

const inputMoneyPay = ref<InstanceType<typeof InputMoney>>()

const emit = defineEmits<{
  (e: 'success', value: { distributor: Distributor }): void
}>()
const router = useRouter()

const distributorStore = useDistributorStore()
const screenStore = useScreenStore()
const { formatMoney } = screenStore

const openDebt = ref(0)
const money = ref(0)
const note = ref('')
const distributorId = ref(0)
const receiptPayments = ref<{ receipt: Receipt; money: number }[]>([])

const showModal = ref(false)
const dataLoading = ref(false)
const saveLoading = ref(false)

const openModal = async (distributorIdProp: number, openDebtProp: number) => {
  money.value = 0
  note.value = ''
  openDebt.value = openDebtProp
  distributorId.value = distributorIdProp
  showModal.value = true

  try {
    dataLoading.value = true
    const receiptDebtList = await ReceiptApi.list({
      filter: {
        distributorId: distributorIdProp,
        status: ReceiptStatus.Debt,
      },
    })
    receiptPayments.value = receiptDebtList.map((i) => ({ receipt: i, money: 0 }))
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerPayDebt.vue:56 ~ openModal ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const closeModal = () => {
  showModal.value = false
  receiptPayments.value = []
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (money.value === 0) {
      return message.error('Số tiền trả nợ phải khác 0')
    }
    const data = await distributorStore.payDebt({
      distributorId: distributorId.value,
      note: note.value,
      receiptPayments: receiptPayments.value
        .map((i) => ({
          receiptId: i.receipt.id,
          money: i.money,
        }))
        .filter((i) => i.money > 0),
    })
    emit('success', data)
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalDistributorUpsert.vue:64 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const openBlankReceiptDetail = (receiptId: number) => {
  let route = router.resolve({
    name: 'ReceiptDetail',
    params: { id: receiptId },
  })
  window.open(route.href, '_blank')
}

const handleChangeMoney = (data: number) => {
  if (data <= openDebt.value) {
    money.value = data
  } else {
    money.value = openDebt.value
    inputMoneyPay.value?.$forceUpdate()
  }
  calculatorEachReceiptPayment()
}

const handleClickPayAllDebt = () => {
  money.value = openDebt.value
  calculatorEachReceiptPayment()
}

const calculatorEachReceiptPayment = () => {
  let totalMoney = money.value
  receiptPayments.value.forEach((item) => {
    let number = Math.min(totalMoney, item.receipt.debt)
    item.money = number
    totalMoney = totalMoney - number
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">
          Công nợ: {{ formatMoney(openDebt) }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="p-4">
        <div class="w-full flex items-center">
          <div style="width: 100px; flex: none">Số tiền trả:</div>
          <div class="flex-1">
            <InputMoney ref="inputMoneyPay" :value="money" @update:value="handleChangeMoney" />
          </div>
          <a-button type="primary" @click="handleClickPayAllDebt"> Tất cả </a-button>
        </div>
        <div class="mt-4">Trả tiền vào đơn (tự động)</div>
        <div class="mt-2">
          <table class="table-mobile">
            <thead>
              <tr>
                <th>Đơn</th>
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
              <tr v-for="(receiptPayment, index) in receiptPayments" :key="index">
                <td>
                  <div>
                    <a @click="openBlankReceiptDetail(receiptPayment.receipt.id)">
                      IV{{ receiptPayment.receipt.id }}
                    </a>
                    - Nợ
                    <span class="font-medium"> {{ formatMoney(receiptPayment.receipt.debt) }}</span>
                  </div>
                  <div>{{ timeToText(receiptPayment.receipt.startedAt, 'DD/MM/YYYY hh:mm') }}</div>
                </td>
                <td class="text-right">
                  {{ formatMoney(receiptPayment.money) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex items-center mt-3">
          <div style="width: 100px; flex: none">Ghi chú:</div>
          <a-input v-model:value="note" />
        </div>
      </div>

      <div class="p-4">
        <div class="flex justify-end gap-4">
          <a-button @click="closeModal">
            <template #icon>
              <CloseOutlined />
            </template>
            Hủy bỏ
          </a-button>
          <a-button type="primary" @click="handleSave">
            <template #icon>
              <SaveOutlined />
            </template>
            Xác nhận trả nợ
          </a-button>
        </div>
      </div>
    </div>
  </VueModal>
</template>
