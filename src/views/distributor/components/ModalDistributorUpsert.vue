
<script setup lang="ts">
import { InputPhone } from '@/common/vue-form'
import { AddressInstance } from '@/core/address.instance'
import { Distributor } from '@/modules/distributor/distributor.model'
import { DistributorService } from '@/modules/distributor/distributor.service'
import { convertViToEn } from '@/utils'
import { message, type SelectProps } from 'ant-design-vue'
import { ref } from 'vue'

const emit = defineEmits(['success'])
const showModal = ref(false)
const distributor = ref(Distributor.blank())
const saveLoading = ref(false)

const provinceOptions = ref<SelectProps['options']>([])
const districtOptions = ref<SelectProps['options']>([])
const wardOptions = ref<SelectProps['options']>([])

const openModal = async (d?: Distributor) => {
  showModal.value = true
  distributor.value = d ? Distributor.fromInstance(d) : Distributor.blank()
  const provinceList = await AddressInstance.getAllProvinces()
  provinceOptions.value = provinceList.map((i) => ({ value: i, label: i }))
}

const refreshModal = () => {
  distributor.value = Distributor.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  if (!distributor.value.fullNameVi) {
    return message.error('Lỗi: Tên khách hàng không được bỏ trống')
  }
  try {
    if (!distributor.value.id) {
      const response = await DistributorService.createOne(distributor.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await DistributorService.updateOne(distributor.value.id, distributor.value)
      emit('success', response, 'UPDATE')
    }
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalDistributorUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleChangeProvince = async (e: string) => {
  try {
    const districtList = await AddressInstance.getDistrictsByProvince(e)
    districtOptions.value = districtList.map((i) => ({ value: i, label: i }))
  } catch (error) {
    console.log('🚀 ~ file: ModalDistributorUpsert.vue:54 ~ handleChangeProvince ~ error:', error)
  }
}

const handleChangeDistrict = async (e: string) => {
  try {
    const wardList = await AddressInstance.getWardsByProvinceAndDistrict(distributor.value.addressProvince, e)
    wardOptions.value = wardList.map((i) => ({ value: i, label: i }))
  } catch (error) {
    console.log('🚀 ~ file: ModalDistributorUpsert.vue:63 ~ handleChangeDistrict ~ error:', error)
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
    :title="distributor.id ? 'Cập nhật thông tin nhà cung cấp' : 'Tạo nhà cung cấp Mới'" :confirm-loading="saveLoading"
    :afterClose="refreshModal" @ok="handleSave">
    <div>
      <div class="flex items-center mb-3">
        <div class="w-[100px] flex-none">Tên NCC</div>
        <a-input v-model:value="distributor.fullNameVi" class="flex-auto"></a-input>
      </div>
      <div class="flex items-center mb-3">
        <div class="w-[100px] flex-none">Số điện thoại</div>
        <InputPhone v-model:value="distributor.phone" format="xxxx.xxx.xxx" class="flex-auto" />
      </div>

      <div class="flex items-start mb-3">
        <div class="w-[100px] flex-none">Địa chỉ</div>
        <div class="flex-auto flex gap-4 flex-wrap">
          <a-select v-model:value="distributor.addressProvince" :options="provinceOptions" :filter-option="filterOption"
            show-search allow-clear @change="handleChangeProvince" style="flex:1; flex-basis: 30%;"
            placeholder="Thành Phố / Tỉnh">
          </a-select>
          <a-select v-model:value="distributor.addressDistrict" :options="districtOptions" :filter-option="filterOption"
            show-search allow-clear @change="handleChangeDistrict" style="flex:1;  flex-basis: 30%;"
            placeholder="Quận / Huyện">
          </a-select>
          <a-select v-model:value="distributor.addressWard" :options="wardOptions" :filter-option="filterOption"
            show-search allow-clear style="flex:1 ;flex-basis: 30%;" placeholder="Phường / Xã">
          </a-select>
          <a-input v-model:value="distributor.addressStreet" style="flex:1 ;flex-basis: 100%;"
            placeholder="Số nhà / Đường"></a-input>
        </div>
      </div>

      <div class="flex items-center mt-3">
        <div class="w-[100px] flex-none">Active</div>
        <a-switch v-model:checked="distributor.isActive" />
      </div>
    </div>
  </a-modal>
</template>
