<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueButton from '../../../common/VueButton.vue'
import { IconApartment } from '../../../common/icon-antd'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputCheckboxList, InputText, VueSwitch } from '../../../common/vue-form'
import type { CheckboxOptionType } from '../../../common/vue-form/InputCheckboxList.vue'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { usePermissionStore } from '../../../modules/permission/permission.store'
import { Role, RoleService } from '../../../modules/role'
import { UserService } from '../../../modules/user'

const settingStore = useSettingStore()
const permissionStore = usePermissionStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()

const route = useRoute()
const router = useRouter()

const role = ref<Role>(Role.blank())
const checkboxUserId = ref<Record<string, boolean>>({})
const checkboxUserIdOptions = ref<CheckboxOptionType[]>([])

const saveLoading = ref(false)
const loadedPermission = ref(false)
const permissionIds = ref<number[]>([])

const treeSelectRole = computed(() => {
  const organizationPermissionIds: number[] = JSON.parse(meStore.organization.permissionIds)
  return permissionStore.permissionGroup().filter((i) => {
    return organizationPermissionIds.includes(i.rootId)
  })
})

const startFetchData = async (roleId?: number) => {
  UserService.list({ sort: { id: 'ASC' } })
    .then((result) => {
      checkboxUserIdOptions.value = result.map((i) => ({ key: i.id, label: i.fullName }))
    })
    .catch((e) => {
      console.log('🚀 ~ file: RoleUpsert.vue:42 ~ startFetchData ~ e:', e)
    })

  if (roleId) {
    RoleService.detail(roleId, {
      relation: { userRoleList: { user: true } },
    })
      .then((result) => {
        role.value = result

        result.userRoleList?.forEach((i) => {
          checkboxUserId.value[i.userId] = true
        })
        permissionIds.value = JSON.parse(result.permissionIds || '[]')
      })
      .catch((e: any) => {
        AlertStore.addError(e.message)
        console.log('🚀 ~ file: RoleUpsert.vue:52 ~ startFetchData ~ e:', e)
      })
  }

  permissionStore
    .fetchAll()
    .then((result) => {
      loadedPermission.value = true
    })
    .catch((e) => {
      console.log('🚀 ~ file: RoleUpsert.vue:64 ~ startFetchData ~ e:', e)
    })
}

onBeforeMount(async () => {
  const roleId = Number(route.params.id)
  await startFetchData(roleId)
})

const handleSave = async () => {
  saveLoading.value = true
  try {
    permissionIds.value.sort()
    role.value.permissionIds = JSON.stringify(permissionIds.value)

    const userIdList = Object.keys(checkboxUserId.value)
      .filter((id) => checkboxUserId.value[id])
      .map((i) => Number(i))
      .sort((a, b) => (a > b ? 1 : -1))

    if (!role.value.id) {
      await RoleService.createOne(role.value, userIdList)
    } else {
      await RoleService.updateOne(role.value.id, role.value, userIdList)
      AlertStore.addSuccess('Cập nhật vai trò thành công')
    }
    router.push({ name: 'RoleList' })
  } catch (error: any) {
    AlertStore.addError(error.message)
    console.log('🚀 ~ handleSave ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const clickDelete = () => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa vai trò này',
    content: 'Vai trò đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        await RoleService.destroyOne(role.value.id)
        router.push({ name: 'RoleList' })
      } catch (error) {
        console.log('🚀 ~ file: RoleUpsert.vue:82 ~ onOk ~ error:', error)
      }
    },
  })
}
</script>

<template>
  <div class="page-header">
    <div class="page-header-content">
      <IconApartment />
      Thông tin vai trò
    </div>
  </div>

  <form class="md:mx-4 mt-4 p-4 bg-white" @submit.prevent="handleSave">
    <div style="max-width: 800px">
      <div class="flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 100px; flex: none">Mã vai trò</div>
        <InputText v-model:value="role.roleCode" />
      </div>
      <div class="flex mt-4" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
        <div style="width: 100px; flex: none">Tên vai trò</div>
        <InputText v-model:value="role.name" required />
      </div>
      <div class="flex items-center mt-4">
        <div class="w-[100px] flex-none">Active</div>
        <div>
          <VueSwitch v-model="role.isActive" type-parser="number" />
        </div>
        <div v-if="!role.isActive" class="ml-4">Tất cả user thuộc vai trò này tạm thời bị khóa</div>
      </div>
      <div class="flex mt-4">
        <div class="w-[100px] flex-none">Tài khoản</div>
        <div>
          <InputCheckboxList v-model:value="checkboxUserId" :options="checkboxUserIdOptions" />
        </div>
      </div>
    </div>
    <div class="mt-8">
      <div style="font-weight: 500; font-size: 16px; text-transform: uppercase">
        Phân quyền vai trò
      </div>
    </div>
    <div class="mt-4 p-4" style="border: 1px solid #cdcdcd; border-radius: 4px">
      <a-tree
        v-if="loadedPermission"
        v-model:checkedKeys="permissionIds"
        default-expand-all
        checkable
        :selectable="false"
        virtual
        :height="500"
        :tree-data="treeSelectRole"
      ></a-tree>
    </div>
    <div class="mt-8 flex gap-4">
      <VueButton color="red" type="button" @click="clickDelete">Xóa</VueButton>
      <VueButton
        color="blue"
        type="submit"
        :loading="saveLoading"
        icon="save"
        style="margin-left: auto"
      >
        Lưu lại
      </VueButton>
    </div>
  </form>
</template>

<style>
.ant-tree-list-scrollbar {
  display: block !important;
}
</style>
