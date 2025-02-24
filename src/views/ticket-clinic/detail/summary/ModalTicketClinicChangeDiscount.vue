<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon'
import { InputMoney, InputNumber, VueSelect } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { DiscountType } from '../../../../modules/enum'
import { TicketClinicApi, ticketClinicRef } from '../../../../modules/ticket-clinic'

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const money = reactive({
  discountType: DiscountType.VND,
  discountMoney: 0,
  discountPercent: 0,
  totalMoney: 0,
})

const showModal = ref(false)
const saveLoading = ref(false)

const openModal = async () => {
  showModal.value = true

  money.discountType = ticketClinicRef.value.discountType
  money.discountMoney = ticketClinicRef.value.discountMoney
  money.discountPercent = ticketClinicRef.value.discountPercent
  money.totalMoney = ticketClinicRef.value.totalMoney
}

const hasChangeData = computed(() => {
  if (money.discountType !== ticketClinicRef.value.discountType) {
    return true
  }
  if (money.discountMoney !== ticketClinicRef.value.discountMoney) {
    return true
  }
  if (money.discountPercent !== ticketClinicRef.value.discountPercent) {
    return true
  }
  if (money.totalMoney !== ticketClinicRef.value.totalMoney) {
    return true
  }
  return false
})

const handleChangeDiscountMoney = (discountMoney: number) => {
  const itemsActualMoney = ticketClinicRef.value.itemsActualMoney
  money.discountPercent =
    itemsActualMoney == 0 ? 0 : Math.round((discountMoney * 100) / itemsActualMoney)
  money.totalMoney = itemsActualMoney - discountMoney
}

const handleChangeDiscountPercent = (data: number) => {
  const itemsActualMoney = ticketClinicRef.value.itemsActualMoney
  money.discountMoney = Math.round((itemsActualMoney * (data || 0)) / 100)
  money.totalMoney = itemsActualMoney - money.discountMoney
}

const handleChangeTotalMoney = (totalMoney: number) => {
  const itemsActualMoney = ticketClinicRef.value.itemsActualMoney
  money.discountType = DiscountType.VND
  money.discountMoney = itemsActualMoney - totalMoney
  money.discountPercent =
    itemsActualMoney == 0 ? 0 : Math.round((money.discountMoney * 100) / itemsActualMoney)
}

const closeModal = () => {
  showModal.value = false
}

const changeDiscount = async () => {
  saveLoading.value = true
  try {
    await TicketClinicApi.changeDiscount(ticketClinicRef.value.id, {
      discountType: money.discountType,
      discountPercent: money.discountPercent,
      discountMoney: money.discountMoney,
    })
    closeModal()
  } catch (error) {
    console.log('🚀: ModalTicketProcedureUpdate.vue:205 ~ changeDiscount ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 100px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">Nhân viên và hoa hồng</div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 flex flex-wrap gap-4" @submit.prevent="(e) => changeDiscount()">
        <div style="flex-basis: 90%; flex-grow: 1; min-width: 300px">
          <div>Tổng thành phần</div>
          <div>
            <InputMoney :value="ticketClinicRef.itemsActualMoney" disabled />
          </div>
        </div>

        <div style="flex-basis: 90%; flex-grow: 1; min-width: 500px">
          <div>
            Chiết khấu
            <span v-if="money.discountType === DiscountType.Percent && money.discountPercent !== 0">
              (
              <b>{{ formatMoney(money.discountMoney) }}</b>

              )
            </span>
          </div>
          <div class="flex">
            <VueSelect
              v-model:value="money.discountType"
              style="width: 120px"
              :options="[
                { value: DiscountType.Percent, text: '%' },
                { value: DiscountType.VND, text: 'VNĐ' },
              ]" />
            <div style="width: calc(100% - 120px)">
              <InputMoney
                v-if="money.discountType === DiscountType.VND"
                v-model:value="money.discountMoney"
                @update:value="handleChangeDiscountMoney" />
              <InputNumber
                v-else
                v-model:value="money.discountPercent"
                @update:value="handleChangeDiscountPercent" />
            </div>
          </div>
        </div>

        <div style="flex-basis: 90%; flex-grow: 1; min-width: 500px">
          <div>TỔNG TIỀN</div>
          <div style="width: 100%">
            <InputMoney v-model:value="money.totalMoney" @update:value="handleChangeTotalMoney" />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 80%" class="mt-6 flex gap-4">
          <VueButton class="ml-auto" type="reset" icon="close" @click="closeModal">
            Đóng lại
          </VueButton>
          <VueButton
            :disabled="!hasChangeData"
            :loading="saveLoading"
            color="blue"
            type="submit"
            icon="save">
            Cập nhật
          </VueButton>
        </div>
      </form>
    </div>
  </VueModal>
</template>
<style lang="scss" scope></style>
