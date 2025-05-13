<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '../../common/VueButton.vue'
import { IconClose } from '../../common/icon-antd'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { InputMoney, InputText } from '../../common/vue-form'
import VueModal from '../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../modules/_me/setting.store'
import { Distributor, DistributorService } from '../../modules/distributor'
import { ReceiptApi, ReceiptStatus, type Receipt } from '../../modules/receipt'
import { timeToText } from '../../utils'

const inputMoneyPay = ref<InstanceType<typeof InputMoney>>()

const emit = defineEmits<{
  (e: 'success', value: { distributor: Distributor }): void
}>()
const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const openDebt = ref(0)
const money = ref<number>(0)
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
  if (!isMobile) {
    nextTick(() => inputMoneyPay.value?.focus())
  }
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
  money.value = 0
  note.value = ''
  distributorId.value = 0
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (money.value === 0) {
      return AlertStore.addError('Số tiền trả nợ phải khác 0')
    }
    const data = await DistributorService.payDebt({
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
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalDistributorUpsert.vue:87 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const openBlankReceiptDetail = (receiptId: number) => {
  const route = router.resolve({
    name: 'ReceiptDetail',
    params: { id: receiptId },
  })
  window.open(route.href, '_blank')
}

const handleClickPayAllDebt = () => {
  money.value = openDebt.value
  calculatorEachReceiptPayment()
}

const calculatorEachReceiptPayment = () => {
  let totalMoney = money.value
  receiptPayments.value.forEach((item) => {
    const number = Math.min(totalMoney, item.receipt.debt)
    item.money = number
    totalMoney = totalMoney - number
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 600px">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">
          {{ 'Trả nợ' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="">Tính tiền vào đơn (tự động)</div>
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
              <tr v-for="(receiptPayment, index) in receiptPayments" :key="index">
                <td>
                  <div>
                    <a @click="openBlankReceiptDetail(receiptPayment.receipt.id)">
                      IV{{ receiptPayment.receipt.id }}
                    </a>
                  </div>
                  <div>{{ timeToText(receiptPayment.receipt.startedAt, 'DD/MM/YYYY hh:mm') }}</div>
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
        <div class="flex items-center mt-3">
          <div style="width: 100px; flex: none">Công nợ:</div>
          <div style="font-size: 16px; padding-left: 12px">{{ formatMoney(openDebt) }}</div>
        </div>
        <div class="flex items-center mt-3">
          <div style="width: 100px; flex: none">Số tiền trả:</div>
          <div class="flex-1">
            <InputMoney
              ref="inputMoneyPay"
              v-model:value="money"
              :validate="{ lte: openDebt, gt: 0 }"
              required
              @update:value="calculatorEachReceiptPayment"
            />
          </div>
          <VueButton color="blue" @click="handleClickPayAllDebt">Tất cả</VueButton>
        </div>
        <div class="flex items-center mt-3">
          <div style="width: 100px; flex: none">Ghi chú:</div>
          <InputText v-model:value="note" />
        </div>
      </div>

      <div class="p-4">
        <div class="flex justify-end gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton type="submit" icon="save" color="blue" :loading="saveLoading">
            Xác nhận trả nợ
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
