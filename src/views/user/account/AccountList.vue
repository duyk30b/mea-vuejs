<script setup lang="ts">
import { ApartmentOutlined, FormOutlined } from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VueTag from '../../../common/VueTag.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { UserApi, type User } from '../../../modules/user'
import ModalAccountUpsert from './ModalAccountUpsert.vue'

const modalAccountUpsert = ref<InstanceType<typeof ModalAccountUpsert>>()

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
      relation: { userRoleList: { role: true } },
      page: page.value,
      limit: limit.value,
      sort: { id: 'ASC' },
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

const handleModalAccountUpsertSuccess = async (
  data: User,
  type: 'CREATE' | 'UPDATE' | 'DELETE'
) => {
  await startFetchData()
}

const deviceLogout = async (userId: number, refreshExp: number) => {
  const result = await UserApi.deviceLogout(userId, refreshExp)
  await startFetchData()
}
</script>

<template>
  <ModalAccountUpsert ref="modalAccountUpsert" @success="handleModalAccountUpsertSuccess" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <ApartmentOutlined />
        Danh sách tài khoản
      </div>
      <VueButton color="blue" icon="plus" @click="modalAccountUpsert?.openModal()">
        Thêm mới
      </VueButton>
    </div>
    <div class="page-header-setting"></div>
  </div>

  <div class="page-main">
    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Họ Tên</th>
            <th>Vai trò</th>
            <!-- <th>Thiết bị đăng nhập</th> -->
            <th>Trạng thái</th>
            <th>Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="userList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(user, index) in userList" :key="index">
            <td class="text-center">U{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.fullName }}</td>
            <td>
              <div>
                <VueTag v-if="user.isAdmin" color="cyan">Admin</VueTag>
              </div>
              <div>
                {{ user.userRoleList?.map((i) => i.role?.name).join(', ') }}
              </div>
            </td>
            <!-- <td>
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
                  <span>{{ device.ip }}</span>
                </div>
                <div class="flex gap-2">
                  <VueButton
                    class="ml-2"
                    size="small"
                    @click="deviceLogout(user.id!, device.refreshExp)">
                    Đăng xuất
                  </VueButton>
                  <VueTag v-if="device.online" color="success">Online</VueTag>
                  <VueTag v-if="!device.online" color="default">Offline</VueTag>
                </div>
              </div>
            </td> -->
            <td class="text-center">
              <VueTag v-if="user.isActive" icon="check" color="green">Active</VueTag>
              <VueTag v-else icon="minus" color="orange">Active</VueTag>
            </td>
            <td class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalAccountUpsert?.openModal(user.id)">
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
