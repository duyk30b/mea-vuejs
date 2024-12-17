<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { CheckboxList, InputDate, InputText } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { RoleApi } from '../../../modules/role'
import { User, UserService } from '../../../modules/user'

const emit = defineEmits<{
  (e: 'success', value: User, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const showModal = ref(false)
const user = ref<User>(User.blank())
const saveLoading = ref(false)
const roleIdList = ref<number[]>([])
const roleListCheckboxOptions = ref<{ text: string; value: number | string }[]>([])

const openModal = async (userId?: number) => {
  showModal.value = true
  try {
    const [userData, roleList] = await Promise.all([
      userId ? UserService.detail(userId, { relation: { userRoleList: true } }) : User.blank(),
      RoleApi.list({}),
    ])
    user.value = User.from(userData)
    roleListCheckboxOptions.value = roleList.map((i) => ({ value: i.id, text: i.name }))
    roleIdList.value = userData.userRoleList?.map((i) => i.roleId) || []
  } catch (error: any) {
    AlertStore.addError(error.message)
    console.log('🚀 ~ file: ModalUserUpsert.vue:46 ~ openModal ~ error:', error)
  }
}

const closeModal = () => {
  user.value = User.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    roleIdList.value.sort((a, b) => (a > b ? 1 : -1))
    if (!user.value.id) {
      const response = await UserService.createOne(user.value, roleIdList.value)
      emit('success', response, 'CREATE')
    } else {
      const response = await UserService.updateOne(user.value.id, user.value, roleIdList.value)
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

      <div class="px-4 mt-4 gap-4 flex flex-wrap">
        <div style="flex-basis: 300px; flex-grow: 1">
          <div>Username</div>
          <div>
            <InputText v-model:value="user.username" :disabled="!!user.id" required />
          </div>
        </div>

        <div style="flex-basis: 300px; flex-grow: 1">
          <div>Password</div>
          <div>
            <InputText v-model:value="user.password" required :disabled="!!user.id" />
          </div>
        </div>

        <div style="flex-basis: 300px; flex-grow: 1">
          <div>Tên hiển thị</div>
          <div>
            <InputText v-model:value="user.fullName" required />
          </div>
        </div>

        <div style="flex-basis: 300px; flex-grow: 1">
          <div>Số điện thoại</div>
          <div>
            <InputText
              v-model:value="user.phone"
              pattern="[0][356789][0-9]{8}"
              title="Định dạng số điện thoại không đúng"
              @update:value="(e) => (user.phone = e.replace(/ /g, ''))" />
          </div>
        </div>

        <div style="flex-basis: 300px; flex-grow: 1">
          <div>Ngày sinh</div>
          <div>
            <InputDate
              v-model:value="user.birthday"
              format="DD/MM/YYYY"
              type-parser="number"
              class="w-full" />
          </div>
        </div>

        <div style="flex-basis: 300px; flex-grow: 1">
          <div>Giới tính</div>
          <div>
            <a-radio-group v-model:value="user.gender">
              <a-radio :value="1">Nam</a-radio>
              <a-radio :value="0">Nữ</a-radio>
            </a-radio-group>
          </div>
        </div>

        <div style="flex-basis: 90%; flex-grow: 1">
          <div>Vai trò</div>
          <div>
            <CheckboxList v-model:value="roleIdList" :options="roleListCheckboxOptions" />
          </div>
        </div>

        <div style="flex-basis: 90%; flex-grow: 1" class="flex items-center mt-3">
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
