<script lang="ts" setup>
import { IconDoubleRight } from '@/common/icon-antd'
import { Position, PositionService, PositionType } from '@/modules/position'
import { TicketUser } from '@/modules/ticket-user'
import { User } from '@/modules/user'
import InputSearchUser from '@/views/component/InputSearchUser.vue'
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'update:ticketUserList', data: TicketUser[]): void
  (e: 'fix:ticketUserList', data: TicketUser[]): void
}>()

const props = withDefaults(
  defineProps<{
    ticketUserList: TicketUser[]
    positionType: PositionType
    positionInteractId: number
    title: string
  }>(),
  {
    ticketUserList: () => [],
    positionType: PositionType.Ticket,
    positionInteractId: 0,
    title: '',
  },
)

const currentTicketUserList = ref<TicketUser[]>([])

const refreshTicketUserList = async () => {
  const positionList = await PositionService.list({
    filter: {
      positionType: props.positionType,
      positionInteractId: { IN: [props.positionInteractId, 0] },
    },
  })
  const positionMapRoleId: Record<string, Position> = {} // Cần tính lại vì nhiều role trùng nhau, chọn ưu tiên cao nhất
  positionList.forEach((i) => {
    if (!positionMapRoleId[i.roleId] || positionMapRoleId[i.roleId].priority < i.priority) {
      positionMapRoleId[i.roleId] = i
    }
  })
  const positionListFix = Object.values(positionMapRoleId)

  const ticketUserListFix: TicketUser[] = []

  // lấy tất cả role có trong commission trước
  positionListFix.forEach((i) => {
    const findExist = props.ticketUserList.find((j) => j.roleId === i.roleId)
    if (findExist) {
      ticketUserListFix.push(TicketUser.from(findExist))
      // findExist.position = i
    } else {
      const ticketUserBlank = TicketUser.blank()
      ticketUserBlank.roleId = i.roleId
      ticketUserBlank.positionId = i.id
      // ticketUserBlank.position = i
      ticketUserListFix.push(ticketUserBlank)
    }
  })

  // lấy role còn thừa ra ở trong ticketUser vẫn phải hiển thị
  props.ticketUserList.forEach((i) => {
    const findExist = ticketUserListFix.find((j) => j.roleId === i.roleId)
    if (findExist) {
      return // nếu đã có rồi thì bỏ qua
    } else {
      ticketUserListFix.push(TicketUser.from(i))
    }
  })

  currentTicketUserList.value = ticketUserListFix
  emit('fix:ticketUserList', ticketUserListFix)
  emit('update:ticketUserList', ticketUserListFix)
}

onMounted(async () => {
  await refreshTicketUserList()
})

const handleSelectUser = (index: number, userData?: User) => {
  currentTicketUserList.value[index].user = userData ? User.from(userData) : User.blank()
  // emit('update:ticketUserList', currentTicketUserList.value)
}
</script>
<template>
  <template v-if="currentTicketUserList.length">
    <div v-if="title" class="font-bold italic flex items-center gap-2">
      <IconDoubleRight />
      <span>{{ title }}</span>
    </div>
    <div class="flex flex-wrap gap-4">
      <div
        v-for="(ticketUser, index) in currentTicketUserList"
        :key="ticketUser._localId"
        style="flex-basis: 45%; flex-grow: 1; min-width: 300px"
      >
        <InputSearchUser
          v-model:userId="ticketUser.userId"
          :positionId="ticketUser.positionId"
          @selectUser="(v) => handleSelectUser(index, v)"
        ></InputSearchUser>
      </div>
    </div>
  </template>
</template>
