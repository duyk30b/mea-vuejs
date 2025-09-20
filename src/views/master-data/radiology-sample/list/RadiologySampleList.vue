<script setup lang="ts">
import { IconEditSquare } from '@/common/icon-google'
import { CONFIG } from '@/config'
import { RadiologyService, type Radiology } from '@/modules/radiology'
import { RadiologySample, RadiologySampleService } from '@/modules/radiology-sample'
import InputSearchRadiology from '@/views/component/InputSearchRadiology.vue'
import { onBeforeMount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VueButton from '../../../../common/VueButton.vue'
import VuePagination from '../../../../common/VuePagination.vue'
import { InputSelect, InputText } from '../../../../common/vue-form'
import { MeService } from '../../../../modules/_me/me.service'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import Breadcrumb from '../../../component/Breadcrumb.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { IconDelete, IconEye } from '@/common/icon-antd'
import InputSearchUser from '@/views/component/InputSearchUser.vue'
import type { User } from '@/modules/user'

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const { userPermission } = MeService

const radiologySampleList = ref<RadiologySample[]>([])
const searchText = ref('')
const meId = ref<number>(MeService.user.value?.id || 0)
const userId = ref<number>(MeService.user.value?.id || 0)
const radiologyId = ref<number>(0)

const page = ref(1)
const limit = ref(Number(localStorage.getItem('RADIOLOGY_SAMPLE_PAGINATION_LIMIT')) || 10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async (options?: { refetch?: boolean }) => {
  dataLoading.value = true
  try {
    const { data, meta } = await RadiologySampleService.pagination(
      {
        page: page.value,
        limit: limit.value,
        relation: { radiology: true, printHtml: true, user: true },
        filter: {
          userId: userId.value ? { IN: [userId.value, 0] } : undefined,
          radiologyId: radiologyId.value ? { IN: [radiologyId.value, 0] } : undefined,
          name: searchText.value ? { LIKE: searchText.value } : undefined,
        },
        sort: { priority: 'DESC' },
      },
      { refetch: !!options?.refetch },
    )

    radiologySampleList.value = data
    total.value = meta.total
  } catch (error) {
    console.log('🚀 ~ file: RadiologyList.vue:56 ~ startFetchData ~ error:', error)
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
    localStorage.setItem('RADIOLOGY_SAMPLE_PAGINATION_LIMIT', String(options.limit))
  }
  startFetchData()
}

onBeforeMount(async () => {
  try {
    await startSearch()
    await RadiologyService.list({})
  } catch (error) {
    console.log('🚀 ~ RadiologySampleList.vue:83 ~ onBeforeMount ~ error:', error)
  }
})

const handleSelectUser = async (userProps?: User) => {
  userId.value = userProps?.id || 0
  await startSearch()
}

const handleSelectRadiology = async (radiologyProps?: Radiology) => {
  userId.value = radiologyProps?.id || 0
  await startSearch()
}

const handleClickDestroyRadiologySample = async (radiologySampleId: number) => {
  ModalStore.confirm({
    title: 'Bạn có chắc muốn xóa mẫu kết quả này ?',
    content: 'Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    onOk: async () => {
      try {
        await RadiologySampleService.destroyOne(radiologySampleId)
        await startFetchData({ refetch: true })
      } catch (error) {
        console.log('🚀 ~ file: AppointmentList.vue:168 ~ onOk: ~ error:', error)
      }
    },
  })
}
</script>

<template>
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div class="">
      <VueButton
        v-if="userPermission[PermissionId.MASTER_DATA_RADIOLOGY_CONTENT_SAMPLE]"
        color="blue"
        icon="plus"
        @click="router.push({ name: 'RadiologySampleUpsert', params: { id: 0 } })"
      >
        Thêm mới
      </VueButton>
    </div>
  </div>

  <div class="mt-4 md:mx-4 p-4 bg-white">
    <div class="flex flex-wrap gap-4">
      <div style="flex: 1; flex-basis: 200px">
        <div>Tìm theo tên</div>
        <div>
          <InputText v-model:value="searchText" @update:value="startSearch" />
        </div>
      </div>
      <div style="flex: 2; flex-basis: 200px">
        <InputSearchUser
          v-model:userId="userId"
          label="Người dùng"
          @selectUser="handleSelectUser"
        />
      </div>

      <div style="flex: 1; flex-basis: 200px">
        <InputSearchRadiology
          v-model:radiologyId="radiologyId"
          @selectRadiology="handleSelectRadiology"
        />
      </div>
    </div>
    <div class="mt-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'">ID</th>
            <th>STT</th>
            <th>Người dùng</th>
            <th>Tên mẫu</th>
            <th>Phiếu CĐHA</th>
            <th>Mẫu in</th>
            <th></th>
            <th></th>
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
          <tr v-if="radiologySampleList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="radiologySample in radiologySampleList" :key="radiologySample.id">
            <td class="text-center" v-if="CONFIG.MODE === 'development'">
              {{ radiologySample.id }}
            </td>
            <td class="text-center">{{ radiologySample.priority }}</td>
            <td>{{ radiologySample.user?.fullName }}</td>
            <td>
              <span>{{ radiologySample.name }}</span>
            </td>
            <td>{{ radiologySample.radiology?.name }}</td>
            <td>{{ radiologySample.printHtml?.name }}</td>
            <td class="text-center">
              <router-link
                :to="{ name: 'RadiologySampleUpsert', params: { id: radiologySample.id } }"
              >
                <IconEditSquare
                  v-if="
                    userPermission[PermissionId.MASTER_DATA_RADIOLOGY_CONTENT_SAMPLE] &&
                    (radiologySample.userId === 0 || radiologySample.userId === meId)
                  "
                  width="20px"
                  height="20px"
                />
                <IconEye v-else width="20px" height="20px" />
              </router-link>
            </td>
            <td class="text-center">
              <a
                v-if="
                  userPermission[PermissionId.MASTER_DATA_RADIOLOGY_CONTENT_SAMPLE] &&
                  (radiologySample.userId === 0 || radiologySample.userId === meId)
                "
                style="color: var(--text-red)"
                @click="handleClickDestroyRadiologySample(radiologySample.id)"
              >
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
