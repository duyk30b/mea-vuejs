<script setup lang="ts">
import {
  Discount,
  DiscountInteractType,
  DiscountInteractTypeText,
  DiscountRepeatType,
  DiscountService,
} from '@/modules/discount'
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import VuePagination from '../../../../common/VuePagination.vue'
import { IconSort } from '../../../../common/icon-font-awesome'
import { IconEditSquare } from '../../../../common/icon-google'
import { InputSelect } from '../../../../common/vue-form'
import { MeService } from '../../../../modules/_me/me.service'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { LaboratoryService } from '../../../../modules/laboratory'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { ProcedureService } from '../../../../modules/procedure'
import { ProductService } from '../../../../modules/product'
import { RadiologyService } from '../../../../modules/radiology'
import { ESArray, ESFunction, ESNumber, ESTimer, ESTypescript } from '../../../../utils'
import Breadcrumb from '../../../component/Breadcrumb.vue'
import ModalDiscountUpsert from '../upsert/ModalDiscountUpsert.vue'
import { DiscountType } from '@/modules/enum'
import { CONFIG } from '@/config'
import { IconDelete, IconSpin } from '@/common/icon-antd'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { VueTag } from '@/common'

const modalDiscountUpsert = ref<InstanceType<typeof ModalDiscountUpsert>>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission, organizationPermission } = MeService

const discountList = ref<Discount[]>([])

const dataLoading = ref(false)

const discountInteractType = ref<DiscountInteractType | null>(null)

const sortColumn = ref<'id' | 'positionType' | 'roleId' | ''>('')
const sortValue = ref<'ASC' | 'DESC' | ''>('')

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const discountInteractTypeOptions = [
  { value: 0, label: 'Tất cả' },
  ...ESTypescript.keysEnum(DiscountInteractType).map((key) => ({
    value: DiscountInteractType[key],
    label: DiscountInteractTypeText[DiscountInteractType[key]],
  })),
]

const startFetchData = async (options?: { refetch?: boolean }) => {
  try {
    dataLoading.value = true
    const response = await DiscountService.pagination(
      {
        page: page.value,
        limit: limit.value,
        relation: {
          product: true,
          regimen: true,
          procedure: true,
          laboratory: true,
          radiology: true,
        },
        filter: {
          discountInteractType: discountInteractType.value ? discountInteractType.value : undefined,
        },
        sort: sortValue.value
          ? {
              id: sortColumn.value === 'id' ? sortValue.value : undefined,
            }
          : { id: 'DESC' },
      },
      { refetch: !!options?.refetch },
    )
    discountList.value = response.data
    total.value = response.meta.total
  } catch (error) {
    console.log('🚀 ~ DiscountList.vue:82 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

onBeforeMount(async () => {
  startFetchData({ refetch: true })
})

const startFilterData = async () => {
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
  await startFilterData()
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
  }
  await startFetchData()
}

const discountIdAction = ref(0)
const handleModalDiscountUpsertSuccess = async (
  discountData: Discount,
  mode: 'CREATE' | 'UPDATE',
) => {
  discountIdAction.value = discountData.id

  await DiscountService.executeRelation([discountData], {
    product: true,
    procedure: true,
    laboratory: true,
    radiology: true,
  })

  if (mode === 'CREATE') {
    discountList.value.unshift(discountData)
    try {
      const discountCreated = await DiscountService.createOne(discountData)
      const findIndex = discountList.value.findIndex((i) => i._localId === discountData._localId)
      discountList.value[findIndex] = discountCreated
    } catch (error) {
      const findIndex = discountList.value.findIndex((i) => i._localId === discountData._localId)
      discountList.value.splice(findIndex, 1)
    }
  }
  if (mode === 'UPDATE') {
    const findIndex = discountList.value.findIndex((i) => i._localId === discountData._localId)
    const discountOrigin = discountList.value[findIndex]
    discountList.value[findIndex] = discountData
    try {
      const discountUpdated = await DiscountService.updateOne(discountData.id, discountData)
      const findIndex = discountList.value.findIndex((i) => i._localId === discountData._localId)
      discountList.value[findIndex] = discountUpdated
    } catch (error) {
      discountList.value[findIndex] = discountOrigin
    }
  }
  discountIdAction.value = 0
  await DiscountService.executeRelation(discountList.value, {
    product: true,
    procedure: true,
    laboratory: true,
    radiology: true,
  })
}

const clickDelete = (discountId: number) => {
  ModalStore.confirm({
    title: 'Bạn có chắc chắn muốn xóa chương trình khuyến mại này',
    content: 'Dữ liệu đã xóa không thể khôi phục lại được. Bạn vẫn muốn xóa ?',
    async onOk() {
      try {
        const response = await DiscountService.destroyOne(discountId)
        await startFilterData()
      } catch (error) {
        console.log('🚀 ~ DiscountList.vue:165 ~ onOk ~ error:', error)
      }
    },
  })
}
</script>

<template>
  <ModalDiscountUpsert ref="modalDiscountUpsert" @success="handleModalDiscountUpsertSuccess" />
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div class="">
      <VueButton
        v-if="userPermission[PermissionId.MASTER_DATA_DISCOUNT]"
        color="blue"
        icon="plus"
        @click="modalDiscountUpsert?.openModal({ mode: 'CREATE' })"
      >
        Thêm mới
      </VueButton>
    </div>
  </div>

  <div class="page-main">
    <div class="page-main-options">
      <div style="flex: 1; flex-basis: 250px">
        <div>Chọn loại</div>
        <div>
          <InputSelect
            v-model:value="discountInteractType"
            :options="discountInteractTypeOptions"
            @update:value="() => startFilterData()"
          ></InputSelect>
        </div>
      </div>
    </div>
    <div class="page-main-table table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="cursor-pointer" @click="changeSort('id')" style="width: 30px">
              ID &nbsp;
              <IconSort :sort="sortColumn === 'id' ? sortValue : ''" />
            </th>
            <th class="cursor-pointer" @click="changeSort('positionType')">
              Loại &nbsp;
              <IconSort :sort="sortColumn === 'positionType' ? sortValue : ''" />
            </th>
            <th>Tên DV/SP/...</th>
            <th style="width: 30px">Độ ưu tiên</th>
            <th>Khuyến mãi</th>
            <th>Thời gian</th>
            <th>Trạng thái</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="discountList.length === 0">
            <td colspan="20" class="text-center">Không có bản ghi nào</td>
          </tr>
          <tr v-for="(discount, i) in discountList" :key="i">
            <td class="text-center">
              <IconSpin v-if="discountIdAction === discount.id" width="20" height="20" />
              <span v-else>{{ discount.id }}</span>
            </td>
            <td>
              {{ DiscountInteractTypeText[discount.discountInteractType] }}
            </td>
            <td>
              <template v-if="discount.discountInteractId === 0">
                <span>Tất cả</span>
              </template>
              <template v-if="discount.discountInteractType === DiscountInteractType.Product">
                {{ discount.product?.brandName }}
              </template>
              <template v-if="discount.discountInteractType === DiscountInteractType.Regimen">
                {{ discount.regimen?.name }}
              </template>
              <template v-if="discount.discountInteractType === DiscountInteractType.Procedure">
                {{ discount.procedure?.name }}
              </template>
              <template v-if="discount.discountInteractType === DiscountInteractType.Radiology">
                {{ discount.radiology?.name }}
              </template>
              <template v-if="discount.discountInteractType === DiscountInteractType.Laboratory">
                {{ discount.laboratory?.name }}
              </template>
            </td>
            <td class="text-center">{{ discount.priority }}</td>
            <td class="text-center">
              <template v-if="discount.discountType === DiscountType.VND">
                {{ formatMoney(discount.discountMoney) }}
              </template>
              <template v-else>
                {{ ESNumber.format({ number: discount.discountPercent }) }}
              </template>
              {{ discount.discountType }}
            </td>
            <td class="">
              <div v-if="discount.discountRepeatType === DiscountRepeatType.Weekly">
                <div>{{ discount.periodsDayText }}</div>
                <div>{{ discount.periodsTimeParse.map((i) => i.join(' => ')).join('; ') }}</div>
              </div>
              <div v-if="discount.discountRepeatType === DiscountRepeatType.Once">
                <div v-for="(timeDistance, index) in discount.periodsTimeParse" :key="index">
                  {{ ESTimer.timeToText(timeDistance[0], 'DD/MM/YYYY hh:mm') }} ==>
                  {{ ESTimer.timeToText(timeDistance[1], 'DD/MM/YYYY hh:mm') }}
                </div>
              </div>
            </td>
            <td class="text-center">
              <VueTag v-if="discount.isActive" icon="check" color="green">Hoạt động</VueTag>
              <VueTag v-else icon="minus" color="orange">Ngừng hoạt động</VueTag>
            </td>
            <td class="text-center">
              <a
                style="color: #eca52b"
                class="text-xl"
                @click="modalDiscountUpsert?.openModal({ discount: discount, mode: 'UPDATE' })"
              >
                <IconEditSquare />
              </a>
            </td>
            <td class="text-center">
              <a style="color: var(--text-red)" class="text-xl" @click="clickDelete(discount.id)">
                <IconDelete width="18" height="18" />
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
