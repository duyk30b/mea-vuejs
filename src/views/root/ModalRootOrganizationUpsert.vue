<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { IconClose } from '../../common/icon-antd'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import {
  InputCheckboxList,
  InputDate,
  InputHint,
  InputNumber,
  InputText,
  VueSelect,
  VueSwitch,
} from '../../common/vue-form'
import type { CheckboxOptionType } from '../../common/vue-form/InputCheckboxList.vue'
import VueModal from '../../common/vue-modal/VueModal.vue'
import { AddressInstance } from '../../core/address.instance'
import { useSettingStore } from '../../modules/_me/setting.store'
import { Organization, OrganizationStatus } from '../../modules/organization'
import { PermissionApi } from '../../modules/permission/permission.api'
import { RootOrganizationApi } from '../../modules/root-organization/root-organization.api'
import { customFilter } from '../../utils'
import ModalRootOrganizationClear from './ModalRootOrganizationClear.vue'

const modalRootOrganizationClear = ref<InstanceType<typeof ModalRootOrganizationClear>>()

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { isMobile } = settingStore

const provinceList = ref<string[]>([])
const districtList = ref<string[]>([])
const wardList = ref<string[]>([])

const showModal = ref(false)
const organization = ref<Organization>(Organization.blank())
const saveLoading = ref(false)

const checkboxPermissionIdOptions = ref<CheckboxOptionType[]>([])
const checkboxPermissionId = ref<Record<string, boolean>>({})

let firstLoad = true

const openModal = async (instance?: Organization) => {
  showModal.value = true
  if (firstLoad === true) {
    try {
      const permissionList = await PermissionApi.list({ filter: { level: { EQUAL: 1 } } })
      checkboxPermissionIdOptions.value = permissionList.map((i) => ({ key: i.id, label: i.name }))
    } catch (error) {
      console.log('🚀 ~ ModalRootOrganizationUpsert.vue:63 ~ openModal ~ error:', error)
    }
    provinceList.value = await AddressInstance.getAllProvinces()
    firstLoad = false
  }

  if (instance) {
    organization.value = instance ? Organization.from(instance) : Organization.blank()
    const permissionIds: number[] = JSON.parse(instance?.permissionIds || '[]')
    permissionIds.forEach((id) => (checkboxPermissionId.value[id] = true))

    if (instance.addressProvince) {
      districtList.value = await AddressInstance.getDistrictsByProvince(instance.addressProvince)
      if (instance.addressDistrict) {
        wardList.value = await AddressInstance.getWardsByProvinceAndDistrict(
          instance.addressProvince,
          instance.addressDistrict,
        )
      }
    }
  }
}

const closeModal = () => {
  organization.value = Organization.blank()
  districtList.value = []
  wardList.value = []
  showModal.value = false
  checkboxPermissionId.value = {}
}

const handleSave = async () => {
  saveLoading.value = true
  if (!organization.value.phone) {
    return AlertStore.addError('Lỗi: SĐT khách hàng không được bỏ trống')
  }

  organization.value.permissionIds = JSON.stringify(
    Object.keys(checkboxPermissionId.value)
      .filter((id) => checkboxPermissionId.value[id])
      .map((i) => Number(i))
      .sort((a, b) => (a > b ? 1 : -1)),
  )
  try {
    if (organization.value.id) {
      await RootOrganizationApi.updateOne(organization.value.id, organization.value)
    } else {
      await RootOrganizationApi.createOne(organization.value)
    }
    emit('success')
    closeModal()
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
  districtList.value = await AddressInstance.getDistrictsByProvince(province)
}

const handleChangeDistrict = async (district: string) => {
  if (!district) {
    wardList.value = []
    return
  }
  wardList.value = await AddressInstance.getWardsByProvinceAndDistrict(
    organization.value.addressProvince,
    district,
  )
}

const handleModalRootOrganizationClearSuccess = async () => {
  emit('success')
  closeModal()
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

      <div class="px-4 mt-4 flex flex-wrap gap-4">
        <div style="flex-basis: 90%; flex-grow: 1">
          <div style="width: 100px; flex: none">Name</div>
          <div class="flex-auto">
            <InputText v-model:value="organization.name" required />
          </div>
        </div>

        <div style="flex-basis: 200px; flex-grow: 1">
          <div>Phone</div>
          <div>
            <InputText
              v-model:value="organization.phone"
              pattern="[0][356789][0-9]{8}"
              title="Định dạng số điện thoại không đúng"
              @update:value="(e: string) => (organization.phone = e.replace(/ /g, ''))"
            />
          </div>
        </div>

        <div style="flex-basis: 200px; flex-grow: 1">
          <div>Email</div>
          <div>
            <InputText v-model:value="organization.email" required />
          </div>
        </div>

        <div style="flex-basis: 200px; flex-grow: 1">
          <div>Email Verify</div>
          <div>
            <VueSwitch v-model="organization.emailVerify" type-parser="number" />
          </div>
        </div>

        <div style="flex-basis: 200px; flex-grow: 1">
          <div>Địa chỉ</div>
          <div>
            <InputHint
              v-model:value="organization.addressProvince"
              :options="provinceList"
              :maxHeight="180"
              placeholder="Thành Phố / Tỉnh"
              :logic-filter="(item: string, text: string) => customFilter(item, text)"
              @update:value="handleChangeProvince"
            />
          </div>
        </div>

        <div style="flex-basis: 200px; flex-grow: 1">
          <div>&nbsp;</div>
          <div>
            <InputHint
              v-model:value="organization.addressDistrict"
              :maxHeight="180"
              :options="districtList"
              :logic-filter="(item: string, text: string) => customFilter(item, text)"
              placeholder="Quận / Huyện"
              @update:value="handleChangeDistrict"
            />
          </div>
        </div>

        <div style="flex-basis: 200px; flex-grow: 1">
          <div>&nbsp;</div>
          <div>
            <InputHint
              v-model:value="organization.addressWard"
              :maxHeight="180"
              :options="wardList"
              placeholder="Phường / Xã"
              :logic-filter="(item: string, text: string) => customFilter(item, text)"
            />
          </div>
        </div>

        <div style="flex-basis: 90%; flex-grow: 1">
          <InputText
            v-model:value="organization.addressStreet"
            placeholder="Số nhà / Tòa nhà / Ngõ / Đường"
          />
        </div>

        <div style="flex-basis: 200px; flex-grow: 1">
          <div>Level</div>
          <div class="flex-auto">
            <InputNumber v-model:value="organization.level" required />
          </div>
        </div>

        <div style="flex-basis: 200px; flex-grow: 1">
          <div>Data Version</div>
          <div class="flex-auto">
            <InputText v-model:value="organization.dataVersion" required />
          </div>
        </div>

        <div style="flex-basis: 200px; flex-grow: 1">
          <div>HSD</div>
          <div class="flex-auto">
            <InputDate v-model:value="organization.expiryDate" typeParser="number" />
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1">
          <div>Link Facebook</div>
          <div class="flex-auto">
            <InputText v-model:value="organization.facebook" />
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1">
          <div>Note</div>
          <div class="flex-auto">
            <InputText v-model:value="organization.note" />
          </div>
        </div>

        <div style="flex-basis: 90%; flex-grow: 1" class="flex gap-4">
          <div>Permission</div>
          <div>
            <InputCheckboxList
              v-model:value="checkboxPermissionId"
              :options="checkboxPermissionIdOptions"
            />
          </div>
        </div>

        <div style="flex-basis: 90%; flex-grow: 1" class="flex">
          <div class="w-[100px] flex-none">Status</div>
          <div>
            <VueSelect
              v-model:value="organization.status"
              :options="[
                { value: OrganizationStatus.Inactive, text: 'Inactive' },
                { value: OrganizationStatus.Active, text: 'Active' },
                { value: OrganizationStatus.Frequent, text: 'Frequent' },
              ]"
            />
          </div>
        </div>
      </div>

      <div class="p-4 mt-4">
        <div class="flex gap-4">
          <template v-if="!!organization.id">
            <VueButton
              color="red"
              :loading="saveLoading"
              @click="modalRootOrganizationClear?.openModal(organization)"
            >
              Clear
            </VueButton>
          </template>
          <VueButton style="margin-left: auto" icon="close" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalRootOrganizationClear
    ref="modalRootOrganizationClear"
    @success="handleModalRootOrganizationClearSuccess"
  />
</template>
