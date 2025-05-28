<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { IconSort } from '../../../../common/icon-font-awesome'
import { IconEditSquare } from '../../../../common/icon-google'
import { InputFilter, InputSelect } from '../../../../common/vue-form'
import VuePagination from '../../../../common/VuePagination.vue'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import {
  Commission,
  CommissionCalculatorType,
  CommissionCalculatorTypeText,
  CommissionService,
  InteractType,
  InteractTypeText,
} from '../../../../modules/commission'
import { Laboratory, LaboratoryService } from '../../../../modules/laboratory'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Procedure, ProcedureService } from '../../../../modules/procedure'
import { ProductService } from '../../../../modules/product'
import { Radiology, RadiologyService } from '../../../../modules/radiology'
import { Role, RoleService } from '../../../../modules/role'
import { arrayToKeyValue, ESNumber, keysEnum } from '../../../../utils'
import Breadcrumb from '../../../component/Breadcrumb.vue'
import ModalCommissionUpsert from '../upsert/ModalCommissionUpsert.vue'
import VueButton from '../../../../common/VueButton.vue'

const modalCommissionUpsert = ref<InstanceType<typeof ModalCommissionUpsert>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const commissionList = ref<Commission[]>([])
const roleMap = ref<Record<string, Role>>({})
const roleOptions = ref<{ value: number; text: string; data: Role }[]>([])

const procedureMap = ref<Record<string, Procedure>>({})
const radiologyMap = ref<Record<string, Radiology>>({})
const laboratoryMap = ref<Record<string, Laboratory>>({})

const dataLoading = ref(false)

const interactType = ref<InteractType | null>(null)
const roleId = ref<number>()

const sortColumn = ref<'id' | 'interactType' | 'roleId' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const interactTypeOptions = keysEnum(InteractType).map((key) => ({
  value: InteractType[key],
  label: InteractTypeText[InteractType[key]],
}))

const startFetchData = async () => {
  try {
    dataLoading.value = true
    const response = await CommissionService.pagination(
      {
        page: page.value,
        limit: limit.value,
        filter: {
          roleId: roleId.value ? roleId.value : undefined,
          interactType: interactType.value ? interactType.value : undefined,
        },
        sort: sortValue.value
          ? {
              id: sortColumn.value === 'id' ? sortValue.value : undefined,
              interactType: sortColumn.value === 'interactType' ? sortValue.value : undefined,
              roleId: sortColumn.value === 'roleId' ? sortValue.value : undefined,
            }
          : { id: 'DESC' },
      },
      { refresh: false },
    )
    commissionList.value = response.data
    total.value = response.meta.total

    dataLoading.value = false

    const productIdList = commissionList.value
      .filter((i) => i.interactType === InteractType.Product)
      .map((i) => i.interactId)
    const productList = await ProductService.list({ filter: { id: { IN: productIdList } } })

    commissionList.value.forEach((i) => {
      if (i.interactType === InteractType.Product) {
        i.product = productList.find((p) => p.id === i.interactId)
      }
      if (i.interactType === InteractType.Procedure) {
        i.procedure = procedureMap.value[i.interactId]
      }
      if (i.interactType === InteractType.Radiology) {
        i.radiology = radiologyMap.value[i.interactId]
      }
      if (i.interactType === InteractType.Laboratory) {
        i.laboratory = laboratoryMap.value[i.interactId]
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
      ProcedureService.getMap(),
      RadiologyService.getMap(),
      LaboratoryService.getMap(),
    ])
    const roleList = fetchData[0]
    procedureMap.value = fetchData[1]
    radiologyMap.value = fetchData[2]
    laboratoryMap.value = fetchData[3]

    roleOptions.value = roleList.map((i) => ({ value: i.id, text: i.name, data: i }))
    roleMap.value = arrayToKeyValue(roleList, 'id')
  } catch (error) {
    console.log('🚀 ~ CommissionList.vue:115 ~ onBeforeMount ~ error:', error)
  }

  startFetchData()
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const changeSort = async (column: 'id' | 'interactType' | 'roleId') => {
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

const handleModalCommissionUpsertSuccess = async () => {
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
  <ModalCommissionUpsert
    ref="modalCommissionUpsert"
    @success="handleModalCommissionUpsertSuccess"
  />
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div class="">
      <VueButton
        v-if="permissionIdMap[PermissionId.COMMISSION_CRUD]"
        color="blue"
        icon="plus"
        @click="modalCommissionUpsert?.openModal()"
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
            v-model:value="interactType"
            :options="interactTypeOptions"
            @update:value="() => startSearch()"
          ></InputSelect>
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
            <th class="cursor-pointer" @click="changeSort('roleId')">
              Vai trò &nbsp;
              <IconSort :sort="sortColumn === 'roleId' ? sortValue : ''" />
            </th>
            <th class="cursor-pointer" @click="changeSort('interactType')">
              Loại &nbsp;
              <IconSort :sort="sortColumn === 'interactType' ? sortValue : ''" />
            </th>
            <th>Tên DV/SP/...</th>
            <th>Giá</th>
            <th>Hoa hồng</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="commissionList.length === 0">
            <td colspan="20" class="text-center">Không có bản ghi nào</td>
          </tr>
          <tr v-for="(commission, i) in commissionList" :key="i">
            <td class="text-center">CO{{ commission.id }}</td>
            <td>{{ roleMap[commission.roleId]?.name }}</td>
            <td>
              {{ InteractTypeText[commission.interactType] }}
            </td>
            <td>
              <template v-if="commission.interactType === InteractType.Product">
                {{ commission.product?.brandName }}
              </template>
              <template v-if="commission.interactType === InteractType.Procedure">
                {{ commission.procedure?.name }}
              </template>
              <template v-if="commission.interactType === InteractType.Radiology">
                {{ commission.radiology?.name }}
              </template>
              <template v-if="commission.interactType === InteractType.Laboratory">
                {{ commission.laboratory?.name }}
              </template>
            </td>
            <td class="text-center">
              <template v-if="commission.interactType === InteractType.Product">
                {{ formatMoney(commission.product?.retailPrice) }}
              </template>
              <template v-if="commission.interactType === InteractType.Procedure">
                {{ formatMoney(commission.procedure?.price) }}
              </template>
              <template v-if="commission.interactType === InteractType.Radiology">
                {{ formatMoney(commission.radiology?.price) }}
              </template>
              <template v-if="commission.interactType === InteractType.Laboratory">
                {{ formatMoney(commission.laboratory?.price) }}
              </template>
            </td>
            <td class="text-center">
              <template v-if="commission.commissionCalculatorType === CommissionCalculatorType.VND">
                {{ formatMoney(commission.commissionValue) }}
              </template>
              <template v-else>
                {{ ESNumber.format({ number: commission.commissionValue }) }}
              </template>
              {{ CommissionCalculatorTypeText[commission.commissionCalculatorType] }}
            </td>
            <td class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalCommissionUpsert?.openModal(commission.id)"
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
