<script lang="ts" setup>
import { InputSelect, type InputSelectOption } from '@/common/vue-form'
import { PaymentMethodService, type PaymentMethod } from '@/modules/payment-method'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'selectPaymentMethod', value: PaymentMethod | undefined): void
  (e: 'update:paymentMethodId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    paymentMethodId: number
    disabled?: boolean
    required?: boolean
    autoSelectFirstValue?: boolean
  }>(),
  {
    paymentMethodId: 0,
    disabled: false,
    required: false,
    autoSelectFirstValue: false,
  },
)

const paymentMethodOptions = ref<InputSelectOption<PaymentMethod>[]>([])

const handleUpdateValue = (paymentMethodId: any) => {
  emit('update:paymentMethodId', paymentMethodId || 0)
}

const handleSelectItem = (item?: PaymentMethod) => {
  emit('selectPaymentMethod', item)
}

onMounted(async () => {
  const paymentMethodAll = await PaymentMethodService.list({})
  paymentMethodOptions.value = paymentMethodAll.map((i) => {
    return { value: i.id, label: i.name, data: i }
  })

  if (props.paymentMethodId == 0 && props.autoSelectFirstValue && paymentMethodAll.length) {
    const firstValue = paymentMethodAll[0]
    handleUpdateValue(firstValue.id)
    handleSelectItem(firstValue)
  }
})
</script>
<template>
  <InputSelect
    :value="paymentMethodId"
    :options="paymentMethodOptions"
    :required="required"
    @update:value="handleUpdateValue"
    @selectItem="(item: any) => handleSelectItem(item.data)"
  />
</template>

<style lang="scss" scoped></style>
