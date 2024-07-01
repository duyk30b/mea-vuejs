<script setup lang="ts">
import { CheckCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons-vue'
import { VisitStatus } from '../../modules/visit'

const props = withDefaults(defineProps<{ visitStatus: VisitStatus }>(), {
  visitStatus: VisitStatus.Draft,
})
</script>

<template>
  <a-tag v-if="visitStatus === VisitStatus.Draft" color="warning">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Nháp
  </a-tag>
  <a-tag v-if="visitStatus === VisitStatus.InProgress" color="processing">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Chờ thục hiện
  </a-tag>
  <a-tag v-if="visitStatus === VisitStatus.Debt" color="error">
    <template #icon>
      <ExclamationCircleOutlined />
    </template>
    Nợ
  </a-tag>
  <a-tag v-if="visitStatus === VisitStatus.Completed" color="success">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    Hoàn thành
  </a-tag>

  <a-tag v-if="visitStatus === VisitStatus.Cancel" color="default">
    <template #icon>
      <StopOutlined />
    </template>
    Hủy
  </a-tag>
</template>
