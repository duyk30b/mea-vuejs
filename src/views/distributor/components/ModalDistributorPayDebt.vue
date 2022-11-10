
<script setup lang="ts">
import { Distributor, DistributorDebt, DistributorDebtService } from '@/modules/distributor'
import { formatNumber } from '@/utils'
import { message } from 'ant-design-vue'
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'success',
    value: { distributor: Distributor, distributorDebt: DistributorDebt }
  ): void
}>()

const distributorDebt = ref<DistributorDebt>(new DistributorDebt())

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (distributorId: number, openDebtProp: number) => {
  const instance = new DistributorDebt()
  instance.distributorId = distributorId
  instance.openDebt = openDebtProp
  instance.money = openDebtProp

  distributorDebt.value = instance
  showModal.value = true
}

const refreshModal = () => {
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (distributorDebt.value.money === 0) {
      return message.error('Số tiền trả nợ phải khác 0')
    }
    const data = await DistributorDebtService.payment(distributorDebt.value)
    emit('success', data)
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalDistributorUpsert.vue:30 ~ handleSave ~ error:', error)
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
        <div class="w-full font-bold pl-3">{{ formatNumber(distributorDebt.openDebt) }}</div>
      </div>
      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Số tiền trả:</div>
        <a-input-group compact class="w-full">
          <a-input-number v-model:value="distributorDebt.money" step="1000" style="width: calc(100% - 80px)"
            :formatter="(value: any) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
            :parser="(value: any) => value.replace(/(,*)/g, '')" />
          <a-button type="primary" @click="distributorDebt.money = distributorDebt.openDebt">Tất cả</a-button>
        </a-input-group>
      </div>
      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Nợ cuối kỳ:</div>
        <div class="w-full font-bold pl-3">{{ formatNumber(distributorDebt.openDebt - distributorDebt.money) }}</div>
      </div>
      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Ghi chú:</div>
        <a-input v-model:value="distributorDebt.note" />
      </div>
    </div>
  </a-modal>
</template>
