<script setup lang="ts">
import { computed, onBeforeMount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueButton } from '../../../../common'
import { IconRight } from '../../../../common/icon-antd'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputCheckboxList, InputText, VueSwitch } from '../../../../common/vue-form'
import type { CheckboxOptionType } from '../../../../common/vue-form/InputCheckboxList.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { VueTabMenu, VueTabPanel, VueTabs } from '../../../../common/vue-tabs'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Permission, PermissionService } from '../../../../modules/permission'
import { Role, RoleService } from '../../../../modules/role'
import { UserService } from '../../../../modules/user'
import { Breadcrumb } from '../../../component'
import { CONFIG } from '@/config'

const TABS_KEY = {
  ROLE_INFORMATION: 'ROLE_INFORMATION',
  ROLE_PERMISSION: 'ROLE_PERMISSION',
}

const activeTab = ref(TABS_KEY.ROLE_INFORMATION)

const settingStore = useSettingStore()
const { isMobile } = settingStore

const route = useRoute()
const router = useRouter()

const role = ref<Role>(Role.blank())
const checkboxUserId = ref<Record<string, boolean>>({})
const checkboxUserIdOptions = ref<CheckboxOptionType[]>([])
const permissionAllTree = ref<Permission[]>([])

const randomId = computed(() => {
  return Math.random().toString(36).substring(2)
})

type Level1Checked = {
  permission: Permission
  checkedAll: boolean
  indeterminate: boolean
  level2Map: Record<string, boolean>
}

const checkedOptions = reactive<{
  checkedAll: boolean
  indeterminate: boolean
  level1Map: Record<string, Level1Checked>
}>({ checkedAll: false, indeterminate: false, level1Map: {} })

const saveLoading = ref(false)

const startFetchPermission = async (roleId?: number) => {
  const fetchPromise = await Promise.all([
    roleId
      ? RoleService.detail(roleId, {
          relation: { userRoleList: { user: true } },
        })
      : Role.blank(),
    UserService.list({ sort: { id: 'ASC' } }),
    PermissionService.getPermissionTree(),
  ])
  const [rolePromise, userAllPromise, permissionAllPromise] = fetchPromise

  checkboxUserIdOptions.value = userAllPromise.map((i) => ({ key: i.id, label: i.fullName }))

  role.value = rolePromise
  rolePromise.userRoleList?.forEach((i) => {
    checkboxUserId.value[i.userId] = true
  })

  const rolePermissionIdList: number[] = JSON.parse(rolePromise.permissionIds || '[]')
  const rolePermissionIdMap: Record<string, boolean> = {}
  rolePermissionIdList.forEach((i) => {
    rolePermissionIdMap[i] = true
  })

  permissionAllTree.value = permissionAllPromise

  permissionAllTree.value.forEach((parent) => {
    checkedOptions.level1Map[parent.id] = {
      permission: parent,
      indeterminate: false,
      checkedAll: rolePermissionIdMap[parent.id],
      level2Map: {},
    }
    parent.children.forEach((child) => {
      if (rolePermissionIdMap[parent.id] || rolePermissionIdMap[child.id]) {
        checkedOptions.level1Map[parent.id].level2Map[child.id] = true
      } else {
        checkedOptions.level1Map[parent.id].level2Map[child.id] = false
      }
    })
    refreshLevel1Checked(parent.id)
  })
  refreshRootChecked()
}

onBeforeMount(async () => {
  const roleId = Number(route.params.id)
  try {
    startFetchPermission(roleId)
  } catch (error) {
    console.log('🚀 ~ RoleUpsertContainer.vue:96 ~ onBeforeMount ~ error:', error)
  }
})

const handleSave = async () => {
  saveLoading.value = true
  try {
    const permissionIdCheckList: number[] = []
    Object.values(checkedOptions.level1Map).forEach((i) => {
      if (i.checkedAll) {
        return permissionIdCheckList.push(i.permission.id)
      }
      Object.keys(i.level2Map).forEach((k) => {
        if (i.level2Map[k]) {
          permissionIdCheckList.push(Number(k))
        }
      })
    })

    role.value.permissionIds = JSON.stringify(permissionIdCheckList)

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

const refreshRootChecked = () => {
  const level1Values = Object.values(checkedOptions.level1Map)
  const hasCheckedAll = level1Values.every((i) => i.checkedAll)
  const noCheckedAll = level1Values.every((i) => !i.checkedAll)
  if (hasCheckedAll) {
    checkedOptions.checkedAll = true
    checkedOptions.indeterminate = false
  } else if (noCheckedAll) {
    checkedOptions.checkedAll = false
    checkedOptions.indeterminate = false
  } else {
    checkedOptions.checkedAll = false
    checkedOptions.indeterminate = true
  }
}

const refreshLevel1Checked = (level1Id: number) => {
  const level1Current = checkedOptions.level1Map[level1Id]

  const level2Values = Object.values(level1Current.level2Map)

  const hasCheckedAll = level2Values.every((i) => i)
  const noCheckedAll = level2Values.every((i) => !i)

  if (hasCheckedAll) {
    level1Current.checkedAll = true
    level1Current.indeterminate = false
  } else if (noCheckedAll) {
    level1Current.checkedAll = false
    level1Current.indeterminate = false
  } else {
    level1Current.checkedAll = false
    level1Current.indeterminate = true
  }
}

const handleChangeCheckAll = (e: Event) => {
  const target = e.target as HTMLInputElement
  const checked = target.checked
  Object.values(checkedOptions.level1Map).forEach((level1) => {
    level1.checkedAll = checked
    level1.indeterminate = false
    Object.keys(level1.level2Map).forEach((c) => (level1.level2Map[c] = checked))
  })
}

const handleChangeCheckLevel1 = (e: Event, level1Id: number) => {
  const target = e.target as HTMLInputElement
  const checked = target.checked

  checkedOptions.level1Map[level1Id].checkedAll = checked
  checkedOptions.level1Map[level1Id].indeterminate = false

  const level2Map = checkedOptions.level1Map[level1Id].level2Map
  Object.keys(level2Map).forEach((key) => (level2Map[key] = checked))

  refreshRootChecked()
}

const handleChangeCheckLevel2 = (e: Event, level1Id: number, level2Id: number) => {
  const target = e.target as HTMLInputElement
  checkedOptions.level1Map[level1Id].level2Map[level2Id] = target.checked

  refreshLevel1Checked(level1Id)
  refreshRootChecked()
}
</script>

<template>
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:flex gap-2 items-center text-lg font-medium">
      <Breadcrumb />
      <IconRight style="font-size: 0.7em; opacity: 0.5" />
      <span>{{ role.name }}</span>
    </div>
    <div class="ml-auto flex items-center gap-8"></div>
  </div>

  <form class="md:mx-4 mt-4 p-4 bg-white" @submit.prevent="handleSave">
    <VueTabs v-model:tabShow="activeTab">
      <template #menu>
        <VueTabMenu :tabKey="TABS_KEY.ROLE_INFORMATION">Cài đặt chung</VueTabMenu>
        <VueTabMenu :tabKey="TABS_KEY.ROLE_PERMISSION">Phân quyền vai trò</VueTabMenu>
      </template>
      <template #panel>
        <VueTabPanel :tabKey="TABS_KEY.ROLE_INFORMATION">
          <div class="mt-4 p-4" style="max-width: 800px">
            <div class="flex" :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'">
              <div style="width: 100px; flex: none">Mã vai trò</div>
              <InputText v-model:value="role.roleCode" />
            </div>
            <div
              class="flex mt-4"
              :class="isMobile ? 'flex-col items-stretch mt-2' : 'items-center'"
            >
              <div style="width: 100px; flex: none">Tên vai trò</div>
              <InputText v-model:value="role.name" required />
            </div>
            <div class="flex items-center mt-4">
              <div class="w-[100px] flex-none">Active</div>
              <div>
                <VueSwitch v-model="role.isActive" type-parser="number" />
              </div>
              <div v-if="!role.isActive" class="ml-4">
                Tất cả user thuộc vai trò này tạm thời bị khóa
              </div>
            </div>
            <div class="flex mt-4">
              <div class="w-[100px] flex-none">Tài khoản</div>
              <div>
                <div v-if="CONFIG.MODE === 'development'" style="color: violet">
                  {{ JSON.stringify(checkboxUserId) }}
                </div>
                <InputCheckboxList
                  v-model:value="checkboxUserId"
                  :options="checkboxUserIdOptions"
                />
              </div>
            </div>
          </div>
        </VueTabPanel>
        <VueTabPanel :tabKey="TABS_KEY.ROLE_PERMISSION">
          <div class="mt-4">
            <div>
              <div style="font-weight: 500; font-size: 16px; text-transform: uppercase">
                Phân quyền vai trò
                <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                  {{ role.permissionIds }}
                </span>
              </div>
            </div>

            <div
              class="mt-4 table-wrapper"
              style="max-height: 600px; border-bottom: 1px solid #cdcdcd"
            >
              <table>
                <thead>
                  <tr>
                    <th style="width: 30px">
                      <div class="flex justify-center">
                        <input
                          style="cursor: pointer"
                          type="checkbox"
                          :checked="checkedOptions.checkedAll"
                          :indeterminate="checkedOptions.indeterminate"
                          @change="(e) => handleChangeCheckAll(e)"
                        />
                      </div>
                    </th>
                    <th class="text-center" colspan="2">Vai trò</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="level1 in permissionAllTree" :key="level1.id">
                    <tr style="user-select: none">
                      <td class="text-center">
                        <div class="flex justify-center">
                          <input
                            :id="randomId + '_' + level1.id"
                            style="cursor: pointer"
                            :indeterminate="checkedOptions.level1Map[level1.id].indeterminate"
                            :checked="checkedOptions.level1Map[level1.id].checkedAll"
                            type="checkbox"
                            @change="(e) => handleChangeCheckLevel1(e, level1.id)"
                          />
                        </div>
                      </td>
                      <td colspan="2" class="font-medium">
                        <label
                          style="cursor: pointer; user-select: none"
                          :for="randomId + '_' + level1.id"
                        >
                          {{ level1.name }}
                        </label>
                      </td>
                    </tr>
                    <template v-for="child in level1.children" :key="child.id">
                      <tr style="user-select: none">
                        <td></td>
                        <td class="text-center" style="width: 30px">
                          <div class="flex justify-center">
                            <input
                              :id="randomId + '_' + child.id"
                              style="cursor: pointer"
                              :checked="
                                checkedOptions.level1Map[level1.id].level2Map[child.id] ||
                                checkedOptions.level1Map[level1.id].checkedAll
                              "
                              type="checkbox"
                              @change="(e) => handleChangeCheckLevel2(e, level1.id, child.id)"
                            />
                          </div>
                        </td>
                        <td>
                          <label
                            style="cursor: pointer; user-select: none"
                            :for="randomId + '_' + child.id"
                          >
                            {{ child.name }}
                          </label>
                        </td>
                      </tr>
                    </template>
                  </template>
                </tbody>
              </table>
            </div>
          </div>
        </VueTabPanel>
      </template>
    </VueTabs>

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

<style></style>
