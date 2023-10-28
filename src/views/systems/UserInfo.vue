<script setup lang="ts">
import { SaveOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { onBeforeMount, ref } from 'vue'
import { InputDate } from '../../common/vue-form'
import { MeApi } from '../../modules/_me/me.api'
import { useMeStore } from '../../modules/_me/me.store'
import { User } from '../../modules/user'
import { useScreenStore } from '../../modules/_me/screen.store'
import ModalChangePassword from './modal/ModalChangePassword.vue'

const screenStore = useScreenStore()
const { isMobile } = screenStore

const modalChangePassword = ref<InstanceType<typeof ModalChangePassword>>()
const meStore = useMeStore()
const user = ref<User>(User.fromInstance(meStore.user || User.blank()))

onBeforeMount(async () => {
  const apiResult = await MeApi.info()
  user.value = apiResult.user
})

const saveUser = async () => {
  try {
    const userData = await MeApi.updateInfo(user.value)
    user.value = userData
    meStore.user = User.fromInstance(userData)
    message.success('Cập nhật thông tin cá nhân thành công')
  } catch (error) {
    console.log('🚀 ~ file: ModalCustomerUpsert.vue:42 ~ handleSave ~ error:', error)
  }
}
</script>

<template>
  <ModalChangePassword ref="modalChangePassword" />
  <div class="mx-4 mt-4">
    <div class="flex justify-between items-center">
      <div class="font-medium" style="font-size: 1.2rem">
        <SettingOutlined style="margin-right: 1rem" />Thông tin cá nhân
      </div>
    </div>
  </div>
  <div class="mx-4 p-4 bg-white">
    <div style="max-width: 800px">
      <div class="flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 100px; flex: none">Họ Tên</div>
        <a-input v-model:value="user.fullName" class="flex-auto" />
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 100px; flex: none">Tên đăng nhập</div>
        <a-input disabled :value="user.username" class="flex-auto" />
      </div>

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 100px; flex: none">Mật khẩu</div>
        <a-input-group class="flex-auto" compact>
          <a-input value="********************" style="width: calc(100% - 150px)" />
          <a-button
            style="width: 150px"
            type="primary"
            @click="modalChangePassword?.openModal(user)"
          >
            Đổi mật khẩu
          </a-button>
        </a-input-group>
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

      <div class="mt-3 flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 100px; flex: none">Giới tính</div>
        <div style="flex: 1">
          <a-radio-group v-model:value="user.gender">
            <a-radio :value="1"> Nam </a-radio>
            <a-radio :value="0"> Nữ </a-radio>
          </a-radio-group>
        </div>
      </div>

      <div class="my-8 text-center">
        <a-button type="primary" @click="saveUser">
          <template #icon>
            <SaveOutlined />
          </template>
          Lưu lại
        </a-button>
      </div>
    </div>
  </div>
</template>
../../modules/_me/organization.store