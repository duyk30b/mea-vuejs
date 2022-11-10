<script setup lang="ts">
import { Procedure } from '@/modules/procedure'
import { useOrganizationStore } from '@/store/organization.store'
import { formatNumber, timeToText } from '@/utils'

const props = withDefaults(
  defineProps<{ procedure: Procedure }>(),
  { procedure: () => Procedure.blank() }
)

const organizationStore = useOrganizationStore()
</script>

<template>
  <div>
    <p>
      <span class="inline-block w-40">Tên dịch vụ</span>
      <b>{{ procedure!.nameVi }}</b>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Nhóm</span>
      <span>{{ organizationStore.PROCEDURE_GROUP[procedure.group || 0] }}</span>
    </p>
    <p class="mt-2">
      <span class="inline-block w-40">Giá dịch vụ</span>
      <span>{{ formatNumber(procedure.price) }}</span>
    </p>
  </div>
</template>
