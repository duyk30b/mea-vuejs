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
    Thanh toán trước
  </a-tag>
  <a-tag v-if="type === PaymentType.PayDebt" color="warning">
    <template #icon>
      <CheckCircleOutlined />
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
      <CheckCircleOutlined />
    </template>
    Hoàn trả
  </a-tag>
</template>
