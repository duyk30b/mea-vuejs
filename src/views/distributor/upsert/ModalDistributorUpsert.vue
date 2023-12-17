<script setup lang="ts">
import VueModal from '@/common/VueModal.vue'
import { InputText } from '@/common/vue-form'
import { AddressInstance } from '@/core/address.instance'
import { useDistributorStore } from '@/modules/distributor'
import { Distributor } from '@/modules/distributor/distributor.model'
import { DistributorService } from '@/modules/distributor/distributor.service'
import { useOrganizationStore } from '@/store/organization.store'
import { convertViToEn } from '@/utils'
import { CloseOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons-vue'
import type { SelectProps } from 'ant-design-vue'
import { ref } from 'vue'
import ModalDistributorUpsertSettingScreen from './ModalDistributorUpsertSettingScreen.vue'

const modalDistributorUpsertSettingScreen =
  ref<InstanceType<typeof ModalDistributorUpsertSettingScreen>>()

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
    const wardList = await AddressInstance.getWardsByProvinceAndDistrict(
      distributor.value.addressProvince || '',
      e
    )
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
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ distributor.id ? 'Cập nhật thông tin NCC' : 'Tạo NCC mới' }}
        </div>
        <div
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalDistributorUpsertSettingScreen?.openModal()"
        >
          <SettingOutlined />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="handleClose">
          <CloseOutlined />
        </div>
      </div>

      <div class="px-6 mt-4">
        <div class="mt-4 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
          <div class="w-[100px] flex-none">Tên NCC</div>
          <div class="flex-auto">
            <InputText v-model:value="distributor.fullName" required />
          </div>
        </div>
        <div
          v-if="organizationStore.SCREEN_DISTRIBUTOR_UPSERT.phone"
          class="mt-4 flex"
          :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'"
        >
          <div class="w-[100px] flex-none">Số điện thoại</div>
          <div class="flex-auto">
            <InputText
              v-model:value="distributor.phone"
              pattern="[0][356789][0-9]{8}"
              title="Định dạng số điện thoại không đúng"
            />
          </div>
        </div>

        <div
          v-if="organizationStore.SCREEN_DISTRIBUTOR_UPSERT.address"
          class="mt-4 flex"
          :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'"
        >
          <div class="w-[100px] flex-none">Địa chỉ</div>
          <div class="flex-auto flex gap-4 flex-wrap">
            <a-select
              v-model:value="distributor.addressProvince"
              :options="provinceOptions"
              :filter-option="filterOption"
              show-search
              allow-clear
              style="flex: 1; flex-basis: 30%"
              placeholder="Thành Phố / Tỉnh"
              @change="handleChangeProvince"
            />
            <a-select
              v-model:value="distributor.addressDistrict"
              :options="districtOptions"
              :filter-option="filterOption"
              show-search
              allow-clear
              style="flex: 1; flex-basis: 30%"
              placeholder="Quận / Huyện"
              @change="handleChangeDistrict"
            />
            <a-select
              v-model:value="distributor.addressWard"
              :options="wardOptions"
              :filter-option="filterOption"
              show-search
              allow-clear
              style="flex: 1; flex-basis: 30%"
              placeholder="Phường / Xã"
            />
            <div style="flex: 1; flex-basis: 100%">
              <InputText v-model:value="distributor.addressStreet" placeholder="Số nhà / Đường" />
            </div>
          </div>
        </div>

        <div class="flex items-center mt-4">
          <div class="w-[100px] flex-none">Active</div>
          <a-switch
            :checked="Boolean(distributor.isActive)"
            @change="(checked: Boolean) => (distributor.isActive = checked ? 1 : 0)"
          />
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
          <a-button type="primary" htmlType="submit" :loading="saveLoading">
            <template #icon>
              <SaveOutlined />
            </template>
            Lưu lại
          </a-button>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalDistributorUpsertSettingScreen ref="modalDistributorUpsertSettingScreen" />
</template>
