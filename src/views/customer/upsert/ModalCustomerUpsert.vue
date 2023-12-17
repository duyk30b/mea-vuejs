<script setup lang="ts">
import VueModal from '@/common/VueModal.vue'
import { InputDate, InputText } from '@/common/vue-form'
import { AddressInstance } from '@/core/address.instance'
import { useCustomerStore } from '@/modules/customer'
import { Customer } from '@/modules/customer/customer.model'
import { CustomerService } from '@/modules/customer/customer.service'
import { useOrganizationStore } from '@/store/organization.store'
import { convertViToEn } from '@/utils'
import { CloseOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { message, type SelectProps } from 'ant-design-vue'
import { ref } from 'vue'
import ModalCustomerUpsertSettingScreen from './ModalCustomerUpsertSettingScreen.vue'

const modalCustomerUpsertSettingScreen =
  ref<InstanceType<typeof ModalCustomerUpsertSettingScreen>>()

const emit = defineEmits<{ (e: 'success', value: Customer, type: 'CREATE' | 'UPDATE'): void }>()

const customerStore = useCustomerStore()
const organizationStore = useOrganizationStore()
const { isMobile } = organizationStore

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

const handleClose = () => {
  customer.value = Customer.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  if (!customer.value.fullName) {
    return message.error('Lỗi: Tên khách hàng không được bỏ trống')
  }
  try {
    if (!customer.value.id) {
      const response = await CustomerService.createOne(customer.value)
      customerStore.createOne(response)
      emit('success', response, 'CREATE')
    } else {
      const response = await CustomerService.updateOne(customer.value.id, customer.value)
      customerStore.updateOne(response.id, response)
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
    const wardList = await AddressInstance.getWardsByProvinceAndDistrict(
      customer.value.addressProvince,
      e
    )
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
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ customer.id ? 'Cập nhật thông tin khách hàng' : 'Tạo khách hàng mới' }}
        </div>
        <div
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalCustomerUpsertSettingScreen?.openModal()"
        >
          <SettingOutlined />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="handleClose">
          <CloseOutlined />
        </div>
      </div>

      <div class="px-6 mt-4">
        <div class="flex" :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div style="width: 100px; flex: none">Họ Tên</div>
          <div class="flex-auto">
            <InputText v-model:value="customer.fullName" required />
          </div>
        </div>

        <div
          v-if="organizationStore.SCREEN_CUSTOMER_UPSERT.phone"
          class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'"
        >
          <div style="width: 100px; flex: none">Số điện thoại</div>
          <div class="flex-auto">
            <InputText
              v-model:value="customer.phone"
              pattern="[0][356789][0-9]{8}"
              title="Định dạng số điện thoại không đúng"
            />
          </div>
        </div>

        <div
          v-if="organizationStore.SCREEN_CUSTOMER_UPSERT.birthday"
          class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'"
        >
          <div style="width: 100px; flex: none">Ngày sinh</div>
          <div style="flex: 1">
            <InputDate
              v-model:value="customer.birthday"
              format="DD/MM/YYYY"
              type-parser="number"
              class="w-full"
            />
          </div>
        </div>

        <div v-if="organizationStore.SCREEN_CUSTOMER_UPSERT.gender" class="mt-3 flex items-center">
          <div style="width: 100px; flex: none">Giới tính</div>
          <div style="flex: 1">
            <a-radio-group v-model:value="customer.gender">
              <a-radio :value="1"> Nam </a-radio>
              <a-radio :value="0"> Nữ </a-radio>
            </a-radio-group>
          </div>
        </div>

        <div
          v-if="organizationStore.SCREEN_CUSTOMER_UPSERT.identityCard"
          class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'"
        >
          <div style="width: 100px; flex: none">Số CCCD</div>
          <div class="flex-auto">
            <InputText v-model:value="customer.identityCard" placeholder="Số căn cước" />
          </div>
        </div>

        <div
          v-if="organizationStore.SCREEN_CUSTOMER_UPSERT.address"
          class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'"
        >
          <div style="width: 100px; flex: none">Địa chỉ</div>
          <div class="flex-auto flex gap-4 flex-wrap">
            <a-select
              v-model:value="customer.addressProvince"
              :options="provinceOptions"
              :filter-option="filterOption"
              show-search
              allow-clear
              style="flex: 1; flex-basis: 30%"
              placeholder="Thành Phố / Tỉnh"
              @change="handleChangeProvince"
            />
            <a-select
              v-model:value="customer.addressDistrict"
              :options="districtOptions"
              :filter-option="filterOption"
              show-search
              allow-clear
              style="flex: 1; flex-basis: 30%"
              placeholder="Quận / Huyện"
              @change="handleChangeDistrict"
            />
            <a-select
              v-model:value="customer.addressWard"
              :options="wardOptions"
              :filter-option="filterOption"
              show-search
              allow-clear
              style="flex: 1; flex-basis: 30%"
              placeholder="Phường / Xã"
            />
          </div>
        </div>

        <div
          v-if="organizationStore.SCREEN_CUSTOMER_UPSERT.address"
          class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'"
        >
          <div style="width: 100px; flex: none"></div>
          <div style="flex: 1">
            <InputText
              v-model:value="customer.addressStreet"
              placeholder="Số nhà / Tòa nhà / Ngõ / Đường"
            />
          </div>
        </div>

        <div
          v-if="organizationStore.SCREEN_CUSTOMER_UPSERT.relative"
          class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'"
        >
          <div style="width: 100px; flex: none">Người thân</div>
          <div style="flex: 1">
            <InputText
              v-model:value="customer.relative"
              placeholder="Tên người thân, số điện thoại"
            />
          </div>
        </div>

        <div class="flex items-center mt-3">
          <div class="w-[100px] flex-none">Active</div>
          <a-switch
            :checked="Boolean(customer.isActive)"
            @change="(checked: Boolean) => (customer.isActive = checked ? 1 : 0)"
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
  <ModalCustomerUpsertSettingScreen ref="modalCustomerUpsertSettingScreen" />
</template>
