<script lang="ts" setup>
import { computed, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { InputMoney, InputNumber, VueSelect } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DiscountType } from '../../../modules/enum'
import { TicketProcedure } from '../../../modules/ticket-procedure'
import { ticketOrderUpsertRef } from './ticket-order-upsert.ref'

const emit = defineEmits<{
  (e: 'success', value: TicketProcedure, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

let indexUpdate = 0

let ticketProcedureOrigin = TicketProcedure.blank()
const ticketProcedure = ref<TicketProcedure>(TicketProcedure.blank())

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (tpIndex: number) => {
  showModal.value = true
  indexUpdate = tpIndex
  ticketProcedureOrigin = TicketProcedure.from(
    ticketOrderUpsertRef.value.ticketProcedureList![tpIndex],
  )
  ticketProcedure.value = TicketProcedure.from(
    ticketOrderUpsertRef.value.ticketProcedureList![tpIndex],
  )
}

const hasChangeTicketProcedure = computed(() => {
  const result = !TicketProcedure.equal(ticketProcedureOrigin, ticketProcedure.value)
  return result
})

const hasChangeData = computed(() => {
  const result = hasChangeTicketProcedure.value
  return result
})

const handleChangeUnitDiscountMoney = (data: number) => {
  const discountMoney = data
  const expectedPrice = ticketProcedure.value.expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketProcedure.value.discountPercent = discountPercent
  ticketProcedure.value.discountMoney = discountMoney
  ticketProcedure.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeDiscountPercent = (data: number) => {
  const expectedPrice = ticketProcedure.value.expectedPrice || 0
  const discountMoney = Math.round((expectedPrice * (data || 0)) / 100)
  ticketProcedure.value.discountPercent = data
  ticketProcedure.value.discountMoney = discountMoney
  ticketProcedure.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeActualPrice = (data: number) => {
  const actualPrice = data
  const expectedPrice = ticketProcedure.value.expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketProcedure.value.discountPercent = discountPercent
  ticketProcedure.value.discountMoney = discountMoney
  ticketProcedure.value.discountType = DiscountType.VND
  ticketProcedure.value.actualPrice = actualPrice
}

const closeModal = () => {
  showModal.value = false
  ticketProcedure.value = TicketProcedure.blank()
  ticketProcedureOrigin = TicketProcedure.blank()
  indexUpdate = -1
}

const clickDestroy = async () => {
  ticketOrderUpsertRef.value.ticketProcedureList?.splice(indexUpdate, 1)
  closeModal()
}

const updateTicketProcedure = async () => {
  ticketOrderUpsertRef.value.ticketProcedureList![indexUpdate] = TicketProcedure.from(
    ticketProcedure.value,
  )
  closeModal()
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ ticketProcedure.procedure?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 flex flex-wrap gap-4" @submit.prevent="(e) => updateTicketProcedure()">
        <div style="flex-grow: 1; flex-basis: 300px">
          <div>Số lượng</div>
          <div>
            <InputNumber v-model:value="ticketProcedure.quantity" required :validate="{ gt: 0 }" />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 300px">
          <div>Giá niêm yết</div>
          <div>
            <InputMoney v-model:value="ticketProcedure.expectedPrice" disabled />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 300px">
          <div>
            Chiết khấu
            <span
              v-if="
                ticketProcedure.discountType === DiscountType.Percent &&
                ticketProcedure.discountPercent !== 0
              "
            >
              (
              <b>{{ formatMoney(ticketProcedure.discountMoney) }}</b>
              )
            </span>
          </div>
          <div class="flex">
            <VueSelect
              v-model:value="ticketProcedure.discountType"
              style="width: 120px"
              :options="[
                { value: DiscountType.Percent, text: '%' },
                { value: DiscountType.VND, text: 'VNĐ' },
              ]"
            />
            <div style="width: calc(100% - 120px)">
              <InputMoney
                v-if="ticketProcedure.discountType === DiscountType.VND"
                :value="ticketProcedure.discountMoney"
                @update:value="handleChangeUnitDiscountMoney"
                :validate="{ gte: 0 }"
              />
              <InputNumber
                v-else
                :value="ticketProcedure.discountPercent"
                @update:value="handleChangeDiscountPercent"
                :validate="{ gte: 0, lte: 100 }"
              />
            </div>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 300px">
          <div>Đơn giá</div>
          <div style="width: 100%">
            <InputMoney
              :value="ticketProcedure.actualPrice"
              @update:value="handleChangeActualPrice"
            />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 80%" class="mt-6 flex gap-4">
          <VueButton color="red" icon="trash" @click="clickDestroy">Xóa</VueButton>
          <VueButton style="margin-left: auto" type="reset" icon="close" @click="closeModal">
            Đóng lại
          </VueButton>
          <VueButton
            :disabled="!hasChangeData"
            :loading="saveLoading"
            color="blue"
            type="submit"
            icon="save"
          >
            Cập nhật
          </VueButton>
        </div>
      </form>
    </div>
  </VueModal>
</template>
<style lang="scss" scope></style>
