<script setup lang="ts">
import { Address, AddressService } from '@/modules/address'
import { nextTick, ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { IconClose } from '../../common/icon-antd'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import {
  InputCheckboxList,
  InputDate,
  InputNumber,
  InputOptions,
  InputText,
  VueSelect,
  VueSwitch,
} from '../../common/vue-form'
import type { CheckboxOptionType } from '../../common/vue-form/InputCheckboxList.vue'
import VueModal from '../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../modules/_me/setting.store'
import { Organization, OrganizationStatus } from '../../modules/organization'
import { PermissionApi } from '../../modules/permission/permission.api'
import { RootOrganizationApi } from '../../modules/root-organization/root-organization.api'
import ModalRootOrganizationClear from './ModalRootOrganizationClear.vue'

const modalRootOrganizationClear = ref<InstanceType<typeof ModalRootOrganizationClear>>()
const inputOptionsAddress = ref<InstanceType<typeof InputOptions>>()

const emit = defineEmits<{ (e: 'success'): void }>()

const settingStore = useSettingStore()
const { isMobile } = settingStore

const showModal = ref(false)
const organization = ref<Organization>(Organization.blank())
const saveLoading = ref(false)

const checkboxPermissionIdOptions = ref<CheckboxOptionType[]>([])
const checkboxPermissionId = ref<Record<string, boolean>>({})

let firstLoad = true

const currentAddress = ref<Address>(Address.blank())
const addressOptions = ref<{ value: number; text: string; data: Address }[]>([])

const openModal = async (instance?: Organization) => {
  showModal.value = true
  if (firstLoad === true) {
    try {
      const permissionList = await PermissionApi.list({ filter: { level: { EQUAL: 1 } } })
      checkboxPermissionIdOptions.value = permissionList.map((i) => ({ key: i.id, label: i.name }))
    } catch (error) {
      console.log('🚀 ~ ModalRootOrganizationUpsert.vue:63 ~ openModal ~ error:', error)
    }
    await AddressService.fetchAll()
    firstLoad = false
  }

  if (instance) {
    organization.value = instance ? Organization.from(instance) : Organization.blank()
    const permissionIds: number[] = JSON.parse(instance?.permissionIds || '[]')
    permissionIds.forEach((id) => (checkboxPermissionId.value[id] = true))
  }

  currentAddress.value = await AddressService.findBy({
    province: instance?.addressProvince || '',
    ward: instance?.addressWard || '',
  })

  inputOptionsAddress.value?.setItem({
    text: `${currentAddress.value.ward} - ${currentAddress.value.province}`,
    data: currentAddress.value,
    value: currentAddress.value.id,
  })
}

const closeModal = () => {
  showModal.value = false
  organization.value = Organization.blank()
  checkboxPermissionId.value = {}
  currentAddress.value = Address.blank()
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

const handleModalRootOrganizationClearSuccess = async () => {
  emit('success')
  closeModal()
}

const searchingAddress = async (text: string) => {
  currentAddress.value = Address.blank()
  if (!text) {
    addressOptions.value = []
  } else {
    const addressList = await AddressService.search(text, { limit: 20 })
    addressOptions.value = (addressList || []).map((i) => {
      return { value: i.id, text: `${i.ward} - ${i.province}`, data: i }
    })
  }
}

const selectAddress = async (addressData?: Address) => {
  currentAddress.value = Address.from(addressData || Address.blank())
  organization.value.addressProvince = currentAddress.value.province
  organization.value.addressWard = currentAddress.value.ward
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

        <div style="flex-basis: 40%; flex-grow: 1">
          <div>Địa chỉ</div>
          <div>
            <InputOptions
              ref="inputOptionsAddress"
              :max-height="260"
              :options="addressOptions"
              @selectItem="({ data }) => selectAddress(data)"
              @searching="searchingAddress"
              noClearTextWhenNotSelected
            />
          </div>
        </div>

        <div style="flex-basis: 40%; flex-grow: 1">
          <div>Số nhà, ngõ ...</div>
          <div>
            <InputText v-model:value="organization.addressStreet" placeholder="Số nhà, ngõ ..." />
          </div>
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
