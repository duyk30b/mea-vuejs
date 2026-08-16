<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { InputMoney, InputNumber, VueSelect } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType, TicketItemPaymentType } from '@/modules/enum'
import { PositionType } from '@/modules/position'
import { TicketChangeRadiologyApi } from '@/modules/ticket'
import { TicketRadiology } from '@/modules/ticket-radiology'
import { TicketUser } from '@/modules/ticket-user'
import TicketChangeTicketUserPosition from '@/views/room/room-user/TicketChangeTicketUserPosition.vue'
import { computed, ref } from 'vue'

const emit = defineEmits<{
  (e: 'success', type: 'CREATE' | 'UPDATE' | 'DESTROY', value: TicketRadiology): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketRadiologyOrigin = ref<TicketRadiology>(TicketRadiology.blank())
const ticketRadiology = ref<TicketRadiology>(TicketRadiology.blank())

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async (data: { ticketRadiology: TicketRadiology }) => {
  showModal.value = true
  ticketRadiologyOrigin.value = TicketRadiology.from(data.ticketRadiology)
  ticketRadiology.value = TicketRadiology.from(data.ticketRadiology)
}

const hasChangeTicketRadiology = computed(() => {
  const result = !TicketRadiology.equal(ticketRadiologyOrigin.value, ticketRadiology.value)
  return result
})

const hasChangeTicketUserList = computed(() => {
  const result = !TicketUser.equalList(
    ticketRadiology.value.ticketUserRequestList,
    ticketRadiologyOrigin.value.ticketUserRequestList,
  )
  return result
})

const hasChangeData = computed(() => {
  const result = hasChangeTicketRadiology.value || hasChangeTicketUserList.value
  return result
})

const handleChangeUnitDiscountMoney = (data: number) => {
  const discountMoney = data
  const expectedPrice = ticketRadiology.value.expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketRadiology.value.discountPercent = discountPercent
  ticketRadiology.value.discountMoney = discountMoney
  ticketRadiology.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeDiscountPercent = (data: number) => {
  const expectedPrice = ticketRadiology.value.expectedPrice || 0
  const discountMoney = Math.round((expectedPrice * (data || 0)) / 100)
  ticketRadiology.value.discountPercent = data
  ticketRadiology.value.discountMoney = discountMoney
  ticketRadiology.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeActualPrice = (data: number) => {
  const actualPrice = data
  const expectedPrice = ticketRadiology.value.expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketRadiology.value.discountPercent = discountPercent
  ticketRadiology.value.discountMoney = discountMoney
  ticketRadiology.value.discountType = DiscountType.VND
  ticketRadiology.value.actualPrice = actualPrice
}

const closeModal = () => {
  showModal.value = false
  ticketRadiology.value = TicketRadiology.blank()
  ticketRadiologyOrigin.value = TicketRadiology.blank()
}

const clickDestroy = async () => {
  if (
    [TicketItemPaymentType.FullPaid, TicketItemPaymentType.PartialPaid].includes(
      ticketRadiologyOrigin.value.ticketItemPaymentType,
    )
  ) {
    return ModalStore.alert({
      title: 'Không thể xóa phiếu chỉ định CĐHA ?',
      content: ['- Phiếu CĐHA đã được thanh toán sẽ không thể xóa'],
    })
  }

  ModalStore.confirm({
    title: 'Xác nhận xóa CĐHA ?',
    content: [
      '- Hệ thống sẽ xóa CĐHA này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketChangeRadiologyApi.destroyTicketRadiology({
          ticketId: ticketRadiology.value.ticketId,
          ticketRadiologyId: ticketRadiology.value.id,
        })
        emit('success', 'DESTROY', ticketRadiology.value)
        closeModal()
      } catch (error) {
        console.log('🚀 ~ file: TicketClinicRadiology.vue:118 ~ onOk: ~ error:', error)
      }
    },
  })
}

const startUpdateTicketRadiology = async () => {
  try {
    saveLoading.value = true
    const ticketRadiologyResponse = await TicketChangeRadiologyApi.updateRequestTicketRadiology({
      ticketId: ticketRadiology.value.ticketId,
      ticketRadiologyId: ticketRadiology.value.id,
      ticketRadiology: hasChangeTicketRadiology.value ? ticketRadiology.value : undefined,
      ticketUserRequestList: ticketRadiology.value.ticketUserRequestList || undefined,
    })
    Object.assign(ticketRadiology.value, ticketRadiologyResponse)
  } catch (error) {
    console.log('🚀 ~ ModalTicketRadiologyUpdate.vue:128  ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const submitForm = async () => {
  if (ticketRadiology.value.id) {
    await startUpdateTicketRadiology()
  }
  emit('success', 'UPDATE', ticketRadiology.value)
  closeModal()
}

const handleFixTicketUserRequestList = (tuListData: TicketUser[]) => {
  ticketRadiologyOrigin.value.ticketUserRequestList = TicketUser.fromList(tuListData)
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ ticketRadiology.radiology?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 flex flex-wrap gap-4" @submit.prevent="(e) => submitForm()">
        <div style="flex-basis: 45%; flex-grow: 1; min-width: 300px">
          <div>Giá niêm yết</div>
          <div>
            <InputMoney v-model:value="ticketRadiology.expectedPrice" disabled />
          </div>
        </div>

        <div style="flex-basis: 45%; flex-grow: 1; min-width: 300px">
          <div>
            Chiết khấu
            <span
              v-if="
                ticketRadiology.discountType === DiscountType.Percent &&
                ticketRadiology.discountPercent !== 0
              "
            >
              (
              <b>{{ formatMoney(ticketRadiology.discountMoney) }}</b>
              )
            </span>
          </div>
          <div class="flex">
            <VueSelect
              v-model:value="ticketRadiology.discountType"
              style="width: 120px"
              :options="[
                { value: DiscountType.Percent, text: '%' },
                { value: DiscountType.VND, text: 'VNĐ' },
              ]"
            />
            <div style="width: calc(100% - 120px)">
              <InputMoney
                v-if="ticketRadiology.discountType === DiscountType.VND"
                :value="ticketRadiology.discountMoney"
                @update:value="handleChangeUnitDiscountMoney"
                :validate="{ gte: 0 }"
              />
              <InputNumber
                v-else
                :value="ticketRadiology.discountPercent"
                @update:value="handleChangeDiscountPercent"
                :validate="{ gte: 0, lte: 100 }"
              />
            </div>
          </div>
        </div>

        <div style="flex-basis: 45%; flex-grow: 1; min-width: 300px">
          <div>Đơn giá</div>
          <div style="width: 100%">
            <InputMoney
              :value="ticketRadiology.actualPrice"
              @update:value="handleChangeActualPrice"
            />
          </div>
        </div>

        <div class="mt-4" style="flex-basis: 90%; flex-grow: 1; min-width: 300px">
          <TicketChangeTicketUserPosition
            ref="ticketChangeTicketUserPosition"
            v-model:ticketUserList="ticketRadiology.ticketUserRequestList!"
            :positionType="PositionType.RadiologyRequest"
            :positionInteractId="ticketRadiology.radiologyId"
            @fix:ticketUserList="handleFixTicketUserRequestList"
            title="Nhân viên tư vấn, chỉ định dịch vụ"
          />
        </div>

        <div style="flex-grow: 1; flex-basis: 80%" class="mt-6 flex flex-wrap gap-4">
          <VueButton v-if="ticketRadiology.id" color="red" icon="trash" @click="clickDestroy">
            Xóa
          </VueButton>
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
