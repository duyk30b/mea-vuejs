<script setup lang="ts">
import { CheckCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons-vue'
import { Receipt, ReceiptStatus } from '../../modules/receipt'

const props = withDefaults(defineProps<{ receipt?: Receipt | undefined }>(), { receipt: undefined })
</script>

<template>
  <a-tag v-if="!receipt" color="default">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Bị xóa
  </a-tag>
  <a-tag v-else-if="receipt.status === ReceiptStatus.Draft" color="warning">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Nháp
  </a-tag>
  <a-tag v-else-if="receipt.status === ReceiptStatus.Prepayment" color="processing">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Tạm ứng
  </a-tag>
  <a-tag v-else-if="receipt.status === ReceiptStatus.Debt" color="error">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Nợ
  </a-tag>
  <a-tag v-else-if="receipt.status === ReceiptStatus.Success" color="success">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    Hoàn thành
  </a-tag>

  <a-tag v-else-if="receipt.status === ReceiptStatus.Cancelled" color="default">
    <template #icon>
      <StopOutlined />
    </template>
    Hủy
  </a-tag>
</template>
