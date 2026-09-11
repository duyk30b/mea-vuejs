<script setup lang="ts">
import { IconDownload } from '@/common/icon-antd'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DistributorApi, type Distributor } from '@/modules/distributor'
import { FileDistributorApi } from '@/modules/file-excel/file-distributor.api'
import { formatPhone } from '@/utils'
import { BugDevelopment } from '@/views/component'
import { onBeforeMount, ref } from 'vue'

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const loaded = ref(false)
const distributorList = ref<Distributor[]>([])
const sumDebt = ref(0)

const startFetchData = async () => {
  try {
    loaded.value = false
    distributorList.value = await DistributorApi.list({ filter: { debt: { NOT: 0 } } })
    sumDebt.value = distributorList.value.reduce((acc, distributor) => {
      return acc + distributor.debt
    }, 0)
  } catch (error) {
    console.log('🚀 ~ TopCustomerDebt.vue:38 ~ startFetchData ~ error:', error)
  } finally {
    loaded.value = true
  }
}

onBeforeMount(async () => await startFetchData())

const downloadExcelDistributorStatistic = async () => {
  ModalStore.confirm({
    title: 'Xác nhận tải file báo cáo',
    content: 'Thời gian tải file có thể tốn vài phút nếu dữ liệu lớn, bạn vẫn mốn tải ?',
    onOk: async () => {
      await FileDistributorApi.downloadExcel({ filter: { debt: { NOT: 0 } } })
    },
  })
}
</script>

<template>
  <div class="mt-4 flex flex-wrap gap-4" style="height: 100%">
    <div class="mt-2 flex-1">
      <div class="flex justify-between items-center">
        <span style="font-size: 18px; font-weight: 500">Tổng nợ: {{ formatMoney(sumDebt) }}:</span>
        <div
          style="cursor: pointer; border: 1px solid #ccc; padding: 4px; border-radius: 4px"
          @click="downloadExcelDistributorStatistic"
        >
          <IconDownload width="20" height="20" />
        </div>
      </div>
      <div class="mt-2 table-wrapper">
        <table class="">
          <thead>
            <tr>
              <th v-if="CONFIG.MODE === 'development'"></th>
              <th>#</th>
              <th>Tên NCC</th>
              <th>SĐT</th>
              <th>Nợ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="distributorList.length === 0">
              <td colspan="20" class="text-center">Không có nhà cung cấp nợ</td>
            </tr>
            <tr v-for="(distributor, index) in distributorList" :key="index">
              <td v-if="CONFIG.MODE === 'development'" style="color: violet; text-align: center">
                <BugDevelopment :data="distributor" />
              </td>
              <td class="text-center" style="white-space: nowrap">
                {{ index + 1 }}
              </td>
              <td>{{ distributor.fullName }}</td>
              <td class="text-center" style="white-space: nowrap">
                <a :href="'tel:' + distributor.phone">
                  {{ formatPhone(distributor.phone || '') }}
                </a>
              </td>
              <td class="text-right" style="white-space: nowrap">
                {{ formatMoney(distributor.debt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
