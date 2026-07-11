<script setup lang="ts">
import { IconApartment, IconForm } from '@/common/icon-antd'
import { InputSelect } from '@/common/vue-form'
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import VueTag from '@/common/VueTag.vue'
import { CONFIG } from '@/config'
import { UserApi, UserService, type User } from '@/modules/user'
import { BugDevelopment } from '@/views/component'
import { onBeforeMount, ref } from 'vue'
import ModalAccountUpsert from './ModalAccountUpsert.vue'

const modalAccountUpsert = ref<InstanceType<typeof ModalAccountUpsert>>()

const userList = ref<User[]>([])

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('DISTRIBUTOR_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const startFetchData = async (options?: { refetch?: boolean }) => {
  try {
    const { data, meta } = await UserService.pagination(
      {
        relation: {
          userRoleList: { role: true },
          userRoomList: { room: true },
        },
        page: page.value,
        limit: limit.value,
        sort: { id: 'ASC' },
      },
      { refetch: !!options?.refetch },
    )
    userList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: DistributorList.vue:65 ~ startFetchData ~ error:', error)
  }
}

onBeforeMount(async () => {
  try {
    dataLoading.value = true
    await startFetchData({ refetch: true })
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
  await startFetchData({ refetch: true })
}

const handleModalAccountUpsertSuccess = async (
  data: User,
  type: 'CREATE' | 'UPDATE' | 'DELETE',
) => {
  await startFetchData({ refetch: true })
}

const deviceLogout = async (userId: number, clientId: string) => {
  const result = await UserApi.deviceLogout(userId, clientId)
  await startFetchData()
}
</script>

<template>
  <ModalAccountUpsert ref="modalAccountUpsert" @success="handleModalAccountUpsertSuccess" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <IconApartment />
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
            <th v-if="CONFIG.MODE === 'development'">ID</th>
            <th>STT</th>
            <th>Username</th>
            <th>Họ Tên</th>
            <th>Vai trò</th>
            <th>Phòng</th>
            <th>Trạng thái</th>
            <th>Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="userList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(user, index) in userList" :key="user.id">
            <td class="text-center" v-if="CONFIG.MODE === 'development'">
              <BugDevelopment :data="user" />
            </td>
            <td class="text-center">{{ index + 1 }}</td>
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
            <td>
              <div>
                {{ user.userRoomList?.map((i) => i.room?.name).join(', ') }}
              </div>
            </td>
            <td class="text-center">
              <VueTag v-if="user.isActive" icon="check" color="green">Active</VueTag>
              <VueTag v-else icon="minus" color="orange">Active</VueTag>
            </td>
            <td class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalAccountUpsert?.openModal(user.id)"
              >
                <IconForm />
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="p-4 flex flex-wrap justify-end gap-4">
      <VuePagination
        v-model:page="page"
        :total="total"
        :limit="limit"
        @update:page="(p: any) => changePagination({ page: p, limit })"
      />
      <InputSelect
        v-model:value="limit"
        @update:value="(l: any) => changePagination({ page, limit: l })"
        :options="[
          { value: 10, label: '10 / page' },
          { value: 20, label: '20 / page' },
          { value: 50, label: '50 / page' },
          { value: 100, label: '100 / page' },
        ]"
      />
    </div>
  </div>
</template>
