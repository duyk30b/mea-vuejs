<script setup lang="ts">
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  FormOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import { RoleApi, type Role } from '../../modules/role'
import { PermissionId } from '../../modules/permission/permission.enum'
import { useMeStore } from '../../modules/_me/me.store'

const roleList = ref<Role[]>([])

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('DISTRIBUTOR_PAGINATION_LIMIT')) || 10)
const total = ref(0)
const meStore = useMeStore()
const { permissionIdMap } = meStore

const startFetchData = async () => {
  try {
    const { data, meta } = await RoleApi.pagination({
      page: page.value,
      limit: limit.value,
      filter: {},
      sort: { id: 'DESC' },
    })
    roleList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: RoleList.vue:32 ~ startFetchData ~ error:', error)
  }
}

onBeforeMount(async () => {
  try {
    dataLoading.value = true
    await startFetchData()
  } catch (error) {
    console.log('🚀 ~ onBeforeMount ~ error:', error)
  } finally {
    dataLoading.value = false
  }
})

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('DISTRIBUTOR_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}
</script>

<template>
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block"><ApartmentOutlined class="mr-1" /> Danh sách vai trò</div>
      <a-button
        v-if="permissionIdMap[PermissionId.ROLE_CREATE]"
        type="primary"
        @click="$router.push({ name: 'RoleUpsert' })"
      >
        <template #icon>
          <PlusOutlined />
        </template>
        Thêm mới
      </a-button>
    </div>
    <div class="page-header-setting"></div>
  </div>

  <div class="page-main">
    <div class="page-main-table table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên</th>
            <th>Trạng thái</th>
            <th v-if="permissionIdMap[PermissionId.ROLE_UPDATE]">Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="roleList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(role, index) in roleList" :key="index">
            <td class="text-center">R{{ role.id }}</td>
            <td>{{ role.name }}</td>
            <td class="text-center">
              <a-tag v-if="role.isActive" color="success">
                <template #icon>
                  <CheckCircleOutlined />
                </template>
                Active
              </a-tag>
              <a-tag v-else color="warning">
                <template #icon>
                  <MinusCircleOutlined />
                </template>
                Inactive
              </a-tag>
            </td>
            <td v-if="permissionIdMap[PermissionId.ROLE_UPDATE]" class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="$router.push({ name: 'RoleUpsert', params: { id: role.id } })"
              >
                <FormOutlined />
              </a>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="mt-4 float-right mb-2">
        <a-pagination
          v-model:current="page"
          v-model:pageSize="limit"
          :total="total"
          show-size-changer
          @change="(page: number, pageSize: number) => changePagination({ page, limit: pageSize })"
        />
      </div>
    </div>
  </div>
</template>
