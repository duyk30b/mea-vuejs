<script setup lang="ts">
import {
  AccountBookOutlined,
  CheckCircleOutlined,
  FormOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import { RootUserApi } from '../../modules/root-user/root-user.api'
import type { User } from '../../modules/user'
import ModalRootUserUpsert from './ModalRootUserUpsert.vue'

const modalRootUserUpsert = ref<InstanceType<typeof ModalRootUserUpsert>>()

const userList = ref<User[]>([])
const dataLoading = ref(false)

const page = ref(1)
const limit = ref(50)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await RootUserApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: { organization: true },
      sort: { oid: 'DESC' },
    })
    userList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ startFetchData ~ error:', error)
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
  if (options.limit) limit.value = options.limit

  await startFetchData()
}

const handleModalRootUserUpsertSuccess = async (
  data: User,
  type: 'CREATE' | 'UPDATE' | 'DELETE'
) => {
  await startFetchData()
}

const deviceLogout = async (params: { userId: number; code: string; oid: number }) => {
  const { userId, oid, code } = params
  const result = await RootUserApi.deviceLogout({ userId, code, oid })
  await startFetchData()
}
</script>

<template>
  <ModalRootUserUpsert ref="modalRootUserUpsert" @success="handleModalRootUserUpsertSuccess" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block"><AccountBookOutlined /> Danh sách User</div>
      <a-button type="primary" @click="modalRootUserUpsert?.openModal()">
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
            <th>OID</th>
            <th>Username</th>
            <th>Password</th>
            <th>OrgPhone</th>
            <th>OrgEmail</th>
            <th>OrgName</th>
            <th>Thiết bị đăng nhập</th>
            <th>Trạng thái</th>
            <th>Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="userList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(user, index) in userList" :key="index">
            <td class="text-center">{{ user.id }}</td>
            <td class="text-center">{{ user.oid }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.password }}</td>
            <td class="text-center">{{ user.organization?.phone }}</td>
            <td>{{ user.organization?.email }}</td>
            <td>{{ user.organization?.name }}</td>
            <td>
              <div v-for="(device, i) in user.devices" :key="i" class="mt-2">
                <div>
                  <span v-if="device.mobile === 1">
                    <font-awesome-icon :icon="['fas', 'mobile-screen-button']" />
                  </span>
                  <span v-else>
                    <font-awesome-icon :icon="['fas', 'desktop']" />
                  </span>
                  <span class="ml-2">{{ device.os }}</span> / <span>{{ device.browser }}</span>
                </div>
                <div>IP: {{ device.ip }}</div>
                <div>Time: {{ new Date(parseInt(device.code, 36)).toISOString() }}</div>
                <div>
                  <a-button
                    type="default"
                    size="small"
                    @click="deviceLogout({ userId: user.id!, code: device.code, oid: user.oid })"
                  >
                    Đăng xuất
                  </a-button>
                </div>
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
            <td class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalRootUserUpsert?.openModal(user)"
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
