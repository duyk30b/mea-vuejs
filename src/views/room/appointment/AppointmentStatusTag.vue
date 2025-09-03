<script setup lang="ts">
import VueTag from '@/common/VueTag.vue'
import { AppointmentStatus, AppointmentStatusText } from '@/modules/appointment'

const props = defineProps<{ status: AppointmentStatus }>()
</script>

<template>
  <VueTag v-if="status === AppointmentStatus.Waiting" color="orange" icon="clock">
    {{ AppointmentStatusText[status] }}
  </VueTag>
  <VueTag v-if="status === AppointmentStatus.Confirm" color="blue" icon="exclamation">
    {{ AppointmentStatusText[status] }}
  </VueTag>
  <VueTag v-if="status === AppointmentStatus.Completed" color="green" icon="check">
    {{ AppointmentStatusText[status] }}
  </VueTag>
  <VueTag v-if="status === AppointmentStatus.Cancelled" color="default" icon="close">
    {{ AppointmentStatusText[status] }}
  </VueTag>
</template>

<style lang="scss" scoped></style>
