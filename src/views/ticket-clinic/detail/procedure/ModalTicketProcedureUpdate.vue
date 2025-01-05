<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputFilter, InputNumber } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { CommissionService, RoleInteractType } from '../../../../modules/commission'
import { Procedure, ProcedureService } from '../../../../modules/procedure'
import { Role, RoleService } from '../../../../modules/role'
import { TicketClinicProcedureApi, ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketProcedure } from '../../../../modules/ticket-procedure'
import { TicketUser } from '../../../../modules/ticket-user'
import { User, UserService } from '../../../../modules/user'
import { UserRoleService } from '../../../../modules/user-role'
import { DString } from '../../../../utils'

const emit = defineEmits<{
  (e: 'success', value: TicketProcedure, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const procedureMap = ref<Record<string, Procedure>>({})
const roleMap = ref<Record<string, Role>>({})
const userRoleMapRoleIdOptions = ref<Record<string, { value: number; text: string; data: User }[]>>(
  {}
)

const ticketProcedureOrigin = ref<TicketProcedure>(TicketProcedure.blank())
const ticketUserListOrigin = ref<TicketUser[]>([])
const ticketProcedure = ref<TicketProcedure>(TicketProcedure.blank())
const ticketUserList = ref<TicketUser[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const refreshTicketUserList = async () => {
  ticketUserListOrigin.value = []
  const ticketUserListRef =
    ticketClinicRef.value.ticketUserGroup?.[RoleInteractType.Procedure]?.[
      ticketProcedure.value.id
    ] || []

  const commissionList = await CommissionService.list({
    filter: {
      interactType: RoleInteractType.Procedure,
      interactId: ticketProcedure.value.procedureId,
    },
  })

  // lấy tất cả role có trong commission trước
  commissionList.forEach((i) => {
    const findExist = ticketUserListRef.find((j) => j.roleId === i.roleId)
    if (findExist) {
      ticketUserListOrigin.value.push(TicketUser.from(findExist))
    } else {
      const ticketUserBlank = TicketUser.blank()
      ticketUserBlank.roleId = i.roleId
      ticketUserListOrigin.value.push(ticketUserBlank)
    }
  })

  // lấy role còn thừa ra ở trong ticketUser vẫn phải hiển thị
  ticketUserListRef.forEach((i) => {
    const findExist = ticketUserListOrigin.value.find((j) => j.roleId === i.roleId)
    if (findExist) {
      return // nếu đã có rồi thì bỏ qua
    } else {
      ticketUserListOrigin.value.push(TicketUser.from(i))
    }
  })
  ticketUserList.value = TicketUser.fromList(ticketUserListOrigin.value)
}

onMounted(async () => {
  try {
    const fetchPromise = await Promise.all([
      ProcedureService.getMap(),
      RoleService.getMap(),
      UserService.getMap(),
      UserRoleService.list(),
    ])

    procedureMap.value = fetchPromise[0]
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

const openModal = async (ticketProcedureProp: TicketProcedure) => {
  showModal.value = true
  ticketProcedureOrigin.value = TicketProcedure.from(ticketProcedureProp)
  ticketProcedure.value = TicketProcedure.from(ticketProcedureProp)

  await refreshTicketUserList()
}

const hasChangeTicketProcedure = computed(() => {
  const result = !TicketProcedure.equal(ticketProcedureOrigin.value, ticketProcedure.value)
  return result
})

const hasChangeTicketUserList = computed(() => {
  const result = !TicketUser.equalList(ticketUserListOrigin.value, ticketUserList.value)
  return result
})

const hasChangeData = computed(() => {
  const result = hasChangeTicketProcedure.value || hasChangeTicketUserList.value
  return result
})

const closeModal = () => {
  showModal.value = false
  ticketProcedure.value = TicketProcedure.blank()
  ticketProcedureOrigin.value = TicketProcedure.blank()
  ticketUserList.value = []
  ticketUserListOrigin.value = []
}

const clickDestroy = async () => {
  ModalStore.confirm({
    title: 'Xác nhận xóa dịch vụ ?',
    content: [
      '- Hệ thống sẽ xóa dịch vụ này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketClinicProcedureApi.destroyTicketProcedure({
          ticketId: ticketClinicRef.value.id,
          ticketProcedureId: ticketProcedure.value.id,
        })
        emit('success', ticketProcedure.value, 'DESTROY')
        closeModal()
      } catch (error) {
        console.log('🚀 ~ file: TicketClinicProcedure.vue:118 ~ onOk: ~ error:', error)
      }
    },
  })
}

const updateTicketProcedure = async () => {
  saveLoading.value = true
  try {
    await TicketClinicProcedureApi.updateTicketProcedure({
      ticketId: ticketClinicRef.value.id,
      ticketProcedureId: ticketProcedure.value.id,
      ticketProcedure: hasChangeTicketProcedure.value ? ticketProcedure.value : undefined,
      ticketUserList: hasChangeTicketUserList.value ? ticketUserList.value : undefined,
    })
    emit('success', ticketProcedure.value, 'UPDATE')
    closeModal()
  } catch (error) {
    console.log('🚀: ModalTicketProcedureUpdate.vue:139 ~ updateTicketProcedure ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 100px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ procedureMap[ticketProcedure.procedureId]?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 flex flex-wrap gap-4" @submit.prevent="(e) => updateTicketProcedure()">
        <div style="flex-grow: 1; flex-basis: 80%">
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
              {{
                roleMap[ticketUser.roleId]?.displayName || roleMap[ticketUser.roleId]?.name || ''
              }}
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

        <div style="flex-grow: 1; flex-basis: 80%" class="mt-6 flex gap-4">
          <VueButton color="red" icon="trash" @click="clickDestroy">Xóa</VueButton>
          <VueButton class="ml-auto" type="reset" icon="close" @click="closeModal">
            Đóng lại
          </VueButton>
          <VueButton
            :disabled="!hasChangeData"
            :loading="saveLoading"
            color="blue"
            type="submit"
            icon="save">
            Cập nhật
          </VueButton>
        </div>
      </form>
    </div>
  </VueModal>
</template>
<style lang="scss" scope></style>
