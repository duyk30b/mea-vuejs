<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconSetting } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputDate, InputHint, InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { AddressInstance } from '../../../core/address.instance'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { useCustomerStore } from '../../../modules/customer'
import { Customer } from '../../../modules/customer/customer.model'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { customFilter } from '../../../utils'
import ModalCustomerUpsertSettingScreen from './ModalCustomerUpsertSettingScreen.vue'

const modalCustomerUpsertSettingScreen =
  ref<InstanceType<typeof ModalCustomerUpsertSettingScreen>>()

const emit = defineEmits<{
  (e: 'success', value: Customer, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const customerStore = useCustomerStore()
const settingStore = useSettingStore()
const { isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const customer = ref<Customer>(Customer.blank())
const saveLoading = ref(false)

const provinceList = ref<string[]>([])
const districtList = ref<string[]>([])
const wardList = ref<string[]>([])

const openModal = async (instance?: Customer) => {
  try {
    showModal.value = true
    customer.value = instance ? Customer.from(instance) : Customer.blank()

    provinceList.value = await AddressInstance.getAllProvinces()
    if (instance?.addressProvince) {
      districtList.value = await AddressInstance.getDistrictsByProvince(instance.addressProvince)
      if (instance.addressDistrict) {
        wardList.value = await AddressInstance.getWardsByProvinceAndDistrict(
          instance.addressProvince,
          instance.addressDistrict
        )
      }
    }
  } catch (error: any) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:50 ~ openModal ~ error:', error)
  }
}

const closeModal = () => {
  customer.value = Customer.blank()
  districtList.value = []
  wardList.value = []
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  if (!customer.value.fullName) {
    return AlertStore.addError('Lỗi: Tên khách hàng không được bỏ trống')
  }
  try {
    if (!customer.value.id) {
      const response = await customerStore.createOne(customer.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await customerStore.updateOne(customer.value.id, customer.value)
      emit('success', response, 'UPDATE')
    }
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleDelete = async () => {
  try {
    await customerStore.deleteOne(customer.value.id)
    emit('success', customer.value, 'DELETE')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:75 ~ handleDelete ~ error:', error)
  }
}

const clickDelete = () => {
  if (customer.value.debt != 0) {
    return AlertStore.add({
      type: 'error',
      message: 'Không thể xóa khách hàng đang có nợ',
      time: 2000,
    })
  }
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa khách hàng này',
    content: 'Khách hàng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      await handleDelete()
    },
  })
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
      customer.value.addressProvince,
      district
    )
  } catch (error) {
    console.log('🚀 ~ handleChangeDistrict ~ error:', error)
  }
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
          v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalCustomerUpsertSettingScreen?.openModal()">
          <IconSetting />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 gap-4 flex flex-wrap">
        <div style="flex-basis: 90%; flex-grow: 1">
          <div>Họ Tên</div>
          <div>
            <InputText v-model:value="customer.fullName" required />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.phone"
          style="flex-basis: 300px; flex-grow: 1">
          <div>Số điện thoại</div>
          <div>
            <InputText
              v-model:value="customer.phone"
              pattern="[0][356789][0-9]{8}"
              title="Định dạng số điện thoại không đúng"
              @update:value="(e) => (customer.phone = e.replace(/ /g, ''))" />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.birthday"
          style="flex-basis: 300px; flex-grow: 1">
          <div>Ngày sinh</div>
          <div>
            <InputDate
              v-model:value="customer.birthday"
              format="DD/MM/YYYY"
              type-parser="number"
              class="w-full" />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.identityCard"
          style="flex-basis: 300px; flex-grow: 1">
          <div>Số CCCD</div>
          <div>
            <InputText v-model:value="customer.identityCard" placeholder="Số căn cước" />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.gender"
          style="flex-basis: 300px; flex-grow: 1">
          <div>Giới tính</div>
          <div>
            <a-radio-group v-model:value="customer.gender">
              <a-radio :value="1">Nam</a-radio>
              <a-radio :value="0">Nữ</a-radio>
            </a-radio-group>
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.address"
          style="flex-basis: 80%; flex-grow: 1">
          <div>Địa chỉ</div>
          <div class="flex flex-wrap gap-4">
            <div style="flex-basis: 300px; flex-grow: 1">
              <InputHint
                v-model:value="customer.addressProvince"
                :options="provinceList"
                :maxHeight="180"
                placeholder="Thành Phố / Tỉnh"
                :logic-filter="(item: string, text: string) => customFilter(item, text)"
                @update:value="handleChangeProvince" />
            </div>
            <div style="flex-basis: 300px; flex-grow: 1">
              <InputHint
                v-model:value="customer.addressDistrict"
                :maxHeight="180"
                :options="districtList"
                :logic-filter="(item: string, text: string) => customFilter(item, text)"
                placeholder="Quận / Huyện"
                @update:value="handleChangeDistrict" />
            </div>
            <div style="flex-basis: 300px; flex-grow: 1">
              <InputHint
                v-model:value="customer.addressWard"
                :maxHeight="180"
                :options="wardList"
                placeholder="Phường / Xã"
                :logic-filter="(item: string, text: string) => customFilter(item, text)" />
            </div>

            <div style="flex-basis: 300px; flex-grow: 1">
              <InputText
                v-model:value="customer.addressStreet"
                placeholder="Số nhà / Tòa nhà / Ngõ / Đường" />
            </div>
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.relative"
          style="flex-basis: 300px; flex-grow: 1">
          <div>Liên hệ khác</div>
          <div>
            <InputText
              v-model:value="customer.relative"
              placeholder="Tên người thân, số điện thoại" />
          </div>
        </div>

        <div style="flex-basis: 300px; flex-grow: 1">
          <div >Ghi chú</div>
          <div style="flex: 1">
            <InputText v-model:value="customer.note" />
          </div>
        </div>

        <div class="flex items-center mt-3">
          <div class="w-[100px] flex-none">Active</div>
          <a-switch
            :checked="Boolean(customer.isActive)"
            @change="(checked: Boolean) => (customer.isActive = checked ? 1 : 0)" />
          <div v-if="!customer.isActive" class="ml-4">
            Khách hàng này tạm thời không thể mua hàng
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton
            v-if="permissionIdMap[PermissionId.CUSTOMER_DELETE] && customer.id"
            color="red"
            @click="clickDelete">
            Xóa
          </VueButton>
          <VueButton class="ml-auto" icon="close" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalCustomerUpsertSettingScreen
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalCustomerUpsertSettingScreen" />
</template>
