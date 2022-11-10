
<script setup lang="ts">
import { InputDate, InputPhone } from '@/common/vue-form'
import { AddressInstance } from '@/core/address.instance'
import { Customer } from '@/modules/customer/customer.model'
import { CustomerService } from '@/modules/customer/customer.service'
import { convertViToEn } from '@/utils'
import { message, type SelectProps } from 'ant-design-vue'
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'success', value: Customer, type: 'CREATE' | 'UPDATE'): void }>()
const showModal = ref(false)
const customer = ref(Customer.blank())
const saveLoading = ref(false)

const provinceOptions = ref<SelectProps['options']>([])
const districtOptions = ref<SelectProps['options']>([])
const wardOptions = ref<SelectProps['options']>([])

const openModal = async (c?: Customer) => {
  showModal.value = true
  customer.value = c ? Customer.fromInstance(c) : Customer.blank()
  const provinceList = await AddressInstance.getAllProvinces()
  provinceOptions.value = provinceList.map((i) => ({ value: i, label: i }))
}

const refreshModal = () => {
  customer.value = Customer.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  if (!customer.value.fullNameVi) {
    return message.error('Lỗi: Tên khách hàng không được bỏ trống')
  }
  try {
    if (!customer.value.id) {
      const response = await CustomerService.createOne(customer.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await CustomerService.updateOne(customer.value.id, customer.value)
      emit('success', response, 'UPDATE')
    }
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleChangeProvince = async (e: string) => {
  try {
    const districtList = await AddressInstance.getDistrictsByProvince(e)
    districtOptions.value = districtList.map((i) => ({ value: i, label: i }))
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:54 ~ handleChangeProvince ~ error:', error)
  }
}

const handleChangeDistrict = async (e: string) => {
  try {
    const wardList = await AddressInstance.getWardsByProvinceAndDistrict(customer.value.addressProvince, e)
    wardOptions.value = wardList.map((i) => ({ value: i, label: i }))
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:63 ~ handleChangeDistrict ~ error:', error)
  }
}

const filterOption = (input: string, option: any) => {
  const inputText = convertViToEn(input).toLowerCase()
  const optionLabel = convertViToEn(option.label).toLowerCase()
  return optionLabel.indexOf(inputText) >= 0
}

defineExpose({ openModal })
</script>

<template>
  <a-modal v-model:visible="showModal" width="900px"
    :title="customer.id ? 'Cập nhật thông tin khách hàng' : 'Tạo khách hàng mới'" :confirm-loading="saveLoading"
    :afterClose="refreshModal" @ok="handleSave">
    <div>
      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Họ Tên</div>
        <a-input v-model:value="customer.fullNameVi" class="flex-auto"></a-input>
      </div>

      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Số điện thoại</div>
        <InputPhone v-model:value="customer.phone" format="xxxx.xxx.xxx" class="flex-auto" />
      </div>

      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Ngày sinh</div>
        <div style="flex:1">
          <InputDate v-model:value="customer.birthday" format="DD/MM/YYYY" type-parser="number" class="w-full" />
        </div>
      </div>

      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Giới tính</div>
        <div style="flex:1">
          <a-radio-group v-model:value="customer.gender">
            <a-radio :value="1">Nam</a-radio>
            <a-radio :value="0">Nữ</a-radio>
          </a-radio-group>
        </div>
      </div>

      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Số CCCD</div>
        <a-input v-model:value="customer.identityCard" class="flex-auto"
          placeholder="Số căn cước công dân / Số chứng minh thư"></a-input>
      </div>

      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Địa chỉ</div>
        <div class="flex-auto flex gap-4 flex-wrap">
          <a-select v-model:value="customer.addressProvince" :options="provinceOptions" :filter-option="filterOption"
            show-search allow-clear @change="handleChangeProvince" style="flex:1; flex-basis: 30%;"
            placeholder="Thành Phố / Tỉnh">
          </a-select>
          <a-select v-model:value="customer.addressDistrict" :options="districtOptions" :filter-option="filterOption"
            show-search allow-clear @change="handleChangeDistrict" style="flex:1;  flex-basis: 30%;"
            placeholder="Quận / Huyện">
          </a-select>
          <a-select v-model:value="customer.addressWard" :options="wardOptions" :filter-option="filterOption" show-search
            allow-clear style="flex:1 ;flex-basis: 30%;" placeholder="Phường / Xã">
          </a-select>
        </div>
      </div>

      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;"></div>
        <a-input v-model:value="customer.addressStreet" style="flex:1"
          placeholder="Số nhà / Tòa nhà / Ngõ / Đường"></a-input>
      </div>

      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Người thân</div>
        <a-input v-model:value="customer.relative" style="flex:1" placeholder="Tên người thân, số điện thoại"></a-input>
      </div>

      <div class="flex items-center mt-3">
        <div class="w-[100px] flex-none">Active</div>
        <a-switch v-model:checked="customer.isActive" />
      </div>

    </div>
  </a-modal>
</template>
