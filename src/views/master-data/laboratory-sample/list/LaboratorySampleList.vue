<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import VuePagination from '../../../../common/VuePagination.vue'
import { IconEditSquare, IconLabPanel } from '../../../../common/icon-google'
import { InputSelect } from '../../../../common/vue-form'
import { MeService } from '../../../../modules/_me/me.service'
import { LaboratorySample, LaboratorySampleService } from '../../../../modules/laboratory-sample'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import ModalLaboratorySampleUpsert from '../upsert/ModalLaboratorySampleUpsert.vue'
import { Breadcrumb } from '../../../component'

const modalLaboratorySampleUpsert = ref<InstanceType<typeof ModalLaboratorySampleUpsert>>()

const { userPermission } = MeService

const laboratorySampleList = ref<LaboratorySample[]>([])

const page = ref(1)
const limit = ref(Number(localStorage.getItem('LABORATORY_KIT_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async () => {
  dataLoading.value = true

  try {
    const { data, meta } = await LaboratorySampleService.pagination({
      page: page.value,
      limit: limit.value,
      relation: {},
      filter: {},
      sort: { priority: 'ASC' },
    })

    laboratorySampleList.value = data
    total.value = meta.total
    dataLoading.value = true
  } catch (error) {
    console.log('🚀 ~ file: LaboratorySampleList.vue:41 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('LABORATORY_KIT_PAGINATION_LIMIT', String(options.limit))
  }
  startFetchData()
}

onBeforeMount(async () => {
  try {
    await startFetchData()
  } catch (error) {
    console.log('🚀 ~ file: LaboratorySampleList.vue:60 ~ onBeforeMount ~ error:', error)
  }
})

const handleModalLaboratorySampleUpsertSuccess = async () => {
  await startFetchData()
}
</script>

<template>
  <ModalLaboratorySampleUpsert
    ref="modalLaboratorySampleUpsert"
    @success="handleModalLaboratorySampleUpsertSuccess"
  />
  <div class="mx-4 mt-4 flex justify-between items-center">
    <div class="flex items-center gap-4">
      <div class="hidden md:block">
        <Breadcrumb />
      </div>
      <VueButton
        v-if="userPermission[PermissionId.MASTER_DATA_LABORATORY_SAMPLE]"
        color="blue"
        icon="plus"
        @click="modalLaboratorySampleUpsert?.openModal()"
      >
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
            <th style="width: 100px">STT</th>
            <th>Tên</th>
            <th v-if="userPermission[PermissionId.MASTER_DATA_LABORATORY_SAMPLE]" style="width: 100px">
              Action
            </th>
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
          <tr v-if="laboratorySampleList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="laboratorySample in laboratorySampleList" :key="laboratorySample.id">
            <td class="text-center">{{ laboratorySample.priority }}</td>
            <td>
              <div class="flex items-center gap-1">
                <span>{{ laboratorySample.name }}</span>
              </div>
            </td>
            <td v-if="userPermission[PermissionId.MASTER_DATA_LABORATORY_SAMPLE]" class="text-center">
              <a
                style="color: var(--text-orange)"
                @click="modalLaboratorySampleUpsert?.openModal(laboratorySample.id)"
              >
                <IconEditSquare width="24px" height="24px" />
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
