<script setup lang="ts">
import { ScheduleOutlined } from '@ant-design/icons-vue'
import { computed, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../common/VueButton.vue'
import { AlertStore } from '../../common/vue-alert/vue-alert.store'
import { InputText } from '../../common/vue-form'
import { useSettingStore } from '../../modules/_me/setting.store'
import { usePermissionStore } from '../../modules/permission/permission.store'
import { Role, RoleApi } from '../../modules/role'
import { useMeStore } from '../../modules/_me/me.store'

const settingStore = useSettingStore()
const permissionStore = usePermissionStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()

const route = useRoute()
const router = useRouter()

const role = ref<Role>(Role.blank())

const saveLoading = ref(false)
const loadingData = ref(false)
const permissionIds = ref<number[]>([])

const treeSelectRole = computed(() => {
  const organizationPermissionIds: number[] = JSON.parse(meStore.organization.permissionIds)
  return permissionStore.permissionGroup().filter((i) => {
    return organizationPermissionIds.includes(i.rootId)
  })
})

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
      AlertStore.addSuccess('Cập nhật vai trò thành công')
    }
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
    <div class="page-header-content">
      <ScheduleOutlined />
      Thông tin vai trò
    </div>
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
          @change="(checked: Boolean) => (role.isActive = checked ? 1 : 0)" />
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
        :tree-data="treeSelectRole"></a-tree>
    </div>
    <div class="mt-8">
      <VueButton color="blue" type="submit" :loading="saveLoading" icon="save">Lưu lại</VueButton>
    </div>
  </form>
</template>

<style>
.ant-tree-list-scrollbar {
  display: block !important;
}
</style>
