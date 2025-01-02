<script setup lang="ts">
import { NodeIndexOutlined } from '@ant-design/icons-vue'
import { onBeforeMount, ref } from 'vue'
import { IconSort } from '../../../../common/icon'
import { IconEditSquare } from '../../../../common/icon-google'
import { InputFilter, VueSelect } from '../../../../common/vue-form'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import {
  Commission,
  CommissionCalculatorType,
  CommissionService,
  RoleInteractType,
  RoleInteractTypeText,
} from '../../../../modules/commission'
import { Laboratory, LaboratoryService } from '../../../../modules/laboratory'
import { Procedure, ProcedureService } from '../../../../modules/procedure'
import { Product, ProductService } from '../../../../modules/product'
import { Radiology, RadiologyService } from '../../../../modules/radiology'
import { Role, RoleService } from '../../../../modules/role'
import { arrayToKeyValue } from '../../../../utils'
import ModalCommissionUpsert from '../upsert/ModalCommissionUpsert.vue'

const modalCommissionUpsert = ref<InstanceType<typeof ModalCommissionUpsert>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const commissionList = ref<Commission[]>([])
const roleMap = ref<Record<string, Role>>({})
const roleOptions = ref<{ value: number; text: string; data: Role }[]>([])

const procedureMap = ref<Record<string, Procedure>>({})
const productMap = ref<Record<string, Product>>({})
const radiologyMap = ref<Record<string, Radiology>>({})
const laboratoryMap = ref<Record<string, Laboratory>>({})

const dataLoading = ref(false)

const interactType = ref<RoleInteractType | null>(null)
const roleId = ref<number>()

const sortColumn = ref<'id' | 'interactType' | 'roleId' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const page = ref(1)
const limit = ref(10)
const total = ref(0)

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
          : undefined,
      },
      { refresh: false }
    )
    commissionList.value = response.data
    total.value = response.meta.total

    dataLoading.value = false

    const productIdList = commissionList.value
      .filter((i) => i.interactType === RoleInteractType.Product)
      .map((i) => i.interactId)
    const productList = await ProductService.list({ filter: { id: { IN: productIdList } } })
    commissionList.value.forEach((i) => {
      if (i.interactType !== RoleInteractType.Product) return
      i.product = productList.find((p) => p.id === i.interactId)
    })
  } catch (error) {
    console.log('🚀 ~ file: CommissionList.vue:73 ~ error:', error)
  }
}

onBeforeMount(async () => {
  startFetchData()

  RoleService.list({})
    .then((result) => {
      roleOptions.value = result.map((i) => ({ value: i.id, text: i.name, data: i }))
      roleMap.value = arrayToKeyValue(result, 'id')
    })
    .catch((e) => {
      console.log('🚀 ~ file: CommissionList.vue:84 ~ onBeforeMount ~ e:', e)
    })

  ProcedureService.getMap()
    .then((result) => (procedureMap.value = result))
    .catch((e) => console.log('🚀 ~ file: CommissionList.vue:98 ~ ProcedureService ~ e:', e))

  RadiologyService.getMap()
    .then((result) => (radiologyMap.value = result))
    .catch((e) => console.log('🚀 ~ file: CommissionList.vue:102 ~ RadiologyService ~ e:', e))

  LaboratoryService.getMap()
    .then((result) => (laboratoryMap.value = result))
    .catch((e) => console.log('🚀 ~ file: CommissionList.vue:106 ~ LaboratoryService ~ e:', e))
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
    @success="handleModalCommissionUpsertSuccess" />
  <div class="page-header">
    <div class="page-header-content">
      <div class="hidden md:block">
        <NodeIndexOutlined />
        Quản lý tiền hoa hồng
      </div>
    </div>
    <div class="page-header-setting"></div>
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
            @selectItem="handleSelectItemFilterRole">
            <template #option="{ item: { data } }">{{ data.name }}</template>
          </InputFilter>
        </div>
      </div>
      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn loại</div>
        <div>
          <VueSelect
            v-model:value="interactType"
            :options="[
              { text: 'Tất cả', value: null },
              { text: 'Phiếu khám', value: RoleInteractType.Ticket },
              { text: 'Sản phẩm', value: RoleInteractType.Product },
              { text: 'Dịch vụ', value: RoleInteractType.Procedure },
              { text: 'Phiếu CĐHA', value: RoleInteractType.Radiology },
              { text: 'Xét nghiệm', value: RoleInteractType.Laboratory },
            ]"
            @update:value="() => startSearch()"></VueSelect>
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
              {{
                RoleInteractTypeText[
                  RoleInteractType[commission.interactType] as keyof typeof RoleInteractTypeText
                ]
              }}
            </td>
            <td>
              <template v-if="commission.interactType === RoleInteractType.Product">
                {{ commission.product?.brandName }}
              </template>
              <template v-if="commission.interactType === RoleInteractType.Procedure">
                {{ procedureMap[commission.interactId]?.name }}
              </template>
              <template v-if="commission.interactType === RoleInteractType.Radiology">
                {{ radiologyMap[commission.interactId]?.name }}
              </template>
              <template v-if="commission.interactType === RoleInteractType.Laboratory">
                {{ laboratoryMap[commission.interactId]?.name }}
              </template>
            </td>
            <td class="text-center">
              {{ formatMoney(commission.commissionValue) }}
              {{
                commission.commissionCalculatorType === CommissionCalculatorType.VND ? 'VNĐ' : ''
              }}
              {{
                commission.commissionCalculatorType === CommissionCalculatorType.PercentRetail
                  ? '% Niêm Yết'
                  : ''
              }}
              {{
                commission.commissionCalculatorType === CommissionCalculatorType.PercentActual
                  ? '% Sau Chiết Khấu'
                  : ''
              }}
            </td>
            <td class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalCommissionUpsert?.openModal(commission.id)">
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
