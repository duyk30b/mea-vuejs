<script setup lang="ts">
import { AddressInstance } from '@/core/address.instance'
import { Organization, OrganizationService } from '@/modules/organization'
import { useOrganizationStore } from '@/store/organization.store'
import { convertViToEn } from '@/utils'
import { SaveOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { message, type SelectProps } from 'ant-design-vue'
import { onBeforeMount, ref } from 'vue'

const orgStore = useOrganizationStore()

const provinceOptions = ref<SelectProps['options']>([])
const districtOptions = ref<SelectProps['options']>([])
const wardOptions = ref<SelectProps['options']>([])

const organization = ref<Organization>(Organization.fromInstance(orgStore.organizationInfo))

onBeforeMount(async () => {
  const provinceList = await AddressInstance.getAllProvinces()
  provinceOptions.value = provinceList.map((i) => ({ value: i, label: i }))
})

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
    const wardList = await AddressInstance.getWardsByProvinceAndDistrict(organization.value.addressProvince, e)
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

const saveOrganization = async () => {
  try {
    orgStore.organizationInfo = await OrganizationService.updateInfo(organization.value)
    message.success('Cập nhật thông tin cơ sở thành công')
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:42 ~ handleSave ~ error:', error)
  }
}

</script>

<template>
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.3rem;">
        <SettingOutlined style="margin-right: 1rem" />Thông tin cơ sở
      </div>
    </div>
  </div>
  <div class="mx-4 mt-4 p-4 bg-white">
    <div style="max-width: 800px;">
      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Tên Cơ sở</div>
        <a-input v-model:value="organization.organizationName" class="flex-auto"></a-input>
      </div>

      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Email</div>
        <a-input disabled :value="organization.email" class="flex-auto"></a-input>
      </div>

      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">SĐT</div>
        <a-input disabled :value="organization.phone" class="flex-auto"></a-input>
      </div>

      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Địa chỉ</div>
        <div class="flex-auto flex gap-4 flex-wrap">
          <a-select v-model:value="organization.addressProvince" :options="provinceOptions" :filter-option="filterOption"
            show-search allow-clear @change="handleChangeProvince" style="flex:1; flex-basis: 30%;"
            placeholder="Thành Phố / Tỉnh">
          </a-select>
          <a-select v-model:value="organization.addressDistrict" :options="districtOptions" :filter-option="filterOption"
            show-search allow-clear @change="handleChangeDistrict" style="flex:1;  flex-basis: 30%;"
            placeholder="Quận / Huyện">
          </a-select>
          <a-select v-model:value="organization.addressWard" :options="wardOptions" :filter-option="filterOption"
            show-search allow-clear style="flex:1 ;flex-basis: 30%;" placeholder="Phường / Xã">
          </a-select>
        </div>
      </div>

      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;"></div>
        <a-input v-model:value="organization.addressStreet" style="flex:1"
          placeholder="Số nhà / Tòa nhà / Ngõ / Đường"></a-input>
      </div>

      <div class="my-8 text-center">
        <a-button type="primary" @click="saveOrganization">
          <template #icon>
            <SaveOutlined />
          </template>
          Lưu lại
        </a-button>
      </div>
    </div>
  </div>
</template>
