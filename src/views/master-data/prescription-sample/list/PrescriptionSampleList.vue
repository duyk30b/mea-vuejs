<script setup lang="ts">
import { onBeforeMount, ref, watch } from 'vue'
import VueButton from '@/common/VueButton.vue'
import VuePagination from '@/common/VuePagination.vue'
import { IconEditSquare } from '@/common/icon-google'
import { InputSelect } from '@/common/vue-form'
import { MeService } from '@/modules/_me/me.service'
import { PermissionId } from '@/modules/permission/permission.enum'
import {
  PrescriptionSample,
  PrescriptionSampleApi,
  PrescriptionSampleService,
} from '@/modules/prescription-sample'
import { Breadcrumb } from '../../../component'
import ModalPrescriptionSampleUpsert from '../upsert/ModalPrescriptionSampleUpsert.vue'
import { CONFIG } from '@/config'
import InputSearchUser from '@/views/component/InputSearchUser.vue'
import type { User } from '@/modules/user'
import { IconDelete } from '@/common/icon-antd'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'

const modalPrescriptionSampleUpsert = ref<InstanceType<typeof ModalPrescriptionSampleUpsert>>()

const { userPermission } = MeService

const prescriptionSampleList = ref<PrescriptionSample[]>([])
const meId = ref<number>(MeService.user.value?.id || 0)
const userId = ref<number>(MeService.user.value?.id || 0)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('PRESCRIPTION_SAMPLE_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async (options?: { refetch?: boolean; loading?: boolean }) => {
  if (options?.loading) {
    dataLoading.value = true
  }

  try {
    const { data, meta } = await PrescriptionSampleService.pagination({
      page: page.value,
      limit: limit.value,
      relation: { user: true, medicineList: { product: true } },
      filter: {
        userId: userId.value ? { IN: [userId.value, 0] } : undefined,
      },
      sort: { priority: 'ASC' },
    })

    // await PrescriptionSampleService.executeRelation(data, {
    //   user: true,
    //   medicineList: { product: true },
    // })

    prescriptionSampleList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: LaboratoryList.vue:42 ~ startFetchData ~ error:', error)
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
  await startSearch()
}

const handleSelectUser = async (userProps?: User) => {
  userId.value = userProps?.id || 0
  await startSearch()
}

const handleClickDestroyPrescription = async (prescriptionId: number) => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa mẫu này ?',
    content: 'Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    onOk: async () => {
      try {
        await PrescriptionSampleService.destroyOne(prescriptionId)
        await startFetchData()
      } catch (error) {
        console.log('🚀 ~ file: AppointmentList.vue:168 ~ onOk: ~ error:', error)
      }
    },
  })
}
</script>

<template>
  <ModalPrescriptionSampleUpsert
    ref="modalPrescriptionSampleUpsert"
    @success="handleModalPrescriptionSampleUpsertSuccess"
  />
  <div class="mx-4 mt-4 flex justify-between items-center">
    <div class="flex items-center gap-4">
      <div class="hidden md:block">
        <Breadcrumb />
      </div>
      <VueButton
        v-if="userPermission[PermissionId.MASTER_DATA_PRESCRIPTION_SAMPLE]"
        color="blue"
        icon="plus"
        @click="modalPrescriptionSampleUpsert?.openModal()"
      >
        Thêm mới
      </VueButton>
    </div>
  </div>
  <div class="mt-4 md:mx-4 p-4 bg-white">
    <div class="flex flex-wrap gap-4">
      <div style="flex-basis: 400px">
        <InputSearchUser
          v-model:userId="userId"
          label="Người dùng"
          @selectUser="handleSelectUser"
        />
      </div>
    </div>

    <div class="mt-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'" style="width: 100px">ID</th>
            <th style="width: 100px">STT</th>
            <th>Người dùng</th>
            <th>Tên</th>
            <th style="width: 50px"></th>
            <th style="width: 50px"></th>
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
            <td class="text-center" v-if="CONFIG.MODE === 'development'">
              {{ prescriptionSample.id }}
            </td>
            <td class="text-center">{{ prescriptionSample.priority }}</td>
            <td>{{ prescriptionSample.user?.fullName }}</td>
            <td>
              <div>{{ prescriptionSample.name }}</div>
              <div style="font-size: 13px; font-style: italic">
                {{ prescriptionSample.medicineList.map((i) => i.product?.brandName).join(', ') }}
              </div>
            </td>
            <td class="text-center">
              <a
                v-if="
                  userPermission[PermissionId.MASTER_DATA_RADIOLOGY_CONTENT_SAMPLE] &&
                  (prescriptionSample.userId === 0 || prescriptionSample.userId === meId)
                "
                style="color: var(--text-orange)"
                @click="modalPrescriptionSampleUpsert?.openModal(prescriptionSample.id)"
              >
                <IconEditSquare width="18px" height="18px" />
              </a>
            </td>
            <td class="text-center">
              <a
                v-if="
                  userPermission[PermissionId.MASTER_DATA_RADIOLOGY_CONTENT_SAMPLE] &&
                  (prescriptionSample.userId === 0 || prescriptionSample.userId === meId)
                "
                style="color: var(--text-red)"
                @click="handleClickDestroyPrescription(prescriptionSample.id)"
              >
                <IconDelete width="18px" height="18px" />
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
