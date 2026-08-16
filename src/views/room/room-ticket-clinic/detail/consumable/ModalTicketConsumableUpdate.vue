<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconClose } from '@/common/icon-antd'
import { AlertStore } from '@/common/vue-alert/vue-alert.store'
import { InputFilter, InputMoney, InputNumber, VueSelect } from '@/common/vue-form'
import VueModal from '@/common/vue-modal/VueModal.vue'
import { ModalStore } from '@/common/vue-modal/vue-modal.store'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DeliveryStatus, DiscountType, TicketItemPaymentType } from '@/modules/enum'
import { PositionType, PositionService } from '@/modules/position'
import { Role, RoleService } from '@/modules/role'
import { TicketChangeProductApi } from '@/modules/ticket'
import { TicketProduct } from '@/modules/ticket-product'
import { TicketUser } from '@/modules/ticket-user'
import { User, UserService } from '@/modules/user'
import { UserRoleService } from '@/modules/user-role'
import { ESString } from '@/utils'
import TicketDeliveryStatusTag from '@/views/room/room-ticket-base/TicketDeliveryStatusTag.vue'
import { computed, onMounted, ref } from 'vue'
import { roomRef, ticketRef } from '@/store/room.store'
import { TicketStatus } from '@/modules/ticket/ticket.type'

const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const roleMap = ref<Record<string, Role>>({})
const userRoleMapRoleIdOptions = ref<Record<string, { value: number; text: string; data: User }[]>>(
  {},
)

let ticketProductOrigin = TicketProduct.blank()
const ticketProduct = ref<TicketProduct>(TicketProduct.blank())

let ticketUserListOrigin: TicketUser[] = []
const ticketUserList = ref<TicketUser[]>([])

const showModal = ref(false)
const saveLoading = ref(false)

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

const disabledButtonSave = computed(() => {
  // Dù đã gửi hàng thì vẫn được phép sửa vì có thể điền hoa hồng sau
  // if (ticketProduct.value.deliveryStatus === DeliveryStatus.Delivered) {
  //   return true
  // }
  return !hasChangeData.value
})

const handleChangeUnitQuantity = (data: number) => {
  if (ticketProduct.value.quantityCompleted === 0) {
    const { product, unitRate } = ticketProduct.value
    ticketProduct.value.unitQuantity = data
  }
}

const closeModal = () => {
  showModal.value = false
  ticketProduct.value = TicketProduct.blank()
  ticketProductOrigin = TicketProduct.blank()
  ticketUserList.value = []
  ticketUserListOrigin = []
}

const clickDestroy = async () => {
  if (ticketProductOrigin.quantityCompleted !== 0) {
    return ModalStore.alert({
      title: 'Không thể xóa vật tư ?',
      content: [
        '- Vật tư đã được xuất khỏi kho sẽ không thể xóa',
        '- Chỉ có thể hoàn trả vật tư nếu bắt buộc phải thay đổi số lượng ?',
      ],
    })
  }
  if (
    [TicketItemPaymentType.FullPaid, TicketItemPaymentType.PartialPaid].includes(
      ticketProductOrigin.ticketItemPaymentType,
    )
  ) {
    return ModalStore.alert({
      title: 'Không thể xóa vật tư ?',
      content: ['- Vật tư đã được thanh toán sẽ không thể xóa'],
    })
  }
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketRef.value.status)) {
    return ModalStore.alert({
      title: 'Không thể xóa vật tư ?',
      content: [
        '- Phiếu khám đã đóng không thể xóa vật tư',
        '- Nếu bắt buộc phải thay đổi số lượng, bạn cần mở lại phiếu khám',
      ],
    })
  }
  ModalStore.confirm({
    title: 'Xác nhận xóa vật tư ?',
    content: [
      '- Hệ thống sẽ xóa vật tư này khỏi phiếu khám',
      '- Dữ liệu đã xóa không thể phục hồi, bạn vẫn muốn xóa ?',
    ],
    onOk: async () => {
      try {
        await TicketChangeProductApi.destroyTicketProductConsumable({
          ticketId: ticketRef.value.id,
          ticketProductId: ticketProductOrigin.id,
        })
        closeModal()
      } catch (error) {
        console.log('🚀 ~ file: ModalTicketClinicConsumableUpdate.vue:155 ~ onOk: ~ error:', error)
      }
    },
  })
}

const updateTicketProduct = async () => {
  saveLoading.value = true
  try {
    const hasUpdateTicketUser =
      ticketUserListOrigin.length || ticketUserList.value.filter((i) => !!i.userId).length

    await TicketChangeProductApi.updateTicketProductConsumable({
      ticketId: ticketRef.value.id,
      ticketProductId: ticketProduct.value.id,
      ticketProduct: hasChangeTicketProduct.value ? ticketProduct.value : undefined,
    })
    closeModal()
  } catch (error) {
    console.log('🚀: ModalTicketProductUpdate.vue:216 ~ updateTicketProduct ~ error:', error)
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
          {{ ticketProduct.product?.brandName }}
        </div>
        <div style="font-size: 1.2rem" class="px-4 cursor-pointer" @click="closeModal">
          <IconClose />
        </div>
      </div>
      <form class="p-4 flex flex-wrap gap-4" @submit.prevent="(e) => updateTicketProduct()">
        <div style="flex-grow: 1; flex-basis: 300px">
          <div class="flex gap-2 justify-between">
            <div class="flex gap-1">
              <span>Số lượng</span>
              <span v-if="ticketProduct.unitRate !== 1">
                (
                <b>{{ ticketProduct.quantity }}</b>
                {{ ticketProduct?.product?.unitBasicName }} )
              </span>
            </div>
            <div>
              <TicketDeliveryStatusTag :deliveryStatus="ticketProduct.deliveryStatusFix" />
            </div>
          </div>
          <div class="flex">
            <div style="width: 120px">
              <VueSelect
                :value="ticketProduct.unitRate"
                :disabled="(ticketProduct.product?.unitObject.length || 0) <= 1"
                :options="
                  ticketProduct.product?.unitObject.map((i) => ({
                    value: i.rate,
                    text: i.name,
                    data: i,
                  })) || []
                "
                @update:value="(v) => ticketProduct.changeUnitRate(v)"
                required
              />
            </div>
            <div class="flex-1">
              <InputNumber
                :value="ticketProduct.unitQuantity"
                :disabled="ticketProduct.quantityCompleted !== 0"
                @update:value="handleChangeUnitQuantity"
                :validate="{ gte: 0 }"
              />
            </div>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 300px">
          <div>
            Giá niêm yết
            <span v-if="ticketProduct.unitRate !== 1">
              (
              <b>{{ formatMoney(ticketProduct.expectedPrice) }} /</b>
              {{ ticketProduct?.product?.unitBasicName }})
            </span>
          </div>

          <div style="width: 100%">
            <InputMoney
              :value="ticketProduct.unitExpectedPrice"
              :disabled="ticketProduct.quantityCompleted !== 0"
              @update:value="(v) => ticketProduct.changeUnitExpectedPrice(v)"
            />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 300px">
          <div>
            Chiết khấu
            <span
              v-if="
                (ticketProduct.discountType === DiscountType.Percent &&
                  ticketProduct.discountPercent !== 0) ||
                ticketProduct.unitRate > 1
              "
            >
              (
              <b>{{ formatMoney(ticketProduct.discountMoney) }}</b>
              <span v-if="ticketProduct?.product?.unitBasicName">
                / {{ ticketProduct?.product?.unitBasicName }}
              </span>
              )
            </span>
          </div>
          <div class="flex">
            <VueSelect
              v-model:value="ticketProduct.discountType"
              style="width: 120px"
              :options="[
                { value: DiscountType.Percent, text: '%' },
                { value: DiscountType.VND, text: 'VNĐ' },
              ]"
            />
            <div style="width: calc(100% - 120px)">
              <InputMoney
                v-if="ticketProduct.discountType === DiscountType.VND"
                :value="ticketProduct.unitDiscountMoney"
                :disabled="ticketProduct.quantityCompleted !== 0"
                @update:value="(v) => ticketProduct.changeUnitDiscountMoney(v)"
                :validate="{ gte: 0 }"
              />
              <InputNumber
                v-else
                :value="ticketProduct.discountPercent"
                :disabled="ticketProduct.quantityCompleted !== 0"
                @update:value="(v) => ticketProduct.changeDiscountPercent(v)"
                :validate="{ gte: 0, lte: 100 }"
              />
            </div>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 300px">
          <div class="flex gap-1">
            <span>Đơn giá</span>
            <span v-if="ticketProduct.unitRate !== 1">
              (
              <b>{{ formatMoney(ticketProduct.actualPrice) }} /</b>
              {{ ticketProduct.product?.unitBasicName }})
            </span>
          </div>
          <div style="width: 100%">
            <InputMoney
              :value="ticketProduct.unitActualPrice"
              :prepend="ticketProduct.unitRate !== 1 ? ticketProduct.unitName : ''"
              :disabled="ticketProduct.quantityCompleted !== 0"
              @update:value="(v) => ticketProduct.changeUnitActualPrice(v)"
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
          <VueButton color="red" icon="trash" @click="clickDestroy">Xóa</VueButton>
          <VueButton style="margin-left: auto" type="reset" icon="close" @click="closeModal">
            Đóng lại
          </VueButton>
          <VueButton
            :disabled="disabledButtonSave"
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
