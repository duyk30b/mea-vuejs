
<script setup lang="ts">
import { CustomerDebtService, CustomerDebt, Customer } from '@/modules/customer'
import { formatNumber, timeToText } from '@/utils'
import { message } from 'ant-design-vue'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'success',
    value: { customer: Customer, customerDebt: CustomerDebt }
  ): void
}>()

const customerDebt = ref<CustomerDebt>(new CustomerDebt())

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (cid: number, openDebtProp: number) => {
  const instance = new CustomerDebt()
  instance.customerId = cid
  instance.openDebt = openDebtProp
  instance.money = openDebtProp

  customerDebt.value = instance
  showModal.value = true
}

const refreshModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (customerDebt.value.money === 0) {
      return message.error('Số tiền trả nợ phải khác 0')
    }
    const data = await CustomerDebtService.payment(customerDebt.value)
    emit('success', data)
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:39 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}
defineExpose({ openModal })
</script>

<template>
  <a-modal v-model:visible="showModal" title="Khách hàng trả nợ" :confirm-loading="saveLoading" :afterClose="refreshModal"
    @ok="handleSave" okText="Xác nhận trả nợ">
    <div>
      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Nợ đầu kỳ:</div>
        <div class="w-full font-bold pl-3">{{ formatNumber(customerDebt.openDebt) }}</div>
      </div>
      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Số tiền trả:</div>
        <a-input-group compact class="w-full">
          <a-input-number v-model:value="customerDebt.money" step="1000" style="width: calc(100% - 80px)"
            :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
            :parser="(value: any) => value.replace(/(,*)/g, '')" />
          <a-button type="primary" @click="customerDebt.money = customerDebt.openDebt">Tất cả</a-button>
        </a-input-group>
      </div>
      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Nợ cuối kỳ:</div>
        <div class="w-full font-bold pl-3">{{ formatNumber(customerDebt.openDebt - customerDebt.money) }}</div>
      </div>
      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Ghi chú:</div>
        <a-input v-model:value="customerDebt.note" />
      </div>
    </div>
  </a-modal>
</template>
