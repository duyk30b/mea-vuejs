<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { InputMoney, InputNumber, VueSelect } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType } from '@/modules/enum'
import { TicketChangeProcedureApi } from '@/modules/ticket'
import { TicketProcedure } from '@/modules/ticket-procedure'
import { TicketRegimen } from '@/modules/ticket-regimen'
import { computed, ref } from 'vue'

const emit = defineEmits<{
  (e: 'success', data: TicketRegimen): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

let ticketRegimenOrigin = TicketRegimen.blank()
const ticketRegimen = ref<TicketRegimen>(TicketRegimen.blank())

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

const handleChangeExpectedMoney = (data: number) => {
  const expectedMoney = data
  const actualMoney = ticketRegimen.value.actualPrice
  const discountMoney = expectedMoney - actualMoney
  const discountPercent =
    expectedMoney == 0 ? 0 : Math.round(((discountMoney * 100) / expectedMoney) * 100) / 100 // fix 2 chữ số thập phân
  ticketRegimen.value.expectedPrice = expectedMoney
  ticketRegimen.value.discountPercent = discountPercent
  ticketRegimen.value.discountMoney = discountMoney
  ticketRegimen.value.discountType = DiscountType.VND
  ticketRegimen.value.actualPrice = actualMoney
}

const handleChangeDiscountMoney = (data: number) => {
  const discountMoney = data
  const expectedMoney = ticketRegimen.value.expectedPrice || 0
  const discountPercent =
    expectedMoney == 0 ? 0 : Math.round(((discountMoney * 100) / expectedMoney) * 100) / 100
  const actualMoney = expectedMoney - discountMoney
  ticketRegimen.value.discountPercent = discountPercent
  ticketRegimen.value.discountMoney = discountMoney
  ticketRegimen.value.actualPrice = actualMoney
}

const handleChangeDiscountPercent = (data: number) => {
  const discountPercent = data
  const expectedMoney = ticketRegimen.value.expectedPrice || 0
  const discountMoney = Math.round((expectedMoney * (discountPercent || 0)) / 100 / 1000) * 1000
  const actualMoney = expectedMoney - discountMoney
  ticketRegimen.value.discountPercent = data
  ticketRegimen.value.discountMoney = discountMoney
  ticketRegimen.value.actualPrice = actualMoney
}

const handleChangeActualPrice = (data: number) => {
  const actualMoney = data
  const expectedMoney = ticketRegimen.value.expectedPrice
  const discountMoney = expectedMoney - actualMoney
  const discountPercent =
    expectedMoney == 0 ? 0 : Math.round(((discountMoney * 100) / expectedMoney) * 100) / 100
  ticketRegimen.value.discountPercent = discountPercent
  ticketRegimen.value.discountMoney = discountMoney
  ticketRegimen.value.discountType = DiscountType.VND
  ticketRegimen.value.actualPrice = actualMoney
}

const closeModal = () => {
  showModal.value = false
  ticketRegimen.value = TicketRegimen.blank()
  ticketRegimenOrigin = TicketRegimen.blank()
}

const handleSave = async () => {
  try {
    if (hasChangeTicketRegimen.value) {
      ticketRegimen.value.ticketRegimenItemList ||= []
      const totalMoneyAmountRoot = ticketRegimen.value.ticketRegimenItemList.reduce((acc, item) => {
        return acc + (item.procedure?.price || 0) * item.quantityRegular
      }, 0)

      let totalMoneyAmountRegularRemain = ticketRegimen.value.expectedPrice
      let totalMoneyAmountSaleRemain = ticketRegimen.value.actualPrice
      let totalDiscountMoneyRemain = ticketRegimen.value.discountMoney

      let trLength = ticketRegimen.value.ticketRegimenItemList.length

      for (let index = ticketRegimen.value.ticketRegimenItemList.length - 1; index >= 0; index--) {
        const tri = ticketRegimen.value.ticketRegimenItemList[index]
        tri.moneyAmountRegular =
          totalMoneyAmountRoot === 0
            ? 0
            : Math.floor(
                ((tri.procedure?.price || 0) *
                  (ticketRegimen.value.expectedPrice / totalMoneyAmountRoot)) /
                  1000,
              ) *
              1000 *
              tri.quantityRegular
        tri.discountType = DiscountType.Percent
        tri.discountPercent = ticketRegimen.value.discountPercent

        if (index !== 0) {
          tri.moneyAmountSale =
            tri.quantityRegular === 0
              ? 0
              : Math.floor(
                  (tri.moneyAmountRegular * (100 - tri.discountPercent)) /
                    100 /
                    tri.quantityRegular /
                    1000,
                ) *
                tri.quantityRegular *
                1000
          tri.discountMoneyAmount = tri.moneyAmountRegular - tri.moneyAmountSale

          totalMoneyAmountRegularRemain -= tri.moneyAmountRegular
          totalMoneyAmountSaleRemain -= tri.moneyAmountSale
          totalDiscountMoneyRemain -= tri.discountMoneyAmount
        } else {
          tri.moneyAmountRegular = totalMoneyAmountRegularRemain
          tri.discountMoneyAmount = totalDiscountMoneyRemain
          tri.moneyAmountSale = totalMoneyAmountSaleRemain
        }
      }
    }

    if (ticketRegimen.value.id) {
      const ticketRegimenResponse = await TicketChangeProcedureApi.updateMoneyTicketRegimen({
        ticketId: ticketRegimen.value.ticketId,
        ticketRegimenId: ticketRegimen.value.id,
        ticketRegimen: ticketRegimen.value,
        ticketRegimenItemList: ticketRegimen.value.ticketRegimenItemList || [],
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
                @update:value="handleChangeExpectedMoney"
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
                  @update:value="handleChangeDiscountMoney"
                  :validate="{ gte: 0 }"
                />
                <InputNumber
                  v-else
                  :value="ticketRegimen.discountPercent"
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
