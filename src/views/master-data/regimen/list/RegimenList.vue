<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import VueTag from '@/common/VueTag.vue'
import { IconFileSearch } from '@/common/icon-antd'
import { IconSort, IconSortChange, IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconEditSquare } from '@/common/icon-google'
import { InputSelect, InputText, VueSelect } from '@/common/vue-form'
import { CONFIG } from '@/config'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { PermissionId } from '@/modules/permission/permission.enum'
import { arrayToKeyValue } from '@/utils'
import { computed, onBeforeMount, ref } from 'vue'
import Breadcrumb from '../../../component/Breadcrumb.vue'
import ModalRegimenDetail from '../detail/ModalRegimenDetail.vue'
import ModalRegimenUpsert from '../upsert/ModalRegimenUpsert.vue'
import { RegimenService, type Regimen } from '@/modules/regimen'
import { DiscountType } from '@/modules/enum'

const modalRegimenUpsert = ref<InstanceType<typeof ModalRegimenUpsert>>()
const modalRegimenDetail = ref<InstanceType<typeof ModalRegimenDetail>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const regimenList = ref<Regimen[]>([])

const dataLoading = ref(false)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PROCEDURE_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const searchText = ref('')
const regimenGroupId = ref<number>(0)
const isActive = ref<1 | 0 | ''>(1)

const sortColumn = ref<'id' | 'code' | 'name' | 'price' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const startFetchData = async (options?: { refetch?: boolean }) => {
  try {
    dataLoading.value = true
    const response = await RegimenService.pagination(
      {
        page: page.value,
        limit: limit.value,
        relation: { regimenItemList: { procedure: true }, discountList: true },
        filter: {
          isActive: isActive.value !== '' ? isActive.value : undefined,
          name: searchText.value ? { LIKE: searchText.value } : undefined,
        },
        sort: sortValue.value
          ? {
              id: sortColumn.value === 'id' ? sortValue.value : undefined,
              code: sortColumn.value === 'code' ? sortValue.value : undefined,
              name: sortColumn.value === 'name' ? sortValue.value : undefined,
              price: sortColumn.value === 'price' ? sortValue.value : undefined,
            }
          : { code: 'ASC' },
      },
      { refetch: !!options?.refetch },
    )
    regimenList.value = response.data
    total.value = response.meta.total

    dataLoading.value = false
  } catch (error) {
    console.log('🚀 ~ file: RegimenList.vue:73 ~ error:', error)
  }
}

onBeforeMount(async () => {
  await startFetchData({ refetch: true })
})

const startSearch = async () => {
  page.value = 1
  await startFetchData()
}

const changeSort = async (column: 'id' | 'code' | 'name' | 'price') => {
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
    localStorage.setItem('PROCEDURE_PAGINATION_LIMIT', String(options.limit))
  }
  await startFetchData()
}

const handleModalRegimenUpsertSuccess = async () => {
  await startFetchData()
}
</script>

<template>
  <ModalRegimenUpsert ref="modalRegimenUpsert" @success="handleModalRegimenUpsertSuccess" />
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div>
      <VueButton
        v-if="userPermission[PermissionId.MASTER_DATA_REGIMEN]"
        color="blue"
        icon="plus"
        @click="modalRegimenUpsert?.openModal()"
      >
        Thêm mới
      </VueButton>
    </div>
    <div class="ml-auto flex items-center gap-8"></div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 2; flex-basis: 500px">
        <div>Tìm kiếm</div>
        <div>
          <InputText v-model:value="searchText" @update:value="startSearch" />
        </div>
      </div>

      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn trạng thái</div>
        <div>
          <VueSelect
            v-model:value="isActive"
            :options="[
              { text: 'Tất cả', value: '' },
              { text: 'Active', value: 1 },
              { text: 'Inactive', value: 0 },
            ]"
            @update:value="startSearch"
          />
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
              <div class="flex items-center gap-1 justify-center">
                <span>ID</span>
                <IconSortChange :sort="sortColumn === 'id' ? sortValue : ''" />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('code')">
              <div class="flex items-center gap-1 justify-center">
                <span>Mã DV</span>
                <IconSortChange :sort="sortColumn === 'code' ? sortValue : ''" />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('name')">
              <div class="flex items-center gap-1 justify-center">
                <span>Tên</span>
                <IconSortChange :sort="sortColumn === 'name' ? sortValue : ''" />
              </div>
            </th>
            <th class="cursor-pointer" @click="changeSort('price')">
              <div class="flex items-center gap-1 justify-center">
                <span>Giá</span>
                <IconSortChange :sort="sortColumn === 'price' ? sortValue : ''" />
              </div>
            </th>
            <th>Khuyến mại</th>
            <th>Trạng thái</th>
            <th v-if="userPermission[PermissionId.MASTER_DATA_REGIMEN]">Sửa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="regimenList.length === 0">
            <td colspan="20" class="text-center">No data</td>
          </tr>
          <tr v-for="regimen in regimenList" :key="regimen.id">
            <td class="text-center" v-if="CONFIG.MODE === 'development'" style="color: violet">
              {{ regimen.id }}
            </td>
            <td class="text-center">{{ regimen.code }}</td>
            <td>
              <div class="font-bold">{{ regimen.name }}</div>
              <div v-for="regimenItem in regimen.regimenItemList" :key="regimenItem.id">
                - {{ regimenItem.procedure?.name }} x {{ regimenItem.quantity }}
              </div>
            </td>
            <td class="text-right">
              <div
                class="text-xs italic line-through"
                style="color: var(--text-red)"
                v-if="regimen.totalMoney !== regimen.totalMoneyAfterDiscount"
              >
                {{ formatMoney(regimen.totalMoney) }}
              </div>
              <div>{{ formatMoney(regimen.totalMoneyAfterDiscount) }}</div>
            </td>
            <td class="text-center">
              <VueTag
                v-if="
                  regimen.discountApply?.discountMoney &&
                  regimen.discountApply.discountType === DiscountType.VND
                "
                color="blue"
              >
                {{ formatMoney(regimen.discountApply?.discountMoney) }}
              </VueTag>
              <VueTag
                v-if="
                  regimen.discountApply?.discountPercent &&
                  regimen.discountApply.discountType === DiscountType.Percent
                "
                color="blue"
              >
                {{ regimen.discountApply?.discountPercent + ' %' }}
              </VueTag>
            </td>
            <td class="text-center">
              <VueTag v-if="regimen.isActive" icon="check" color="green">Active</VueTag>
              <VueTag v-else icon="minus" color="orange">Active</VueTag>
            </td>
            <td v-if="userPermission[PermissionId.PRODUCT_UPDATE]" class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalRegimenUpsert?.openModal(regimen.id)"
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
        class="ml-auto"
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
