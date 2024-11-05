<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { IconSetting } from '../../../common/icon'
import { IconDelete, IconEditSquare } from '../../../common/icon-google'
import { ModalStore } from '../../../common/vue-modal/vue-modal.store'
import VueButton from '../../../common/VueButton.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { ProductGroup, ProductGroupApi, ProductGroupService } from '../../../modules/product-group'
import ModalProductGroupUpsert from './ProductGroupUpsert.vue'

const modalProductGroupUpsert = ref<InstanceType<typeof ModalProductGroupUpsert>>()

const meStore = useMeStore()

const { permissionIdMap } = meStore

const productGroupList = ref<ProductGroup[]>([])

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async () => {
  try {
    dataLoading.value = true

    const { data, meta } = await ProductGroupApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {},
      filter: {},
      sort: { id: 'ASC' },
    })

    productGroupList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: ProductGroupList.vue:39 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const startSearch = async () => {
  page.value = 1
  startFetchData()
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit

  startFetchData()
}

onBeforeMount(async () => {
  await startFetchData()
})

const handleModalProductGroupUpsertSuccess = async (
  data: ProductGroup,
  type: 'CREATE' | 'UPDATE' | 'DELETE'
) => {
  await startFetchData()
}

const handleClickDeleteProductGroup = async (id: number, name: string) => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa dữ liệu này ?',
    content: `Bạn chắc chắn cần xóa bản ghi "${name}" ?`,
    onOk: async () => {
      try {
        await ProductGroupService.destroyOne(id)
        await startFetchData()
      } catch (error) {
        console.log('🚀 ~ file: ProductGroupList.vue:79 ~ onOk: ~ error:', error)
      }
    },
  })
}
</script>

<template>
  <ModalProductGroupUpsert
    ref="modalProductGroupUpsert"
    @success="handleModalProductGroupUpsertSuccess" />

  <div class="mx-4 mt-4 flex justify-between items-center">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2">
        <IconSetting style="font-size: 1.5rem" />
        <span class="font-medium" style="font-size: 1.25rem">Danh sách nhóm sản phẩm</span>
      </div>
      <VueButton
        v-if="permissionIdMap[PermissionId.MASTER_DATA_PRODUCT_GROUP]"
        color="blue"
        icon="plus"
        @click="modalProductGroupUpsert?.openModal()">
        Thêm mới
      </VueButton>
    </div>
    <div></div>
  </div>
  <div class="mt-4 md:mx-4 p-4 bg-white">
    <div class="mt-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th style="width: 100px">ID</th>
            <th>Tên</th>
            <th style="width: 100px"></th>
          </tr>
        </thead>
        <tbody v-if="dataLoading">
          <tr>
            <td colspan="100">
              <div class="vue-skeleton-loading"></div>
              <div class="vue-skeleton-loading mt-2"></div>
            </td>
          </tr>
          <tr>
            <td colspan="100">
              <div class="vue-skeleton-loading"></div>
              <div class="vue-skeleton-loading mt-2"></div>
            </td>
          </tr>
        </tbody>
        <tbody v-if="!dataLoading">
          <tr v-if="productGroupList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="productGroup in productGroupList" :key="productGroup.id">
            <td class="text-center">G{{ productGroup.id }}</td>
            <td>{{ productGroup.name }}</td>
            <td v-if="permissionIdMap[PermissionId.MASTER_DATA_PRODUCT_GROUP]">
              <div class="flex justify-between">
                <a
                  style="color: var(--text-orange)"
                  @click="modalProductGroupUpsert?.openModal(productGroup.id)">
                  <IconEditSquare width="24px" height="24px" />
                </a>
                <a
                  style="color: var(--text-red)"
                  @click="handleClickDeleteProductGroup(productGroup.id, productGroup.name)">
                  <IconDelete width="24px" height="24px" />
                </a>
              </div>
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
