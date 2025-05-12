<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { Organization, OrganizationService } from '../../../modules/organization'

const emit = defineEmits<{ (e: 'success', value: Organization): void }>()

const showModal = ref(false)
const organization = ref(Organization.blank())
const saveLoading = ref(false)

const newEmail = ref<string>('')

const openModal = async (organizationProp: Organization) => {
  showModal.value = true
  organization.value = organizationProp
}

const closeModal = () => {
  showModal.value = false
  organization.value = Organization.blank()
}

const handleSave = async () => {
  if (organization.value.email === newEmail.value) {
    return AlertStore.addError('Email mới và email cũ cùng địa chỉ')
  }
  saveLoading.value = true
  try {
    const organizationUpdate = await OrganizationService.changeEmail(newEmail.value)
    AlertStore.addSuccess(
      'Đổi email thành công. Vui lòng kiểm tra hòm thư email để kích hoạt tài khoản'
    )
    emit('success', organizationUpdate)
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ChangePassword.vue:38 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Thay đổi Email cơ sở</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <div class="mt-4 px-4">
        <div>
          <div>
            Gmail cũ
            <span style="font-size: 0.9em; font-style: italic">
              {{ organization.emailVerify ? '(Đã được kích hoạt)' : '(Chưa được kích hoạt)' }}
            </span>
          </div>
          <div><InputText :value="organization.email" disabled /></div>
        </div>
        <div class="mt-4">
          <div>Gmail mới</div>
          <div><InputText v-model:value="newEmail" required type="email" /></div>
        </div>
        <div class="mt-4 italic">
          <div style="color: red">
            Lưu ý
            <span>*</span>
            :
          </div>
          <div>- Sau khi thay đổi email, cần vào hòm thư email để kích hoạt tài khoản</div>
        </div>
      </div>
      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton type="reset" icon="close" style="margin-left:auto" @click="closeModal">
            Hủy bỏ
          </VueButton>
          <VueButton icon="save" type="submit" color="blue" :loading="saveLoading">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
