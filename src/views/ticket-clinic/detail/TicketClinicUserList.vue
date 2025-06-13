<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import VueButton from '../../../common/VueButton.vue'
import { InputFilter } from '../../../common/vue-form'
import { MeService } from '../../../modules/_me/me.service'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Position, PositionService, PositionInteractType } from '../../../modules/position'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { RoleService } from '../../../modules/role'
import { TicketStatus } from '../../../modules/ticket'
import { TicketClinicUserApi } from '../../../modules/ticket-clinic'
import { TicketUser } from '../../../modules/ticket-user'
import { UserService } from '../../../modules/user'
import { UserRole, UserRoleService } from '../../../modules/user-role'
import { ESString } from '../../../utils'
import { ticketRoomRef } from '@/modules/room/room.ref'

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const { userPermission } = MeService

const ticketUserTicketMap = ref<Record<string, TicketUser>>({})

const userRoleList = ref<UserRole[]>([])
const roleIdListShow = ref<number[]>([])
const positionList = ref<Position[]>([])

const roleMap = RoleService.roleMap
const userMap = UserService.userMap

const saveLoading = ref(false)

const refreshRoleIdList = () => {
  ticketUserTicketMap.value = {}
  const roleIdList = positionList.value.map((i) => i.roleId)

  // ?.[0]? ==> trường hợp PositionInteractType là Ticket thì ticketItemId luôn luôn = 0
  ticketRoomRef.value.ticketUserGroup?.[PositionInteractType.Ticket]?.[0]?.forEach((i) => {
    ticketUserTicketMap.value[i.roleId] = TicketUser.from(i)
    if (!roleIdList.includes(i.roleId)) {
      roleIdList.push(i.roleId)
    }
  })

  roleIdList.forEach((roleId) => {
    if (!ticketUserTicketMap.value[roleId]) {
      const ticketUserBlank = TicketUser.blank()
      ticketUserBlank.positionType = PositionInteractType.Ticket
      ticketUserBlank.positionInteractId = 0
      ticketUserBlank.ticketItemId = 0
      ticketUserBlank.roleId = roleId
      ticketUserTicketMap.value[roleId] = ticketUserBlank
    }
  })

  roleIdListShow.value = roleIdList
}

watch(
  () => ticketRoomRef.value.ticketUserGroup,
  (newValue, oldValue) => {
    refreshRoleIdList()
  },
  { immediate: true, deep: true },
)

onMounted(async () => {
  try {
    const fetchPromise = await Promise.all([
      RoleService.getMap(),
      UserService.getAll(),
      PositionService.list({ filter: { positionType: PositionInteractType.Ticket } }),
      UserRoleService.list(),
    ])
    positionList.value = fetchPromise[2]
    userRoleList.value = fetchPromise[3]
    refreshRoleIdList()
  } catch (error) {
    console.log('🚀 ~ TicketClinicUserList.vue:73 ~ onMounted ~ error:', error)
  }
})

const saveTicketUserList = async () => {
  try {
    saveLoading.value = true
    await TicketClinicUserApi.chooseUserId({
      ticketId: ticketRoomRef.value.id,
      positionType: PositionInteractType.Ticket,
      positionInteractId: 0,
      ticketItemId: 0,
      quantity: 1,
      ticketUserList: Object.values(ticketUserTicketMap.value),
    })
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicUserList.vue:100 ~ saveTicketUserList ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const hasChangeData = computed(() => {
  const ticketUserOrigin = ticketRoomRef.value.ticketUserGroup?.[PositionInteractType.Ticket]?.[0] || []
  const ticketUserTicketList = Object.values(ticketUserTicketMap.value).filter((i) => !!i.userId)
  if (ticketUserTicketList.length !== ticketUserOrigin.length) {
    return true
  }
  for (let i = 0; i < ticketUserOrigin.length || 0; i++) {
    const cur = ticketRoomRef.value.ticketUserGroup[PositionInteractType.Ticket][0][i]
    if (!TicketUser.equal(cur, ticketUserTicketMap.value[cur.roleId])) {
      return true
    }
  }
  return false
})
</script>
<template>
  <div v-if="roleIdListShow.length" class="bg-white p-4 mt-4 mb-4">
    <div
      v-for="(roleId, index) in roleIdListShow"
      :key="index"
      class="mb-4"
      style="flex-basis: 45%; flex: 1; min-width: 300px"
    >
      <div>
        {{ roleMap[roleId]?.name || '' }}
      </div>
      <div>
        <InputFilter
          v-model:value="ticketUserTicketMap[roleId]!.userId"
          :disabled="
            !userPermission[PermissionId.TICKET_CLINIC_USER_CHOOSE_USERID] ||
            [TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status)
          "
          :options="
            userRoleList
              .filter((i) => i.roleId === roleId)
              .map((i) => {
                return {
                  value: userMap[i.userId]?.id || 0,
                  text: userMap[i.userId]?.fullName || '',
                  data: userMap[i.userId],
                }
              })
          "
          :maxHeight="200"
          placeholder="Tên nhân viên"
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
    <div class="flex gap-4">
      <VueButton
        v-if="
          userPermission[PermissionId.TICKET_CLINIC_USER_CHOOSE_USERID] &&
          ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.status)
        "
        style="margin-left: auto"
        color="blue"
        :disabled="!hasChangeData"
        :loading="saveLoading"
        icon="save"
        @click="saveTicketUserList"
      >
        Lưu lại
      </VueButton>
    </div>
  </div>
</template>
