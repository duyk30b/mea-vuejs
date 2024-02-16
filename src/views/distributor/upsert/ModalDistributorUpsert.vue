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
import { InputText } from '../../../common/vue-form'
import { AddressInstance } from '../../../core/address.instance'
import { useDistributorStore } from '../../../modules/distributor'
import { Distributor } from '../../../modules/distributor/distributor.model'
import { useScreenStore } from '../../../modules/_me/screen.store'
import { convertViToEn } from '../../../utils'
import ModalDistributorUpsertSettingScreen from './ModalDistributorUpsertSettingScreen.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { PermissionId } from '../../../modules/permission/permission.enum'

const modalDistributorUpsertSettingScreen =
  ref<InstanceType<typeof ModalDistributorUpsertSettingScreen>>()

const emit = defineEmits<{
  (e: 'success', value: Distributor, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const distributorStore = useDistributorStore()
const screenStore = useScreenStore()
const { isMobile } = screenStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const distributor = ref(Distributor.blank())
const saveLoading = ref(false)

const provinceOptions = ref<SelectProps['options']>([])
const districtOptions = ref<SelectProps['options']>([])
const wardOptions = ref<SelectProps['options']>([])

const openModal = async (instance?: Distributor) => {
  showModal.value = true
  distributor.value = instance ? Distributor.fromInstance(instance) : Distributor.blank()
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
          v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]"
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

      <div class="px-4 mt-4">
        <div class="mt-4 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
          <div class="w-[100px] flex-none">Tên NCC</div>
          <div class="flex-auto">
            <InputText v-model:value="distributor.fullName" required />
          </div>
        </div>
        <div
          v-if="screenStore.SCREEN_DISTRIBUTOR_UPSERT.phone"
          class="mt-4 flex"
          :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'"
        >
          <div class="w-[100px] flex-none">Số điện thoại</div>
          <div class="flex-auto">
            <InputText
              v-model:value="distributor.phone"
              pattern="[0][356789][0-9]{8}"
              title="Định dạng số điện thoại không đúng"
              @update:value="(e) => (distributor.phone = e.replace(/ /g, ''))"
            />
          </div>
        </div>

        <div
          v-if="screenStore.SCREEN_DISTRIBUTOR_UPSERT.address"
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
          <div v-if="!distributor.isActive" class="ml-4">
            Tạm thời không thể nhập hàng từ nhà cung cấp này
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <a-button
            v-if="permissionIdMap[PermissionId.DISTRIBUTOR_DELETE] && distributor.id"
            danger
            @click="clickDelete"
          >
            Xóa
          </a-button>
          <a-button class="ml-auto" @click="handleClose">
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
  <ModalDistributorUpsertSettingScreen
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_SCREEN]"
    ref="modalDistributorUpsertSettingScreen"
  />
</template>
