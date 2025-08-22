<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { InputText, VueSwitch } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { MeService } from '../../../modules/_me/me.service'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Surcharge, SurchargeService } from '../../../modules/surcharge'

const emit = defineEmits<{
  (e: 'success', value: Surcharge, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const { userPermission } = MeService

const showModal = ref(false)
const surcharge = ref(Surcharge.blank())
const saveLoading = ref(false)

const openModal = async (surchargeId?: number) => {
  showModal.value = true
  if (surchargeId) {
    surcharge.value = await SurchargeService.detail(surchargeId)
  } else {
    surcharge.value = Surcharge.blank()
  }
}

const closeModal = () => {
  surcharge.value = Surcharge.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!surcharge.value.id) {
      const response = await SurchargeService.createOne(surcharge.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await SurchargeService.updateOne(surcharge.value.id, surcharge.value)
      emit('success', response, 'UPDATE')
    }
    saveLoading.value = false
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalSurchargeUpsert.vue:52 ~ handleSave ~ error:', error)
    saveLoading.value = false
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa phụ phí này này',
    content: 'Phụ phí đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await SurchargeService.destroyOne(surcharge.value.id)
        if (response.success) {
          emit('success', surcharge.value, 'DESTROY')
          closeModal()
        } else {
          ModalStore.alert({
            title: 'Không thể xóa phương thích thanh toán này',
            content: ['Có lỗi xảy ra, vui lòng liên hệ admin để được hỗ trợ'],
          })
        }
      } catch (error) {
        console.log('🚀 ~ ModalSurchargeUpsert.vue:77 ~ onOk ~ error:', error)
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
          {{ surcharge.id ? 'Cập nhật phụ phí' : 'Tạo phụ phí mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="">
          <div>Mã phụ phí</div>
          <div>
            <InputText v-model:value="surcharge.code" />
          </div>
        </div>
        <div class="mt-4">
          <div>Tên phụ phí</div>
          <div>
            <InputText v-model:value="surcharge.name" required />
          </div>
        </div>
        <div class="flex items-center mt-4">
          <div class="w-[100px] flex-none">Active</div>
          <div>
            <VueSwitch v-model="surcharge.isActive" type-parser="number" />
          </div>
          <div v-if="!surcharge.isActive" class="ml-4">
            Tạm thời không thể sử dụng phụ phí này
          </div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton
            v-if="userPermission[PermissionId.MASTER_DATA_WAREHOUSE] && surcharge.id"
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
