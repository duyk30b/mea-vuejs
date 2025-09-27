<script lang="ts" setup>
import { IconFileSearch } from '@/common/icon-antd'
import { InputSearch } from '@/common/vue-form'
import type { ItemOption } from '@/common/vue-form/InputSearch.vue'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Customer, CustomerService } from '@/modules/customer'
import { PermissionId } from '@/modules/permission/permission.enum'
import { ESString, ESTimer } from '@/utils'
import { onMounted, ref, watch } from 'vue'
import ModalCustomerDetail from '../customer/detail/ModalCustomerDetail.vue'
import ModalCustomerUpsert from '../customer/upsert/ModalCustomerUpsert.vue'

const emit = defineEmits<{
  (e: 'selectCustomer', item: Customer | undefined): void
  (e: 'update:customerId', customerId: number): void
  (e: 'update:customer', value: Customer): void
  (e: 'update:text', text: string): void
}>()

const props = withDefaults(
  defineProps<{
    customerId: number
    customer?: Customer
    text?: string
    editCustomer?: boolean
    disabled?: boolean
    required?: boolean
    clearTextIfNoSelect?: boolean
  }>(),
  {
    customerId: 0,
    text: '',
    customer: () => Customer.blank(),
    disabled: false,
    required: false,
    clearTextIfNoSelect: true,
    editCustomer: true,
  },
)

const inputOptionsCustomer = ref<InstanceType<typeof InputSearch>>()
const modalCustomerDetail = ref<InstanceType<typeof ModalCustomerDetail>>()
const modalCustomerUpsert = ref<InstanceType<typeof ModalCustomerUpsert>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const customerOptions = ref<{ value: number; text: string; data: Customer }[]>([])
const customerCurrent = ref(Customer.blank())

onMounted(async () => {
  const customerAll = await CustomerService.list({ filter: { isActive: 1 } })
  customerOptions.value = customerAll.map((i) => ({ value: i.id, text: i.fullName, data: i }))
})

watch(
  () => props.customer,
  (newValue) => {
    customerCurrent.value = Customer.from(newValue)
    customerOptions.value = [{ value: newValue.id, text: newValue.fullName, data: newValue }]
  },
  { immediate: true },
)

const handleUpdateValue = (v: any) => {
  emit('update:customerId', v)
}

const handleUpdateText = (v: string) => {
  emit('update:text', v)
}

const handleUpsertCustomer = (customerData?: Customer) => {
  if (customerData) {
    customerOptions.value = [
      { value: customerData.id, text: customerData.fullName, data: customerData },
    ]
  }
}

const handleSelectItem = (item?: ItemOption<Customer>) => {
  customerCurrent.value = Customer.from(item?.data)
  emit('selectCustomer', item?.data)
}

const logicFilter = (item: ItemOption<Customer>, text: string) => {
  const customerItem = item.data as Customer
  if (!customerItem.isActive) return false
  return (
    ESString.customFilter(customerItem.fullName, text) ||
    ESString.customFilter(customerItem.phone, text) ||
    ESString.customFilter(customerItem.customerCode, text)
  )
}
</script>
<template>
  <ModalCustomerDetail ref="modalCustomerDetail" />
  <ModalCustomerUpsert
    v-if="editCustomer"
    ref="modalCustomerUpsert"
    @success="handleUpsertCustomer"
  />

  <div class="flex flex-wrap items-center gap-1">
    <span>Khách hàng</span>
    <span v-if="CONFIG.MODE === 'development'" style="color: violet">
      ({{ customerCurrent.id }})
    </span>
    <template v-if="customerId">
      <a @click="modalCustomerDetail?.openModal(customerId)">
        <IconFileSearch />
      </a>
      <span v-if="customerCurrent!.debt > 0">
        - Nợ:
        <b style="color: var(--text-red)">{{ formatMoney(customerCurrent!.debt) }}</b>
      </span>
      <span v-if="customerCurrent!.debt < 0">
        - Ví:
        <b style="color: var(--text-green)">{{ formatMoney(-customerCurrent!.debt) }}</b>
      </span>
      <a
        v-if="editCustomer && userPermission[PermissionId.CUSTOMER_UPDATE]"
        @click="modalCustomerUpsert?.openModal(customerCurrent!)"
      >
        - Sửa thông tin KH
      </a>
    </template>
  </div>
  <div>
    <InputSearch
      ref="inputOptionsCustomer"
      :value="customerId"
      :disabled="disabled"
      :maxHeight="320"
      :options="customerOptions"
      placeholder="Tìm kiếm bằng mã, tên khách hàng"
      :required="required"
      @update:value="(v) => handleUpdateValue(v)"
      @selectItem="(item) => handleSelectItem(item)"
      @update:text="handleUpdateText"
      :logicFilter="logicFilter"
      :clearTextIfNoSelect="clearTextIfNoSelect"
    >
      <template #option="{ item: { data } }">
        <div>
          <b>{{ data.fullName }}</b>
          - {{ data.phone }} -
          {{ ESTimer.timeToText(data.birthday, 'DD/MM/YYYY') }}
        </div>
        <div>{{ ESString.formatAddress(data) }}</div>
      </template>
    </InputSearch>
  </div>
</template>

<style lang="scss" scoped></style>
