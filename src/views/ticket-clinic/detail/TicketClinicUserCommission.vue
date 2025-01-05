<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { IconFileSearch, IconTrash } from '../../../common/icon'
import { InputMoney, InputNumber, VueSelect } from '../../../common/vue-form'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { CommissionCalculatorType, RoleInteractType } from '../../../modules/commission'
import { DiscountType } from '../../../modules/enum'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Role, RoleService } from '../../../modules/role'
import { TicketStatus } from '../../../modules/ticket'
import { ticketClinicRef } from '../../../modules/ticket-clinic'
import { TicketProcedure } from '../../../modules/ticket-procedure'
import { TicketUser } from '../../../modules/ticket-user'
import { User, UserService } from '../../../modules/user'
import { Procedure, ProcedureService } from '../../../modules/procedure'
import { Laboratory, LaboratoryService } from '../../../modules/laboratory'
import { Radiology, RadiologyService } from '../../../modules/radiology'

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap, organization } = meStore

const ticketUserList = ref<TicketUser[]>([])
const userMap = ref<Record<string, User>>({})
const roleMap = ref<Record<string, Role>>({})

const procedureMap = ref<Record<string, Procedure>>({})
const laboratoryMap = ref<Record<string, Laboratory>>({})
const radiologyMap = ref<Record<string, Radiology>>({})

const saveLoading = ref(false)

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicUserCommission.vue:35 ~ onMounted')
  const fetchPromise = await Promise.all([
    UserService.getMap(),
    RoleService.getMap(),
    ProcedureService.getMap(),
    LaboratoryService.getMap(),
    RadiologyService.getMap(),
  ])
  userMap.value = fetchPromise[0]
  roleMap.value = fetchPromise[1]
  procedureMap.value = fetchPromise[2]
  laboratoryMap.value = fetchPromise[3]
  radiologyMap.value = fetchPromise[4]
})

watch(
  () => ticketClinicRef.value.ticketUserList,
  (newValue, oldValue) => {
    ticketUserList.value = TicketUser.fromList(newValue || [])
    ticketUserList.value.forEach((i) => {
      if (i.interactType === RoleInteractType.Procedure) {
        i.ticketProcedure = (ticketClinicRef.value.ticketProcedureList || []).find((j) => {
          return j.id === i.ticketItemId
        })
      }
    })
  },
  { immediate: true }
)

const totalCommissionMoney = computed(() => {
  return ticketUserList.value.reduce((acc, item) => acc + item.commissionMoney, 0)
})

const disabledSave = computed(() => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)) {
    return true
  }

  if (!TicketUser.equalList(ticketUserList.value, ticketClinicRef.value.ticketUserList || [])) {
    return false
  }

  return true
})

const destroyTicketUser = async (ticketUserId: number) => {}

const saveTicketItemsMoney = async () => {
  saveLoading.value = true
  try {
    console.log(
      '🚀 ~ file: TicketClinicUserCommission.vue:137 ~ saveTicketItemsMoney ~ saveLoading:',
      saveLoading
    )
  } catch (e) {
    console.log('🚀 ~ file: TicketClinicSummary.vue:321 ~ saveTicketItemsMoney ~ e:', e)
  } finally {
    saveLoading.value = false
  }
}
</script>
<template>
  <div class="mt-4 table-wrapper">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Vai trò</th>
          <th>Nhân viên</th>
          <th>Phiếu</th>
          <th>Giá DV</th>
          <th>Tính Hoa hồng</th>
          <th>% Hoa hồng</th>
          <th>Tiền Hoa Hồng</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(ticketUser, index) in ticketUserList || []" :key="index">
          <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
            {{ index + 1 }}
          </td>
          <td>
            {{ roleMap[ticketUser.roleId]?.displayName || roleMap[ticketUser.roleId]?.name || '' }}
          </td>
          <td>
            <div class="flex gap-1">
              <span>{{ userMap[ticketUser.userId]?.fullName }}</span>
            </div>
          </td>
          <td>
            <div style="min-width: 100px;">
              <template v-if="ticketUser.interactType === RoleInteractType.Ticket">
                Phiếu khám
              </template>
              <template v-if="ticketUser.interactType === RoleInteractType.Procedure">
                {{ procedureMap[ticketUser.ticketProcedure?.procedureId || 0]?.name }}
              </template>
            </div>
          </td>
          <td class="text-right">
            <template
              v-if="
                ticketUser.interactType === RoleInteractType.Procedure && ticketUser.ticketProcedure
              ">
              <div
                v-if="ticketUser.ticketProcedure.discountMoney"
                class="text-xs italic text-red-500">
                <del>
                  {{
                    formatMoney(
                      ticketUser.ticketProcedure.expectedPrice * ticketUser.ticketProcedure.quantity
                    )
                  }}
                </del>
              </div>
              {{
                formatMoney(
                  ticketUser.ticketProcedure.actualPrice * ticketUser.ticketProcedure.quantity
                )
              }}
            </template>
          </td>
          <td>
            <div style="width: 180px">
              <VueSelect
                :value="ticketUser.commissionCalculatorType"
                :options="[
                  { value: CommissionCalculatorType.VND, text: 'VNĐ' },
                  ...(ticketUser.interactType !== RoleInteractType.Ticket
                    ? [
                        { value: CommissionCalculatorType.PercentRetail, text: '% Giá niêm yết' },
                        {
                          value: CommissionCalculatorType.PercentActual,
                          text: '% Giá sau chiết khấu',
                        },
                      ]
                    : []),
                ]"
                @update:value="(v) => (ticketUserList[index].commissionCalculatorType = v)" />
            </div>
          </td>
          <td>
            <div
              v-if="ticketUser.commissionCalculatorType !== CommissionCalculatorType.VND"
              style="max-width: 100px">
              <InputNumber
                :value="ticketUser.commissionPercent"
                textAlign="right"
                @update:value="(v) => (ticketUserList[index].commissionPercent = v)" />
            </div>
          </td>

          <td>
            <div style="max-width: 100px">
              <InputNumber
                :value="ticketUser.commissionMoney"
                textAlign="right"
                @update:value="(v) => (ticketUserList[index].commissionMoney = v)" />
            </div>
          </td>
          <td class="text-center">
            <a class="text-red-500" @click="destroyTicketUser(ticketUser.id)">
              <IconTrash />
            </a>
          </td>
        </tr>
        <tr>
          <td class="text-right" colspan="7">
            <span class="uppercase">Tổng tiền hoa hồng</span>
          </td>
          <td class="font-bold text-right whitespace-nowrap">
            {{ formatMoney(totalCommissionMoney) }}
          </td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="mt-8 flex gap-4">
    <VueButton
      v-if="permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_ITEMS_MONEY]"
      class="ml-auto"
      color="blue"
      :disabled="disabledSave"
      :loading="saveLoading"
      icon="save"
      @click="saveTicketItemsMoney">
      Lưu lại
    </VueButton>
  </div>
</template>

<style lang="scss" scoped>
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  opacity: 1;
}
</style>
