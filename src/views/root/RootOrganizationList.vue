<script setup lang="ts">
import {
  AccountBookOutlined,
  CheckCircleOutlined,
  FormOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../common/VueButton.vue'
import { useSettingStore } from '../../modules/_me/setting.store'
import { OrganizationStatus, type Organization } from '../../modules/organization'
import { RootOrganizationApi } from '../../modules/root-organization/root-organization.api'
import ModalRootOrganizationUpsert from './ModalRootOrganizationUpsert.vue'
import { timeToText } from '../../utils'

const modalRootOrganizationUpsert = ref<InstanceType<typeof ModalRootOrganizationUpsert>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

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

const handleModalRootOrganizationUpsertSuccess = async () => {
  await startFetchData()
}
</script>

<template>
  <ModalRootOrganizationUpsert
    ref="modalRootOrganizationUpsert"
    @success="handleModalRootOrganizationUpsertSuccess" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <AccountBookOutlined />
        Danh sách cơ sở
      </div>
      <VueButton icon="plus" color="blue" @click="modalRootOrganizationUpsert?.openModal()">
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
            <th>Phone</th>
            <th>Email</th>
            <th>Name</th>
            <th>ExpiryDate</th>
            <th>Note</th>
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
            <td class="text-center">{{ timeToText(organization.expiryDate) }}</td>
            <td>{{ organization.note }}</td>
            <td class="text-center">
              <a-tag v-if="organization.status === OrganizationStatus.Inactive" color="default">
                <template #icon>
                  <CheckCircleOutlined />
                </template>
                Inactive
              </a-tag>
              <a-tag v-if="organization.status === OrganizationStatus.Active" color="processing">
                <template #icon>
                  <MinusCircleOutlined />
                </template>
                Active
              </a-tag>
              <a-tag v-if="organization.status === OrganizationStatus.Frequent" color="success">
                <template #icon>
                  <CheckCircleOutlined />
                </template>
                Frequent
              </a-tag>
            </td>
            <td class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalRootOrganizationUpsert?.openModal(organization)">
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
