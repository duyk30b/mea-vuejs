<script lang="ts" setup>
import { ref } from 'vue'
import VuePagination from '@/common/VuePagination.vue'
import { IconClose } from '@/common/icon-antd'
import { InputSelect } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { Ticket, TicketQueryApi } from '@/modules/ticket'
import { ESTimer } from '@/utils'

const emit = defineEmits<{
  (e: 'select', value: number): void
}>()

const showModal = ref(false)
const ticketClinicList = ref<Ticket[]>([])

const page = ref(1)
const limit = ref(10)
const total = ref(0)

let firstLoad = true

const startFetchData = async () => {
  try {
    const paginationResult = await TicketQueryApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {
        customer: true,
      },
      sort: { registeredAt: 'DESC' },
    })

    ticketClinicList.value = paginationResult.ticketList
    total.value = paginationResult.total
  } catch (error) {
    console.log('🚀 ~ file: ModalSelectTicketExample.vue:37 ~ startFetchData ~ error:', error)
  }
}

const changePagination = async (options: { page?: number; limit?: number }) => {
  if (options.page) page.value = options.page
  if (options.limit) limit.value = options.limit
  startFetchData()
}

const openModal = async () => {
  showModal.value = true
  if (firstLoad) {
    startFetchData()
    firstLoad = false
  }
}

const closeModal = () => {
  showModal.value = false
}

const selectTicketDemo = (ticketDemoId: number) => {
  emit('select', ticketDemoId)
  closeModal()
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-3 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 font-medium" style="font-size: 16px">Chọn phiếu khám Demo</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="px-4 mt-4 modal-data-product-tabs">
        <div class="mt-4 table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Khách hàng</th>
                <th>Thời gian</th>
                <th>Chẩn đoán</th>
                <th style="width: 100px">#</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="ticketClinicList.length === 0">
                <td colspan="20" class="text-center">Không có dữ liệu</td>
              </tr>
              <tr v-for="ticket in ticketClinicList" :key="ticket.id">
                <td class="text-center">KB{{ ticket.id }}</td>
                <td>{{ ticket.customer?.fullName }}</td>
                <td class="text-center">
                  {{ ESTimer.timeToText(ticket.registeredAt, 'hh:mm DD/MM/YYYY') }}
                </td>
                <td>{{ ticket.note }}</td>
                <td class="text-center">
                  <a @click="selectTicketDemo(ticket.id)">Chọn</a>
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
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
