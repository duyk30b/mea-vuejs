<script setup lang="ts">
import { CloseOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { Modal, message, type SelectProps } from 'ant-design-vue'
import { createVNode, ref } from 'vue'
import VueModal from '../../common/VueModal.vue'
import { InputNumber, InputText } from '../../common/vue-form'
import { AddressInstance } from '../../core/address.instance'
import { useScreenStore } from '../../modules/_me/screen.store'
import { Organization } from '../../modules/organization'
import { PermissionApi } from '../../modules/permission/permission.api'
import type { PermissionId } from '../../modules/permission/permission.enum'
import type { Permission } from '../../modules/permission/permission.model'
import { RootOrganizationApi } from '../../modules/root-organization/root-organization.api'
import { convertViToEn } from '../../utils'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'

const emit = defineEmits<{
  (e: 'success', value: Organization, type: 'CREATE' | 'UPDATE' | 'CLEAR' | 'DELETE'): void
}>()

const screenStore = useScreenStore()
const { isMobile } = screenStore

const provinceOptions = ref<SelectProps['options']>([])
const districtOptions = ref<SelectProps['options']>([])
const wardOptions = ref<SelectProps['options']>([])

const showModal = ref(false)
const organization = ref<Organization>(Organization.blank())
const saveLoading = ref(false)

const permissionList = ref<Permission[]>([])
const permissionIds = ref<PermissionId[]>([])

let firstLoad = true

const openModal = async (instance?: Organization) => {
  showModal.value = true
  organization.value = instance ? Organization.toBasic(instance) : Organization.blank()
  permissionIds.value = JSON.parse(instance?.permissionIds || '[]')

  if (firstLoad === true) {
    const provinceList = await AddressInstance.getAllProvinces()
    provinceOptions.value = provinceList.map((i) => ({ value: i, label: i }))
    permissionList.value = await PermissionApi.list({ filter: { level: 1 } })
    firstLoad = false
  }
}

const closeModal = () => {
  organization.value = Organization.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  if (!organization.value.phone) {
    return message.error('Lỗi: Tên khách hàng không được bỏ trống')
  }
  organization.value.permissionIds = JSON.stringify([...permissionIds.value].sort())
  try {
    if (organization.value.id === null) {
      const response = await RootOrganizationApi.createOne(organization.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await RootOrganizationApi.updateOne(
        organization.value.id,
        organization.value
      )
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
      organization.value.addressProvince,
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

const clickClear = async () => {
  Modal.confirm({
    title: 'Bạn có chắc chắn muốn xóa DATA của cơ sở này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'DATA đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        showModal.value = false
        if (organization.value.id !== null) {
          const response = await RootOrganizationApi.clearOne(organization.value.id)
          emit('success', response, 'CLEAR')
          showModal.value = false
        }
      } catch (error) {
        console.log('🚀 ~ clickClear ~ error:', error)
      }
    },
    onCancel() {},
  })
}

const clickDelete = async () => {
  Modal.confirm({
    title: 'XÓA CƠ SỞ',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'CƠ SỞ NÀY SẼ KHÔNG CÒN TỒN TẠI TRÊN HỆ THỐNG ?',
    async onOk() {
      try {
        if (organization.value.id !== null) {
          const response = await RootOrganizationApi.deleteOne(organization.value.id)
          emit('success', response, 'DELETE')
          showModal.value = false
        }
      } catch (error) {
        console.log('🚀 ~ clickClear ~ error:', error)
      }
    },
    onCancel() {},
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ organization.id !== null ? 'Cập nhật thông tin cơ sở' : 'Tạo cơ sở mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <CloseOutlined />
        </div>
      </div>

      <div class="px-4 mt-4">
        <div class="flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
          <div style="width: 100px; flex: none">Phone</div>
          <div class="flex-auto">
            <InputText
              v-model:value="organization.phone"
              pattern="[0][356789][0-9]{8}"
              title="Định dạng số điện thoại không đúng"
              @update:value="(e: string) => (organization.phone = e.replace(/ /g, ''))"
            />
          </div>
        </div>

        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div style="width: 100px; flex: none">Email</div>
          <div class="flex-auto">
            <InputText v-model:value="organization.email" required />
          </div>
        </div>

        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div style="width: 100px; flex: none">Name</div>
          <div class="flex-auto">
            <InputText v-model:value="organization.name" required />
          </div>
        </div>

        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div style="width: 100px; flex: none">Level</div>
          <div class="flex-auto">
            <InputNumber v-model:value="organization.level" required />
          </div>
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

        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div style="width: 100px; flex: none">Permission</div>
          <div class="flex-auto">
            <a-checkbox-group v-model:value="permissionIds">
              <div v-for="permission in permissionList" :key="permission.id" class="mb-3">
                <a-checkbox :value="permission.id">{{ permission.name }}</a-checkbox>
              </div>
            </a-checkbox-group>
          </div>
        </div>

        <div class="flex items-center mt-3">
          <div class="w-[100px] flex-none">Active</div>
          <a-switch
            :checked="Boolean(organization.isActive)"
            @change="(checked: Boolean) => (organization.isActive = checked ? 1 : 0)"
          />
          <div v-if="!organization.isActive" class="ml-4">
            Cơ sở này tạm thời không thể hoạt động
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <a-button danger @click="clickDelete"> Xóa </a-button>
          <a-button danger @click="clickClear"> Clear </a-button>
          <a-button class="ml-auto" @click="closeModal">
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
</template>
