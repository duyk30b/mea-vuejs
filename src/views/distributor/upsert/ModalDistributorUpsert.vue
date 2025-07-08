<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose, IconSetting } from '../../../common/icon-antd'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputHint, InputOptions, InputText, VueSwitch } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { AddressInstance } from '../../../core/address.instance'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DistributorService } from '../../../modules/distributor'
import { Distributor } from '../../../modules/distributor/distributor.model'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { customFilter } from '../../../utils'
import ModalDistributorUpsertSetting from './ModalDistributorUpsertSetting.vue'
import { Address, AddressService } from '@/modules/address'

const modalDistributorUpsertSetting = ref<InstanceType<typeof ModalDistributorUpsertSetting>>()
const inputOptionsAddress = ref<InstanceType<typeof InputOptions>>()

const emit = defineEmits<{
  (e: 'success', value: Distributor, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const settingStore = useSettingStore()
const { userPermission } = MeService

const showModal = ref(false)
const distributor = ref(Distributor.blank())
const saveLoading = ref(false)

const currentAddress = ref<Address>(Address.blank())
const addressOptions = ref<{ value: number; text: string; data: Address }[]>([])

const openModal = async (distributorId?: number) => {
  showModal.value = true
  if (!distributorId) {
    distributor.value = Distributor.blank()
  } else {
    distributor.value = await DistributorService.detail(distributorId)
  }

  currentAddress.value = await AddressService.findBy({
    province: distributor.value?.addressProvince || '',
    ward: distributor.value?.addressWard || '',
  })

  inputOptionsAddress.value?.setItem({
    text: [currentAddress.value.ward || '', currentAddress.value.province || '']
      .filter((i) => !!i)
      .join(' - '),
    data: currentAddress.value,
    value: currentAddress.value.id,
  })
}

const closeModal = () => {
  distributor.value = Distributor.blank()
  currentAddress.value = Address.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!distributor.value.id) {
      const response = await DistributorService.createOne(distributor.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await DistributorService.updateOne(distributor.value.id, distributor.value)
      emit('success', response, 'UPDATE')
    }
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalDistributorUpsert.vue:80 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
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
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa nhà cung cấp này',
    content: 'Nhà cung cấp đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await DistributorService.destroyOne(distributor.value.id)
        if (response.success) {
          emit('success', distributor.value, 'DESTROY')
          closeModal()
        } else {
          ModalStore.alert({
            title: 'Không thể xóa nhà cung cấp khi đã có phiếu nhập hàng',
            content: [
              'Nếu bắt buộc phải xóa, bạn cần phải xóa tất cả phiếu nhập hàng của nhà cung cấp này',
              `Phiếu nhập hàng liên quan: ${response.data.receiptList.map((i) => i.id).join(', ')}`,
            ],
            contentType: 'text',
          })
        }
      } catch (error) {
        console.log('🚀 ~ file: ModalDistributorUpsert.vue:109 ~ clickDelete ~ error:', error)
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
  distributor.value.addressProvince = currentAddress.value.province
  distributor.value.addressWard = currentAddress.value.ward
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
          v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
          style="font-size: 1.2rem"
          class="px-4 cursor-pointer"
          @click="modalDistributorUpsertSetting?.openModal()"
        >
          <IconSetting />
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
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
              @update:value="(e) => (distributor.phone = e.replace(/ /g, ''))"
            />
          </div>
        </div>

        <template v-if="settingStore.SCREEN_DISTRIBUTOR_UPSERT.address">
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
              <InputText v-model:value="distributor.addressStreet" placeholder="Số nhà, ngõ ..." />
            </div>
          </div>
        </template>

        <div class="grow basis-[80%]">
          <div>Ghi chú</div>
          <div>
            <InputText v-model:value="distributor.note" />
          </div>
        </div>

        <div class="flex items-center mt-4">
          <div class="w-[100px] flex-none">Active</div>
          <div>
            <VueSwitch v-model="distributor.isActive" type-parser="number" />
          </div>
          <div v-if="!distributor.isActive" class="ml-4">
            Tạm thời không thể nhập hàng từ nhà cung cấp này
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton
            v-if="userPermission[PermissionId.DISTRIBUTOR_DELETE] && distributor.id"
            color="red"
            type="button"
            @click="clickDelete"
          >
            Xóa
          </VueButton>
          <VueButton style="margin-left: auto" type="reset" @click="closeModal" icon="close">
            Hủy bỏ
          </VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
  <ModalDistributorUpsertSetting
    v-if="userPermission[PermissionId.ORGANIZATION_SETTING_UPSERT]"
    ref="modalDistributorUpsertSetting"
  />
</template>
