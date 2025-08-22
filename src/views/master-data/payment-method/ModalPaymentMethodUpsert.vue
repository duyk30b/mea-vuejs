<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { InputNumber, InputText, VueSwitch } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { MeService } from '../../../modules/_me/me.service'
import { PaymentMethod, PaymentMethodService } from '../../../modules/payment-method'
import { PermissionId } from '../../../modules/permission/permission.enum'

const emit = defineEmits<{
  (e: 'success', value: PaymentMethod, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const { userPermission } = MeService

const showModal = ref(false)
const paymentMethod = ref(PaymentMethod.blank())
const saveLoading = ref(false)

const openModal = async (paymentMethodId?: number) => {
  showModal.value = true
  if (paymentMethodId) {
    paymentMethod.value = await PaymentMethodService.detail(paymentMethodId)
  } else {
    paymentMethod.value = PaymentMethod.blank()
  }
}

const closeModal = () => {
  paymentMethod.value = PaymentMethod.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!paymentMethod.value.id) {
      const response = await PaymentMethodService.createOne(paymentMethod.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await PaymentMethodService.updateOne(
        paymentMethod.value.id,
        paymentMethod.value,
      )
      emit('success', response, 'UPDATE')
    }
    saveLoading.value = false
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalPaymentMethodUpsert.vue:52 ~ handleSave ~ error:', error)
    saveLoading.value = false
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa phương thức thanh toán này này',
    content: 'Phương thức đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await PaymentMethodService.destroyOne(paymentMethod.value.id)
        if (response.success) {
          emit('success', paymentMethod.value, 'DESTROY')
          closeModal()
        } else {
          ModalStore.alert({
            title: 'Không thể xóa phương thích thanh toán này',
            content: ['Có lỗi xảy ra, vui lòng liên hệ admin để được hỗ trợ'],
          })
        }
      } catch (error) {
        console.log('🚀 ~ ModalPaymentMethodUpsert.vue:77 ~ onOk ~ error:', error)
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
          {{
            paymentMethod.id ? 'Cập nhật phương thức thanh toán' : 'Tạo phương thức thanh toán mới'
          }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="">
          <div>Mã phương thức thanh toán</div>
          <div>
            <InputText v-model:value="paymentMethod.code" />
          </div>
        </div>
        <div class="mt-4">
          <div>Tên phương thức thanh toán</div>
          <div>
            <InputText v-model:value="paymentMethod.name" required />
          </div>
        </div>
        <div class="flex items-center mt-4">
          <div class="w-[100px] flex-none">Active</div>
          <div>
            <VueSwitch v-model="paymentMethod.isActive" type-parser="number" />
          </div>
          <div v-if="!paymentMethod.isActive" class="ml-4">
            Tạm thời không thể sử dụng phương thức thanh toán này
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton
            v-if="userPermission[PermissionId.MASTER_DATA_WAREHOUSE] && paymentMethod.id"
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
