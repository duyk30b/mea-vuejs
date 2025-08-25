<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose, IconDoubleRight } from '@/common/icon-antd'
import { IconDelete } from '@/common/icon-google'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputDate, InputFilter, InputMoney, InputNumber, VueSelect } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { CONFIG } from '@/config'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DiscountType, PaymentMoneyStatus } from '@/modules/enum'
import { PositionInteractType, PositionService } from '@/modules/position'
import { ProcedureType } from '@/modules/procedure'
import { Role, RoleService } from '@/modules/role'
import { ticketRoomRef } from '@/modules/room'
import { TicketChangeProcedureApi } from '@/modules/ticket'
import { TicketProcedure, TicketProcedureStatus } from '@/modules/ticket-procedure'
import { TicketProcedureItem } from '@/modules/ticket-procedure/ticket-procedure-item.model'
import { TicketUser } from '@/modules/ticket-user'
import { User, UserService } from '@/modules/user'
import { UserRoleService } from '@/modules/user-role'
import { ESString } from '@/utils'
import { computed, onMounted, ref } from 'vue'
import TicketProcedureStatusTag from '../../room-procedure/TicketProcedureStatusTag.vue'

const emit = defineEmits<{
  (e: 'success', value: TicketProcedure, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const roleMap = ref<Record<string, Role>>({})
const userRoleMapRoleIdOptions = ref<Record<string, { value: number; text: string; data: User }[]>>(
  {},
)

const ticketProcedureOrigin = ref<TicketProcedure>(TicketProcedure.blank())
let ticketUserListOrigin: TicketUser[] = []
const ticketProcedure = ref<TicketProcedure>(TicketProcedure.blank())
const ticketUserList = ref<TicketUser[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const refreshTicketUserList = async () => {
  ticketUserListOrigin = []
  const ticketUserListRef =
    ticketRoomRef.value.ticketUserGroup?.[PositionInteractType.Procedure]?.[
      ticketProcedure.value.id
    ] || []

  const positionList = await PositionService.list({
    filter: {
      positionType: PositionInteractType.Procedure,
      positionInteractId: ticketProcedure.value.procedureId,
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
      RoleService.getMap(),
      UserService.getMap(),
      UserRoleService.list(),
    ])

    roleMap.value = fetchPromise[0]
    const userMap = fetchPromise[1]
    const userRoleList = fetchPromise[2]

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
    console.log('🚀 ~ file: ModalTicketProcedureUpdate.vue:105 ~ onMounted ~ error:', error)
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
  const result = !TicketUser.equalList(ticketUserListOrigin, ticketUserList.value)
  return result
})

const hasChangeTicketProcedureItemList = computed(() => {
  const result = !TicketProcedureItem.equalList(
    ticketProcedureOrigin.value.ticketProcedureItemList || [],
    ticketProcedure.value.ticketProcedureItemList || [],
  )
  return result
})

const hasChangeData = computed(() => {
  const result =
    hasChangeTicketProcedure.value ||
    hasChangeTicketProcedureItemList.value ||
    hasChangeTicketUserList.value
  return result
})

const handleChangeUnitDiscountMoney = (data: number) => {
  const discountMoney = data
  const expectedPrice = ticketProcedure.value.expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketProcedure.value.discountPercent = discountPercent
  ticketProcedure.value.discountMoney = discountMoney
  ticketProcedure.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeDiscountPercent = (data: number) => {
  const expectedPrice = ticketProcedure.value.expectedPrice || 0
  const discountMoney = Math.round((expectedPrice * (data || 0)) / 100)
  ticketProcedure.value.discountPercent = data
  ticketProcedure.value.discountMoney = discountMoney
  ticketProcedure.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeActualPrice = (data: number) => {
  const actualPrice = data
  const expectedPrice = ticketProcedure.value.expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketProcedure.value.discountPercent = discountPercent
  ticketProcedure.value.discountMoney = discountMoney
  ticketProcedure.value.discountType = DiscountType.VND
  ticketProcedure.value.actualPrice = actualPrice
}

const closeModal = () => {
  showModal.value = false
  ticketProcedure.value = TicketProcedure.blank()
  ticketProcedureOrigin.value = TicketProcedure.blank()
  ticketUserList.value = []
  ticketUserListOrigin = []
}

const clickDestroy = async () => {
  if (ticketProcedure.value.paymentMoneyStatus === PaymentMoneyStatus.Paid) {
    return ModalStore.alert({
      title: 'Không thể xóa dịch vụ ?',
      content: ['- Dịch vụ đã được thanh toán sẽ không thể xóa'],
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
        await TicketChangeProcedureApi.destroyTicketProcedure({
          ticketId: ticketRoomRef.value.id,
          ticketProcedureId: ticketProcedure.value.id,
        })
        emit('success', ticketProcedure.value, 'DESTROY')
        closeModal()
      } catch (error) {
        console.log('🚀 ~ file: TicketClinicProcedure.vue:185 ~ onOk: ~ error:', error)
      }
    },
  })
}

const submitChangeTicketProcedure = async () => {
  if (ticketProcedure.value.procedure?.procedureType === ProcedureType.Regimen) {
    ticketProcedure.value.totalSessions = ticketProcedure.value.ticketProcedureItemList?.length || 0
  }

  if (ticketProcedure.value.id) {
    await updateTicketProcedure()
  } else {
    emit('success', ticketProcedure.value, 'UPDATE')
    closeModal()
  }
}

const updateTicketProcedure = async () => {
  saveLoading.value = true
  try {
    const hasUpdateTicketUser =
      ticketUserListOrigin.length || ticketUserList.value.filter((i) => !!i.userId).length
    await TicketChangeProcedureApi.updateTicketProcedure({
      ticketId: ticketRoomRef.value.id,
      ticketProcedureId: ticketProcedure.value.id,
      ticketProcedure: hasChangeTicketProcedure.value ? ticketProcedure.value : undefined,
      ticketProcedureItemList: hasChangeTicketProcedureItemList.value
        ? ticketProcedure.value.ticketProcedureItemList
        : undefined,
      ticketUserList: hasUpdateTicketUser ? ticketUserList.value : undefined,
    })
    emit('success', ticketProcedure.value, 'UPDATE')
    closeModal()
  } catch (error) {
    console.log('🚀: ModalTicketProcedureUpdate.vue:205 ~ updateTicketProcedure ~ error:', error)
  } finally {
    saveLoading.value = false
  }
}

const handleRemoveTicketProcedureItem = (tpItem: TicketProcedureItem) => {
  const indexRemove = (ticketProcedure.value.ticketProcedureItemList || []).findIndex((i) => {
    return i._localId === tpItem._localId
  })
  if (indexRemove !== -1) {
    ticketProcedure.value.ticketProcedureItemList!.splice(indexRemove, 1)
  }
}

const handleAddTicketProcedureItem = () => {
  const length = ticketProcedure.value.ticketProcedureItemList?.length || 0
  let lastTime = ticketProcedure.value.ticketProcedureItemList?.[length - 1]?.completedAt
  const nowTime = new Date()
  nowTime.setMinutes(0, 0, 0)

  const currentTime = lastTime
    ? lastTime + ticketProcedure.value.procedure!.gapHours * 60 * 60 * 1000
    : nowTime.getTime()

  const ticketProcedureAdd = TicketProcedureItem.blank()
  ticketProcedureAdd.completedAt = currentTime
  ticketProcedure.value.ticketProcedureItemList?.push(ticketProcedureAdd)
}

const handleUpdateTimeTicketProcedureItem = (time: any, index: number) => {
  for (let i = index + 1; i < ticketProcedure.value.ticketProcedureItemList!.length; i++) {
    const item = ticketProcedure.value.ticketProcedureItemList![i]
    if (!item || item.status === TicketProcedureStatus.Completed) return
    if (!time) {
      item.completedAt = null as any
    } else {
      let fixTime = new Date(time)
      fixTime.setMinutes(0, 0, 0)
      fixTime.setHours(fixTime.getHours() + 1)
      item.completedAt =
        fixTime.getTime() + ticketProcedure.value.procedure!.gapHours * 60 * 60 * 1000 * (i - index)
    }
  }
}

defineExpose({ openModal })
</script>
<template>
  <VueModal v-model:show="showModal" style="width: 800px; margin-top: 50px">
    <div class="bg-white">
      <div class="pl-4 py-2 flex items-center" style="border-bottom: 1px solid #dedede">
        <div class="flex-1 text-lg font-medium">
          {{ ticketProcedure.procedure?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 gap-4" @submit.prevent="(e) => submitChangeTicketProcedure()">
        <div class="flex flex-wrap gap-4">
          <div
            v-if="ticketProcedure.procedure?.procedureType === ProcedureType.Basic"
            style="flex-grow: 1; flex-basis: 300px"
          >
            <div>Số lượng</div>
            <div>
              <InputNumber
                v-model:value="ticketProcedure.quantity"
                :disabled="ticketProcedure.paymentMoneyStatus === PaymentMoneyStatus.Paid"
                required
                :validate="{ gt: 0 }"
              />
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 300px">
            <div>Giá niêm yết</div>
            <div>
              <InputMoney v-model:value="ticketProcedure.expectedPrice" disabled />
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 300px">
            <div>
              Chiết khấu
              <span
                v-if="
                  ticketProcedure.discountType === DiscountType.Percent &&
                  ticketProcedure.discountPercent !== 0
                "
              >
                (
                <b>{{ formatMoney(ticketProcedure.discountMoney) }}</b>
                )
              </span>
            </div>
            <div class="flex">
              <VueSelect
                v-model:value="ticketProcedure.discountType"
                style="width: 120px"
                :options="[
                  { value: DiscountType.Percent, text: '%' },
                  { value: DiscountType.VND, text: 'VNĐ' },
                ]"
              />
              <div style="width: calc(100% - 120px)">
                <InputMoney
                  v-if="ticketProcedure.discountType === DiscountType.VND"
                  :value="ticketProcedure.discountMoney"
                  :disabled="ticketProcedure.paymentMoneyStatus === PaymentMoneyStatus.Paid"
                  @update:value="handleChangeUnitDiscountMoney"
                  :validate="{ gte: 0 }"
                />
                <InputNumber
                  v-else
                  :value="ticketProcedure.discountPercent"
                  :disabled="ticketProcedure.paymentMoneyStatus === PaymentMoneyStatus.Paid"
                  @update:value="handleChangeDiscountPercent"
                  :validate="{ gte: 0, lte: 100 }"
                />
              </div>
            </div>
          </div>
          <div style="flex-grow: 1; flex-basis: 300px">
            <div>Đơn giá</div>
            <div style="width: 100%">
              <InputMoney
                :value="ticketProcedure.actualPrice"
                :disabled="ticketProcedure.paymentMoneyStatus === PaymentMoneyStatus.Paid"
                @update:value="handleChangeActualPrice"
              />
            </div>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-4" v-if="ticketUserList.length">
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
        </div>

        <div
          v-if="ticketProcedure.procedure?.procedureType === ProcedureType.Regimen"
          class="mt-4 w-full"
        >
          <div
            class="font-bold flex gap-2 flex-wrap items-center"
            style="flex-basis: 90%; flex-grow: 1; min-width: 300px"
          >
            <IconDoubleRight />
            <span>Thời gian thực hiện các buổi:</span>
            <span style="margin-left: auto">
              Tổng {{ ticketProcedure.ticketProcedureItemList?.length }} buổi
            </span>
          </div>
          <div class="mt-2 w-full table table-wrapper">
            <table>
              <thead>
                <tr>
                  <th v-if="CONFIG.MODE === 'development'">ID</th>
                  <th>#</th>
                  <th>Trạng Thái</th>
                  <th>Thời gian</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(tpItem, index) in ticketProcedure.ticketProcedureItemList || []"
                  :key="tpItem._localId"
                >
                  <td
                    v-if="CONFIG.MODE === 'development'"
                    class="text-center"
                    style="color: violet"
                  >
                    {{ tpItem.id }}
                  </td>
                  <td class="text-center">
                    <TicketProcedureStatusTag :status="tpItem.status" />
                  </td>
                  <td class="text-center">Buổi {{ index + 1 }}</td>
                  <td>
                    <InputDate
                      v-model:value="tpItem.completedAt"
                      show-time
                      typeParser="number"
                      :disabled="tpItem.status === TicketProcedureStatus.Completed"
                      @update:value="(v) => handleUpdateTimeTicketProcedureItem(v, index)"
                    />
                  </td>
                  <td>
                    <div
                      v-if="
                        tpItem.status === TicketProcedureStatus.Pending &&
                        index === ticketProcedure.ticketProcedureItemList!.length - 1
                      "
                      class="flex justify-center cursor-pointer"
                      style="font-size: 20px"
                      @click="handleRemoveTicketProcedureItem(tpItem)"
                    >
                      <IconDelete style="color: var(--text-red)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="mt-2">
              <a @click="handleAddTicketProcedureItem">✚ Thêm buổi</a>
            </div>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 80%" class="mt-6 flex gap-4">
          <VueButton v-if="ticketProcedure.id" color="red" icon="trash" @click="clickDestroy">
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
