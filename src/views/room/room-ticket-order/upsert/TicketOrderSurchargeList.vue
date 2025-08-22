<script setup lang="ts">
import { IconDelete } from '@/common/icon-antd'
import VuePopConfirm from '@/common/popover/VuePopConfirm.vue'
import { InputMoney } from '@/common/vue-form'
import { useSettingStore } from '@/modules/_me/setting.store'
import { SurchargeService } from '@/modules/surcharge'
import { TicketSurcharge } from '@/modules/ticket-surcharge/ticket-surcharge.model'
import VueSelectSurcharge from '@/views/component/VueSelectSurcharge.vue'
import { useRouter } from 'vue-router'
import { ticketOrderUpsertRef } from './ticket-order-upsert.ref'

const router = useRouter()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const surchargeAll = SurchargeService.surchargeAll
const openBlankSurchargeList = async () => {
  const route = router.resolve({ name: 'Surcharge' })
  window.open(route.href, '_blank')
}
</script>

<template>
  <VuePopConfirm :position="{ horizontal: 'right', vertical: 'top' }">
    <template #trigger>
      <div
        class="text-right cursor-pointer"
        style="padding-right: 11px; border-bottom: 1px solid #cdcdcd"
      >
        {{ formatMoney(ticketOrderUpsertRef.surcharge) }}
      </div>
    </template>
    <div class="p-4" style="max-width: 90vw; overflow-x: auto">
      <div style="">
        <table style="width: 100%">
          <thead>
            <tr>
              <th class="px-1">STT</th>
              <th>Loại phụ phí</th>
              <th>Số tiền</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(ticketSurcharge, index) in ticketOrderUpsertRef.ticketSurchargeList"
              :key="ticketSurcharge._localId"
            >
              <td class="px-1 py-1" style="text-align: center">{{ index + 1 }}</td>
              <td class="px-1 py-1">
                <div>
                  <VueSelectSurcharge v-model:surchargeId="ticketSurcharge.surchargeId" />
                </div>
              </td>
              <td class="px-1 py-1">
                <div>
                  <InputMoney v-model:value="ticketSurcharge.money" />
                </div>
              </td>
              <td class="px-1 py-1 cursor-pointer">
                <IconDelete
                  color="red"
                  width="16px"
                  height="16px"
                  @click="ticketOrderUpsertRef.ticketSurchargeList!.splice(index, 1)"
                ></IconDelete>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-1" style="font-size: 13px">
        <a @click="ticketOrderUpsertRef.ticketSurchargeList?.push(TicketSurcharge.blank())">
          Thêm phụ phí
        </a>
      </div>
      <div v-if="!surchargeAll.length" class="mt-1" style="font-size: 13px">
        <a style="text-decoration: underline; font-style: italic" @click="openBlankSurchargeList">
          Chưa có phụ phí ? Vào trang quản lý phụ phí
        </a>
      </div>
      <div class="text-end mt-2">
        Tổng phụ phí:
        <b>
          {{ formatMoney(ticketOrderUpsertRef.surcharge) }}
        </b>
      </div>
    </div>
  </VuePopConfirm>
</template>
