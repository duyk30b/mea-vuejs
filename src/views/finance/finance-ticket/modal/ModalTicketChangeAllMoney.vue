<script setup lang="ts">
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { useSettingStore } from '@/modules/_me/setting.store'
import { Customer } from '@/modules/customer'
import { DiscountType } from '@/modules/enum'
import { Ticket, TicketActionApi, TicketService } from '@/modules/ticket'
import type { TicketLaboratory } from '@/modules/ticket-laboratory'
import type { TicketProcedure } from '@/modules/ticket-procedure'
import { TicketProduct } from '@/modules/ticket-product'
import type { TicketRadiology } from '@/modules/ticket-radiology'
import TicketLaboratoryStatusTooltip from '@/views/room/room-laboratory/TicketLaboratoryStatusTooltip.vue'
import TicketRadiologyStatusTooltip from '@/views/room/room-radiology/TicketRadiologyStatusTooltip.vue'
import TicketDeliveryStatusTooltip from '@/views/ticket-base/TicketDeliveryStatusTooltip.vue'
import { computed, ref } from 'vue'

const ticket = ref<Ticket>(Ticket.blank())

const emit = defineEmits<{ (e: 'success', ticket: Ticket): void }>()

const settingStore = useSettingStore()
const { formatMoney } = settingStore

const showModal = ref(false)
const dataLoading = ref(false)
const changeLoading = ref(false)

const openModal = async (options: { ticketId: number; customer: Customer }) => {
  showModal.value = true

  try {
    const ticketData = await TicketService.detail(options.ticketId, {
      relation: {
        ticketProcedureList: {},
        ticketProductConsumableList: {},
        ticketProductPrescriptionList: {},
        ticketLaboratoryList: {},
        ticketLaboratoryGroupList: {},
        ticketRadiologyList: {},
      },
    })
    if (!ticketData.ticketProcedureList) ticketData.ticketProcedureList = []
    if (!ticketData.ticketProductConsumableList) ticketData.ticketProductConsumableList = []
    if (!ticketData.ticketProductPrescriptionList) ticketData.ticketProductPrescriptionList = []
    if (!ticketData.ticketRadiologyList) ticketData.ticketRadiologyList = []
    if (!ticketData.ticketLaboratoryList) ticketData.ticketLaboratoryList = []
    await ticketData.refreshAllData()

    ticket.value = ticketData
    ticket.value.customer = Customer.from(options.customer)
  } catch (error) {
    console.log('🚀 ~ file: InvoiceDetails.vue:51 ~ error:', error)
  }
}

const procedureActualMoney = computed(() => {
  return (
    ticket.value.ticketProcedureList?.reduce((acc, item) => {
      return acc + item.actualPrice * item.quantity
    }, 0) || 0
  )
})

const consumableActualMoney = computed(() => {
  return (
    ticket.value.ticketProductConsumableList?.reduce((acc, item) => {
      return acc + item.actualPrice * item.quantity
    }, 0) || 0
  )
})

const prescriptionActualMoney = computed(() => {
  return (
    ticket.value.ticketProductPrescriptionList?.reduce((acc, item) => {
      return acc + item.actualPrice * item.quantity
    }, 0) || 0
  )
})

const laboratoryActualMoney = computed(() => {
  return (
    ticket.value.ticketLaboratoryList?.reduce((acc, item) => {
      return acc + item.actualPrice
    }, 0) || 0
  )
})

const radiologyActualMoney = computed(() => {
  return (
    ticket.value.ticketRadiologyList?.reduce((acc, item) => {
      return acc + item.actualPrice
    }, 0) || 0
  )
})

const closeModal = () => {
  showModal.value = false
  ticket.value = Ticket.blank()
}

const startChangeAllMoney = async () => {
  try {
    changeLoading.value = true
    const ticketResponse = await TicketActionApi.changeAllMoney(ticket.value.id, {
      ticketProcedureList:
        ticket.value.ticketProcedureList?.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          discountMoney: i.discountMoney,
          discountType: i.discountType,
          discountPercent: i.discountPercent,
          actualPrice: i.actualPrice,
        })) || [],
      ticketProductList: [
        ...(ticket.value.ticketProductConsumableList || []),
        ...(ticket.value.ticketProductPrescriptionList || []),
      ].map((i) => ({
        id: i.id,
        quantity: i.quantity,
        discountMoney: i.discountMoney,
        discountType: i.discountType,
        discountPercent: i.discountPercent,
        actualPrice: i.actualPrice,
      })),
      ticketLaboratoryList:
        ticket.value.ticketLaboratoryList?.map((i) => ({
          id: i.id,
          quantity: 1,
          discountMoney: i.discountMoney,
          discountType: i.discountType,
          discountPercent: i.discountPercent,
          actualPrice: i.actualPrice,
        })) || [],
      ticketRadiologyList:
        ticket.value.ticketRadiologyList?.map((i) => ({
          id: i.id,
          quantity: 1,
          discountMoney: i.discountMoney,
          discountType: i.discountType,
          discountPercent: i.discountPercent,
          actualPrice: i.actualPrice,
        })) || [],
    })

    emit('success', ticketResponse)
    closeModal()
  } catch (error) {
    console.log('🚀 ~ file: ModalVisitReturn.vue:90 ~ startChangeAllMoney ~ error:', error)
  } finally {
    changeLoading.value = false
  }
}

const handleChangeDiscountPercent = (
  e: Event,
  itemList: TicketProduct[] | TicketProcedure[] | TicketLaboratory[] | TicketRadiology[],
  index: number,
) => {
  const discountPercent = Number((e.target as HTMLInputElement).value || 0)
  const expectedPrice = itemList[index].expectedPrice || 0
  const discountMoney = Math.round((expectedPrice * (discountPercent || 0)) / 100)
  itemList[index].discountPercent = discountPercent
  itemList[index].discountMoney = discountMoney
  itemList[index].discountType = DiscountType.Percent
  itemList[index].actualPrice = expectedPrice - discountMoney
}

const handleChangeDiscountMoney = (
  e: Event,
  itemList: TicketProduct[] | TicketProcedure[] | TicketLaboratory[] | TicketRadiology[],
  index: number,
) => {
  const discountMoney = Number((e.target as HTMLInputElement).value || 0)
  const expectedPrice = itemList[index].expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  itemList[index].discountPercent = discountPercent
  itemList[index].discountMoney = discountMoney
  itemList[index].discountType = DiscountType.VND
  itemList[index].actualPrice = expectedPrice - discountMoney
}

const handleChangeActualPrice = (
  e: Event,
  itemList: TicketProduct[] | TicketProcedure[] | TicketLaboratory[] | TicketRadiology[],
  index: number,
) => {
  const actualPrice = Number((e.target as HTMLInputElement).value || 0)
  const expectedPrice = itemList[index].expectedPrice || 0
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  itemList[index].discountPercent = discountPercent
  itemList[index].discountMoney = discountMoney
  itemList[index].discountType = DiscountType.VND
  itemList[index].actualPrice = actualPrice
}

const handleChangeQuantity = (
  e: Event,
  itemList: TicketProduct[] | TicketProcedure[],
  index: number,
) => {
  const quantity = Number((e.target as HTMLInputElement).value || 0)
  itemList[index].quantity = quantity
}

defineExpose({ openModal })
</script>

<template>
  <VueModal v-model:show="showModal" style="width: 1200px" @close="closeModal">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          Bảng giá chi tiết: {{ ticket.customer?.fullName || '' }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>

      <div class="p-4">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th></th>
                <th colspan="3">Tên</th>
                <th>G.Niêm Yết</th>
                <th>Chiết khấu (%)</th>
                <th>Chiết khấu (VNĐ)</th>
                <th>Giá thực tế</th>
                <th>S.Lượng</th>
                <th>Tổng</th>
              </tr>
            </thead>
            <template v-if="ticket.ticketProcedureList?.length">
              <tbody>
                <tr>
                  <td colspan="100" class="font-bold" style="color: var(--text-blue)">
                    DỊCH VỤ - THỦ THUẬT
                  </td>
                </tr>
                <tr
                  v-for="(ticketProcedure, index) in ticket.ticketProcedureList"
                  :key="ticketProcedure.id"
                >
                  <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
                    {{ index + 1 }}
                  </td>
                  <td></td>
                  <td colspan="3">
                    <div class="flex items-center gap-1">
                      <span>{{ ticketProcedure.procedure?.name }}</span>
                    </div>
                  </td>

                  <td class="text-right whitespace-nowrap">
                    <div>{{ formatMoney(ticketProcedure.expectedPrice) }}</div>
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketProcedure.discountPercent"
                      min="0"
                      :max="100"
                      @input="
                        (e) => handleChangeDiscountPercent(e, ticket.ticketProcedureList!, index)
                      "
                    />
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketProcedure.discountMoney"
                      min="0"
                      @input="
                        (e) => handleChangeDiscountMoney(e, ticket.ticketProcedureList!, index)
                      "
                    />
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketProcedure.actualPrice"
                      min="0"
                      @input="(e) => handleChangeActualPrice(e, ticket.ticketProcedureList!, index)"
                    />
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketProcedure.quantity"
                      min="0"
                      @input="(e) => handleChangeQuantity(e, ticket.ticketProcedureList!, index)"
                    />
                  </td>
                  <td class="text-right whitespace-nowrap">
                    {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
                  </td>
                </tr>
                <tr>
                  <td colspan="10" class="text-right uppercase">
                    <span class="uppercase font-bold">Tiền dịch vụ</span>
                  </td>
                  <!-- <td class="font-bold text-right whitespace-nowrap">
                    {{ formatMoney(procedureExpectedMoney) }}
                  </td> -->
                  <!-- <td class="text-right" colspan="3">
                    <span v-if="procedureActualMoney != procedureExpectedMoney" class="italic">
                      Tổng chiết khấu:
                      {{ formatMoney(procedureExpectedMoney - procedureActualMoney) }}
                    </span>
                  </td> -->
                  <!-- <td></td> -->
                  <td class="font-bold text-right whitespace-nowrap">
                    {{ formatMoney(procedureActualMoney) }}
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="ticket.ticketProductConsumableList?.length">
              <tbody>
                <tr>
                  <td colspan="100" class="font-bold" style="color: var(--text-blue)">VẬT TƯ</td>
                </tr>
                <tr
                  v-for="(ticketConsumable, index) in ticket.ticketProductConsumableList"
                  :key="ticketConsumable.id"
                >
                  <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
                    {{ index + 1 }}
                  </td>
                  <td class="text-center">
                    <TicketDeliveryStatusTooltip
                      :deliveryStatus="ticketConsumable.deliveryStatus"
                    />
                  </td>
                  <td colspan="3">
                    <div class="flex items-center gap-1">
                      <span>{{ ticketConsumable.product?.brandName }}</span>
                    </div>
                  </td>

                  <td class="text-right whitespace-nowrap">
                    <div>{{ formatMoney(ticketConsumable.expectedPrice) }}</div>
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketConsumable.discountPercent"
                      min="0"
                      :max="100"
                      @input="
                        (e) =>
                          handleChangeDiscountPercent(e, ticket.ticketProductConsumableList!, index)
                      "
                    />
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketConsumable.discountMoney"
                      min="0"
                      @input="
                        (e) =>
                          handleChangeDiscountMoney(e, ticket.ticketProductConsumableList!, index)
                      "
                    />
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketConsumable.actualPrice"
                      min="0"
                      @input="
                        (e) =>
                          handleChangeActualPrice(e, ticket.ticketProductConsumableList!, index)
                      "
                    />
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketConsumable.quantity"
                      min="0"
                      @input="
                        (e) => handleChangeQuantity(e, ticket.ticketProductConsumableList!, index)
                      "
                    />
                  </td>
                  <td class="text-right whitespace-nowrap">
                    {{ formatMoney(ticketConsumable.actualPrice * ticketConsumable.quantity) }}
                  </td>
                </tr>
                <tr>
                  <td colspan="10" class="text-right uppercase">
                    <span class="uppercase font-bold">Tiền vật tư</span>
                  </td>

                  <!-- <td class="font-bold text-right whitespace-nowrap">
                    {{ formatMoney(consumableExpectedMoney) }}
                  </td> -->
                  <!-- <td class="text-right" colspan="3">
                    <span v-if="consumableActualMoney != consumableExpectedMoney" class="italic">
                      Tổng chiết khấu:
                      {{ formatMoney(consumableExpectedMoney - consumableActualMoney) }}
                    </span>
                  </td> -->
                  <!-- <td></td> -->
                  <td class="font-bold text-right whitespace-nowrap">
                    {{ formatMoney(consumableActualMoney) }}
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="ticket.ticketProductPrescriptionList?.length">
              <tbody>
                <tr>
                  <td colspan="100" class="font-bold" style="color: var(--text-blue)">THUỐC</td>
                </tr>
                <tr
                  v-for="(ticketPrescription, index) in ticket.ticketProductPrescriptionList"
                  :key="ticketPrescription.id"
                >
                  <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
                    {{ index + 1 }}
                  </td>
                  <td class="text-center">
                    <TicketDeliveryStatusTooltip
                      :deliveryStatus="ticketPrescription.deliveryStatus"
                    />
                  </td>
                  <td colspan="3">
                    <div class="flex items-center gap-1">
                      <span>{{ ticketPrescription.product?.brandName }}</span>
                    </div>
                  </td>

                  <td class="text-right whitespace-nowrap">
                    <div>{{ formatMoney(ticketPrescription.expectedPrice) }}</div>
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketPrescription.discountPercent"
                      min="0"
                      :max="100"
                      @input="
                        (e) =>
                          handleChangeDiscountPercent(
                            e,
                            ticket.ticketProductPrescriptionList!,
                            index,
                          )
                      "
                    />
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketPrescription.discountMoney"
                      min="0"
                      @input="
                        (e) =>
                          handleChangeDiscountMoney(e, ticket.ticketProductPrescriptionList!, index)
                      "
                    />
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketPrescription.actualPrice"
                      min="0"
                      @input="
                        (e) =>
                          handleChangeActualPrice(e, ticket.ticketProductPrescriptionList!, index)
                      "
                    />
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketPrescription.quantity"
                      min="0"
                      @input="
                        (e) => handleChangeQuantity(e, ticket.ticketProductPrescriptionList!, index)
                      "
                    />
                  </td>
                  <td class="text-right whitespace-nowrap">
                    {{ formatMoney(ticketPrescription.actualPrice * ticketPrescription.quantity) }}
                  </td>
                </tr>
                <tr>
                  <td colspan="10" class="text-right uppercase">
                    <span class="uppercase font-bold">Tiền thuốc</span>
                  </td>

                  <!-- <td class="font-bold text-right whitespace-nowrap">
                    {{ formatMoney(prescriptionExpectedMoney) }}
                  </td> -->
                  <!-- <td class="text-right" colspan="3">
                    <span v-if="prescriptionActualMoney != prescriptionExpectedMoney" class="italic">
                      Tổng chiết khấu:
                      {{ formatMoney(prescriptionExpectedMoney - prescriptionActualMoney) }}
                    </span>
                  </td> -->
                  <!-- <td></td> -->
                  <td class="font-bold text-right whitespace-nowrap">
                    {{ formatMoney(prescriptionActualMoney) }}
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="ticket.ticketLaboratoryList?.length">
              <tbody>
                <tr>
                  <td colspan="100" class="font-bold" style="color: var(--text-blue)">
                    XÉT NGHIỆM
                  </td>
                </tr>
                <tr
                  v-for="(ticketLaboratory, index) in ticket.ticketLaboratoryList"
                  :key="ticketLaboratory.id"
                >
                  <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
                    {{ index + 1 }}
                  </td>
                  <td class="text-center">
                    <TicketLaboratoryStatusTooltip :status="ticketLaboratory.status" />
                  </td>
                  <td colspan="3">
                    <div class="flex items-center gap-1">
                      <span>{{ ticketLaboratory.laboratory?.name }}</span>
                    </div>
                  </td>

                  <td class="text-right whitespace-nowrap">
                    <div>{{ formatMoney(ticketLaboratory.expectedPrice) }}</div>
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketLaboratory.discountPercent"
                      min="0"
                      :max="100"
                      @input="
                        (e) => handleChangeDiscountPercent(e, ticket.ticketLaboratoryList!, index)
                      "
                    />
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketLaboratory.discountMoney"
                      min="0"
                      @input="
                        (e) => handleChangeDiscountMoney(e, ticket.ticketLaboratoryList!, index)
                      "
                    />
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketLaboratory.actualPrice"
                      min="0"
                      @input="
                        (e) => handleChangeActualPrice(e, ticket.ticketLaboratoryList!, index)
                      "
                    />
                  </td>
                  <td class="text-center"></td>
                  <td class="text-right whitespace-nowrap">
                    {{ formatMoney(ticketLaboratory.actualPrice) }}
                  </td>
                </tr>
                <tr>
                  <td colspan="10" class="text-right uppercase">
                    <span class="uppercase font-bold">Tiền Xét nghiệm</span>
                  </td>

                  <!-- <td class="font-bold text-right whitespace-nowrap">
                    {{ formatMoney(prescriptionExpectedMoney) }}
                  </td> -->
                  <!-- <td class="text-right" colspan="3">
                    <span v-if="prescriptionActualMoney != prescriptionExpectedMoney" class="italic">
                      Tổng chiết khấu:
                      {{ formatMoney(prescriptionExpectedMoney - prescriptionActualMoney) }}
                    </span>
                  </td> -->
                  <!-- <td></td> -->
                  <td class="font-bold text-right whitespace-nowrap">
                    {{ formatMoney(laboratoryActualMoney) }}
                  </td>
                </tr>
              </tbody>
            </template>
            <template v-if="ticket.ticketRadiologyList?.length">
              <tbody>
                <tr>
                  <td colspan="100" class="font-bold" style="color: var(--text-blue)">
                    CHẨN ĐOÁN HÌNH ẢNH
                  </td>
                </tr>
                <tr
                  v-for="(ticketRadiology, index) in ticket.ticketRadiologyList"
                  :key="ticketRadiology.id"
                >
                  <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
                    {{ index + 1 }}
                  </td>
                  <td class="text-center">
                    <TicketRadiologyStatusTooltip :status="ticketRadiology.status" />
                  </td>
                  <td colspan="3">
                    <div class="flex items-center gap-1">
                      <span>{{ ticketRadiology.radiology?.name }}</span>
                    </div>
                  </td>

                  <td class="text-right whitespace-nowrap">
                    <div>{{ formatMoney(ticketRadiology.expectedPrice) }}</div>
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketRadiology.discountPercent"
                      min="0"
                      :max="100"
                      @input="
                        (e) => handleChangeDiscountPercent(e, ticket.ticketRadiologyList!, index)
                      "
                    />
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketRadiology.discountMoney"
                      min="0"
                      @input="
                        (e) => handleChangeDiscountMoney(e, ticket.ticketRadiologyList!, index)
                      "
                    />
                  </td>
                  <td class="text-right">
                    <input
                      type="number"
                      :value="ticketRadiology.actualPrice"
                      min="0"
                      @input="(e) => handleChangeActualPrice(e, ticket.ticketRadiologyList!, index)"
                    />
                  </td>
                  <td class="text-center"></td>
                  <td class="text-right whitespace-nowrap">
                    {{ formatMoney(ticketRadiology.actualPrice) }}
                  </td>
                </tr>
                <tr>
                  <td colspan="10" class="text-right uppercase">
                    <span class="uppercase font-bold">Tiền CĐHA</span>
                  </td>

                  <!-- <td class="font-bold text-right whitespace-nowrap">
                    {{ formatMoney(prescriptionExpectedMoney) }}
                  </td> -->
                  <!-- <td class="text-right" colspan="3">
                    <span v-if="prescriptionActualMoney != prescriptionExpectedMoney" class="italic">
                      Tổng chiết khấu:
                      {{ formatMoney(prescriptionExpectedMoney - prescriptionActualMoney) }}
                    </span>
                  </td> -->
                  <!-- <td></td> -->
                  <td class="font-bold text-right whitespace-nowrap">
                    {{ formatMoney(radiologyActualMoney) }}
                  </td>
                </tr>
                <tr>
                  <td
                    colspan="10"
                    class="font-bold text-right uppercase"
                    style="color: var(--text-red); font-size: 16px"
                  >
                    TỔNG TIỀN
                  </td>
                  <td
                    class="font-bold text-right whitespace-nowrap"
                    style="color: var(--text-red); font-size: 16px"
                  >
                    {{
                      formatMoney(
                        procedureActualMoney +
                          prescriptionActualMoney +
                          consumableActualMoney +
                          laboratoryActualMoney +
                          radiologyActualMoney,
                      )
                    }}
                  </td>
                </tr>
              </tbody>
            </template>
          </table>
        </div>
        <div class="pb-4 pt-8 flex gap-4">
          <VueButton type="reset" icon="close" @click="closeModal">Hủy</VueButton>
          <VueButton
            style="margin-left: auto"
            color="blue"
            type="submit"
            icon="send"
            :loading="changeLoading"
            @click="startChangeAllMoney"
          >
            <span>Lưu lại</span>
          </VueButton>
        </div>
      </div>
    </div>
  </VueModal>
</template>

<style lang="scss" scoped>
input {
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-bottom: 1px solid #ccc;
  width: 100px;
}

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  opacity: 1;
}
</style>
