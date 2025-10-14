<script lang="ts" setup>
import { InputSelect, VueSelect, type InputSelectOption } from '@/common/vue-form'
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

const surchargeOptions = ref<InputSelectOption<Surcharge>[]>([])

onMounted(async () => {
  const surchargeAll = await SurchargeService.list({})
  surchargeOptions.value = surchargeAll.map((i) => ({ value: i.id, label: i.name, data: i }))
})

const handleUpdateValue = (surchargeId: any) => {
  emit('update:surchargeId', surchargeId || 0)
}

const handleSelectItem = (item?: Surcharge) => {
  emit('selectSurcharge', item)
}
</script>
<template>
  <InputSelect
    :value="surchargeId"
    :options="surchargeOptions"
    :required="required"
    @update:value="handleUpdateValue"
    @selectItem="(item: any) => handleSelectItem(item.data)"
  />
</template>

<style lang="scss" scoped></style>
