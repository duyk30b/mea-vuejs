<script setup lang="ts">
import { CONFIG } from '@/config'
import { ESArray } from '@/utils'
import InputCheckboxRoleList from '@/views/component/InputCheckboxRoleList.vue'
import InputCheckboxRoomList from '@/views/component/InputCheckboxRoomList.vue'
import { computed, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputDate, InputRadio, InputText, VueSwitch } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { User, UserService } from '../../../modules/user'

const emit = defineEmits<{
  (e: 'success', value: User, type: 'CREATE' | 'UPDATE' | 'DELETE'): void
}>()

const userOrigin = ref<User>(User.blank())
const user = ref<User>(User.blank())

const username = ref('')
const password = ref('')

const roomIdListOrigin = ref<number[]>([])
const roomIdList = ref<number[]>([])
const roleIdListOrigin = ref<number[]>([])
const roleIdList = ref<number[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const hasChangeRoleIdList = computed(() => {
  if (!ESArray.equal(roleIdListOrigin.value, roleIdList.value)) {
    return true
  }
  return false
})
const hasChangeRoomIdList = computed(() => {
  if (!ESArray.equal(roomIdListOrigin.value, roomIdList.value)) {
    return true
  }
  return false
})

const hasChangeAccount = computed(() => {
  if (username.value !== user.value.username || password.value) {
    return true
  }
  return false
})

const hasChangeData = computed(() => {
  if (!User.equal(userOrigin.value, user.value)) {
    return true
  }
  if (hasChangeRoleIdList.value) {
    return true
  }
  if (hasChangeRoomIdList.value) {
    return true
  }
  if (hasChangeAccount.value) {
    return true
  }
  return false
})

const openModal = async (userId?: number) => {
  showModal.value = true
  try {
    if (userId) {
      userOrigin.value = await UserService.detail(
        userId,
        { relation: { userRoleList: { role: false }, userRoomList: { room: false } } },
        { refetch: true },
      )
      roleIdListOrigin.value = userOrigin.value.userRoleList!.map((i) => i.roleId)
      roomIdListOrigin.value = userOrigin.value.userRoomList!.map((i) => i.roomId)
    } else {
      userOrigin.value = User.blank()
      roleIdListOrigin.value = []
      roomIdListOrigin.value = []
    }

    user.value = User.from(userOrigin.value)
    username.value = user.value.username
    password.value = ''
    roleIdList.value = [...roleIdListOrigin.value]
    roomIdList.value = [...roomIdListOrigin.value]
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

  try {
    if (!user.value.id) {
      const response = await UserService.createOne({
        user: user.value,
        account: { username: username.value, password: password.value },
        roleIdList: roleIdList.value,
        roomIdList: roomIdList.value,
      })
      emit('success', response, 'CREATE')
    } else {
      const response = await UserService.updateOne(user.value.id, {
        user: user.value,
        account: hasChangeAccount.value
          ? { username: username.value, password: password.value }
          : undefined,
        roleIdList: hasChangeRoleIdList.value ? roleIdList.value : undefined,
        roomIdList: hasChangeRoomIdList.value ? roomIdList.value : undefined,
      })
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
            <InputText v-model:value="username" required />
          </div>
        </div>

        <div style="flex-basis: 300px; flex-grow: 1">
          <div>Password</div>
          <div>
            <InputText v-model:value="password" placeholder="**********" />
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

        <div style="flex-basis: 90%; flex-grow: 1" class="flex flex-wrap">
          <div class="w-[120px] flex-none">
            <div>Vai trò</div>
            <div v-if="CONFIG.MODE === 'development'" style="color: violet">
              {{ JSON.stringify(roleIdList) }}
            </div>
          </div>
          <InputCheckboxRoleList v-model:roleIdList="roleIdList" :checkboxAll="false" />
        </div>

        <div style="flex-basis: 90%; flex-grow: 1" class="flex flex-wrap">
          <div class="w-[120px] flex-none">
            <div>Truy cập phòng</div>
            <div v-if="CONFIG.MODE === 'development'" style="color: violet">
              {{ JSON.stringify(roomIdList) }}
            </div>
          </div>
          <div class="flex-1">
            <InputCheckboxRoomList v-model:roomIdList="roomIdList" :checkboxAll="false" />
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
          <VueButton
            color="blue"
            type="submit"
            :loading="saveLoading"
            icon="save"
            :disabled="!hasChangeData"
          >
            Lưu lại
          </VueButton>
        </div>
      </div>
    </form>
  </VueModal>
</template>
