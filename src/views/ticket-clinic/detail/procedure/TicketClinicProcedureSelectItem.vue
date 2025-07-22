<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconFileSearch } from '../../../../common/icon-antd'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputFilter, InputNumber, InputOptions } from '../../../../common/vue-form'
import { MeService } from '../../../../modules/_me/me.service'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { PositionService, PositionInteractType } from '../../../../modules/position'
import { DiscountType } from '../../../../modules/enum'
import { PermissionId } from '../../../../modules/permission/permission.enum'
import { Procedure, ProcedureService } from '../../../../modules/procedure'
import { Role, RoleService } from '../../../../modules/role'
import { TicketStatus } from '../../../../modules/ticket'
import { TicketProcedure } from '../../../../modules/ticket-procedure'
import { TicketUser } from '../../../../modules/ticket-user'
import { User, UserService } from '../../../../modules/user'
import { UserRoleService } from '../../../../modules/user-role'
import { ESString } from '../../../../utils'
import ModalProcedureDetail from '../../../master-data/procedure/detail/ModalProcedureDetail.vue'
import { ticketRoomRef } from '@/modules/room'

const emit = defineEmits<{
  (e: 'success', value: { ticketProcedure: TicketProcedure; ticketUserList: TicketUser[] }): void
}>()

const inputSearchProcedure = ref<InstanceType<typeof InputOptions>>()
const modalProcedureDetail = ref<InstanceType<typeof ModalProcedureDetail>>()

const { userPermission } = MeService

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const roleMap = ref<Record<string, Role>>({})
const userRoleMapRoleIdOptions = ref<Record<string, { value: number; text: string; data: User }[]>>(
  {},
)
const ticketUserList = ref<TicketUser[]>([])

const procedureOptions = ref<{ value: number; text: string; data: Procedure }[]>([])
const ticketProcedure = ref<TicketProcedure>(TicketProcedure.blank())

onMounted(async () => {
  try {
    const fetchPromise = await Promise.all([
      ProcedureService.list({ filter: { isActive: 1 } }),
      RoleService.getMap(),
      UserService.getMap(),
      UserRoleService.list(),
    ])

    procedureOptions.value = fetchPromise[0].map((i) => ({ value: i.id, text: i.name, data: i }))
    roleMap.value = fetchPromise[1]
    const userMap = fetchPromise[2]
    const userRoleList = fetchPromise[3]

    userRoleList.forEach((i) => {
      const key = i.roleId
      if (!userRoleMapRoleIdOptions.value[key]) {
        userRoleMapRoleIdOptions.value[key] = []
      }
      userRoleMapRoleIdOptions.value[key].push({
        value: userMap[i.userId]?.id || 0,
        text: userMap[i.userId]?.fullName || '',
        data: userMap[i.userId],
      })
    })
  } catch (error: any) {
    console.log('🚀 ~ file: TicketClinicProcedureSelectItem.vue:51 ~ onMounted ~ error:', error)
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const reset = () => {
  ticketProcedure.value = TicketProcedure.blank()
  ticketUserList.value = []
}

const refreshTicketUserList = async () => {
  ticketUserList.value = []
  const ticketUserListOrigin: TicketUser[] = []
  // const ticketUserListOrigin =
  //   ticketRoomRef.value.ticketUserGroup?.[PositionInteractType.Procedure]?.[
  //     ticketProcedure.value.id
  //   ] || []

  const positionList = await PositionService.list({
    filter: {
      positionType: PositionInteractType.Procedure,
      positionInteractId: ticketProcedure.value.procedureId,
    },
  })

  // lấy tất cả role có trong commission trước
  positionList.forEach((i) => {
    const findExist = ticketUserListOrigin.find((j) => j.roleId === i.roleId)
    if (findExist) {
      ticketUserList.value.push(TicketUser.from(findExist))
    } else {
      const ticketUserBlank = TicketUser.blank()
      ticketUserBlank.roleId = i.roleId
      ticketUserList.value.push(ticketUserBlank)
    }
  })

  // lấy role còn thừa ra ở trong ticketUser vẫn phải hiển thị
  ticketUserListOrigin.forEach((i) => {
    const findExist = ticketUserList.value.find((j) => j.roleId === i.roleId)
    if (findExist) {
      return // nếu đã có rồi thì bỏ qua
    } else {
      ticketUserList.value.push(TicketUser.from(i))
    }
  })
}

const selectProcedure = async (procedureProp?: Procedure) => {
  if (procedureProp) {
    const priorityList = (ticketRoomRef.value.ticketProcedureList || []).map((i) => i.priority)
    priorityList.push(0) // tránh tạo mảng rỗng thì Math.max không tính được
    const priorityMax = Math.max(...priorityList)

    const temp = TicketProcedure.blank()

    temp.ticketId = ticketRoomRef.value.id
    temp.priority = priorityMax + 1
    temp.customerId = ticketRoomRef.value.customerId
    temp.procedureId = procedureProp.id
    temp.procedure = procedureProp

    temp.paymentMoneyStatus = settingStore.TICKET_CLINIC_DETAIL.procedure.paymentMoneyStatus

    temp.expectedPrice = procedureProp.price
    temp.discountMoney = 0
    temp.discountPercent = 0
    temp.discountType = DiscountType.VND
    temp.expectedPrice = procedureProp.price
    temp.actualPrice = procedureProp.price
    temp.quantity = 1
    temp.startedAt = Date.now()

    await ProcedureService.executeRelation([procedureProp], { discountList: true })
    const discountApply = procedureProp?.discountApply
    if (discountApply) {
      let { discountType, discountPercent, discountMoney } = discountApply
      const expectedPrice = temp.expectedPrice || 0
      if (discountType === DiscountType.Percent) {
        discountMoney = Math.round((expectedPrice * (discountPercent || 0)) / 100)
      }
      if (discountType === DiscountType.VND) {
        discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
      }
      temp.discountType = discountType
      temp.discountPercent = discountPercent
      temp.discountMoney = discountMoney
      temp.actualPrice = expectedPrice - discountMoney
    }

    ticketProcedure.value = temp

    await refreshTicketUserList()
  } else {
    ticketProcedure.value = TicketProcedure.blank()
  }
}

const addTicketProcedure = async () => {
  emit('success', {
    ticketProcedure: ticketProcedure.value,
    ticketUserList: ticketUserList.value,
  })
  reset()
}
</script>
<template>
  <ModalProcedureDetail ref="modalProcedureDetail" />
  <form class="mt-4 flex flex-wrap gap-4" @submit.prevent="(e) => addTicketProcedure()">
    <div style="flex-grow: 1; flex-basis: 80%">
      <div class="flex gap-1 flex-wrap items-center">
        <span>Chỉ định dịch vụ</span>
        <a
          v-if="ticketProcedure.procedureId && ticketProcedure.procedure"
          @click="modalProcedureDetail?.openModal(ticketProcedure.procedureId)"
        >
          <IconFileSearch />
        </a>
      </div>
      <div style="height: 40px">
        <InputFilter
          ref="inputSearchProcedure"
          :value="ticketProcedure.procedureId"
          :options="procedureOptions"
          :maxHeight="320"
          placeholder="Tìm kiếm tên dịch vụ"
          :disabled="[TicketStatus.Completed, TicketStatus.Debt].includes(ticketRoomRef.status)"
          @selectItem="({ data }) => selectProcedure(data)"
        >
          <template #option="{ item: { data } }">
            <div>
              <b>{{ data.name }}</b>
              - {{ formatMoney(data.price) }}
            </div>
          </template>
        </InputFilter>
      </div>
    </div>

    <div
      style="flex-grow: 1"
      :style="ticketUserList.length % 2 == 0 ? 'flex-basis: 80%' : 'flex-basis: 45%'"
    >
      <div>Số lượng</div>
      <div>
        <InputNumber v-model:value="ticketProcedure.quantity" required :validate="{ gt: 0 }" />
      </div>
    </div>

    <template v-if="ticketUserList.length">
      <div
        v-for="(ticketUser, index) in ticketUserList"
        :key="index"
        style="flex-basis: 45%; flex-grow: 1; min-width: 300px"
      >
        <div>{{ roleMap[ticketUser.roleId]?.name || '' }}</div>
        <div>
          <InputFilter
            v-model:value="ticketUserList[index].userId"
            :options="userRoleMapRoleIdOptions[ticketUser.roleId] || []"
            :maxHeight="200"
            placeholder="Tìm kiếm bằng tên hoặc SĐT của nhân viên"
          >
            <template #option="{ item: { data } }">
              <div>
                <b>{{ data.fullName }}</b>
                - {{ ESString.formatPhone(data.phone) }} -
              </div>
            </template>
          </InputFilter>
        </div>
      </div>
    </template>

    <div style="flex-grow: 1; flex-basis: 80%" class="flex justify-center">
      <VueButton
        icon="plus"
        :disabled="
          [TicketStatus.Completed, TicketStatus.Debt].includes(ticketRoomRef.status) ||
          !userPermission[PermissionId.TICKET_CLINIC_UPDATE_TICKET_PROCEDURE_LIST] ||
          !ticketProcedure.procedureId
        "
        color="blue"
        type="submit"
      >
        Thêm mới
      </VueButton>
    </div>
  </form>
</template>
<style lang="scss" scope></style>
