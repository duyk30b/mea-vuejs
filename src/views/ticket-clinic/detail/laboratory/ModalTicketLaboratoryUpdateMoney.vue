<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon-antd'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputFilter, InputMoney, InputNumber, VueSelect } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { PositionService, PositionInteractType } from '../../../../modules/position'
import { DiscountType, PaymentMoneyStatus } from '../../../../modules/enum'
import { Laboratory, LaboratoryService } from '../../../../modules/laboratory'
import { Role, RoleService } from '../../../../modules/role'
import { TicketClinicLaboratoryApi } from '../../../../modules/ticket-clinic'
import { TicketLaboratory, TicketLaboratoryStatus } from '../../../../modules/ticket-laboratory'
import { TicketUser } from '../../../../modules/ticket-user'
import { User, UserService } from '../../../../modules/user'
import { UserRoleService } from '../../../../modules/user-role'
import { ESString } from '../../../../utils'
import { ticketRoomRef } from '@/modules/room'

const emit = defineEmits<{
  (e: 'success', value: TicketLaboratory, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const laboratoryMap = ref<Record<string, Laboratory>>({})
const roleMap = ref<Record<string, Role>>({})
const userRoleMapRoleIdOptions = ref<Record<string, { value: number; text: string; data: User }[]>>(
  {},
)

const ticketLaboratoryOrigin = ref<TicketLaboratory>(TicketLaboratory.blank())
let ticketUserListOrigin: TicketUser[] = []
const ticketLaboratory = ref<TicketLaboratory>(TicketLaboratory.blank())
const ticketUserList = ref<TicketUser[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const refreshTicketUserList = async () => {
  ticketUserListOrigin = []
  const ticketUserListRef =
    ticketRoomRef.value.ticketUserGroup?.[PositionInteractType.Laboratory]?.[
      ticketLaboratory.value.id
    ] || []

  const positionList = await PositionService.list({
    filter: {
      positionType: PositionInteractType.Laboratory,
      positionInteractId: ticketLaboratory.value.laboratoryId,
    },
  })

  // lấy tất cả role có trong commission trước
  positionList.forEach((i) => {
    const findExist = ticketUserListRef.find((j) => j.roleId === i.roleId)
    if (findExist) {
      ticketUserListOrigin.push(TicketUser.from(findExist))
    } else {
      const ticketUserBlank = TicketUser.blank()
      ticketUserBlank.roleId = i.roleId
      ticketUserListOrigin.push(ticketUserBlank)
    }
  })

  // lấy role còn thừa ra ở trong ticketUser vẫn phải hiển thị
  ticketUserListRef.forEach((i) => {
    const findExist = ticketUserListOrigin.find((j) => j.roleId === i.roleId)
    if (findExist) {
      return // nếu đã có rồi thì bỏ qua
    } else {
      ticketUserListOrigin.push(TicketUser.from(i))
    }
  })
  ticketUserList.value = TicketUser.fromList(ticketUserListOrigin)
}

onMounted(async () => {
  try {
    const fetchPromise = await Promise.all([
      LaboratoryService.getMap(),
      RoleService.getMap(),
      UserService.getMap(),
      UserRoleService.list(),
    ])

    laboratoryMap.value = fetchPromise[0]
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
    console.log('🚀 ~ file: ModalTicketLaboratoryUpdate.vue:105 ~ onMounted ~ error:', error)
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const openModal = async (ticketLaboratoryProp: TicketLaboratory) => {
  showModal.value = true
  ticketLaboratoryOrigin.value = TicketLaboratory.from(ticketLaboratoryProp)
  ticketLaboratory.value = TicketLaboratory.from(ticketLaboratoryProp)

  await refreshTicketUserList()
}

const hasChangeTicketLaboratory = computed(() => {
  const result = !TicketLaboratory.equal(ticketLaboratoryOrigin.value, ticketLaboratory.value)
  return result
})

const hasChangeTicketUserList = computed(() => {
  const result = !TicketUser.equalList(ticketUserListOrigin, ticketUserList.value)
  return result
})

const hasChangeData = computed(() => {
  const result = hasChangeTicketLaboratory.value || hasChangeTicketUserList.value
  return result
})

const handleChangeUnitDiscountMoney = (data: number) => {
  const discountMoney = data
  const expectedPrice = ticketLaboratory.value.expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketLaboratory.value.discountPercent = discountPercent
  ticketLaboratory.value.discountMoney = discountMoney
  ticketLaboratory.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeDiscountPercent = (data: number) => {
  const expectedPrice = ticketLaboratory.value.expectedPrice || 0
  const discountMoney = Math.round((expectedPrice * (data || 0)) / 100)
  ticketLaboratory.value.discountPercent = data
  ticketLaboratory.value.discountMoney = discountMoney
  ticketLaboratory.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeActualPrice = (data: number) => {
  const actualPrice = data
  const expectedPrice = ticketLaboratory.value.expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketLaboratory.value.discountPercent = discountPercent
  ticketLaboratory.value.discountMoney = discountMoney
  ticketLaboratory.value.discountType = DiscountType.VND
  ticketLaboratory.value.actualPrice = actualPrice
}

const closeModal = () => {
  showModal.value = false
  ticketLaboratory.value = TicketLaboratory.blank()
  ticketLaboratoryOrigin.value = TicketLaboratory.blank()
  ticketUserList.value = []
  ticketUserListOrigin = []
}

const clickDestroy = async () => {
  if (ticketLaboratoryOrigin.value.paymentMoneyStatus === PaymentMoneyStatus.Paid) {
    return ModalStore.alert({
      title: 'Không thể xóa xét nghiệm ?',
      content: ['- Xét nghiệm đã được thanh toán sẽ không thể xóa'],
    })
  }
  ModalStore.confirm({
    title: 'Xác nhận xóa dịch vụ ?',
    content: [
      '- Hệ thống sẽ xóa dịch vụ này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketClinicLaboratoryApi.destroyTicketLaboratory({
          ticketId: ticketRoomRef.value.id,
          ticketLaboratoryId: ticketLaboratory.value.id,
        })
        emit('success', ticketLaboratory.value, 'DESTROY')
        closeModal()
      } catch (error) {
        console.log('🚀 ~ file: TicketClinicLaboratory.vue:118 ~ onOk: ~ error:', error)
      }
    },
  })
}

const updateTicketLaboratory = async () => {
  saveLoading.value = true
  try {
    const hasUpdateTicketUser =
      ticketUserListOrigin.length || ticketUserList.value.filter((i) => !!i.userId).length
    await TicketClinicLaboratoryApi.updateTicketLaboratory({
      ticketId: ticketRoomRef.value.id,
      ticketLaboratoryId: ticketLaboratory.value.id,
      ticketLaboratory: hasChangeTicketLaboratory.value ? ticketLaboratory.value : undefined,
      ticketUserList: hasUpdateTicketUser ? ticketUserList.value : undefined,
    })
    emit('success', ticketLaboratory.value, 'UPDATE')
    closeModal()
  } catch (error) {
    console.log('🚀: ModalTicketLaboratoryUpdate.vue:211 ~ updateTicketLaboratory ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ laboratoryMap[ticketLaboratory.laboratoryId]?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 flex flex-wrap gap-4" @submit.prevent="(e) => updateTicketLaboratory()">
        <div style="flex-basis: 45%; flex-grow: 1; min-width: 300px">
          <div>Giá niêm yết</div>
          <div>
            <InputMoney v-model:value="ticketLaboratory.expectedPrice" disabled />
          </div>
        </div>

        <div style="flex-basis: 45%; flex-grow: 1; min-width: 300px">
          <div>
            Chiết khấu
            <span
              v-if="
                ticketLaboratory.discountType === DiscountType.Percent &&
                ticketLaboratory.discountPercent !== 0
              "
            >
              (
              <b>{{ formatMoney(ticketLaboratory.discountMoney) }}</b>
              )
            </span>
          </div>
          <div class="flex">
            <VueSelect
              v-model:value="ticketLaboratory.discountType"
              style="width: 120px"
              :options="[
                { value: DiscountType.Percent, text: '%' },
                { value: DiscountType.VND, text: 'VNĐ' },
              ]"
            />
            <div style="width: calc(100% - 120px)">
              <InputMoney
                v-if="ticketLaboratory.discountType === DiscountType.VND"
                :value="ticketLaboratory.discountMoney"
                @update:value="handleChangeUnitDiscountMoney"
                :validate="{ gte: 0 }"
              />
              <InputNumber
                v-else
                :value="ticketLaboratory.discountPercent"
                @update:value="handleChangeDiscountPercent"
                :validate="{ gte: 0, lte: 100 }"
              />
            </div>
          </div>
        </div>

        <div style="flex-basis: 45%; flex-grow: 1; min-width: 300px">
          <div>Đơn giá</div>
          <div style="width: 100%">
            <InputMoney
              :value="ticketLaboratory.actualPrice"
              @update:value="handleChangeActualPrice"
            />
          </div>
        </div>

        <template v-if="ticketUserList.length">
          <div
            v-for="(ticketUser, index) in ticketUserList"
            :key="index"
            style="flex-basis: 45%; flex-grow: 1; min-width: 300px"
          >
            <div>
              {{ roleMap[ticketUser.roleId]?.name || '' }}
            </div>
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

        <div style="flex-grow: 1; flex-basis: 80%" class="mt-6 flex gap-4">
          <VueButton
            color="red"
            icon="trash"
            @click="clickDestroy"
            v-if="ticketLaboratory.status === TicketLaboratoryStatus.Pending"
          >
            Xóa
          </VueButton>
          <VueButton style="margin-left: auto" type="reset" icon="close" @click="closeModal">
            Đóng lại
          </VueButton>
          <VueButton
            :disabled="!hasChangeData"
            :loading="saveLoading"
            color="blue"
            type="submit"
            icon="save"
          >
            Cập nhật
          </VueButton>
        </div>
      </form>
    </div>
  </VueModal>
</template>
<style lang="scss" scope></style>
