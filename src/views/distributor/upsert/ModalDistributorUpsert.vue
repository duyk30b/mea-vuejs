<script setup lang="ts">
import VueModal from '@/common/VueModal.vue'
import { InputPhone } from '@/common/vue-form'
import { AddressInstance } from '@/core/address.instance'
import { useDistributorStore } from '@/modules/distributor'
import { Distributor } from '@/modules/distributor/distributor.model'
import { DistributorService } from '@/modules/distributor/distributor.service'
import { useOrganizationStore } from '@/store/organization.store'
import { convertViToEn } from '@/utils'
import {
  CloseOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { message, type SelectProps } from 'ant-design-vue'
import { ref } from 'vue'
import ModalDistributorUpsertSettingScreen from './ModalDistributorUpsertSettingScreen.vue'

const modalDistributorUpsertSettingScreen = ref<InstanceType<typeof ModalDistributorUpsertSettingScreen>>()

const emit = defineEmits(['success'])

const distributorStore = useDistributorStore()
const organizationStore = useOrganizationStore()
const { isMobile } = organizationStore

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

const handleClose = () => {
  distributor.value = Distributor.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  if (!distributor.value.fullName) {
    return message.error('Lỗi: Tên khách hàng không được bỏ trống')
  }
  try {
    if (!distributor.value.id) {
      const response = await DistributorService.createOne(distributor.value)
      distributorStore.createOne(response)
      emit('success', response, 'CREATE')
    } else {
      const response = await DistributorService.updateOne(distributor.value.id, distributor.value)
      distributorStore.updateOne(response.id, response)
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
  <VueModal v-model:show="showModal">
    <div class="bg-white">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede;">
        <div class="flex-1 text-lg font-medium">
          {{ distributor.id ? 'Cập nhật thông tin NCC' : 'Tạo NCC mới' }}
        </div>
        <div style="font-size: 1.2rem;" class="px-4 cursor-pointer"
          @click="modalDistributorUpsertSettingScreen?.openModal()">
          <SettingOutlined />
        </div>
        <div style="font-size: 1.2rem;" class="px-4 cursor-pointer" @click="handleClose">
          <CloseOutlined />
        </div>
      </div>

      <div class="px-6 mt-4">
        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
          <div class="w-[100px] flex-none">Tên NCC</div>
          <a-input v-model:value="distributor.fullName" class="flex-auto"></a-input>
        </div>
        <div v-if="organizationStore.SCREEN_DISTRIBUTOR_UPSERT.phone" class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
          <div class="w-[100px] flex-none">Số điện thoại</div>
          <InputPhone v-model:value="distributor.phone" format="xxxx.xxx.xxx" class="flex-auto" />
        </div>

        <div v-if="organizationStore.SCREEN_DISTRIBUTOR_UPSERT.address" class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
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

      <div class="p-4">
        <div class="flex justify-end gap-4">
          <a-button @click="handleClose">
            <template #icon>
              <CloseOutlined />
            </template>
            Hủy bỏ
          </a-button>
          <a-button type="primary" @click="handleSave">
            <template #icon>
              <SaveOutlined />
            </template>
            Lưu lại
          </a-button>
        </div>
      </div>
    </div>
  </VueModal>
  <ModalDistributorUpsertSettingScreen ref="modalDistributorUpsertSettingScreen" />
</template>
