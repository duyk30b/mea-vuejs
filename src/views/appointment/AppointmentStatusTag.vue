<script setup lang="ts">
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons-vue'
import { AppointmentStatus } from '../../modules/appointment'
import { IconClose } from '../../common/icon'

const props = defineProps<{ appointmentStatus: AppointmentStatus }>()
</script>

<template>
  <a-tag v-if="appointmentStatus === AppointmentStatus.Waiting" color="warning">
    <template #icon><ClockCircleOutlined /></template>
    Chờ xác nhận
  </a-tag>
  <a-tag v-if="appointmentStatus === AppointmentStatus.Confirm" color="processing">
    <template #icon><ExclamationCircleOutlined /></template>
    Đã xác nhận
  </a-tag>
  <a-tag v-if="appointmentStatus === AppointmentStatus.Completed" color="success">
    <template #icon>
      <CheckCircleOutlined />
    </template>
    Hoàn thành (Đã đến khám)
  </a-tag>
  <a-tag v-if="appointmentStatus === AppointmentStatus.Cancelled" color="default">
    <template #icon>
      <CloseCircleOutlined />
    </template>
    Hủy hẹn
  </a-tag>
</template>

<style lang="scss" scoped></style>
