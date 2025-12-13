<script setup lang="ts">
import { AlertStore } from '@/common/vue-alert'
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { InputMoney, InputSelect, InputText, VueSwitch } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { MeService } from '../../../modules/_me/me.service'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Wallet, WalletService, WalletType, WalletTypeText } from '../../../modules/wallet'
import { ESTypescript } from '@/utils'

const emit = defineEmits<{
  (e: 'success', value: Wallet, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const { userPermission } = MeService

const showModal = ref(false)
const wallet = ref(Wallet.blank())
const saveLoading = ref(false)

const walletTypeOptions = ESTypescript.keysEnum(WalletType).map((key) => ({
  value: WalletType[key],
  label: WalletTypeText[WalletType[key]],
}))

const openModal = async (walletId?: string) => {
  showModal.value = true
  if (walletId) {
    wallet.value = await WalletService.detail(walletId)
  } else {
    wallet.value = Wallet.blank()
  }
}

const closeModal = () => {
  wallet.value = Wallet.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  if (!wallet.value.walletType) {
    return AlertStore.addError('Chưa chọn loại ví tiền')
  }
  try {
    if (!wallet.value.id) {
      const response = await WalletService.createOne(wallet.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await WalletService.updateOne(wallet.value.id, wallet.value)
      emit('success', response, 'UPDATE')
    }
    saveLoading.value = false
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalWalletUpsert.vue:52 ~ handleSave ~ error:', error)
    saveLoading.value = false
  }
}

const clickDelete = () => {
  if (wallet.value.money) {
    return AlertStore.addError('Không thể xóa ví tiền có số dư khác 0')
  }
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa ví tiền này',
    content: 'Phương thức đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await WalletService.destroyOne(wallet.value.id)
        if (response.success) {
          emit('success', wallet.value, 'DESTROY')
          closeModal()
        } else {
          ModalStore.alert({
            title: 'Không thể xóa ví tiền này',
            content: ['Có lỗi xảy ra, vui lòng liên hệ admin để được hỗ trợ'],
          })
        }
      } catch (error) {
        console.log('🚀 ~ ModalWalletUpsert.vue:77 ~ onOk ~ error:', error)
      }
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="(e) => handleSave()">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ wallet.id ? 'Cập nhật ví tiền' : 'Tạo ví tiền mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4 flex flex-wrap items-center gap-4">
        <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px">
          <div>Tên ví tiền</div>
          <div>
            <InputText v-model:value="wallet.name" required />
          </div>
        </div>
        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div>Mã ví tiền</div>
          <div>
            <InputText v-model:value="wallet.code" />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div>Loại ví tiền</div>
          <div>
            <InputSelect
              v-model:value="wallet.walletType"
              required
              :options="walletTypeOptions"
            ></InputSelect>
          </div>
        </div>

        <div v-if="wallet.id" style="flex-grow: 1; flex-basis: 90%; min-width: 300px">
          <div>Số dư trong ví</div>
          <div>
            <InputMoney v-model:value="wallet.money"></InputMoney>
          </div>
        </div>
        <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px" class="flex">
          <div class="w-[100px] flex-none">Active</div>
          <div>
            <VueSwitch v-model="wallet.isActive" type-parser="number" />
          </div>
          <div v-if="!wallet.isActive" class="ml-4">Tạm thời không thể sử dụng ví tiền này</div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton
            v-if="userPermission[PermissionId.MASTER_DATA_WAREHOUSE] && wallet.id"
            color="red"
            @click="clickDelete"
          >
            Xóa
          </VueButton>
          <VueButton type="reset" style="margin-left: auto" icon="close" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>

<style lang="scss" scoped></style>
