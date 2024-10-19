<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { IconClose } from '../../common/icon'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { InputHint, InputNumber, InputText } from '../../common/vue-form'
import VueModal from '../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../common/vue-modal/vue-modal.store'
import { AddressInstance } from '../../core/address.instance'
import { useSettingStore } from '../../modules/_me/setting.store'
import { Organization } from '../../modules/organization'
import { PermissionApi } from '../../modules/permission/permission.api'
import type { PermissionId } from '../../modules/permission/permission.enum'
import type { Permission } from '../../modules/permission/permission.model'
import { RootOrganizationApi } from '../../modules/root-organization/root-organization.api'
import { customFilter } from '../../utils'

const emit = defineEmits<{
  (e: 'success', value: Organization, type: 'CREATE' | 'UPDATE' | 'CLEAR' | 'DELETE'): void
}>()

const settingStore = useSettingStore()
const { isMobile } = settingStore

const provinceList = ref<string[]>([])
const districtList = ref<string[]>([])
const wardList = ref<string[]>([])

const showModal = ref(false)
const organization = ref<Organization>(Organization.blank())
const saveLoading = ref(false)

const permissionList = ref<Permission[]>([])
const permissionIds = ref<PermissionId[]>([])

let firstLoad = true

const openModal = async (instance?: Organization) => {
  try {
    showModal.value = true
    if (instance) {
      organization.value = instance ? Organization.from(instance) : Organization.blank()
      permissionIds.value = JSON.parse(instance?.permissionIds || '[]')
      if (instance.addressProvince) {
        districtList.value = await AddressInstance.getDistrictsByProvince(instance.addressProvince)
        if (instance.addressDistrict) {
          wardList.value = await AddressInstance.getWardsByProvinceAndDistrict(
            instance.addressProvince,
            instance.addressDistrict
          )
        }
      }
    }

    if (firstLoad === true) {
      provinceList.value = await AddressInstance.getAllProvinces()
      permissionList.value = await PermissionApi.list({ filter: { level: { EQUAL: 1 } } })
      firstLoad = false
    }
  } catch (error) {
    console.log('🚀 ~ file: ModalRootOrganizationUpsert.vue:48 ~ openModal ~ error:', error)
  }
}

const closeModal = () => {
  organization.value = Organization.blank()
  districtList.value = []
  wardList.value = []
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  if (!organization.value.phone) {
    return AlertStore.addError('Lỗi: Tên khách hàng không được bỏ trống')
  }

  organization.value.permissionIds = JSON.stringify(
    [...permissionIds.value].sort((a, b) => (a > b ? 1 : -1))
  )
  try {
    if (organization.value.id) {
      const response = await RootOrganizationApi.updateOne(
        organization.value.id,
        organization.value
      )
      emit('success', response, 'UPDATE')
    } else {
      const response = await RootOrganizationApi.createOne(organization.value)
      emit('success', response, 'CREATE')
    }
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:94 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleChangeProvince = async (province: string) => {
  if (!province) {
    districtList.value = []
    wardList.value = []
    return
  }
  try {
    districtList.value = await AddressInstance.getDistrictsByProvince(province)
  } catch (error) {
    console.log('🚀 ~ handleChangeProvince ~ error:', error)
  }
}

const handleChangeDistrict = async (district: string) => {
  if (!district) {
    wardList.value = []
    return
  }
  try {
    wardList.value = await AddressInstance.getWardsByProvinceAndDistrict(
      organization.value.addressProvince,
      district
    )
  } catch (error) {
    console.log('🚀 ~ handleChangeDistrict ~ error:', error)
  }
}

const clickClear = async () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa DATA của cơ sở này',
    content: 'DATA đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        if (organization.value.id !== null) {
          const response = await RootOrganizationApi.clearOne(organization.value.id)
          emit('success', response, 'CLEAR')
          showModal.value = false
        }
      } catch (error) {
        console.log('🚀 ~ clickClear ~ error:', error)
      }
    },
  })
}

const clickDelete = async () => {
  ModalStore.confirm({
    title: 'XÓA CƠ SỞ',
    content: 'CƠ SỞ NÀY SẼ KHÔNG CÒN TỒN TẠI TRÊN HỆ THỐNG ?',
    async onOk() {
      saveLoading.value = true
      try {
        if (organization.value.id !== null) {
          const response = await RootOrganizationApi.deleteOne(organization.value.id)
          emit('success', response, 'DELETE')
          showModal.value = false
        }
      } catch (error) {
        console.log('🚀 ~ clickClear ~ error:', error)
      } finally {
        saveLoading.value = false
      }
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ organization.id ? 'Cập nhật thông tin cơ sở' : 'Tạo cơ sở mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
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
              @update:value="(e: string) => (organization.phone = e.replace(/ /g, ''))" />
          </div>
        </div>

        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div style="width: 100px; flex: none">Email</div>
          <div class="flex-auto">
            <InputText v-model:value="organization.email" required />
          </div>
        </div>

        <div class="flex items-center mt-3">
          <div class="w-[100px] flex-none">Email Verify</div>
          <a-switch
            :checked="Boolean(organization.emailVerify)"
            @change="(checked: Boolean) => (organization.emailVerify = checked ? 1 : 0)" />
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

        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div style="width: 100px; flex: none">Data Version</div>
          <div class="flex-auto">
            <InputNumber v-model:value="organization.dataVersion" required />
          </div>
        </div>

        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
          <div style="width: 100px; flex: none">Địa chỉ</div>
          <div class="flex-auto flex gap-4 flex-wrap">
            <div style="flex: 1; flex-basis: 200px">
              <InputHint
                v-model:value="organization.addressProvince"
                :options="provinceList"
                :maxHeight="180"
                placeholder="Thành Phố / Tỉnh"
                :logic-filter="(item: string, text: string) => customFilter(item, text)"
                @update:value="handleChangeProvince" />
            </div>
            <div style="flex: 1; flex-basis: 200px">
              <InputHint
                v-model:value="organization.addressDistrict"
                :maxHeight="180"
                :options="districtList"
                :logic-filter="(item: string, text: string) => customFilter(item, text)"
                placeholder="Quận / Huyện"
                @update:value="handleChangeDistrict" />
            </div>
            <div style="flex: 1; flex-basis: 200px">
              <InputHint
                v-model:value="organization.addressWard"
                :maxHeight="180"
                :options="wardList"
                placeholder="Phường / Xã"
                :logic-filter="(item: string, text: string) => customFilter(item, text)" />
            </div>
          </div>
        </div>

        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
          <div style="width: 100px; flex: none" />
          <a-input
            v-model:value="organization.addressStreet"
            style="flex: 1"
            placeholder="Số nhà / Tòa nhà / Ngõ / Đường" />
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
            @change="(checked: Boolean) => (organization.isActive = checked ? 1 : 0)" />
          <div v-if="!organization.isActive" class="ml-4">
            Cơ sở này tạm thời không thể hoạt động
          </div>
        </div>
      </div>

      <div class="p-4 mt-4">
        <div class="flex gap-4">
          <VueButton color="red" @click="clickDelete">Xóa</VueButton>
          <VueButton color="red" :loading="saveLoading" @click="clickClear">Clear</VueButton>
          <VueButton class="ml-auto" icon="close" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
