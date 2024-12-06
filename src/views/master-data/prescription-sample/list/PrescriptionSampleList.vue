<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconEditSquare, IconLabPanel } from '../../../../common/icon-google'
import { useMeStore } from '../../../../modules/_me/me.store'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import {
  PrescriptionSample,
  PrescriptionSampleService,
} from '../../../../modules/prescription-sample'
import ModalPrescriptionSampleUpsert from '../upsert/ModalPrescriptionSampleUpsert.vue'

const modalPrescriptionSampleUpsert = ref<InstanceType<typeof ModalPrescriptionSampleUpsert>>()

const meStore = useMeStore()

const { permissionIdMap } = meStore

const prescriptionSampleList = ref<PrescriptionSample[]>([])

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PRESCRIPTION_SAMPLE_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async () => {
  dataLoading.value = true

  try {
    const { data, meta } = await PrescriptionSampleService.pagination({
      page: page.value,
      limit: limit.value,
      filter: {},
      sort: { priority: 'ASC' },
    })

    prescriptionSampleList.value = data
    console.log('🚀 ~ file: PrescriptionSampleList.vue:39 ~ startFetchData ~ data:', data)
    total.value = meta.total
    dataLoading.value = true
  } catch (error) {
    console.log('🚀 ~ file: LaboratoryList.vue:59 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) {
    limit.value = options.limit
    localStorage.setItem('PRESCRIPTION_SAMPLE_PAGINATION_LIMIT', String(options.limit))
  }
  startFetchData()
}

onBeforeMount(async () => {
  try {
    await startFetchData()
  } catch (error) {
    console.log('🚀 ~ file: PrescriptionSampleList.vue:64 ~ onBeforeMount ~ error:', error)
  }
})

const handleModalPrescriptionSampleUpsertSuccess = async () => {
  await startFetchData()
}
</script>

<template>
  <ModalPrescriptionSampleUpsert
    ref="modalPrescriptionSampleUpsert"
    @success="handleModalPrescriptionSampleUpsertSuccess" />
  <div class="mx-4 mt-4 flex justify-between items-center">
    <div class="flex items-center gap-4">
      <div class="hidden md:flex items-center gap-2">
        <IconLabPanel style="font-size: 1.5rem" />
        <span class="font-medium" style="font-size: 1.25rem">Danh sách đơn thuốc mẫu</span>
      </div>
      <VueButton
        v-if="permissionIdMap[PermissionId.MASTER_DATA_PRESCRIPTION_SAMPLE]"
        color="blue"
        icon="plus"
        @click="modalPrescriptionSampleUpsert?.openModal()">
        Thêm mới
      </VueButton>
    </div>
  </div>
  <div class="mt-4 md:mx-4 p-4 bg-white">
    <div class="mt-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th style="width: 100px">STT</th>
            <th>Tên</th>
            <th
              v-if="permissionIdMap[PermissionId.MASTER_DATA_PRESCRIPTION_SAMPLE]"
              style="width: 100px">
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
          <tr v-if="prescriptionSampleList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="prescriptionSample in prescriptionSampleList" :key="prescriptionSample.id">
            <td class="text-center">{{ prescriptionSample.priority }}</td>
            <td>
              <div>{{ prescriptionSample.name }}</div>
              <div style="font-size: 13px; font-style: italic">
                {{ prescriptionSample.medicineList.map((i) => i.product?.brandName).join(', ') }}
              </div>
            </td>
            <td
              v-if="permissionIdMap[PermissionId.MASTER_DATA_PRESCRIPTION_SAMPLE]"
              class="text-center">
              <a
                style="color: var(--text-orange)"
                @click="modalPrescriptionSampleUpsert?.openModal(prescriptionSample.id)">
                <IconEditSquare width="24px" height="24px" />
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
