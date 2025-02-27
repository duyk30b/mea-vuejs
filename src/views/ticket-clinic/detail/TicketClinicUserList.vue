<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { InputFilter } from '../../../common/vue-form'
import VueButton from '../../../common/VueButton.vue'
import { useMeStore } from '../../../modules/_me/me.store'
import { useSettingStore } from '../../../modules/_me/setting.store'
import { Commission, CommissionService, InteractType } from '../../../modules/commission'
import { PermissionId } from '../../../modules/permission/permission.enum'
import { Role, RoleService } from '../../../modules/role'
import { TicketStatus } from '../../../modules/ticket'
import { ticketClinicRef, TicketClinicUserApi } from '../../../modules/ticket-clinic'
import { TicketUser } from '../../../modules/ticket-user'
import { User, UserService } from '../../../modules/user'
import { UserRole, UserRoleService } from '../../../modules/user-role'
import { DString } from '../../../utils'

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore
const meStore = useMeStore()
const { permissionIdMap } = meStore

const ticketUserTicketMap = ref<Record<string, TicketUser>>({})

const roleMap = ref<Record<string, Role>>({})
const userMap = ref<Record<string, User>>({})
const userRoleList = ref<UserRole[]>([])
const roleIdListShow = ref<number[]>([])
const commissionList = ref<Commission[]>([])

const saveLoading = ref(false)

const refreshRoleIdList = () => {
  ticketUserTicketMap.value = {}
  const roleIdList = commissionList.value.map((i) => i.roleId)

  ticketClinicRef.value.ticketUserGroup?.[InteractType.Ticket]?.[0].forEach((i) => {
    ticketUserTicketMap.value[i.roleId] = TicketUser.from(i)
    if (!roleIdList.includes(i.roleId)) {
      roleIdList.push(i.roleId)
    }
  })

  roleIdList.forEach((roleId) => {
    if (!ticketUserTicketMap.value[roleId]) {
      const ticketUserBlank = TicketUser.blank()
      ticketUserBlank.interactType = InteractType.Ticket
      ticketUserBlank.interactId = 0
      ticketUserBlank.ticketItemId = 0
      ticketUserBlank.roleId = roleId
      ticketUserTicketMap.value[roleId] = ticketUserBlank
    }
  })

  roleIdListShow.value = roleIdList
}

watch(
  () => ticketClinicRef.value.ticketUserList,
  (newValue, oldValue) => {
    refreshRoleIdList()
  },
  { immediate: true, deep: true }
)

onMounted(async () => {
  console.log('🚀 ~ file: TicketClinicUserList.vue:59 ~ onMounted')

  Promise.all([
    RoleService.getMap(),
    UserService.getMap(),
    CommissionService.list({ filter: { interactType: InteractType.Ticket } }),
  ])
    .then((result) => {
      roleMap.value = result[0]
      userMap.value = result[1]
      commissionList.value = result[2]
      refreshRoleIdList()
    })
    .catch((e) => {
      console.log('🚀 ~ file: ModalTicketClinicCreate.vue ~ openModal 91 ~ e:', e)
    })

  UserRoleService.list()
    .then((result) => (userRoleList.value = result))
    .catch((e) => {
      console.log('🚀 ~ file: ModalTicketClinicCreate.vue:115 ~ UserRoleService ~ e:', e)
    })
})

const saveTicketUserList = async () => {
  try {
    saveLoading.value = true
    await TicketClinicUserApi.updateTicketUserItem({
      ticketId: ticketClinicRef.value.id,
      interactId: 0,
      interactType: InteractType.Ticket,
      ticketItemId: 0,
      ticketUserList: Object.values(ticketUserTicketMap.value),
    })
  } catch (error) {
    console.log('🚀 ~ file: TicketClinicUserList.vue:100 ~ saveTicketUserList ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const hasChangeData = computed(() => {
  const ticketUserOrigin = ticketClinicRef.value.ticketUserGroup?.[InteractType.Ticket]?.[0] || []
  const ticketUserTicketList = Object.values(ticketUserTicketMap.value).filter((i) => !!i.userId)
  if (ticketUserTicketList.length !== ticketUserOrigin.length) {
    return true
  }
  for (let i = 0; i < ticketUserOrigin.length || 0; i++) {
    const cur = ticketClinicRef.value.ticketUserGroup[InteractType.Ticket][0][i]
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
      style="flex-basis: 45%; flex: 1; min-width: 300px">
      <div>
        {{ roleMap[roleId]?.displayName || roleMap[roleId]?.name || '' }}
      </div>
      <div>
        <InputFilter
          v-model:value="ticketUserTicketMap[roleId]!.userId"
          :disabled="
            !permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_USER_LIST] ||
            [TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.ticketStatus)
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
          placeholder="Tên nhân viên">
          <template #option="{ item: { data } }">
            <div>
              <b>{{ data.fullName }}</b>
              - {{ DString.formatPhone(data.phone) }} -
            </div>
          </template>
        </InputFilter>
      </div>
    </div>
    <div class="flex gap-4">
      <VueButton
        v-if="
          permissionIdMap[PermissionId.TICKET_CLINIC_UPDATE_TICKET_USER_LIST] &&
          ![TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.ticketStatus)
        "
        class="ml-auto"
        color="blue"
        :disabled="!hasChangeData"
        :loading="saveLoading"
        icon="save"
        @click="saveTicketUserList">
        Lưu lại
      </VueButton>
    </div>
  </div>
</template>
