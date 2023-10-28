<script setup lang="ts">
import { CheckCircleOutlined } from '@ant-design/icons-vue'
import { PaymentType } from '../../modules/enum'

defineProps<{ type: PaymentType }>()
</script>

<template>
  <a-tag v-if="type === PaymentType.Prepayment" color="processing">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    T.Toán trước
  </a-tag>
  <a-tag v-if="type === PaymentType.PayDebt" color="cyan">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    Trả nợ
  </a-tag>
  <a-tag v-if="type === PaymentType.ImmediatePayment" color="success">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    Gửi hàng
  </a-tag>

  <a-tag v-if="type === PaymentType.ReceiveRefund" color="warning">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    Hoàn trả
  </a-tag>
</template>
