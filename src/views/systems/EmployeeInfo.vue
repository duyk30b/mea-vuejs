<script setup lang="ts">
import { InputDate } from '@/common/vue-form'
import { Employee, UserService } from '@/modules/employee'
import { useUserStore } from '@/store/user.store'
import { SaveOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { onBeforeMount, ref } from 'vue'
import ModalChangePassword from './modal/ModalChangePassword.vue'

const modalChangePassword = ref<InstanceType<typeof ModalChangePassword>>()
const userStore = useUserStore()
const employee = ref<Employee>(Employee.fromInstance(userStore.userInfo || Employee.blank()))

onBeforeMount(async () => {
  employee.value = await UserService.me()
})

const saveEmployee = async () => {
  try {
    const employeeData = await UserService.updateInfo(employee.value)
    employee.value = employeeData
    userStore.userInfo = Employee.fromInstance(employeeData)
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
      <div class="font-medium" style="font-size: 1.3rem;">
        <SettingOutlined style="margin-right: 1rem" />Thông tin cá nhân
      </div>
    </div>
  </div>
  <div class="mx-4 mt-4 p-4 bg-white">
    <div style="max-width: 800px;">
      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Họ Tên</div>
        <a-input v-model:value="employee.fullName" class="flex-auto"></a-input>
      </div>

      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Tên đăng nhập</div>
        <a-input disabled :value="employee.username" class="flex-auto"></a-input>
      </div>

      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Mật khẩu</div>
        <a-input-group class="flex-auto" compact>
          <a-input value="********************" style="width: calc(100% - 150px)" />
          <a-button style="width:150px" type="primary" @click="modalChangePassword?.openModal(employee)">
            Đổi mật khẩu
          </a-button>
        </a-input-group>
      </div>

      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Ngày sinh</div>
        <div style="flex:1">
          <InputDate v-model:value="employee.birthday" format="DD/MM/YYYY" type-parser="number" class="w-full" />
        </div>
      </div>

      <div class="flex items-center mb-3">
        <div style="width: 100px; flex: none;">Giới tính</div>
        <div style="flex:1">
          <a-radio-group v-model:value="employee.gender">
            <a-radio :value="1">Nam</a-radio>
            <a-radio :value="0">Nữ</a-radio>
          </a-radio-group>
        </div>
      </div>

      <div class="my-8 text-center">
        <a-button type="primary" @click="saveEmployee">
          <template #icon>
            <SaveOutlined />
          </template>
          Lưu lại
        </a-button>
      </div>
    </div>
  </div>
</template>
