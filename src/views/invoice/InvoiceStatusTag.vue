<script setup lang="ts">
import { CheckCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons-vue'
import { InvoiceStatus } from '../../modules/invoice'

defineProps<{ status: InvoiceStatus }>()
</script>

<template>
  <a-tag v-if="status === InvoiceStatus.Draft" color="warning">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Nháp
  </a-tag>
  <a-tag v-if="status === InvoiceStatus.AwaitingShipment" color="processing">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Chờ gửi hàng
  </a-tag>
  <a-tag v-if="status === InvoiceStatus.Debt" color="error">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Nợ
  </a-tag>
  <a-tag v-if="status === InvoiceStatus.Success" color="success">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    Hoàn thành
  </a-tag>

  <a-tag v-if="status === InvoiceStatus.Refund" color="default">
    <template #icon>
      <StopOutlined />
    </template>
    Hoàn trả
  </a-tag>
</template>
