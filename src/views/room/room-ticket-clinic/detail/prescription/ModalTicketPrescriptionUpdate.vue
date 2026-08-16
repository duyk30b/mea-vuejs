<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import {
  InputHint,
  InputMoney,
  InputNumber,
  InputSelect,
  VueSelect,
  VueSwitch,
} from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DeliveryStatus, DiscountType, TicketItemPaymentType } from '@/modules/enum'
import { TicketChangeProductApi } from '@/modules/ticket'
import { TicketProduct } from '@/modules/ticket-product'
import { ESString } from '@/utils'
import TicketDeliveryStatusTag from '@/views/room/room-ticket-base/TicketDeliveryStatusTag.vue'
import { computed, ref } from 'vue'
import { ticketRef } from '@/store/room.store'
import { TicketStatus } from '@/modules/ticket/ticket.type'

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

let ticketProductOrigin = TicketProduct.blank()
const ticketProduct = ref<TicketProduct>(TicketProduct.blank())

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (ticketProductProp: TicketProduct) => {
  showModal.value = true
  ticketProductOrigin = TicketProduct.from(ticketProductProp)
  ticketProduct.value = TicketProduct.from(ticketProductProp)
}

const hasChangeTicketProduct = computed(() => {
  const result = !TicketProduct.equal(ticketProductOrigin, ticketProduct.value)
  return result
})

const hasChangeData = computed(() => {
  const result = hasChangeTicketProduct.value
  return result
})

const handleChangeUnitQuantityPrescription = (data: number) => {
  if (ticketProduct.value.quantityCompleted === 0) {
    const { product, unitRate } = ticketProduct.value
    ticketProduct.value.quantityPrescription = data * unitRate
    ticketProduct.value.quantity = data * unitRate
  }
}

const handleChangeUnitQuantity = (data: number) => {
  if (ticketProduct.value.quantityCompleted === 0) {
    const { product, unitRate } = ticketProduct.value
    ticketProduct.value.unitQuantity = data
  }
}

const closeModal = () => {
  showModal.value = false
  ticketProduct.value = TicketProduct.blank()
  ticketProductOrigin = TicketProduct.blank()
}

const clickDestroy = async () => {
  if (ticketProductOrigin.quantityCompleted !== 0) {
    return ModalStore.alert({
      title: 'Không thể xóa thuốc ?',
      content: [
        '- Thuốc đã được xuất khỏi kho sẽ không thể xóa',
        '- Chỉ có thể hoàn trả thuốc nếu bắt buộc phải thay đổi số lượng ?',
      ],
    })
  }
  if (
    [TicketItemPaymentType.FullPaid, TicketItemPaymentType.PartialPaid].includes(
      ticketProductOrigin.ticketItemPaymentType,
    )
  ) {
    return ModalStore.alert({
      title: 'Không thể xóa thuốc - vật tư ?',
      content: ['- Thuốc - vật tư đã được thanh toán sẽ không thể xóa'],
    })
  }
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.value.status)) {
    return ModalStore.alert({
      title: 'Không thể xóa thuốc ?',
      content: [
        '- Phiếu khám đã đóng không thể xóa thuốc',
        '- Nếu bắt buộc phải thay đổi số lượng, bạn cần mở lại phiếu khám',
      ],
    })
  }
  ModalStore.confirm({
    title: 'Xác nhận xóa thuốc ?',
    content: [
      '- Hệ thống sẽ xóa thuốc này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketChangeProductApi.destroyTicketProductPrescription({
          ticketId: ticketRef.value.id,
          ticketProductId: ticketProductOrigin.id,
        })
        closeModal()
      } catch (error) {
        console.log('🚀 ~ ModalTicketPrescriptionUpdate.vue:227 ~ clickDestroy ~ error:', error)
      }
    },
  })
}

const updateTicketProduct = async () => {
  saveLoading.value = true
  try {
    await TicketChangeProductApi.updateTicketProductPrescription({
      ticketId: ticketRef.value.id,
      ticketProductId: ticketProduct.value.id,
      ticketProduct: hasChangeTicketProduct.value ? ticketProduct.value : undefined,
    })
    closeModal()
  } catch (error) {
    console.log('🚀: ModalTicketProductUpdate.vue:216 ~ updateTicketProduct ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 50px">
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
              <span>Số lượng kê trong đơn</span>
              <span v-if="ticketProduct.unitRate !== 1">
                (
                <b>{{ ticketProduct.quantityPrescription }}</b>
                {{ ticketProduct?.product?.unitBasicName }} )
              </span>
            </div>
            <div></div>
          </div>
          <div class="flex">
            <div style="width: 120px">
              <InputSelect
                :value="ticketProduct.unitRate"
                :disabled="
                  (ticketProduct.product?.unitObject.length || 0) <= 1 ||
                  ticketProduct.quantityCompleted !== 0
                "
                :options="
                  ticketProduct.product?.unitObject.map((i) => ({
                    value: i.rate,
                    label: i.name,
                    data: i,
                  })) || []
                "
                @update:value="(v: any) => ticketProduct.changeUnitRate(v)"
                required
              />
            </div>
            <div class="flex-1">
              <InputNumber
                :value="ticketProduct.unitQuantityPrescription"
                :validate="{ gte: 0 }"
                @update:value="handleChangeUnitQuantityPrescription"
              />
            </div>
          </div>
        </div>

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
            <div>
              <TicketDeliveryStatusTag :deliveryStatus="ticketProduct.deliveryStatusFix" />
            </div>
          </div>
          <div class="flex">
            <div style="width: 120px">
              <InputSelect
                :value="ticketProduct.unitRate"
                :disabled="
                  (ticketProduct.product?.unitObject.length || 0) <= 1 ||
                  ticketProduct.quantityCompleted !== 0
                "
                :options="
                  ticketProduct.product?.unitObject.map((i) => ({
                    value: i.rate,
                    label: i.name,
                    data: i,
                  })) || []
                "
                @update:value="(v: any) => ticketProduct.changeUnitRate(v)"
                required
              />
            </div>
            <div class="flex-1">
              <InputNumber
                :value="ticketProduct.unitQuantity"
                @update:value="handleChangeUnitQuantity"
                :disabled="ticketProduct.quantityCompleted !== 0"
                :validate="{ gte: 0 }"
              />
            </div>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div>
            Giá niêm yết
            <span v-if="ticketProduct.unitRate !== 1">
              (
              <b>{{ formatMoney(ticketProduct.expectedPrice) }}</b>
              <span v-if="ticketProduct?.product?.unitBasicName">
                / {{ ticketProduct?.product?.unitBasicName }})
              </span>
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
                :disabled="ticketProduct.quantityCompleted !== 0"
                @update:value="(v) => ticketProduct.changeUnitDiscountMoney(v)"
                :validate="{ gte: 0 }"
              />
              <InputNumber
                v-else
                :value="ticketProduct.discountPercent"
                :disabled="ticketProduct.quantityCompleted !== 0"
                @update:value="(v) => ticketProduct.changeDiscountPercent(v)"
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
              :disabled="ticketProduct.quantityCompleted !== 0"
              @update:value="(v) => ticketProduct.changeUnitActualPrice(v)"
              :validate="{ gte: 0 }"
            />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div class="flex gap-1">
            <span>Có in trong đơn thuốc ?</span>
          </div>
          <div style="width: 100%">
            <VueSwitch
              v-model:modelValue="ticketProduct.printPrescription"
              :typeParser="'number'"
            ></VueSwitch>
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
              :logic-filter="(item: any, text: string) => ESString.customFilter(item, text)"
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
