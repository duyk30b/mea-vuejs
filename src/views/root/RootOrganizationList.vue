<script setup lang="ts">
import {
  AccountBookOutlined,
  CheckCircleOutlined,
  FormOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import { useScreenStore } from '../../modules/_me/screen.store'
import type { Organization } from '../../modules/organization'
import { RootOrganizationApi } from '../../modules/root-organization/root-organization.api'
import ModalRootOrganizationUpsert from './ModalRootOrganizationUpsert.vue'

const modalRootOrganizationUpsert = ref<InstanceType<typeof ModalRootOrganizationUpsert>>()

const screenStore = useScreenStore()
const { formatMoney, isMobile } = screenStore

const organizationList = ref<Organization[]>([])
const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('ORGANIZATION_PAGINATION_LIMIT')) || 50)
const total = ref(0)

const startFetchData = async () => {
  try {
    const { data, meta } = await RootOrganizationApi.pagination({
      page: page.value,
      limit: limit.value,
      // relation: { users: true },
      sort: { id: 'DESC' },
    })
    organizationList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: ProcedureList.vue:61 ~ error:', error)
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

const handleModalRootOrganizationUpsertSuccess = async (
  data: Organization,
  type: 'CREATE' | 'UPDATE' | 'CLEAR' | 'DELETE'
) => {
  await startFetchData()
}
</script>

<template>
  <ModalRootOrganizationUpsert
    ref="modalRootOrganizationUpsert"
    @success="handleModalRootOrganizationUpsertSuccess"
  />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block"><AccountBookOutlined /> Danh sách cơ sở</div>
      <a-button type="primary" @click="modalRootOrganizationUpsert?.openModal()">
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
            <th>Phone</th>
            <th>Email</th>
            <th>Name</th>
            <th>Address</th>
            <th>Trạng thái</th>
            <th>Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="organizationList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="(organization, i) in organizationList" :key="i">
            <td class="text-center">{{ organization.id }}</td>
            <td class="text-center">{{ organization.phone }}</td>
            <td>{{ organization.email }}</td>
            <td>{{ organization.name }}</td>
            <td>
              {{ organization.addressProvince }} - {{ organization.addressDistrict }} -
              {{ organization.addressWard }}
            </td>
            <td class="text-center">
              <a-tag v-if="organization.isActive" color="success">
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
                @click="modalRootOrganizationUpsert?.openModal(organization)"
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
