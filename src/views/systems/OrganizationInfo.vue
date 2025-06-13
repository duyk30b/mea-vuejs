<script setup lang="ts">
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { IconSetting } from '../../common/icon-antd'
import ImageUploadSingle from '../../common/image-upload/ImageUploadSingle.vue'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { InputHint, InputOptions, InputText } from '../../common/vue-form'
import { AddressInstance } from '../../core/address.instance'
import { MeService } from '../../modules/_me/me.service'
import { useSettingStore } from '../../modules/_me/setting.store'
import { Organization, OrganizationService } from '../../modules/organization'
import { OrganizationApi } from '../../modules/organization/organization.api'
import { ESImage, customFilter } from '../../utils'
import ModalChangeOrganizationEmail from './modal/ModalChangeOrganizationEmail.vue'
import { Address, AddressService } from '@/modules/address'

const imageUploadSingleRef = ref<InstanceType<typeof ImageUploadSingle>>()
const modalChangeOrganizationEmail = ref<InstanceType<typeof ModalChangeOrganizationEmail>>()
const inputOptionsAddress = ref<InstanceType<typeof InputOptions>>()

const orgStore = useSettingStore()
const { isMobile } = orgStore

const currentAddress = ref<Address>(Address.blank())
const addressOptions = ref<{ value: number; text: string; data: Address }[]>([])

const organization = ref<Organization>(
  Organization.from(MeService.organization.value || Organization.blank()),
)
const hasChangeImage = ref(false)
const saveLoading = ref(false)
const sendEmailVerifyLoading = ref(false)

onBeforeMount(async () => {
  try {
    organization.value = await OrganizationService.info()

    await AddressService.fetchAll()
    const findAddress = await AddressService.findBy({
      province: organization.value?.addressProvince || '',
      ward: organization.value?.addressWard || '',
    })

    currentAddress.value.province = findAddress.province || organization.value.addressProvince || ''
    currentAddress.value.ward = findAddress.ward || organization.value?.addressWard || ''

    inputOptionsAddress.value?.setItem({
      text: [currentAddress.value.ward || '', currentAddress.value.province || '']
        .filter((i) => !!i)
        .join(' - '),
      data: currentAddress.value,
      value: currentAddress.value.id,
    })
  } catch (error) {
    console.log('🚀 ~ file: OrganizationInfo.vue:36 ~ onBeforeMount ~ error:', error)
  }
})

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

const saveOrganization = async () => {
  try {
    saveLoading.value = true

    const file = imageUploadSingleRef.value?.imageData.file
    if (!file) {
      const organizationUpdate = await OrganizationService.updateInfo(organization.value)
      Object.assign(organization.value, organizationUpdate)
    } else {
      const organizationUpdate = await OrganizationService.updateInfoAndLogo(
        organization.value,
        file,
      )
      Object.assign(organization.value, organizationUpdate)
    }
    AlertStore.addSuccess('Cập nhật thông tin cơ sở thành công')
  } catch (error) {
    console.log('🚀 ~ file: OrganizationInfo.vue:84 ~ saveOrganization ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const hasChangeData = computed(() => {
  if (hasChangeImage.value) return true
  if (!Organization.equal(organization.value, MeService.organization.value)) return true
  if (organization.value.addressProvince !== currentAddress.value.province) {
    return true
  }
  if (organization.value.addressWard !== currentAddress.value.ward) {
    return true
  }
  return false
})

const disableButtonSave = computed(() => {
  return !hasChangeData.value
})

const sendEmailVerify = async () => {
  try {
    sendEmailVerifyLoading.value = true
    await OrganizationApi.sendEmailVerifyOrganizationEmail()
    AlertStore.addSuccess('Gửi email thành công, vui lòng kiểm tra email !')
  } catch (error: any) {
    console.log('🚀 ~ file: OrganizationInfo.vue:99 ~ sendEmailVerify ~ error:', error)
  } finally {
    sendEmailVerifyLoading.value = false
  }
}
</script>

<template>
  <ModalChangeOrganizationEmail
    ref="modalChangeOrganizationEmail"
    @success="(v) => (organization = v)"
  />
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.2rem">
        <IconSetting style="margin-right: 1rem" />
        Thông tin cơ sở
      </div>
    </div>
  </div>
  <div class="mx-4 mt-4 p-4 bg-white">
    <div style="max-width: 800px">
      <div class="flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Tên Cơ sở</div>
        <InputText v-model:value="organization.name" />
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Email</div>
        <div style="display: flex; width: 100%">
          <InputText disabled :value="organization.email" style="width: calc(100% - 100px)" />
          <VueButton
            color="blue"
            style="width: 100px"
            @click="modalChangeOrganizationEmail?.openModal(organization)"
          >
            Đổi Email
          </VueButton>
        </div>
      </div>
      <div v-if="!organization.emailVerify && organization.email" class="flex justify-end">
        <VueButton size="text" :loading="sendEmailVerifyLoading" @click="sendEmailVerify">
          Email chưa được kích hoạt, gửi email kích hoạt ngay
        </VueButton>
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">SĐT</div>
        <InputText disabled :value="organization.phone" pattern="[0][356789][0-9]{8}" />
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Địa chỉ</div>
        <InputOptions
          ref="inputOptionsAddress"
          :max-height="260"
          :options="addressOptions"
          @selectItem="({ data }) => selectAddress(data)"
          @searching="searchingAddress"
          noClearTextWhenNotSelected
        />
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Số nhà, ngõ ...</div>
        <InputText v-model:value="organization.addressStreet" placeholder="Số nhà, ngõ ..." />
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Logo</div>
        <div>
          <ImageUploadSingle
            ref="imageUploadSingleRef"
            :height="150"
            :rootImage="{
              id: organization.logoImage?.id || 0,
              src: ESImage.getImageLink(organization.logoImage, { size: 400 }),
            }"
            @changeImage="hasChangeImage = true"
          />
        </div>
      </div>

      <div class="my-8 text-center flex justify-center">
        <VueButton
          :disabled="disableButtonSave"
          color="blue"
          :loading="saveLoading"
          icon="save"
          @click="saveOrganization"
        >
          Lưu lại
        </VueButton>
      </div>
    </div>
  </div>
</template>
