<script setup lang="ts">
import { ReceiptStatus } from '../../modules/receipt'
import { CheckCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons-vue'

const props = withDefaults(defineProps<{ status: ReceiptStatus }>(), {
  status: ReceiptStatus.Draft,
})
</script>

<template>
  <a-tag v-if="status === ReceiptStatus.Draft" color="warning">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Nháp
  </a-tag>
  <a-tag v-if="status === ReceiptStatus.Prepayment" color="processing">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Tạm ứng
  </a-tag>
  <a-tag v-if="status === ReceiptStatus.Debt" color="error">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Nợ
  </a-tag>
  <a-tag v-if="status === ReceiptStatus.Success" color="success">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    Hoàn thành
  </a-tag>

  <a-tag v-if="status === ReceiptStatus.Refund" color="default">
    <template #icon>
      <StopOutlined />
    </template>
    Hoàn trả
  </a-tag>
</template>
