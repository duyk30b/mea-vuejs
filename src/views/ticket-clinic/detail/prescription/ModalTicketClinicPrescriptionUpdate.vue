<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import VueButton from '../../../../common/VueButton.vue'
import { IconClose } from '../../../../common/icon'
import { AlertStore } from '../../../../common/vue-alert/vue-alert.store'
import {
  InputFilter,
  InputHint,
  InputMoney,
  InputNumber,
  VueSelect,
} from '../../../../common/vue-form'
import VueModal from '../../../../common/vue-modal/VueModal.vue'
import { ModalStore } from '../../../../common/vue-modal/vue-modal.store'
import { useSettingStore } from '../../../../modules/_me/setting.store'
import { CommissionService, InteractType } from '../../../../modules/commission'
import { DeliveryStatus, DiscountType } from '../../../../modules/enum'
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

const handleChangeUnitQuantityPrescription = (data: number) => {
  if (ticketProduct.value.deliveryStatus === DeliveryStatus.Pending) {
    ticketProduct.value.unitQuantity = data
  }
}

const handleChangeUnitDiscountMoney = (data: number) => {
  const discountMoney = data / ticketProduct.value.unitRate
  const expectedPrice = ticketProduct.value.expectedPrice || 0
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketProduct.value.discountPercent = discountPercent
  ticketProduct.value.discountMoney = discountMoney
  ticketProduct.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeDiscountPercent = (data: number) => {
  const expectedPrice = ticketProduct.value.expectedPrice || 0
  const discountMoney = Math.round((expectedPrice * (data || 0)) / 100)
  ticketProduct.value.discountPercent = data
  ticketProduct.value.discountMoney = discountMoney
  ticketProduct.value.actualPrice = expectedPrice - discountMoney
}

const handleChangeUnitActualPrice = (data: number) => {
  const actualPrice = data / ticketProduct.value.unitRate
  const expectedPrice = ticketProduct.value.expectedPrice
  const discountMoney = expectedPrice - actualPrice
  const discountPercent = expectedPrice == 0 ? 0 : Math.round((discountMoney * 100) / expectedPrice)
  ticketProduct.value.discountPercent = discountPercent
  ticketProduct.value.discountMoney = discountMoney
  ticketProduct.value.discountType = DiscountType.VND
  ticketProduct.value.actualPrice = actualPrice
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
        console.log(
          '🚀 ~ file: ModalTicketClinicPrescriptionUpdate.vue:155 ~ onOk: ~ error:',
          error
        )
      }
    },
  })
}

const updateTicketProduct = async () => {
  saveLoading.value = true
  try {
    const hasUpdateTicketUser =
      ticketUserListOrigin.length || ticketUserList.value.filter((i) => !!i.userId).length

    await TicketClinicProductApi.updateTicketProductPrescription({
      ticketId: ticketClinicRef.value.id,
      ticketProductId: ticketProduct.value.id,
      ticketProduct: hasChangeTicketProduct.value ? ticketProduct.value : undefined,
      ticketUserList: hasUpdateTicketUser ? ticketUserList.value : undefined,
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
        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div class="flex gap-2 justify-between">
            <div class="flex gap-1">
              <span>Số lượng kê trong đơn</span>
              <span v-if="ticketProduct.unitRate !== 1">
                (
                <b>{{ ticketProduct.quantityPrescription }}</b>
                {{ ticketProduct?.product?.unitBasicName }} )
              </span>
            </div>
            <div></div>
          </div>
          <div class="flex">
            <div style="width: 120px">
              <VueSelect
                v-model:value="ticketProduct.unitRate"
                :disabled="(ticketProduct.product?.unitObject.length || 0) <= 1"
                :options="
                  ticketProduct.product?.unitObject.map((i) => ({
                    value: i.rate,
                    text: i.name,
                    data: i,
                  }))
                "
                required />
            </div>
            <div class="flex-1">
              <InputNumber
                v-model:value="ticketProduct.unitQuantityPrescription"
                :validate="{ gt: 0 }"
                @update:value="handleChangeUnitQuantityPrescription" />
            </div>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div class="flex gap-2 justify-between">
            <div class="flex gap-1">
              <span>Số lượng mua</span>
              <span v-if="ticketProduct.unitRate !== 1">
                (
                <b>{{ ticketProduct.quantity }}</b>
                {{ ticketProduct?.product?.unitBasicName }} )
              </span>
            </div>
            <div>
              <TicketClinicDeliveryStatusTag :deliveryStatus="ticketProduct.deliveryStatus" />
            </div>
          </div>
          <div class="flex">
            <div style="width: 120px">
              <VueSelect
                v-model:value="ticketProduct.unitRate"
                :disabled="(ticketProduct.product?.unitObject.length || 0) <= 1"
                :options="
                  ticketProduct.product?.unitObject.map((i) => ({
                    value: i.rate,
                    text: i.name,
                    data: i,
                  }))
                "
                required />
            </div>
            <div class="flex-1">
              <InputNumber
                v-model:value="ticketProduct.unitQuantity"
                :disabled="ticketProduct.deliveryStatus === DeliveryStatus.Delivered"
                :validate="{ gt: 0 }" />
            </div>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div>
            Giá niêm yết
            <span v-if="ticketProduct.unitRate !== 1">
              (
              <b>{{ formatMoney(ticketProduct.expectedPrice) }} /</b>
              {{ ticketProduct?.product?.unitBasicName }})
            </span>
          </div>

          <div style="width: 100%">
            <InputMoney :value="ticketProduct.unitExpectedPrice" disabled />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
          <div>
            Chiết khấu
            <span
              v-if="
                (ticketProduct.discountType === DiscountType.Percent &&
                  ticketProduct.discountPercent !== 0) ||
                ticketProduct.unitRate > 1
              ">
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
              ]" />
            <div style="width: calc(100% - 120px)">
              <InputMoney
                v-if="ticketProduct.discountType === DiscountType.VND"
                :value="ticketProduct.unitDiscountMoney"
                :disabled="ticketProduct.deliveryStatus === DeliveryStatus.Delivered"
                @update:value="handleChangeUnitDiscountMoney" />
              <InputNumber
                v-else
                :value="ticketProduct.discountPercent"
                :disabled="ticketProduct.deliveryStatus === DeliveryStatus.Delivered"
                @update:value="handleChangeDiscountPercent" />
            </div>
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 40%; min-width: 300px">
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
              :disabled="ticketProduct.deliveryStatus === DeliveryStatus.Delivered"
              @update:value="handleChangeUnitActualPrice" />
          </div>
        </div>

        <div style="flex-grow: 1; flex-basis: 90%; min-width: 300px">
          <div>Hướng dẫn sử dụng</div>
          <div>
            <InputHint
              v-model:value="ticketProduct.hintUsage"
              :options="[
                ...(ticketProduct.product!.hintUsage ? [ticketProduct.product!.hintUsage] : []),
                ...settingStore.PRODUCT_HINT_USAGE,
              ]"
              :maxHeight="320"
              :logic-filter="
                (item: any, text: string) => DString.customFilter(item, text)
              "></InputHint>
          </div>
        </div>

        <template v-if="ticketUserList.length">
          <div
            v-for="(ticketUser, index) in ticketUserList"
            :key="index"
            style="flex-basis: 40%; flex-grow: 1; min-width: 300px">
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
