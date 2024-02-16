<script setup lang="ts">
import { PlusOutlined, ScheduleOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { InputText } from '../../common/vue-form'
import { useScreenStore } from '../../modules/_me/screen.store'
import { usePermissionStore } from '../../modules/permission/permission.store'
import { Role, RoleApi } from '../../modules/role'

const screenStore = useScreenStore()
const permissionStore = usePermissionStore()
const { formatMoney, isMobile } = screenStore

const route = useRoute()
const router = useRouter()

const role = ref<Role>(Role.blank())

const saveLoading = ref(false)
const loadingData = ref(false)
const permissionIds = ref<number[]>([])

const startFetchData = async (roleId: number) => {
  try {
    const rootRole = await RoleApi.detail(roleId)
    role.value = rootRole
    permissionIds.value = JSON.parse(rootRole.permissionIds || '[]')
  } catch (error) {
    console.log('🚀 ~ startFetchData ~ error:', error)
  }
}

onBeforeMount(async () => {
  const roleId = Number(route.params.id)
  if (roleId) {
    await startFetchData(roleId)
  }
  await permissionStore.fetchAll()
  loadingData.value = true
})

const handleSave = async () => {
  saveLoading.value = true
  try {
    permissionIds.value.sort()
    role.value.permissionIds = JSON.stringify(permissionIds.value)
    if (!role.value.id) {
      await RoleApi.createOne(role.value)
    } else {
      await RoleApi.updateOne(role.value.id, role.value)
    }
    message.success('Cập nhật vai trò thành công')
    router.push({ name: 'RoleList' })
  } catch (error) {
    console.log('🚀 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}
</script>

<template>
  <div class="page-header">
    <div class="page-header-content"><ScheduleOutlined /> Thông tin vai trò</div>
  </div>

  <form class="md:mx-4 mt-4 p-4 bg-white" @submit.prevent="handleSave">
    <div style="max-width: 800px">
      <div class="flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 100px; flex: none">Tên vai trò</div>
        <InputText v-model:value="role.name" required />
      </div>
      <div class="flex items-center mt-4">
        <div class="w-[100px] flex-none">Active</div>
        <a-switch
          :checked="Boolean(role.isActive)"
          @change="(checked: Boolean) => (role.isActive = checked ? 1 : 0)"
        />
        <div v-if="!role.isActive" class="ml-4">Tất cả user thuộc vai trò này tạm thời bị khóa</div>
      </div>
    </div>
    <div class="mt-8">
      <div style="font-weight: 500; font-size: 16px; text-transform: uppercase">
        Phân quyền vai trò
      </div>
    </div>
    <div class="mt-4 p-4" style="border: 1px solid #cdcdcd; border-radius: 4px">
      <a-tree
        v-if="loadingData"
        v-model:checkedKeys="permissionIds"
        default-expand-all
        checkable
        :selectable="false"
        virtual
        :height="500"
        :tree-data="permissionStore.permissionGroup()"
      >
      </a-tree>
    </div>
    <div class="mt-8">
      <a-button type="primary" htmlType="submit" :loading="saveLoading">
        <template #icon>
          <PlusOutlined />
        </template>
        Lưu lại
      </a-button>
    </div>
  </form>
</template>

<style>
.ant-tree-list-scrollbar {
  display: block !important;
}
</style>
