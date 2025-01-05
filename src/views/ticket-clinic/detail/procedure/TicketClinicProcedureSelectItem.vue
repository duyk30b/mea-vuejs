<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputFilter, InputNumber, InputOptions } from '../../../../common/vue-form'
import { useMeStore } from '../../../../modules/_me/me.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { Commission, CommissionService, RoleInteractType } from '../../../../modules/commission'
import { DiscountType } from '../../../../modules/enum'
import { Procedure, ProcedureService } from '../../../../modules/procedure'
import { Role, RoleService } from '../../../../modules/role'
import { TicketStatus } from '../../../../modules/ticket'
import { TicketClinicProcedureApi, ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketProcedure } from '../../../../modules/ticket-procedure'
import { TicketUser } from '../../../../modules/ticket-user'
import { User, UserService } from '../../../../modules/user'
import { UserRole, UserRoleService } from '../../../../modules/user-role'
import { DArray, DString } from '../../../../utils'

const inputSearchProcedure = ref<InstanceType<typeof InputOptions>>()

const meStore = useMeStore()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const roleMap = ref<Record<string, Role>>({})
const userRoleMapRoleIdOptions = ref<Record<string, { value: number; text: string; data: User }[]>>(
  {}
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
  //   ticketClinicRef.value.ticketUserGroup?.[RoleInteractType.Procedure]?.[
  //     ticketProcedure.value.id
  //   ] || []

  const commissionList = await CommissionService.list({
    filter: {
      interactType: RoleInteractType.Procedure,
      interactId: ticketProcedure.value.procedureId,
    },
  })

  // lấy tất cả role có trong commission trước
  commissionList.forEach((i) => {
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

const selectProcedure = async (instance?: Procedure) => {
  if (instance) {
    const temp = TicketProcedure.blank()

    temp.ticketId = ticketClinicRef.value.id
    temp.priority = (ticketClinicRef.value.ticketProcedureList || []).length + 1
    temp.procedureId = instance.id
    temp.procedure = instance

    temp.expectedPrice = instance.price
    temp.discountMoney = 0
    temp.discountPercent = 0
    temp.discountType = DiscountType.VND
    temp.expectedPrice = instance.price
    temp.actualPrice = instance.price
    temp.quantity = 1
    temp.startedAt = Date.now()

    ticketProcedure.value = temp

    await refreshTicketUserList()
  } else {
    ticketProcedure.value = TicketProcedure.blank()
  }
}

const addTicketProcedure = async () => {
  try {
    await TicketClinicProcedureApi.addTicketProcedure({
      ticketId: ticketClinicRef.value.id,
      ticketProcedure: ticketProcedure.value,
      ticketUserList: ticketUserList.value,
    })
    reset()
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicProcedure.vue:109 ~ addTicketProcedure ~ error:', error)
  }
}
</script>
<template>
  <form class="mt-4 flex flex-wrap gap-4" @submit.prevent="(e) => addTicketProcedure()">
    <div style="flex-grow: 1; flex-basis: 80%">
      <div>Chỉ định dịch vụ</div>
      <div style="height: 40px">
        <InputFilter
          ref="inputSearchProcedure"
          :value="ticketProcedure.procedureId"
          :options="procedureOptions"
          :maxHeight="320"
          placeholder="Tìm kiếm tên dịch vụ"
          :disabled="
            [TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.ticketStatus)
          "
          @selectItem="({ data }) => selectProcedure(data)">
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
      :style="ticketUserList.length % 2 == 0 ? 'flex-basis: 80%' : 'flex-basis: 45%'">
      <div>Số lượng</div>
      <div>
        <InputNumber v-model:value="ticketProcedure.quantity" required :validate="{ gt: 0 }" />
      </div>
    </div>

    <template v-if="ticketUserList.length">
      <div
        v-for="(ticketUser, index) in ticketUserList"
        :key="index"
        style="flex-basis: 45%; flex-grow: 1; min-width: 300px">
        <div>
          {{ roleMap[ticketUser.roleId]?.displayName || roleMap[ticketUser.roleId]?.name || '' }}
        </div>
        <div>
          <InputFilter
            v-model:value="ticketUserList[index].userId"
            :options="userRoleMapRoleIdOptions[ticketUser.roleId] || []"
            :maxHeight="200"
            placeholder="Tìm kiếm bằng tên hoặc SĐT của nhân viên">
            <template #option="{ item: { data } }">
              <div>
                <b>{{ data.fullName }}</b>
                - {{ DString.formatPhone(data.phone) }} -
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
          [TicketStatus.Completed, TicketStatus.Debt].includes(ticketClinicRef.ticketStatus)
        "
        color="blue"
        type="submit">
        Thêm vào đơn
      </VueButton>
    </div>
  </form>
</template>
<style lang="scss" scope></style>
