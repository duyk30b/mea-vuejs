<script setup lang="ts">
import VueTag from '@/common/VueTag.vue'
import { AppointmentStatus } from '@/modules/appointment'

const props = defineProps<{ appointmentStatus: AppointmentStatus }>()
</script>

<template>
  <VueTag v-if="appointmentStatus === AppointmentStatus.Waiting" color="orange" icon="clock">
    Chờ xác nhận
  </VueTag>
  <VueTag v-if="appointmentStatus === AppointmentStatus.Confirm" color="blue" icon="exclamation">
    Đã xác nhận
  </VueTag>
  <VueTag v-if="appointmentStatus === AppointmentStatus.Completed" color="green" icon="check">
    Đã đến khám
  </VueTag>
  <VueTag v-if="appointmentStatus === AppointmentStatus.Cancelled" color="default" icon="close">
    Hủy hẹn
  </VueTag>
</template>

<style lang="scss" scoped></style>
