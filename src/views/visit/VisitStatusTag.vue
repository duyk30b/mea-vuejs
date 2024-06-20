<script setup lang="ts">
import {
  CheckCircleOutlined,
  CustomerServiceOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons-vue'
import { Visit, VisitStatus } from '../../modules/visit'

const props = withDefaults(defineProps<{ visitStatus: VisitStatus }>(), {
  visitStatus: VisitStatus.Waiting,
})
</script>

<template>
  <a-tag v-if="visitStatus === VisitStatus.Scheduled" color="cyan">
    <template #icon>
      <CustomerServiceOutlined />
    </template>
    Hẹn khám
  </a-tag>
  <a-tag v-if="visitStatus === VisitStatus.Waiting" color="warning">
    <template #icon>
      <ClockCircleOutlined />
    </template>
    Chờ khám
  </a-tag>
  <a-tag v-if="visitStatus === VisitStatus.InProgress" color="processing">
    <template #icon>
      <CustomerServiceOutlined />
    </template>
    Đang khám
  </a-tag>
  <a-tag v-if="visitStatus === VisitStatus.Debt" color="error">
    <template #icon>
      <CustomerServiceOutlined />
    </template>
    Nợ
  </a-tag>
  <a-tag v-if="visitStatus === VisitStatus.Completed" color="success">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    Hoàn thành
  </a-tag>
</template>

<style lang="scss" scoped></style>
