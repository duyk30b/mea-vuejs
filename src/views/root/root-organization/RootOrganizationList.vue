<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import VueTag from '@/common/VueTag.vue'
import { IconApartment, IconBug, IconDollar, IconForm } from '@/common/icon-antd'
import { InputSelect } from '@/common/vue-form'
import { useSettingStore } from '@/modules/_me/setting.store'
import { OrganizationStatus, type Organization } from '@/modules/organization'
import { RootOrganizationApi } from '@/modules/root-organization/root-organization.api'
import { ESString, timeToText } from '@/utils'
import { onBeforeMount, ref } from 'vue'
import ModalRootOrganizationUpsert from './ModalRootOrganizationUpsert.vue'
import { CONFIG } from '@/config'
import { VueTooltip } from '@/common/popover'
import ModalOrganizationPayment from './ModalOrganizationPayment.vue'

const modalRootOrganizationUpsert = ref<InstanceType<typeof ModalRootOrganizationUpsert>>()
const modalOrganizationPayment = ref<InstanceType<typeof ModalOrganizationPayment>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const organizationList = ref<Organization[]>([])
const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('ORGANIZATION_PAGINATION_LIMIT')) || 50)
const total = ref(0)

const startFetchData = async () => {
  try {
    const paginationResult = await RootOrganizationApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {
        organizationPaymentList: true,
        userList: false,
      },
      sort: { id: 'DESC' },
    })
    organizationList.value = paginationResult.organizationList
    total.value = paginationResult.total
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
const handleModalOrganizationPaymentSuccess = async () => {
  await startFetchData()
}
</script>

<template>
  <ModalRootOrganizationUpsert
    ref="modalRootOrganizationUpsert"
    @success="handleModalRootOrganizationUpsertSuccess"
  />
  <ModalOrganizationPayment
    ref="modalOrganizationPayment"
    @success="handleModalOrganizationPaymentSuccess"
  />
  <div class="page-header">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2 font-medium text-xl">
        <IconApartment />
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
            <th v-if="CONFIG.MODE === 'development'"></th>
            <th>ID</th>
            <th>OrganizationCode</th>
            <th>Phone</th>
            <th>Name</th>
            <th>ExpiryDate</th>
            <th>T.Toán</th>
            <th>Note</th>
            <th>Trạng thái</th>
            <th>Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="organizationList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="organization in organizationList" :key="organization.id">
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              <VueTooltip>
                <template #trigger>
                  <IconBug width="1.2em" height="1.2em" />
                </template>
                <div style="max-height: 600px; max-width: 800px; overflow-y: scroll">
                  <pre>{{ JSON.stringify(organization, null, 4) }}</pre>
                </div>
              </VueTooltip>
            </td>
            <td class="text-center">{{ organization.id }}</td>
            <td class="text-center">{{ organization.organizationCode }}</td>
            <td class="text-center">{{ organization.phone }}</td>
            <td>{{ organization.name }}</td>
            <td class="text-center">{{ timeToText(organization.expiryDate) }}</td>
            <td class="text-center">
              <div class="flex gap-2 justify-end items-center">
                <span style="font-weight: 500">
                  {{
                    ESString.formatMoney(
                      (organization.organizationPaymentList || []).reduce((acc, item) => {
                        return acc + item.money
                      }, 0),
                    )
                  }}
                </span>
                <a class="text-xl" @click="modalOrganizationPayment?.openModal(organization)">
                  <IconDollar />
                </a>
              </div>
            </td>
            <td>{{ organization.note }}</td>
            <td class="text-center">
              <VueTag
                v-if="organization.status === OrganizationStatus.Inactive"
                icon="minus"
                color="orange"
              >
                Inactive
              </VueTag>
              <VueTag
                v-if="organization.status === OrganizationStatus.Active"
                icon="check"
                color="green"
              >
                Active
              </VueTag>
              <VueTag
                v-if="organization.status === OrganizationStatus.Frequent"
                icon="clock"
                color="purple"
              >
                Frequent
              </VueTag>
            </td>
            <td class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalRootOrganizationUpsert?.openModal(organization)"
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
