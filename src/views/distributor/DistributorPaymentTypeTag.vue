<script setup lang="ts">
import { PaymentType } from '../../modules/enum'
import { CheckCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons-vue'

defineProps<{ type: PaymentType }>()
</script>

<template>
  <a-tag v-if="type === PaymentType.Prepayment" color="processing">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Thanh toán trước
  </a-tag>
  <a-tag v-if="type === PaymentType.PayDebt" color="warning">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Trả nợ
  </a-tag>
  <a-tag v-if="type === PaymentType.ImmediatePayment" color="success">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    Thanh toán khi mua hàng
  </a-tag>

  <a-tag v-if="type === PaymentType.ReceiveRefund" color="default">
    <template #icon>
      <StopOutlined />
    </template>
    Hoàn trả
  </a-tag>
</template>
