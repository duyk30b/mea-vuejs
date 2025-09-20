<script setup lang="ts">
import { CONFIG } from '@/config'
import InputSearchRole from '@/views/component/InputSearchRole.vue'
import { onBeforeMount, onMounted, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import VuePagination from '../../../../common/VuePagination.vue'
import { IconSort } from '../../../../common/icon-font-awesome'
import { IconEditSquare } from '../../../../common/icon-google'
import { InputSelect } from '../../../../common/vue-form'
import { MeService } from '../../../../modules/_me/me.service'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Laboratory, LaboratoryService } from '../../../../modules/laboratory'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import {
  CommissionCalculatorType,
  CommissionCalculatorTypeText,
  Position,
  PositionService,
  PositionType,
  PositionTypeText,
} from '../../../../modules/position'
import { Procedure, ProcedureService } from '../../../../modules/procedure'
import { Radiology, RadiologyService } from '../../../../modules/radiology'
import { Role, RoleService } from '../../../../modules/role'
import { ESArray, ESNumber, ESTypescript } from '../../../../utils'
import Breadcrumb from '../../../component/Breadcrumb.vue'
import ModalPositionUpsert from '../upsert/ModalPositionUpsert.vue'

const modalPositionUpsert = ref<InstanceType<typeof ModalPositionUpsert>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, organizationPermission } = MeService

const positionList = ref<Position[]>([])
const roleMap = RoleService.roleMap

const dataLoading = ref(false)

const positionType = ref<PositionType | null>(null)
const roleId = ref<number>(0)

const sortColumn = ref<'id' | 'positionType' | 'roleId' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const positionTypeOptions = [
  { value: 0, label: 'Tất cả' },
  ...ESTypescript.keysEnum(PositionType).map((key) => ({
    value: PositionType[key],
    label: PositionTypeText[PositionType[key]],
  })),
]

const startFetchData = async (options?: { refetch: boolean }) => {
  try {
    dataLoading.value = true
    const response = await PositionService.pagination(
      {
        relation: {
          productRequest: true,
          regimenRequest: true,
          procedureRequest: true,
          procedureResult: true,
          laboratoryRequest: true,
          laboratoryGroupRequest: true,
          laboratoryGroupResult: true,
          radiologyRequest: true,
          radiologyResult: true,
        },
        page: page.value,
        limit: limit.value,
        filter: {
          roleId: roleId.value ? roleId.value : undefined,
          positionType: positionType.value ? positionType.value : undefined,
        },
        sort: sortValue.value
          ? {
              id: sortColumn.value === 'id' ? sortValue.value : undefined,
              positionType: sortColumn.value === 'positionType' ? sortValue.value : undefined,
              roleId: sortColumn.value === 'roleId' ? sortValue.value : undefined,
            }
          : { id: 'DESC' },
      },
      { refetch: !!options?.refetch },
    )
    positionList.value = response.data
    total.value = response.meta.total
  } catch (error) {
    console.log('🚀 ~ file: CommissionList.vue:73 ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

onMounted(async () => {
  RoleService.getMap()
  startFetchData({ refetch: true })
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const changeSort = async (column: 'id' | 'positionType' | 'roleId') => {
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

const handleModalPositionUpsertSuccess = async () => {
  await startFetchData()
}

const handleUpdateTextFilterRole = (text: string) => {
  if (!text) {
    startSearch()
  }
}

const handleSelectItemFilterRole = (roleId: number) => {
  startSearch()
}
</script>

<template>
  <ModalPositionUpsert ref="modalPositionUpsert" @success="handleModalPositionUpsertSuccess" />
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div class="">
      <VueButton
        v-if="userPermission[PermissionId.MASTER_DATA_POSITION]"
        color="blue"
        icon="plus"
        @click="modalPositionUpsert?.openModal({ mode: 'CREATE_API' })"
      >
        Thêm mới
      </VueButton>
    </div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 1; flex-basis: 250px">
        <InputSearchRole
          v-model:roleId="roleId"
          @update:roleId="handleSelectItemFilterRole"
        ></InputSearchRole>
      </div>
      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn loại</div>
        <div>
          <InputSelect
            v-model:value="positionType"
            :options="positionTypeOptions"
            @update:value="() => startSearch()"
          ></InputSelect>
        </div>
      </div>
    </div>
    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th
              v-if="CONFIG.MODE === 'development'"
              class="cursor-pointer"
              @click="changeSort('id')"
            >
              ID &nbsp;
              <IconSort :sort="sortColumn === 'id' ? sortValue : ''" />
            </th>
            <th>STT</th>
            <th class="cursor-pointer" @click="changeSort('roleId')">
              Vai trò &nbsp;
              <IconSort :sort="sortColumn === 'roleId' ? sortValue : ''" />
            </th>
            <th class="cursor-pointer" @click="changeSort('positionType')">
              Loại &nbsp;
              <IconSort :sort="sortColumn === 'positionType' ? sortValue : ''" />
            </th>
            <th>Tên DV/SP/...</th>
            <th>Độ ưu tiên</th>
            <th>Hoa hồng</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="positionList.length === 0">
            <td colspan="20" class="text-center">Không có bản ghi nào</td>
          </tr>
          <tr v-for="(position, index) in positionList" :key="position.id">
            <td v-if="CONFIG.MODE === 'development'" class="text-center" style="color: violet">
              {{ position.id }}
            </td>
            <td class="text-center">{{ index + 1 }}</td>
            <td>
              <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                ({{ position.roleId }})
              </span>
              <span>{{ roleMap[position.roleId]?.name }}</span>
            </td>
            <td
              :colspan="
                [PositionType.TicketReception, PositionType.TicketPrescriptionRequest].includes(
                  position.positionType,
                )
                  ? 2
                  : 1
              "
            >
              <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                ({{ position.positionType }})
              </span>
              <span>
                {{ PositionTypeText[position.positionType] }}
              </span>
            </td>
            <td
              v-if="
                ![PositionType.TicketReception, PositionType.TicketPrescriptionRequest].includes(
                  position.positionType,
                )
              "
            >
              <span v-if="CONFIG.MODE === 'development'" style="color: violet">
                ({{ position.positionInteractId }})
              </span>
              <template v-if="position.positionInteractId === 0">
                <span class="font-bold italic">Tất cả</span>
              </template>
              <template v-else-if="position.positionType === PositionType.ProductRequest">
                {{ position.productRequest?.brandName }} -
                {{ formatMoney(position.productRequest?.retailPrice) }}
              </template>
              <template v-else-if="position.positionType === PositionType.RegimenRequest">
                {{ position.regimenRequest?.name }}
              </template>
              <template v-else-if="position.positionType === PositionType.ProcedureRequest">
                {{ position.procedureRequest?.name }} -
                {{ formatMoney(position.procedureRequest?.price) }}
              </template>
              <template v-else-if="position.positionType === PositionType.ProcedureResult">
                {{ position.procedureResult?.name }} -
                {{ formatMoney(position.procedureResult?.price) }}
              </template>
              <template v-else-if="position.positionType === PositionType.LaboratoryRequest">
                {{ position.laboratoryRequest?.name }} -
                {{ formatMoney(position.laboratoryRequest?.price) }}
              </template>
              <template v-else-if="position.positionType === PositionType.LaboratoryGroupRequest">
                {{ position.laboratoryGroupRequest?.name }}
              </template>
              <template v-else-if="position.positionType === PositionType.LaboratoryGroupResult">
                {{ position.laboratoryGroupResult?.name }}
              </template>
              <template v-else-if="position.positionType === PositionType.RadiologyRequest">
                {{ position.radiologyRequest?.name }} -
                {{ formatMoney(position.radiologyRequest?.price) }}
              </template>
              <template v-else-if="position.positionType === PositionType.RadiologyResult">
                {{ position.radiologyResult?.name }} -
                {{ formatMoney(position.radiologyResult?.price) }}
              </template>
            </td>
            <td class="text-center">
              {{ position.priority }}
            </td>
            <td class="text-center">
              <template v-if="position.commissionCalculatorType === CommissionCalculatorType.VND">
                {{ formatMoney(position.commissionValue) }}
              </template>
              <template v-else>
                {{ ESNumber.format({ number: position.commissionValue }) }}
              </template>
              {{ CommissionCalculatorTypeText[position.commissionCalculatorType] }}
            </td>
            <td class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalPositionUpsert?.openModal({ mode: 'UPDATE_API', position })"
              >
                <IconEditSquare />
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
