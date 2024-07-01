<script setup lang="ts">
import {
  CloseOutlined,
  ExclamationCircleOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { Modal, type SelectProps } from 'ant-design-vue'
import { createVNode, ref } from 'vue'
import VueModal from '../../../common/VueModal.vue'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputHint, InputText } from '../../../common/vue-form'
import { AddressInstance } from '../../../core/address.instance'
import { useDistributorStore } from '../../../modules/distributor'
import { Distributor } from '../../../modules/distributor/distributor.model'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { convertViToEn, customFilter, sleep } from '../../../utils'
import ModalDistributorUpsertSettingScreen from './ModalDistributorUpsertSettingScreen.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import VueButton from '../../../common/VueButton.vue'

const modalDistributorUpsertSettingScreen =
  ref<InstanceType<typeof ModalDistributorUpsertSettingScreen>>()

const emit = defineEmits<{
  (e: 'success', value: Distributor, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const distributorStore = useDistributorStore()
const settingStore = useSettingStore()
const { isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const distributor = ref(Distributor.blank())
const saveLoading = ref(false)

const provinceList = ref<string[]>([])
const districtList = ref<string[]>([])
const wardList = ref<string[]>([])

const openModal = async (instance?: Distributor) => {
  try {
    showModal.value = true
    distributor.value = instance ? Distributor.from(instance) : Distributor.blank()

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
  } catch (error) {
    console.log('🚀 ~ file: ModalDistributorUpsert.vue:57 ~ openModal ~ error:', error)
  }
}

const handleClose = () => {
  distributor.value = Distributor.blank()
  districtList.value = []
  wardList.value = []
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!distributor.value.id) {
      const response = await distributorStore.createOne(distributor.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await distributorStore.updateOne(distributor.value.id, distributor.value)
      emit('success', response, 'UPDATE')
    }
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalDistributorUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleDelete = async () => {
  try {
    await distributorStore.deleteOne(distributor.value.id)
    emit('success', distributor.value, 'DELETE')
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:75 ~ handleDelete ~ error:', error)
  }
}

const clickDelete = () => {
  if (distributor.value.debt != 0) {
    return AlertStore.add({
      type: 'error',
      message: 'Không thể xóa nhà cung cấp đang có nợ',
      time: 2000,
    })
  }
  Modal.confirm({
    title: 'Bạn có chắc chắn muốn xóa nhà cung cấp này',
    icon: createVNode(ExclamationCircleOutlined),
    content: 'Nhà cung cấp đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      await handleDelete()
    },
    onCancel() {},
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
      distributor.value.addressProvince || '',
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
          {{ distributor.id ? 'Cập nhật thông tin NCC' : 'Tạo NCC mới' }}
        </div>
        <div
          v-if="permissionIdMap[PermissionId.SETTING_UPSERT]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalDistributorUpsertSettingScreen?.openModal()">
          <!-- <SettingOutlined /> -->
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="handleClose">
          <CloseOutlined />
        </div>
      </div>

      <div class="px-4 mt-4 gap-4 flex flex-wrap">
        <div class="grow basis-[600px]">
          <div>Tên nhà cung cấp</div>
          <div>
            <InputText v-model:value="distributor.fullName" required />
          </div>
        </div>
        <div class="grow basis-[600px]">
          <div>Số điện thoại</div>
          <div>
            <InputText
              v-model:value="distributor.phone"
              pattern="[0][356789][0-9]{8}"
              title="Định dạng số điện thoại không đúng"
              @update:value="(e) => (distributor.phone = e.replace(/ /g, ''))" />
          </div>
        </div>

        <div v-if="settingStore.SCREEN_DISTRIBUTOR_UPSERT.address" class="grow basis-[80%]">
          <div>Địa chỉ</div>
          <div class="flex gap-4 flex-wrap">
            <div style="flex: 1; flex-basis: 200px">
              <InputHint
                v-model:value="distributor.addressProvince"
                :options="provinceList"
                :maxHeight="180"
                placeholder="Thành Phố / Tỉnh"
                :logic-filter="(item: string, text: string) => customFilter(item, text)"
                @update:value="handleChangeProvince" />
            </div>
            <div style="flex: 1; flex-basis: 200px">
              <InputHint
                v-model:value="distributor.addressDistrict"
                :maxHeight="180"
                :options="districtList"
                :logic-filter="(item: string, text: string) => customFilter(item, text)"
                placeholder="Quận / Huyện"
                @update:value="handleChangeDistrict" />
            </div>
            <div style="flex: 1; flex-basis: 200px">
              <InputHint
                v-model:value="distributor.addressWard"
                :maxHeight="180"
                :options="wardList"
                placeholder="Phường / Xã"
                :logic-filter="(item: string, text: string) => customFilter(item, text)" />
            </div>

            <div class="grow basis-[80%]">
              <InputText
                v-model:value="distributor.addressStreet"
                placeholder="Số nhà / Tòa nhà / Ngõ / Đường" />
            </div>
          </div>
        </div>

        <div class="grow basis-[80%]">
          <div>Ghi chú</div>
          <div>
            <InputText v-model:value="distributor.note" />
          </div>
        </div>

        <div class="flex items-center mt-4">
          <div class="w-[100px] flex-none">Active</div>
          <a-switch
            :checked="Boolean(distributor.isActive)"
            @change="(checked: Boolean) => (distributor.isActive = checked ? 1 : 0)" />
          <div v-if="!distributor.isActive" class="ml-4">
            Tạm thời không thể nhập hàng từ nhà cung cấp này
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton
            v-if="permissionIdMap[PermissionId.DISTRIBUTOR_DELETE] && distributor.id"
            color="red"
            type="button"
            @click="clickDelete">
            Xóa
          </VueButton>
          <VueButton class="ml-auto" type="reset" @click="handleClose">
            <template #icon>
              <CloseOutlined />
            </template>
            Hủy bỏ
          </VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalDistributorUpsertSettingScreen
    v-if="permissionIdMap[PermissionId.SETTING_UPSERT]"
    ref="modalDistributorUpsertSettingScreen" />
</template>
