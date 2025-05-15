<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconSetting } from '../../../common/icon-antd'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputDate, InputHint, InputRadio, InputText, VueSelect } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { AddressInstance } from '../../../core/address.instance'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { CustomerService } from '../../../modules/customer'
import { CustomerSource, CustomerSourceService } from '../../../modules/customer-source'
import { Customer } from '../../../modules/customer/customer.model'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { customFilter } from '../../../utils'
import ModalCustomerUpsertSettingScreen from './ModalCustomerUpsertSettingScreen.vue'

const modalCustomerUpsertSettingScreen =
  ref<InstanceType<typeof ModalCustomerUpsertSettingScreen>>()

const emit = defineEmits<{
  (e: 'success', value: Customer, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const settingStore = useSettingStore()
const meStore = useMeStore()
const { permissionIdMap } = meStore

const showModal = ref(false)
const customer = ref<Customer>(Customer.blank())
const saveLoading = ref(false)

const customerSourceAll = ref<CustomerSource[]>([])

const provinceList = ref<string[]>([])
const districtList = ref<string[]>([])
const wardList = ref<string[]>([])

const openModal = async (instance?: Customer) => {
  showModal.value = true
  customer.value = instance ? Customer.from(instance) : Customer.blank()
  if (settingStore.SCREEN_CUSTOMER_UPSERT.customerSource) {
    customerSourceAll.value = await CustomerSourceService.list({})
  }
  if (settingStore.SCREEN_CUSTOMER_UPSERT.addressFull) {
    provinceList.value = await AddressInstance.getAllProvinces()
    if (instance?.addressProvince) {
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
      const response = await CustomerService.createOne(customer.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await CustomerService.updateOne(customer.value.id, customer.value)
      emit('success', response, 'UPDATE')
    }
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const clickDelete = () => {
  if (customer.value.debt != 0) {
    return ModalStore.alert({
      title: 'Không thể xóa sản phẩm khách hàng đã từng thanh toán hoặc có nợ',
      content: [
        '- Nếu bắt buộc phải xoá, bạn cần phải xóa tất cả các hóa đơn, phiếu bán hàng liên quan trước',
      ],
    })
  }
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa khách hàng này',
    content: 'Khách hàng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await CustomerService.destroyOne(customer.value.id)
        if (response.success) {
          emit('success', customer.value, 'DELETE')
          closeModal()
        } else {
          ModalStore.alert({
            title: 'Không thể xóa khách hàng khi khách hàng đã từng được tiếp đón',
            content: [
              'Nếu bắt buộc phải xóa, bạn cần phải xóa tất cả phiếu khám và phiếu bán hàng của khách hàng này trước',
              `Các phiếu liên quan: ${response.data.ticketList.map((i) => i.id).join(', ')}`,
            ],
          })
        }
      } catch (error) {
        console.log('🚀 ~ file: ModalCustomerUpsert.vue:112 ~ clickDelete ~ error:', error)
      }
    },
  })
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
    customer.value.addressProvince,
    district,
  )
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
          @click="modalCustomerUpsertSettingScreen?.openModal()"
        >
          <IconSetting />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 gap-4 flex flex-wrap">
        <div style="flex-basis: 45%; flex-grow: 1; min-width: 300px">
          <div>Họ Tên</div>
          <div>
            <InputText v-model:value="customer.fullName" required />
          </div>
        </div>

        <div style="flex-basis: 45%; flex-grow: 1; min-width: 300px">
          <div>Số điện thoại</div>
          <div>
            <InputText
              v-model:value="customer.phone"
              pattern="[0][356789][0-9]{8}"
              title="Định dạng số điện thoại không đúng"
              @update:value="(e) => (customer.phone = e.replace(/ /g, ''))"
            />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.birthday"
          style="flex-basis: 45%; flex-grow: 1; min-width: 300px"
        >
          <div>Ngày sinh</div>
          <div>
            <InputDate
              v-model:value="customer.birthday"
              v-model:year="customer.yearOfBirth"
              format="DD/MM/YYYY"
              type-parser="number"
              class="w-full"
            />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.gender"
          style="flex-basis: 45%; flex-grow: 1; min-width: 300px"
        >
          <div>Giới tính</div>
          <div>
            <InputRadio
              v-model:value="customer!.gender"
              :options="[
                { key: 1, label: 'Nam' },
                { key: 0, label: 'Nữ' },
              ]"
            />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.addressFull"
          style="flex-basis: 80%; flex-grow: 1"
        >
          <div>Địa chỉ</div>
          <div class="flex flex-wrap gap-x-4 gap-y-2">
            <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
              <InputHint
                v-model:value="customer.addressProvince"
                :options="provinceList"
                :maxHeight="180"
                placeholder="Thành Phố / Tỉnh"
                :logic-filter="(item: string, text: string) => customFilter(item, text)"
                @update:value="handleChangeProvince"
              />
            </div>
            <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
              <InputHint
                v-model:value="customer.addressDistrict"
                :maxHeight="180"
                :options="districtList"
                :logic-filter="(item: string, text: string) => customFilter(item, text)"
                placeholder="Quận / Huyện"
                @update:value="handleChangeDistrict"
              />
            </div>
            <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
              <InputHint
                v-model:value="customer.addressWard"
                :maxHeight="180"
                :options="wardList"
                placeholder="Phường / Xã"
                :logic-filter="(item: string, text: string) => customFilter(item, text)"
              />
            </div>

            <div style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
              <InputText
                v-model:value="customer.addressStreet"
                placeholder="Số nhà / Tòa nhà / Ngõ / Đường"
              />
            </div>
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.addressBasic"
          style="flex-basis: 45%; flex-grow: 1; min-width: 300px"
        >
          <div>Địa chỉ</div>
          <div>
            <InputText v-model:value="customer.addressStreet" placeholder="" />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.relative"
          style="flex-basis: 45%; flex-grow: 1; min-width: 300px"
        >
          <div>Liên hệ khác</div>
          <div>
            <InputText
              v-model:value="customer.relative"
              placeholder="Tên người thân, số điện thoại"
            />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.customerSource"
          style="flex-basis: 45%; flex-grow: 1; min-width: 300px"
        >
          <div>Nguồn khách hàng</div>
          <div>
            <VueSelect
              v-model:value="customer.customerSourceId"
              :options="customerSourceAll.map((i) => ({ text: i.name, value: i.id }))"
            ></VueSelect>
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.note"
          style="flex-basis: 45%; flex-grow: 1; min-width: 300px"
        >
          <div>Ghi chú</div>
          <div style="flex: 1">
            <InputText v-model:value="customer.note" />
          </div>
        </div>

        <div style="flex-basis: 90%; flex-grow: 1; min-width: 300px" class="flex">
          <div class="w-[100px] flex-none">Active</div>
          <a-switch
            :checked="Boolean(customer.isActive)"
            @change="(checked: Boolean) => (customer.isActive = checked ? 1 : 0)"
          />
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
            @click="clickDelete"
          >
            Xóa
          </VueButton>
          <VueButton style="margin-left: auto" icon="close" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalCustomerUpsertSettingScreen
    v-if="permissionIdMap[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalCustomerUpsertSettingScreen"
  />
</template>
