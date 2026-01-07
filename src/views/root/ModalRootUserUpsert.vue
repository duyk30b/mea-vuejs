<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { IconClose } from '../../common/icon-antd'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { InputDate, InputNumber, InputRadio, InputText, VueSwitch } from '../../common/vue-form'
import VueModal from '../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../common/vue-modal/vue-modal.store'
import { useSettingStore } from '../../modules/_me/setting.store'
import { RootUserApi } from '../../modules/root/root-user/root-user.api'
import { User } from '../../modules/user'

const emit = defineEmits<{
  (e: 'success', value: User, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const settingStore = useSettingStore()
const { isMobile } = settingStore

const showModal = ref(false)
const user = ref<User>(User.blank())
const saveLoading = ref(false)

const openModal = async (instance?: User) => {
  showModal.value = true
  if (instance) {
    user.value = User.from(instance)
  } else {
    user.value = User.blank()
    user.value.isAdmin = 1
  }
}

const closeModal = () => {
  user.value = User.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  if (!user.value.fullName) {
    return AlertStore.addError('Lỗi: Tên khách hàng không được bỏ trống')
  }
  try {
    if (!user.value.id) {
      const response = await RootUserApi.createOne(user.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await RootUserApi.updateOne(user.value.id, user.value)
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
    if (user.value.id !== null) {
      await RootUserApi.delete(user.value.id)
    }
    emit('success', user.value, 'DELETE')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:75 ~ handleDelete ~ error:', error)
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa khách hàng này',
    content: 'Khách hàng đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      await handleDelete()
    },
  })
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal">
    <form class="bg-white" @submit.prevent="handleSave">
      <div class="pl-4 py-4 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ user.id ? 'Cập nhật thông tin User' : 'Tạo User mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4">
        <div class="flex" :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div style="width: 100px; flex: none">Oid</div>
          <div class="flex-auto">
            <InputNumber v-model:value="user.oid" :disabled="!!user.id" required />
          </div>
        </div>

        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div style="width: 100px; flex: none">Username</div>
          <div class="flex-auto">
            <InputText v-model:value="user.username" required />
          </div>
        </div>

        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div style="width: 100px; flex: none">Password</div>
          <div class="flex-auto">
            <InputText v-model:value="user.password" required />
          </div>
        </div>

        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div style="width: 100px; flex: none">Họ Tên</div>
          <div class="flex-auto">
            <InputText v-model:value="user.fullName" required />
          </div>
        </div>

        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
          <div style="width: 100px; flex: none">Số điện thoại</div>
          <div class="flex-auto">
            <InputText
              v-model:value="user.phone"
              pattern="[0][356789][0-9]{8}"
              title="Định dạng số điện thoại không đúng"
              @update:value="(e: string) => (user.phone = e.replace(/ /g, ''))"
            />
          </div>
        </div>

        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
          <div style="width: 100px; flex: none">Ngày sinh</div>
          <div style="flex: 1">
            <InputDate
              v-model:value="user.birthday"
              format="DD/MM/YYYY"
              type-parser="number"
              class="w-full"
            />
          </div>
        </div>

        <div class="mt-5 flex items-center">
          <div style="width: 100px; flex: none">Giới tính</div>
          <div style="flex: 1">
            <InputRadio
              v-model:value="user.gender"
              :options="[
                { key: 1, label: 'Nam' },
                { key: 0, label: 'Nữ' },
              ]"
            />
          </div>
        </div>

        <div class="flex items-center mt-5">
          <div class="w-[100px] flex-none">Admin</div>
          <div>
            <VueSwitch v-model="user.isAdmin" type-parser="number" />
          </div>
        </div>

        <div class="flex items-center mt-5">
          <div class="w-[100px] flex-none">Active</div>
          <div>
            <VueSwitch v-model="user.isActive" type-parser="number" />
          </div>
          <div v-if="!user.isActive" class="ml-4">User này tạm thời không thể hoạt động</div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <!-- <VueButton danger @click="clickDelete">Xóa</VueButton> -->
          <VueButton style="margin-left: auto" icon="close" @click="closeModal">Hủy bỏ</VueButton>
          <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
