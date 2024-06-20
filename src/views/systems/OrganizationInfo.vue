<script setup lang="ts">
import { SaveOutlined, SettingOutlined } from '@ant-design/icons-vue'
import type { SelectProps } from 'ant-design-vue'
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { InputHint, InputText } from '../../common/vue-form'
import { AddressInstance } from '../../core/address.instance'
import { useScreenStore } from '../../modules/_me/screen.store'
import { Organization, OrganizationService } from '../../modules/organization'
import { convertViToEn, customFilter } from '../../utils'
import { useMeStore } from '../../modules/_me/me.store'

const orgStore = useScreenStore()
const meStore = useMeStore()
const { isMobile } = orgStore

const provinceList = ref<string[]>([])
const districtList = ref<string[]>([])
const wardList = ref<string[]>([])

const organization = ref<Organization>(
  Organization.toBasic(meStore.organization || Organization.blank())
)
const saveLoading = ref(false)

onBeforeMount(async () => {
  organization.value = await OrganizationService.info()
})

onMounted(async () => {
  try {
    provinceList.value = await AddressInstance.getAllProvinces()
    if (organization.value.addressProvince) {
      districtList.value = await AddressInstance.getDistrictsByProvince(
        organization.value.addressProvince
      )
      if (organization.value.addressDistrict) {
        wardList.value = await AddressInstance.getWardsByProvinceAndDistrict(
          organization.value.addressProvince,
          organization.value.addressDistrict
        )
      }
    }
  } catch (error) {
    console.log('🚀 ~ file: OrganizationInfo.vue:42 ~ onMounted ~ error:', error)
  }
})

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

const saveOrganization = async () => {
  try {
    saveLoading.value = true
    organization.value = await OrganizationService.updateInfo(organization.value)
    AlertStore.addSuccess('Cập nhật thông tin cơ sở thành công')
  } catch (error) {
    console.log('🚀 ~ file: OrganizationInfo.vue:84 ~ saveOrganization ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const disableButtonSave = computed(() => {
  return JSON.stringify(organization.value) === JSON.stringify(meStore.organization)
})
</script>

<template>
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.2rem">
        <SettingOutlined style="margin-right: 1rem" />Thông tin cơ sở
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
        <InputText disabled :value="organization.email" />
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">SĐT</div>
        <InputText disabled :value="organization.phone" pattern="[0][356789][0-9]{8}" />
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none">Địa chỉ</div>
        <div class="flex-auto flex gap-4 flex-wrap">
          <div style="flex: 1; flex-basis: 200px">
            <InputHint
              v-model:value="organization.addressProvince"
              :options="provinceList"
              placeholder="Thành Phố / Tỉnh"
              :maxHeight="180"
              :logic-filter="(item: string, text: string) => customFilter(item, text)"
              @update:value="handleChangeProvince"
            />
          </div>
          <div style="flex: 1; flex-basis: 200px">
            <InputHint
              v-model:value="organization.addressDistrict"
              :options="districtList"
              :logic-filter="(item: string, text: string) => customFilter(item, text)"
              placeholder="Quận / Huyện"
              :maxHeight="180"
              @update:value="handleChangeDistrict"
            />
          </div>
          <div style="flex: 1; flex-basis: 200px">
            <InputHint
              v-model:value="organization.addressWard"
              :options="wardList"
              placeholder="Phường / Xã"
              :maxHeight="180"
              :logic-filter="(item: string, text: string) => customFilter(item, text)"
            />
          </div>
        </div>
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 120px; flex: none"></div>
        <InputText
          v-model:value="organization.addressStreet"
          placeholder="Số nhà / Tòa nhà / Ngõ / Đường"
        />
      </div>

      <div class="my-8 text-center flex justify-center">
        <VueButton
          :disabled="disableButtonSave"
          color="blue"
          :loading="saveLoading"
          @click="saveOrganization"
        >
          <template #icon>
            <SaveOutlined />
          </template>
          Lưu lại
        </VueButton>
      </div>
    </div>
  </div>
</template>
