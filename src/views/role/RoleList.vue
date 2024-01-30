<script setup lang="ts">
import {
  ApartmentOutlined,
  FileSearchOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import type { Role } from '../../modules/role'

const roleList = ref<Role[]>([])

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('DISTRIBUTOR_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const isActive = ref<1 | 0 | ''>(1)

const sortColumn = ref<'fullName' | 'debt' | 'id' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  // try {
  //   const response = await roleStore.pagination({
  //     page: page.value,
  //     limit: limit.value,
  //     filter: {
  //       isActive: isActive.value !== '' ? isActive.value : undefined,
  //       searchText: searchText.value ? searchText.value : undefined,
  //     },
  //     sort: sortValue.value
  //       ? {
  //           fullName: sortColumn.value === 'fullName' ? sortValue.value : undefined,
  //           id: sortColumn.value === 'id' ? sortValue.value : undefined,
  //           debt: sortColumn.value === 'debt' ? sortValue.value : undefined,
  //         }
  //       : { id: 'DESC' },
  //   })
  //   roleList.value = response.data
  //   total.value = response.total
  // } catch (error) {
  //   console.log('🚀 ~ file: DistributorList.vue:65 ~ startFetchData ~ error:', error)
  // }
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

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const handleInputSearchText = (event: any) => {
  searchText.value = event.target.value
  startSearch()
}

const handleSelectStatus = async (value: 1 | 0 | '') => {
  isActive.value = value
  await startSearch()
}

const changeSort = (column: 'fullName' | 'debt' | 'id') => {
  if (sortValue.value == 'DESC') {
    sortColumn.value = ''
    sortValue.value = ''
  } else if (sortValue.value == 'ASC') {
    sortColumn.value = column
    sortValue.value = 'DESC'
  } else {
    sortColumn.value = column
    sortValue.value = 'ASC'
  }
  startSearch()
}

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
      <a-button type="primary" @click="$router.push({ name: 'RoleUpsert', params: { id: 0 } })">
        <template #icon>
          <PlusOutlined />
        </template>
        Thêm mới
      </a-button>
    </div>
    <div class="page-header-setting">
      <a-dropdown trigger="click">
        <span>
          <SettingOutlined />
        </span>
        <template #overlay>
          <a-menu>
            <a-menu-item key="screen-setting"> Cài đặt hiển thị </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>

  <div class="page-main">
    <div class="page-main-table table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Tên vai trò</th>
            <th>Trạng thái</th>
            <th>Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="roleList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(role, index) in roleList" :key="index">
            <td class="text-center">DT{{ role.id }}</td>
            <td></td>
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
