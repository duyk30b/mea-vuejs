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
import { Procedure, ProcedureService } from '../../../modules/procedure'
import { TicketStatus } from '../../../modules/ticket'
import { TicketClinicApi, ticketClinicRef } from '../../../modules/ticket-clinic'
import { TicketProcedure } from '../../../modules/ticket-procedure'
import { DString } from '../../../utils'

const inputSearchProcedure = ref<InstanceType<typeof InputOptions>>()

const meStore = useMeStore()
const { permissionIdMap } = meStore

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

let procedureAll: Procedure[] = []
const procedureOptions = ref<{ value: number; text: string; data: Procedure }[]>([])
const ticketProcedureList = ref<TicketProcedure[]>([])

watch(
  () => ticketClinicRef.value.ticketProcedureList!,
  (newValue: TicketProcedure[]) => {
    ticketProcedureList.value = TicketProcedure.fromList(newValue || [])
  },
  { immediate: true }
)

const disabledButton = computed(() => {
  return (
    TicketProcedure.equalList(
      ticketProcedureList.value,
      ticketClinicRef.value.ticketProcedureList || []
    ) || [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)
  )
})

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicProcedure.vue:45 ~ onMounted')
  try {
    procedureAll = await ProcedureService.list({})
  } catch (error: any) {
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const searchingProcedure = async (text: string) => {
  procedureOptions.value = procedureAll
    .filter((i) => DString.customFilter(i.name, text))
    .map((i) => ({ value: i.id, text: i.name, data: i }))
}

const selectProcedure = (instance?: Procedure) => {
  if (instance) {
    const ticketProcedure = new TicketProcedure()
    ticketProcedure.ticketId = ticketClinicRef.value.id
    ticketProcedure.procedureId = instance.id
    ticketProcedure.procedure = instance
    ticketProcedure.expectedPrice = instance.price
    ticketProcedure.discountMoney = 0
    ticketProcedure.discountPercent = 0
    ticketProcedure.discountType = DiscountType.VND
    ticketProcedure.expectedPrice = instance.price
    ticketProcedure.actualPrice = instance.price
    ticketProcedure.quantity = 1
    ticketProcedure.startedAt = Date.now()
    ticketProcedureList.value.push(ticketProcedure)
  }

  procedureOptions.value = []
  if (!isMobile) {
    inputSearchProcedure.value?.focus()
  }
}

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketProcedureList.value[index]
  ticketProcedureList.value[index] = ticketProcedureList.value[index + count]
  ticketProcedureList.value[index + count] = temp
}

const saveTicketProcedureList = async () => {
  await TicketClinicApi.updateTicketProcedureList({
    ticketId: ticketClinicRef.value.id,
    customerId: ticketClinicRef.value.customerId || 0,
    ticketProcedureList: ticketProcedureList.value,
  })
}
</script>
<template>
  <div class="mt-4 flex justify-between">
    <span>Chỉ định dịch vụ</span>
    <span></span>
  </div>
  <div style="height: 40px">
    <InputOptions
      ref="inputSearchProcedure"
      :options="procedureOptions"
      :maxHeight="320"
      placeholder="Tìm kiếm tên dịch vụ"
      clear-after-selected
      :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.ticketStatus)"
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
            <th>T.Tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketProcedureList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr
            v-for="(ticketProcedure, index) in ticketProcedureList"
            :key="ticketProcedure.procedureId">
            <td>
              <div class="flex flex-col items-center">
                <button
                  type="button"
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
                  type="button"
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
            <td>{{ ticketProcedure.procedure?.name }}</td>
            <td style="width: 150px">
              <div
                v-if="
                  [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.ticketStatus)
                "
                class="text-center">
                {{ ticketProcedure.quantity }}
              </div>
              <div v-else class="flex items-center justify-between">
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  :disabled="ticketProcedure.quantity <= 0"
                  @click="ticketProcedureList[index].quantity--">
                  <font-awesome-icon :icon="['fas', 'minus']" />
                </button>
                <div style="width: calc(100% - 60px); min-width: 50px">
                  <InputNumber v-model:value="ticketProcedure.quantity" textAlign="right" />
                </div>
                <button
                  style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #cdcdcd"
                  class="flex items-center justify-center cursor-pointer hover:bg-[#dedede] disabled:opacity-[30%] disabled:cursor-not-allowed"
                  @click="ticketProcedureList[index].quantity++">
                  <font-awesome-icon :icon="['fas', 'plus']" />
                </button>
              </div>
            </td>
            <td class="text-right">{{ formatMoney(ticketProcedure.actualPrice) }}</td>
            <td class="text-right">
              {{ formatMoney(ticketProcedure.actualPrice * ticketProcedure.quantity) }}
            </td>
            <td class="text-center">
              <a
                v-if="
                  ![TicketStatus.Debt, TicketStatus.Completed].includes(
                    ticketClinicRef.ticketStatus
                  )
                "
                class="text-red-500"
                @click="ticketProcedureList.splice(index, 1)">
                <IconDelete width="18" height="18" />
              </a>
            </td>
          </tr>
          <tr>
            <td colspan="4" class="text-right">
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
    <VueButton
      v-if="permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PROCEDURE_LIST]"
      color="blue"
      :disabled="disabledButton"
      icon="save"
      @click="saveTicketProcedureList">
      Lưu lại
    </VueButton>
  </div>
</template>
<style lang="scss" scope></style>
