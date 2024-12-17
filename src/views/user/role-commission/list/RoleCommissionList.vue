<script setup lang="ts">
import { NodeIndexOutlined } from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconSort } from '../../../../common/icon'
import { IconEditSquare } from '../../../../common/icon-google'
import { VueSelect } from '../../../../common/vue-form'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Role, RoleService } from '../../../../modules/role'
import {
  CommissionCalculatorType,
  RoleCommission,
  RoleCommissionService,
  RoleInteractType,
  RoleInteractTypeText,
  RoleScreenType,
  RoleScreenTypeText,
} from '../../../../modules/role-commission'
import ModalRoleCommissionUpsert from '../upsert/ModalRoleCommissionUpsert.vue'

const modalRoleCommissionUpsert = ref<InstanceType<typeof ModalRoleCommissionUpsert>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const roleCommissionList = ref<RoleCommission[]>([])
const roleMap = ref<Record<string, Role>>({})

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const roleCommissionGroupId = ref<number>(0)
const isActive = ref<1 | 0 | ''>(1)

const sortColumn = ref<'id' | 'roleInteractType' | 'roleId' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async () => {
  try {
    dataLoading.value = true
    const response = await RoleCommissionService.pagination(
      {
        page: page.value,
        limit: limit.value,
        filter: {},
        sort: sortValue.value
          ? {
              id: sortColumn.value === 'id' ? sortValue.value : undefined,
              roleInteractType:
                sortColumn.value === 'roleInteractType' ? sortValue.value : undefined,
              roleId: sortColumn.value === 'roleId' ? sortValue.value : undefined,
            }
          : undefined,
      },
      { refresh: false }
    )
    roleCommissionList.value = response.data
    total.value = response.meta.total

    dataLoading.value = false
  } catch (error) {
    console.log('🚀 ~ file: RoleCommissionList.vue:73 ~ error:', error)
  }
}

onBeforeMount(async () => {
  await startFetchData()
  try {
    roleMap.value = await RoleService.getMap()
  } catch (error) {
    console.log('🚀 ~ file: RoleCommissionList.vue:83 ~ onBeforeMount ~ error:', error)
  }
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const changeSort = async (column: 'id' | 'roleInteractType' | 'roleId') => {
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
  await startSearch()
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
  }
  await startFetchData()
}

const handleModalRoleCommissionUpsertSuccess = async () => {
  await startFetchData()
}
</script>

<template>
  <ModalRoleCommissionUpsert
    ref="modalRoleCommissionUpsert"
    @success="handleModalRoleCommissionUpsertSuccess" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <NodeIndexOutlined />
        Quản lý vị trí và hoa hồng
      </div>
      <VueButton
        v-if="permissionIdMap[PermissionId.MASTER_DATA_PROCEDURE]"
        color="blue"
        icon="plus"
        @click="modalRoleCommissionUpsert?.openModal()">
        Thêm mới
      </VueButton>
    </div>
    <div class="page-header-setting"></div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn nhóm</div>
        <div>
          <VueSelect
            v-model:value="roleCommissionGroupId"
            :options="[]"
            @update:value="startSearch" />
        </div>
      </div>
    </div>
    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')">
              ID &nbsp;
              <IconSort :sort="sortColumn === 'id' ? sortValue : ''" />
            </th>
            <th class="cursor-pointer" @click="changeSort('roleInteractType')">
              Loại &nbsp;
              <IconSort :sort="sortColumn === 'roleInteractType' ? sortValue : ''" />
            </th>
            <th class="cursor-pointer" @click="changeSort('roleId')">
              Vai trò &nbsp;
              <IconSort :sort="sortColumn === 'roleId' ? sortValue : ''" />
            </th>
            <th>Màn hình / Tên DV</th>
            <th>Hoa hồng</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="roleCommissionList.length === 0">
            <td colspan="20" class="text-center">Không có bản ghi nào</td>
          </tr>
          <tr v-for="(roleCommission, i) in roleCommissionList" :key="i">
            <td class="text-center">{{ roleCommission.id }}</td>
            <td>
              {{
                RoleInteractTypeText[
                  RoleInteractType[
                    roleCommission.roleInteractType
                  ] as keyof typeof RoleInteractTypeText
                ]
              }}
            </td>
            <td>{{ roleMap[roleCommission.roleId]?.name }}</td>
            <td>
              <div v-if="roleCommission.roleInteractType === RoleInteractType.Ticket">
                {{
                  RoleScreenTypeText[
                    RoleScreenType[roleCommission.itemId] as keyof typeof RoleScreenTypeText
                  ]
                }}
              </div>
            </td>
            <td class="text-center">
              {{ formatMoney(roleCommission.commissionValue) }}
              {{
                roleCommission.commissionCalculatorType === CommissionCalculatorType.VND
                  ? 'VNĐ'
                  : '%'
              }}
            </td>
            <td class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalRoleCommissionUpsert?.openModal(roleCommission.id)">
                <IconEditSquare />
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
