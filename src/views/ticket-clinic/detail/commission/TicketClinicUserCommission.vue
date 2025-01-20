<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconTrash } from '../../../../common/icon'
import { InputNumber, VueSelect } from '../../../../common/vue-form'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { CommissionCalculatorType, InteractType } from '../../../../modules/commission'
import { Laboratory, LaboratoryService } from '../../../../modules/laboratory'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Procedure, ProcedureService } from '../../../../modules/procedure'
import { Radiology, RadiologyService } from '../../../../modules/radiology'
import { Role, RoleService } from '../../../../modules/role'
import { TicketStatus } from '../../../../modules/ticket'
import { ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketUser } from '../../../../modules/ticket-user'
import { User, UserService } from '../../../../modules/user'
import { IconEditSquare } from '../../../../common/icon-google'

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap, organization } = meStore

const ticketUserList = ref<TicketUser[]>([])
const userMap = ref<Record<string, User>>({})
const roleMap = ref<Record<string, Role>>({})

const saveLoading = ref(false)

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicUserCommission.vue:35 ~ onMounted')
  const fetchPromise = await Promise.all([UserService.getMap(), RoleService.getMap()])
  userMap.value = fetchPromise[0]
  roleMap.value = fetchPromise[1]
})

watch(
  () => ticketClinicRef.value.ticketUserList,
  async (newValue, oldValue) => {
    ticketUserList.value = TicketUser.fromList(newValue || [])
    ticketUserList.value.forEach((i) => {
      if (i.interactType === InteractType.Product) {
        if (ticketClinicRef.value.ticketProductList) {
          const itemFind = (ticketClinicRef.value.ticketProductList || []).find((j) => {
            return j.id === i.ticketItemId
          })
          if (itemFind) i.ticketProduct = itemFind
        }
        if (ticketClinicRef.value.ticketProductConsumableList) {
          const itemFind = (ticketClinicRef.value.ticketProductConsumableList || []).find((j) => {
            return j.id === i.ticketItemId
          })
          if (itemFind) i.ticketProduct = itemFind
        }
        if (ticketClinicRef.value.ticketProductPrescriptionList) {
          const itemFind = (ticketClinicRef.value.ticketProductPrescriptionList || []).find((j) => {
            return j.id === i.ticketItemId
          })
          if (itemFind) i.ticketProduct = itemFind
        }
      }
      if (i.interactType === InteractType.Procedure) {
        i.ticketProcedure = (ticketClinicRef.value.ticketProcedureList || []).find((j) => {
          return j.id === i.ticketItemId
        })
      }
      if (i.interactType === InteractType.Radiology) {
        i.ticketRadiology = (ticketClinicRef.value.ticketRadiologyList || []).find((j) => {
          return j.id === i.ticketItemId
        })
      }
    })
  },
  { immediate: true }
)

const totalCommissionMoney = computed(() => {
  return ticketUserList.value.reduce((acc, item) => {
    return acc + item.commissionMoney * item.quantity
  }, 0)
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
  <div>
    <div class="mt-4 table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Vai trò</th>
            <th>Nhân viên</th>
            <th>Phiếu</th>
            <th>Giá DV</th>
            <th>SL</th>
            <th>Hoa hồng</th>
            <th>T.Tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ticketUser, index) in ticketUserList || []" :key="index">
            <td class="text-center whitespace-nowrap" style="padding: 0.5rem 0.2rem">
              <!-- {{ index + 1 }} -->
              {{ ticketUser.id }}
            </td>
            <td>
              {{
                roleMap[ticketUser.roleId]?.displayName || roleMap[ticketUser.roleId]?.name || ''
              }}
            </td>
            <td>
              <div class="flex gap-1">
                <span>{{ userMap[ticketUser.userId]?.fullName }}</span>
              </div>
            </td>
            <td>
              <div style="min-width: 100px">
                <template v-if="ticketUser.interactType === InteractType.Ticket">
                  Phiếu khám
                </template>
                <template v-if="ticketUser.interactType === InteractType.Product">
                  {{ ticketUser.ticketProduct?.product?.brandName }}
                </template>
                <template v-if="ticketUser.interactType === InteractType.Procedure">
                  {{ ticketUser.ticketProcedure?.procedure?.name }}
                </template>
                <template v-if="ticketUser.interactType === InteractType.Radiology">
                  {{ ticketUser.ticketRadiology?.radiology?.name }}
                </template>
              </div>
            </td>
            <td class="text-right">
              <template
                v-if="ticketUser.interactType === InteractType.Product && ticketUser.ticketProduct">
                <div
                  v-if="ticketUser.ticketProduct.discountMoney"
                  class="text-xs italic text-red-500">
                  <del>
                    {{ formatMoney(ticketUser.ticketProduct.expectedPrice) }}
                  </del>
                </div>
                {{ formatMoney(ticketUser.ticketProduct.actualPrice) }}
              </template>
              <template
                v-if="
                  ticketUser.interactType === InteractType.Procedure && ticketUser.ticketProcedure
                ">
                <div
                  v-if="ticketUser.ticketProcedure.discountMoney"
                  class="text-xs italic text-red-500">
                  <del>
                    {{ formatMoney(ticketUser.ticketProcedure.expectedPrice) }}
                  </del>
                </div>
                {{ formatMoney(ticketUser.ticketProcedure.actualPrice) }}
              </template>
              <template
                v-if="
                  ticketUser.interactType === InteractType.Radiology && ticketUser.ticketRadiology
                ">
                <div
                  v-if="ticketUser.ticketRadiology.discountMoney"
                  class="text-xs italic text-red-500">
                  <del>
                    {{ formatMoney(ticketUser.ticketRadiology.expectedPrice) }}
                  </del>
                </div>
                {{ formatMoney(ticketUser.ticketRadiology.actualPrice) }}
              </template>
            </td>
            <td class="text-center">{{ ticketUser.quantity }}</td>
            <td>
              <div v-if="ticketUser.commissionCalculatorType === CommissionCalculatorType.VND">
                {{ formatMoney(ticketUser.commissionMoney) }}
              </div>
              <div
                v-if="
                  ticketUser.commissionCalculatorType === CommissionCalculatorType.PercentExpected
                ">
                {{ ticketUser.commissionPercent }} % Giá niêm yết
              </div>
              <div
                v-if="
                  ticketUser.commissionCalculatorType === CommissionCalculatorType.PercentActual
                ">
                {{ ticketUser.commissionPercent }} % Giá sau chiết khấu
              </div>
            </td>
            <td class="text-right">
              {{ formatMoney(ticketUser.commissionMoney * ticketUser.quantity) }}
            </td>
            <td class="text-center">
              <a
                v-if="permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_USER_COMMISSION]"
                class="text-orange-500">
                <IconEditSquare width="20" height="20" />
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
  </div>
</template>

<style lang="scss" scoped>
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  opacity: 1;
}
</style>
