<script setup lang="ts">
import {
  AccountBookOutlined,
  CheckCircleOutlined,
  FormOutlined,
  MinusCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { RootUserApi } from '../../modules/root-user/root-user.api'
import type { User } from '../../modules/user'
import ModalRootUserUpsert from './ModalRootUserUpsert.vue'
import { DTimer } from '../../utils'

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

const deviceLogout = async (params: { userId: number; refreshExp: number; oid: number }) => {
  const { userId, oid, refreshExp } = params
  const result = await RootUserApi.deviceLogout({ userId, refreshExp, oid })
  await startFetchData()
}

const logoutAll = async () => {
  const result = await RootUserApi.logoutAll()
  await startFetchData()
}
</script>

<template>
  <ModalRootUserUpsert ref="modalRootUserUpsert" @success="handleModalRootUserUpsertSuccess" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <AccountBookOutlined />
        Danh sách User
      </div>
      <VueButton color="blue" icon="plus" @click="modalRootUserUpsert?.openModal()">
        Thêm mới
      </VueButton>

      <VueButton color="red" icon="send" @click="logoutAll">Đăng xuất tất cả</VueButton>
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
                  <span class="ml-2">{{ device.os }}</span>
                  /
                  <span>{{ device.browser }}</span>
                  -
                  <span>Exp {{ DTimer.timeToText(device.refreshExp) }}</span>
                </div>
                <div>IP: {{ device.ip }}</div>
                <div v-if="device.online !== true">
                  <HistoryOutlined class="mr-1" />
                  {{ new Date(device.online as number).toISOString() }}
                </div>
                <div class="flex gap-2">
                  <VueButton
                    size="small"
                    @click="
                      deviceLogout({
                        userId: user.id!,
                        refreshExp: device.refreshExp,
                        oid: user.oid,
                      })
                    ">
                    Đăng xuất
                  </VueButton>
                  <a-tag v-if="device.online === true" color="success">Online</a-tag>
                  <a-tag v-else color="default">Offline</a-tag>
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
                @click="modalRootUserUpsert?.openModal(user)">
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
          @change="
            (page: number, pageSize: number) => changePagination({ page, limit: pageSize })
          " />
      </div>
    </div>
  </div>
</template>
