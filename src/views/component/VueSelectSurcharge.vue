<script lang="ts" setup>
import { VueSelect } from '@/common/vue-form'
import { SurchargeService, type Surcharge } from '@/modules/surcharge'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'selectSurcharge', value: Surcharge | undefined): void
  (e: 'update:surchargeId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    surchargeId: number
    disabled?: boolean
    required?: boolean
  }>(),
  {
    surchargeId: 0,
    disabled: false,
    required: false,
  },
)

const surchargeOptions = ref<{ value: number; text: string; data: Surcharge }[]>([])

onMounted(async () => {
  const surchargeAll = await SurchargeService.list({})
  surchargeOptions.value = surchargeAll.map((i) => ({ value: i.id, text: i.name, data: i }))
})

const handleUpdateValue = (surchargeId: any) => {
  emit('update:surchargeId', surchargeId || 0)
}

const handleSelectItem = (item?: Surcharge) => {
  emit('selectSurcharge', item)
}
</script>
<template>
  <VueSelect
    :value="surchargeId"
    :options="surchargeOptions"
    :required="required"
    @update:value="handleUpdateValue"
    @selectItem="({ data }) => handleSelectItem(data)"
  />
</template>

<style lang="scss" scoped></style>
