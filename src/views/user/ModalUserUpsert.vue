<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { IconClose } from '../../common/icon'
import { InputDate, InputText, VueSelect } from '../../common/vue-form'
import VueModal from '../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../common/vue-modal/vue-modal.store'
import { useSettingStore } from '../../modules/_me/setting.store'
import { RoleApi, type Role } from '../../modules/role'
import { User, UserApi } from '../../modules/user'

const emit = defineEmits<{
  (e: 'success', value: User, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const settingStore = useSettingStore()
const { isMobile } = settingStore

const showModal = ref(false)
const user = ref<User>(User.blank())
const roles = ref<Role[]>([])
const saveLoading = ref(false)

let firstLoad = true

const openModal = async (instance?: User) => {
  showModal.value = true
  user.value = instance ? User.from(instance) : User.blank()
  if (firstLoad === true) {
    try {
      roles.value = await RoleApi.list({})
      firstLoad = false
    } catch (error) {
      console.log('🚀 ~ file: ModalUserUpsert.vue:46 ~ openModal ~ error:', error)
    }
  }
}

const closeModal = () => {
  user.value = User.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    if (!user.value.id) {
      const response = await UserApi.createOne(user.value, [])
      emit('success', response, 'CREATE')
    } else {
      const response = await UserApi.updateOne(user.value.id, user.value, [])
      emit('success', response, 'UPDATE')
    }
    showModal.value = false
  } catch (error) {
    console.log('🚀 ~ file: ModalUserUpsert.vue:42 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleDelete = async () => {
  try {
    // await userStore.deleteOne(user.value.id)
    emit('success', user.value, 'DELETE')
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalUserUpsert.vue:75 ~ handleDelete ~ error:', error)
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa tài khoản này',
    content: 'Tài khoản đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
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
          {{ user.id ? 'Cập nhật thông tin tài khoản' : 'Tạo tài khoản mới' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4">
        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div style="width: 100px; flex: none">Username</div>
          <div class="flex-auto">
            <InputText v-model:value="user.username" :disabled="!!user.id" required />
          </div>
        </div>

        <div
          v-if="!user.id"
          class="mt-3 flex"
          :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div style="width: 100px; flex: none">Password</div>
          <div class="flex-auto">
            <InputText v-model:value="user.password" required />
          </div>
        </div>

        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch' : 'items-center'">
          <div style="width: 100px; flex: none">Họ tên</div>
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
              @update:value="(e) => (user.phone = e.replace(/ /g, ''))" />
          </div>
        </div>

        <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
          <div style="width: 100px; flex: none">Ngày sinh</div>
          <div style="flex: 1">
            <InputDate
              v-model:value="user.birthday"
              format="DD/MM/YYYY"
              type-parser="number"
              class="w-full" />
          </div>
        </div>

        <div class="mt-5 flex items-center">
          <div style="width: 100px; flex: none">Giới tính</div>
          <div style="flex: 1">
            <a-radio-group v-model:value="user.gender">
              <a-radio :value="1">Nam</a-radio>
              <a-radio :value="0">Nữ</a-radio>
            </a-radio-group>
          </div>
        </div>

        <div class="flex items-center mt-5">
          <div class="w-[100px] flex-none">Active</div>
          <a-switch
            :checked="Boolean(user.isActive)"
            @change="(checked: Boolean) => (user.isActive = checked ? 1 : 0)" />
          <div v-if="!user.isActive" class="ml-4">Tài khoản này tạm thời không thể sử dụng</div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton icon="close" type="reset" class="ml-auto" @click="closeModal">
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
