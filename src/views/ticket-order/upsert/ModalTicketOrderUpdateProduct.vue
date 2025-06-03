<script lang="ts" setup>
import { computed, ref } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconClose } from '../../../common/icon-antd'
import { InputHint, InputMoney, InputNumber, VueSelect } from '../../../common/vue-form'
import VueModal from '../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DeliveryStatus, DiscountType } from '../../../modules/enum'
import { TicketProduct } from '../../../modules/ticket-product'
import { DString } from '../../../utils'
import { ticketOrderUpsertRef } from './ticket-order-upsert.ref'

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

let ticketProductOrigin = TicketProduct.blank()
const ticketProduct = ref<TicketProduct>(TicketProduct.blank())

const showModal = ref(false)
const saveLoading = ref(false)
let indexUpdate = 0

const openModal = async (tpIndex: number) => {
  showModal.value = true
  indexUpdate = tpIndex
  ticketProductOrigin = TicketProduct.from(ticketOrderUpsertRef.value.ticketProductList![tpIndex])
  ticketProduct.value = TicketProduct.from(ticketOrderUpsertRef.value.ticketProductList![tpIndex])
}

const hasChangeTicketProduct = computed(() => {
  const result = !TicketProduct.equal(ticketProductOrigin, ticketProduct.value)
  return result
})

const hasChangeData = computed(() => {
  const result = hasChangeTicketProduct.value
  return result
})

const handleChangeUnitDiscountMoney = (data: number) => {
  const discountMoney = data / ticketProduct.value.unitRate
  const expectedPrice = ticketProduct.value.expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketProduct.value.discountPercent = discountPercent
  ticketProduct.value.discountMoney = discountMoney
  ticketProduct.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeDiscountPercent = (data: number) => {
  const expectedPrice = ticketProduct.value.expectedPrice || 0
  const discountMoney = Math.round((expectedPrice * (data || 0)) / 100)
  ticketProduct.value.discountPercent = data
  ticketProduct.value.discountMoney = discountMoney
  ticketProduct.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeUnitActualPrice = (data: number) => {
  const actualPrice = data / ticketProduct.value.unitRate
  const expectedPrice = ticketProduct.value.expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketProduct.value.discountPercent = discountPercent
  ticketProduct.value.discountMoney = discountMoney
  ticketProduct.value.discountType = DiscountType.VND
  ticketProduct.value.actualPrice = actualPrice
}

const closeModal = () => {
  showModal.value = false
  indexUpdate = -1
  ticketProduct.value = TicketProduct.blank()
  ticketProductOrigin = TicketProduct.blank()
}

const clickDestroy = async () => {
  ticketOrderUpsertRef.value.ticketProductList?.splice(indexUpdate, 1)
  closeModal()
}

const updateTicketProduct = async () => {
  ticketOrderUpsertRef.value.ticketProductList![indexUpdate] = TicketProduct.from(
    ticketProduct.value,
  )
  closeModal()
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 100px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ ticketProduct.product?.brandName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 flex flex-wrap gap-4" @submit.prevent="(e) => updateTicketProduct()">
        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div class="flex gap-2 justify-between">
            <div class="flex gap-1">
              <span>Số lượng mua</span>
              <span v-if="ticketProduct.unitRate !== 1">
                (
                <b>{{ ticketProduct.quantity }}</b>
                {{ ticketProduct?.product?.unitBasicName }} )
              </span>
            </div>
          </div>
          <div class="flex">
            <div style="width: 120px">
              <VueSelect
                v-model:value="ticketProduct.unitRate"
                :disabled="(ticketProduct.product?.unitObject.length || 0) <= 1"
                :options="
                  ticketProduct.product?.unitObject.map((i) => ({
                    value: i.rate,
                    text: i.name,
                    data: i,
                  })) || []
                "
                required
              />
            </div>
            <div class="flex-1">
              <InputNumber
                v-model:value="ticketProduct.unitQuantity"
                :disabled="ticketProduct.deliveryStatus === DeliveryStatus.Delivered"
                :validate="{ gt: 0 }"
              />
            </div>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div>
            Giá niêm yết
            <span v-if="ticketProduct.unitRate !== 1">
              (
              <b>{{ formatMoney(ticketProduct.expectedPrice) }} /</b>
              {{ ticketProduct?.product?.unitBasicName }})
            </span>
          </div>

          <div style="width: 100%">
            <InputMoney :value="ticketProduct.unitExpectedPrice" disabled />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div>
            Chiết khấu
            <span
              v-if="
                (ticketProduct.discountType === DiscountType.Percent &&
                  ticketProduct.discountPercent !== 0) ||
                ticketProduct.unitRate > 1
              "
            >
              (
              <b>{{ formatMoney(ticketProduct.discountMoney) }}</b>
              <span v-if="ticketProduct?.product?.unitBasicName">
                / {{ ticketProduct?.product?.unitBasicName }}
              </span>
              )
            </span>
          </div>
          <div class="flex">
            <VueSelect
              v-model:value="ticketProduct.discountType"
              style="width: 120px"
              :options="[
                { value: DiscountType.Percent, text: '%' },
                { value: DiscountType.VND, text: 'VNĐ' },
              ]"
            />
            <div style="width: calc(100% - 120px)">
              <InputMoney
                v-if="ticketProduct.discountType === DiscountType.VND"
                :value="ticketProduct.unitDiscountMoney"
                :disabled="ticketProduct.deliveryStatus === DeliveryStatus.Delivered"
                @update:value="handleChangeUnitDiscountMoney"
                :validate="{ gte: 0 }"
              />
              <InputNumber
                v-else
                :value="ticketProduct.discountPercent"
                :disabled="ticketProduct.deliveryStatus === DeliveryStatus.Delivered"
                @update:value="handleChangeDiscountPercent"
                :validate="{ gte: 0, lte: 100 }"
              />
            </div>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div class="flex gap-1">
            <span>Đơn giá</span>
            <span v-if="ticketProduct.unitRate !== 1">
              (
              <b>{{ formatMoney(ticketProduct.actualPrice) }} /</b>
              {{ ticketProduct.product?.unitBasicName }})
            </span>
          </div>
          <div style="width: 100%">
            <InputMoney
              :value="ticketProduct.unitActualPrice"
              :prepend="ticketProduct.unitRate !== 1 ? ticketProduct.unitName : ''"
              :disabled="ticketProduct.deliveryStatus === DeliveryStatus.Delivered"
              @update:value="handleChangeUnitActualPrice"
            />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px">
          <div>Hướng dẫn sử dụng</div>
          <div>
            <InputHint
              v-model:value="ticketProduct.hintUsage"
              :options="[
                ...(ticketProduct.product!.hintUsage ? [ticketProduct.product!.hintUsage] : []),
                ...settingStore.PRODUCT_HINT_USAGE,
              ]"
              :maxHeight="320"
              :logic-filter="(item: any, text: string) => DString.customFilter(item, text)"
            ></InputHint>
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
