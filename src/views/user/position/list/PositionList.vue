<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import VuePagination from '../../../../common/VuePagination.vue'
import { IconSort } from '../../../../common/icon-font-awesome'
import { IconEditSquare } from '../../../../common/icon-google'
import { InputFilter, InputSelect } from '../../../../common/vue-form'
import { MeService } from '../../../../modules/_me/me.service'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Laboratory, LaboratoryService } from '../../../../modules/laboratory'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import {
  CommissionCalculatorType,
  CommissionCalculatorTypeText,
  Position,
  PositionService,
  PositionInteractType,
  PositionInteractTypeText,
} from '../../../../modules/position'
import { Procedure, ProcedureService } from '../../../../modules/procedure'
import { ProductService } from '../../../../modules/product'
import { Radiology, RadiologyService } from '../../../../modules/radiology'
import { Role, RoleService } from '../../../../modules/role'
import { ESArray, ESNumber, ESTypescript } from '../../../../utils'
import Breadcrumb from '../../../component/Breadcrumb.vue'
import ModalPositionUpsert from '../upsert/ModalPositionUpsert.vue'
import { CONFIG } from '@/config'

const modalPositionUpsert = ref<InstanceType<typeof ModalPositionUpsert>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, organizationPermission } = MeService

const positionList = ref<Position[]>([])
const roleMap = ref<Record<string, Role>>({})
const roleOptions = ref<{ value: number; text: string; data: Role }[]>([])

const procedureMap = ref<Record<string, Procedure>>({})
const radiologyMap = ref<Record<string, Radiology>>({})
const laboratoryMap = ref<Record<string, Laboratory>>({})

const dataLoading = ref(false)

const positionType = ref<PositionInteractType | null>(null)
const roleId = ref<number>()

const sortColumn = ref<'id' | 'positionType' | 'roleId' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const positionTypeOptions = ESTypescript.keysEnum(PositionInteractType).map((key) => ({
  value: PositionInteractType[key],
  label: PositionInteractTypeText[PositionInteractType[key]],
}))

const startFetchData = async () => {
  try {
    dataLoading.value = true
    const response = await PositionService.pagination(
      {
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
      { refetch: false },
    )
    positionList.value = response.data
    total.value = response.meta.total

    dataLoading.value = false

    const productIdList = positionList.value
      .filter((i) => i.positionType === PositionInteractType.Product)
      .map((i) => i.positionInteractId)
    const productList = await ProductService.list({ filter: { id: { IN: productIdList } } })

    positionList.value.forEach((i) => {
      if (i.positionType === PositionInteractType.Product) {
        i.product = productList.find((p) => p.id === i.positionInteractId)
      }
      if (i.positionType === PositionInteractType.Procedure) {
        i.procedure = procedureMap.value[i.positionInteractId]
      }
      if (i.positionType === PositionInteractType.Radiology) {
        i.radiology = radiologyMap.value[i.positionInteractId]
      }
      if (i.positionType === PositionInteractType.Laboratory) {
        i.laboratory = laboratoryMap.value[i.positionInteractId]
      }
    })
  } catch (error) {
    console.log('🚀 ~ file: CommissionList.vue:73 ~ error:', error)
  }
}

onBeforeMount(async () => {
  try {
    const fetchData = await Promise.all([
      RoleService.list({}),
      organizationPermission.value[PermissionId.PROCEDURE] ? ProcedureService.getMap() : {},
      organizationPermission.value[PermissionId.LABORATORY] ? LaboratoryService.getMap() : {},
      organizationPermission.value[PermissionId.RADIOLOGY] ? RadiologyService.getMap() : {},
    ])
    const roleList = fetchData[0]
    procedureMap.value = fetchData[1]
    radiologyMap.value = fetchData[2]
    laboratoryMap.value = fetchData[3]

    roleOptions.value = roleList.map((i) => ({ value: i.id, text: i.name, data: i }))
    roleMap.value = ESArray.arrayToKeyValue(roleList, 'id')
  } catch (error) {
    console.log('🚀 ~ CommissionList.vue:115 ~ onBeforeMount ~ error:', error)
  }

  startFetchData()
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

const handleSelectItemFilterRole = (item: any) => {
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
        v-if="userPermission[PermissionId.POSITION_CREATE]"
        color="blue"
        icon="plus"
        @click="modalPositionUpsert?.openModal()"
      >
        Thêm mới
      </VueButton>
    </div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn vai trò</div>
        <div>
          <InputFilter
            v-model:value="roleId"
            :options="roleOptions"
            :maxHeight="120"
            @selectItem="handleSelectItemFilterRole"
          >
            <template #option="{ item: { data } }">{{ data.name }}</template>
          </InputFilter>
        </div>
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
            <th>Giá</th>
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
            <td>{{ roleMap[position.roleId]?.name }}</td>
            <td>
              {{ PositionInteractTypeText[position.positionType] }}
            </td>
            <td>
              <template v-if="position.positionType === PositionInteractType.Product">
                {{ position.product?.brandName }}
              </template>
              <template v-if="position.positionType === PositionInteractType.Procedure">
                {{ position.procedure?.name }}
              </template>
              <template v-if="position.positionType === PositionInteractType.Radiology">
                {{ position.radiology?.name }}
              </template>
              <template v-if="position.positionType === PositionInteractType.Laboratory">
                {{ position.laboratory?.name }}
              </template>
            </td>
            <td class="text-center">
              <template v-if="position.positionType === PositionInteractType.Product">
                {{ formatMoney(position.product?.retailPrice) }}
              </template>
              <template v-if="position.positionType === PositionInteractType.Procedure">
                {{ formatMoney(position.procedure?.price) }}
              </template>
              <template v-if="position.positionType === PositionInteractType.Radiology">
                {{ formatMoney(position.radiology?.price) }}
              </template>
              <template v-if="position.positionType === PositionInteractType.Laboratory">
                {{ formatMoney(position.laboratory?.price) }}
              </template>
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
                @click="modalPositionUpsert?.openModal(position.id)"
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
