<script setup lang="ts">
import { Address, AddressService } from '@/modules/address'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconSetting } from '../../../common/icon-antd'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import {
  InputDate,
  InputOptions,
  InputRadio,
  InputText,
  VueSelect,
  VueSwitch,
} from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { CustomerService } from '../../../modules/customer'
import { CustomerSource, CustomerSourceService } from '../../../modules/customer-source'
import { Customer } from '../../../modules/customer/customer.model'
import { PermissionId } from '../../../modules/permission/permission.enum'
import ModalCustomerUpsertSettingScreen from './ModalCustomerUpsertSettingScreen.vue'

const modalCustomerUpsertSettingScreen =
  ref<InstanceType<typeof ModalCustomerUpsertSettingScreen>>()
const inputOptionsAddress = ref<InstanceType<typeof InputOptions>>()

const emit = defineEmits<{
  (e: 'success', value: Customer, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const settingStore = useSettingStore()
const { userPermission } = MeService

const showModal = ref(false)
const customer = ref<Customer>(Customer.blank())
const saveLoading = ref(false)

const customerSourceAll = ref<CustomerSource[]>([])

const currentAddress = ref<Address>(Address.blank())
const addressOptions = ref<{ value: number; text: string; data: Address }[]>([])

const openModal = async (instance?: Customer) => {
  showModal.value = true
  customer.value = instance ? Customer.from(instance) : Customer.blank()
  if (settingStore.SCREEN_CUSTOMER_UPSERT.customerSource) {
    customerSourceAll.value = await CustomerSourceService.list({})
  }

  const findAddress = await AddressService.findBy({
    province: customer.value?.addressProvince || '',
    ward: customer.value?.addressWard || '',
  })

  currentAddress.value.province = findAddress.province || instance?.addressProvince || ''
  currentAddress.value.ward = findAddress.ward || instance?.addressWard || ''

  inputOptionsAddress.value?.setItem({
    text: [currentAddress.value.ward || '', currentAddress.value.province || '']
      .filter((i) => !!i)
      .join(' - '),
    data: currentAddress.value,
    value: currentAddress.value.id,
  })
}

const closeModal = () => {
  customer.value = Customer.blank()
  currentAddress.value = Address.blank()
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
  customer.value.addressProvince = currentAddress.value.province
  customer.value.addressWard = currentAddress.value.ward
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
          v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
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
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.facebook"
          style="flex-basis: 45%; flex-grow: 1; min-width: 300px"
        >
          <div>Link Facebook</div>
          <div>
            <InputText type="url" v-model:value="customer.facebook" />
          </div>
        </div>

        <div
          v-if="settingStore.SCREEN_CUSTOMER_UPSERT.zalo"
          style="flex-basis: 45%; flex-grow: 1; min-width: 300px"
        >
          <div>Link Zalo</div>
          <div>
            <InputText type="url" v-model:value="customer.zalo" />
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

        <template v-if="settingStore.SCREEN_CUSTOMER_UPSERT.address">
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
              <InputText v-model:value="customer.addressStreet" placeholder="Số nhà, ngõ ..." />
            </div>
          </div>
        </template>

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
          <div>
            <VueSwitch v-model="customer.isActive" type-parser="number" />
          </div>
          <div v-if="!customer.isActive" class="ml-4">
            Khách hàng này tạm thời không thể mua hàng
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton
            v-if="userPermission[PermissionId.CUSTOMER_DELETE] && customer.id"
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
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalCustomerUpsertSettingScreen"
  />
</template>
