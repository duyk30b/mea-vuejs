<script lang="ts" setup>
import { ref } from 'vue'
import { IconClose } from '../../../../common/icon'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { Ticket, TicketApi, TicketType } from '../../../../modules/ticket'
import { DTimer } from '../../../../utils'

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
    const { data, meta } = await TicketApi.pagination({
      page: page.value,
      limit: limit.value,
      relation: {
        customer: true,
        ticketAttributeList: true,
      },
      filter: { ticketType: { NOT: TicketType.Order } },
      sort: { registeredAt: 'DESC' },
    })

    ticketClinicList.value = data
    total.value = meta.total
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
  <VueModal v-model:show="showModal" style="margin-top: 100px">
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
                  {{ DTimer.timeToText(ticket.registeredAt, 'hh:mm DD/MM/YYYY') }}
                </td>
                <td>
                  {{
                    ticket.ticketAttributeMap?.diagnosis || ticket.ticketAttributeMap?.reason || ''
                  }}
                </td>
                <td class="text-center">
                  <a @click="selectTicketDemo(ticket.id)">Chọn</a>
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
    </div>
  </VueModal>
</template>

<style lang="scss" scoped></style>
