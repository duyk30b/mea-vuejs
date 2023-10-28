<script setup lang="ts">
import { SaveOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { message, type SelectProps } from 'ant-design-vue'
import { onBeforeMount, ref } from 'vue'
import { AddressInstance } from '../../core/address.instance'
import { useScreenStore } from '../../modules/_me/screen.store'
import { Organization, OrganizationService } from '../../modules/organization'
import { convertViToEn } from '../../utils'

const orgStore = useScreenStore()
const { isMobile } = orgStore

const provinceOptions = ref<SelectProps['options']>([])
const districtOptions = ref<SelectProps['options']>([])
const wardOptions = ref<SelectProps['options']>([])

const organization = ref<Organization>(Organization.blank())

onBeforeMount(async () => {
  organization.value = await OrganizationService.info()
  const provinceList = await AddressInstance.getAllProvinces()
  provinceOptions.value = provinceList.map((i) => ({ value: i, label: i }))
})

const handleChangeProvince = async (e: string) => {
  try {
    const districtList = await AddressInstance.getDistrictsByProvince(e)
    districtOptions.value = districtList.map((i) => ({ value: i, label: i }))
  } catch (error) {
    console.log('🚀 ~ handleChangeProvince ~ error:', error)
  }
}

const handleChangeDistrict = async (e: string) => {
  try {
    const wardList = await AddressInstance.getWardsByProvinceAndDistrict(
      organization.value.addressProvince,
      e
    )
    wardOptions.value = wardList.map((i) => ({ value: i, label: i }))
  } catch (error) {
    console.log('🚀 ~ handleChangeDistrict ~ error:', error)
  }
}

const filterOption = (input: string, option: any) => {
  const inputText = convertViToEn(input).toLowerCase()
  const optionLabel = convertViToEn(option.label).toLowerCase()
  return optionLabel.indexOf(inputText) >= 0
}

const saveOrganization = async () => {
  await OrganizationService.updateInfo(organization.value)
  message.success('Cập nhật thông tin cơ sở thành công')
}
</script>

<template>
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.2rem">
        <SettingOutlined style="margin-right: 1rem" />Thông tin cơ sở
      </div>
    </div>
  </div>
  <div class="mx-4 p-4 bg-white">
    <div style="max-width: 800px">
      <div class="flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 100px; flex: none">Tên Cơ sở</div>
        <a-input v-model:value="organization.name" class="flex-auto" />
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 100px; flex: none">Email</div>
        <a-input disabled :value="organization.email" class="flex-auto" />
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 100px; flex: none">SĐT</div>
        <a-input disabled :value="organization.phone" class="flex-auto" />
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 100px; flex: none">Địa chỉ</div>
        <div class="flex-auto flex gap-4 flex-wrap">
          <a-select
            v-model:value="organization.addressProvince"
            :options="provinceOptions"
            :filter-option="filterOption"
            show-search
            allow-clear
            style="flex: 1; flex-basis: 30%"
            placeholder="Thành Phố / Tỉnh"
            @change="handleChangeProvince"
          />
          <a-select
            v-model:value="organization.addressDistrict"
            :options="districtOptions"
            :filter-option="filterOption"
            show-search
            allow-clear
            style="flex: 1; flex-basis: 30%"
            placeholder="Quận / Huyện"
            @change="handleChangeDistrict"
          />
          <a-select
            v-model:value="organization.addressWard"
            :options="wardOptions"
            :filter-option="filterOption"
            show-search
            allow-clear
            style="flex: 1; flex-basis: 30%"
            placeholder="Phường / Xã"
          />
        </div>
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 100px; flex: none" />
        <a-input
          v-model:value="organization.addressStreet"
          style="flex: 1"
          placeholder="Số nhà / Tòa nhà / Ngõ / Đường"
        />
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
