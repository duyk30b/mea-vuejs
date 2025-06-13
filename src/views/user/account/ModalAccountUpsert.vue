<script setup lang="ts">
import { ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputDate, InputRadio, InputText, VueSwitch } from '../../../common/vue-form'
import InputCheckboxList from '../../../common/vue-form/InputCheckboxList.vue'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { RoleService } from '../../../modules/role'
import { User, UserService } from '../../../modules/user'

const emit = defineEmits<{
  (e: 'success', value: User, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const user = ref<User>(User.blank())

const roleListCheckboxOptions = ref<{ text: string; value: number | string }[]>([])
const roleIdMapCheckbox = ref<Record<string, any>>({})

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (userId?: number) => {
  showModal.value = true
  try {
    const roleList = await RoleService.list({})
    roleListCheckboxOptions.value = roleList.map((i) => ({ value: i.id, text: i.name }))
    if (userId) {
      user.value = await UserService.detail(
        userId,
        { relation: { userRoleList: { role: false } } },
        { refetch: true },
      )
      user.value.userRoleList?.forEach((i) => {
        roleIdMapCheckbox.value[i.roleId] = true
      })
    } else {
      user.value = User.blank()
      roleIdMapCheckbox.value = {}
    }
  } catch (e: any) {
    console.log('🚀 ~ ModalAccountUpsert.vue:39 ~ openModal ~ e:', e)
    AlertStore.addError(e.message)
  }
}

const closeModal = () => {
  user.value = User.blank()
  showModal.value = false
}

const handleSave = async () => {
  saveLoading.value = true
  const roleIdList = Object.keys(roleIdMapCheckbox.value)
    .filter((id) => roleIdMapCheckbox.value[id])
    .map((i) => Number(i))
    .sort((a, b) => (a > b ? 1 : -1))

  try {
    if (!user.value.id) {
      const response = await UserService.createOne(user.value, roleIdList)
      emit('success', response, 'CREATE')
    } else {
      const response = await UserService.updateOne(user.value.id, user.value, roleIdList)
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
    await UserService.deleteOne(user.value.id)
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
            <InputText v-model:value="user.username" required />
          </div>
        </div>

        <div style="flex-basis: 300px; flex-grow: 1">
          <div>Password</div>
          <div>
            <InputText v-model:value="user.password" placeholder="**********" />
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
              @update:value="(e) => (user.phone = e.replace(/ /g, ''))"
            />
          </div>
        </div>

        <div style="flex-basis: 300px; flex-grow: 1">
          <div>Ngày sinh</div>
          <div>
            <InputDate
              v-model:value="user.birthday"
              format="DD/MM/YYYY"
              type-parser="number"
              class="w-full"
            />
          </div>
        </div>

        <div style="flex-basis: 300px; flex-grow: 1">
          <div>Giới tính</div>
          <div>
            <InputRadio
              v-model:value="user!.gender"
              :options="[
                { key: 1, label: 'Nam' },
                { key: 0, label: 'Nữ' },
              ]"
            />
          </div>
        </div>

        <div style="flex-basis: 90%; flex-grow: 1">
          <div>Vai trò</div>
          <div class="mt-1">
            <InputCheckboxList
              v-model:value="roleIdMapCheckbox"
              :options="
                roleListCheckboxOptions.map((i) => ({
                  key: i.value,
                  label: i.text,
                }))
              "
              :custom-style="{
                checkboxItemWrap: {
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                },
              }"
              no-checkbox-all
            />
          </div>
        </div>

        <div style="flex-basis: 90%; flex-grow: 1" class="flex items-center mt-3">
          <div class="w-[100px] flex-none">Active</div>
          <div>
            <VueSwitch v-model="user.isActive" type-parser="number" />
          </div>
          <div v-if="!user.isActive" class="ml-4">Tài khoản này tạm thời không thể sử dụng</div>
        </div>
      </div>

      <div class="p-4 mt-2">
        <div class="flex gap-4">
          <VueButton color="red" icon="trash" :loading="saveLoading" @click="clickDelete">
            Xóa
          </VueButton>
          <VueButton icon="close" type="reset" style="margin-left: auto" @click="closeModal">
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
