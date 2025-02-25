<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import { InputFilter, InputMoney, InputNumber, VueSelect } from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { CommissionService, InteractType } from '../../../../modules/commission'
import { DeliveryStatus } from '../../../../modules/enum'
import { Role, RoleService } from '../../../../modules/role'
import { TicketStatus } from '../../../../modules/ticket'
import { TicketClinicProductApi, ticketClinicRef } from '../../../../modules/ticket-clinic'
import { TicketProduct } from '../../../../modules/ticket-product'
import { TicketUser } from '../../../../modules/ticket-user'
import { User, UserService } from '../../../../modules/user'
import { UserRoleService } from '../../../../modules/user-role'
import { DString } from '../../../../utils'
import TicketClinicDeliveryStatusTag from '../../TicketClinicDeliveryStatusTag.vue'

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const roleMap = ref<Record<string, Role>>({})
const userRoleMapRoleIdOptions = ref<Record<string, { value: number; text: string; data: User }[]>>(
  {}
)

let ticketProductOrigin = TicketProduct.blank()
const ticketProduct = ref<TicketProduct>(TicketProduct.blank())

let ticketUserListOrigin: TicketUser[] = []
const ticketUserList = ref<TicketUser[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

const refreshTicketUserList = async () => {
  ticketUserListOrigin = []
  const ticketUserListRef =
    ticketClinicRef.value.ticketUserGroup?.[InteractType.Product]?.[ticketProduct.value.id] || []

  const commissionList = await CommissionService.list({
    filter: {
      interactType: InteractType.Product,
      interactId: ticketProduct.value.productId,
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
    console.log('🚀 ~ file: TicketClinicProductSelectItem.vue:51 ~ onMounted ~ error:', error)
    AlertStore.add({ type: 'error', message: error.message })
  }
})

const openModal = async (ticketProductProp: TicketProduct) => {
  showModal.value = true
  ticketProductOrigin = TicketProduct.from(ticketProductProp)
  ticketProduct.value = TicketProduct.from(ticketProductProp)

  await refreshTicketUserList()
}

const hasChangeTicketProduct = computed(() => {
  const result = !TicketProduct.equal(ticketProductOrigin, ticketProduct.value)
  return result
})

const hasChangeTicketUserList = computed(() => {
  const result = !TicketUser.equalList(ticketUserListOrigin, ticketUserList.value)
  return result
})

const hasChangeData = computed(() => {
  const result = hasChangeTicketProduct.value || hasChangeTicketUserList.value
  return result
})

const handleUpdateUnitActualPrice = (price: number) => {
  ticketProduct.value.unitActualPrice = price
  ticketProduct.value.unitExpectedPrice = price
}

const closeModal = () => {
  showModal.value = false
  ticketProduct.value = TicketProduct.blank()
  ticketProductOrigin = TicketProduct.blank()
  ticketUserList.value = []
  ticketUserListOrigin = []
}

const clickDestroy = async () => {
  if (ticketProductOrigin.deliveryStatus === DeliveryStatus.Delivered) {
    return ModalStore.alert({
      title: 'Không thể xóa thuốc ?',
      content: [
        '- Thuốc đã được xuất khỏi kho sẽ không thể xóa',
        '- Chỉ có thể hoàn trả thuốc nếu bắt buộc phải thay đổi số lượng ?',
      ],
    })
  }
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketClinicRef.value.ticketStatus)) {
    return ModalStore.alert({
      title: 'Không thể xóa thuốc ?',
      content: [
        '- Phiếu khám đã đóng không thể xóa thuốc',
        '- Nếu bắt buộc phải thay đổi số lượng, bạn cần mở lại phiếu khám',
      ],
    })
  }
  ModalStore.confirm({
    title: 'Xác nhận xóa thuốc ?',
    content: [
      '- Hệ thống sẽ xóa thuốc này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketClinicProductApi.destroyTicketProductPrescription({
          ticketId: ticketClinicRef.value.id,
          ticketProductId: ticketProductOrigin.id,
        })
        closeModal()
      } catch (error) {
        console.log('🚀 ~ ModalTicketClinicPrescriptionUpdate.vue:173 ~ onOk: ~ error:', error)
      }
    },
  })
}

const updateTicketProduct = async () => {
  saveLoading.value = true
  try {
    const hasUpdateTicketUser =
      ticketUserListOrigin.length || ticketUserList.value.filter((i) => !!i.userId).length

    await TicketClinicProductApi.updateTicketProduct({
      ticketId: ticketClinicRef.value.id,
      ticketProductId: ticketProduct.value.id,
      ticketProduct: hasChangeTicketProduct.value ? ticketProduct.value : undefined,
      ticketUserList: hasUpdateTicketUser ? ticketUserList.value : undefined,
    })
    closeModal()
  } catch (error) {
    console.log('🚀: ModalTicketProductUpdate.vue:139 ~ updateTicketProduct ~ error:', error)
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
          {{ ticketProduct.product?.brandName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 flex flex-wrap gap-4" @submit.prevent="(e) => updateTicketProduct()">
        <div style="flex-grow: 1; flex-basis: 80%">
          <div class="flex gap-2 justify-between">
            <div>Số lượng kê trong đơn</div>
          </div>
          <div>
            <InputNumber
              v-model:value="ticketProduct.quantityPrescription"
              required
              :validate="{ gte: 0 }" />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 80%">
          <div class="flex gap-2 justify-between">
            <div>Số lượng KH mua</div>
            <div>
              <TicketClinicDeliveryStatusTag :deliveryStatus="ticketProduct.deliveryStatus" />
            </div>
          </div>
          <div>
            <InputNumber v-model:value="ticketProduct.quantity" required :validate="{ gte: 0 }" />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 80%">
          <div>Giá tiền</div>
          <div>
            <InputMoney
              :value="ticketProduct.actualPrice"
              required
              :validate="{ gte: 0 }"
              @update:value="handleUpdateUnitActualPrice" />
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
