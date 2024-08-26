<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconDelete } from '../../../common/icon-google'
import { AlertStore } from '../../../common/vue-alert/vue-alert.store'
import { InputNumber, InputOptions } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { DiscountType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Procedure, ProcedureType, useProcedureStore } from '../../../modules/procedure'
import { TicketStatus, ticketRef } from '../../../modules/ticket'
import { TicketProcedure } from '../../../modules/ticket-procedure'
import ModalProcedureUpsert from '../../procedure/components/ModalProcedureUpsert.vue'
import { TicketSpaApi } from '../../../modules/ticket/ticket-spa.api'

const modalProcedureUpsert = ref<InstanceType<typeof ModalProcedureUpsert>>()
const inputOptionsProcedure = ref<InstanceType<typeof InputOptions>>()

const meStore = useMeStore()
const { permissionIdMap } = meStore

const procedureOptions = ref<{ value: number; text: string; data: Procedure }[]>([])
const procedureStore = useProcedureStore()
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketProcedure = ref<TicketProcedure>(TicketProcedure.blank())
const ticketProcedureList = ref<TicketProcedure[]>([])
const quantity = ref(0)
watch(
  () => ticketRef.value.ticketProcedureList!,
  (newValue: TicketProcedure[]) => {
    ticketProcedureList.value = TicketProcedure.fromList(newValue || [])
  },
  { immediate: true }
)

const disabledButton = computed(() => {
  return (
    TicketProcedure.equalList(
      ticketProcedureList.value,
      ticketRef.value.ticketProcedureList || []
    ) || [TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.value.ticketStatus)
  )
})

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicProcedure.vue:48 ~ onMounted ~ onMounted:')
  try {
    await procedureStore.refreshDB()
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const clear = () => {
  ticketProcedure.value = TicketProcedure.blank()
  procedureOptions.value = []
}

const searchingProcedure = async (text: string) => {
  const procedureList = await procedureStore.search(text)
  procedureOptions.value = procedureList.map((i) => ({ value: i.id, text: i.name, data: i }))
}

const selectProcedure = (instance?: Procedure) => {
  if (instance) {
    ticketProcedure.value.ticketId = ticketRef.value.id
    ticketProcedure.value.procedureId = instance.id
    ticketProcedure.value.procedure = instance
    ticketProcedure.value.expectedPrice = instance.price
    ticketProcedure.value.discountMoney = 0
    ticketProcedure.value.discountPercent = 0
    ticketProcedure.value.discountType = DiscountType.VND
    ticketProcedure.value.expectedPrice = instance.price
    ticketProcedure.value.actualPrice = instance.price
    ticketProcedure.value.quantity = 1
    ticketProcedure.value.startedAt = Date.now()

    quantity.value = instance.quantityDefault
  } else {
    ticketProcedure.value = TicketProcedure.blank()
  }
  procedureOptions.value = []
}

const addProcedureItem = () => {
  if (!ticketProcedure.value.procedureId) {
    return inputOptionsProcedure.value?.focus()
  }

  if (ticketProcedure.value.procedure!.procedureType === ProcedureType.Basic) {
    ticketProcedure.value.quantity = quantity.value
    ticketProcedureList.value.push(ticketProcedure.value)
  } else if (ticketProcedure.value.procedure!.procedureType === ProcedureType.Regimen) {
    for (let i = 0; i < quantity.value; i++) {
      ticketProcedure.value.quantity = 1
      ticketProcedureList.value.push(ticketProcedure.value)
    }
  } else {
    return
  }

  clear()
  inputOptionsProcedure.value?.clear()

  if (!isMobile) {
    inputOptionsProcedure.value?.focus()
  }
}

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketProcedureList.value[index]
  ticketProcedureList.value[index] = ticketProcedureList.value[index + count]
  ticketProcedureList.value[index + count] = temp
}

const saveTicketProcedureList = async () => {
  await TicketSpaApi.changeTicketProcedureList({
    ticketId: ticketRef.value.id,
    customerId: ticketRef.value.customerId || 0,
    ticketProcedureList: ticketProcedureList.value,
  })
}
</script>
<template>
  <ModalProcedureUpsert ref="modalProcedureUpsert" @success="selectProcedure" />

  <form @submit.prevent="(e) => addProcedureItem()">
    <div class="mt-4">
      <div class="flex justify-between">
        <span>Chỉ định dịch vụ</span>
        <span>
          <a
            v-if="permissionIdMap[PermissionId.PROCEDURE_CREATE]"
            @click="modalProcedureUpsert?.openModal()">
            Thêm dịch vụ mới
          </a>
        </span>
      </div>
      <div style="height: 40px">
        <InputOptions
          ref="inputOptionsProcedure"
          :options="procedureOptions"
          :maxHeight="320"
          placeholder="Tìm kiếm tên dịch vụ"
          :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketRef.ticketStatus)"
          @selectItem="({ data }) => selectProcedure(data)"
          @update:text="searchingProcedure">
          <template #option="{ item: { data } }">
            <div>
              <b>{{ data.name }}</b>
              - {{ formatMoney(data.price) }}
            </div>
          </template>
        </InputOptions>
      </div>
    </div>
    <div class="mt-4">
      <div>Số lượng</div>
      <div>
        <InputNumber v-model:value="quantity" required :validate="{ gt: 0 }" />
      </div>
    </div>
    <div class="mt-4 flex justify-center">
      <VueButton
        :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketRef.ticketStatus)"
        color="blue"
        icon="plus"
        type="submit">
        Thêm vào danh sách
      </VueButton>
    </div>
  </form>

  <div class="mt-4">
    <div>Danh sách các dịch vụ, thủ thuật</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Dịch vụ</th>
            <th>SL</th>
            <th>Giá</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketProcedureList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(tpItem, index) in ticketProcedureList" :key="tpItem.procedureId">
            <td>
              <div class="flex flex-col items-center">
                <button
                  style="
                    border: none;
                    font-size: 1.2rem;
                    line-height: 0.5;
                    background: none;
                    margin-bottom: -0.5rem;
                  "
                  class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                  :disabled="index === 0"
                  @click="changeItemPosition(index, -1)">
                  <font-awesome-icon :icon="['fas', 'sort-up']" style="opacity: 0.6" />
                </button>
                <span>{{ index + 1 }}</span>
                <button
                  style="
                    border: none;
                    font-size: 1.2rem;
                    line-height: 0.5;
                    background: none;
                    margin-top: -0.5rem;
                  "
                  class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                  :disabled="index === ticketProcedureList.length - 1"
                  @click="changeItemPosition(index, 1)">
                  <font-awesome-icon :icon="['fas', 'sort-down']" style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td>{{ tpItem.procedure?.name }}</td>
            <td style="width: 150px">
              <div
                v-if="
                  [TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.ticketStatus) ||
                  tpItem.procedure?.procedureType === ProcedureType.Regimen
                "
                class="text-center">
                {{ tpItem.quantity }}
              </div>
              <div v-else class="flex items-center justify-between">
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="tpItem.quantity <= 0"
                  @click="ticketProcedureList[index].quantity--">
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber v-model:value="tpItem.quantity" textAlign="right" />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  @click="ticketProcedureList[index].quantity++">
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </button>
              </div>
            </td>
            <td class="text-right">{{ formatMoney(tpItem.actualPrice) }}</td>
            <td class="text-center">
              <a
                v-if="![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.ticketStatus)"
                class="text-red-500"
                @click="ticketProcedureList.splice(index, 1)">
                <IconDelete width="18" height="18" />
              </a>
            </td>
          </tr>
          <tr>
            <td colspan="3" class="text-right">
              <b>Tổng tiền</b>
            </td>
            <td class="text-right">
              <b>
                {{
                  formatMoney(
                    ticketProcedureList.reduce((acc, item) => {
                      return (acc += item.expectedPrice * item.quantity)
                    }, 0)
                  )
                }}
              </b>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="mt-4 flex justify-between">
    <div></div>
    <VueButton color="blue" :disabled="disabledButton" icon="save" @click="saveTicketProcedureList">
      Lưu lại
    </VueButton>
  </div>
</template>
<script lang="scss" scope></script>
