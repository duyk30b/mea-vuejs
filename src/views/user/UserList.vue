<script setup lang="ts">
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  FormOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import { useMeStore } from '../../modules/_me/me.store'
import { PermissionId } from '../../modules/permission/permission.enum'
import { UserApi, type User } from '../../modules/user'
import ModalUserUpsert from './ModalUserUpsert.vue'

const modalUserUpsert = ref<InstanceType<typeof ModalUserUpsert>>()

const meStore = useMeStore()
const { permissionIdMap } = meStore

const userList = ref<User[]>([])

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('DISTRIBUTOR_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await UserApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: { role: true },
    })
    userList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: DistributorList.vue:65 ~ startFetchData ~ error:', error)
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

const handleModalUserUpsertSuccess = async (data: User, type: 'CREATE' | 'UPDATE' | 'DELETE') => {
  await startFetchData()
}

const deviceLogout = async (userId: number, code: string) => {
  const result = await UserApi.deviceLogout(userId, code)
  await startFetchData()
}
</script>

<template>
  <ModalUserUpsert ref="modalUserUpsert" @success="handleModalUserUpsertSuccess" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block"><ApartmentOutlined /> Danh sách tài khoản </div>
      <a-button
        v-if="permissionIdMap[PermissionId.USER_CREATE]"
        type="primary"
        @click="modalUserUpsert?.openModal()"
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
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Vai trò</th>
            <th>Username</th>
            <th>Họ Tên</th>
            <th v-if="permissionIdMap[PermissionId.USER_DEVICE_LOGOUT]">Thiết bị đăng nhập</th>
            <th>Trạng thái</th>
            <th v-if="permissionIdMap[PermissionId.USER_UPDATE]">Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="userList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(user, index) in userList" :key="index">
            <td class="text-center">U{{ user.id }}</td>
            <td>{{ user.role?.name }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.fullName }}</td>
            <td v-if="permissionIdMap[PermissionId.USER_DEVICE_LOGOUT]">
              <div v-for="(device, i) in user.devices" :key="i" class="mt-2">
                <span v-if="device.mobile === 1">
                  <font-awesome-icon :icon="['fas', 'mobile-screen-button']" />
                </span>
                <span v-else>
                  <font-awesome-icon :icon="['fas', 'desktop']" />
                </span>
                <span class="ml-2">{{ device.os }}</span>
                / <span>{{ device.browser }}</span> - <span>{{ device.ip }}</span>
                <a-button
                  class="ml-2"
                  type="default"
                  size="small"
                  @click="deviceLogout(user.id!, device.code)"
                >
                  Đăng xuất
                </a-button>
              </div>
            </td>
            <td class="text-center">
              <a-tag v-if="user.isActive" color="success">
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
            <td v-if="permissionIdMap[PermissionId.USER_UPDATE]" class="text-center">
              <a style="color: #eca52b" class="text-xl" @click="modalUserUpsert?.openModal(user)">
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
