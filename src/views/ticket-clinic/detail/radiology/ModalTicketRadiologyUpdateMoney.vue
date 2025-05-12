<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon-antd'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputFilter, InputMoney, InputNumber, VueSelect } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { CommissionService, InteractType } from '../../../../modules/commission'
import { DiscountType } from '../../../../modules/enum'
import { Radiology, RadiologyService } from '../../../../modules/radiology'
import { Role, RoleService } from '../../../../modules/role'
import { TicketClinicRadiologyApi, ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketRadiology } from '../../../../modules/ticket-radiology'
import { TicketUser } from '../../../../modules/ticket-user'
import { User, UserService } from '../../../../modules/user'
import { UserRoleService } from '../../../../modules/user-role'
import { DString } from '../../../../utils'

const emit = defineEmits<{
  (e: 'success', value: TicketRadiology, type: 'CREATE' | 'UPDATE' | 'DESTROY'): void
}>()

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const radiologyMap = ref<Record<string, Radiology>>({})
const roleMap = ref<Record<string, Role>>({})
const userRoleMapRoleIdOptions = ref<Record<string, { value: number; text: string; data: User }[]>>(
  {},
)

const ticketRadiologyOrigin = ref<TicketRadiology>(TicketRadiology.blank())
let ticketUserListOrigin: TicketUser[] = []
const ticketRadiology = ref<TicketRadiology>(TicketRadiology.blank())
const ticketUserList = ref<TicketUser[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const refreshTicketUserList = async () => {
  ticketUserListOrigin = []
  const ticketUserListRef =
    ticketClinicRef.value.ticketUserGroup?.[InteractType.Radiology]?.[ticketRadiology.value.id] ||
    []

  const commissionList = await CommissionService.list({
    filter: {
      interactType: InteractType.Radiology,
      interactId: ticketRadiology.value.radiologyId,
    },
  })

  // lấy tất cả role có trong commission trước
  commissionList.forEach((i) => {
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
      RadiologyService.getMap(),
      RoleService.getMap(),
      UserService.getMap(),
      UserRoleService.list(),
    ])

    radiologyMap.value = fetchPromise[0]
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
    console.log('🚀 ~ file: ModalTicketRadiologyUpdate.vue:105 ~ onMounted ~ error:', error)
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const openModal = async (ticketRadiologyProp: TicketRadiology) => {
  showModal.value = true
  ticketRadiologyOrigin.value = TicketRadiology.from(ticketRadiologyProp)
  ticketRadiology.value = TicketRadiology.from(ticketRadiologyProp)

  await refreshTicketUserList()
}

const hasChangeTicketRadiology = computed(() => {
  const result = !TicketRadiology.equal(ticketRadiologyOrigin.value, ticketRadiology.value)
  return result
})

const hasChangeTicketUserList = computed(() => {
  const result = !TicketUser.equalList(ticketUserListOrigin, ticketUserList.value)
  return result
})

const hasChangeData = computed(() => {
  const result = hasChangeTicketRadiology.value || hasChangeTicketUserList.value
  return result
})

const handleChangeUnitDiscountMoney = (data: number) => {
  const discountMoney = data
  const expectedPrice = ticketRadiology.value.expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketRadiology.value.discountPercent = discountPercent
  ticketRadiology.value.discountMoney = discountMoney
  ticketRadiology.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeDiscountPercent = (data: number) => {
  const expectedPrice = ticketRadiology.value.expectedPrice || 0
  const discountMoney = Math.round((expectedPrice * (data || 0)) / 100)
  ticketRadiology.value.discountPercent = data
  ticketRadiology.value.discountMoney = discountMoney
  ticketRadiology.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeActualPrice = (data: number) => {
  const actualPrice = data
  const expectedPrice = ticketRadiology.value.expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketRadiology.value.discountPercent = discountPercent
  ticketRadiology.value.discountMoney = discountMoney
  ticketRadiology.value.discountType = DiscountType.VND
  ticketRadiology.value.actualPrice = actualPrice
}

const closeModal = () => {
  showModal.value = false
  ticketRadiology.value = TicketRadiology.blank()
  ticketRadiologyOrigin.value = TicketRadiology.blank()
  ticketUserList.value = []
  ticketUserListOrigin = []
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
        await TicketClinicRadiologyApi.destroyTicketRadiology({
          ticketId: ticketClinicRef.value.id,
          ticketRadiologyId: ticketRadiology.value.id,
        })
        emit('success', ticketRadiology.value, 'DESTROY')
        closeModal()
      } catch (error) {
        console.log('🚀 ~ file: TicketClinicRadiology.vue:118 ~ onOk: ~ error:', error)
      }
    },
  })
}

const updateMoneyTicketRadiology = async () => {
  saveLoading.value = true
  try {
    const hasUpdateTicketUser =
      ticketUserListOrigin.length || ticketUserList.value.filter((i) => !!i.userId).length
    await TicketClinicRadiologyApi.updateMoneyTicketRadiology({
      ticketId: ticketClinicRef.value.id,
      ticketRadiologyId: ticketRadiology.value.id,
      ticketRadiology: hasChangeTicketRadiology.value ? ticketRadiology.value : undefined,
      ticketUserList: hasUpdateTicketUser ? ticketUserList.value : undefined,
    })
    emit('success', ticketRadiology.value, 'UPDATE')
    closeModal()
  } catch (error) {
    console.log('🚀: ~ updateMoneyTicketRadiology ~ error:', error)
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
          {{ radiologyMap[ticketRadiology.radiologyId]?.name }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 flex flex-wrap gap-4" @submit.prevent="(e) => updateMoneyTicketRadiology()">
        <div style="flex-basis: 45%; flex-grow: 1; min-width: 300px">
          <div>Giá niêm yết</div>
          <div>
            <InputMoney v-model:value="ticketRadiology.expectedPrice" disabled />
          </div>
        </div>

        <div style="flex-basis: 45%; flex-grow: 1; min-width: 300px">
          <div>
            Chiết khấu
            <span
              v-if="
                ticketRadiology.discountType === DiscountType.Percent &&
                ticketRadiology.discountPercent !== 0
              "
            >
              (
              <b>{{ formatMoney(ticketRadiology.discountMoney) }}</b>
              )
            </span>
          </div>
          <div class="flex">
            <VueSelect
              v-model:value="ticketRadiology.discountType"
              style="width: 120px"
              :options="[
                { value: DiscountType.Percent, text: '%' },
                { value: DiscountType.VND, text: 'VNĐ' },
              ]"
            />
            <div style="width: calc(100% - 120px)">
              <InputMoney
                v-if="ticketRadiology.discountType === DiscountType.VND"
                :value="ticketRadiology.discountMoney"
                @update:value="handleChangeUnitDiscountMoney"
                :validate="{ gte: 0 }"
              />
              <InputNumber
                v-else
                :value="ticketRadiology.discountPercent"
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
              :value="ticketRadiology.actualPrice"
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
                    - {{ DString.formatPhone(data.phone) }} -
                  </div>
                </template>
              </InputFilter>
            </div>
          </div>
        </template>

        <div style="flex-grow: 1; flex-basis: 80%" class="mt-6 flex gap-4">
          <VueButton color="red" icon="trash" @click="clickDestroy">Xóa</VueButton>
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
