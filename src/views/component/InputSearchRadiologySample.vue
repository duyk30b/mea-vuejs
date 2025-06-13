<script lang="ts" setup>
import { InputOptionsValue } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputOptionsValue.vue'
import { CONFIG } from '@/config'
import { RadiologySample, RadiologySampleService } from '@/modules/radiology-sample'
import { ESString } from '@/utils'
import { computed, onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'selectRadiologySample', value: RadiologySample | undefined): void
  (e: 'update:radiologySampleId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    radiologySampleId?: number
    disabled?: boolean
    required?: boolean
    label?: string
    logicFilter?: (item: ItemOption, text: string) => boolean
  }>(),
  {
    radiologySampleId: 0,
    disabled: false,
    required: false,
    label: 'Chọn kết quả mẫu',
    logicFilter: (item: ItemOption, text: string) => {
      return ESString.customFilter(item.text, text)
    },
  },
)

const inputOptionsRadiologySample = ref<InstanceType<typeof InputOptionsValue>>()

const radiologySampleOptions = computed(() => {
  return RadiologySampleService.radiologySampleAll.value.map((i) => ({
    value: i.id,
    text: i.name,
    data: i,
  }))
})

onMounted(async () => {
  await RadiologySampleService.getAll()
})

const handleUpdateValue = (v: any) => {
  emit('update:radiologySampleId', v)
}

const handleSelectItem = (item?: ItemOption) => {
  emit('selectRadiologySample', item?.data)
}
</script>
<template>
  <div class="flex gap-1 flex-wrap">
    <span>{{ label }}</span>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">
      ({{ radiologySampleId }})
    </span>
  </div>
  <div>
    <InputOptionsValue
      ref="inputOptionsRadiologySample"
      :value="radiologySampleId"
      :disabled="disabled"
      :maxHeight="320"
      :options="radiologySampleOptions"
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
