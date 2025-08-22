<script lang="ts" setup>
import VueButton from '@/common/VueButton.vue'
import { IconFileSearch, IconSpin } from '@/common/icon-antd'
import { IconSortDown, IconSortUp } from '@/common/icon-font-awesome'
import { IconEditSquare } from '@/common/icon-google'
import { InputFilter } from '@/common/vue-form'
import { MeService } from '@/modules/_me/me.service'
import { useSettingStore } from '@/modules/_me/setting.store'
import { DeliveryStatus, PaymentMoneyStatus } from '@/modules/enum'
import { PermissionId } from '@/modules/permission/permission.enum'
import { PositionInteractType, PositionService } from '@/modules/position'
import type { Product } from '@/modules/product'
import { RoleService } from '@/modules/role'
import { ticketRoomRef } from '@/modules/room'
import { TicketChangeProductApi, TicketStatus } from '@/modules/ticket'
import { TicketProduct } from '@/modules/ticket-product'
import { TicketUser } from '@/modules/ticket-user'
import { UserService } from '@/modules/user'
import { UserRoleService } from '@/modules/user-role'
import { ESString } from '@/utils'
import PaymentMoneyStatusTooltip from '@/views/finance/payment/PaymentMoneyStatusTooltip.vue'
import ModalProductDetail from '@/views/product/detail/ModalProductDetail.vue'
import TicketDeliveryStatusTooltip from '@/views/room/room-ticket-base/TicketDeliveryStatusTooltip.vue'
import { computed, onMounted, ref, watch } from 'vue'
import ModalTicketProductUpdate from './ModalTicketProductUpdate.vue'
import TicketProductSelectItem from './TicketProductSelectItem.vue'
import { CONFIG } from '@/config'

const modalTicketProductUpdate = ref<InstanceType<typeof ModalTicketProductUpdate>>()
const modalProductDetail = ref<InstanceType<typeof ModalProductDetail>>()

const { userPermission, organizationPermission } = MeService
const settingStore = useSettingStore()
const { formatMoney, isMobile } = settingStore

const ticketProductList = ref<TicketProduct[]>([])
const roleMap = RoleService.roleMap
const userMap = UserService.userMap
const userRoleMapList = UserRoleService.userRoleMapList

let ticketUserListOrigin: TicketUser[] = []
const ticketUserList = ref<TicketUser[]>([])

const refreshTicketUserList = async () => {
  if (!organizationPermission.value[PermissionId.MASTER_DATA_POSITION]) {
    return
  }
  const tuListOrigin: TicketUser[] = []
  const ticketUserListRef =
    ticketRoomRef.value.ticketUserGroup?.[PositionInteractType.ConsumableList]?.[0] || []

  const positionList = await PositionService.list({
    filter: {
      positionType: PositionInteractType.ConsumableList,
      positionInteractId: 0,
    },
  })

  // lấy tất cả role có trong commission trước
  positionList.forEach((i, index) => {
    const findExist = ticketUserListRef.find((j) => j.roleId === i.roleId)
    if (findExist) {
      tuListOrigin.push(TicketUser.from(findExist))
    } else {
      const ticketUserBlank = TicketUser.blank()
      ticketUserBlank.roleId = i.roleId
      tuListOrigin.push(ticketUserBlank)
    }
  })

  // lấy role còn thừa ra ở trong ticketUser vẫn phải hiển thị
  ticketUserListRef.forEach((i) => {
    const findExist = tuListOrigin.find((j) => j.roleId === i.roleId)
    if (findExist) {
      return // nếu đã có rồi thì bỏ qua
    } else {
      tuListOrigin.push(TicketUser.from(i))
    }
  })
  ticketUserListOrigin = tuListOrigin
  ticketUserList.value = TicketUser.fromList(tuListOrigin)
}

watch(
  () => ticketRoomRef.value.ticketProductList,
  (newValue, oldValue) => {
    ticketProductList.value = TicketProduct.fromList(newValue || [])
  },
  { immediate: true, deep: true },
)

watch(
  () => ticketRoomRef.value.ticketUserGroup,
  (newValue, oldValue) => {
    refreshTicketUserList()
  },
  { immediate: true, deep: true },
)

onMounted(async () => {
  refreshTicketUserList()
  await ticketRoomRef.value.refreshProduct()
})

const hasChangePriority = computed(() => {
  for (let index = 0; index < (ticketRoomRef.value.ticketProductList || []).length; index++) {
    const tpRoot = ticketRoomRef.value.ticketProductList![index]
    if (tpRoot.priority !== ticketProductList.value[index].priority) {
      return true
    }
  }
  return false
})

const hasChangeTicketUserList = computed(() => {
  const result = !TicketUser.equalList(
    ticketUserListOrigin.filter((i) => !!i.userId),
    ticketUserList.value.filter((i) => !!i.userId),
  )
  return result
})

const hasChangeData = computed(() => {
  if (hasChangePriority.value) {
    return true
  }
  if (hasChangeTicketUserList.value) {
    return true
  }
  return false
})

const disabledButton = computed(() => {
  if ([TicketStatus.Debt, TicketStatus.Completed].includes(ticketRoomRef.value.status)) {
    return true
  }
  return !hasChangeData.value
})

const changeItemPosition = (index: number, count: number) => {
  const temp = ticketProductList.value[index]
  ticketProductList.value[index] = ticketProductList.value[index + count]
  ticketProductList.value[index + count] = temp
}

const savePriorityTicketProduct = async () => {
  try {
    await TicketChangeProductApi.updatePriorityTicketProduct({
      ticketId: ticketRoomRef.value.id,
      ticketProductList: ticketProductList.value,
    })
  } catch (e: any) {
    console.log('🚀 ~ TicketProductContainer.vue:156 ~ savePriorityTicketProduct ~ e:', e)
  }
}

const saveTicketUserList = async () => {
  try {
    // await TicketChangeUserApi.updateTicketUserPosition({
    //   ticketId: ticketRoomRef.value.id,
    //   positionType: PositionInteractType.ConsumableList,
    //   positionInteractId: 0,
    //   ticketItemId: 0,
    //   quantity: 1,
    //   ticketUserList: Object.values(ticketUserList.value),
    // })
  } catch (e: any) {
    console.log('🚀 ~ TicketClinicPrescription.vue:184 ~ e:', e)
  }
}

const saveConsumable = async () => {
  if (hasChangePriority.value) {
    savePriorityTicketProduct()
  }
  if (hasChangeTicketUserList.value) {
    saveTicketUserList()
  }
}

const openModalProductDetail = (product?: Product) => {
  if (product) modalProductDetail.value?.openModal(product)
}

const handleAddTicketProduct = async (ticketProductAddList: TicketProduct[]) => {
  const tpListOrigin = [...ticketProductList.value]
  try {
    ticketProductList.value = [...tpListOrigin, ...ticketProductAddList]
    await TicketChangeProductApi.addTicketProductList({
      ticketId: ticketRoomRef.value.id,
      ticketProductList: ticketProductAddList,
    })
  } catch (error) {
    ticketProductList.value = tpListOrigin
    console.log('🚀 ~ TicketProductContainer.vue:193 ~ handleAddTicketProduct ~ error:', error)
  }
}
</script>
<template>
  <ModalProductDetail ref="modalProductDetail" />
  <TicketProductSelectItem @success="handleAddTicketProduct" />
  <ModalTicketProductUpdate ref="modalTicketProductUpdate" />

  <div class="mt-4">
    <div>Danh sách vật tư</div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th v-if="CONFIG.MODE === 'development'">ID-Type</th>
            <th>#</th>
            <th style="width: 32px"></th>
            <th style="width: 32px"></th>
            <th>Tên vật tư</th>
            <th>SL</th>
            <th>Đ.Vị</th>
            <th>Giá</th>
            <th>T.Tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="ticketProductList!.length === 0">
            <td colspan="20" class="text-center">Không có dữ liệu</td>
          </tr>
          <tr v-for="(tpItem, index) in ticketProductList || []" :key="tpItem.productId">
            <td class="text-center" v-if="CONFIG.MODE === 'development'" style="color: violet">
              {{ tpItem.id }} - {{ tpItem.type }}
            </td>
            <td>
              <div class="flex flex-col items-center">
                <button
                  type="button"
                  style="
                    border: none;
                    font-size: 1.2rem;
                    line-height: 0.5;
                    background: none;
                    margin-bottom: -0.5rem;
                  "
                  class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                  :disabled="index === 0 || tpItem.deliveryStatus === DeliveryStatus.Delivered"
                  @click="changeItemPosition(index, -1)"
                >
                  <IconSortUp style="opacity: 0.6" />
                </button>
                <span>{{ index + 1 }}</span>
                <button
                  type="button"
                  style="
                    border: none;
                    font-size: 1.2rem;
                    line-height: 0.5;
                    background: none;
                    margin-top: -0.5rem;
                  "
                  class="cursor-pointer disabled:cursor-not-allowed opacity-25 disabled:opacity-25 hover:opacity-100"
                  :disabled="
                    index === ticketProductList.length - 1 ||
                    tpItem.deliveryStatus === DeliveryStatus.Delivered
                  "
                  @click="changeItemPosition(index, 1)"
                >
                  <IconSortDown style="opacity: 0.6" />
                </button>
              </div>
            </td>
            <td><PaymentMoneyStatusTooltip :paymentMoneyStatus="tpItem.paymentMoneyStatus" /></td>
            <td class="text-center">
              <TicketDeliveryStatusTooltip :deliveryStatus="tpItem.deliveryStatus" />
            </td>
            <td>
              <div style="font-weight: 500">
                {{ tpItem.product?.brandName }}
                <a class="ml-1" @click="openModalProductDetail(tpItem.product!)">
                  <IconFileSearch />
                </a>
              </div>
              <div class="text-xs">{{ tpItem.product?.substance }}</div>
            </td>
            <td class="text-center">
              {{ formatMoney(tpItem.unitQuantity) }}
            </td>
            <td class="text-center whitespace-nowrap">
              {{ tpItem.unitName }}
            </td>
            <td class="text-right whitespace-nowrap">
              <div v-if="tpItem.discountMoney" class="text-xs italic text-red-500">
                <del>{{ formatMoney(tpItem.unitExpectedPrice) }}</del>
              </div>
              <div>{{ formatMoney(tpItem.unitActualPrice) }}</div>
            </td>
            <td class="text-right whitespace-nowrap">
              {{ formatMoney(tpItem.actualPrice * tpItem.quantity || 0) }}
            </td>
            <td class="text-center">
              <a v-if="!tpItem.id">
                <IconSpin width="20" height="20" />
              </a>
              <a
                v-else-if="
                  tpItem.paymentMoneyStatus !== PaymentMoneyStatus.Paid &&
                  [PaymentMoneyStatus.NoEffect, PaymentMoneyStatus.Pending].includes(
                    tpItem.paymentMoneyStatus,
                  ) &&
                  userPermission[PermissionId.TICKET_CHANGE_PRODUCT]
                "
                class="text-orange-500"
                @click="modalTicketProductUpdate?.openModal(tpItem)"
              >
                <IconEditSquare width="20" height="20" />
              </a>
            </td>
          </tr>
          <tr>
            <td v-if="CONFIG.MODE === 'development'"></td>
            <td colspan="7" class="text-right">
              <b>Tổng tiền</b>
            </td>
            <td class="text-right">
              <b>
                {{
                  formatMoney(
                    ticketProductList.reduce((acc: number, item: TicketProduct) => {
                      return (acc += item.actualPrice * item.quantity)
                    }, 0),
                  )
                }}
              </b>
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div
    v-if="organizationPermission[PermissionId.MASTER_DATA_POSITION]"
    class="mt-4 flex flex-wrap items-center gap-4"
  >
    <template v-if="ticketUserList.length">
      <div
        v-for="(ticketUser, index) in ticketUserList"
        :key="index"
        style="flex-basis: 40%; flex-grow: 1; min-width: 300px"
      >
        <div>
          {{ roleMap[ticketUser.roleId]?.name || '' }}
        </div>
        <div>
          <InputFilter
            v-model:value="ticketUserList[index].userId"
            :options="
              (userRoleMapList[ticketUser.roleId] || []).map((i) => {
                return {
                  value: userMap[i.userId]?.id || 0,
                  text: userMap[i.userId]?.fullName || '',
                  data: userMap[i.userId],
                }
              })
            "
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
  </div>

  <div class="mt-4 flex gap-4">
    <VueButton
      v-if="userPermission[PermissionId.TICKET_CHANGE_PRODUCT]"
      :disabled="disabledButton"
      color="blue"
      style="margin-left: auto"
      icon="save"
      @click="saveConsumable"
    >
      Lưu lại
    </VueButton>
  </div>
</template>

<style lang="scss" scoped></style>
