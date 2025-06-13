<script lang="ts" setup>
import { InputOptionsValue } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputOptionsValue.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { PrescriptionSample, PrescriptionSampleService } from '@/modules/prescription-sample'
import { ESString } from '@/utils'
import { computed, onMounted, ref, watch } from 'vue'

const emit = defineEmits<{
  (e: 'selectPrescriptionSample', value: PrescriptionSample | undefined): void
  (e: 'update:prescriptionSampleId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    prescriptionSampleId?: number
    disabled?: boolean
    required?: boolean
    label?: string
    prepend?: string
    removeLabelWrapper?: boolean
    logicFilter?: (item: ItemOption, text: string) => boolean
  }>(),
  {
    prescriptionSampleId: 0,
    disabled: false,
    required: false,
    label: 'Chọn đơn thuốc mẫu',
    removeLabelWrapper: false,
    logicFilter: (item: ItemOption, text: string) => {
      const prescriptionSampleItem = item.data as PrescriptionSample | undefined
      return (
        (prescriptionSampleItem?.userId === MeService.user.value?.id ||
          !prescriptionSampleItem?.userId) &&
        ESString.customFilter(item.text, text)
      )
    },
  },
)

const inputOptionsPrescriptionSample = ref<InstanceType<typeof InputOptionsValue>>()

const prescriptionSampleOptions = computed(() => {
  return PrescriptionSampleService.prescriptionSampleAll.value.map((i) => ({
    value: i.id,
    text: i.name,
    data: i,
  }))
})

onMounted(async () => {
  await PrescriptionSampleService.getAll()
})

const handleUpdateValue = (v: any) => {
  emit('update:prescriptionSampleId', v)
}

const handleSelectItem = (item?: ItemOption) => {
  emit('selectPrescriptionSample', item?.data)
}
</script>
<template>
  <div v-if="!removeLabelWrapper" class="flex gap-1 flex-wrap">
    <span>{{ label }}</span>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">
      ({{ prescriptionSampleId }})
    </span>
  </div>
  <div>
    <InputOptionsValue
      ref="inputOptionsPrescriptionSample"
      :value="prescriptionSampleId"
      :disabled="disabled"
      :prepend="prepend"
      :maxHeight="320"
      :options="prescriptionSampleOptions"
      placeholder="Tìm kiếm bằng tên của mẫu"
      :required="required"
      @update:value="(v) => handleUpdateValue(v)"
      @selectItem="(item) => handleSelectItem(item)"
      :logicFilter="logicFilter"
    >
      <template #option="{ item: { data } }">
        <div>
          <b>{{ data.name }}</b>
        </div>
      </template>
    </InputOptionsValue>
  </div>
</template>

<style lang="scss" scoped></style>
