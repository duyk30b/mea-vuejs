<script setup lang="ts">
import { ReceiptStatus } from '../../modules/receipt'
import { CheckCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons-vue'

defineProps<{ status: ReceiptStatus }>()
</script>

<template>
  <a-tag v-if="status === ReceiptStatus.Draft" color="warning">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Nháp
  </a-tag>
  <a-tag v-if="status === ReceiptStatus.AwaitingShipment" color="processing">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Chờ nhập hàng
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
