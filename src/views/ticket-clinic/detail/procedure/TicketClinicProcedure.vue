<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconDelete } from '../../../../common/icon-google'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputNumber, InputOptions } from '../../../../common/vue-form'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Procedure, ProcedureService } from '../../../../modules/procedure'
import { TicketStatus } from '../../../../modules/ticket'
import { TicketClinicApi, ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketProcedure } from '../../../../modules/ticket-procedure'
import TicketClinicProcedureSelectItem from './TicketClinicProcedureSelectItem.vue'

const meStore = useMeStore()
const { permissionIdMap } = meStore

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketProcedureList = ref<TicketProcedure[]>([])

const procedureMap = ref<Record<string, Procedure>>({})

watch(
  () => ticketClinicRef.value.ticketProcedureList!,
  (newValue: TicketProcedure[]) => {
    ticketProcedureList.value = TicketProcedure.fromList(newValue || [])
  },
  { immediate: true, deep: true }
)

const hasChangeData = computed(() => {
  if (
    !TicketProcedure.equalList(
      ticketProcedureList.value,
      ticketClinicRef.value.ticketProcedureList || []
    )
  ) {
    return true
  }
  return false
})

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicProcedure.vue:45 ~ onMounted')
  try {
    procedureMap.value = await ProcedureService.getMap()
  } catch (error: any) {
    console.log('🚀 ~ file: TicketClinicProcedure.vue:52 ~ ProcedureService.list ~ error:', error)
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketProcedureList.value[index]
  ticketProcedureList.value[index] = ticketProcedureList.value[index + count]
  ticketProcedureList.value[index + count] = temp
}

const saveTicketProcedureList = async () => {
  try {
    const ticketProcedureUpdate = await TicketClinicApi.updateTicketProcedureList({
      ticketId: ticketClinicRef.value.id,
      ticketProcedureList: ticketProcedureList.value,
    })
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicProcedure.vue:97 ~ saveTicketProcedureList ~ error:', error)
  }
}

const destroyTicketProcedure = async (ticketProcedureId: number) => {
  ModalStore.confirm({
    title: 'Xác nhận xóa dịch vụ ?',
    content: [
      '- Hệ thống sẽ xóa dịch vụ này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        const indexDestroy = ticketProcedureList.value.findIndex((i) => i.id === ticketProcedureId)
        if (indexDestroy !== -1) {
          ticketProcedureList.value.splice(indexDestroy, 1)
        }
        await TicketClinicApi.destroyTicketProcedure({
          ticketId: ticketClinicRef.value.id,
          ticketProcedureId,
        })
      } catch (error) {
        console.log('🚀 ~ file: TicketClinicProcedure.vue:118 ~ onOk: ~ error:', error)
      }
    },
  })
}
</script>
<template>
  <TicketClinicProcedureSelectItem />
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
          <tr v-for="(tpItem, index) in ticketProcedureList" :key="tpItem.procedureId">
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
            <td>{{ procedureMap[tpItem.procedureId]?.name }}</td>
            <td style="width: 150px">
              <div
                v-if="
                  [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.ticketStatus)
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
            <td class="text-right">
              {{ formatMoney(tpItem.actualPrice * tpItem.quantity) }}
            </td>
            <td class="text-center">
              <a
                v-if="
                  ![TicketStatus.Debt, TicketStatus.Completed].includes(
                    ticketClinicRef.ticketStatus
                  )
                "
                class="text-red-500"
                @click="destroyTicketProcedure(tpItem.id)">
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
      v-if="
        permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PROCEDURE_LIST] &&
        ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.ticketStatus)
      "
      color="blue"
      :disabled="!hasChangeData"
      icon="save"
      @click="saveTicketProcedureList">
      Lưu lại
    </VueButton>
  </div>
</template>
<style lang="scss" scope></style>
