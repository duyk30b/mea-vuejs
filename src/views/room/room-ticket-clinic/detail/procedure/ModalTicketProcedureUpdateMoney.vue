<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { InputMoney, InputNumber, VueSelect } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import { ticketRoomRef } from '@/modules/room'
import { TicketChangeProcedureApi } from '@/modules/ticket'
import { TicketProcedure } from '@/modules/ticket-procedure'
import { computed, ref } from 'vue'

const emit = defineEmits<{
  (e: 'success', data: TicketProcedure): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

let ticketProcedureOrigin = TicketProcedure.blank()
const ticketProcedure = ref<TicketProcedure>(TicketProcedure.blank())

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (data: { ticketProcedure: TicketProcedure }) => {
  ticketProcedureOrigin = data.ticketProcedure
  ticketProcedure.value = TicketProcedure.from(data.ticketProcedure)

  showModal.value = true
}

const hasChangeData = computed(() => {
  const result = !TicketProcedure.equal(ticketProcedureOrigin, ticketProcedure.value)
  return result
})

const handleChangeExpectedPrice = (data: number) => {
  const expectedPrice = data
  const actualPrice = ticketProcedure.value.actualPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketProcedure.value.expectedPrice = expectedPrice
  ticketProcedure.value.discountPercent = discountPercent
  ticketProcedure.value.discountMoney = discountMoney
  ticketProcedure.value.discountType = DiscountType.VND
  ticketProcedure.value.actualPrice = actualPrice
}

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
}

const handleSave = async () => {
  try {
    if (ticketProcedure.value.id) {
      await TicketChangeProcedureApi.updateMoneyTicketProcedure({
        ticketId: ticketRoomRef.value.id,
        ticketProcedureId: ticketProcedure.value.id,
        ticketProcedure: ticketProcedure.value,
      })
    }

    emit('success', ticketProcedure.value)
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalTicketProcedureUpdateMoney.vue:97 ~ handleSave ~ error:', error)
  }
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
      <form class="p-4 gap-4" @submit.prevent="(e) => handleSave()">
        <div class="flex flex-wrap gap-4">
          <div style="flex-grow: 1; flex-basis: 300px">
            <div>Giá niêm yết</div>
            <div>
              <InputMoney
                :value="ticketProcedure.expectedPrice"
                @update:value="handleChangeExpectedPrice"
              />
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
                  :disabled="ticketProcedure.paymentMoneyStatus === PaymentMoneyStatus.Paid"
                  @update:value="handleChangeUnitDiscountMoney"
                  :validate="{ gte: 0 }"
                />
                <InputNumber
                  v-else
                  :value="ticketProcedure.discountPercent"
                  :disabled="ticketProcedure.paymentMoneyStatus === PaymentMoneyStatus.Paid"
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
                :disabled="ticketProcedure.paymentMoneyStatus === PaymentMoneyStatus.Paid"
                @update:value="handleChangeActualPrice"
              />
            </div>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 80%" class="mt-6 flex gap-4">
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
