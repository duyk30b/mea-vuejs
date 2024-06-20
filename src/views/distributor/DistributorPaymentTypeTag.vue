<script setup lang="ts">
import { CheckCircleOutlined } from '@ant-design/icons-vue'
import { PaymentType } from '../../modules/enum'

defineProps<{ paymentType: PaymentType }>()
</script>

<template>
  <a-tag v-if="paymentType === PaymentType.Prepayment" color="processing">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    Tạm ứng
  </a-tag>
  <a-tag v-if="paymentType === PaymentType.PayDebt" color="cyan">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    Trả nợ
  </a-tag>
  <a-tag v-if="paymentType === PaymentType.Close" color="success">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    Đóng phiếu
  </a-tag>

  <a-tag v-if="paymentType === PaymentType.ReceiveRefund" color="warning">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    Hoàn trả
  </a-tag>
</template>
