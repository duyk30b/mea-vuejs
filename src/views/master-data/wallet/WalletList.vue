<script setup lang="ts">
import { CONFIG } from '@/config'
import { onBeforeMount, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import VuePagination from '../../../common/VuePagination.vue'
import { IconEditSquare } from '../../../common/icon-google'
import { InputSelect } from '../../../common/vue-form'
import { MeService } from '../../../modules/_me/me.service'
import { WalletService, WalletType, WalletTypeText, type Wallet } from '../../../modules/wallet'
import { PermissionId } from '../../../modules/permission/permission.enum'
import Breadcrumb from '../../component/Breadcrumb.vue'
import ModalWalletUpsert from './ModalWalletUpsert.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { VueTooltip } from '@/common/popover'
import { IconBug } from '@/common/icon-antd'

const modalWalletUpsert = ref<InstanceType<typeof ModalWalletUpsert>>()

const { userPermission } = MeService
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const walletList = ref<Wallet[]>([])

const page = ref(1)
const limit = ref(10)
const total = ref(0)

const dataLoading = ref(false)

const startFetchData = async (options?: { refetch?: boolean }) => {
  try {
    dataLoading.value = true

    const paginationResponse = await WalletService.pagination(
      {
        page: page.value,
        limit: limit.value,
        relation: {},
        filter: {},
        sort: { id: 'ASC' },
      },
      { refetch: !!options?.refetch },
    )

    walletList.value = paginationResponse.walletList
    total.value = paginationResponse.total
  } catch (error) {
    console.log('🚀 ~ WalletList.vue:45 ~ startFetchData ~ error:', error)
  } finally {
    dataLoading.value = false
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit

  startFetchData()
}

onBeforeMount(async () => {
  await startFetchData({ refetch: true })
})

const handleModalWalletUpsertSuccess = async (
  data: Wallet,
  type: 'CREATE' | 'UPDATE' | 'DESTROY',
) => {
  await startFetchData()
}
</script>

<template>
  <ModalWalletUpsert ref="modalWalletUpsert" @success="handleModalWalletUpsertSuccess" />
  <div class="mx-4 mt-4 gap-4 flex items-center">
    <div class="hidden md:block">
      <Breadcrumb />
    </div>
    <div>
      <VueButton
        v-if="userPermission[PermissionId.MASTER_DATA_WAREHOUSE]"
        color="blue"
        icon="plus"
        @click="modalWalletUpsert?.openModal()"
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
            <th v-if="CONFIG.MODE === 'development'" style="width: 40px"></th>
            <th style="width: 200px">Mã</th>
            <th>Tên</th>
            <th>Loại ví</th>
            <th>Số dư</th>
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
          <tr v-if="walletList.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="wallet in walletList" :key="wallet.id">
            <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
              <VueTooltip :maxHeight="'600px'" :maxWidth="'800px'">
                <template #trigger>
                  <IconBug style="color: violet; cursor: pointer" width="1.2em" height="1.2em" />
                </template>
                <pre>{{ JSON.stringify(wallet, null, 4) }}</pre>
              </VueTooltip>
            </td>
            <td class="text-center" style="width: 100px">{{ wallet.code }}</td>
            <td>{{ wallet.name }}</td>
            <td>{{ WalletTypeText[wallet.walletType] }}</td>
            <td class="text-right">
              {{ formatMoney(wallet.money) }}
            </td>
            <td
              v-if="userPermission[PermissionId.MASTER_DATA_WALLET]"
              class="text-center"
              style="width: 100px"
            >
              <a style="color: var(--text-orange)" @click="modalWalletUpsert?.openModal(wallet.id)">
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
