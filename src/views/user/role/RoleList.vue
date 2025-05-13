<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VueTag from '../../../common/VueTag.vue'
import { IconApartment, IconForm } from '../../../common/icon-antd'
import { useMeStore } from '../../../modules/_me/me.store'
import { RoleApi, type Role } from '../../../modules/role'

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
      relation: { userRoleList: { user: true } },
      page: page.value,
      limit: limit.value,
      filter: {},
      sort: { id: 'DESC' },
    })
    roleList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: RoleList.vue:35 ~ startFetchData ~ error:', error)
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
      <div class="hidden md:block">
        <IconApartment class="mr-1" />
        Danh sách vai trò
      </div>
      <VueButton color="blue" icon="plus" @click="$router.push({ name: 'RoleUpsert' })">
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
            <th>Tên vai trò</th>
            <th>Tên hiển thị</th>
            <th>Tài khoản</th>
            <th>Trạng thái</th>
            <th>Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="roleList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(role, index) in roleList" :key="index">
            <td class="text-center">R{{ role.id }}</td>
            <td>{{ role.name }}</td>
            <td>{{ role.displayName }}</td>
            <td>
              {{ role.userRoleList?.map((i) => i.user?.fullName).join(', ') }}
            </td>
            <td class="text-center">
              <VueTag v-if="role.isActive" icon="check" color="green">Active</VueTag>
              <VueTag v-else icon="minus" color="orange">Active</VueTag>
            </td>
            <td class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="$router.push({ name: 'RoleUpsert', params: { id: role.id } })"
              >
                <IconForm />
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
