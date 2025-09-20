<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert'
import { InputMoney, InputNumber, VueSelect } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import { TicketChangeProcedureApi } from '@/modules/ticket'
import { TicketProcedure } from '@/modules/ticket-procedure'
import { TicketRegimen, TicketRegimenStatus } from '@/modules/ticket-regimen'
import { computed, ref } from 'vue'

const emit = defineEmits<{
  (e: 'success', data: TicketRegimen): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

let ticketRegimenOrigin = TicketRegimen.blank()
const ticketRegimen = ref<TicketRegimen>(TicketRegimen.blank())

const paymentEachSession = ref(0)
const requiredPaymentItem = settingStore.TICKET_CLINIC_LIST.requiredPaymentItem

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (data: { ticketRegimen: TicketRegimen }) => {
  ticketRegimenOrigin = data.ticketRegimen
  ticketRegimen.value = TicketRegimen.from(data.ticketRegimen)

  showModal.value = true
}

const hasChangeTicketRegimen = computed(() => {
  const result = !TicketRegimen.equal(ticketRegimenOrigin, ticketRegimen.value)
  return result
})

const hasChangeTicketProcedureList = computed(() => {
  const result = !TicketProcedure.equalList(
    ticketRegimenOrigin.ticketProcedureList || [],
    ticketRegimen.value.ticketProcedureList || [],
  )
  return result
})

const hasChangeData = computed(() => {
  const result = hasChangeTicketRegimen.value || hasChangeTicketProcedureList.value
  return result
})

const handleChangeExpectedPrice = (data: number) => {
  const expectedPrice = data
  const actualPrice = ticketRegimen.value.actualPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketRegimen.value.expectedPrice = expectedPrice
  ticketRegimen.value.discountPercent = discountPercent
  ticketRegimen.value.discountMoney = discountMoney
  ticketRegimen.value.discountType = DiscountType.VND
  ticketRegimen.value.actualPrice = actualPrice
}

const handleChangeUnitDiscountMoney = (data: number) => {
  const discountMoney = data
  const expectedPrice = ticketRegimen.value.expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  const actualPrice = expectedPrice - discountMoney
  ticketRegimen.value.discountPercent = discountPercent
  ticketRegimen.value.discountMoney = discountMoney
  ticketRegimen.value.actualPrice = actualPrice
}

const handleChangeDiscountPercent = (data: number) => {
  const expectedPrice = ticketRegimen.value.expectedPrice || 0
  const discountMoney = Math.round((expectedPrice * (data || 0)) / 100)
  const actualPrice = expectedPrice - discountMoney
  ticketRegimen.value.discountPercent = data
  ticketRegimen.value.discountMoney = discountMoney
  ticketRegimen.value.actualPrice = actualPrice
}

const handleChangeActualPrice = (data: number) => {
  const actualPrice = data
  const expectedPrice = ticketRegimen.value.expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketRegimen.value.discountPercent = discountPercent
  ticketRegimen.value.discountMoney = discountMoney
  ticketRegimen.value.discountType = DiscountType.VND
  ticketRegimen.value.actualPrice = actualPrice
}

const handleChangePaymentAllItem = () => {
  if (paymentEachSession.value) {
    ticketRegimen.value.paymentMoneyStatus = PaymentMoneyStatus.NoEffect
    ticketRegimen.value.ticketProcedureWrapList?.forEach((tpWrap) => {
      if (requiredPaymentItem) {
        tpWrap.ticketProcedure.paymentMoneyStatus = PaymentMoneyStatus.PendingPayment
      } else {
        tpWrap.ticketProcedure.paymentMoneyStatus = PaymentMoneyStatus.TicketPaid
      }
    })
  }
  if (!paymentEachSession.value) {
    ticketRegimen.value.ticketProcedureWrapList?.forEach((tpWrap) => {
      tpWrap.ticketProcedure.paymentMoneyStatus = PaymentMoneyStatus.NoEffect
    })
    if (requiredPaymentItem) {
      ticketRegimen.value.paymentMoneyStatus = PaymentMoneyStatus.PendingPayment
    } else {
      ticketRegimen.value.paymentMoneyStatus = PaymentMoneyStatus.TicketPaid
    }
  }
}

const closeModal = () => {
  showModal.value = false
  ticketRegimen.value = TicketRegimen.blank()
  ticketRegimenOrigin = TicketRegimen.blank()
}

const handleSave = async () => {
  try {
    if (ticketRegimen.value.status !== TicketRegimenStatus.Pending) {
      AlertStore.addError('Liệu trình đã thực hiện không thể sửa thông tin thanh toán')
      return
    }

    if (hasChangeTicketRegimen.value) {
      ticketRegimen.value.ticketProcedureWrapList?.forEach((tpWrap) => {
        const tp = tpWrap.ticketProcedure
        tp.expectedPrice =
          (tp.expectedPrice * ticketRegimen.value.expectedPrice) / ticketRegimenOrigin.expectedPrice
        tp.discountPercent = ticketRegimen.value.discountPercent
        tp.discountMoney = (tp.expectedPrice * tp.discountPercent) / 100
        tp.actualPrice = tp.expectedPrice - tp.discountMoney
      })
      ticketRegimen.value.ticketProcedureList?.forEach((tp) => {
        tp.expectedPrice =
          (tp.expectedPrice * ticketRegimen.value.expectedPrice) / ticketRegimenOrigin.expectedPrice
        tp.discountPercent = ticketRegimen.value.discountPercent
        tp.discountMoney = (tp.expectedPrice * tp.discountPercent) / 100
        tp.actualPrice = tp.expectedPrice - tp.discountMoney
      })
    }

    if (ticketRegimen.value.id) {
      const ticketRegimenResponse = await TicketChangeProcedureApi.updateMoneyTicketRegimen({
        ticketId: ticketRegimen.value.ticketId,
        ticketRegimenId: ticketRegimen.value.id,
        ticketRegimen: ticketRegimen.value,
        ticketProcedureList: ticketRegimen.value.ticketProcedureList || [],
      })
      Object.assign(ticketRegimen.value, ticketRegimenResponse)
    }

    emit('success', ticketRegimen.value)
    closeModal()
  } catch (error) {
    console.log('🚀 ~ ModalTicketRegimenUpdateMoney.vue:107 ~ handleSave ~ error:', error)
  }
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ ticketRegimen.regimen?.name }}
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
                :value="ticketRegimen.expectedPrice"
                @update:value="handleChangeExpectedPrice"
              />
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 300px">
            <div>
              Chiết khấu
              <span
                v-if="
                  ticketRegimen.discountType === DiscountType.Percent &&
                  ticketRegimen.discountPercent !== 0
                "
              >
                (
                <b>{{ formatMoney(ticketRegimen.discountMoney) }}</b>
                )
              </span>
            </div>
            <div class="flex">
              <VueSelect
                v-model:value="ticketRegimen.discountType"
                style="width: 120px"
                :options="[
                  { value: DiscountType.Percent, text: '%' },
                  { value: DiscountType.VND, text: 'VNĐ' },
                ]"
              />
              <div style="width: calc(100% - 120px)">
                <InputMoney
                  v-if="ticketRegimen.discountType === DiscountType.VND"
                  :value="ticketRegimen.discountMoney"
                  :disabled="ticketRegimen.paymentMoneyStatus === PaymentMoneyStatus.Paid"
                  @update:value="handleChangeUnitDiscountMoney"
                  :validate="{ gte: 0 }"
                />
                <InputNumber
                  v-else
                  :value="ticketRegimen.discountPercent"
                  :disabled="ticketRegimen.paymentMoneyStatus === PaymentMoneyStatus.Paid"
                  @update:value="handleChangeDiscountPercent"
                  :validate="{ gte: 0, lte: 100 }"
                />
              </div>
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px">
            <div>Đơn giá</div>
            <div style="width: 100%">
              <InputMoney
                :value="ticketRegimen.actualPrice"
                :disabled="ticketRegimen.paymentMoneyStatus === PaymentMoneyStatus.Paid"
                @update:value="handleChangeActualPrice"
              />
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div>Kiểu thanh toán</div>
            <div style="width: 100%">
              <VueSelect
                v-model:value="paymentEachSession"
                :options="[
                  { value: 0, text: 'Thanh toán hết 1 lần' },
                  { value: 1, text: 'Thanh toán từng buổi lẻ' },
                ]"
                @update:value="handleChangePaymentAllItem"
              />
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
            <div>Số tiền phải thanh toán</div>
            <div style="width: 100%">
              <InputMoney v-model:value="ticketRegimen.remainMoney" disabled />
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
