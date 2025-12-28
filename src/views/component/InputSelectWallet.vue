<script lang="ts" setup>
import { InputSelect, type InputSelectOption } from '@/common/vue-form'
import { Wallet, WalletService, WalletType } from '@/modules/wallet'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'selectWallet', value: Wallet | undefined): void
  (e: 'update:walletId', value: string): void
}>()

const props = withDefaults(
  defineProps<{
    walletId: string
    disabled?: boolean
    required?: boolean
    autoSelectFirstValue?: boolean
    optionNull?: boolean
  }>(),
  {
    walletId: '',
    disabled: false,
    required: false,
    autoSelectFirstValue: false,
    optionNull: false,
  },
)

const walletOptions = ref<InputSelectOption<Wallet>[]>([])

const handleUpdateValue = (walletId: any) => {
  emit('update:walletId', walletId || '')
}

const handleSelectItem = (item?: Wallet) => {
  emit('selectWallet', item)
}

onMounted(async () => {
  const walletAll = await WalletService.list({ sort: { code: 'ASC' } })
  walletOptions.value = walletAll.map((i) => {
    return { value: i.id, label: i.name, data: i }
  })
  if (props.optionNull) {
    walletOptions.value.unshift({
      value: '',
      label: '.',
      data: Wallet.init(),
    })
  }

  if (props.walletId == '' && props.autoSelectFirstValue && walletAll.length) {
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
