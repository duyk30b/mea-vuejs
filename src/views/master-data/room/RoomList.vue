<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VuePagination from '../../../common/VuePagination.vue'
import { IconEditSquare } from '../../../common/icon-google'
import { InputSelect } from '../../../common/vue-form'
import { MeService } from '../../../modules/_me/me.service'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { RoomInteractTypeText, type Room } from '../../../modules/room'
import { RoomService } from '../../../modules/room/room.service'
import Breadcrumb from '../../component/Breadcrumb.vue'
import ModalRoomUpsert from './ModalRoomUpsert.vue'
import { CONFIG } from '@/config'

const modalRoomUpsert = ref<InstanceType<typeof ModalRoomUpsert>>()

const { userPermission } = MeService

const roomList = ref<Room[]>([])

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async (options?: { refetch?: boolean }) => {
  try {
    dataLoading.value = true

    const paginationResponse = await RoomService.pagination(
      {
        page: page.value,
        limit: limit.value,
        relation: { userRoomList: { user: true } },
        filter: {},
        sort: { id: 'ASC' },
      },
      { refetch: options?.refetch },
    )

    roomList.value = paginationResponse.roomList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ file: RoomList.vue:39 ~ startFetchData ~ error:', error)
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
  await startFetchData({ refetch: true })
})

const handleModalRoomUpsertSuccess = async (data: Room, type: 'CREATE' | 'UPDATE' | 'DESTROY') => {
  await startFetchData({ refetch: true })
  await MeService.reloadRoomId()
}
</script>

<template>
  <ModalRoomUpsert ref="modalRoomUpsert" @success="handleModalRoomUpsertSuccess" />
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div>
      <VueButton
        v-if="userPermission[PermissionId.MASTER_DATA_ROOM]"
        color="blue"
        icon="plus"
        @click="modalRoomUpsert?.openModal()"
      >
        Thêm mới
      </VueButton>
    </div>
    <div class="ml-auto flex items-center gap-8"></div>
  </div>

  <div class="mt-4 md:mx-4 p-4 bg-white">
    <div class="mt-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'">ID</th>
            <th>Mã</th>
            <th>Tên</th>
            <th>Loại phòng</th>
            <th>Chức năng</th>
            <th>Tài khoản truy cập</th>
            <th>#</th>
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
          <tr v-if="roomList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="room in roomList" :key="room.id">
            <td
              v-if="CONFIG.MODE === 'development'"
              class="text-center"
              style="width: 100px; color: violet"
            >
              {{ room.id }}
            </td>
            <td class="text-center">{{ room.roomCode }}</td>
            <td>{{ room.name }}</td>
            <td>{{ RoomInteractTypeText[room.roomInteractType] }}</td>
            <td>{{ room.isCommon ? 'Phòng chung' : 'Phòng lẻ' }}</td>
            <td>{{ room.userRoomList?.map((i) => i.user?.fullName).join(', ') }}</td>
            <td
              v-if="userPermission[PermissionId.MASTER_DATA_WAREHOUSE]"
              class="text-center"
              style="width: 100px"
            >
              <a style="color: var(--text-orange)" @click="modalRoomUpsert?.openModal(room.id)">
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
