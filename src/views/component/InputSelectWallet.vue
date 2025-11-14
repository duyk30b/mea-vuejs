<script lang="ts" setup>
import { InputSelect, type InputSelectOption } from '@/common/vue-form'
import { WalletService, type Wallet } from '@/modules/wallet'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'selectWallet', value: Wallet | undefined): void
  (e: 'update:walletId', value: number): void
}>()

const props = withDefaults(
  defineProps<{
    walletId: number
    disabled?: boolean
    required?: boolean
    autoSelectFirstValue?: boolean
  }>(),
  {
    walletId: 0,
    disabled: false,
    required: false,
    autoSelectFirstValue: false,
  },
)

const walletOptions = ref<InputSelectOption<Wallet>[]>([])

const handleUpdateValue = (walletId: any) => {
  emit('update:walletId', walletId || 0)
}

const handleSelectItem = (item?: Wallet) => {
  emit('selectWallet', item)
}

onMounted(async () => {
  const walletAll = await WalletService.list({})
  walletOptions.value = walletAll.map((i) => {
    return { value: i.id, label: i.name, data: i }
  })

  if (props.walletId == 0 && props.autoSelectFirstValue && walletAll.length) {
    const firstValue = walletAll[0]
    handleUpdateValue(firstValue.id)
    handleSelectItem(firstValue)
  }
})
</script>
<template>
  <InputSelect
    :value="walletId"
    :options="walletOptions"
    :required="required"
    @update:value="handleUpdateValue"
    @selectItem="(item: any) => handleSelectItem(item.data)"
  />
</template>

<style lang="scss" scoped></style>
