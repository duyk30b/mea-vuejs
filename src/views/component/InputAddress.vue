<script lang="ts" setup>
import { InputOptions } from '@/common/vue-form'
import { Address, AddressService } from '@/modules/address'
import { onMounted, ref, watch } from 'vue'

const inputOptionsAddress = ref<InstanceType<typeof InputOptions>>()

const emit = defineEmits<{
  (e: 'update:province', value: string): void
  (e: 'update:ward', value: string): void
}>()

const props = withDefaults(
  defineProps<{
    province: string | null | undefined
    ward: string | null | undefined
    disabled?: boolean
  }>(),
  {
    province: '',
    ward: '',
    disabled: false,
  },
)

let currentText = ''
const addressOptions = ref<{ value: number; text: string; data: Address }[]>([])

watch(
  () => [props.ward, props.province].filter((i) => !!i).join(' - '),
  (newValue: string) => {
    if (currentText !== newValue) {
      currentText = newValue
      inputOptionsAddress.value?.setItem({ text: newValue, value: 0 })
    }
  },
  { immediate: true },
)

const searchingAddress = async (text: string) => {
  if (!text) {
    addressOptions.value = []
  } else {
    const addressList = await AddressService.search(text, { limit: 20 })
    addressOptions.value = (addressList || []).map((i) => {
      return { value: i.id, text: `${i.ward} - ${i.province}`, data: i }
    })
  }
}

const selectAddress = async (addressData?: Address) => {
  if (addressData) {
    emit('update:province', addressData.province)
    emit('update:ward', addressData.ward)
  }
}

onMounted(async () => {
  await AddressService.fetchAll()
})
</script>
<template>
  <InputOptions
    ref="inputOptionsAddress"
    :max-height="180"
    :options="addressOptions"
    @selectItem="({ data }) => selectAddress(data)"
    @searching="searchingAddress"
    noClearTextWhenNotSelected
    :disabled="disabled"
  />
</template>

<style lang="scss" scoped></style>
